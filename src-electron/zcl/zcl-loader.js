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

const fs = require('fs')
const path = require('path')
const queryPackage = require('../db/query-package.js')
const util = require('../util/util.js')
const dbEnum = require('../../src-shared/db-enum.js')
const fsp = fs.promises
const sLoad = require('./zcl-loader-silabs.js')
const dLoad = require('./zcl-loader-dotdot.js')
const queryZcl = require('../db/query-zcl.js')
const env = require('../util/env.js')
const _ = require('lodash')

const defaultValidator = (zclData) => {
  return []
}

/**
 * Reads the properties file and returns object containing
 * 'data', 'filePath' and 'crc'
 *
 * @param {*} metadata file
 * @returns Promise to populate data, filePath and crc into the context.
 */
async function readMetadataFile(metadataFile) {
  let content = await fsp.readFile(metadataFile, { encoding: 'utf-8' })
  return {
    data: content,
    filePath: metadataFile,
    crc: util.checksum(content),
  }
}

/**
 * Records the toplevel package information and resolves into packageId
 * @param {*} db
 * @param {*} metadataFile
 * @param {*} crc
 * @returns packageId
 */
async function recordToplevelPackage(db, metadataFile, crc) {
  return queryPackage.registerTopLevelPackage(
    db,
    metadataFile,
    crc,
    dbEnum.packageType.zclProperties
  )
}

/**
 * Records the version into the database.
 *
 * @param {*} db
 * @param {*} ctx
 */
async function recordVersion(db, packageId, version) {
  return queryPackage.updateVersion(db, packageId, version)
}

/**
 * Toplevel function that loads the zcl file and passes it off to the correct zcl loader.
 *
 * @export
 * @param {*} db
 * @param {*} metadataFile
 * @returns a Promise that resolves with the db.
 */
async function loadZcl(db, metadataFile) {
  let ext = path.extname(metadataFile)
  let resolvedMetafile = path.resolve(metadataFile)
  if (ext == '.xml') {
    return dLoad.loadDotdotZcl(db, resolvedMetafile)
  } else if (ext == '.properties') {
    return sLoad.loadSilabsZcl(db, resolvedMetafile, false)
  } else if (ext == '.json') {
    return sLoad.loadSilabsZcl(db, resolvedMetafile, true)
  } else {
    throw new Error(`Unknown zcl metafile type: ${metadataFile}`)
  }
}

async function loadIndividualFile(db, filePath, sessionId) {
  let zclPropertiesPackages = await queryPackage.getSessionPackagesByType(
    db,
    sessionId,
    dbEnum.packageType.zclProperties
  )

  let validator
  if (zclPropertiesPackages.length == 0) {
    env.logDebug(`Unable to find a validator for project, skipping validator`)
    // Return an function that returns an empty array
    validator = defaultValidator
  } else {
    validator = await bindValidationScript(db, zclPropertiesPackages[0].id)
  }

  let ext = path.extname(filePath)
  if (ext == '.xml') {
    return sLoad.loadIndividualSilabsFile(db, filePath, validator)
  } else {
    return Promise.reject('Unknown extension file')
  }
}

/**
 * This function creates a validator function with signatuee fn(stringToValidateOn)
 *
 * @param {*} db
 * @param {*} basePackageId
 */
async function bindValidationScript(db, basePackageId) {
  try {
    let data = await getSchemaAndValidationScript(db, basePackageId)

    if (
      !(dbEnum.packageType.zclSchema in data) ||
      !(dbEnum.packageType.zclValidation in data)
    ) {
      return defaultValidator
    } else {
      let zclSchema = data[dbEnum.packageType.zclSchema]
      let zclValidation = data[dbEnum.packageType.zclValidation]
      let module = require(zclValidation)
      let validateZclFile = module.validateZclFile

      env.logDebug(`Reading individual file: ${zclSchema}`)
      let schemaFileContent = await fsp.readFile(zclSchema)
      return validateZclFile.bind(null, schemaFileContent)
    }
  } catch (err) {
    env.logError(`Error loading package specific validator: ${err}`)
    return defaultValidator
  }
}

/**
 * Returns an object with zclSchema and zclValidation elements.
 * @param {*} db
 * @param {*} basePackageId
 */
async function getSchemaAndValidationScript(db, basePackageId) {
  let promises = []
  promises.push(
    queryPackage.getPackagesByParentAndType(
      db,
      basePackageId,
      dbEnum.packageType.zclSchema
    )
  )
  promises.push(
    queryPackage.getPackagesByParentAndType(
      db,
      basePackageId,
      dbEnum.packageType.zclValidation
    )
  )
  let data = await Promise.all(promises)
  return data.reduce((result, item) => {
    if (item.length >= 1) {
      result[item[0].type] = item[0].path
    }
    return result
  }, {})
}

/**
 * Promises to qualify whether zcl file needs to be reloaded.
 * If yes, the it will resolve with {filePath, data, packageId}
 * If not, then it will resolve with {error}
 *
 * @param {*} db
 * @param {*} info
 * @param {*} parentPackageId
 * @returns Promise that resolves int he object of data.
 */
async function qualifyZclFile(
  db,
  info,
  parentPackageId,
  packageType,
  isCustom
) {
  let filePath = info.filePath
  let data = info.data
  let actualCrc = info.crc

  let pkg = await queryPackage.getPackageByPathAndParent(
    db,
    filePath,
    parentPackageId,
    isCustom
  )

  if (pkg == null) {
    // This is executed if there is no CRC in the database.
    env.logDebug(`No CRC in the database for file ${filePath}, parsing.`)
    let packageId = await queryPackage.insertPathCrc(
      db,
      filePath,
      actualCrc,
      packageType,
      parentPackageId,
      filePath
    )
    return {
      filePath: filePath,
      data: data,
      packageId: parentPackageId == null ? packageId : parentPackageId,
    }
  } else {
    // This is executed if CRC is found in the database.
    if (pkg.crc == actualCrc) {
      env.logDebug(
        `CRC match for file ${pkg.path} (${pkg.crc}), skipping parsing.`
      )
      return {
        error: `${pkg.path} skipped`,
        packageId: pkg.id,
      }
    } else {
      env.logDebug(
        `CRC missmatch for file ${pkg.path}, (${pkg.crc} vs ${actualCrc}) package id ${pkg.id}, parsing.`
      )
      await queryPackage.updatePathCrc(db, filePath, actualCrc, parentPackageId)
      return {
        filePath: filePath,
        data: data,
        packageId: parentPackageId == null ? packageId : parentPackageId,
      }
    }
  }
}

/**
 * Promises to perform a post loading step.
 *
 * @param {*} db
 * @returns Promise to deal with the post-loading cleanup.
 */
async function processZclPostLoading(db) {
  await queryZcl.updateDeviceTypeEntityReferences(db)
  return queryZcl.updateCommandRequestResponseReferences(db)
}

exports.loadZcl = loadZcl
exports.readMetadataFile = readMetadataFile
exports.recordToplevelPackage = recordToplevelPackage
exports.recordVersion = recordVersion
exports.processZclPostLoading = processZclPostLoading
exports.loadIndividualFile = loadIndividualFile
exports.qualifyZclFile = qualifyZclFile
