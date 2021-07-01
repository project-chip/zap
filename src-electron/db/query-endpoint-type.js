/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * This module provides queries for endpoint type.
 *
 * @module DB API: endpoint type queries against the database.
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

/**
 * Promise to delete an endpoint type.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} id
 */

async function deleteEndpointType(db, id) {
  return dbApi.dbRemove(
    db,
    'DELETE FROM ENDPOINT_TYPE WHERE ENDPOINT_TYPE_ID = ?',
    [id]
  )
}

/**
 * Extracts raw endpoint types rows.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
async function selectAllEndpointTypes(db, sessionId) {
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  ENDPOINT_TYPE_ID,
  NAME,
  DEVICE_TYPE_REF,
  SESSION_REF
FROM
  ENDPOINT_TYPE
WHERE SESSION_REF = ? ORDER BY NAME`,
    [sessionId]
  )
  return rows.map(dbMapping.map.endpointType)
}

/**
 * Extracts endpoint type ids.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
async function selectEndpointTypeIds(db, sessionId) {
  let mapFunction = (x) => {
    return {
      endpointTypeId: x.ENDPOINT_TYPE_ID,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE.ENDPOINT_TYPE_ID
FROM
  ENDPOINT_TYPE
LEFT JOIN
  DEVICE_TYPE
ON
  ENDPOINT_TYPE.DEVICE_TYPE_REF = DEVICE_TYPE.DEVICE_TYPE_ID
WHERE
  ENDPOINT_TYPE.SESSION_REF = ?
ORDER BY ENDPOINT_TYPE.NAME`,
      [sessionId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Extracts endpoint type ids which belong to user endpoints.
 * There have been occasions when the endpoint types are present
 * but they do not belong to any endpoints.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
async function selectUsedEndpointTypeIds(db, sessionId) {
  let mapFunction = (x) => {
    return {
      endpointTypeId: x.ENDPOINT_TYPE_ID,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE.ENDPOINT_TYPE_ID
FROM
  ENDPOINT_TYPE
INNER JOIN
  ENDPOINT
ON
  ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT.ENDPOINT_TYPE_REF
LEFT JOIN
  DEVICE_TYPE
ON
  ENDPOINT_TYPE.DEVICE_TYPE_REF = DEVICE_TYPE.DEVICE_TYPE_ID
WHERE
  ENDPOINT_TYPE.SESSION_REF = ?
ORDER BY ENDPOINT_TYPE.NAME`,
      [sessionId]
    )
    .then((rows) => rows.map(mapFunction))
}

exports.deleteEndpointType = deleteEndpointType
exports.selectAllEndpointTypes = selectAllEndpointTypes
exports.selectEndpointTypeIds = selectEndpointTypeIds
exports.selectUsedEndpointTypeIds = selectUsedEndpointTypeIds
