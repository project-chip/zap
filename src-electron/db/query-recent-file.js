/**
 *
 *    Copyright (c) 2026 Silicon Labs
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
 * This module provides queries for the RECENT_FILE table.
 *
 * @module DB API: recent file queries.
 */

const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

/**
 * Inserts a recent file row, replacing an existing row with the same path.
 *
 * @export
 * @param {*} db
 * @param {string} filePath absolute path of the .zap file
 * @param {number} lastUsed timestamp in milliseconds
 * @returns A promise that resolves with the row id.
 */
async function insertOrReplaceRecentFile(db, filePath, lastUsed) {
  return dbApi.dbInsert(
    db,
    'INSERT OR REPLACE INTO RECENT_FILE (PATH, LAST_USED) VALUES (?,?)',
    [filePath, lastUsed]
  )
}

/**
 * Returns recent files used at or after the cutoff, newest first.
 *
 * @export
 * @param {*} db
 * @param {number} cutoff timestamp in milliseconds
 * @returns A promise that resolves with an array of objects containing 'path' and 'lastUsed'.
 */
async function selectRecentFiles(db, cutoff) {
  let rows = await dbApi.dbAll(
    db,
    'SELECT PATH, LAST_USED FROM RECENT_FILE WHERE LAST_USED >= ? ORDER BY LAST_USED DESC',
    [cutoff]
  )
  return rows.map(dbMapping.map.recentFile)
}

/**
 * Deletes one recent file row by path.
 *
 * @export
 * @param {*} db
 * @param {string} filePath
 * @returns A promise that resolves with the number of rows removed.
 */
async function deleteRecentFile(db, filePath) {
  return dbApi.dbRemove(db, 'DELETE FROM RECENT_FILE WHERE PATH = ?', [
    filePath
  ])
}

/**
 * Deletes recent file rows last used before the cutoff.
 *
 * @export
 * @param {*} db
 * @param {number} cutoff timestamp in milliseconds
 * @returns A promise that resolves with the number of rows removed.
 */
async function deleteRecentFilesBefore(db, cutoff) {
  return dbApi.dbRemove(db, 'DELETE FROM RECENT_FILE WHERE LAST_USED < ?', [
    cutoff
  ])
}

exports.insertOrReplaceRecentFile = insertOrReplaceRecentFile
exports.selectRecentFiles = selectRecentFiles
exports.deleteRecentFile = deleteRecentFile
exports.deleteRecentFilesBefore = deleteRecentFilesBefore
