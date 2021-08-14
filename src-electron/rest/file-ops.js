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

/**
 * This module provides the interface to an extenal IDE: Simplicity Studio.
 *
 * @module External IDE interface.
 */

const restApi = require('../../src-shared/rest-api.js')
const env = require('../util/env')
const importJs = require('../importexport/import.js')
const exportJs = require('../importexport/export.js')
const path = require('path')
const http = require('http-status-codes')
const querySession = require('../db/query-session.js')
const dbEnum = require('../../src-shared/db-enum.js')
const studio = require('../ide-integration/studio-rest-api.js')

/**
 * HTTP POST: IDE open
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostFileOpen(db) {
  return (req, res) => {
    let { zapFilePath, ideProjectPath } = req.body
    let name = ''

    if (zapFilePath) {
      name = path.posix.basename(zapFilePath)
      env.logDebug(`Loading project(${name})`)
    }

    if (zapFilePath) {
      importJs
        .importDataFromFile(db, zapFilePath, { sessionId: req.zapSessionId })
        .then((importResult) => {
          let response = {
            sessionId: importResult.sessionId,
            sessionKey: req.session.id,
          }
          env.logDebug(
            `Loaded project(${name}) into database. RESP: ${JSON.stringify(
              response
            )}`
          )
          res.send(response)
          return req.zapSessionId
        })
        .then((sessionId) => {
          if (ideProjectPath) {
            env.logDebug(
              `IDE: setting project path(${name}) to ${ideProjectPath}`
            )

            // store studio project path
            querySession.updateSessionKeyValue(
              db,
              sessionId,
              dbEnum.sessionKey.ideProjectPath,
              ideProjectPath
            )
          }
        })
        .catch(function (err) {
          err.project = zapFilePath
          studio.sendSessionCreationErrorStatus(db, err)
          env.logError(JSON.stringify(err))
          res.status(http.StatusCodes.BAD_REQUEST).send(err)
        })
    } else {
      let msg = `Opening/Loading project: Missing zap file path.`
      env.logWarning(msg)
      res.status(http.StatusCodes.BAD_REQUEST).send({ error: msg })
    }
  }
}

/**
 * HTTP POST: IDE save
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostFileSave(db) {
  return (req, res) => {
    let zapPath = req.body.path
    env.logDebug(`Saving session: id = ${req.zapSessionId}. path = ${zapPath}`)

    let p
    if (zapPath == null || zapPath.length == 0) {
      p = querySession.getSessionKeyValue(
        db,
        req.zapSessionId,
        dbEnum.sessionKey.filePath
      )
    } else {
      p = querySession
        .updateSessionKeyValue(
          db,
          req.zapSessionId,
          dbEnum.sessionKey.filePath,
          zapPath
        )
        .then(() => zapPath)
    }

    p.then((actualPath) => {
      if (actualPath != null && actualPath.length > 0) {
        exportJs
          .exportDataIntoFile(db, req.zapSessionId, actualPath)
          .then((filePath) => {
            res.status(http.StatusCodes.OK).send({ filePath: filePath })
          })
          .catch((err) => {
            let msg = `Unable to save project.`
            env.logError(msg, err)
            res.status(http.StatusCodes.BAD_REQUEST).send({
              error: msg,
            })
          })
      } else {
        res
          .status(http.StatusCodes.BAD_REQUEST)
          .send({ error: 'No file specified.' })
      }
    })
  }
}

exports.post = [
  {
    uri: restApi.ide.open,
    callback: httpPostFileOpen,
  },
  {
    uri: restApi.ide.save,
    callback: httpPostFileSave,
  },
]
