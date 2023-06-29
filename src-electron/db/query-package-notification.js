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
 * This module provides package notification related queries.
 *
 * @module DB API: session related queries.
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
/**
 * Sets a notification in the PACKAGE_NOTICE table
 *
 * @export
 * @param {*} db
 * @param {*} type
 * @param {*} status
 * @param {*} sessionId
 * @param {*} severity
 */
async function setNotification(
  db,
  type,
  status,
  packageId,
  severity = 2,
  display = 0
) {
  return dbApi.dbUpdate(
    db,
    'INSERT INTO PACKAGE_NOTICE ( PACKAGE_REF, NOTICE_TYPE, NOTICE_MESSAGE, NOTICE_SEVERITY, DISPLAY, SEEN) VALUES ( ?, ?, ?, ?, ?, ?)',
    [packageId, type, status, severity, display, 0]
  )
}

/**
 * Deletes a notification from the PACKAGE_NOTICE table
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} type
 * @param {*} message
 */
async function deleteNotification(db, order) {
  return dbApi.dbUpdate(
    db,
    'DELETE FROM PACKAGE_NOTICE WHERE ( NOTICE_ORDER ) = ( ? )',
    [order]
  )
}
/**
 * Retrieves notifications from the PACKAGE_NOTICE table related to a sessionId
 *
 * @export
 * @param {*} db
 */
async function getNotification(db, sessionId) {
  let rows = []
  rows = await dbApi.dbAll(
    db,
    'SELECT * FROM PACKAGE_NOTICE WHERE PACKAGE_REF IN' 
    + '( SELECT PACKAGE_REF FROM SESSION_PACKAGE WHERE SESSION_REF = ( ? ) )',
    [sessionId]
  )
  return rows.map(dbMapping.map.packageNotification)
}


async function getAllNotification(db) {
  let rows = []
  rows = await dbApi.dbAll(
    db,
    'SELECT DISTINCT PACKAGE_REF AS packageId, NOTICE_MESSAGE AS message FROM PACKAGE_NOTICE'
  )
  if(rows == null) return undefined
  return rows
}


// exports
exports.setNotification = setNotification
exports.deleteNotification = deleteNotification
exports.getNotification = getNotification
exports.getAllNotification = getAllNotification
//# sourceMappingURL=query-package-notification.js.map
