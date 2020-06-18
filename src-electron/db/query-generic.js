/**
 *
 *    Copyright (c) 2020 Silicon Labs
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
 * This module provides generic queries.
 *
 * @module DB API: generic queries against the database.
 */
const dbApi = require('./db-api.js')

/**
 * Simple query that returns number of rows in a given table.
 *
 * @export
 * @param {*} db
 * @param {*} table
 * @returns a promise that resolves into the count of the rows in the table.
 */
function selectCountFrom(db, table) {
  return dbApi
    .dbGet(db, `SELECT COUNT(*) FROM ${table}`)
    .then((x) => x['COUNT(*)'])
}

/**
 * Writes the saved location of the file.
 *
 * @export
 * @param {*} db
 * @param {*} filePath
 * @param {*} category
 */
function insertFileLocation(db, filePath, category) {
  return dbApi.dbInsert(
    db,
    'INSERT OR REPLACE INTO FILE_LOCATION (CATEGORY, FILE_PATH, ACCESS_TIME) VALUES (?,?,?)',
    [category, filePath, Date.now()]
  )
}

/**
 * Retrieves the saved location from a file
 *
 * @export
 * @param {*} db
 * @param {*} category
 */
function selectFileLocation(db, category) {
  return dbApi
    .dbGet(db, 'SELECT FILE_PATH FROM FILE_LOCATION WHERE CATEGORY = ?', [
      category,
    ])
    .then((row) => {
      if (row == null) {
        return ''
      } else {
        return row.FILE_PATH
      }
    })
}
// exports
exports.selectCountFrom = selectCountFrom
exports.insertFileLocation = insertFileLocation
exports.selectFileLocation = selectFileLocation
