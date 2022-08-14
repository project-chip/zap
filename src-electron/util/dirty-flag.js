/**
 *
 *    Copyright (c) 2022 Silicon Labs
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
 * This module provides the mechanism for dealing with the dirty flag.
 *
 * @module JS API: dirty flag
 */

const wsServer = require('../server/ws-server')
const querySession = require('../db/query-session')
const env = require('../util/env')
const dbEnum = require('../../src-shared/db-enum')

let dirtyFlagStatusId = null
const defaultDirtyFlagIntervalMs = 1000

/**
 * Sends a dirty flag status for a single session.
 * @param {*} db
 * @param {*} session
 */
async function sendDirtyFlagForOneSession(db, session) {
  let socket = wsServer.clientSocket(session.sessionKey)
  if (socket) {
    try {
      let flag = await querySession.getSessionDirtyFlag(db, session.sessionId)
      if (flag != undefined) {
        wsServer.sendWebSocketMessage(socket, {
          category: dbEnum.wsCategory.dirtyFlag,
          payload: flag,
        })
      }
    } catch (err) {
      // If we close the database before this is executed from a timer, then
      // we don't log that.
      let msg = err.toString()
      if (!msg.includes('SQLITE_MISUSE')) {
        env.logWarning(
          `Error reading dirty flag status: ${session.sessionKey} => ${err}`
        )
      }
    }
  }
}

/**
 * This function triggers the sending of dirty flags for all sessions.
 * @param {*} db
 */
async function sendDirtyFlagStatus(db) {
  let sessions = await querySession.getAllSessions(db)

  let allPromises = sessions.map((session) =>
    sendDirtyFlagForOneSession(db, session)
  )
  return Promise.all(allPromises)
}

/**
 * Start the interval that will check and report dirty flags.
 * @param {*} db
 * @param {*} intervalMs
 */
function startDirtyFlagReporting(db, intervalMs = defaultDirtyFlagIntervalMs) {
  dirtyFlagStatusId = setInterval(() => {
    sendDirtyFlagStatus(db)
  }, intervalMs)
}

/**
 * Stop the interval that will check and report dirty flags
 */
function stopDirtyFlagReporting() {
  if (dirtyFlagStatusId) clearInterval(dirtyFlagStatusId)
}

exports.startDirtyFlagReporting = startDirtyFlagReporting
exports.stopDirtyFlagReporting = stopDirtyFlagReporting
