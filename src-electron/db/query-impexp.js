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
const dbApi = require('./db-api')
const dbEnums = require('../../src-shared/db-enum')
const dbMapping = require('./db-mapping.js')
const queryUpgrade = require('../matter/matter.js')
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
  PARENT_ENDPOINT_REF
) VALUES (
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
      endpoint.parent,
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
  let endpointTypeIndexFunction = (epts, endpointTypeRef) => {
    return epts.findIndex((value) => value.endpointTypeId == endpointTypeRef)
  }

  let mapFunction = (x) => {
    return {
      endpointTypeName: x.NAME,
      endpointTypeIndex: endpointTypeIndexFunction(
        endpointTypes,
        x.ENDPOINT_TYPE_REF
      ),
      endpointTypeRef: x.ENDPOINT_TYPE_REF,
      profileId: x.PROFILE,
      endpointId: x.ENDPOINT_IDENTIFIER,
      networkId: x.NETWORK_IDENTIFIER,
      parentRef: x.PARENT_ENDPOINT_REF,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ET.NAME,
  E.ENDPOINT_TYPE_REF,
  E.PROFILE,
  E.ENDPOINT_IDENTIFIER,
  E.NETWORK_IDENTIFIER,
  E.PARENT_ENDPOINT_REF
FROM
  ENDPOINT AS E
LEFT JOIN
  ENDPOINT_TYPE AS ET
ON
  E.ENDPOINT_TYPE_REF = ET.ENDPOINT_TYPE_ID
WHERE
  E.SESSION_REF = ?
ORDER BY E.ENDPOINT_IDENTIFIER
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
  // retreive all endpoint types
  let endpointTypes = await dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE.ENDPOINT_TYPE_ID,
  ENDPOINT_TYPE.NAME,
  ROW_NUMBER() OVER(ORDER BY ENDPOINT.ENDPOINT_IDENTIFIER) AS ENDPOINT_TYPE_INDEX
FROM
  ENDPOINT_TYPE
LEFT JOIN
  ENDPOINT
ON
  ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
WHERE
  ENDPOINT_TYPE.SESSION_REF = ?
ORDER BY
  ENDPOINT.ENDPOINT_IDENTIFIER,
  ENDPOINT_TYPE.NAME`,
      [sessionId]
    )
    .then((rows) => rows.map(dbMapping.map.endpointTypeExport))

  //Associate each endpoint type to the device types
  for (let i = 0; i < endpointTypes.length; i++) {
    let rows = await dbApi.dbAll(
      db,
      `
      SELECT
        DEVICE_TYPE.DEVICE_TYPE_ID,
        DEVICE_TYPE.CODE,
        DEVICE_TYPE.NAME,
        DEVICE_TYPE.PROFILE_ID,
        ENDPOINT_TYPE_DEVICE.DEVICE_VERSION
      FROM 
        DEVICE_TYPE
      LEFT JOIN
        ENDPOINT_TYPE_DEVICE
      ON
        ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF = DEVICE_TYPE.DEVICE_TYPE_ID
      INNER JOIN
        ENDPOINT_TYPE
      ON
        ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF
      WHERE
        ENDPOINT_TYPE.SESSION_REF = ?
        AND ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF = ?
      ORDER BY
        DEVICE_TYPE.NAME,
        DEVICE_TYPE.CODE,
        DEVICE_TYPE.PROFILE_ID`,
      [sessionId, endpointTypes[i].endpointTypeId]
    )

    // Updating the device type info for the endpoint
    endpointTypes[i].deviceVersions = rows.map((x) => x.DEVICE_VERSION)
    endpointTypes[i].deviceIdentifiers = rows.map((x) => x.CODE)
    endpointTypes[i].deviceTypes = rows.map(dbMapping.map.deviceTypeExport)

    // Loading endpointTypeRef as primary endpointType for backwards compatibility
    endpointTypes[i].deviceTypeRef = endpointTypes[i].deviceTypes[0]
    endpointTypes[i].deviceTypeName = endpointTypes[i].deviceTypeRef
      ? endpointTypes[i].deviceTypeRef.name
      : ''
    endpointTypes[i].deviceTypeCode = endpointTypes[i].deviceTypeRef
      ? endpointTypes[i].deviceTypeRef.code
      : ''
    endpointTypes[i].deviceTypeProfileId = endpointTypes[i].deviceTypeRef
      ? endpointTypes[i].deviceTypeRef.profileId
      : ''
  }
  return endpointTypes
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
async function importEndpointType(db, sessionId, packageIds, endpointType) {
  // Insert endpoint type
  let endpointTypeId = await dbApi.dbInsert(
    db,
    `
  INSERT INTO
    ENDPOINT_TYPE (
      SESSION_REF,
      NAME
    ) VALUES (?, ?)`,
    [sessionId, endpointType.name]
  )

  // Process device types
  let deviceTypes = []
  let deviceVersions = endpointType.deviceVersions
    ? endpointType.deviceVersions
    : [endpointType.deviceVersion]
  let deviceIdentifiers = endpointType.deviceIdentifiers
    ? endpointType.deviceIdentifiers
    : [
        endpointType.deviceIdentifier
          ? endpointType.deviceIdentifier
          : endpointType.deviceTypeCode,
      ]
  if (endpointType.deviceTypes) {
    deviceTypes = endpointType.deviceTypes
  } else {
    deviceTypes = [
      {
        name:
          endpointType.deviceTypeName != null
            ? endpointType.deviceTypeName
            : endpointType.name, // Else case for backwards compatibility of old zap files
        code:
          endpointType.deviceTypeCode != null
            ? endpointType.deviceTypeCode
            : endpointType.deviceIdentifier, // Else case for backwards compatibility of old zap files
        profileId: endpointType.deviceTypeProfileId,
      },
    ]
  }

  let promises = []
  for (let i = 0; i < deviceTypes.length; i++) {
    // Retrieve profile Id if not found
    if (!deviceTypes[i].profileId) {
      let profileId = await dbApi.dbGet(
        db,
        `SELECT PROFILE_ID FROM DEVICE_TYPE WHERE CODE = ? AND NAME = ? AND PACKAGE_REF IN (${packageIds})`,
        [parseInt(deviceTypes[i].code), deviceTypes[i].name]
      )
      deviceTypes[i].profileId = profileId ? profileId.PROFILE_ID : ''
    }
    // Get deviceType IDs
    let rows = await dbApi.dbAll(
      db,
      `SELECT DEVICE_TYPE_ID FROM DEVICE_TYPE WHERE CODE = ? AND PROFILE_ID = ? AND NAME = ? AND PACKAGE_REF IN (${packageIds})`,
      [
        parseInt(deviceTypes[i].code),
        parseInt(deviceTypes[i].profileId),
        deviceTypes[i].name,
      ]
    )

    // Associate deviceTypes with the endpointType
    for (let row of rows) {
      promises.push(
        dbApi.dbInsert(
          db,
          'INSERT OR REPLACE INTO ENDPOINT_TYPE_DEVICE(ENDPOINT_TYPE_REF, DEVICE_TYPE_REF, DEVICE_TYPE_ORDER, DEVICE_VERSION, DEVICE_IDENTIFIER) VALUES(?, ?, ?, ?, ?)',
          [
            endpointTypeId,
            row.DEVICE_TYPE_ID,
            i,
            deviceVersions[i] ? deviceVersions[i] : 0,
            deviceIdentifiers[i],
          ]
        )
      )
    }
  }

  await Promise.all(promises)
  return endpointTypeId
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
      category: x.CATEGORY,
      version: x.VERSION,
      description: x.DESCRIPTION,
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
  PACKAGE.CATEGORY,
  PACKAGE.VERSION,
  PACKAGE.DESCRIPTION,
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
    let result = {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      define: x.DEFINE,
      side: x.SIDE,
      enabled: x.ENABLED,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
    }

    // Separate out check so that JSON dump does not contain empty keys
    if (x.API_MATURITY) {
      result.apiMaturity = x.API_MATURITY
    }

    return result
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
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  CLUSTER.API_MATURITY
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
  packageIds,
  endpointTypeId,
  cluster
) {
  let matchedPackageId = await dbApi
    .dbAll(
      db,
      `SELECT CLUSTER_ID, PACKAGE_REF FROM CLUSTER WHERE PACKAGE_REF IN (${dbApi.toInClause(
        packageIds
      )}) AND CODE = ? AND ${
        cluster.mfgCode == null
          ? 'MANUFACTURER_CODE IS NULL'
          : 'MANUFACTURER_CODE = ?'
      }`,
      cluster.mfgCode == null ? [cluster.code] : [cluster.code, cluster.mfgCode]
    )
    .then((matchedPackageIds) => matchedPackageIds.shift()?.PACKAGE_REF)

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
      ? [
          endpointTypeId,
          matchedPackageId,
          cluster.code,
          cluster.side,
          cluster.enabled,
        ]
      : [
          endpointTypeId,
          matchedPackageId,
          cluster.code,
          cluster.mfgCode,
          cluster.side,
          cluster.enabled,
        ]
  )
}

/**
 * Returns a promise of data for events inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} endpointClusterId
 * @returns Promise that resolves with the events data.
 */
async function exportEventsFromEndpointTypeCluster(
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
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  E.NAME,
  E.CODE,
  E.MANUFACTURER_CODE,
  E.SIDE,
  ETE.INCLUDED
FROM
  EVENT AS E
INNER JOIN
  ENDPOINT_TYPE_EVENT AS ETE
ON
  E.EVENT_ID = ETE.EVENT_REF
WHERE
  ETE.ENDPOINT_TYPE_REF = ?
  AND ETE.ENDPOINT_TYPE_CLUSTER_REF = ?
ORDER BY
  E.CODE, E.MANUFACTURER_CODE
  `,
      [endpointTypeId, endpointClusterId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Imports an event information of an endpoint type.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} endpointTypeId
 * @param {*} endpointClusterId
 * @param {*} event
 * @returns Promise of an event insertion.
 */
async function importEventForEndpointType(
  db,
  packageIds,
  endpointTypeId,
  endpointClusterId,
  event
) {
  let selectEventQuery = `
SELECT
  E.EVENT_ID
FROM
  EVENT AS E
INNER JOIN
  ENDPOINT_TYPE_CLUSTER AS ETC
ON
  E.CLUSTER_REF = ETC.CLUSTER_REF
WHERE
  E.CODE = ?
  AND E.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
  AND E.SIDE = ETC.SIDE
  AND ETC.ENDPOINT_TYPE_CLUSTER_ID = ?
  AND ${
    event.mfgCode == null
      ? 'E.MANUFACTURER_CODE IS NULL'
      : 'E.MANUFACTURER_CODE = ?'
  }`

  let selectArgs = [event.code, endpointClusterId]
  if (event.mfgCode != null) selectArgs.push(event.mfgCode)

  let eRow = await dbApi.dbAll(db, selectEventQuery, selectArgs)
  let eventId
  if (eRow.length == 0) {
    eventId = null
  } else {
    eventId = eRow[0].EVENT_ID
  }

  // We got the ids, now we update ENDPOINT_TYPE_EVENT
  let arg = [endpointTypeId, endpointClusterId, eventId, event.included]
  return dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT_TYPE_EVENT (
  ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER_REF,
  EVENT_REF,
  INCLUDED
) VALUES (
  ?,?,?,?
)
`,
    arg
  )
}

/**
 * Returns a promise of data for attributes inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} endpointClusterId
 * @returns Promise that resolves with the attribute data.
 */
async function exportAttributesFromEndpointTypeCluster(
  db,
  endpointTypeId,
  endpointClusterId
) {
  let mapFunction = (x) => {
    let result = {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      side: x.SIDE,
      type: x.TYPE,
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
    if (x.API_MATURITY) {
      result.apiMaturity = x.API_MATURITY
    }

    return result
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  A.NAME,
  A.CODE,
  A.MANUFACTURER_CODE,
  A.SIDE,
  A.TYPE,
  ETA.INCLUDED,
  ETA.STORAGE_OPTION,
  ETA.SINGLETON,
  ETA.BOUNDED,
  ETA.DEFAULT_VALUE,
  ETA.INCLUDED_REPORTABLE,
  ETA.MIN_INTERVAL,
  ETA.MAX_INTERVAL,
  ETA.REPORTABLE_CHANGE
FROM
  ATTRIBUTE AS A
INNER JOIN
  ENDPOINT_TYPE_ATTRIBUTE AS ETA
ON
  A.ATTRIBUTE_ID = ETA.ATTRIBUTE_REF
WHERE
  ETA.ENDPOINT_TYPE_REF = ?
  AND ETA.ENDPOINT_TYPE_CLUSTER_REF = ?
ORDER BY
  A.CODE, A.MANUFACTURER_CODE
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
 * @param {*} cluster
 * @returns Promise of an attribute insertion.
 */
async function importAttributeForEndpointType(
  db,
  packageIds,
  endpointTypeId,
  endpointClusterId,
  attribute,
  cluster
) {
  let selectAttributeQuery = `
SELECT
  A.ATTRIBUTE_ID,
  A.REPORTING_POLICY,
  A.STORAGE_POLICY,
  A.NAME
FROM
  ATTRIBUTE AS A
INNER JOIN
  ENDPOINT_TYPE_CLUSTER AS ETC
ON
  ETC.CLUSTER_REF = A.CLUSTER_REF OR A.CLUSTER_REF IS NULL
WHERE
  A.CODE = ?
  AND A.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
  AND A.SIDE = ETC.SIDE
  AND ETC.ENDPOINT_TYPE_CLUSTER_ID = ?
  AND ${
    attribute.mfgCode == null
      ? 'A.MANUFACTURER_CODE IS NULL'
      : 'A.MANUFACTURER_CODE = ?'
  }`

  let selectArgs = [attribute.code, endpointClusterId]
  if (attribute.mfgCode != null) selectArgs.push(attribute.mfgCode)

  let atRow = await dbApi.dbAll(db, selectAttributeQuery, selectArgs)
  let attributeId
  let reportingPolicy
  let storagePolicy
  let forcedExternal
  let attributeName
  if (atRow.length == 0) {
    attributeId = null
    reportingPolicy = null
    storagePolicy = null
    attributeName = null
  } else {
    attributeId = atRow[0].ATTRIBUTE_ID
    reportingPolicy = atRow[0].REPORTING_POLICY
    storagePolicy = atRow[0].STORAGE_POLICY
    attributeName = atRow[0].NAME
  }

  // If the spec has meanwhile changed the policies to mandatory or prohibited,
  // we update the flags in the file to the requirements.
  if (reportingPolicy == dbEnums.reportingPolicy.mandatory) {
    attribute.reportable = true
  } else if (reportingPolicy == dbEnums.reportingPolicy.prohibited) {
    attribute.reportable = false
  }
  if (attributeId) {
    forcedExternal = await queryUpgrade.getForcedExternalStorage(
      db,
      attributeId
    )
    storagePolicy = await queryUpgrade.computeStorageImport(
      db,
      cluster.name,
      storagePolicy,
      forcedExternal,
      attributeName
    )
  }
  if (storagePolicy == dbEnums.storagePolicy.attributeAccessInterface) {
    attribute.storageOption = dbEnums.storageOption.external
    attribute.defaultValue = null
  }

  let arg = [
    endpointTypeId,
    endpointClusterId,
    attributeId,
    attribute.included,
    attribute.storageOption,
    attribute.singleton,
    attribute.bounded,
    attribute.defaultValue,
    attribute.reportable,
    attribute.minInterval,
    attribute.maxInterval,
    attribute.reportableChange,
  ]

  return dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT_TYPE_ATTRIBUTE ( 
  ENDPOINT_TYPE_REF,
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
  REPORTABLE_CHANGE 
) VALUES ( 
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)
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
      isIncoming: x.IS_INCOMING,
      isEnabled: x.IS_ENABLED,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  C.NAME,
  C.CODE,
  C.MANUFACTURER_CODE,
  C.SOURCE,
  ETC.IS_INCOMING,
  ETC.IS_ENABLED
FROM
  COMMAND AS C
INNER JOIN
  ENDPOINT_TYPE_COMMAND AS ETC
ON
  C.COMMAND_ID = ETC.COMMAND_REF
WHERE
  ETC.ENDPOINT_TYPE_REF = ?
  AND ETC.ENDPOINT_TYPE_CLUSTER_REF = ?
ORDER BY
  C.MANUFACTURER_CODE, C.CODE
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
  packageIds,
  endpointTypeId,
  endpointClusterId,
  command
) {
  let matchedCmdId = await dbApi
    .dbAll(
      db,
      `SELECT COMMAND_ID
      FROM COMMAND, ENDPOINT_TYPE_CLUSTER WHERE
        COMMAND.CODE = ?
        AND COMMAND.SOURCE = ?
        AND COMMAND.PACKAGE_REF IN (${dbApi.toInClause(packageIds)})
        AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ?
        AND COMMAND.CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
        AND ${
          command.mfgCode == null
            ? 'MANUFACTURER_CODE IS NULL'
            : 'MANUFACTURER_CODE = ?'
        }`,
      command.mfgCode == null
        ? [command.code, command.source, endpointClusterId]
        : [command.code, command.source, endpointClusterId, command.mfgCode]
    )
    .then((matchedCmdIds) => matchedCmdIds.shift()?.COMMAND_ID)

  let arg = [
    endpointTypeId,
    endpointClusterId,
    matchedCmdId,
    command.isIncoming,
    command.isEnabled,
  ]

  // The reason there is an ignore here is because some .zap files have been hand editted
  // where there are multiple entries of the same command within a cluster.
  return dbApi.dbInsert(
    db,
    `
INSERT OR IGNORE INTO ENDPOINT_TYPE_COMMAND
( ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER_REF,
  COMMAND_REF,
  IS_INCOMING,
  IS_ENABLED )
VALUES
  (?, ?, ?, ?, ?)
  `,
    arg
  )
}

exports.exportEndpointTypes = exportEndpointTypes
exports.importEndpointType = importEndpointType

exports.exportClustersFromEndpointType = exportClustersFromEndpointType
exports.importClusterForEndpointType = importClusterForEndpointType

exports.exportPackagesFromSession = exportPackagesFromSession

exports.exportEndpoints = exportEndpoints
exports.importEndpoint = importEndpoint

exports.exportAttributesFromEndpointTypeCluster =
  exportAttributesFromEndpointTypeCluster
exports.importAttributeForEndpointType = importAttributeForEndpointType

exports.exportCommandsFromEndpointTypeCluster =
  exportCommandsFromEndpointTypeCluster
exports.importCommandForEndpointType = importCommandForEndpointType

exports.exportEventsFromEndpointTypeCluster =
  exportEventsFromEndpointTypeCluster
exports.importEventForEndpointType = importEventForEndpointType
