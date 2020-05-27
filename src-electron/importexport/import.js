// Copyright (c) 2020 Silicon Labs. All rights reserved.

/*
 * This file provides the functionality that reads the ZAP data from a JSON file
 * and imports it into a database.
 */
import * as Fs from 'fs'
import * as QueryConfig from '../db/query-config'
import * as QuerySession from '../db/query-session'
import * as Env from '../util/env'
import * as Mapping from './mapping'

/**
 * Reads the data from the file and resolves with the state object if all is good.
 *
 * @export
 * @param {*} filePath
 * @returns Promise of file reading.
 */
export function readDataFromFile(filePath) {
  return new Promise((resolve, reject) => {
    Fs.readFile(filePath, (err, data) => {
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
