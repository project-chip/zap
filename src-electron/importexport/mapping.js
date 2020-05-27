// Copyright (c) 2020 Silicon Labs. All rights reserved.

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
