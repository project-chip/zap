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
 * This file provides the functionality that reads the ZAP data from a JSON file
 * and imports it into a database.
 *
 * @module Import API: Imports data from a file.
 */

const fsp = require('fs').promises
const fs = require('fs')
const path = require('path')
const importIsc = require('./import-isc.js')
const importJson = require('./import-json.js')
const dbApi = require('../db/db-api.js')
const querySession = require('../db/query-session.js')
const env = require('../util/env')
const script = require('../util/post-import.js')
const dbEnum = require('../../src-shared/db-enum')
const ff = require('./file-format.js')
const util = require('../util/util.js')

/**
 * Reads the data from the file and resolves with the state object if all is good.
 *
 * @param {*} filePath
 * @param {*} defaultZclMetafile
 * @returns Promise of file reading.
 */
async function readDataFromFile(filePath, defaultZclMetafile) {
  let resolvedPath = await fsp.realpath(filePath)
  let data = await fsp.readFile(resolvedPath)

  let stringData = data.toString().trim()
  if (stringData.startsWith('{')) {
    return importJson.readJsonData(filePath, data)
  } else if (stringData.startsWith('#ISD')) {
    return importIsc.readIscData(
      filePath,
      data,
      defaultZclMetafile == null
        ? env.builtinSilabsZclMetafile()
        : defaultZclMetafile
    )
  } else {
    throw new Error(
      'Invalid file format. Only .zap JSON files and ISC file format are supported.'
    )
  }
}

/**
 * Execute the post import script oonce import is done.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} scriptInfo
 * @returns Promise of function execution.
 */
async function executePostImportScript(db, sessionId, scriptInfo) {
  let context = {
    db: db,
    sessionId: sessionId,
    script: scriptInfo
  }
  return script.executeScriptFunction(script.functions.postLoad, context)
}

/**
 * Merge extension file content into the base zap file content.
 *
 * @param {Object} baseState - The state object of the base .zap file.
 * @param {Object} extensionState - The state object of the extension .zap file.
 */
function mergeZapExtension(baseState, extensionState) {
  if (extensionState.endpoints) {
    extensionState.endpoints.forEach((extEndpoint) => {
      // Finding an endpoint using endpoint identifier linked to extension endpoint Id
      const baseEndpoint = baseState.endpoints.find(
        (et) => et.endpointId === extEndpoint.id
      )
      if (!baseEndpoint) {
        return
      }

      // Finding the appropriate endpointType in the .zap file/base State
      const baseEndpointType =
        baseState.endpointTypes[baseEndpoint.endpointTypeIndex]

      if (baseEndpointType) {
        extEndpoint.clusters.forEach((extCluster) => {
          const baseCluster = baseEndpointType.clusters.find(
            (bc) => bc.code === extCluster.code
          )

          if (baseCluster) {
            // Merge attributes
            if (extCluster.attributes) {
              baseCluster.attributes = baseCluster.attributes || []
              extCluster.attributes.forEach((extAttr) => {
                const existingAttr = baseCluster.attributes.find(
                  (attr) => attr.code === extAttr.code
                )
                if (!existingAttr) {
                  baseCluster.attributes.push(extAttr)
                }
              })
            }
            // Merge commands
            if (extCluster.commands) {
              baseCluster.commands = baseCluster.commands || []
              extCluster.commands.forEach((extAttr) => {
                const existingCmd = baseCluster.commands.find(
                  (attr) => attr.code === extAttr.code
                )
                if (!existingCmd) {
                  baseCluster.commands.push(extAttr)
                }
              })
            }
          } else {
            // Add new cluster if it doesn't exist
            baseEndpointType.clusters.push(extCluster)
          }
        })
      }
    })
  }
}

/**
 * Extract upgrade rules from ZCL packages
 * @param {Array} upgradeZclPackages - Array of ZCL packages
 * @returns {Array} Array of upgrade rule objects
 */
