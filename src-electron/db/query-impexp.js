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

/**
 * Imports a single endpoint
 * @param {} db
 * @param {*} sessionId
 * @param {*} endpoint
 * @param {*} endpointTypeRef
 */
async function importEndpoint(db, sessionId, endpoint, endpointTypeRef) {
  return dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT (
  SESSION_REF,
  ENDPOINT_TYPE_REF,
  PROFILE,
  ENDPOINT_IDENTIFIER,
  NETWORK_IDENTIFIER,
  DEVICE_VERSION,
  DEVICE_IDENTIFIER
) VALUES (
  ?,
  ?,
  ?,
  ?,
  ?,
  ?,
  ?
)
  `,
    [
      sessionId,
      endpointTypeRef,
      endpoint.profileId,
      endpoint.endpointId,
      endpoint.networkId,
      endpoint.endpointVersion,
      endpoint.deviceIdentifier,
    ]
  )
}

/**
 * Extracts endpoints.
 *
 * @param {*} db
 * @param {*} sessionId
 */
async function exportEndpoints(db, sessionId, endpointTypes) {
  let endpointTypeIndex = (epts, endpointTypeRef) => {
    return epts.findIndex((value) => value.endpointTypeId == endpointTypeRef)
  }

  let mapFunction = (x) => {
    return {
      endpointTypeName: x.NAME,
      endpointTypeIndex: endpointTypeIndex(endpointTypes, x.ENDPOINT_TYPE_REF),
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      profileId: x.PROFILE,
      endpointId: x.ENDPOINT_IDENTIFIER,
      networkId: x.NETWORK_IDENTIFIER,
      endpointVersion: x.DEVICE_VERSION,
      deviceIdentifier: x.DEVICE_IDENTIFIER,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE.NAME,
  ENDPOINT.ENDPOINT_TYPE_REF,
  ENDPOINT.PROFILE,
  ENDPOINT.ENDPOINT_IDENTIFIER,
  ENDPOINT.NETWORK_IDENTIFIER,
  ENDPOINT.DEVICE_VERSION,
  ENDPOINT.DEVICE_IDENTIFIER
FROM
  ENDPOINT
LEFT JOIN
  ENDPOINT_TYPE
ON
  ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
WHERE
  ENDPOINT.SESSION_REF = ?
ORDER BY ENDPOINT.ENDPOINT_IDENTIFIER
    `,
      [sessionId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Extracts raw endpoint types rows.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
async function exportEndpointTypes(db, sessionId) {
  let mapFunction = (x) => {
    return {
      endpointTypeId: x.ENDPOINT_TYPE_ID,
      name: x.NAME,
      deviceTypeName: x.DEVICE_TYPE_NAME,
      deviceTypeCode: x.DEVICE_TYPE_CODE,
      deviceTypeProfileId: x.DEVICE_TYPE_PROFILE_ID,
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
  DEVICE_TYPE.PROFILE_ID as DEVICE_TYPE_PROFILE_ID,
  DEVICE_TYPE.NAME AS DEVICE_TYPE_NAME
FROM
  ENDPOINT_TYPE
LEFT JOIN
  DEVICE_TYPE
ON
  ENDPOINT_TYPE.DEVICE_TYPE_REF = DEVICE_TYPE.DEVICE_TYPE_ID
LEFT JOIN
  ENDPOINT
ON
ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
WHERE ENDPOINT_TYPE.SESSION_REF = ? 
ORDER BY ENDPOINT.ENDPOINT_IDENTIFIER, ENDPOINT_TYPE.NAME, DEVICE_TYPE_CODE, DEVICE_TYPE_PROFILE_ID`,
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
async function importEndpointType(db, sessionId, packageId, endpointType) {
  // Each endpoint has: 'name', 'deviceTypeName', 'deviceTypeCode', `deviceTypeProfileId`, 'clusters', 'commands', 'attributes'
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
  (SELECT DEVICE_TYPE_ID FROM DEVICE_TYPE WHERE CODE = ? AND PROFILE_ID = ? AND PACKAGE_REF = ?)
)`,
    [
      sessionId,
      endpointType.name,
      parseInt(endpointType.deviceTypeCode),
      parseInt(endpointType.deviceTypeProfileId),
      packageId,
    ]
  )
}

/**
 * Exports packages for externalized form.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise of a data that is listing all the packages in the session.
 */
async function exportPackagesFromSession(db, sessionId) {
  let mapFunction = (x) => {
    return {
      path: x.PATH,
      version: x.VERSION,
      type: x.TYPE,
      required: x.REQUIRED,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  PACKAGE.PATH,
  PACKAGE.VERSION,
  PACKAGE.TYPE,
  SESSION_PACKAGE.REQUIRED
FROM PACKAGE
INNER JOIN SESSION_PACKAGE
ON PACKAGE.PACKAGE_ID = SESSION_PACKAGE.PACKAGE_REF
WHERE SESSION_PACKAGE.SESSION_REF = ? AND SESSION_PACKAGE.ENABLED = 1`,
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
async function exportClustersFromEndpointType(db, endpointTypeId) {
  let mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      define: x.DEFINE,
      side: x.SIDE,
      enabled: x.ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
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
  CLUSTER.DEFINE,
  ENDPOINT_TYPE_CLUSTER.SIDE,
  ENDPOINT_TYPE_CLUSTER.ENABLED,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
FROM CLUSTER
INNER JOIN ENDPOINT_TYPE_CLUSTER
ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?
ORDER BY CLUSTER.CODE, CLUSTER.NAME`,
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
async function importClusterForEndpointType(
  db,
  packageId,
  endpointTypeId,
  cluster
) {
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
      ? [endpointTypeId, packageId, cluster.code, cluster.side, cluster.enabled]
      : [
          endpointTypeId,
          packageId,
          cluster.code,
          cluster.mfgCode,
          cluster.side,
          cluster.enabled,
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
async function exportAttributesFromEndpointTypeCluster(
  db,
  endpointTypeId,
  endpointClusterId
) {
  let mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      side: x.SIDE,
      included: x.INCLUDED,
      storageOption: x.STORAGE_OPTION,
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
  ATTRIBUTE.SIDE,
  ENDPOINT_TYPE_ATTRIBUTE.INCLUDED,
  ENDPOINT_TYPE_ATTRIBUTE.STORAGE_OPTION,
  ENDPOINT_TYPE_ATTRIBUTE.SINGLETON,
  ENDPOINT_TYPE_ATTRIBUTE.BOUNDED,
  ENDPOINT_TYPE_ATTRIBUTE.DEFAULT_VALUE,
  ENDPOINT_TYPE_ATTRIBUTE.INCLUDED_REPORTABLE,
  ENDPOINT_TYPE_ATTRIBUTE.MIN_INTERVAL,
  ENDPOINT_TYPE_ATTRIBUTE.MAX_INTERVAL,
  ENDPOINT_TYPE_ATTRIBUTE.REPORTABLE_CHANGE
FROM
  ATTRIBUTE
INNER JOIN
  ENDPOINT_TYPE_ATTRIBUTE
ON
  ATTRIBUTE.ATTRIBUTE_ID = ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF
WHERE
  ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF = ?
  AND ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ?
ORDER BY
  ATTRIBUTE.MANUFACTURER_CODE, ATTRIBUTE.CODE
    `,
      [endpointTypeId, endpointClusterId]
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
async function importAttributeForEndpointType(
  db,
  packageId,
  endpointTypeId,
  endpointClusterId,
  attribute
) {
  let arg = [
    endpointTypeId,
    endpointClusterId,
    attribute.code,
    packageId,
    endpointClusterId,
  ]
  if (attribute.mfgCode != null) arg.push(attribute.mfgCode)
  arg.push(
    attribute.included,
    attribute.storageOption,
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
  STORAGE_OPTION,
  SINGLETON,
  BOUNDED,
  DEFAULT_VALUE,
  INCLUDED_REPORTABLE,
  MIN_INTERVAL,
  MAX_INTERVAL,
  REPORTABLE_CHANGE )
VALUES
( ?, ?,
  ( SELECT ATTRIBUTE_ID FROM ATTRIBUTE, ENDPOINT_TYPE_CLUSTER
    WHERE ATTRIBUTE.CODE = ?
    AND ATTRIBUTE.PACKAGE_REF = ?
    AND ATTRIBUTE.SIDE = ENDPOINT_TYPE_CLUSTER.SIDE
    AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ?
    AND (ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = ATTRIBUTE.CLUSTER_REF
      OR ATTRIBUTE.CLUSTER_REF IS NULL
      )
    AND ${
      attribute.mfgCode == null
        ? 'MANUFACTURER_CODE IS NULL'
        : 'MANUFACTURER_CODE = ?'
    }),
    ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    arg
  )
}

/**
 * Returns a promise of data for commands inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
async function exportCommandsFromEndpointTypeCluster(
  db,
  endpointTypeId,
  endpointClusterId
) {
  let mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      source: x.SOURCE,
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
  COMMAND.SOURCE,
  ENDPOINT_TYPE_COMMAND.INCOMING,
  ENDPOINT_TYPE_COMMAND.OUTGOING
FROM
  COMMAND
INNER JOIN
  ENDPOINT_TYPE_COMMAND
ON
  COMMAND.COMMAND_ID = ENDPOINT_TYPE_COMMAND.COMMAND_REF
WHERE
  ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ?
  AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ?
ORDER BY
  COMMAND.MANUFACTURER_CODE, COMMAND.CODE
        `,
      [endpointTypeId, endpointClusterId]
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
async function importCommandForEndpointType(
  db,
  packageId,
  endpointTypeId,
  endpointClusterId,
  command
) {
  let arg = [
    endpointTypeId,
    endpointClusterId,
    command.code,
    command.source,
    packageId,
    endpointClusterId,
  ]
  if (command.mfgCode != null) arg.push(command.mfgCode)
  arg.push(command.incoming, command.outgoing)
  return dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT_TYPE_COMMAND
( ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER_REF,
  COMMAND_REF,
  INCOMING,
  OUTGOING )
VALUES
  ( ?, ?,
    ( SELECT COMMAND_ID
      FROM COMMAND, ENDPOINT_TYPE_CLUSTER WHERE
        COMMAND.CODE = ?
        AND COMMAND.SOURCE = ?
        AND COMMAND.PACKAGE_REF = ?
        AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ?
        AND COMMAND.CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
        AND ${
          command.mfgCode == null
            ? 'MANUFACTURER_CODE IS NULL'
            : 'MANUFACTURER_CODE = ?'
        }),
    ?,
    ?
    )
  `,
    arg
  )
}

/**
 * Extracts endpoint type ids.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
async function exportEndPointTypeIds(db, sessionId) {
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
 * Returns the count of the number of cluster commands with cli for a cluster
 * @param {*} db
 * @param {*} endpointTypes
 * @param {*} endpointClusterId
 */
async function exportCliCommandCountFromEndpointTypeCluster(
  db,
  endpointTypes,
  endpointClusterId
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COUNT(*) AS COUNT
FROM
  COMMAND
INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
INNER JOIN PACKAGE_OPTION
  ON PACKAGE_OPTION.OPTION_CODE = COMMAND.NAME
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
  AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ?
        `,
      [endpointClusterId]
    )
    .then((res) => res[0].COUNT)
}

exports.exportEndpointTypes = exportEndpointTypes
exports.importEndpointType = importEndpointType
exports.exportClustersFromEndpointType = exportClustersFromEndpointType
exports.importClusterForEndpointType = importClusterForEndpointType
exports.exportPackagesFromSession = exportPackagesFromSession
exports.exportAttributesFromEndpointTypeCluster = exportAttributesFromEndpointTypeCluster
exports.importAttributeForEndpointType = importAttributeForEndpointType
exports.exportCommandsFromEndpointTypeCluster = exportCommandsFromEndpointTypeCluster
exports.importCommandForEndpointType = importCommandForEndpointType
exports.exportEndpoints = exportEndpoints
exports.importEndpoint = importEndpoint
exports.exportEndPointTypeIds = exportEndPointTypeIds
exports.exportCliCommandCountFromEndpointTypeCluster = exportCliCommandCountFromEndpointTypeCluster
