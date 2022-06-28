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
 * Sets the session upgrade flag to false.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves with the number of rows updated.
 */
async function setUpgrade(db, upgrade, status) {
  return dbApi.dbUpdate(
    db,
    'INSERT OR REPLACE INTO UPGRADE ( UPGRADE, STATUS ) VALUES ( ?, ?)',
    [upgrade, status]
  )
}

async function updateUpgrade(db, upgrade, status) {
  return dbApi.dbUpdate(
    db,
    'UPDATE UPGRADE SET ( UPGRADE, STATUS ) = ( ?, ?)',
    [upgrade, status]
  )
}

/**
 * Resolves with true or false, depending whether this upgrade flag is set.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves into true or false, reflecting upgrade state.
 */
async function getUpgradeFlag(db, sessionId) {
  let row = await dbApi.dbGet(db, 'SELECT UPGRADE FROM UPGRADE')
  if (row == null) {
    return undefined
  } else {
    return dbApi.fromDbBool(row.UPGRADE)
  }
}

/**
 * Sets the upgrade status.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves with the number of rows updated.
 */
async function setUpgradeStatus(db, status) {
  return dbApi.dbUpdate(db, 'UPDATE UPGRADE SET STATUS = 1')
}

/**
 * Returns the status of the Upgrade.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves into string, reflecting upgrade status.
 */
async function getUpgradeStatus(db) {
  let row = await dbApi.dbGet(db, 'SELECT STATUS FROM UPGRADE')
  return row
}

// exports
exports.setUpgrade = setUpgrade
exports.updateUpgrade = updateUpgrade
exports.getUpgradeFlag = getUpgradeFlag
exports.setUpgradeStatus = setUpgradeStatus
exports.getUpgradeStatus = getUpgradeStatus
