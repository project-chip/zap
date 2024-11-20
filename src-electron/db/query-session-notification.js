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
 * Deletes a notification from the SESSION_NOTICE table by NOTICE_ID
 *
 * @export
 * @param {*} db
 * @param {*} id
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
 * update SEEN column to 1 for all notifications from the SESSION_NOTICE table with NOTICE_ID inside given input array unseenIds
 *
 * @export
 * @param {*} db
 * @param {*} unseenIds
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

/**
 * search for notifications with given message and delete them if found
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} message
 * @returns db delete promise if notification(s) were found and deleted, false otherwise
 */
async function searchNotificationByMessageAndDelete(db, sessionId, message) {
  let rows = await dbApi.dbAll(
    db,
    'SELECT NOTICE_ID FROM SESSION_NOTICE WHERE SESSION_REF = ? AND NOTICE_MESSAGE = ?',
    [sessionId, message]
  )
  if (rows && rows.length > 0) {
    let ids = rows.map((row) => row.NOTICE_ID)
    let deleteResponses = []
    for (let id of ids) {
      let response = await deleteNotification(db, id)
      deleteResponses.push(response)
    }
    return deleteResponses
  }
  return false
}

/**
 * check if notification with given message exists and if not, create a new one with type WARNING
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} message
 * @returns setNotification response if message does not exist and notification was set, false otherwise
 */
async function setWarningIfMessageNotExists(db, sessionId, message) {
  let rows = await dbApi.dbAll(
    db,
    'SELECT NOTICE_ID FROM SESSION_NOTICE WHERE SESSION_REF = ? AND NOTICE_MESSAGE = ?',
    [sessionId, message]
  )
  if (rows && rows.length == 0) {
    return setNotification(db, 'WARNING', message, sessionId, 2, 0)
  }
  return false
}

/**
 * Set or delete warning notification after updating a device type feature.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} result
 */
async function setNotificationOnFeatureChange(db, sessionId, result) {
  let { warningMessage, disableChange, displayWarning } = result
  if (disableChange) {
    for (let message of warningMessage) {
      await setWarningIfMessageNotExists(db, sessionId, message)
    }
    return
  }
  if (displayWarning) {
    await setNotification(db, 'WARNING', warningMessage, sessionId, 2, 0)
  } else {
    await searchNotificationByMessageAndDelete(db, sessionId, warningMessage)
  }
}

/**
 * Set warning for the required element. Delete previous warning for the element if exists.
 *
 * @export
 * @param {*} db
 * @param {*} data
 * @param {*} sessionId
 * @returns response of setting warning notification
 */
async function setRequiredElementWarning(db, data, sessionId) {
  let { element, contextMessage, requiredText, notSupportedText, added } = data

  // delete previous warning before setting new one
  let patterns = [`${element.name} conforms to ${element.conformance} and is`]
  await deleteNotificationWithPatterns(db, sessionId, patterns)

  let addResp = false
  if (requiredText && !added) {
    addResp = await setWarningIfMessageNotExists(
      db,
      sessionId,
      contextMessage + requiredText
    )
  }
  if (notSupportedText && added) {
    addResp = await setWarningIfMessageNotExists(
      db,
      sessionId,
      contextMessage + notSupportedText
    )
  }
  return addResp
}

/**
 * Delete notifications with message containing substrings specified in the patterns array.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} patterns
 * @returns response of deleting notifications
 */
async function deleteNotificationWithPatterns(db, sessionId, patterns) {
  if (!Array.isArray(patterns) || patterns.length == 0) return false

  let placeholders = patterns.map(() => '?').join(' OR NOTICE_MESSAGE LIKE ')
  let query = `SELECT NOTICE_ID FROM SESSION_NOTICE WHERE SESSION_REF = ?
    AND (NOTICE_MESSAGE LIKE ${placeholders})`
  let params = [sessionId, ...patterns.map((pattern) => `%${pattern}%`)]

  let rows = await dbApi.dbAll(db, query, params)
  if (rows && rows.length > 0) {
    let ids = rows.map((row) => row.NOTICE_ID)
    let deleteResponses = []
    for (let id of ids) {
      let response = await deleteNotification(db, id)
      deleteResponses.push(response)
    }
    return deleteResponses
  }
  return false
}

// exports
exports.setNotification = setNotification
exports.deleteNotification = deleteNotification
exports.getNotification = getNotification
exports.getUnseenNotificationCount = getUnseenNotificationCount
exports.markNotificationsAsSeen = markNotificationsAsSeen
exports.searchNotificationByMessageAndDelete =
  searchNotificationByMessageAndDelete
exports.setWarningIfMessageNotExists = setWarningIfMessageNotExists
exports.setNotificationOnFeatureChange = setNotificationOnFeatureChange
exports.setRequiredElementWarning = setRequiredElementWarning
exports.deleteNotificationWithPatterns = deleteNotificationWithPatterns
