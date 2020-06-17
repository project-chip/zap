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
 * This file provides the functionality that reads the ZAP data from a database
 * and exports it into a file.
 */
const fs = require('fs')
const env = require('../util/env.js')
const querySession = require('../db/query-session.js')
const mapping = require('./mapping.js')

/**
 * Toplevel file that takes a given session ID and exports the data into the file
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} filePath
 * @returns A promise that resolves with the path of the file written.
 */
function exportDataIntoFile(db, sessionId, filePath) {
  env.logInfo(`Writing state from session ${sessionId} into file ${filePath}`)
  return createStateFromDatabase(db, sessionId)
    .then((state) => {
      env.logInfo(`About to write the file to ${filePath}`)
      env.logInfo(state)
      return new Promise((resolve, reject) => {
        env.logInfo(`Writing the file to ${filePath}`)
        fs.writeFile(filePath, JSON.stringify(state, null, 2), (err) => {
          if (err) reject(err)
          resolve()
        })
      })
    })
    .then(() => {
      return querySession.setSessionClean(db, sessionId)
    })
    .then(() => {
      return Promise.resolve(filePath)
    })
}

/**
 * Given a database and a session id, this method returns a promise that
 * resolves with a state object that needs to be saved into a file.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns state object that needs to be saved into a file.
 */
function createStateFromDatabase(db, sessionId) {
  return new Promise((resolve, reject) => {
    var state = {
      writeTime: new Date().toString(),
      creator: 'zap',
    }
    var promises = []

    // Deal with the key/value table
    var getKeyValues = mapping
      .exportSessionKeyValues(db, sessionId)
      .then((data) => {
        state.keyValuePairs = data
        env.logInfo(`Retrieved session keys: ${data.length}`)
        return Promise.resolve(data)
      })
    promises.push(getKeyValues)

    var getAllEndpointTypes = mapping
      .exportEndpointTypes(db, sessionId)
      .then((data) => {
        env.logInfo(`Retrieved endpoint types: ${data.length}`)
        state.endpointTypes = data
        return Promise.resolve(data)
      })
    promises.push(getAllEndpointTypes)

    return Promise.all(promises)
      .then(() => resolve(state))
      .catch((err) => reject(err))
  })
}
// exports
exports.exportDataIntoFile = exportDataIntoFile
exports.createStateFromDatabase = createStateFromDatabase
