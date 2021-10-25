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
const dbMapping = require('./db-mapping')
const dbCache = require('./db-cache')

/**
 * Retrieves all the bitmaps in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of bitmaps.
 */
async function selectAllBitmaps(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  BITMAP_ID,
  NAME,
  TYPE
FROM BITMAP
WHERE PACKAGE_REF = ? ORDER BY NAME`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.bitmap))
}

async function selectBitmapByName(db, packageId, name) {
  return dbApi
    .dbGet(
      db,
      'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE NAME = ? AND PACKAGE_REF = ? ',
      [name, packageId]
    )
    .then(dbMapping.map.bitmap)
}

async function selectBitmapById(db, id) {
  return dbApi
    .dbGet(db, 'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE BITMAP_ID = ?', [
      id,
    ])
    .then(dbMapping.map.bitmap)
}

exports.selectBitmapById = selectBitmapById
exports.selectAllBitmaps = selectAllBitmaps
exports.selectBitmapByName = selectBitmapByName
