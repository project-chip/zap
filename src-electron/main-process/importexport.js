// Copyright (c) 2020 Silicon Labs. All rights reserved.

/* 
 * This file provides functionality provides file operations for zap, namely the export
 * from the database and the import into the database.
 */
import fs from 'fs'
import { logInfo } from './env'
import { getAllSesionKeyValues, getAllEndpointTypes } from '../db/query-config'
import { setSessionClean } from '../db/query-session'

///////////////////////////////// IMPORT ////////////////////////////////////

/**
 * Take a given session ID and import the data from the file
 *
 * @export
 * @param {*} sessionId
 * @param {*} filePath
 * @returns a promise that resolves with the resolution of writing into a database.
 */
export function importDataFromFile(sessionId, filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err)
            let state = JSON.parse(data)
            resolve(state)
        })
    }).then(state => writeStateToDatabase(sessionId, state))
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
export function writeStateToDatabase(sessionId, state) {
    return new Promise((resolve,reject) => {
        logInfo('Reading state from file into the database...')
        logInfo(state)
        resolve()
    })
}

///////////////////////////////// EXPORT ////////////////////////////////////

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
        var getKeyValues = getAllSesionKeyValues(db, sessionId)
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

