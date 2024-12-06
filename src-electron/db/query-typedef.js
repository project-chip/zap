/**
 *
 *    Copyright (c) 2024 Silicon Labs
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
 * This module provides queries for typedefs.
 *
 * @module DB API: zcl database typedef access
 */

const dbApi = require('./db-api')
const dbCache = require('./db-cache')
const dbMapping = require('./db-mapping')
const queryUtil = require('./query-util')

/**
 * Retrieves all the typedefs in the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @returns Promise that resolves with the rows of typedefs.
 */
async function selectAllTypedefs(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  T.TYPEDEF_ID,
  DATA_TYPE.NAME,
  DATA_TYPE.DISCRIMINATOR_REF,
  (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = T.TYPEDEF_ID) AS TYPEDEF_CLUSTER_COUNT,
  (SELECT DATA_TYPE.NAME FROM DATA_TYPE WHERE DATA_TYPE.DATA_TYPE_ID = T.DATA_TYPE_REF) AS TYPE,
  T.DATA_TYPE_REF as TYPE_ID
FROM
  TYPEDEF AS T
INNER JOIN DATA_TYPE ON
  T.TYPEDEF_ID = DATA_TYPE.DATA_TYPE_ID
WHERE
  DATA_TYPE.PACKAGE_REF = ?
ORDER BY DATA_TYPE.NAME`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.typedef))
}

/**
 * Retrieves all the typedefs with cluster references in the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} clusterId
 * @returns Promise that resolves with the rows of typedefs.
 */
async function selectClusterTypedefs(db, packageIds, clusterId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  T.TYPEDEF_ID,
  DT.NAME,
  (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = T.TYPEDEF_ID) AS TYPEDEF_CLUSTER_COUNT,
  (SELECT DATA_TYPE.NAME FROM DATA_TYPE WHERE DATA_TYPE.DATA_TYPE_ID = T.DATA_TYPE_REF) AS TYPE,
  T.DATA_TYPE_REF as TYPE_ID
FROM
  TYPEDEF AS T
INNER JOIN
  DATA_TYPE AS DT
ON
  DT.DATA_TYPE_ID = T.TYPEDEF_ID
INNER JOIN
  DATA_TYPE_CLUSTER
ON
  DT.DATA_TYPE_ID = DATA_TYPE_CLUSTER.DATA_TYPE_REF
WHERE
  DT.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
  AND DATA_TYPE_CLUSTER.CLUSTER_REF = ?
ORDER BY DT.NAME`,
      [clusterId]
    )
    .then((rows) => rows.map(dbMapping.map.typedef))
}

/**
 * Select a typedef matched by its primary key.
 * @param {*} db
 * @param {*} id
 * @returns an typedef or underfined if not found
 */
async function selectTypedefById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  T.TYPEDEF_ID,
  DATA_TYPE.NAME,
  (SELECT DATA_TYPE.NAME FROM DATA_TYPE WHERE DATA_TYPE.DATA_TYPE_ID = T.DATA_TYPE_REF) AS TYPE,
  T.DATA_TYPE_REF as TYPE_ID
FROM
  TYPEDEF AS T
INNER JOIN
  DATA_TYPE
ON
  T.TYPEDEF_ID = DATA_TYPE.DATA_TYPE_ID
WHERE
  TYPEDEF_ID = ?`,
      [id]
    )
    .then(dbMapping.map.typedef)
}

/**
 * Select a typedef matched by name.
 *
 * @param {*} db
 * @param {*} name
 * @param {*} packageIds
 * @param {*} clusterName
 * @returns typedef or undefined
 */
async function selectTypedefByName(db, name, packageIds, clusterName = null) {
  let clusterJoinQuery = ''
  let clusterWhereQuery = ''
  if (clusterName) {
    clusterJoinQuery = `
    INNER JOIN
      DATA_TYPE_CLUSTER
    ON
      DATA_TYPE_CLUSTER.DATA_TYPE_REF = DT.DATA_TYPE_ID
    INNER JOIN
      CLUSTER
    ON
      DATA_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
      `
    clusterWhereQuery = `
    AND
      CLUSTER.NAME = "${clusterName}"
      `
  }
  return dbApi
    .dbGet(
      db,
      `
SELECT
  T.TYPEDEF_ID,
  DT.NAME AS NAME,
  (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = T.TYPEDEF_ID) AS TYPEDEF_CLUSTER_COUNT,
  (SELECT DATA_TYPE.NAME FROM DATA_TYPE WHERE DATA_TYPE.DATA_TYPE_ID = T.DATA_TYPE_REF) AS TYPE,
  T.DATA_TYPE_REF as TYPE_ID
FROM
  TYPEDEF AS T
INNER JOIN
  DATA_TYPE AS DT
ON
  T.TYPEDEF_ID = DT.DATA_TYPE_ID
  ${clusterJoinQuery}
WHERE
  (DT.NAME = ? OR DT.NAME = ?) AND DT.PACKAGE_REF IN (${dbApi.toInClause(
    packageIds
  )})
  ${clusterWhereQuery}
ORDER BY NAME`,
      [name, name.toLowerCase()]
    )
    .then(dbMapping.map.typedef)
}

/**
 * Select a typedef matched by name and clusterId.
 *
 * @param {*} db
 * @param {*} name
 * @param {*} clusterId
 * @param {*} packageIds
 * @returns typedef information or undefined
 */
async function selectTypedefByNameAndClusterId(
  db,
  name,
  clusterId,
  packageIds
) {
  let queryWithoutClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'typedef',
    null,
    packageIds
  )
  let queryWithClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'typedef',
    clusterId,
    packageIds
  )
  let res = await dbApi
    .dbAll(db, queryWithoutClusterId, [name, name.toLowerCase()])
    .then((rows) => rows.map(dbMapping.map.typedef))

  if (res && res.length == 1) {
    return res[0]
  } else {
    return dbApi
      .dbGet(db, queryWithClusterId, [name, name.toLowerCase(), clusterId])
      .then(dbMapping.map.typedef)
  }
}

// exports
exports.selectAllTypedefs = selectAllTypedefs
exports.selectTypedefByName = dbCache.cacheQuery(selectTypedefByName)
exports.selectTypedefByNameAndClusterId = dbCache.cacheQuery(
  selectTypedefByNameAndClusterId
)
exports.selectTypedefById = selectTypedefById
exports.selectClusterTypedefs = selectClusterTypedefs
