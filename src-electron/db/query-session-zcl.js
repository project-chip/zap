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
 * This module provides queries for ZCL static entities
 * inside a single session. Things like:
 *    all visible clusters, etc.
 *
 * @module DB API: zcl database access
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * Returns the cluster available to this session by the code.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns all the cluster objects for a given session.
 */
async function selectSessionClusterByCode(db, sessionId, code) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  C.CLUSTER_ID,
  C.PACKAGE_REF,
  C.CODE,
  C.MANUFACTURER_CODE,
  C.NAME,
  C.DESCRIPTION,
  C.DEFINE,
  C.DOMAIN_NAME,
  C.IS_SINGLETON,
  C.REVISION
FROM
  CLUSTER AS C
INNER JOIN
  SESSION_PACKAGE AS SP
ON
  C.PACKAGE_REF = SP.PACKAGE_REF
WHERE
  SP.SESSION_REF = ? AND C.CODE = ?
`,
      [sessionId, code]
    )
    .then(dbMapping.map.cluster)
}

/**
 * Returns all the clusters visible for a given session.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns all the cluster objects for a given session.
 */
async function selectAllSessionClusters(db, sessionId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  C.CLUSTER_ID,
  C.PACKAGE_REF,
  C.CODE,
  C.MANUFACTURER_CODE,
  C.NAME,
  C.DESCRIPTION,
  C.DEFINE,
  C.DOMAIN_NAME,
  C.IS_SINGLETON,
  C.REVISION
FROM
  CLUSTER AS C
INNER JOIN
  SESSION_PACKAGE AS SP
ON
  C.PACKAGE_REF = SP.PACKAGE_REF
WHERE
  SP.SESSION_REF = ?
`,
      [sessionId]
    )
    .then((rows) => rows.map(dbMapping.map.cluster))
}

/**
 * Returns the attribute available to this session by the code.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns the session attribute
 */
async function selectSessionAttributeByCode(
  db,
  sessionId,
  clusterCode,
  attributeCode
) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  A.ATTRIBUTE_ID,
  A.CLUSTER_REF,
  A.CODE,
  A.MANUFACTURER_CODE,
  A.NAME,
  A.TYPE,
  A.SIDE,
  A.DEFINE,
  A.MIN,
  A.MAX,
  A.REPORT_MIN_INTERVAL,
  A.REPORT_MAX_INTERVAL,
  A.REPORTABLE_CHANGE,
  A.REPORTABLE_CHANGE_LENGTH,
  A.IS_WRITABLE,
  A.DEFAULT_VALUE,
  A.IS_OPTIONAL,
  A.IS_REPORTABLE,
  A.IS_SCENE_REQUIRED,
  A.ARRAY_TYPE
FROM
  ATTRIBUTE AS A
INNER JOIN
  CLUSTER AS C
ON
  A.CLUSTER_REF = C.CLUSTER_ID
INNER JOIN
  SESSION_PACKAGE AS SP
ON
  C.PACKAGE_REF = SP.PACKAGE_REF
WHERE
  SP.SESSION_REF = ? AND C.CODE = ? AND A.CODE = ?
`,
      [sessionId, clusterCode, attributeCode]
    )
    .then(dbMapping.map.attribute)
}

/**
 * Returns the command available to this session by the code.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns the session attribute
 */
async function selectSessionCommandByCode(
  db,
  sessionId,
  clusterCode,
  commandCode
) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  CMD.COMMAND_ID,
  CMD.CLUSTER_REF,
  CMD.PACKAGE_REF,
  CMD.CODE,
  CMD.MANUFACTURER_CODE,
  CMD.NAME,
  CMD.DESCRIPTION,
  CMD.SOURCE,
  CMD.IS_OPTIONAL,
  CMD.RESPONSE_REF
FROM
  COMMAND AS CMD
INNER JOIN
  CLUSTER AS C
ON
  CMD.CLUSTER_REF = C.CLUSTER_ID
INNER JOIN
  SESSION_PACKAGE AS SP
ON
  C.PACKAGE_REF = SP.PACKAGE_REF
WHERE
  SP.SESSION_REF = ? AND C.CODE = ? AND CMD.CODE = ?
`,
      [sessionId, clusterCode, commandCode]
    )
    .then(dbMapping.map.command)
}

exports.selectAllSessionClusters = selectAllSessionClusters
exports.selectSessionClusterByCode = selectSessionClusterByCode
exports.selectSessionAttributeByCode = selectSessionAttributeByCode
exports.selectSessionCommandByCode = selectSessionCommandByCode
