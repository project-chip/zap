// Copyright (c) 2020 Silicon Labs. All rights reserved.

/*
 * This file provides the functionality that reads the ZAP data from a database
 * and exports it into a file.
 */
import * as Fs from 'fs'
import * as QuerySession from '../db/query-session'
import * as Env from '../util/env'
import * as Mapping from './mapping'

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
  Env.logInfo(`Writing state from session ${sessionId} into file ${filePath}`)
  return createStateFromDatabase(db, sessionId)
    .then((state) => {
      Env.logInfo(`About to write the file to ${filePath}`)
      Env.logInfo(state)
      return new Promise((resolve, reject) => {
        Env.logInfo(`Writing the file to ${filePath}`)
        Fs.writeFile(filePath, JSON.stringify(state, null, 2), (err) => {
          if (err) reject(err)
          resolve()
        })
      })
    })
    .then(() => {
      return QuerySession.setSessionClean(db, sessionId)
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
export function createStateFromDatabase(db, sessionId) {
  return new Promise((resolve, reject) => {
    var state = {
      writeTime: new Date().toString(),
      creator: 'zap',
    }
    var promises = []

    // Deal with the key/value table
    var getKeyValues = Mapping.exportSessionKeyValues(db, sessionId).then(
      (rows) => {
        state.keyValuePairs = rows
        Env.logInfo(`Retrieved session keys: ${rows.length}`)
        return Promise.resolve(rows)
      }
    )
    promises.push(getKeyValues)

    var getAllEndpoint = Mapping.exportEndpointTypes(db, sessionId).then(
      (rows) => {
        Env.logInfo(`Retrieved endpoint types: ${rows.length}`)
        state.endpointTypes = rows
        return Promise.resolve(rows)
      }
    )
    promises.push(getAllEndpoint)

    return Promise.all(promises)
      .then(() => resolve(state))
      .catch((err) => reject(err))
  })
}
