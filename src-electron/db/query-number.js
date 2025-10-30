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
 * This module provides queries for numbers.
 *
 * @module DB API: zcl database number access
 */

const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')
const dbCache = require('./db-cache')
const queryUtil = require('./query-util')

/**
 * Select an number matched by name.
 *
 * @param db
 * @param name
 * @param packageIds
 * @returns number or undefined
 */
async function selectNumberByName(db, packageIds, name) {
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    NUMBER.NUMBER_ID,
    NUMBER.IS_SIGNED,
    DATA_TYPE.NAME AS NAME,
    NUMBER.SIZE AS SIZE
  FROM NUMBER
  INNER JOIN DATA_TYPE ON NUMBER.NUMBER_ID = DATA_TYPE.DATA_TYPE_ID
  WHERE NAME = ? AND PACKAGE_REF IN (${dbApi.toInClause(packageIds)})`,
      [name]
    )
    .then(dbMapping.map.number)
}

/**
 * Select a number matched by name and clusterId
 *
 * @param db
 * @param name
 * @param packageIds
 * @returns number information or undefined
 */
async function selectNumberByNameAndClusterId(db, name, clusterId, packageIds) {
  let queryWithoutClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'number',
    null,
    packageIds
  )
  let queryWithClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'number',
    clusterId,
    packageIds
  )
  let res = await dbApi
    .dbAll(db, queryWithoutClusterId, [name])
    .then((rows) => rows.map(dbMapping.map.number))

  if (res && res.length == 1) {
    return res[0]
  } else {
    return dbApi
      .dbGet(db, queryWithClusterId, [name, clusterId])
      .then(dbMapping.map.number)
  }
}

/**
 * Select an number matched by id.
 *
 * @param db
 * @param name
 * @returns number or undefined
 */
async function selectNumberById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    NUMBER.NUMBER_ID,
    NUMBER.IS_SIGNED,
    DATA_TYPE.NAME AS NAME,
    NUMBER.SIZE AS SIZE
  FROM NUMBER
  INNER JOIN DATA_TYPE ON NUMBER.NUMBER_ID = DATA_TYPE.DATA_TYPE_ID
  WHERE NUMBER.NUMBER_ID = ?`,
      [id]
    )
    .then(dbMapping.map.number)
}

/**
 * Select all numbers.
 *
 * @param db
 * @param packageId
 * @returns All numbers
 */
async function selectAllNumbers(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    NUMBER.NUMBER_ID,
    NUMBER.IS_SIGNED,
    DATA_TYPE.NAME AS NAME,
    NUMBER.SIZE AS SIZE
  FROM NUMBER
  INNER JOIN DATA_TYPE ON NUMBER.NUMBER_ID = DATA_TYPE.DATA_TYPE_ID
  WHERE
    DATA_TYPE.PACKAGE_REF = ?
  ORDER BY DATA_TYPE.NAME,
    (SELECT MIN(COALESCE(CLUSTER.NAME, '')) 
      FROM DATA_TYPE_CLUSTER 
      INNER JOIN CLUSTER ON DATA_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID 
      WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = NUMBER.NUMBER_ID)`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.number))
}

exports.selectNumberByName = dbCache.cacheQuery(selectNumberByName)
exports.selectNumberByNameAndClusterId = dbCache.cacheQuery(
  selectNumberByNameAndClusterId
)
exports.selectAllNumbers = selectAllNumbers
exports.selectNumberById = selectNumberById
