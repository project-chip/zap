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

/*
 * This file provides the functionality that reads the ZAP data from a JSON file
 * and imports it into a database.
 */
const fsp = require('fs').promises
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
 * @param {*} defaultTemplateFile
 * @returns Promise of file reading.
 */
async function readDataFromFile(
  filePath,
  defaultZclMetafile,
  defaultTemplateFile,
) {
  let data = await fsp.readFile(filePath)

  let stringData = data.toString().trim()
  if (stringData.startsWith('{')) {
    return importJson.readJsonData(
      filePath,
      data,
      defaultZclMetafile,
      defaultTemplateFile,
    )
  } else if (stringData.startsWith('#ISD')) {
    return importIsc.readIscData(
      filePath,
      data,
      defaultZclMetafile == null
        ? env.builtinSilabsZclMetafile()
        : defaultZclMetafile,
    )
  } else {
    throw new Error(
      'Invalid file format. Only .zap JSON files and ISC file format are supported.',
    )
  }
}

async function executePostImportScript(db, sessionId, scriptFile) {
  let context = {
    db: db,
    sessionId: sessionId,
  }
  return script.executeScriptFunction(
    script.functions.postLoad,
    context,
    scriptFile,
  )
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
    packageMatch: dbEnum.packageMatch.fuzzy,
  },
) {
  let state = await readDataFromFile(
    filePath,
    options.defaultZclMetafile,
    options.defaultTemplateFile,
  )
  state = ff.convertFromFile(state)
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
        },
        null,
        null,
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
    )
    if (options.postImportScript != null) {
      await executePostImportScript(
        db,
        loaderResult.sessionId,
        options.postImportScript,
      )
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
