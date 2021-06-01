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
 * This module provides queries related to commands.
 *
 * @module DB API: command queries.
 */
const dbApi = require('./db-api.js')

/**
 * Returns the count of the number of cluster commands with cli for a cluster
 * @param {*} db
 * @param {*} endpointTypes
 * @param {*} endpointClusterId
 */
async function selectCliCommandCountFromEndpointTypeCluster(
  db,
  endpointTypes,
  endpointClusterId
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let res = await dbApi.dbAll(
    db,
    `
SELECT
  COUNT(*) AS COUNT
FROM
  COMMAND
INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN PACKAGE_OPTION
  ON PACKAGE_OPTION.OPTION_CODE = COMMAND.NAME
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
  AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ?
        `,
    [endpointClusterId]
  )
  return res[0].COUNT
}

/**
 *
 * @param db
 * @param endpointClusterId
 * Returns: A promise with all commands with cli for a given cluster id
 */
async function selectCliCommandsFromCluster(db, endpointClusterId) {
  let mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      source: x.SOURCE,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND.NAME,
  COMMAND.CODE,
  COMMAND.MANUFACTURER_CODE,
  COMMAND.SOURCE
FROM
  COMMAND
INNER JOIN
  CLUSTER
ON
  COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN
  PACKAGE_OPTION
ON
  PACKAGE_OPTION.OPTION_CODE = COMMAND.NAME
WHERE CLUSTER.CLUSTER_ID = ?`,
      [endpointClusterId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * All available cluster command detals across all endpoints and clusters.
 * @param db
 * @param endpointTypes
 * @returns Available Cluster command detals across given endpoints and clusters.
 * Note: The relationship between the endpoint_type_cluster being enabled and a
 * endpoint_type_command is indirect. The reason for this being the endpoint
 * type command is not precisely linked to the sides of the cluster as commands
 * do not belong to a side of a cluster like an attribute.
 */
async function selectAllAvailableClusterCommandDetailsFromEndpointTypes(
  db,
  endpointTypes
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let mapFunction = (x) => {
    return {
      id: x.CLUSTER_ID,
      clusterName: x.CLUSTER_NAME,
      clusterCode: x.CLUSTER_CODE,
      clusterDefine: x.CLUSTER_DEFINE,
      commandMfgCode: x.COMMAND_MANUFACTURER_CODE,
      clusterSide: x.CLUSTER_SIDE,
      clusterEnabled: x.CLUSTER_ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      numberOfClusterSidesEnabled: x.NO_OF_CLUSTER_SIDES_ENABLED,
      commandName: x.COMMAND_NAME,
      commandSource: x.COMMAND_SOURCE,
      commandCode: x.COMMAND_CODE,
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
      mfgCommandCount: x.MANUFACTURING_SPECIFIC_COMMAND_COUNT,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT * FROM (
SELECT
  CLUSTER.CLUSTER_ID,
  CLUSTER.NAME AS CLUSTER_NAME,
  CLUSTER.CODE AS CLUSTER_CODE,
  CLUSTER.DEFINE AS CLUSTER_DEFINE,
  COMMAND.MANUFACTURER_CODE AS COMMAND_MANUFACTURER_CODE,
  ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
  ENDPOINT_TYPE_CLUSTER.ENABLED AS CLUSTER_ENABLED,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  COUNT(*) OVER (PARTITION BY CLUSTER.NAME, COMMAND.NAME) AS NO_OF_CLUSTER_SIDES_ENABLED,
  COMMAND.NAME AS COMMAND_NAME,
  COMMAND.SOURCE AS COMMAND_SOURCE,
  COMMAND.CODE AS COMMAND_CODE,
  ENDPOINT_TYPE_COMMAND.INCOMING AS INCOMING,
  ENDPOINT_TYPE_COMMAND.OUTGOING AS OUTGOING,
  COUNT(COMMAND.MANUFACTURER_CODE) OVER () AS MANUFACTURING_SPECIFIC_COMMAND_COUNT
FROM COMMAND
INNER JOIN ENDPOINT_TYPE_COMMAND
ON ENDPOINT_TYPE_COMMAND.COMMAND_REF = COMMAND.COMMAND_ID
INNER JOIN CLUSTER
ON CLUSTER.CLUSTER_ID = COMMAND.CLUSTER_REF
INNER JOIN ENDPOINT_TYPE_CLUSTER
ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
AND ENDPOINT_TYPE_CLUSTER.SIDE IN ("client", "server") AND ENDPOINT_TYPE_CLUSTER.ENABLED=1
AND (
      (ENDPOINT_TYPE_COMMAND.INCOMING=1 AND COMMAND.SOURCE!=ENDPOINT_TYPE_CLUSTER.SIDE) OR
      (ENDPOINT_TYPE_COMMAND.OUTGOING=1 AND COMMAND.SOURCE=ENDPOINT_TYPE_CLUSTER.SIDE)
    )
GROUP BY CLUSTER.NAME, COMMAND.NAME, ENDPOINT_TYPE_CLUSTER.SIDE ) GROUP BY CLUSTER_NAME, COMMAND_NAME ORDER BY CLUSTER_NAME, COMMAND_NAME`
    )
    .then((rows) => rows.map(mapFunction))
}

exports.selectCliCommandCountFromEndpointTypeCluster = selectCliCommandCountFromEndpointTypeCluster
exports.selectCliCommandsFromCluster = selectCliCommandsFromCluster
exports.selectAllAvailableClusterCommandDetailsFromEndpointTypes = selectAllAvailableClusterCommandDetailsFromEndpointTypes
