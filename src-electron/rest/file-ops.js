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
const env = require('../util/env.js')
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
    let zapPath = req.body.path
    if (zapPath != null) {
      let name = path.posix.basename(zapPath)
      let zapFile = zapPath

      env.logInfo(`Studio: Opening/Loading project(${name})`)

      importJs
        .importDataFromFile(db, zapFile, req.zapSessionId)
        .then((importResult) => {
          let response = {
            sessionId: importResult.sessionId,
            sessionKey: req.session.id,
          }
          env.logInfo(
            `Studio: Loaded project(${name}), ${JSON.stringify(response)}`
          )
          res.send(response)
        })
        .catch(function (err) {
          err.project = zapFile
          studio.sendSessionCreationErrorStatus(err)
          env.logError(JSON.stringify(err))
          res.status(http.StatusCodes.BAD_REQUEST).send(err)
        })
    } else {
      let msg = `Opening/Loading project: Missing path data.`
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
    env.logInfo(`Saving session: uuid = ${req.zapSessionId}`)
    querySession
      .getSessionKeyValue(db, req.zapSessionId, dbEnum.sessionKey.filePath)
      .then((filePath) =>
        exportJs.exportDataIntoFile(db, req.zapSessionId, filePath)
      )
      .then((filePath) => {
        let projectName = path.posix.basename(filePath)
        env.logInfo(`Saving file: file = ${projectName}`)
        res.status(http.StatusCodes.OK).send({ filePath: filePath })
      })
      .catch((err) => {
        let msg = `Unable to save project with sessionId(${req.zapSessionId})`
        env.logError(msg)
        env.logError(err)
        res.status(http.StatusCodes.BAD_REQUEST).send({
          error: msg,
        })
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
