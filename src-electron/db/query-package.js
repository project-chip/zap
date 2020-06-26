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
const dbMapping = require('./db-mapping.js')

/**
 * Checks if the package with a given path exists and executes appropriate action.
 * Returns the promise that resolves the the package or null if nothing was found.
 *
 * @export
 * @param {*} db
 * @param {*} path Path of a file to check.
 */
function getPackage(db, path) {
  return dbApi
    .dbGet(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC FROM PACKAGE WHERE PATH = ?',
      [path]
    )
    .then(
      (row) =>
        new Promise((resolve, reject) => {
          resolve(dbMapping.map.package(row))
        })
    )
}

/**
 * Resolves with a CRC or null for a given path.
 *
 * @export
 * @param {*} db
 * @param {*} path
 * @returns Promise resolving with a CRC or null.
 */
function getPathCrc(db, path) {
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
 * Inserts a given path CRC type combination into the package table.
 *
 * @param {*} db
 * @param {*} path Path of the file.
 * @param {*} crc CRC of the file.
 * @returns Promise of an insertion.
 */
function insertPathCrc(db, path, crc, type, parentId = null) {
  return dbApi.dbInsert(
    db,
    'INSERT INTO PACKAGE ( PATH, CRC, TYPE, PARENT_PACKAGE_REF ) VALUES (?, ?, ?, ?)',
    [path, crc, type, parentId]
  )
}
/**
 * Inserts or updates a package. Resolves with a packageId.
 *
 * @param {*} db
 * @param {*} path
 * @param {*} crc
 * @param {*} type
 * @param {*} [parentId=null]
 * @returns Promise of an insert or update.
 */
function registerPackage(db, path, crc, type, parentId = null) {
  return getPackage(db, path).then((row) => {
    if (row == null) {
      return dbApi.dbInsert(
        db,
        'INSERT INTO PACKAGE ( PATH, CRC, TYPE, PARENT_PACKAGE_REF ) VALUES (?,?,?,?)',
        [path, crc, type, parentId]
      )
    } else {
      return Promise.resolve(row.id)
    }
  })
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
function updatePathCrc(db, path, crc) {
  return dbApi.dbInsert(db, 'UPDATE PACKAGE SET CRC = ? WHERE PATH = ?', [
    path,
    crc,
  ])
}
// exports
exports.getPackage = getPackage
exports.getPathCrc = getPathCrc
exports.insertPathCrc = insertPathCrc
exports.updatePathCrc = updatePathCrc
exports.registerPackage = registerPackage
