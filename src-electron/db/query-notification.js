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
 * This module provides session related queries.
 *
 * @module DB API: session related queries.
 */
const dbApi = require('./db-api.js')

/**
 * Sets a notification
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves with the number of rows updated.
 */
async function setNotification(db, type, status, session, severity) {
  return dbApi.dbUpdate(
    db,
    'INSERT OR REPLACE INTO SESSION_NOTICE ( SESSION_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY ) VALUES ( ?, ?, ?, ?)',
    [session, type, status, severity]
  )
}
//todo
async function deleteNotification(db, upgrade, status) {
  return dbApi.dbUpdate(
    db,
    'DELETE FROM UPGRADE WHERE ( UPGRADE, STATUS ) = ( ?, ?)',
    [upgrade, status]
  )
}
async function getNotification(db) {
  let rows = []
  rows = await dbAll(
    db,
    'SELECT NOTICE_TYPE, NOTICE_MESSAGE,NOTICE_SEVERITY,NOTICE_ORDER FROM SESSION_NOTICE'
  )
  return rows.map(dbMapping.map.notifications)
}

// exports
exports.setNotification = setNotification
exports.deleteNotification = deleteNotification
exports.getNotification = getNotification
