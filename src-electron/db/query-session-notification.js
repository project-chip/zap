'use strict'
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
 * This module provides session notification related queries.
 *
 * @module DB API: session related queries.
 */

const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
const wsServer = require('../server/ws-server.js')
const dbEnum = require('../../src-shared/db-enum.js')
/**
 * Sets a notification in the SESSION_NOTICE table
 *
 * @export
 * @param {*} db
 * @param {*} type
 * @param {*} status
 * @param {*} sessionId
 * @param {*} severity
 * @param {*} display
 */
async function setNotification(
  db,
  type,
  status,
  sessionId,
  severity = 2,
  display = 0
) {
  let rows = []
  let updateResp = Promise.resolve(true)
  rows = await dbApi.dbAll(
    db,
    'SELECT SESSION_KEY FROM SESSION WHERE SESSION_ID = ?',
    [sessionId]
  )
  if (rows && rows.length > 0) {
    updateResp = dbApi.dbUpdate(
      db,
      'INSERT INTO SESSION_NOTICE ( SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY, SEEN) VALUES ( ?, ?, ?, ?, ?, ?)',
      [sessionId, type, status, severity, display, 0]
    )

    let sessionKey = rows[0].SESSION_KEY
    let socket = wsServer.clientSocket(sessionKey)
    let notificationCount = await getUnseenNotificationCount(db, sessionId)
    let obj = {
      display: display,
      message: status.toString()
    }
    if (socket) {
      wsServer.sendWebSocketData(
        socket,
        dbEnum.wsCategory.notificationInfo,
        obj
      )
      wsServer.sendWebSocketData(
        socket,
        dbEnum.wsCategory.notificationCount,
        notificationCount
      )
    }
  }
  return updateResp
}

/**
 * Deletes a notification from the SESSION_NOTICE table
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} type
 * @param {*} message
 */
async function deleteNotification(db, id) {
  return dbApi.dbUpdate(
    db,
    'DELETE FROM SESSION_NOTICE WHERE ( NOTICE_ID ) = ( ? )',
    [id]
  )
}
/**
 * Retrieves a notification from the SESSION_NOTICE table, reverse result so latest notifications are in the front
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 */
async function getNotification(db, sessionId) {
  let rows = []
  rows = await dbApi.dbAll(
    db,
    'SELECT * FROM SESSION_NOTICE WHERE SESSION_REF = ?',
    [sessionId]
  )
  let notifications = rows.map(dbMapping.map.sessionNotifications)
  return notifications.reverse()
}

/**
 * Retrieves count of unseen notifications from the SESSION_NOTICE table
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 */
async function getUnseenNotificationCount(db, sessionId) {
  let rows = await dbApi.dbAll(
    db,
    'SELECT COUNT(*) as unseenCount FROM SESSION_NOTICE WHERE SESSION_REF = ? AND SEEN = 0',
    [sessionId]
  )
  return rows[0].unseenCount
}

/**
 * update SEEN column to 1 for all notifications from the SESSION_NOTICE table with NOTIC_ORDER inside given input array unseenIds
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 */
async function markNotificationsAsSeen(db, unseenIds) {
  if (unseenIds && unseenIds.length > 0) {
    let placeholders = unseenIds.map(() => '?').join(',')
    await dbApi.dbUpdate(
      db,
      `UPDATE SESSION_NOTICE SET SEEN = 1 WHERE NOTICE_ID IN (${placeholders})`,
      unseenIds
    )
  }
}

// exports
exports.setNotification = setNotification
exports.deleteNotification = deleteNotification
exports.getNotification = getNotification
exports.getUnseenNotificationCount = getUnseenNotificationCount
exports.markNotificationsAsSeen = markNotificationsAsSeen
//# sourceMappingURL=query-session-notification.js.map
