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
 * Retrieves all the bitmaps in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of bitmaps.
 */
async function selectAllBitmaps(db, packageId) {
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  BITMAP.BITMAP_ID,
  DATA_TYPE.NAME,
  DATA_TYPE.DISCRIMINATOR_REF,
  (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = BITMAP.BITMAP_ID) AS BITMAP_CLUSTER_COUNT,
  BITMAP.SIZE
FROM BITMAP
INNER JOIN DATA_TYPE ON
  BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID
WHERE PACKAGE_REF = ? ORDER BY NAME`,
    [packageId]
  )
  return rows.map(dbMapping.map.bitmap)
}

/**
 * Get bitmap by name from the given package IDs.
 * @param {*} db
 * @param {*} packageIds
 * @param {*} name
 * @returns promise of bitmap
 */
async function selectBitmapByName(db, packageIds, name) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  BITMAP.BITMAP_ID,
  DATA_TYPE.NAME AS NAME,
  (SELECT COUNT(1) FROM DATA_TYPE_CLUSTER WHERE DATA_TYPE_CLUSTER.DATA_TYPE_REF = BITMAP.BITMAP_ID) AS BITMAP_CLUSTER_COUNT,
  BITMAP.SIZE AS SIZE
FROM BITMAP
INNER JOIN DATA_TYPE ON BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID
WHERE (DATA_TYPE.NAME = ? OR DATA_TYPE.NAME = ?) AND DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(
        packageIds
      )})`,
      [name, name.toLowerCase()]
    )
    .then(dbMapping.map.bitmap)
}

/**
 * Select a bitmap matched by name and clusterId.
 * @param {*} db
 * @param {*} name
 * @param {*} clusterId
 * @param {*} packageIds
 * @returns bitmap information or undefined
 */
async function selectBitmapByNameAndClusterId(db, name, clusterId, packageIds) {
  let queryWithoutClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'bitmap',
    null,
    packageIds
  )
  let queryWithClusterId = queryUtil.sqlQueryForDataTypeByNameAndClusterId(
    'bitmap',
    clusterId,
    packageIds
  )

  let res = await dbApi
    .dbAll(db, queryWithoutClusterId, [name, name.toLowerCase()])
    .then((rows) => rows.map(dbMapping.map.bitmap))

  if (res && res.length == 1) {
    return res[0]
  } else {
    return dbApi
      .dbGet(db, queryWithClusterId, [name, name.toLowerCase(), clusterId])
      .then(dbMapping.map.bitmap)
  }
}

/**
 * Get Bitmap information by Bitmap ID.
 * @param {*} db
 * @param {*} id
 * @returns Promise of bitmap
 */
async function selectBitmapById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  BITMAP.BITMAP_ID,
  DATA_TYPE.NAME AS NAME,
  BITMAP.SIZE
FROM BITMAP
INNER JOIN DATA_TYPE ON BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID
WHERE BITMAP_ID = ?`,
      [id]
    )
    .then(dbMapping.map.bitmap)
}

exports.selectBitmapById = selectBitmapById
exports.selectAllBitmaps = selectAllBitmaps
exports.selectBitmapByName = dbCache.cacheQuery(selectBitmapByName)
exports.selectBitmapByNameAndClusterId = dbCache.cacheQuery(
  selectBitmapByNameAndClusterId
)
