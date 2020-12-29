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
const sLoad = require('./zcl-loader-silabs')
const dLoad = require('./zcl-loader-dotdot')
const queryZcl = require('../db/query-zcl.js')
const env = require('../util/env.js')
const xml2js = require('xml2js')
const _ = require('lodash')

const defaultValidator = (zclData) => {
  return []
}

/**
 * Reads the properties file into ctx.data and also calculates crc into ctx.crc
 *
 * @param {*} ctx
 * @returns Promise to populate data, filePath and crc into the context.
 */
async function readMetadataFile(ctx) {
  var data = await fsp.readFile(ctx.metadataFile, { encoding: 'utf-8' })
  ctx.data = data
  ctx.filePath = ctx.metadataFile
  return util.calculateCrc(ctx)
}

/**
 * Records the toplevel package information and puts ctx.packageId into the context.
 *
 * @param {*} ctx
 */
async function recordToplevelPackage(db, ctx) {
  var id = await queryPackage.registerTopLevelPackage(
    db,
    ctx.metadataFile,
    ctx.crc,
    dbEnum.packageType.zclProperties
  )
  ctx.packageId = id
  return ctx
}

/**
 * Records the version into the database.
 *
 * @param {*} db
 * @param {*} ctx
 */
async function recordVersion(ctx) {
  if (ctx.version != null) {
    await queryPackage.updateVersion(ctx.db, ctx.packageId, ctx.version)
  }
  return ctx
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
  var ctx = {
    metadataFile: path.resolve(metadataFile),
    db: db,
  }
  var ext = path.extname(metadataFile)
  if (ext == '.xml') {
    return dLoad.loadDotdotZcl(db, ctx)
  } else if (ext == '.properties') {
    return sLoad.loadSilabsZcl(db, ctx, false)
  } else if (ext == '.json') {
    return sLoad.loadSilabsZcl(db, ctx, true)
  } else {
    throw 'unknown properties file type'
  }
}

function loadIndividualFile(db, filePath, sessionId) {
  return queryPackage
    .getSessionPackagesByType(db, sessionId, dbEnum.packageType.zclProperties)
    .then((zclPropertiesPackages) => {
      if (zclPropertiesPackages.length == 0) {
        env.logInfo(
          `Unable to find a validator for project, skipping validator`
        )
        // Return an function that returns an empty array
        return defaultValidator
      }
      return bindValidationScript(db, zclPropertiesPackages[0].id)
    })
    .then((validator) => {
      var ext = path.extname(filePath)
      if (ext == '.xml') {
        return sLoad.loadIndividualSilabsFile(db, filePath, validator)
      } else {
        return Promise.reject('Unknown extension file')
      }
    })
}

/**
 * This function creates a validator function with signatuee fn(stringToValidateOn)
 *
 * @param {*} db
 * @param {*} basePackageId
 */
function bindValidationScript(db, basePackageId) {
  return getSchemaAndValidationScript(db, basePackageId)
    .then((data) => {
      if (
        !(dbEnum.packageType.zclSchema in data) ||
        !(dbEnum.packageType.zclValidation in data)
      ) {
        return defaultValidator
      }
      let zclSchema = data[dbEnum.packageType.zclSchema]
      let zclValidation = data[dbEnum.packageType.zclValidation]
      var module = require(zclValidation)
      let validateZclFile = module.validateZclFile

      return readZclFile(zclSchema).then((schemaFile) =>
        validateZclFile.bind(null, schemaFile)
      )
    })
    .catch((err) => {
      return defaultValidator
    })
}
/**
 * Returns an object with zclSchema and zclValidation elements.
 * @param {*} db
 * @param {*} basePackageId
 */
function getSchemaAndValidationScript(db, basePackageId) {
  var promises = []
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
  return Promise.all(promises).then((data) =>
    data.reduce((result, item) => {
      if (item.length >= 1) {
        result[item[0].type] = item[0].path
      }
      return result
    }, {})
  )
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
function qualifyZclFile(db, info, parentPackageId, packageType) {
  return new Promise((resolve, reject) => {
    var filePath = info.filePath
    var data = info.data
    var actualCrc = info.crc
    queryPackage
      .getPackageByPathAndParent(db, filePath, parentPackageId)
      .then((pkg) => {
        if (pkg == null) {
          // This is executed if there is no CRC in the database.
          env.logInfo(`No CRC in the database for file ${filePath}, parsing.`)
          return queryPackage
            .insertPathCrc(
              db,
              filePath,
              actualCrc,
              packageType,
              parentPackageId
            )
            .then((packageId) => {
              resolve({
                filePath: filePath,
                data: data,
                packageId:
                  parentPackageId == null ? packageId : parentPackageId,
              })
            })
        } else {
          // This is executed if CRC is found in the database.
          if (pkg.crc == actualCrc) {
            env.logInfo(
              `CRC match for file ${pkg.path} (${pkg.crc}), skipping parsing.`
            )
            resolve({
              error: `${pkg.path} skipped`,
            })
          } else {
            env.logInfo(
              `CRC missmatch for file ${pkg.path}, (${pkg.crc} vs ${actualCrc}) package id ${pkg.id}, parsing.`
            )
            return queryPackage
              .updatePathCrc(db, filePath, actualCrc, parentPackageId)
              .then(() => {
                resolve({
                  filePath: filePath,
                  data: data,
                  packageId:
                    parentPackageId == null ? packageId : parentPackageId,
                })
              })
          }
        }
      })
  })
}

/**
 * Promises to perform a post loading step.
 *
 * @param {*} db
 * @returns Promise to deal with the post-loading cleanup.
 */
function processZclPostLoading(db) {
  return queryZcl.updateDeviceTypeEntityReferences(db)
}

/**
 * Promises to parse the ZCL file, expecting object of { filePath, data, packageId, msg }
 *
 * @param {*} argument
 * @param {*} validator validator is a function that takes in an buffer, and returns an array of errors. This can be optional
 * @returns promise that resolves with the array [filePath,result,packageId,msg,data]
 */
function parseZclFile(argument, validator = null) {
  // No data, we skip this.
  if (!('data' in argument)) {
    return Promise.resolve(argument)
  } else {
    if (validator) {
      argument.validation = validator(argument.data)
    }
    return xml2js.parseStringPromise(argument.data).then((result) => {
      argument.result = result
      delete argument.data
      return argument
    })
  }
}

exports.loadZcl = loadZcl
exports.readMetadataFile = readMetadataFile
exports.recordToplevelPackage = recordToplevelPackage
exports.recordVersion = recordVersion
exports.processZclPostLoading = processZclPostLoading
exports.loadIndividualFile = loadIndividualFile
exports.qualifyZclFile = qualifyZclFile
exports.parseZclFile = parseZclFile
