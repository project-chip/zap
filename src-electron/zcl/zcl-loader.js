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

/**
 * Reads the properties file into ctx.data and also calculates crc into ctx.crc
 *
 * @param {*} ctx
 * @returns Promise to populate data, filePath and crc into the context.
 */
function readMetadataFile(ctx) {
  return fsp
    .readFile(ctx.metadataFile, { encoding: 'utf-8' })
    .then((data) => {
      ctx.data = data
      ctx.filePath = ctx.metadataFile
      return Promise.resolve(ctx)
    })
    .then((ctx) => util.calculateCrc(ctx))
}

/**
 * Records the toplevel package information and puts ctx.packageId into the context.
 *
 * @param {*} ctx
 */
function recordToplevelPackage(db, ctx) {
  return queryPackage
    .registerTopLevelPackage(
      db,
      ctx.metadataFile,
      ctx.crc,
      dbEnum.packageType.zclProperties
    )
    .then((id) => {
      ctx.packageId = id
      return ctx
    })
}

/**
 * Records the version into the database.
 *
 * @param {*} db
 * @param {*} ctx
 */
function recordVersion(ctx) {
  if (ctx.version == null) return Promise.resolve(ctx)
  else {
    return queryPackage
      .updateVersion(ctx.db, ctx.packageId, ctx.version)
      .then(() => ctx)
  }
}

/**
 * Toplevel function that loads the zcl file and passes it off to the correct zcl loader.
 *
 * @export
 * @param {*} db
 * @param {*} metadataFile
 * @returns a Promise that resolves with the db.
 */
function loadZcl(db, metadataFile) {
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
    return Promise.reject('unknown properties file type')
  }
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
function qualifyZclFile(db, info, parentPackageId) {
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
              dbEnum.packageType.zclXml,
              parentPackageId
            )
            .then((packageId) => {
              resolve({
                filePath: filePath,
                data: data,
                packageId: parentPackageId,
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
                  packageId: parentPackageId,
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
  return queryZcl
    .updateClusterReferencesForDeviceTypeClusters(db)
    .then((res) =>
      queryZcl.updateAttributeReferencesForDeviceTypeReferences(db)
    )
    .then((res) => queryZcl.updateCommandReferencesForDeviceTypeReferences(db))
}

/**
 * Promises to read a file and resolve with the content
 *
 * @param {*} file
 * @returns promise that resolves as readFile
 */
function readZclFile(file) {
  env.logInfo(`Reading individual file: ${file}`)
  return fsp.readFile(file)
}

exports.loadZcl = loadZcl
exports.readMetadataFile = readMetadataFile
exports.recordToplevelPackage = recordToplevelPackage
exports.recordVersion = recordVersion
exports.processZclPostLoading = processZclPostLoading
exports.readZclFile = readZclFile
exports.qualifyZclFile = qualifyZclFile
