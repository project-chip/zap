/**
 *
 *    Copyright (c) 2025 Silicon Labs
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
 * This module provides queries for upgrade rules.
 *
 * @module DB API: endpoint configuration queries against the database.
 */

const dbApi = require('./db-api.js')
const bin = require('../util/bin')
const dbMapping = require('./db-mapping.js')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * Returns a promise resolving into all endpoints.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} category
 * @returns Promise resolving into all endpoints.
 */
async function selectAllEndpoints(db, sessionId, category) {
  let categorySqlJoinString = category
    ? `
LEFT JOIN
  ENDPOINT_TYPE
ON
  E1.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
LEFT JOIN
  ENDPOINT_TYPE_DEVICE
ON
  ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
LEFT JOIN
  DEVICE_TYPE
ON
  ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE.DEVICE_TYPE_ID
LEFT JOIN
  PACKAGE
ON
  PACKAGE.PACKAGE_ID = DEVICE_TYPE.PACKAGE_REF`
    : ``

  let categorySqlSelectString = category
    ? `,
  PACKAGE.CATEGORY`
    : ``

  let categorySqlWhereString = category
    ? `AND
  PACKAGE.CATEGORY = '${category}'`
    : ``
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  E1.ENDPOINT_ID,
  E1.SESSION_REF,
  E1.ENDPOINT_TYPE_REF,
  E1.PROFILE,
  E1.ENDPOINT_IDENTIFIER,
  E1.NETWORK_IDENTIFIER,
  E2.ENDPOINT_ID AS PARENT_ENDPOINT_REF,
  E2.ENDPOINT_IDENTIFIER AS PARENT_ENDPOINT_IDENTIFIER
  ${categorySqlSelectString}
FROM
  ENDPOINT AS E1
LEFT JOIN
  ENDPOINT AS E2
ON
  E2.ENDPOINT_ID = E1.PARENT_ENDPOINT_REF
${categorySqlJoinString}
WHERE
  E1.SESSION_REF = ?
${categorySqlWhereString}
ORDER BY
  E1.ENDPOINT_IDENTIFIER
    `,
    [sessionId]
  )
  return rows.map(dbMapping.map.endpointExtended)
}

exports.selectAllEndpoints = selectAllEndpoints
