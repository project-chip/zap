/*
 * Created Date: Tuesday, March 10th 2020, 4:19:32 pm
 * Author: Timotej Ecimovic
 * 
 * Copyright (c) 2020 Silicon Labs
 * 
 * This file provides functionality provides file operations for zap, namely the export
 * from the database and the import into the database.
 */

import fs from 'fs'
import { getAllSesionKeyValues, getAllSessionClusterState, getAllEndpointTypes } from '../db/query'
import { logInfo } from './env'

function createStateFromDatabase(db, sessionId) {
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
                return Promise.resolve(rows)
            })

        var getAllEndpoint = getAllEndpointTypes(db, sessionId)
           .then(rows => {
               state.endpointTypes = rows
               return Promise.resolve(rows)
           })
        promises.push(getKeyValues)

        Promise.all(promises)
            .then(() => resolve(state))
    })
}

function writeStateToDatabase(sessionId, state) {
    return new Promise((resolve,reject) => {
        resolve()
    })
}

// Take a given session ID and export the data into the file
export function exportDataIntoFile(db, sessionId, filePath) {
    return createStateFromDatabase(db, sessionId)
        .then(state => {
            return new Promise((resolve, reject) => {
                fs.writeFile(filePath, JSON.stringify(state, null, 2), (err) => {
                    if (err) reject(err)
                    resolve(filePath)
                })
            })
        })
}

// Take a given session ID and import the data from the file
export function importDataFromFile(sessionId, filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) reject(err)
            let state = JSON.parse(data)
            resolve(state)
        })
    }).then(state => writeStateToDatabase(sessionId, state))
}