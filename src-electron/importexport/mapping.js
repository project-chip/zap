// Copyright (c) 2020 Silicon Labs. All rights reserved.

import { getAllSessionKeyValues, updateKeyValue, getAllEndpointTypes, getEndpointTypeClusters } from "../db/query-config"

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
    return getAllSessionKeyValues(db, sessionId)
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
        keyValuePairs.forEach(element => {
            allQueries.push(updateKeyValue(db, sessionId, element.key, element.value))
        });
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
    return getAllEndpointTypes(db, sessionId)
        .then(endpoints => {
            var promises = []
            endpoints.forEach(endpoint => {
                promises.push(new Promise((resolve, reject) => {
                    return getEndpointTypeClusters(db, endpoint.endpointTypeId)
                        .then(clusterRows => new Promise((resolve, reject) => {
                            endpoint.clusters = clusterRows
                            resolve()
                        }))
                }))

                promises.push(new Promise((resolve, reject) => {
                    return getEndpointTypeAttributes(db, endpoint.endpointTypeId)
                        .then(attributeRows => new Promise((resolve, reject) => {
                            endpoint.attributes = attributeRows
                            resolve()
                        }))
                }))

                promises.push(new Promise((resolve, reject) => {
                    return getEndpointTypeCommands(db, endpoint.endpointTypeId)
                        .then(commandRows => new Promise((resolve, reject) => {
                            endpoint.commands = commandRows
                            resolve()
                        }))
                }))
            })
            return Promise.all(promises).then(() => Promise.resolve(endpoints))
        })
}
