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

import * as QueryConfig from '../db/query-config'

/**
 * This file contains queries and mapping for reading and writing a file.
 */

/**
 * Resolves to an array of objects that contain 'key' and 'value'
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise to retrieve all session key values.
 */
export function exportSessionKeyValues(db, sessionId) {
  return QueryConfig.getAllSessionKeyValues(db, sessionId)
}

/**
 * Resolves with a promise that imports session key values.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} keyValuePairs
 */
export function importSessionKeyValues(db, sessionId, keyValuePairs) {
  var allQueries = []
  if (keyValuePairs != null) {
    // Write key value pairs
    keyValuePairs.forEach((element) => {
      allQueries.push(
        QueryConfig.updateKeyValue(db, sessionId, element.key, element.value)
      )
    })
  }
  return Promise.all(allQueries).then(() => Promise.resolve(sessionId))
}

export function exportEndpoints(db, sessionId) {
  QueryConfig.getAll
}

/**
 * Resolves to an array of endpoint types.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise to retrieve all endpoint types.
 */
export function exportEndpointTypes(db, sessionId) {
  return QueryConfig.getAllEndpointTypes(db, sessionId).then((endpoints) => {
    var promises = []
    endpoints.forEach((endpoint) => {
      promises.push(
        QueryConfig.getEndpointTypeClusters(db, endpoint.endpointTypeId).then(
          (clusterRows) =>
            new Promise((resolve, reject) => {
              endpoint.clusters = clusterRows
              resolve(clusterRows)
            })
        )
      )

      promises.push(
        QueryConfig.getEndpointTypeAttributes(db, endpoint.endpointTypeId).then(
          (attributeRows) =>
            new Promise((resolve, reject) => {
              endpoint.attributes = attributeRows
              resolve(attributeRows)
            })
        )
      )

      promises.push(
        QueryConfig.getEndpointTypeCommands(db, endpoint.endpointTypeId).then(
          (commandRows) =>
            new Promise((resolve, reject) => {
              endpoint.commands = commandRows
              resolve(commandRows)
            })
        )
      )
    })
    return Promise.all(promises).then(() => endpoints)
  })
}
