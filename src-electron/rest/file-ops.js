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
const { StatusCodes } = require('http-status-codes')
const querySession = require('../db/query-session.js')
const queryNotification = require('../db/query-session-notification.js')
const dbEnum = require('../../src-shared/db-enum.js')
const studio = require('../ide-integration/studio-rest-api')
import { projectName } from '../util/studio-util'

/**
 * HTTP POST: IDE open
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostFileOpen(db) {
  return async (req, res) => {
    let { zapFilePath, ideProjectPath } = req.body
    let search = req.body.search
    const query = new URLSearchParams(search)
    let file = query.get('filePath')
    if (file) {
      zapFilePath = file
      ideProjectPath = query.get('studioProject')
    }
    if (zapFilePath) {
      let p
      if (studio.integrationEnabled(db, req.zapSessionId)) {
        p = path.posix.dirname(
          path.posix.dirname(path.posix.dirname(zapFilePath))
        )
      } else {
        p = path.posix.basename(zapFilePath)
      }
      let name = projectName(p)

      env.logInfo(`Loading project(${name})`)

      try {
        // set path before importDataFromFile() to avoid triggering DIRTY flag
        if (ideProjectPath) {
          env.logInfo(
            `StudioUC(${name}): Setting project path to ${ideProjectPath}`
          )
        }
        // store studio project path
        await querySession.updateSessionKeyValue(
          db,
          req.zapSessionId,
          dbEnum.sessionKey.ideProjectPath,
          ideProjectPath
        )

        let importResult = await importJs.importDataFromFile(db, zapFilePath, {
          sessionId: req.zapSessionId
        })

        let response = {
          sessionId: importResult.sessionId,
          sessionKey: req.zapSessionId
        }
        env.logInfo(
          `Loaded project(${name}) into database. RESP: ${JSON.stringify(
            response
          )}`
        )

        res.status(StatusCodes.OK).json(response)
      } catch (e) {
        e.project = zapFilePath
        let errMsg = {
          project: e.project,
          message: e.message,
          stack: e.stack
        }
        studio.sendSessionCreationErrorStatus(
          db,
          errMsg.message,
          req.zapSessionId
        )
        env.logError(e.message)
        queryNotification.setNotification(
          db,
          'ERROR',
          errMsg.message,
          req.zapSessionId,
          1,
          0
        )
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errMsg)
      }
    } else {
      let msg = `Opening/Loading project: Missing zap file path.`
      env.logWarning(msg)
      queryNotification.setNotification(
        db,
        'WARNING',
        errMsg.message,
        req.zapSessionId,
        2,
        0
      )
      res.status(StatusCodes.BAD_REQUEST).send({ error: msg })
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
  return async (req, res) => {
    let zapPath = req.body.path
    env.logDebug(`Saving session: id = ${req.zapSessionId}. path = ${zapPath}`)

    let actualPath
    if (zapPath == null || zapPath.length == 0) {
      actualPath = await querySession.getSessionKeyValue(
        db,
        req.zapSessionId,
        dbEnum.sessionKey.filePath
      )
    } else {
      actualPath = await querySession
        .updateSessionKeyValue(
          db,
          req.zapSessionId,
          dbEnum.sessionKey.filePath,
          zapPath
        )
        .then(() => zapPath)
    }

    if (actualPath != null && actualPath.length > 0) {
      try {
        let filePath = await exportJs.exportDataIntoFile(
          db,
          req.zapSessionId,
          actualPath
        )
        res.status(StatusCodes.OK).send({ filePath: filePath })
      } catch (err) {
        let msg = `Unable to save project.`
        env.logError(msg, err)
        queryNotification.setNotification(
          db,
          'ERROR',
          msg,
          req.zapSessionId,
          1,
          0
        )
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err)
      }
    } else {
      res.status(StatusCodes.BAD_REQUEST).send({ error: 'No file specified.' })
    }
  }
}

/**
 * HTTP GET: isDirty
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetFileIsDirty(db) {
  return async (req, res) => {
    let isDirty = await querySession.getSessionDirtyFlag(db, req.zapSessionId)

    return res.status(StatusCodes.OK).send({ DIRTY: isDirty })
  }
}

exports.post = [
  {
    uri: restApi.ide.open,
    callback: httpPostFileOpen
  },
  {
    uri: restApi.ide.save,
    callback: httpPostFileSave
  }
]

exports.get = [
  {
    uri: restApi.ide.isDirty,
    callback: httpGetFileIsDirty
  }
]
