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
function getPackageByPathAndParent(db, path, parentId) {
  return dbApi
    .dbGet(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE PATH = ? AND PARENT_PACKAGE_REF = ?',
      [path, parentId]
    )
    .then((row) => dbMapping.map.package(row))
}

/**
 * Returns the package by path and type.
 *
 * @param {*} db
 * @param {*} path
 * @param {*} type
 * @returns Promise of a query.
 */
function getPackageByPathAndType(db, path, type) {
  return dbApi
    .dbGet(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE PATH = ? AND TYPE = ?',
      [path, type]
    )
    .then((row) => dbMapping.map.package(row))
}

/**
 * Returns the package ID by path and type and version.
 *
 * @param {*} db
 * @param {*} path
 * @param {*} type
 * @param {*} version
 * @returns Promise of a query.
 */
function getPackageIdByPathAndTypeAndVersion(db, path, type, version) {
  return dbApi
    .dbGet(
      db,
      'SELECT PACKAGE_ID FROM PACKAGE WHERE PATH = ? AND TYPE = ? AND VERSION = ?',
      [path, type, version]
    )
    .then((row) => {
      if (row == null) return null
      else return row.PACKAGE_ID
    })
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
    .then((row) => dbMapping.map.package(row))
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
function registerTopLevelPackage(db, path, crc, type) {
  return getPackageByPathAndType(db, path, type).then((row) => {
    if (row == null) {
      return dbApi.dbInsert(
        db,
        'INSERT INTO PACKAGE ( PATH, CRC, TYPE, PARENT_PACKAGE_REF ) VALUES (?,?,?,?)',
        [path, crc, type, null]
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
function updatePathCrc(db, path, crc, parentId) {
  return dbApi.dbUpdate(
    db,
    'UPDATE PACKAGE SET CRC = ? WHERE PATH = ? AND PARENT_PACKAGE_REF = ?',
    [path, crc, parentId]
  )
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

/**
 * Returns the session package IDs.
 * @param {*} db
 * @param {*} sessionId
 * @returns The promise that resolves into an array of package IDs.
 */
function getSessionPackages(db, sessionId) {
  return dbApi
    .dbAll(
      db,
      'SELECT PACKAGE_REF FROM SESSION_PACKAGE WHERE SESSION_REF = ?',
      [sessionId]
    )
    .then((rows) => rows.map((r) => r.PACKAGE_REF))
}

/**
 * This function is a wrapper function that executes a desired function and argument over the various packageIds
 * that exist in the session.
 *
 * The signature of queryFunction should be the following
 * (db, arg1, arg2, ... argN, packageId)
 *
 * extraArgumentsArray should only contain [arg1, arg2, ... argN].
 * You must NOT pass in packageId or db into this argument array. This function handles that.
 *
 *
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} queryFunction that returns a promise for an array.
 * @param {*} extraArgumentsArray
 * @returns A promise that resolves to a one-depth flattened array of whatever the queryFunction returns.
 */
function callPackageSpecificFunctionOverSessionPackages(
  db,
  sessionId,
  queryFunction,
  extraArgumentsArray,
  mergeFunction = (accumulated, currentValue) => {
    return [accumulated, currentValue].flat(1)
  }
) {
  return getSessionPackages(db, sessionId)
    .then((packageIdArray) =>
      packageIdArray.map((packageId) =>
        queryFunction.apply(
          null,
          [db].concat(extraArgumentsArray).concat(packageId)
        )
      )
    )
    .then((arrayOfQueryPromises) => {
      return Promise.resolve(
        Promise.all(arrayOfQueryPromises).then((dataArray) =>
          dataArray.reduce(mergeFunction, [])
        )
      )
    })
}

/**
 * This function inserts an option and its values into the DB.
 *
 * @param {*} db
 * @param {*} packageId - Package Reference
 * @param {*} optionName - The name of the option.
 * @param {*} optionValues - The array of values associated with this option.
 */
function insertOptionsKeyValues(db, packageId, optionKey, optionValues) {
  return dbApi
    .dbMultiInsert(
      db,
      `INSERT INTO OPTIONS 
        (PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE, OPTION_LABEL) 
       VALUES 
        (?, ?, ?, ?)
       ON CONFLICT
        (PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE)
       DO UPDATE SET OPTION_CATEGORY = OPTION_CATEGORY`,
      optionValues.map((optionValue) => {
        return [packageId, optionKey, optionValue.code, optionValue.label]
      })
    )
    .catch()
}

/**
 * This function returns all options assocaited with a specific key.
 * @param {*} db
 * @param {*} packageId
 * @param {*} optionKey
 */
function selectAllOptionsValues(db, packageId, optionCategory) {
  return dbApi
    .dbAll(
      db,
      `SELECT OPTION_ID, PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE, OPTION_LABEL FROM OPTIONS WHERE PACKAGE_REF = ? AND OPTION_CATEGORY = ?`,
      [packageId, optionCategory]
    )
    .then((rows) => rows.map(dbMapping.map.options))
}

// exports
exports.getPackageByPathAndParent = getPackageByPathAndParent
exports.getPackageByPackageId = getPackageByPackageId
exports.getPackagesByType = getPackagesByType
exports.getPathCrc = getPathCrc
exports.insertPathCrc = insertPathCrc
exports.updatePathCrc = updatePathCrc
exports.registerTopLevelPackage = registerTopLevelPackage
exports.updateVersion = updateVersion
exports.insertSessionPackage = insertSessionPackage
exports.getSessionPackages = getSessionPackages
exports.callPackageSpecificFunctionOverSessionPackages = callPackageSpecificFunctionOverSessionPackages
exports.getPackageIdByPathAndTypeAndVersion = getPackageIdByPathAndTypeAndVersion
exports.insertOptionsKeyValues = insertOptionsKeyValues
exports.selectAllOptionsValues = selectAllOptionsValues
