// Copyright (c) 2020 Silicon Labs. All rights reserved.

/* 
 * This file provides the functionality that reads the ZAP data from a database
 * and exports it into a file.
 */
import fs from 'fs'
import { getAllEndpointTypes } from '../db/query-config'
import { setSessionClean } from '../db/query-session'
import { logInfo } from '../main-process/env'
import { getAllSessionKeyValuesForExport, exportSessionKeyValues } from './mapping'

/**
 * Toplevel file that takes a given session ID and exports the data into the file
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} filePath
 * @returns A promise that resolves with the path of the file written.
 */
export function exportDataIntoFile(db, sessionId, filePath) {
    logInfo(`Writing state from session ${sessionId} into file ${filePath}`)
    return createStateFromDatabase(db, sessionId)
        .then(state => {
            return new Promise((resolve, reject) => {
                fs.writeFile(filePath, JSON.stringify(state, null, 2), (err) => {
                    if (err) reject(err)
                    resolve()
                })
            })
        }).then(() => {
            return setSessionClean(db, sessionId)
        }).then(() => {
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
export function createStateFromDatabase(db, sessionId) {
    return new Promise((resolve, reject) => {
        var state = {
            writeTime: (new Date()).toString(),
            creator: 'zap',
        }
        var promises = []

        // Deal with the key/value table
        var getKeyValues = exportSessionKeyValues(db, sessionId)
            .then(rows => {
                state.keyValuePairs = rows
                logInfo('Retrieved session keys')
                return Promise.resolve(rows)
            })
        promises.push(getKeyValues)

        var getAllEndpoint = getAllEndpointTypes(db, sessionId)
            .then(rows => {
                logInfo('Retrieved endpoint types')
                state.endpointTypes = rows
                return Promise.resolve(rows)
            })
        promises.push(getAllEndpoint)


        Promise.all(promises)
            .then(() => resolve(state))
            .catch(err => reject(err))
    })
}

