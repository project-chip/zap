/**
 *
 *    Copyright (c) 2021 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * This module provides queries related to cluster.
 *
 * @module DB API: cluster queries.
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

/**
 * Returns a cluster name from the cluster ref
 *
 * @param db
 * @param clusterRef
 * @returns Cluster name
 */
async function selectClusterName(db, clusterRef) {
  let clusterName = await dbApi.dbAll(
    db,
    'SELECT NAME FROM CLUSTER WHERE CLUSTER_ID = ?',
    [clusterRef]
  )
  return clusterName[0].NAME
}

/**
 * All cluster details along with their attribute details per endpoint.
 * @param db
 * @param endpointsAndClusters
 * @param packageIds
 * @returns cluster details along with their attribute details per endpoint.
 */
async function selectClusterDetailsFromEnabledClusters(
  db,
  endpointsAndClusters,
  packageIds
) {
  let endpointClusterIds = endpointsAndClusters
    .map((ep) => ep.endpointClusterId)
    .toString()
  let mapFunction = (x) => {
    return {
      id: x.ATTRIBUTE_ID,
      side: x.SIDE,
      mfgCode: x.MANUFACTURER_CODE,
      clusterSide: x.CLUSTER_SIDE,
      clusterName: x.CLUSTER_NAME,
      clusterCode: x.CLUSTER_CODE,
      attributeSize: x.ATOMIC_SIZE,
      clusterIndex: x.CLUSTER_INDEX,
      endpointIndex: x.ENDPOINT_INDEX,
      attributeCount: x.ATTRIBUTE_COUNT,
      attributesSize: x.ATTRIBUTES_SIZE,
      endpointTypeId: x.ENDPOINT_TYPE_ID,
      endpointIdentifier: x.ENDPOINT_IDENTIFIER,
      mfgClusterCount: x.MANUFACTURING_SPECIFIC_CLUSTER_COUNT,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    *,
    COUNT(MANUFACTURER_CODE) OVER () AS MANUFACTURING_SPECIFIC_CLUSTER_COUNT FROM (
  SELECT
    ATTRIBUTE.ATTRIBUTE_ID AS ATTRIBUTE_ID,
    ATTRIBUTE.SIDE AS SIDE,
    CLUSTER.MANUFACTURER_CODE AS MANUFACTURER_CODE,
    ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
    CLUSTER.NAME AS CLUSTER_NAME,
    CLUSTER.CODE AS CLUSTER_CODE,
    CASE
      WHEN ATOMIC.IS_STRING=1 THEN 
        CASE WHEN ATOMIC.IS_LONG=0 THEN ATTRIBUTE.MAX_LENGTH+1
             WHEN ATOMIC.IS_LONG=1 THEN ATTRIBUTE.MAX_LENGTH+2
             ELSE ATOMIC.ATOMIC_SIZE
             END
        WHEN ATOMIC.ATOMIC_SIZE IS NULL THEN ATTRIBUTE.MAX_LENGTH
        ELSE ATOMIC.ATOMIC_SIZE
    END AS ATOMIC_SIZE,
    ROW_NUMBER() OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.MANUFACTURER_CODE, CLUSTER.CODE, ENDPOINT_TYPE_CLUSTER.SIDE) CLUSTER_INDEX,
    ROW_NUMBER() OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER ORDER BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.MANUFACTURER_CODE, CLUSTER.CODE, ENDPOINT_TYPE_CLUSTER.SIDE) ENDPOINT_INDEX,
    COUNT(ATTRIBUTE.CODE) OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.MANUFACTURER_CODE, CLUSTER.CODE, ENDPOINT_TYPE_CLUSTER.SIDE) ATTRIBUTE_COUNT,
    SUM(CASE
          WHEN
            (ENDPOINT_TYPE_ATTRIBUTE.SINGLETON != 1 AND ENDPOINT_TYPE_ATTRIBUTE.STORAGE_OPTION != "External")
          THEN
            (CASE
              WHEN
                ATOMIC.IS_STRING=1
              THEN 
                CASE
                  WHEN
                    ATOMIC.IS_LONG=0
                  THEN
                    ATTRIBUTE.MAX_LENGTH+1
                  WHEN
                    ATOMIC.IS_LONG=1
                  THEN
                  ATTRIBUTE.MAX_LENGTH+2
                ELSE
                  ATOMIC.ATOMIC_SIZE
                END
              WHEN
                ATOMIC.ATOMIC_SIZE IS NULL
              THEN
                ATTRIBUTE.MAX_LENGTH
              ELSE
                ATOMIC.ATOMIC_SIZE
            END)
          ELSE
            0
        END) OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.MANUFACTURER_CODE, CLUSTER.CODE, ENDPOINT_TYPE_CLUSTER.SIDE) ATTRIBUTES_SIZE,
    ENDPOINT_TYPE.ENDPOINT_TYPE_ID AS ENDPOINT_TYPE_ID,
    ENDPOINT.ENDPOINT_IDENTIFIER AS ENDPOINT_IDENTIFIER
  FROM
    ATTRIBUTE
  INNER JOIN
    ENDPOINT_TYPE_ATTRIBUTE
  ON
    ATTRIBUTE.ATTRIBUTE_ID = ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF
  INNER JOIN
    ENDPOINT_TYPE_CLUSTER
  ON
    ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN
    CLUSTER
  ON
    ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
  INNER JOIN
    ATOMIC
  ON
    ATOMIC.NAME = ATTRIBUTE.TYPE
  INNER JOIN
    ENDPOINT_TYPE
  ON
    ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
  INNER JOIN
    ENDPOINT
  ON
    ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
  WHERE
    ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF IN (${endpointClusterIds})
    AND ENDPOINT_TYPE_CLUSTER.ENABLED = 1
    AND ENDPOINT_TYPE_ATTRIBUTE.INCLUDED = 1
    AND ENDPOINT_TYPE_CLUSTER.SIDE = ATTRIBUTE.SIDE
    AND ATTRIBUTE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
  GROUP BY
    ENDPOINT.ENDPOINT_IDENTIFIER,
    CLUSTER.NAME,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    ATTRIBUTE.NAME )
