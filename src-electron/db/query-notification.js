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
 * This module provides notification related queries.
 *
 * @module DB API: session related queries.
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
/**
 * Sets a notification in the SESSION_NOTICE table
 *
 * @export
 * @param {*} db
 * @param {*} type
 * @param {*} status
 * @param {*} sessionId
 * @param {*} severity
 */
async function setNotification(db, type, status, sessionId, severity) {
  return dbApi.dbUpdate(
    db,
    'INSERT INTO SESSION_NOTICE ( SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY) VALUES ( ?, ?, ?, ?, ?)',
    [sessionId, type, status, severity, 1]
  )
}
/**
 * Deletes a notification from the SESSION_NOTICE table
 *
 * @export
 * @param {*} db
 * @param {*} upgrade
 * @param {*} status
 */
async function deleteNotification(db, upgrade, status) {
  return dbApi.dbUpdate(
    db,
    'DELETE FROM SESSION_NOTICE WHERE ( SESSION_REF, STATUS ) = ( ?, ? )',
    [upgrade, status]
  )
}
/**
 * Retrieves a notification from the SESSION_NOTICE table
 *
 * @export
 * @param {*} db
 */
async function getNotification(db, sessionId) {
  let rows = []
  rows = await dbApi.dbAll(
    db,
    'SELECT * FROM SESSION_NOTICE WHERE SESSION_REF = ?',
    [sessionId]
  )
  return rows.map(dbMapping.map.notifications)
}
// exports
exports.setNotification = setNotification
exports.setAllNotificationDisplay = setAllNotificationDisplay
exports.deleteNotification = deleteNotification
exports.getNotification = getNotification
//# sourceMappingURL=query-notification.js.map
