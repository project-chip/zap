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

const os = require('os')
const fs = require('fs')
const env = require('./env.js')
const crc = require('crc')
const path = require('path')
const childProcess = require('child_process')
const queryPackage = require('../db/query-package.js')
const queryEndpoint = require('../db/query-endpoint.js')
const querySession = require('../db/query-session.js')
const dbEnum = require('../../src-shared/db-enum.js')
const { v4: uuidv4 } = require('uuid')

/**
 * Promises to calculate the CRC of the file, and resolve with an object { filePath, data, actualCrc }
 *
 * @param {*} context that contains 'filePath' and 'data' keys for the file and contents of the file.
 * @returns Promise that resolves with the same object, just adds the 'crc' key into it.
 */
function calculateCrc(context) {
  context.crc = crc.crc32(context.data)
  return context
}

/**
 * This function assigns a proper package ID to the session.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} metafiles: object containing 'zcl' and 'template'
 * @returns Promise that resolves with the packages array.
 */
async function initializeSessionPackage(db, sessionId, metafiles) {
  let promises = []

  // 1. Associate a zclProperties file.
  let zclPropertiesPromise = queryPackage
    .getPackagesByType(db, dbEnum.packageType.zclProperties)
    .then((rows) => {
      let packageId
      if (rows.length == 1) {
        packageId = rows[0].id
        env.logDebug(
          `Single zcl.properties found, using it for the session: ${packageId}`
        )
      } else if (rows.length == 0) {
        env.logError(`No zcl.properties found for session.`)
        packageId = null
      } else {
        rows.forEach((p) => {
          if (path.resolve(metafiles.zcl) === p.path) {
            packageId = p.id
          }
        })
        env.logWarning(
          `Multiple toplevel zcl.properties found. Using the first one from args: ${packageId}`
        )
      }
      if (packageId != null) {
        return queryPackage.insertSessionPackage(db, sessionId, packageId, true)
      }
    })
  promises.push(zclPropertiesPromise)

  // 2. Associate a gen template file
  let genTemplateJsonPromise = queryPackage
    .getPackagesByType(db, dbEnum.packageType.genTemplatesJson)
    .then((rows) => {
      let packageId
      if (rows.length == 1) {
        packageId = rows[0].id
        env.logDebug(
          `Single generation template metafile found, using it for the session: ${packageId}`
        )
      } else if (rows.length == 0) {
        env.logInfo(`No generation template metafile found for session.`)
        packageId = null
      } else {
        rows.forEach((p) => {
          if (
            metafiles.template != null &&
            path.resolve(metafiles.template) === p.path
          ) {
            packageId = p.id
          }
        })
        if (packageId != null) {
          env.logWarning(
            `Multiple toplevel generation template metafiles found. Using the one from args: ${packageId}`
          )
        } else {
          packageId = rows[0].id
          env.logWarning(
            `Multiple toplevel generation template metafiles found. Using the first one.`
          )
        }
      }
      if (packageId != null) {
        return queryPackage.insertSessionPackage(db, sessionId, packageId, true)
      }
    })
  promises.push(genTemplateJsonPromise)

  return Promise.all(promises)
    .then(() => queryPackage.getSessionPackages(db, sessionId))
    .then((packages) => {
      let p = packages.map((pkg) =>
        queryPackage
          .selectAllDefaultOptions(db, pkg.packageRef)
          .then((optionDefaultsArray) =>
            Promise.all(
              optionDefaultsArray.map((optionDefault) => {
                return queryPackage
                  .selectOptionValueByOptionDefaultId(
                    db,
                    optionDefault.optionRef
                  )
                  .then((option) => {
                    return querySession.insertSessionKeyValue(
                      db,
                      sessionId,
                      option.optionCategory,
                      option.optionCode
                    )
                  })
              })
            )
          )
      )
      return Promise.all(p).then(() => packages)
    })
}

/**
 * Move database file out of the way into the backup location.
 *
 * @param {*} filePath
 */
function createBackupFile(filePath) {
  let pathBak = filePath + '~'
  if (fs.existsSync(filePath)) {
    if (fs.existsSync(pathBak)) {
      env.logDebug(`Deleting old backup file: ${pathBak}`)
      fs.unlinkSync(pathBak)
    }
    env.logDebug(`Creating backup file: ${filePath} to ${pathBak}`)
    fs.renameSync(filePath, pathBak)
  }
}

/**
 * Returns an object that contains:
 *    match: true or false if featureLevel is matched or not.
 *    message: in case of missmatch, the message shown to user.
 * @param {*} featureLevel
 */
function matchFeatureLevel(featureLevel) {
  if (featureLevel > env.zapVersion().featureLevel) {
    return {
      match: false,
      message: `File requires feature level ${featureLevel}, we only have ${
        env.zapVersion().featureLevel
      }. Please upgrade your zap!`,
    }
  } else {
    return { match: true }
  }
}

/**
 * Produces a text dump of a session data for human consumption.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into a text report for the session.
 */
