const { int8ToHex } = require('../util/bin.js')
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
 * This module provides queries for endpoint configuration.
 *
 * @module DB API: endpoint configuration queries against the database.
 */
const dbApi = require('./db-api.js')
const queryConfig = require('./query-config.js')
const bin = require('../util/bin.js')

/**
 * Returns promise of all endpoints.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into endpoints rows
 */
function queryEndpoints(db, sessionId) {
  return queryConfig.getAllEndpoints(db, sessionId)
}

/**
 * Returns endpoint types.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into endpoint types rows
 */
function queryEndpointTypes(db, sessionId) {
  return queryConfig.getAllEndpointTypes(db, sessionId)
}

/**
 * Returns endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns promise that resolves into endpoint type
 */
function queryEndpointType(db, endpointTypeId) {
  return queryConfig.getEndpointType(db, endpointTypeId)
}

/**
 * Retrieves clusters on an endpoint.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns promise that resolves into endpoint clusters.
 */
function queryEndpointClusters(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  C.CLUSTER_ID,   
  EC.ENDPOINT_TYPE_CLUSTER_ID,
  EC.ENDPOINT_TYPE_REF,
  C.CODE,
  C.NAME,
  EC.SIDE
FROM
  CLUSTER AS C
LEFT JOIN
  ENDPOINT_TYPE_CLUSTER AS EC
ON
  C.CLUSTER_ID = EC.CLUSTER_REF
WHERE 
  EC.ENABLED = 1
  AND EC.ENDPOINT_TYPE_REF = ?
ORDER BY C.CODE
`,
      [endpointTypeId]
    )
    .then((rows) =>
      rows.map((row) => {
        return {
          clusterId: row['CLUSTER_ID'],
          endpointTypeId: row['ENDPOINT_TYPE_REF'],
          endpointTypeClusterId: row['ENDPOINT_TYPE_CLUSTER_ID'],
          hexCode: '0x' + bin.int16ToHex(row['CODE']),
          code: row['CODE'],
          name: row['NAME'],
          side: row['SIDE'],
        }
      })
    )
}

/**
 * Retrieves endpoint cluster attributes
 *
 * @param {*} db
 * @param {*} clusterId
 * @param {*} side
 * @param {*} endpointTypeId
 * @returns promise that resolves into endpoint cluster attributes
 */
function queryEndpointClusterAttributes(db, clusterId, side, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  A.CODE,
  A.NAME,
  A.SIDE,
  A.TYPE,
  EA.STORAGE_OPTION,
  EA.SINGLETON,
  EA.BOUNDED,
  EA.DEFAULT_VALUE,
  EA.INCLUDED_REPORTABLE,
  EA.MIN_INTERVAL,
  EA.MAX_INTERVAL,
  EA.REPORTABLE_CHANGE
FROM
  ATTRIBUTE AS A
LEFT JOIN
  ENDPOINT_TYPE_ATTRIBUTE AS EA
ON
  A.ATTRIBUTE_ID = EA.ATTRIBUTE_REF
WHERE
  A.CLUSTER_REF = ?
  AND A.SIDE = ?
  AND EA.ENDPOINT_TYPE_REF = ?
    `,
      [clusterId, side, endpointTypeId]
    )
    .then((rows) =>
      rows.map((row) => {
        return {
          clusterId: clusterId,
          code: row['CODE'],
          hexCode: '0x' + bin.int16ToHex(row['CODE']),
          name: row['NAME'],
          side: row['SIDE'],
          type: row['TYPE'],
          storage: row['STORAGE_OPTION'],
          isSingleton: row['SINGLETON'],
          isBound: row['BOUNDED'],
          defaultValue: row['DEFAULT_VALUE'],
          includedReportable: row['INCLUDED_REPORTABLE'],
          minInterval: row['MIN_INTERVAL'],
          maxInterval: row['MAX_INTERVAL'],
          reportableChange: row['REPORTABLE_CHANGE'],
        }
      })
    )
}

/**
 * Retrieves endpoint cluster commands.
 *
 * @param {*} db
 * @param {*} clusterId
 * @param {*} endpointTypeId
 * @returns promise that resolves into endpoint cluster commands
 */
function queryEndpointClusterCommands(db, clusterId, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  C.NAME,
  C.CODE
FROM 
  COMMAND AS C
LEFT JOIN
  ENDPOINT_TYPE_COMMAND AS EC
ON
  C.COMMAND_ID = EC.COMMAND_REF
WHERE
  C.CLUSTER_REF = ?
  AND EC.ENDPOINT_TYPE_REF = ?
  `,
      [clusterId, endpointTypeId]
    )
    .then((rows) =>
      rows.map((row) => {
        return {
          name: row['NAME'],
          code: row['CODE'],
          hexCode: '0x' + bin.int8ToHex(row['CODE']),
        }
      })
    )
}

exports.queryEndpoints = queryEndpoints
exports.queryEndpointClusters = queryEndpointClusters
exports.queryEndpointTypes = queryEndpointTypes
exports.queryEndpointType = queryEndpointType
exports.queryEndpointClusterAttributes = queryEndpointClusterAttributes
exports.queryEndpointClusterCommands = queryEndpointClusterCommands