WHERE
  CLUSTER_INDEX = 1
ORDER BY
  ENDPOINT_IDENTIFIER, CLUSTER_CODE, CLUSTER_SIDE
        `
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageIds
 * @param {*} options
 * @returns All token attribute clusters across endpoints. Clusters can be
 * filtered based on the singleton/non-singleton attributes.
 */
async function selectAllUserClustersWithTokenAttributes(
  db,
  sessionId,
  packageIds,
  options
) {
  let singletonQuery =
    'isSingleton' in options.hash
      ? `AND ENDPOINT_TYPE_ATTRIBUTE.SINGLETON=${options.hash.isSingleton}`
      : ``

  let rows = await dbApi.dbAll(
    db,
    `
  SELECT
    CLUSTER.NAME,
    CLUSTER.CODE,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    COUNT() OVER (PARTITION BY ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF) AS TOKEN_ATTRIBUTES_COUNT
  FROM
    ENDPOINT_TYPE_ATTRIBUTE
  INNER JOIN
    ENDPOINT_TYPE_CLUSTER
  ON 
    ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN
    ENDPOINT_TYPE
  ON
    ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
  INNER JOIN
    CLUSTER
  ON
    ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    ENDPOINT_TYPE.SESSION_REF = ?
  AND
    ENDPOINT_TYPE_CLUSTER.ENABLED=1
  AND
    CLUSTER.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
  ${singletonQuery}
  AND
    ENDPOINT_TYPE_ATTRIBUTE.STORAGE_OPTION='NVM'
  AND
    ENDPOINT_TYPE_ATTRIBUTE.INCLUDED=1
  GROUP BY
    CLUSTER.CODE, CLUSTER.MANUFACTURER_CODE
    `,
    sessionId
  )

  return rows.map(dbMapping.map.endpointTypeClusterExtended)
}

/**
 *
 * @param {*} db
 * @param {*} packageIds
 * @param {*} endpointTypeRef
 * @param {*} options
 * @returns Clusters which have token attributes based on the endpoint type
 * reference given. Can also filter the clusters based on singleton and
 * non-singlton attributes.
 */
async function selectTokenAttributeClustersForEndpoint(
  db,
  packageIds,
  endpointTypeRef,
  options
) {
  let singletonQuery =
    'isSingleton' in options.hash
      ? `AND ENDPOINT_TYPE_ATTRIBUTE.SINGLETON=${options.hash.isSingleton}`
      : ``

  let rows = await dbApi.dbAll(
    db,
    `
  SELECT
    CLUSTER.NAME AS NAME,
    CLUSTER.DEFINE,
    CLUSTER.MANUFACTURER_CODE AS CLUSTER_MANUFACTURER_CODE,
    CLUSTER.CODE,
    CLUSTER.API_MATURITY
  FROM
    ENDPOINT_TYPE_ATTRIBUTE
  INNER JOIN
    ENDPOINT_TYPE_CLUSTER
  ON
    ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN
    CLUSTER
  ON
    ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF = ?
  AND
    ENDPOINT_TYPE_ATTRIBUTE.INCLUDED = 1
  AND
    ENDPOINT_TYPE_CLUSTER.ENABLED = 1
  AND
    ENDPOINT_TYPE_ATTRIBUTE.STORAGE_OPTION = 'NVM'
  AND
    CLUSTER.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
  ${singletonQuery}
  GROUP BY
    CLUSTER.CODE, CLUSTER.MANUFACTURER_CODE
    `,
    endpointTypeRef
  )
  return rows.map(dbMapping.map.cluster)
}

exports.selectClusterName = selectClusterName
exports.selectClusterDetailsFromEnabledClusters =
  selectClusterDetailsFromEnabledClusters
exports.selectAllUserClustersWithTokenAttributes =
  selectAllUserClustersWithTokenAttributes
exports.selectTokenAttributeClustersForEndpoint =
  selectTokenAttributeClustersForEndpoint
