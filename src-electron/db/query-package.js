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
 * This module provides queries related to packages.
 *
 * @module DB API: package-based queries.
 */
const dbApi = require('./db-api.js')

/**
 * Checks if the package with a given path exists and executes appropriate action.
 *
 * @export
 * @param {*} db
 * @param {*} path Path of a file to check.
 * @param {*} crcCallback This callback is executed if the row exists, with arguments (CRC, PACKAGE_ID)
 * @param {*} noneCallback This callback is executed if the row does not exist.
 */
export function forPathCrc(db, path, crcCallback, noneCallback) {
  dbApi
    .dbGet(db, 'SELECT PACKAGE_ID, PATH, CRC FROM PACKAGE WHERE PATH = ?', [
      path,
    ])
    .then((row) => {
      if (row == null) {
        noneCallback()
      } else {
        crcCallback(row.CRC, row.PACKAGE_ID)
      }
    })
}

/**
 * Resolves with a CRC or null for a given path.
 *
 * @export
 * @param {*} db
 * @param {*} path
 * @returns Promise resolving with a CRC or null.
 */
export function getPathCrc(db, path) {
  return dbApi.dbGet(db, 'SELECT CRC FROM PACKAGE WHERE PATH = ?', [path]).then(
    (row) =>
      new Promise((resolve, reject) => {
        if (row == null) {
          resolve(null)
        } else {
          resolve(row.CRC)
        }
      })
  )
}

/**
 * Inserts a given path CRC combination into the table.
 *
 * @param {*} db
 * @param {*} path Path of the file.
 * @param {*} crc CRC of the file.
 * @returns Promise of an insertion.
 */
export function insertPathCrc(db, path, crc) {
  return dbApi.dbInsert(db, 'INSERT INTO PACKAGE ( PATH, CRC ) VALUES (?, ?)', [
    path,
    crc,
  ])
}

/**
 * Updates a CRC in the table.
 *
 * @export
 * @param {*} db
 * @param {*} path
 * @param {*} crc
 * @returns Promise of an update.
 */
export function updatePathCrc(db, path, crc) {
  return dbApi.dbInsert(db, 'UPDATE PACKAGE SET CRC = ? WHERE PATH = ?', [
    path,
    crc,
  ])
}
