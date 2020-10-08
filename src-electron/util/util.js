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

const fs = require('fs')
const env = require('./env.js')
const crc = require('crc')
const path = require('path')
const queryPackage = require('../db/query-package.js')
const queryConfig = require(`../db/query-config.js`)
const dbEnum = require('../../src-shared/db-enum.js')
const args = require('./args.js')
const { query } = require('express')
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
        rows.forEach((p) => {
          if (path.resolve(args.zclPropertiesFile) === p.path) {
            packageId = p.id
          }
        })
        env.logWarning(
          `Multiple toplevel zcl.properties found. Using the first one from args: ${packageId}`
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
        rows.forEach((p) => {
          if (path.resolve(args.genTemplateJsonFile) === p.path) {
            packageId = p.id
          }
        })
        env.logWarning(
          `Multiple toplevel  gen-templates.json found. Using the one from args: ${packageId}`
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

  return Promise.all(promises)
    .then(() =>
      queryPackage.getSessionPackageIds(db, sessionId).then((packageIds) => {
        var p = packageIds.map((packageId) => {
          return queryPackage
            .selectAllDefaultOptions(db, packageId)
            .then((optionDefaultsArray) => {
              return Promise.all(
                optionDefaultsArray.map((optionDefault) => {
                  return queryPackage
                    .selectOptionValueByOptionDefaultId(
                      db,
                      optionDefault.optionRef
                    )
                    .then((option) => {
                      return queryConfig.insertKeyValue(
                        db,
                        sessionId,
                        option.optionCategory,
                        option.optionCode
                      )
                    })
                })
              )
            })
        })
        return Promise.all(p)
      })
    )
    .then(() => sessionId)
}

/**
 * Move database file out of the way into the backup location.
 *
 * @param {*} path
 */
function createBackupFile(path) {
  var pathBak = path + '~'
  if (fs.existsSync(path)) {
    if (fs.existsSync(pathBak)) {
      env.logWarning(`Deleting old backup file: ${pathBak}`)
      fs.unlinkSync(pathBak)
    }
    env.logWarning(`Creating backup file: ${path} to ${pathBak}`)
    fs.renameSync(path, pathBak)
  }
}

function getSessionKeyFromSessionCookie(cookieValue) {
  let ret = cookieValue
  if (ret.startsWith('s%3A')) ret = ret.substring(4)
  if (ret.includes('.')) ret = ret.split('.')[0]
  return ret
}

/**
 * Returns a promise that resolves into the session key.
 * @param {*} browserWindow
 */
function getSessionKeyFromBrowserWindow(browserWindow) {
  return browserWindow.webContents.session.cookies
    .get({ name: 'connect.sid' })
    .then((cookies) => {
      if (cookies.length == 0) throw 'Could not find session key'
      else return getSessionKeyFromSessionCookie(cookies[0].value)
    })
}

exports.createBackupFile = createBackupFile
exports.calculateCrc = calculateCrc
exports.initializeSessionPackage = initializeSessionPackage
exports.getSessionKeyFromBrowserWindow = getSessionKeyFromBrowserWindow
