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
const env = require('../util/env.js')
/**
 * Reads the data from the file and resolves with the state object if all is good.
 *
 * @export
 * @param {*} filePath
 * @returns Promise of file reading.
 */
async function readDataFromFile(filePath, defaultZclMetafile) {
  let data = await fsp.readFile(filePath)

  let stringData = data.toString().trim()
  if (stringData.startsWith('{')) {
    return importJson.readJsonData(filePath, data)
  } else if (stringData.startsWith('#ISD')) {
    return importIsc.readIscData(
      filePath,
      data,
      defaultZclMetafile == null
        ? env.builtinSilabsZclMetafile
        : defaultZclMetafile
    )
  } else {
    throw new Error(
      'Invalid file format. Only .zap JSON files and ISC file format are supported.'
    )
  }
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
    defaultZclMetafile: env.builtinSilabsZclMetafile,
  }
) {
  let state = await readDataFromFile(filePath, options.defaultZclMetafile)
  return dbApi
    .dbBeginTransaction(db)
    .then(() => {
      if (options.sessionId == null) {
        return querySession.createBlankSession(db)
      } else {
        return options.sessionId
      }
    })
    .then((sid) => state.loader(db, state, sid))
    .finally(() => dbApi.dbCommit(db))
}
// exports
exports.readDataFromFile = readDataFromFile
exports.importDataFromFile = importDataFromFile
