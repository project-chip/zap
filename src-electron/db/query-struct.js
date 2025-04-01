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
 * This module provides queries for enums.
 *
 * @module DB API: zcl database access
 */

const dbApi = require('./db-api')
const dbCache = require('./db-cache')
const dbMapping = require('./db-mapping')
const queryUtil = require('./query-util')

/**
 * Get all structs from a given package ID.
 * @param {*} db
 * @param {*} packageId
 * @returns Promise of Structs
 */
async function selectAllStructs(db, packageId) {
  let rows = await dbApi.dbAll(
    db,
    `
  SELECT
    STRUCT.STRUCT_ID,
    STRUCT.API_MATURITY,
    DATA_TYPE.NAME,
    DATA_TYPE.DISCRIMINATOR_REF
  FROM
    STRUCT
  INNER JOIN
    DATA_TYPE
  ON
    STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
  WHERE
    PACKAGE_REF = ?
  ORDER BY
    NAME`,
    [packageId]
  )
  return rows.map(dbMapping.map.struct)
}

/**
 * Get struct details from the given struct ID.
 * @param {*} db
 * @param {*} id
 * @returns Promise of Struct
 */
async function selectStructById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
SELECT 
  STRUCT.STRUCT_ID,
  STRUCT.IS_FABRIC_SCOPED,
  STRUCT.API_MATURITY,
  DATA_TYPE.NAME,
  DATA_TYPE.DISCRIMINATOR_REF
FROM
  STRUCT
INNER JOIN
    DATA_TYPE
ON
  STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
WHERE
  STRUCT_ID = ?`,
      [id]
    )
    .then(dbMapping.map.struct)
}

/**
 * Get Struct details from the given struct name and package IDs.
 *
 * @param {*} db
 * @param {*} name
 * @param {*} packageIds
 * @returns Promise of Struct
 */
async function selectStructByName(db, name, packageIds) {
  //STRUCT_COUNT counts the structs where there could be one global and one cluster specific with same name.
  return dbApi
    .dbGet(
      db,
      `
SELECT
  STRUCT.STRUCT_ID,
  STRUCT.IS_FABRIC_SCOPED,
  STRUCT.API_MATURITY,
  DATA_TYPE.NAME,
  (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = STRUCT.STRUCT_ID) AS STRUCT_CLUSTER_COUNT,
  (SELECT COUNT(1) FROM STRUCT INNER JOIN DATA_TYPE ON STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID WHERE DATA_TYPE.NAME = "${name}" AND PACKAGE_REF IN (${dbApi.toInClause(packageIds)})) AS STRUCT_COUNT,
  DATA_TYPE.DISCRIMINATOR_REF
FROM
  STRUCT
INNER JOIN
  DATA_TYPE ON STRUCT.STRUCT_ID = DATA_TYPE.DATA_TYPE_ID
WHERE
  NAME = ?
  AND PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
ORDER BY
  NAME`,
      [name]
    )
    .then(dbMapping.map.struct)
}

/**
 * Select a struct matched by name and clusterId
 * @param {*} db
 * @param {*} name
 * @param {*} clusterId
 * @param {*} packageIds
 * @returns struct information or undefined
 */
async function selectStructByNameAndClusterId(db, name, clusterId, packageIds) {
  let queryWithoutClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'struct',
    null,
    packageIds
  )
  let queryWithClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'struct',
    clusterId,
    packageIds
  )
  let res = await dbApi
    .dbAll(db, queryWithoutClusterId, [name])
    .then((rows) => rows.map(dbMapping.map.struct))

  if (res && res.length == 1) {
    return res[0]
  } else {
    return dbApi
      .dbGet(db, queryWithClusterId, [name, clusterId])
      .then(dbMapping.map.struct)
  }
}

/**
 * Get all structs which have a cluster associated with them. If a struct is
 * present in more than one cluster then it can be grouped by struct name to
 * avoid additional rows.
 * @param {*} db
 * @param {*} packageIds
 * @param {*} groupByStructName
 * @returns structs which have an association with clusters
 */
async function selectStructsWithClusterAssociation(
  db,
  packageIds,
  groupByStructName
) {
  let groupByClause = groupByStructName ? `GROUP BY DT.NAME` : ``
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  S.STRUCT_ID AS STRUCT_ID,
  S.IS_FABRIC_SCOPED AS IS_FABRIC_SCOPED,
  S.API_MATURITY AS API_MATURITY,
  DT.NAME AS NAME,
  (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = S.STRUCT_ID) AS STRUCT_CLUSTER_COUNT,
  CLUSTER.NAME AS CLUSTER_NAME
FROM
  STRUCT AS S
INNER JOIN
  DATA_TYPE AS DT
ON
  S.STRUCT_ID = DT.DATA_TYPE_ID
INNER JOIN
  DATA_TYPE_CLUSTER AS DTC
ON
  DT.DATA_TYPE_ID = DTC.DATA_TYPE_REF
INNER JOIN
  CLUSTER
ON
  DTC.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE
  DT.PACKAGE_REF IN (${dbApi.toInClause(packageIds)}) ` +
      groupByClause +
      ` ORDER BY
  DT.NAME`
  )
  return rows.map(dbMapping.map.struct)
}

exports.selectStructById = selectStructById
exports.selectAllStructs = selectAllStructs
exports.selectStructByName = dbCache.cacheQuery(selectStructByName)
exports.selectStructByNameAndClusterId = dbCache.cacheQuery(
  selectStructByNameAndClusterId
)
exports.selectStructsWithClusterAssociation =
  selectStructsWithClusterAssociation
