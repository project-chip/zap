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
 * This module provides queries related to imports and exports of files.
 *
 * @module DB API: package-based queries.
 */
const dbApi = require('./db-api.js')
const env = require('../util/env.js')

/**
 * Extracts raw endpoint types rows.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
function exportEndpointTypes(db, sessionId) {
  var mapFunction = (x) => {
    return {
      endpointTypeId: x.ENDPOINT_TYPE_ID,
      name: x.NAME,
      deviceTypeName: x.DEVICE_TYPE_NAME,
      deviceTypeCode: x.DEVICE_TYPE_CODE,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT 
  ENDPOINT_TYPE.ENDPOINT_TYPE_ID, 
  ENDPOINT_TYPE.NAME, 
  ENDPOINT_TYPE.DEVICE_TYPE_REF,
  DEVICE_TYPE.CODE AS DEVICE_TYPE_CODE,
  DEVICE_TYPE.NAME AS DEVICE_TYPE_NAME
FROM 
  ENDPOINT_TYPE 
LEFT JOIN
  DEVICE_TYPE
ON 
  ENDPOINT_TYPE.DEVICE_TYPE_REF = DEVICE_TYPE.DEVICE_TYPE_ID
WHERE ENDPOINT_TYPE.SESSION_REF = ? ORDER BY ENDPOINT_TYPE.NAME`,
      [sessionId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Imports an endpoint type, resolving other data along the way.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageId
 * @param {*} endpointType
 * @returns Promise of endpoint insertion.
 */
