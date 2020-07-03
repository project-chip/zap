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
const fs = require('fs')
const env = require('../util/env.js')
const queryConfig = require('../db/query-config.js')
const querySession = require('../db/query-session.js')
const queryPackage = require('../db/query-package.js')
const dbApi = require('../db/db-api.js')

/**
 * Resolves with a promise that imports session key values.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} keyValuePairs
 */
function importSessionKeyValues(db, sessionId, keyValuePairs) {
  var allQueries = []
  if (keyValuePairs != null) {
    env.logInfo(`Loading ${keyValuePairs.length} packages`)
    // Write key value pairs
    keyValuePairs.forEach((element) => {
      allQueries.push(
        queryConfig.updateKeyValue(db, sessionId, element.key, element.value)
      )
    })
  }
  return Promise.all(allQueries).then(() => sessionId)
}

function importPackages(db, sessionId, packages) {
  var allQueries = []
  if (packages != null) {
    env.logInfo(`Loading ${packages.length} packages`)
    packages.forEach((p) => {
      // Each p has 'path', 'version', 'type'
    })
  }
  return Promise.all(allQueries).then(() => sessionId)
}

function importEndpointTypes(db, sessionId, endpointTypes) {
  var allQueries = []
  if (endpointTypes != null) {
    env.logInfo(`Loading ${endpointTypes.length} endpoint types`)
    endpointTypes.forEach((et) => {})
  }
  return Promise.all(allQueries).then(() => sessionId)
}

/**
 * Reads the data from the file and resolves with the state object if all is good.
 *
 * @export
 * @param {*} filePath
 * @returns Promise of file reading.
 */
function readDataFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      let state = JSON.parse(data)
      resolve(state)
    })
  })
}

/**
 * Given a state object, this method returns a promise that resolves
 * with the succesfull writing into the database.
 *
 * @export
 * @param {*} sessionId
 * @param {*} state
 * @returns a promise that resolves with the sucessful writing
 */
function writeStateToDatabase(db, state) {
  return dbApi
    .dbBeginTransaction(db)
    .then(() => querySession.createBlankSession(db))
    .then((sessionId) => {
      env.logInfo('Reading state from file into the database...')
      var promises = []
      if ('package' in state) {
        promises.push(importPackages(db, sessionId, state.packages))
      }

      if ('keyValuePairs' in state) {
        promises.push(
          importSessionKeyValues(db, sessionId, state.keyValuePairs)
        )
      }

      if ('endpointTypes' in state) {
        promises.push(importEndpointTypes(db, sessionId, state.endpointTypes))
      }

      return Promise.all(promises).then(() => sessionId)
    })
    .then((sessionId) => {
      if ('endpointTypes' in state) {
        return queryConfig
          .insertEndpointTypes(db, sessionId, state.endpointTypes)
          .then(() => sessionId)
      } else {
        return sessionId
      }
    })
    .finally(() => dbApi.dbCommit(db))
}

/**
 * Writes the data from the file into a new session.
 *
 * @export
 * @param {*} db
 * @param {*} filePath
 * @returns a promise that resolves with the session Id of the written data.
 */
function importDataFromFile(db, filePath) {
  return readDataFromFile(filePath).then((state) =>
    writeStateToDatabase(db, state)
  )
}
// exports
exports.readDataFromFile = readDataFromFile
exports.writeStateToDatabase = writeStateToDatabase
exports.importDataFromFile = importDataFromFile
