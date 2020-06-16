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
const Env = require('../util/env.js')

import * as QueryConfig from '../db/query-config.js'
import * as QuerySession from '../db/query-session.js'
import * as Mapping from './mapping.js'

/**
 * Reads the data from the file and resolves with the state object if all is good.
 *
 * @export
 * @param {*} filePath
 * @returns Promise of file reading.
 */
export function readDataFromFile(filePath) {
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
export function writeStateToDatabase(db, state) {
  return QuerySession.createBlankSession(db)
    .then((sessionId) => {
      Env.logInfo('Reading state from file into the database...')
      if ('keyValuePairs' in state) {
        return Mapping.importSessionKeyValues(
          db,
          sessionId,
          state.keyValuePairs
        ).then(() => sessionId)
      } else {
        return sessionId
      }
    })
    .then((sessionId) => {
      if ('endpointTypes' in state) {
        return QueryConfig.insertEndpointTypes(
          db,
          sessionId,
          state.endpointTypes
        ).then(() => sessionId)
      } else {
        return sessionId
      }
    })
}

/**
 * Take a given session ID and import the data from the file
 * Reads the data from the file and resolves with the state object if all is good.
 *
 * @export
 * @param {*} db
 * @param {*} filePath
 * @returns a promise that resolves with the resolution of writing into a database.
 * @returns Promise of file reading.
 */
export function importDataFromFile(db, filePath) {
  return readDataFromFile(filePath).then((state) =>
    writeStateToDatabase(db, state)
  )
}