function sessionReport(db, sessionId) {
  return queryEndpoint.queryEndpointTypes(db, sessionId).then((epts) => {
    let ps = []
    epts.forEach((ept) => {
      ps.push(
        queryEndpoint.queryEndpointClusters(db, ept.id).then((clusters) => {
          let s = `Endpoint: ${ept.name} \n`
          let ps2 = []
          clusters.forEach((c) => {
            let rpt = `  - ${c.hexCode}: cluster: ${c.name} (${c.side})\n`
            ps2.push(
              queryEndpoint
                .queryEndpointClusterAttributes(db, c.clusterId, c.side, ept.id)
                .then((attrs) => {
                  attrs.forEach((at) => {
                    rpt = rpt.concat(
                      `    - ${at.hexCode}: attribute: ${at.name} [${at.type}]\n`
                    )
                  })
                })
                .then(() =>
                  queryEndpoint.queryEndpointClusterCommands(
                    db,
                    c.clusterId,
                    ept.id
                  )
                )
                .then((cmds) => {
                  cmds.forEach((cmd) => {
                    rpt = rpt.concat(
                      `    - ${cmd.hexCode}: command: ${cmd.name}\n`
                    )
                  })
                  return rpt
                })
            )
          })
          return Promise.all(ps2)
            .then((rpts) => rpts.join(''))
            .then((r) => s.concat(r))
        })
      )
    })
    return Promise.all(ps).then((results) => results.join('\n'))
  })
}

/**
 * If you have an array of arguments, and a function that creates
 * a promise out of each of those arguments, this function
 * executes them sequentially, one by one.
 *
 * @param {*} arrayOfData
 * @param {*} promiseCreator
 */
function executePromisesSequentially(arrayOfData, promiseCreator) {
  return arrayOfData.reduce((prev, nextData) => {
    return prev.then(() => promiseCreator(nextData))
  }, Promise.resolve())
}

/**
 * This function creates absolute path out of relative path and its relativity
 * @param {*} relativePath
 * @param {*} relativity
 * @param {*} zapFilePath
 */
function createAbsolutePath(relativePath, relativity, zapFilePath) {
  switch (relativity) {
    case dbEnum.pathRelativity.absolute:
      return relativePath
    case dbEnum.pathRelativity.relativeToUserHome:
      return path.join(os.homedir(), relativePath)
    case dbEnum.pathRelativity.relativeToZap:
      return path.join(path.dirname(zapFilePath), relativePath)
  }
  return relativePath
}

/**
 * This method takes an array of root locations and a relative path.
 * It will attempt to locate an absolute file at the path, combining
 * the root location and a relative path, until a file is found and returned.
 *
 * If none of the combined root locations and relative paths results
 * in an actual file, null is returned.
 *
 * @param {*} rootFileLocations Array of root file locations, typically directories
 * @param {*} relativeFilePath Relative path
 * @returns A fully resolved path that exists, or null if none is available.
 */
function locateRelativeFilePath(rootFileLocations, relativeFilePath) {
  if (relativeFilePath) {
    for (let i = 0; i < rootFileLocations.length; i++) {
      let resolvedFile = path.resolve(
        rootFileLocations[i],
        relativeFilePath.trim()
      )
      if (fs.existsSync(resolvedFile)) {
        return resolvedFile
      }
    }
  }
  return null
}

/**
 * Returns a promise of an execution of an external program.
 *
 * @param {*} cmd
 */
function executeExternalProgram(
  cmd,
  workingDirectory,
  options = {
    rejectOnFail: true,
    routeErrToOut: false,
  }
) {
  return new Promise((resolve, reject) => {
    childProcess.exec(
      cmd,
      {
        cwd: workingDirectory,
        windowsHide: true,
        timeout: 10000,
      },
      (error, stdout, stderr) => {
        console.log(`    ✍  ${cmd}`)
        if (error) {
          if (options.rejectOnFail) {
            reject(error)
          } else {
            console.log(error)
            resolve()
          }
        } else {
          console.log(stdout)
          if (options.routeErrToOut) {
            console.log(stderr)
          } else {
            console.error(stderr)
          }
          resolve()
        }
      }
    )
  })
}

/**
 * Retrieve specific entry from extensions defaults(array) via 'clusterCode' key fields
 *
 * @param {*} extensions
 * @param {*} property field name under specific extension
 * @param {*} clusterCode search key
 * @returns Value of the cluster extension property.
 */
function getClusterExtensionDefault(extensions, extensionId, defaultKey) {
  let f = getClusterExtension(extensions, extensionId)
  if (f.length == 0) {
    return ''
  } else {
    let val = null
    f[0].defaults.forEach((d) => {
      if (d.entityCode == defaultKey) val = d.value
    })
    if (val == null) val = f[0].globalDefault
    if (val == null) val = ''
    return val
  }
}

/**
 * Retrieve specific entry from extensions defaults(array) via 'clusterCode' key fields
 *
 * @param {*} extensions
 * @param {*} property field name under specific extension
 * @param {*} clusterCode search key
 * @returns Object containing all attribuetes specific to the extension
 */
function getClusterExtension(extensions, extensionId) {
  return extensions.filter((x) => x.property == extensionId)
}

/**
 * Global way how to get an UUID.
 */
function createUuid() {
  return uuidv4()
}

/**
 * Returns a promise that resolves after time milliseconds
 * @param {} time
 */
function waitFor(time) {
  return new Promise((r) => setTimeout(r, time))
}

exports.createBackupFile = createBackupFile
exports.calculateCrc = calculateCrc
exports.initializeSessionPackage = initializeSessionPackage
exports.matchFeatureLevel = matchFeatureLevel
exports.sessionReport = sessionReport
exports.executePromisesSequentially = executePromisesSequentially
exports.createAbsolutePath = createAbsolutePath
exports.executeExternalProgram = executeExternalProgram
exports.locateRelativeFilePath = locateRelativeFilePath
exports.createUuid = createUuid
exports.waitFor = waitFor
exports.getClusterExtension = getClusterExtension
exports.getClusterExtensionDefault = getClusterExtensionDefault