function importEndpointType(db, sessionId, packageId, endpointType) {
  // Each endpoint has: 'name', 'deviceTypeName', 'deviceTypeCode', 'clusters', 'commands', 'attributes'
  return dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT_TYPE (
  SESSION_REF, 
  NAME, 
  DEVICE_TYPE_REF
) VALUES(
  ?, 
  ?, 
  (SELECT DEVICE_TYPE_ID FROM DEVICE_TYPE WHERE CODE = ? AND PACKAGE_REF = ?)
)`,
    [sessionId, endpointType.name, endpointType.deviceTypeCode, packageId]
  )
}

/**
 * Exports packages for externalized form.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise of a data that is listing all the packages in the session.
 */
function exportPackagesFromSession(db, sessionId) {
  var mapFunction = (x) => {
    return {
      path: x.PATH,
      version: x.VERSION,
      type: x.TYPE,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT 
  PACKAGE.PATH,
  PACKAGE.VERSION,
  PACKAGE.TYPE
FROM PACKAGE
INNER JOIN SESSION_PACKAGE
ON PACKAGE.PACKAGE_ID = SESSION_PACKAGE.PACKAGE_REF
WHERE SESSION_PACKAGE.SESSION_REF = ?`,
      [sessionId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Exports clusters to an externalized form.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the data that should go into the external form.
 */
function exportClustersFromEndpointType(db, endpointTypeId) {
  var mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      side: x.SIDE,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT 
  CLUSTER.CODE, 
  CLUSTER.MANUFACTURER_CODE,
  CLUSTER.NAME,
  ENDPOINT_TYPE_CLUSTER.SIDE
FROM CLUSTER
INNER JOIN ENDPOINT_TYPE_CLUSTER
ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
WHERE ENDPOINT_TYPE_CLUSTER.ENABLED = 1 AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?`,
      [endpointTypeId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Imports a single cluster to endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} cluster Object populated same way as export method leaves it.
 * @returns Promise of an imported cluster.
 */
function importClusterForEndpointType(db, packageId, endpointTypeId, cluster) {
  return dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT_TYPE_CLUSTER 
  (ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED) 
VALUES
  (?, 
   (SELECT CLUSTER_ID FROM CLUSTER WHERE PACKAGE_REF = ? AND CODE = ? AND ${
     cluster.mfgCode == null
       ? 'MANUFACTURER_CODE IS NULL'
       : 'MANUFACTURER_CODE = ?'
   }),
   ?,
   ?)`,
    cluster.mfgCode == null
      ? [endpointTypeId, packageId, cluster.code, cluster.side, 1]
      : [
          endpointTypeId,
          packageId,
          cluster.code,
          cluster.mfgCode,
          cluster.side,
          1,
        ]
  )
}

/**
 * Returns a promise of data for attributes inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the attribute data.
 */
function exportAttributesFromEndpointType(db, endpointTypeId) {
  var mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      external: x.EXTERNAL,
      flash: x.FLASH,
      singleton: x.SINGLETON,
      bounded: x.BOUNDED,
      defaultValue: x.DEFAULT_VALUE,
      reportable: x.INCLUDED_REPORTABLE,
      minInterval: x.MIN_INTERVAL,
      maxInterval: x.MAX_INTERVAL,
      reportableChange: x.REPORTABLE_CHANGE,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ATTRIBUTE.NAME,
  ATTRIBUTE.CODE,
  ATTRIBUTE.MANUFACTURER_CODE,
  ENDPOINT_TYPE_ATTRIBUTE.EXTERNAL,
  ENDPOINT_TYPE_ATTRIBUTE.FLASH,
  ENDPOINT_TYPE_ATTRIBUTE.SINGLETON,
  ENDPOINT_TYPE_ATTRIBUTE.BOUNDED,
  ENDPOINT_TYPE_ATTRIBUTE.DEFAULT_VALUE,
  ENDPOINT_TYPE_ATTRIBUTE.INCLUDED_REPORTABLE,
  ENDPOINT_TYPE_ATTRIBUTE.MIN_INTERVAL,
  ENDPOINT_TYPE_ATTRIBUTE.MAX_INTERVAL,
  ENDPOINT_TYPE_ATTRIBUTE.REPORTABLE_CHANGE
FROM ATTRIBUTE
INNER JOIN ENDPOINT_TYPE_ATTRIBUTE
ON ATTRIBUTE.ATTRIBUTE_ID = ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF
WHERE ENDPOINT_TYPE_ATTRIBUTE.INCLUDED = 1 AND ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF = ?
    `,
      [endpointTypeId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Imports an attribute information of an endpoint type.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} endpointTypeId
 * @param {*} endpointClusterId may be null if global attribute
 * @param {*} attribute
 * @returns Promise of an attribute insertion.
 */
function importAttributeForEndpointType(
  db,
  packageId,
  endpointTypeId,
  endpointClusterId,
  attribute
) {
  var arg = [endpointTypeId, endpointClusterId, attribute.code, packageId]
  if (attribute.mfgCode != null) arg.push(attribute.mfgCode)
  arg.push(
    1,
    attribute.external,
    attribute.flash,
    attribute.singleton,
    attribute.bounded,
    attribute.defaultValue,
    attribute.reportable,
    attribute.minInterval,
    attribute.maxInterval,
    attribute.reportableChange
  )
  return dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT_TYPE_ATTRIBUTE
( ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER_REF,
  ATTRIBUTE_REF,
  INCLUDED,
  EXTERNAL,
  FLASH,
  SINGLETON,
  BOUNDED,
  DEFAULT_VALUE,
  INCLUDED_REPORTABLE,
  MIN_INTERVAL,
  MAX_INTERVAL,
  REPORTABLE_CHANGE )
VALUES
( ?, ?,
  ( SELECT ATTRIBUTE_ID FROM ATTRIBUTE
    WHERE CODE = ?
    AND PACKAGE_REF = ?
    AND ${
      attribute.mfgCode == null
        ? 'MANUFACTURER_CODE IS NULL'
        : 'MANUFACTURER_CODE = ?'
    }),
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    arg
  )
  return Promise.resolve(1)
}

/**
 * Returns a promise of data for commands inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
function exportCommandsFromEndpointType(db, endpointTypeId) {
  var mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    COMMAND.NAME,
    COMMAND.CODE,
    COMMAND.MANUFACTURER_CODE,
    ENDPOINT_TYPE_COMMAND.INCOMING,
    ENDPOINT_TYPE_COMMAND.OUTGOING
  FROM COMMAND
  INNER JOIN ENDPOINT_TYPE_COMMAND
  ON COMMAND.COMMAND_ID = ENDPOINT_TYPE_COMMAND.COMMAND_REF
  WHERE ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ?
        `,
      [endpointTypeId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Imports a command information of an endpoint type.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} endpointTypeId
 * @param {*} endpointClusterId may be null if global command
 * @param {*} command
 * @returns Promise of a command insertion.
 */
function importCommandForEndpointType(
  db,
  packageId,
  endpointTypeId,
  endpointClusterId,
  command
) {
  return Promise.resolve(1)
}

exports.exportEndpointTypes = exportEndpointTypes
exports.importEndpointType = importEndpointType

exports.exportClustersFromEndpointType = exportClustersFromEndpointType
exports.importClusterForEndpointType = importClusterForEndpointType

exports.exportPackagesFromSession = exportPackagesFromSession

exports.exportAttributesFromEndpointType = exportAttributesFromEndpointType
exports.importAttributeForEndpointType = importAttributeForEndpointType

exports.exportCommandsFromEndpointType = exportCommandsFromEndpointType
exports.importCommandForEndpointType = importCommandForEndpointType
