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
function getPackageByPath(db, path) {
  return dbApi
    .dbGet(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE PATH = ?',
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
 * Returns packages of a given type.
 *
 * @param {*} db
 * @param {*} type
 * @returns A promise that resolves into the rows array of packages.
 */
function getPackagesByType(db, type) {
  return dbApi
    .dbAll(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE TYPE = ?',
      [type]
    )
    .then((rows) => rows.map((row) => dbMapping.map.package(row)))
}

/**
 * Checks if the package with a given path exists and executes appropriate action.
 * Returns the promise that resolves the the package or null if nothing was found.
 *
 * @export
 * @param {*} db
 * @param {*} path Path of a file to check.
 */
function getPackageByPackageId(db, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE PACKAGE_ID = ?',
      [packageId]
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
 * Updates the version inside the package.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} version
 * @returns A promise of an updated version.
 */
function updateVersion(db, packageId, version) {
  return dbApi.dbUpdate(
    db,
    'UPDATE PACKAGE SET VERSION = ? WHERE PACKAGE_ID = ?',
    [version, packageId]
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
  return getPackageByPath(db, path).then((row) => {
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
  return dbApi.dbUpdate(db, 'UPDATE PACKAGE SET CRC = ? WHERE PATH = ?', [
    path,
    crc,
  ])
}

/**
 * Inserts a mapping between session and package.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageId
 * @returns Promise of an insert.
 */
function insertSessionPackage(db, sessionId, packageId) {
  return dbApi.dbInsert(
    db,
    'INSERT INTO SESSION_PACKAGE (SESSION_REF, PACKAGE_REF) VALUES (?,?)',
    [sessionId, packageId]
  )
}

// exports
exports.getPackageByPath = getPackageByPath
exports.getPackageByPackageId = getPackageByPackageId
exports.getPackagesByType = getPackagesByType
exports.getPathCrc = getPathCrc
exports.insertPathCrc = insertPathCrc
exports.updatePathCrc = updatePathCrc
exports.registerPackage = registerPackage
exports.updateVersion = updateVersion
exports.insertSessionPackage = insertSessionPackage