function extractUpgradeRules(upgradeZclPackages) {
  let upgradeRules = []
  // If more than one upgrade package is present then it is a multiprotocol
  // application so upgrade rules should be added to the corresponding endpoints.
  let isMultiProtocol = upgradeZclPackages.length > 1

  for (const pkg of upgradeZclPackages) {
    if (pkg.path) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(pkg.path, 'utf-8'))
        if (jsonData.upgradeRules !== undefined) {
          const upgradeRulesJsonPath = path.resolve(
            path.dirname(pkg.path),
            jsonData.upgradeRules
          )
          try {
            const upgradeRulesData = JSON.parse(
              fs.readFileSync(upgradeRulesJsonPath, 'utf-8')
            )
            // Sorting upgrade rules by priority and then run them
            upgradeRulesData.upgradeRuleScripts
              .sort((a, b) => a.priority - b.priority)
              .forEach((ur) => {
                upgradeRules.push({
                  path: path.resolve(path.dirname(pkg.path), ur.path),
                  category: isMultiProtocol ? upgradeRulesData.category : null
                })
              })
          } catch (error) {
            env.logError(
              `Error reading or parsing upgrade rules from path ${upgradeRulesJsonPath}:`,
              error
            )
          }
        }
      } catch (error) {
        env.logError(
          `Error reading or parsing JSON from path ${pkg.path}:`,
          error
        )
      }
    }
  }

  return upgradeRules
}

/**
 * Writes the data from the file into a new session.
 * NOTE: This function does NOT initialize session packages.
 *
 * @export
 * @param {*} db
 * @param {*} filePath
 * @returns a promise that resolves with the import result object that contains: sessionId, errors, warnings.
 */
