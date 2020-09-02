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
 * @module JS API: random utilities
 */

const env = require('./env.js')
const crc = require('crc')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')
/**
 * Promises to calculate the CRC of the file, and resolve with an object { filePath, data, actualCrc }
 *
 * @param {*} context that contains 'filePath' and 'data' keys for the file and contents of the file.
 * @returns Promise that resolves with the same object, just adds the 'crc' key into it.
 */
function calculateCrc(context) {
  return new Promise((resolve, reject) => {
    context.crc = crc.crc32(context.data)
    env.logInfo(`For file: ${context.filePath}, got CRC: ${context.crc}`)
    resolve(context)
  })
}

/**
 * This function assigns a proper package ID to the session.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise that resolves with the session id for chaining.
 */
function initializeSessionPackage(db, sessionId) {
  var promises = []

  // 1. Associate a zclProperties file.
  var zclPropertiesPromise = queryPackage
    .getPackagesByType(db, dbEnum.packageType.zclProperties)
    .then((rows) => {
      var packageId
      if (rows.length == 1) {
        packageId = rows[0].id
        env.logInfo(
          `Single zcl.properties found, using it for the session: ${packageId}`
        )
      } else if (rows.length == 0) {
        env.logError(`No zcl.properties found for session.`)
        packageId = null
      } else {
        packageId = rows[0].id
        env.logWarning(
          `Multiple toplevel zcl.properties found. Using the first one: ${packageId}`
        )
      }
      if (packageId != null) {
        return queryPackage
          .insertSessionPackage(db, sessionId, packageId)
          .then(() => sessionId)
      } else {
        return sessionId
      }
    })
  promises.push(zclPropertiesPromise)

  // 2. Associate a gen template file
  var genTemplateJsonPromise = queryPackage
    .getPackagesByType(db, dbEnum.packageType.genTemplatesJson)
    .then((rows) => {
      var packageId
      if (rows.length == 1) {
        packageId = rows[0].id
        env.logInfo(
          `Single gen-templates.json found, using it for the session: ${packageId}`
        )
      } else if (rows.length == 0) {
        env.logError(`No  gen-templates.json found for session.`)
        packageId = null
      } else {
        packageId = rows[0].id
        env.logWarning(
          `Multiple toplevel  gen-templates.json found. Using the first one: ${packageId}`
        )
      }
      if (packageId != null) {
        return queryPackage
          .insertSessionPackage(db, sessionId, packageId)
          .then(() => sessionId)
      } else {
        return sessionId
      }
    })
  promises.push(genTemplateJsonPromise)

  return Promise.all(promises).then(() => sessionId)
}

exports.calculateCrc = calculateCrc
exports.initializeSessionPackage = initializeSessionPackage
