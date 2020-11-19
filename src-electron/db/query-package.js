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
const dbEnum = require('../../src-shared/db-enum.js')

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
 * Get packages that have a given parent.
 *
 * @param {*} db
 * @param {*} parentId
 * @returns promise that resolves into an array of packages.
 */
function getPackageByParent(db, parentId) {
  return dbApi
    .dbAll(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE PARENT_PACKAGE_REF = ?',
      [parentId]
    )
    .then((rows) => rows.map(dbMapping.map.package))
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
    .then((rows) => rows.map(dbMapping.map.package))
}

/**
 * Returns packages of a given type and parent.
 *
 * @param {*} db
 * @param {*} type
 * @returns A promise that resolves into the rows array of packages.
 */
function getPackagesByParentAndType(db, parentId, type) {
  return dbApi
    .dbAll(
      db,
      'SELECT PACKAGE_ID, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE TYPE = ? AND PARENT_PACKAGE_REF = ?',
      [type, parentId]
    )
    .then((rows) => rows.map(dbMapping.map.package))
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
      'SELECT PACKAGE_ID, PARENT_PACKAGE_REF, PATH, TYPE, CRC, VERSION FROM PACKAGE WHERE PACKAGE_ID = ?',
      [packageId]
    )
    .then(dbMapping.map.package)
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
function insertPathCrc(db, path, crc, type, parentId = null, version = null) {
  return dbApi.dbInsert(
    db,
    'INSERT INTO PACKAGE ( PATH, CRC, TYPE, PARENT_PACKAGE_REF, VERSION ) VALUES (?, ?, ?, ?, ?)',
    [path, crc, type, parentId, version]
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
function registerTopLevelPackage(db, path, crc, type, version = null) {
  return getPackageByPathAndType(db, path, type).then((row) => {
    if (row == null) {
      return dbApi.dbInsert(
        db,
        'INSERT INTO PACKAGE ( PATH, CRC, TYPE, PARENT_PACKAGE_REF, VERSION ) VALUES (?,?,?,?,?)',
        [path, crc, type, null, version]
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
    'INSERT OR REPLACE INTO SESSION_PACKAGE (SESSION_REF, PACKAGE_REF) VALUES (?,?)',
    [sessionId, packageId]
  )
}

/**
 * Returns session packages of a given type.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageType
 * @returns Promise that resolves into array of retrieve packages.
 */
function getSessionPackagesByType(db, sessionId, packageType) {
  return dbApi
    .dbAll(
      db,
      `
SELECT 
  PACKAGE.PACKAGE_ID,
  PACKAGE.PATH,
  PACKAGE.TYPE,
  PACKAGE.CRC,
  PACKAGE.VERSION
FROM PACKAGE
INNER JOIN SESSION_PACKAGE
  ON PACKAGE.PACKAGE_ID = SESSION_PACKAGE.PACKAGE_REF
WHERE SESSION_PACKAGE.SESSION_REF = ? 
  AND PACKAGE.TYPE = ?`,
      [sessionId, packageType]
    )
    .then((rows) => rows.map(dbMapping.map.package))
}

/**
 * Returns session generation template packages.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise that resolves into array of retrieve packages.
 */
function getSessionGenTemplates(db, sessionId) {
  return dbApi
    .dbAll(
      db,
      `
      SELECT 
      PACKAGE.PACKAGE_ID,
      PACKAGE.PATH,
      PACKAGE.TYPE,
      PACKAGE.CRC,
      PACKAGE.VERSION
    FROM PACKAGE
    WHERE 
    PACKAGE.TYPE = ? AND
    PACKAGE.PARENT_PACKAGE_REF = 
    (SELECT 
      PACKAGE.PACKAGE_ID
    FROM PACKAGE
    INNER JOIN SESSION_PACKAGE
      ON PACKAGE.PACKAGE_ID = SESSION_PACKAGE.PACKAGE_REF
    WHERE SESSION_PACKAGE.SESSION_REF = ? 
      AND PACKAGE.TYPE = ?)
      ORDER BY PACKAGE.PATH ASC`,
      [
        dbEnum.packageType.genSingleTemplate,
        sessionId,
        dbEnum.packageType.genTemplatesJson,
      ]
    )
    .then((rows) => rows.map(dbMapping.map.package))
}

/**
 * Resolves into an array of IDs that are the packageIds that all the ZCL queries should resolve into.
 * @param {*} db
 * @param {*} sessionId
 */
function getSessionZclPackageIds(db, sessionId) {
  var inList = `('${dbEnum.packageType.zclProperties}', '${dbEnum.packageType.zclXmlStandalone}')`
  return dbApi
    .dbAll(
      db,
      `
SELECT 
  SP.PACKAGE_REF
FROM 
  SESSION_PACKAGE AS SP
INNER JOIN 
  PACKAGE AS P
ON 
  SP.PACKAGE_REF = P.PACKAGE_ID
WHERE
  SP.SESSION_REF = ? AND P.TYPE IN ${inList}
`,
      [sessionId]
    )
    .then((rows) => rows.map((r) => r.PACKAGE_REF))
}

/**
 * Returns the session package IDs.
 * @param {*} db
 * @param {*} sessionId
 * @returns The promise that resolves into an array of package IDs.
 */
function getSessionPackageIds(db, sessionId) {
  return dbApi
    .dbAll(
      db,
      'SELECT PACKAGE_REF FROM SESSION_PACKAGE WHERE SESSION_REF = ?',
      [sessionId]
    )
    .then((rows) => rows.map((r) => r.PACKAGE_REF))
}

/**
 * This function inserts an option and its values into the DB.
 *
 * @param {*} db
 * @param {*} packageId - Package Reference
 * @param {*} optionCategory - The name of the option.
 * @param {*} optionCodeLabels - The array of values associated with this option.
 */
function insertOptionsKeyValues(
  db,
  packageId,
  optionCategory,
  optionCodeLabels
) {
  return dbApi.dbMultiInsert(
    db,
    `INSERT INTO PACKAGE_OPTION
        (PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE, OPTION_LABEL) 
       VALUES 
        (?, ?, ?, ?)
       ON CONFLICT
        (PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE)
       DO NOTHING`,
    optionCodeLabels.map((optionValue) => {
      return [packageId, optionCategory, optionValue.code, optionValue.label]
    })
  )
}

/**
 * This function returns all options associated with a specific category.
 * @param {*} db
 * @param {*} packageId
 * @param {*} optionCategory
 * @returns promise to return option that matches arguments.
 */
function selectAllOptionsValues(db, packageId, optionCategory) {
  return dbApi
    .dbAll(
      db,
      `SELECT OPTION_ID, PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE, OPTION_LABEL FROM PACKAGE_OPTION WHERE PACKAGE_REF = ? AND OPTION_CATEGORY = ?`,
      [packageId, optionCategory]
    )
    .then((rows) => rows.map(dbMapping.map.options))
}

/**
 *
 * This function returns option associated with a specific category and code.
 * @param {*} db
 * @param {*} packageId
 * @param {*} optionCategory
 * @param {*} optionCode
 * @returns promise to return option that matches arguments.
 */
function selectSpecificOptionValue(db, packageId, optionCategory, optionCode) {
  return dbApi
    .dbGet(
      db,
      `SELECT OPTION_ID, PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE, OPTION_LABEL FROM PACKAGE_OPTION WHERE PACKAGE_REF = ? AND OPTION_CATEGORY = ? AND OPTION_CODE = ?`,
      [packageId, optionCategory, optionCode]
    )
    .then(dbMapping.map.options)
}

/**
 * This function returns a specific option value given an option reference.
 * @param {*} db
 * @param {*} optionDefaultId
 */
function selectOptionValueByOptionDefaultId(db, optionDefaultId) {
  return dbApi
    .dbGet(
      db,
      `SELECT OPTION_ID, PACKAGE_REF, OPTION_CATEGORY, OPTION_CODE, OPTION_LABEL FROM PACKAGE_OPTION WHERE OPTION_ID = ?`,
      [optionDefaultId]
    )
    .then(dbMapping.map.options)
}

/**
 * Returns a promise of an insertion of option value.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} optionCategory
 * @param {*} optionRef
 * @returns promise to insert option value
 */
function insertDefaultOptionValue(db, packageId, optionCategory, optionRef) {
  return dbApi.dbInsert(
    db,
    'INSERT INTO PACKAGE_OPTION_DEFAULT ( PACKAGE_REF, OPTION_CATEGORY, OPTION_REF) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
    [packageId, optionCategory, optionRef]
  )
}

/**
 * Returns a promise for all option values.
 * @param {*} db
 * @param {*} packageId
 */
function selectAllDefaultOptions(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `SELECT OPTION_DEFAULT_ID, PACKAGE_REF, OPTION_CATEGORY, OPTION_REF FROM PACKAGE_OPTION_DEFAULT WHERE PACKAGE_REF = ?`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.optionDefaults))
}

/**
 * Inserts an array of extension default values to a specific extension ID.
 *
 * @param {*} db
 * @param {*} packageExtensionId
 * @param {*} defaultArray Array containing objects with 'entityCode', 'parentCode', 'value'
 * @returns Promise of insertion for defaults.
 */
function insertPackageExtensionDefault(db, packageExtensionId, defaultArray) {
  return dbApi.dbMultiInsert(
    db,
    `
INSERT INTO PACKAGE_EXTENSION_DEFAULT
  (PACKAGE_EXTENSION_REF, ENTITY_CODE, PARENT_CODE, VALUE)
VALUES
  ( ?, ?, ?, ?)
ON CONFLICT DO NOTHING
    `,
    defaultArray.map((d) => {
      return [packageExtensionId, d.entityCode, d.parentCode, d.value]
    })
  )
}

/**
 * Returns a promise of insertion of package extension
 *
 * @param {*} db
 * @param {*} packageId
 * @param propertyArray. Array of objects that contain property, type, configurability, label, globalDefault
 * @param defaultsArrayOfArrays For each item in propertyArray, it contains array of default rows, or null.
 */
function insertPackageExtension(
  db,
  packageId,
  entity,
  propertyArray,
  defaultsArrayOfArrays
) {
  return dbApi
    .dbMultiInsert(
      db,
      `
INSERT INTO PACKAGE_EXTENSION 
  (PACKAGE_REF, ENTITY, PROPERTY, TYPE, CONFIGURABILITY, LABEL, GLOBAL_DEFAULT) 
VALUES 
  (?, ?, ?, ?, ?, ?, ?)
ON CONFLICT DO NOTHING`,
      propertyArray.map((p) => {
        return [
          packageId,
          entity,
          p.property,
          p.type,
          p.configurability,
          p.label,
          p.globalDefault,
        ]
      })
    )
    .then((rowIds) => {
      var promises = []
      // now, for each rowId in this list, we populate corresponding defaults
      if (rowIds.length == defaultsArrayOfArrays.length) {
        for (var i = 0; i < rowIds.length; i++) {
          var rowId = rowIds[i]
          var defaultsArray = defaultsArrayOfArrays[i]
          if (defaultsArray != null) {
            promises.push(
              insertPackageExtensionDefault(db, rowId, defaultsArray)
            )
          }
        }
      }
      return Promise.all(promises)
    })
}

/**
 * Select extensions for a given entity type for a package.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} entity
 * @returns promise that resolve into an array of packageExtensions for a given entity
 */
function selectPackageExtension(db, packageId, entity) {
  var acc = []
  return dbApi
    .dbAll(
      db,
      `
SELECT
  PE.ENTITY,
  PE.PROPERTY,
  PE.TYPE,
  PE.CONFIGURABILITY,
  PE.LABEL,
  PE.GLOBAL_DEFAULT,
  PED.ENTITY_CODE,
  PED.PARENT_CODE,
  PED.VALUE
FROM 
  PACKAGE_EXTENSION AS PE
LEFT OUTER JOIN
  PACKAGE_EXTENSION_DEFAULT AS PED
ON
  PE.PACKAGE_EXTENSION_ID = PED.PACKAGE_EXTENSION_REF
WHERE
  PE.PACKAGE_REF = ?
  AND PE.ENTITY = ?
ORDER BY
  PE.PROPERTY, PED.PARENT_CODE, PED.ENTITY_CODE`,
      [packageId, entity]
    )
    .then((rows) =>
      rows.reduce((a, x) => {
        var newPropRequired
        if (a.length == 0 || a[a.length - 1].property != x.PROPERTY) {
          newPropRequired = true
        } else {
          newPropRequired = false
        }

        var prop
        if (newPropRequired) {
          prop = dbMapping.map.packageExtension(x)
          prop.defaults = []
          a.push(prop)
        } else {
          prop = a[a.length - 1]
        }

        if (x.ENTITY_CODE != null) {
          prop.defaults.push(dbMapping.map.packageExtensionDefault(x))
        }
        return a
      }, acc)
    )
}

// exports
exports.getPackageByPathAndParent = getPackageByPathAndParent
exports.getPackageByPackageId = getPackageByPackageId
exports.getPackagesByType = getPackagesByType
exports.getPackageByParent = getPackageByParent
exports.getPackageIdByPathAndTypeAndVersion = getPackageIdByPathAndTypeAndVersion

exports.getPathCrc = getPathCrc
exports.insertPathCrc = insertPathCrc
exports.updatePathCrc = updatePathCrc
exports.registerTopLevelPackage = registerTopLevelPackage
exports.updateVersion = updateVersion
exports.insertSessionPackage = insertSessionPackage
exports.getSessionPackageIds = getSessionPackageIds
exports.insertOptionsKeyValues = insertOptionsKeyValues
exports.selectAllOptionsValues = selectAllOptionsValues
exports.selectSpecificOptionValue = selectSpecificOptionValue
exports.insertDefaultOptionValue = insertDefaultOptionValue
exports.getSessionPackagesByType = getSessionPackagesByType
exports.getSessionGenTemplates = getSessionGenTemplates
exports.selectAllDefaultOptions = selectAllDefaultOptions
exports.selectOptionValueByOptionDefaultId = selectOptionValueByOptionDefaultId
exports.getPackagesByParentAndType = getPackagesByParentAndType
exports.getSessionZclPackageIds = getSessionZclPackageIds
exports.insertPackageExtension = insertPackageExtension
exports.selectPackageExtension = selectPackageExtension