async function importDataFromFile(
  db,
  filePath,
  options = {
    sessionId: null,
    defaultZclMetafile: env.builtinSilabsZclMetafile(),
    postImportScript: null,
    packageMatch: dbEnum.packageMatch.fuzzy
  }
) {
  let state = await readDataFromFile(filePath, options.defaultZclMetafile)
  // Merge extension files into the state
  if (
    options.extensionFiles &&
    Array.isArray(options.extensionFiles) &&
    options.extensionFiles.length > 0
  ) {
    for (const extensionFile of options.extensionFiles) {
      const extensionState = await readDataFromFile(
        extensionFile,
        options.defaultZclMetafile
      )
      mergeZapExtension(state, extensionState)
    }
  }

  state = ff.convertFromFile(state)

  // If upgrade rules are not known then figure them out.
  if (!options.upgradeRuleScripts) {
    // If defaultZclMetafile doesn't exist, figure it out based on filePath
    if (
      !options.defaultZclMetafile &&
      state.package &&
      Array.isArray(state.package)
    ) {
      // Find all ZCL properties packages from the state
      const zclPackages = state.package.filter(
        (pkg) => pkg.type === dbEnum.packageType.zclProperties
      )
      if (zclPackages.length > 0) {
        options.defaultZclMetafile = zclPackages
          .map((pkg) => {
            if (pkg.path) {
              // If the path is relative, resolve it relative to the filePath directory
              if (!path.isAbsolute(pkg.path)) {
                return path.resolve(path.dirname(filePath), pkg.path)
              } else {
                return pkg.path
              }
            }
            return null
          })
          .filter((path) => path !== null)
      } else {
        // Fallback to builtin if no ZCL package found in state
        options.defaultZclMetafile = [env.builtinSilabsZclMetafile()]
      }
    }

    // If defaultTemplateFile doesn't exist, figure it out based on filePath
    if (
      !options.defaultTemplateFile &&
      state.package &&
      Array.isArray(state.package)
    ) {
      // Find all template packages from the state
      const templatePackages = state.package.filter(
        (pkg) => pkg.type === dbEnum.packageType.genTemplatesJson
      )
      if (templatePackages.length > 0) {
        options.defaultTemplateFile = templatePackages
          .map((pkg) => {
            if (pkg.path) {
              // If the path is relative, resolve it relative to the filePath directory
              if (!path.isAbsolute(pkg.path)) {
                return path.resolve(path.dirname(filePath), pkg.path)
              } else {
                return pkg.path
              }
            }
            return null
          })
          .filter((path) => path !== null)
      } else {
        // Fallback to builtin if no template package found in state
        options.defaultTemplateFile = [env.builtinTemplateMetafile()]
      }
    }

    // Add upgrade package matching logic
    let upgradeZclPackages = await util.getUpgradePackageMatch(
      db,
      options.zclProperties || options.defaultZclMetafile,
      state.package,
      dbEnum.packageType.zclProperties
    )
    let upgradeTemplatePackages = await util.getUpgradePackageMatch(
      db,
      options.generationTemplate || options.defaultTemplateFile,
      state.package,
      dbEnum.packageType.genTemplatesJson
    )

    let upgradeRules = extractUpgradeRules(upgradeZclPackages)

    // Set upgrade rules in options if they exist
    if (upgradeRules.length > 0) {
      options.upgradeRuleScripts = upgradeRules
    }
    options.upgradeZclPackages = upgradeZclPackages
    options.upgradeTemplatePackages = upgradeTemplatePackages
  }
  try {
    await dbApi.dbBeginTransaction(db)
    let sid
    if (options.sessionId == null) {
      sid = await querySession.createBlankSession(db)
      await util.ensurePackagesAndPopulateSessionOptions(
        db,
        sid,
        {
          zcl: env.builtinSilabsZclMetafile(),
          template: env.builtinTemplateMetafile(),
          upgradeZclPackages: options.upgradeZclPackages,
          upgradeTemplatePackages: options.upgradeTemplatePackages
        },
        null,
        null
      )
    } else {
      sid = options.sessionId
    }

    // Update endpoint type with device version and device identifier. There
    // was a schema change where the device version and device identifer was
    // moved into the endpoint_type_device table instead of keeping it in the
    // endpoint table.
    if (state.endpoints) {
      state.endpoints.forEach((ep) => {
        state.endpointTypes[ep.endpointTypeIndex].deviceVersion =
          ep.endpointVersion
        state.endpointTypes[ep.endpointTypeIndex].deviceIdentifier =
          ep.deviceIdentifier
      })
    } else if (state.endpoint) {
      // For isc file import
      state.endpoint.forEach((ep) => {
        if (ep.deviceId != -1) {
          state.endpointTypes[ep.endpointType].deviceId = ep.deviceId
          state.endpointTypes[ep.endpointType].deviceIdentifier = ep.deviceId
        }
      })
    }

    let loaderResult = await state.loader(
      db,
      state,
      sid,
      options.packageMatch,
      options.defaultZclMetafile,
      options.defaultTemplateFile,
      options.upgradeZclPackages,
      options.upgradeTemplatePackages
    )
    if (options.postImportScript != null) {
      await executePostImportScript(db, loaderResult.sessionId, {
        path: path.resolve(options.postImportScript),
        category: null // When running individual scripts no need for category
      })
    }
    if (options.upgradeRuleScripts != null) {
      const upgradeScripts = options.upgradeRuleScripts
      let upgradeMessages = []
      for (let i = 0; i < upgradeScripts.length; i++) {
        let upgradeScript = upgradeScripts[i]
        if (fs.existsSync(upgradeScript.path)) {
          let upgradeMessage = await executePostImportScript(
            db,
            loaderResult.sessionId,
            upgradeScript
          )
          if (upgradeMessage) {
            upgradeMessages.push(upgradeMessage)
          }
        } else {
          throw new Error(
            `Post import script path does not exist: ${upgradeScript.path}`
          )
        }
      }
      loaderResult.upgradeMessages = upgradeMessages
    }
    return loaderResult
  } finally {
    await dbApi.dbCommit(db)
  }
}

// exports
exports.readDataFromFile = readDataFromFile
exports.importDataFromFile = importDataFromFile
exports.executePostImportScript = executePostImportScript
exports.extractUpgradeRules = extractUpgradeRules
