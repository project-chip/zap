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
 * This module provides the mechanism for dealing with the async reporting
 * from backend to the UI.
 *
 * This mechanism takes care of:
 *   - dirty flag
 *
 * @module JS API: async reporting
 */

const env = require('./env')
const wsServer = require('../server/ws-server')
const querySession = require('../db/query-session')
const dbEnum = require('../../src-shared/db-enum')
const notification = require('../db/query-session-notification')

// This object contains all the async reports.
let asyncReports = {
  dirtyFlag: {
    fn: sendDirtyFlagStatus,
    intervalMs: 1000,
    sessionBased: true
  },
  notificationFlag: {
    fn: sendNotificationUpdate,
    interval: 1000,
    sessionBased: true
  }
}

/**
 * Sends a dirty flag status for a single session.
 * @param {*} db
 * @param {*} session
 */
async function sendDirtyFlagStatus(db, session) {
  let socket = wsServer.clientSocket(session.sessionKey)
  if (socket) {
    try {
      let flag = await querySession.getSessionDirtyFlag(db, session.sessionId)
      if (flag != undefined) {
        wsServer.sendWebSocketMessage(socket, {
          category: dbEnum.wsCategory.dirtyFlag,
          payload: flag
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
        notification.setNotification(
          db,
          'WARNING',
          `Error reading dirty flag status: ${session.sessionKey} => ${err}`,
          session.sessionId,
          2,
          0
        )
      }
    }
  }
}

/**
 * Sends a dirty flag status for a single session.
 * @param {*} db
 * @param {*} session
 */
async function sendNotificationUpdate(db, session) {
  let socket = wsServer.clientSocket(session.sessionKey)
  if (socket) {
    let currentSession = await querySession.getSessionFromSessionId(
      db,
      session.sessionId
    )
    if (currentSession.newNotification) {
      let notificationCount = await notification.getUnseenNotificationCount(
        db,
        session.sessionId
      )
      wsServer.sendWebSocketData(
        socket,
        dbEnum.wsCategory.notificationCount,
        notificationCount
      )
      await querySession.setSessionNewNotificationClean(db, session.sessionId)
    }
  }
}

/**
 * Start the interval that will check and report dirty flags.
 * @param {*} db
 */
function startAsyncReporting(db) {
  for (let key of Object.keys(asyncReports)) {
    let report = asyncReports[key]
    if (report.sessionBased) {
      // Session based reports get iterated over all sessions
      // and called with appropriate session.
      report.id = setInterval(async () => {
        try {
          // Check if the database is closed. Set in db-api#closeDatabase
          if (db._closed) return
          let sessions = await querySession.getAllSessions(db)
          let allPromises = sessions.map((session) => {
            if (db._closed) return
            return report.fn(db, session)
          })
          return Promise.all(allPromises)
        } catch (err) {
          // If the database was closed during an async operation, we can get an error.
          // We can ignore it if the db is marked as closed.
          if (db._closed) return
          env.logWarning(`Error in session-based async reporting: ${err}`)
        }
      }, report.intervalMs)
    } else {
      // Non session based reports get called once with the db as the argument.
      report.id = setInterval(async () => {
        if (db._closed) return
        try {
          await report.fn(db)
        } catch (err) {
          if (db._closed) return // Ignore errors if DB is closed.
          env.logWarning(`Error in non-session-based async reporting: ${err}`)
        }
      }, report.intervalMs)
    }
  }
}

/**
 * Stop the interval that will check and report dirty flags
 */
function stopAsyncReporting() {
  for (let key of Object.keys(asyncReports)) {
    let report = asyncReports[key]
    if (report.id) clearInterval(report.id)
  }
}

exports.startAsyncReporting = startAsyncReporting
exports.stopAsyncReporting = stopAsyncReporting
