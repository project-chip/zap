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
 * Retrieves clusters on an endpoint.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns promise that resolves into endpoint clusters.
 */
async function queryEndpointClusters(db, endpointTypeId) {
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  C.CLUSTER_ID,
  EC.ENDPOINT_TYPE_CLUSTER_ID,
  EC.ENDPOINT_TYPE_REF,
  C.CODE,
  C.NAME,
  C.MANUFACTURER_CODE,
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

  return rows.map((row) => {
    return {
      clusterId: row['CLUSTER_ID'],
      endpointTypeId: row['ENDPOINT_TYPE_REF'],
      endpointTypeClusterId: row['ENDPOINT_TYPE_CLUSTER_ID'],
      hexCode: '0x' + bin.int16ToHex(row['CODE']),
      manufacturerCode: row['MANUFACTURER_CODE'],
      code: row['CODE'],
      name: row['NAME'],
      side: row['SIDE'],
    }
  })
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
async function queryEndpointClusterAttributes(
  db,
  clusterId,
  side,
  endpointTypeId
) {
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  A.CODE,
  A.NAME,
  A.SIDE,
  A.TYPE,
  A.MIN_LENGTH,
  A.MAX_LENGTH,
  A.MIN,
  A.MAX,
  A.MANUFACTURER_CODE,
  A.IS_WRITABLE,
  A.DEFINE,
  EA.STORAGE_OPTION,
  EA.SINGLETON,
  EA.BOUNDED,
  EA.INCLUDED,
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
  (A.CLUSTER_REF = ? OR A.CLUSTER_REF IS NULL)
  AND A.SIDE = ?
  AND (EA.ENDPOINT_TYPE_REF = ? AND (EA.ENDPOINT_TYPE_CLUSTER_REF =
    (SELECT ENDPOINT_TYPE_CLUSTER_ID
     FROM ENDPOINT_TYPE_CLUSTER
     WHERE CLUSTER_REF = ? AND side = ? AND ENDPOINT_TYPE_REF = ?)))
    `,
    [clusterId, side, endpointTypeId, clusterId, side, endpointTypeId]
  )

  return rows.map((row) => {
    return {
      clusterId: clusterId,
      code: row['CODE'],
      manufacturerCode: row['MANUFACTURER_CODE'],
      hexCode: '0x' + bin.int16ToHex(row['CODE']),
      name: row['NAME'],
      side: row['SIDE'],
      type: row['TYPE'],
      minLength: row['MIN_LENGTH'],
      maxLength: row['MAX_LENGTH'],
      min: row['MIN'],
      max: row['MAX'],
      storage: row['STORAGE_OPTION'],
      isIncluded: row['INCLUDED'],
      isSingleton: row['SINGLETON'],
      isBound: row['BOUNDED'],
      isWritable: row['IS_WRITABLE'],
      defaultValue: row['DEFAULT_VALUE'],
      includedReportable: row['INCLUDED_REPORTABLE'],
      minInterval: row['MIN_INTERVAL'],
      maxInterval: row['MAX_INTERVAL'],
      reportableChange: row['REPORTABLE_CHANGE'],
      define: row['DEFINE'],
    }
  })
}

/**
 * Retrieves endpoint cluster commands.
 *
 * @param {*} db
 * @param {*} clusterId
 * @param {*} endpointTypeId
 * @returns promise that resolves into endpoint cluster commands
 */
async function queryEndpointClusterCommands(db, clusterId, endpointTypeId) {
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  C.NAME,
  C.CODE,
  C.SOURCE,
  C.MANUFACTURER_CODE,
  C.IS_OPTIONAL,
  EC.INCOMING,
  EC.OUTGOING
FROM
  COMMAND AS C
LEFT JOIN
  ENDPOINT_TYPE_COMMAND AS EC
ON
  C.COMMAND_ID = EC.COMMAND_REF
WHERE
  C.CLUSTER_REF = ?
  AND EC.ENDPOINT_TYPE_REF = ?
ORDER BY C.CODE
  `,
    [clusterId, endpointTypeId]
  )

  return rows.map((row) => {
    return {
      name: row['NAME'],
      code: row['CODE'],
      manufacturerCode: row['MANUFACTURER_CODE'],
      isOptional: row['IS_OPTIONAL'],
      source: row['SOURCE'],
      isIncoming: row['INCOMING'],
      isOutgoing: row['OUTGOING'],
      hexCode: '0x' + bin.int8ToHex(row['CODE']),
    }
  })
}

exports.queryEndpoints = queryConfig.getAllEndpoints
exports.queryEndpointClusters = queryEndpointClusters
exports.queryEndpointTypes = queryConfig.getAllEndpointTypes
exports.queryEndpointType = queryConfig.getEndpointType
exports.queryEndpointClusterAttributes = queryEndpointClusterAttributes
exports.queryEndpointClusterCommands = queryEndpointClusterCommands
