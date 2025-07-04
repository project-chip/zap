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
 * This module provides queries for user configuration.
 *
 * @module DB API: user configuration queries against the database.
 */

const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
const queryPackage = require('./query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')
const queryZcl = require('./query-zcl.js')
const queryUpgrade = require('../sdk/matter.js')
const queryDeviceType = require('./query-device-type')
const querySession = require('./query-session')
const queryCommand = require('./query-command.js')
const restApi = require('../../src-shared/rest-api.js')
const _ = require('lodash')
const notification = require('../db/query-session-notification.js')

/**
 * Promises to update the cluster include/exclude state.
 * If the entry [as defined uniquely by endpointTypeId, clusterId, side] is not there, then insert
 * Else update the entry in place.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef
 * @param {*} side
 * @param {*} enabled
 * @returns Promise to update the cluster exclude/include state.
 */
async function insertOrReplaceClusterState(
  db,
  endpointTypeId,
  clusterRef,
  side,
  enabled
) {
  return dbApi.dbInsert(
    db,
    `
INSERT
INTO ENDPOINT_TYPE_CLUSTER
  ( ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED )
VALUES
  ( ?, ?, ?, ?)
ON CONFLICT
  (ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE)
DO UPDATE SET ENABLED = ?`,
    [endpointTypeId, clusterRef, side, enabled, enabled]
  )
}

/**
 * Promise to get a endpoint type's clusters.
 * @param {*} db
 * @param {*} endpointTypeId
 */
async function selectEndpointClusters(db, endpointTypeId) {
  let rows = await dbApi.dbAll(
    db,
    `
    SELECT * FROM ENDPOINT_TYPE_CLUSTER
    WHERE
      ENDPOINT_TYPE_REF = ?
    `,
    [endpointTypeId]
  )

  return rows.map(dbMapping.map.endpointTypeCluster)
}

/**
 * Promise to get a cluster's state.
 * This must return undefined/null for if the cluster state has not been used before for the endpointType
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef
 * @param {*} side
 */
async function selectClusterState(db, endpointTypeId, clusterRef, side) {
  return dbApi
    .dbGet(
      db,
      `
    SELECT
      ENDPOINT_TYPE_CLUSTER_ID,
      ENDPOINT_TYPE_REF,
      CLUSTER_REF,
      SIDE,
      ENABLED
    FROM ENDPOINT_TYPE_CLUSTER
    WHERE
      ENDPOINT_TYPE_REF = ? AND
      CLUSTER_REF = ? AND
      SIDE = ?
    `,
      [endpointTypeId, clusterRef, side]
    )
    .then(dbMapping.map.endpointTypeCluster)
}

/**
 * Promise to get clusters' states for all endpoints
 * This must return undefined/null for if the cluster state has not been used before for the endpointType
 * @param {*} db
 * @param {*} clusterRef
 * @param {*} side
 */
async function selectClusterStatesForAllEndpoints(db, clusterRef, side) {
  return dbApi
    .dbAll(
      db,
      `
    SELECT
      ENDPOINT_TYPE_CLUSTER_ID,
      ENDPOINT_TYPE_REF,
      CLUSTER_REF,
      SIDE,
      ENABLED
    FROM ENDPOINT_TYPE_CLUSTER
    WHERE
      CLUSTER_REF = ? AND
      SIDE = ?
    `,
      [clusterRef, side]
    )
    .then((rows) => rows.map(dbMapping.map.endpointTypeCluster))
}

/**
 * Promise that resolves after inserting the defaults associated with the clusterside to the database.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} packageIds
 * @param {*} cluster
 */
async function insertClusterDefaults(db, endpointTypeId, packageIds, cluster) {
  let promises = []
  promises.push(
    resolveDefaultAttributes(db, endpointTypeId, packageIds, [cluster])
  )
  promises.push(
    resolveNonOptionalCommands(db, endpointTypeId, [cluster], packageIds)
  )
  return Promise.all(promises)
}

/**
 * Promise to update the attribute state.
 * If an attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
 * Afterwards, update entry.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef // We want this to be explicitly passed in, rather than derived from that static attribute due to this possibly being a global attribute.
 * @param {*} side // We want this to be explicitly passed in, rather than derived from that static attribute due to this possibly being a global attribute. Note we handle bidirectional attributes with two instances
 * @param {*} attributeId
 * @param {*} paramValuePairArray An array of objects whose keys are [key, value]. Key is name of the column to be editted. Value is what the column should be set to. This does not handle empty arrays.
 */
async function insertOrUpdateAttributeState(
  db,
  endpointTypeId,
  clusterRef,
  side,
  attributeId,
  paramValuePairArray,
  reportMinInterval,
  reportMaxInterval,
  reportableChange
) {
  if (reportMinInterval === undefined || reportMinInterval === null) {
    reportMinInterval = 1
  }

  if (reportMaxInterval === undefined || reportMaxInterval === null) {
    reportMaxInterval = 0xffff - 1
  }

  if (reportableChange === undefined || reportableChange === null) {
    reportableChange = 0
  }

  let cluster = await insertOrSelectDefaultEndpointTypeCluster(
    db,
    endpointTypeId,
    clusterRef,
    side
  )
  if (cluster == null) {
    throw new Error(`Could not locate cluster: ${clusterRef}`)
  }

  let staticAttribute =
    await queryZcl.selectAttributeByAttributeIdAndClusterRef(
      db,
      attributeId,
      clusterRef
    )
  // Looking for the feature map attribute in matter and setting it as per
  // the device types if default value is 0
  if (
    staticAttribute.code == 0xfffc &&
    staticAttribute.name == 'FeatureMap' &&
    staticAttribute.defaultValue == 0
  ) {
    let featureMapDefaultValue = staticAttribute.defaultValue
    let featuresOnEndpointTypeAndCluster =
      await queryDeviceType.selectDeviceTypeFeaturesByEndpointTypeIdAndClusterId(
        db,
        endpointTypeId,
        clusterRef
      )
    // only set featureMap bit to 1 for mandatory features
    let featureMapBitsToBeEnabled = featuresOnEndpointTypeAndCluster
      .filter((f) => f.conformance == dbEnum.conformance.mandatory)
      .map((f) => f.featureBit)
    featureMapBitsToBeEnabled.forEach(
      (featureBit) =>
        (featureMapDefaultValue = featureMapDefaultValue | (1 << featureBit))
    )
    staticAttribute.defaultValue = featureMapDefaultValue
  }
  let forcedExternal = await queryUpgrade.getForcedExternalStorage(
    db,
    staticAttribute.packageRef
  )
  staticAttribute.storagePolicy =
    await queryUpgrade.computeStoragePolicyNewConfig(
      db,
      clusterRef,
      staticAttribute.storagePolicy,
      forcedExternal,
      staticAttribute.name
    )
  let storageOption = await queryUpgrade.computeStorageOptionNewConfig(
    staticAttribute.storagePolicy
  )
  if (
    staticAttribute.storagePolicy ==
    dbEnum.storagePolicy.attributeAccessInterface
  ) {
    staticAttribute.defaultValue = null
  }
  if (staticAttribute == null) {
    throw new Error(`COULD NOT LOCATE ATTRIBUTE: ${attributeId} `)
  }
  let etaId = await dbApi.dbInsert(
    db,
    `
INSERT OR IGNORE
INTO ENDPOINT_TYPE_ATTRIBUTE (
    ENDPOINT_TYPE_CLUSTER_REF,
    ATTRIBUTE_REF,
    DEFAULT_VALUE,
    STORAGE_OPTION,
    SINGLETON,
    MIN_INTERVAL,
    MAX_INTERVAL,
    REPORTABLE_CHANGE
) VALUES (
  ?,
  ?,
  ?,
  ?,
  ( SELECT IS_SINGLETON FROM CLUSTER WHERE CLUSTER_ID = ? ),
  ?,
  ?,
  ?
)`,
    [
      cluster.endpointTypeClusterId,
      attributeId,
      staticAttribute.defaultValue ? staticAttribute.defaultValue : '',
      storageOption,
      clusterRef,
      reportMinInterval,
      reportMaxInterval,
      reportableChange
    ]
  )

  if (paramValuePairArray == null || paramValuePairArray.length == 0) {
    return etaId
  } else {
    let query =
      'UPDATE ENDPOINT_TYPE_ATTRIBUTE SET ' +
      getAllParamValuePairArrayClauses(paramValuePairArray) +
      'WHERE ENDPOINT_TYPE_CLUSTER_REF = ? AND ATTRIBUTE_REF = ?'

    await dbApi.dbUpdate(db, query, [
      cluster.endpointTypeClusterId,
      attributeId
    ])

    let row = await dbApi.dbGet(
      db,
      `
SELECT
  ETA.ENDPOINT_TYPE_ATTRIBUTE_ID
FROM
  ENDPOINT_TYPE_ATTRIBUTE AS ETA
WHERE
  ENDPOINT_TYPE_CLUSTER_REF = ? AND ATTRIBUTE_REF = ?`,
      [cluster.endpointTypeClusterId, attributeId]
    )
    return row.ENDPOINT_TYPE_ATTRIBUTE_ID
  }
}

/**
 * Updates the endpoint type attribute table.
 *
 * @param {*} db
 * @param {*} id
 * @param {*} keyValuePairs
 * @returns Promise of an endpoint type atribute table update.
 */
async function updateEndpointTypeAttribute(db, id, keyValuePairs) {
  if (keyValuePairs == null || keyValuePairs.length == 0) return

  let columns = keyValuePairs
    .map((kv) => `${convertRestKeyToDbColumn(kv[0])} = ?`)
    .join(', ')

  let args = []
  keyValuePairs.forEach((kv) => {
    args.push(kv[1])
  })
  args.push(id)

  let query = `UPDATE ENDPOINT_TYPE_ATTRIBUTE SET
  ${columns}
WHERE ENDPOINT_TYPE_ATTRIBUTE_ID = ?`
  return dbApi.dbUpdate(db, query, args)
}

/**
 * Based on the given key returns a database table column name.
 * @param {*} key
 * @returns Database table Column as String
 */
function convertRestKeyToDbColumn(key) {
  switch (key) {
    case restApi.updateKey.endpointId:
      return 'ENDPOINT_IDENTIFIER'
    case restApi.updateKey.endpointType:
      return 'ENDPOINT_TYPE_REF'
    case restApi.updateKey.networkId:
      return 'NETWORK_IDENTIFIER'
    case restApi.updateKey.profileId:
      return 'PROFILE'
    case restApi.updateKey.deviceId:
      return 'DEVICE_IDENTIFIER'
    case restApi.updateKey.deviceIdentifier:
      return 'DEVICE_IDENTIFIER'
    case restApi.updateKey.endpointVersion:
      return 'DEVICE_VERSION'
    case restApi.updateKey.deviceVersion:
      return 'DEVICE_VERSION'
    case restApi.updateKey.deviceTypeRef:
      return 'DEVICE_TYPE_REF'
    case restApi.updateKey.name:
      return 'NAME'
    case restApi.updateKey.attributeSelected:
      return 'INCLUDED'
    case restApi.updateKey.attributeSingleton:
      return 'SINGLETON'
    case restApi.updateKey.attributeBounded:
      return 'BOUNDED'
    case restApi.updateKey.attributeDefault:
      return 'DEFAULT_VALUE'
    case restApi.updateKey.attributeReporting:
      return 'INCLUDED_REPORTABLE'
    case restApi.updateKey.attributeReportMin:
      return 'MIN_INTERVAL'
    case restApi.updateKey.attributeReportMax:
      return 'MAX_INTERVAL'
    case restApi.updateKey.attributeReportChange:
      return 'REPORTABLE_CHANGE'
    case restApi.updateKey.attributeStorage:
      return 'STORAGE_OPTION'
  }
  throw new Error(`Invalid rest update key: ${key}`)
}

/**
 * Create a Database column name and value string which can be used in database
 * queries.
 *
 * @param {*} paramValuePairArray
 * @returns string
 */
function getAllParamValuePairArrayClauses(paramValuePairArray) {
  return paramValuePairArray.reduce((currentString, paramValuePair, index) => {
    if (index > 0) currentString += ','
    currentString += convertRestKeyToDbColumn(paramValuePair.key)
    currentString += ' = '
    if (_.isBoolean(paramValuePair.value)) {
      currentString += paramValuePair.value ? '1' : '0'
    } else if (paramValuePair.value == '') {
      currentString += false
    } else if (paramValuePair.value == null) {
      currentString += 'null'
    } else if (Array.isArray(paramValuePair.value)) {
      currentString += paramValuePair.value[0]
    } else {
      if (paramValuePair.type == 'text') {
        currentString += "'" + paramValuePair.value + "'"
      } else {
        currentString += paramValuePair.value
      }
    }
    currentString += ' '
    return currentString
  }, '')
}

/**
 * Promise to update the command state.
 * If the command entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
 * Afterwards, update entry.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef // Note that this is the clusterRef from CLUSTER and not the ENDPOINT_TYPE_CLUSTER
 * @param {*} side // client or server
 * @param {*} id
 * @param {*} value
 * @param {*} booleanParam
 */
async function insertOrUpdateCommandState(
  db,
  endpointTypeId,
  clusterRef,
  side,
  commandId,
  value,
  isIncoming
) {
  /*
  Retrieve the cluster side and command source and based on that add incoming/outgoing, incoming is 1 and outgoing is 0
  Once that is done put the value into enabled clause. See the schema changes.
  For backwards compatibility. The existing inserts into the db should continue to work the same way.
  */

  let cluster = await insertOrSelectDefaultEndpointTypeCluster(
    db,
    endpointTypeId,
    clusterRef,
    !isIncoming
      ? side
      : dbEnum.source.client == side
        ? dbEnum.source.server
        : dbEnum.source.client
  )

  await dbApi.dbInsert(
    db,
    `
INSERT OR IGNORE
INTO ENDPOINT_TYPE_COMMAND (
  ENDPOINT_TYPE_CLUSTER_REF,
  COMMAND_REF,
  IS_INCOMING
) VALUES( ?, ?, ? )
`,
    [cluster.endpointTypeClusterId, commandId, dbApi.toDbBool(isIncoming)]
  )
  return dbApi.dbUpdate(
    db,
    `
UPDATE ENDPOINT_TYPE_COMMAND
SET IS_ENABLED = ?
WHERE ENDPOINT_TYPE_CLUSTER_REF = ?
  AND COMMAND_REF = ?
  AND IS_INCOMING = ? `,
    [
      value,
      cluster.endpointTypeClusterId,
      commandId,
      dbApi.toDbBool(isIncoming)
    ]
  )
}

/**
 * Promise to update the event state.
 * If an event entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
 * Afterwards, update entry.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef // Note that this is the clusterRef from CLUSTER and not the ENDPOINT_TYPE_CLUSTER
 * @param {*} side // client or server
 * @param {*} eventId
 * @param {*} value
 */
async function insertOrUpdateEventState(
  db,
  endpointTypeId,
  clusterRef,
  side,
  eventId,
  value
) {
  let cluster = await insertOrSelectDefaultEndpointTypeCluster(
    db,
    endpointTypeId,
    clusterRef,
    side
  )

  await dbApi.dbInsert(
    db,
    `
INSERT OR IGNORE
INTO ENDPOINT_TYPE_EVENT (
  ENDPOINT_TYPE_CLUSTER_REF,
  EVENT_REF
) VALUES( ?, ? )
`,
    [cluster.endpointTypeClusterId, eventId]
  )
  return dbApi.dbUpdate(
    db,
    `
UPDATE ENDPOINT_TYPE_EVENT
SET INCLUDED = ?
WHERE ENDPOINT_TYPE_CLUSTER_REF = ?
  AND EVENT_REF = ? `,
    [value, cluster.endpointTypeClusterId, eventId]
  )
}

/**
 * Returns a promise to update the endpoint
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointId
 * @param {*} changesArray
 * @returns Promise to update the endpoint
 */
async function updateEndpoint(db, sessionId, endpointId, changesArray) {
  return dbApi.dbUpdate(
    db,
    `UPDATE ENDPOINT SET ` +
      getAllParamValuePairArrayClauses(changesArray) +
      `WHERE ENDPOINT_ID = ? AND SESSION_REF = ?`,
    [endpointId, sessionId]
  )
}

/**
 * Returns a promise to update the parent endpoint of the endpoint
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointId
 * @param {*} parentRef
 * @returns Promise to update the endpoint's parent ref
 */
async function updateParentEndpoint(db, sessionId, endpointId, parentRef) {
  return dbApi.dbUpdate(
    db,
    `UPDATE ENDPOINT SET PARENT_ENDPOINT_REF = ? WHERE ENDPOINT_ID = ? AND SESSION_REF = ?`,
    [parentRef, endpointId, sessionId]
  )
}

/**
 * Returns the number of endpoints with a given endpoint_identifier and sessionid.
 * Used for validation
 *
 * @param {*} endpointIdentifier
 * @param {*} sessionId
 * @returns Promise that resolves into a count.
 */
async function selectCountOfEndpointsWithGivenEndpointIdentifier(
  db,
  endpointIdentifier,
  sessionId
) {
  return dbApi
    .dbGet(
      db,
      'SELECT COUNT(ENDPOINT_IDENTIFIER) FROM ENDPOINT WHERE ENDPOINT_IDENTIFIER = ? AND SESSION_REF = ?',
      [endpointIdentifier, sessionId]
    )
    .then((x) => x['COUNT(ENDPOINT_IDENTIFIER)'])
}

/**
 * Promises to add an endpoint type.
 *
 * @param {*} db
 * @param {*} sessionPartitionInfo
 * @param {*} name
 * @param {*} deviceTypeRef
 * @param {*} deviceTypeIdentifier
 * @param {*} deviceTypeVersion
 * @param {*} doTransaction
 * @returns Promise to update endpoints.
 */
async function insertEndpointType(
  db,
  sessionPartitionInfo,
  name,
  deviceTypeRef,
  deviceTypeIdentifier,
  deviceTypeVersion,
  doTransaction = true
) {
  let deviceTypeRefs = Array.isArray(deviceTypeRef)
    ? deviceTypeRef
    : [deviceTypeRef]
  let deviceTypeIdentifiers = Array.isArray(deviceTypeIdentifier)
    ? deviceTypeIdentifier
    : [deviceTypeIdentifier]
  let deviceTypeVersions = Array.isArray(deviceTypeVersion)
    ? deviceTypeVersion
    : [deviceTypeVersion]
  // Insert endpoint type
  let newEndpointTypeId = await dbApi.dbInsert(
    db,
    'INSERT OR REPLACE INTO ENDPOINT_TYPE ( SESSION_PARTITION_REF, NAME ) VALUES ( ?, ?)',
    [sessionPartitionInfo.sessionPartitionId, name]
  )

  // Creating endpoint type and device type ref combinations along with order of insertion
  let newEndpointTypeIdDeviceCombination = []
  for (let i = 0; i < deviceTypeRefs.length; i++) {
    let endpointTypeDevice = [
      newEndpointTypeId,
      deviceTypeRefs[i],
      deviceTypeIdentifiers[i],
      deviceTypeVersions[i],
      i
    ]
    newEndpointTypeIdDeviceCombination.push(endpointTypeDevice)
  }

  // Insert into endpoint_type_device
  try {
    let etd = await dbApi.dbMultiInsert(
      db,
      'INSERT INTO ENDPOINT_TYPE_DEVICE (ENDPOINT_TYPE_REF, DEVICE_TYPE_REF, DEVICE_IDENTIFIER, DEVICE_VERSION, DEVICE_TYPE_ORDER) VALUES (?, ?, ?, ?, ?)',
      newEndpointTypeIdDeviceCombination
    )
  } catch (err) {
    // Catching an error from a sql trigger
    let isErrorStringPresent = err.includes('Error:')
    notification.setNotification(
      db,
      'ERROR',
      isErrorStringPresent ? err.split('Error:')[1] : err,
      sessionPartitionInfo.sessionRef,
      1,
      1
    )
    await dbApi.dbMultiInsert(
      db,
      'DELETE FROM ENDPOINT_TYPE_DEVICE WHERE ENDPOINT_TYPE_REF = ? AND DEVICE_TYPE_REF = ? AND DEVICE_IDENTIFIER = ? AND DEVICE_VERSION =? AND DEVICE_TYPE_ORDER = ?',
      newEndpointTypeIdDeviceCombination
    )
    await dbApi.dbRemove(
      db,
      'DELETE FROM ENDPOINT_TYPE WHERE ENDPOINT_TYPE_ID = ?',
      newEndpointTypeId
    )
    throw new Error(err)
  }

  // Resolve endpointDefaults based on device type order.
  for (const dtRef of deviceTypeRefs) {
    await setEndpointDefaults(
      db,
      sessionPartitionInfo.sessionRef,
      newEndpointTypeId,
      dtRef,
      doTransaction
    )
  }
  return newEndpointTypeId
}

/**
 * Promises to duplicate an endpoint type.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise to duplicate endpoint type.
 */
async function duplicateEndpointType(db, endpointTypeId) {
  // Extract all the device types based on endpoint type id
  let endpointTypeDeviceInfo = await dbApi.dbAll(
    db,
    `
    SELECT
      SESSION_PARTITION.SESSION_REF,
      SESSION_PARTITION.SESSION_PARTITION_ID,
      ENDPOINT_TYPE.NAME,
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF,
      ENDPOINT_TYPE_DEVICE.DEVICE_IDENTIFIER,
      ENDPOINT_TYPE_DEVICE.DEVICE_VERSION
    FROM
      ENDPOINT_TYPE
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON
      ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF
    INNER JOIN
      SESSION_PARTITION
    ON
      ENDPOINT_TYPE.SESSION_PARTITION_REF = SESSION_PARTITION.SESSION_PARTITION_ID
    WHERE
      ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF = ?`,
    [endpointTypeId]
  )
  let newEndpointTypeId = 0
  if (endpointTypeDeviceInfo && endpointTypeDeviceInfo.length > 0) {
    // Enter into the endpoint_type table
    newEndpointTypeId = await dbApi.dbInsert(
      db,
      `INSERT INTO ENDPOINT_TYPE (SESSION_PARTITION_REF, NAME)
      VALUES (?, ?)`,
      [
        endpointTypeDeviceInfo[0].SESSION_PARTITION_ID,
        endpointTypeDeviceInfo[0].NAME
      ]
    )

    // Enter into the endpoint_type_device table to establish the endpoint_type
    // and device type relationship
    let endpointTypeDeviceInfoValues = []
    endpointTypeDeviceInfo.forEach((dt, index) =>
      endpointTypeDeviceInfoValues.push([
        newEndpointTypeId,
        dt.DEVICE_TYPE_REF,
        dt.DEVICE_IDENTIFIER,
        dt.DEVICE_VERSION,
        index
      ])
    )
    await dbApi.dbMultiInsert(
      db,
      `
      INSERT INTO
        ENDPOINT_TYPE_DEVICE (ENDPOINT_TYPE_REF, DEVICE_TYPE_REF, DEVICE_IDENTIFIER, DEVICE_VERSION, DEVICE_TYPE_ORDER)
      VALUES
        (?, ?, ?, ?, ?)`,
      endpointTypeDeviceInfoValues
    )
  }

  return newEndpointTypeId
}

/**
 * Promise to update an endpoint type.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointTypeId
 * @param {*} changesArray
 */
async function updateEndpointType(db, sessionId, endpointTypeId, changesArray) {
  // Extract all changes from the changesArray in the form of
  // keys(endpoint_type columns) and its values
  let updatedKeys = []
  let updatedValues = []
  changesArray.forEach((c) => updatedKeys.push(c.key))
  changesArray.forEach((c) => updatedValues.push(c.value))

  // Retrieve existing values to the endpoint_type
  let existingDeviceTypeInfo = await dbApi.dbAll(
    db,
    `
    SELECT
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_REF,
      ENDPOINT_TYPE_DEVICE.DEVICE_VERSION,
      ENDPOINT_TYPE_DEVICE.DEVICE_IDENTIFIER
    FROM
      ENDPOINT_TYPE
    INNER JOIN
      ENDPOINT_TYPE_DEVICE
    ON ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_DEVICE.ENDPOINT_TYPE_REF
    INNER JOIN
      SESSION_PARTITION
    ON
      ENDPOINT_TYPE.SESSION_PARTITION_REF = SESSION_PARTITION.SESSION_PARTITION_ID
    WHERE
      ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ? AND SESSION_PARTITION.SESSION_REF = ?
    ORDER BY
      ENDPOINT_TYPE_DEVICE.DEVICE_TYPE_ORDER`,
    [endpointTypeId, sessionId]
  )
  let existingDeviceTypeRefs = existingDeviceTypeInfo.map(
    (dt) => dt.DEVICE_TYPE_REF
  )
  let existingDeviceVersions = existingDeviceTypeInfo.map(
    (dt) => dt.DEVICE_VERSION
  )

  let existingEndpointTypeDeviceInfoValues = []
  for (let j = 0; j < existingDeviceTypeInfo.length; j++) {
    existingEndpointTypeDeviceInfoValues.push([
      endpointTypeId,
      existingDeviceTypeInfo[j]['DEVICE_TYPE_REF'],
      existingDeviceTypeInfo[j]['DEVICE_VERSION'],
      existingDeviceTypeInfo[j]['DEVICE_IDENTIFIER'],
      j
    ])
  }
  let updatedDeviceTypeRefs = updatedValues[0]
  let updatedDeviceVersions = updatedValues[1]
  let isDeviceTypeRefsUpdated =
    existingDeviceTypeRefs.length != updatedDeviceTypeRefs.length ||
    !existingDeviceTypeRefs.every(
      (dtRef, index) => dtRef == updatedDeviceTypeRefs[index]
    )

  let isDeviceVersionsUpdated =
    existingDeviceVersions.length != updatedDeviceVersions.length ||
    !existingDeviceVersions.every(
      (version, index) => version == updatedDeviceVersions[index]
    )

  // Make changes if device type refs or versions have been updated
  if (isDeviceTypeRefsUpdated || isDeviceVersionsUpdated) {
    // Delete the endpoint_type_device references based on endpoint_type_id
    await dbApi.dbRemove(
      db,
      'DELETE FROM ENDPOINT_TYPE_DEVICE WHERE ENDPOINT_TYPE_REF = ?',
      endpointTypeId
    )

    // Re-insert endpoint_type_device references with the new references to device types
    let endpointTypeDeviceInfoValues = []
    for (let i = 0; i < updatedValues[0].length; i++) {
      endpointTypeDeviceInfoValues.push([
        endpointTypeId,
        updatedValues[0][i],
        updatedValues[1][i],
        updatedValues[2][i],
        i
      ])
    }

    try {
      await dbApi.dbMultiInsert(
        db,
        `
        INSERT INTO
          ENDPOINT_TYPE_DEVICE (ENDPOINT_TYPE_REF, DEVICE_TYPE_REF, DEVICE_VERSION, DEVICE_IDENTIFIER, DEVICE_TYPE_ORDER)
        VALUES
          (?, ?, ?, ?, ?)`,
        endpointTypeDeviceInfoValues
      )
    } catch (err) {
      // Catching an error from a sql trigger
      let isErrorStringPresent = err.includes('Error:')
      notification.setNotification(
        db,
        'ERROR',
        isErrorStringPresent ? err.split('Error:')[1] : err,
        sessionId,
        1,
        1
      )
      // Delete endpoint type devices with the latest updates
      let test = await dbApi.dbMultiInsert(
        db,
        'DELETE FROM ENDPOINT_TYPE_DEVICE WHERE ENDPOINT_TYPE_REF = ? AND DEVICE_TYPE_REF = ? AND DEVICE_VERSION =? AND DEVICE_IDENTIFIER = ? AND DEVICE_TYPE_ORDER = ?',
        endpointTypeDeviceInfoValues
      )

      // Re add the old device types on the endpoint before the update
      await dbApi.dbMultiInsert(
        db,
        `
        INSERT INTO
          ENDPOINT_TYPE_DEVICE (ENDPOINT_TYPE_REF, DEVICE_TYPE_REF, DEVICE_VERSION, DEVICE_IDENTIFIER, DEVICE_TYPE_ORDER)
        VALUES
          (?, ?, ?, ?, ?)`,
        existingEndpointTypeDeviceInfoValues
      )
      throw new Error(err)
    }

    // When updating the zcl device types, overwrite on top of existing configuration
    // Note: Here the existing selections are not removed. For eg: the clusters which
    // came from a removed zcl device type continue to exist.
    if (isDeviceTypeRefsUpdated) {
      for (const dtRef of updatedDeviceTypeRefs) {
        await setEndpointDefaults(db, sessionId, endpointTypeId, dtRef)
      }
    }
  }

  return endpointTypeId
}

/**
 * Promise to set the default attributes and clusters for a endpoint type.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointTypeId
 * @param {*} deviceTypeRef
 * @param {*} doTransaction
 */
async function setEndpointDefaults(
  db,
  sessionId,
  endpointTypeId,
  deviceTypeRef,
  doTransaction = true
) {
  if (doTransaction) {
    await dbApi.dbBeginTransaction(db)
  }
  let zclPropertiesPkgs = await queryPackage.getSessionPackagesByType(
    db,
    sessionId,
    dbEnum.packageType.zclProperties
  )
  // Filter on category if available
  let deviceTypeInfo =
    await querySession.selectDeviceTypePackageInfoFromDeviceTypeId(
      db,
      deviceTypeRef
    )
  let endpointTypeCategory =
    deviceTypeInfo.length > 0 ? deviceTypeInfo[0].category : null
  if (endpointTypeCategory) {
    zclPropertiesPkgs = zclPropertiesPkgs.filter((pkg) => {
      return pkg.category == endpointTypeCategory
    })
  }
  if (zclPropertiesPkgs == null || zclPropertiesPkgs.length < 1)
    throw new Error('Could not locate package id for a given session.')

  let zclXmlStandalonePkgs = await queryPackage.getSessionPackagesByType(
    db,
    sessionId,
    dbEnum.packageType.zclXmlStandalone
  )
  // Relevant packages are zcl file (filtered by category) and all custom xmls in the session
  let pkgs = zclPropertiesPkgs.concat(zclXmlStandalonePkgs)
  let packageIds = pkgs.map((pkg) => pkg.id)

  let clusters = await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
    db,
    deviceTypeRef
  )
  let defaultClusters = await resolveDefaultClusters(
    db,
    endpointTypeId,
    clusters
  )
  let promises = []

  promises.push(
    resolveDefaultDeviceTypeAttributes(db, endpointTypeId, deviceTypeRef),
    resolveDefaultDeviceTypeCommands(db, endpointTypeId, deviceTypeRef),
    resolveDefaultAttributes(db, endpointTypeId, packageIds, defaultClusters),
    resolveNonOptionalCommands(db, endpointTypeId, defaultClusters, packageIds)
  )

  return Promise.all(promises).finally(() => {
    if (doTransaction) return dbApi.dbCommit(db)
    else return Promise.resolve({ defaultClusters })
  })
}

/**
 * Returns a promise of resolving default clusters.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusters
 * @returns Promise of resolved default clusters.
 */
async function resolveDefaultClusters(db, endpointTypeId, clusters) {
  let promises = clusters.map((cluster) => {
    let clientServerPromise = []
    if (cluster.includeClient) {
      clientServerPromise.push(
        insertOrReplaceClusterState(
          db,
          endpointTypeId,
          cluster.clusterRef,
          dbEnum.side.client,
          true
        ).then(() => {
          return {
            clusterRef: cluster.clusterRef,
            side: dbEnum.side.client
          }
        })
      )
    }
    if (cluster.includeServer) {
      clientServerPromise.push(
        insertOrReplaceClusterState(
          db,
          endpointTypeId,
          cluster.clusterRef,
          dbEnum.side.server,
          true
        ).then(() => {
          return {
            clusterRef: cluster.clusterRef,
            side: dbEnum.side.server
          }
        })
      )
    }
    return Promise.all(clientServerPromise)
  })
  let allClustersResult = await Promise.all(promises)
  return allClustersResult.flat()
}

/**
 * Returns promise of default device type attributes.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} deviceTypeRef
 * @returns promise of default device type attributes.
 */
async function resolveDefaultDeviceTypeAttributes(
  db,
  endpointTypeId,
  deviceTypeRef
) {
  let deviceTypeAttributes =
    await queryDeviceType.selectDeviceTypeAttributesByDeviceTypeRef(
      db,
      deviceTypeRef
    )

  let promises = deviceTypeAttributes.map(async (deviceAttribute) => {
    if (deviceAttribute.attributeRef != null) {
      let attribute = await queryZcl.selectAttributeById(
        db,
        deviceAttribute.attributeRef
      )

      let clusterRef = attribute?.clusterRef

      return insertOrUpdateAttributeState(
        db,
        endpointTypeId,
        clusterRef,
        attribute.side,
        deviceAttribute.attributeRef,
        [
          {
            key: restApi.updateKey.attributeSelected,
            value: true
          },
          {
            key: restApi.updateKey.attributeReporting,
            value:
              deviceAttribute.reportingPolicy ==
                dbEnum.reportingPolicy.mandatory ||
              deviceAttribute.reportingPolicy ==
                dbEnum.reportingPolicy.suggested
          }
        ],
        attribute.reportMinInterval,
        attribute.reportMaxInterval,
        attribute.reportableChange
      )
    }
  })
  return Promise.all(promises)
}

/**
 * Initialize the command values within an endpoint type Id based on device type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} deviceCommand
 * @returns An array of promises which update command state.
 */
async function resolveCommandState(db, endpointTypeId, deviceCommand) {
  let deviceTypeCluster =
    await queryDeviceType.selectDeviceTypeClusterByDeviceTypeClusterId(
      db,
      deviceCommand.deviceTypeClusterRef
    )
  if (deviceCommand.commandRef == null) return null

  let command = await queryCommand.selectCommandById(
    db,
    deviceCommand.commandRef
  )
  if (command == null) return null

  let promises = []
  if (deviceTypeCluster.includeClient) {
    promises.push(
      insertOrUpdateCommandState(
        db,
        endpointTypeId,
        command.clusterRef,
        command.source,
        deviceCommand.commandRef,
        true,
        command.source != dbEnum.source.client
      )
    )
  }
  if (deviceTypeCluster.includeServer) {
    promises.push(
      insertOrUpdateCommandState(
        db,
        endpointTypeId,
        command.clusterRef,
        command.source,
        deviceCommand.commandRef,
        true,
        command.source != dbEnum.source.server
      )
    )
  }
  return Promise.all(promises)
}

/**
 * Returns promise of default device type commands.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} deviceTypeRef
 * @returns promise of default device type commands.
 */
async function resolveDefaultDeviceTypeCommands(
  db,
  endpointTypeId,
  deviceTypeRef
) {
  let commands = await queryDeviceType.selectDeviceTypeCommandsByDeviceTypeRef(
    db,
    deviceTypeRef
  )
  return Promise.all(
    commands.map((cmd) => resolveCommandState(db, endpointTypeId, cmd))
  )
}

/**
 * Resolve non optional commands for given parameters.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusters
 * @param {*} packageIds
 * @returns Promise of clusters with commands resolved
 */
async function resolveNonOptionalCommands(
  db,
  endpointTypeId,
  clusters,
  packageIds
) {
  let clustersPromises = clusters.map((cluster) =>
    queryCommand
      .selectCommandsByClusterId(db, cluster.clusterRef, packageIds)
      .then((commands) =>
        Promise.all(
          commands.map((command) => {
            if (!command.isOptional) {
              let isOutgoing =
                (cluster.side == dbEnum.side.client &&
                  command.source == dbEnum.source.client) ||
                (cluster.side == dbEnum.side.server &&
                  command.source == dbEnum.source.server)
              return insertOrUpdateCommandState(
                db,
                endpointTypeId,
                command.clusterRef,
                command.source,
                command.id,
                true,
                !isOutgoing
              )
            } else {
              return Promise.resolve()
            }
          })
        )
      )
  )
  return Promise.all(clustersPromises)
}

/**
 * Resolve attribute defaults for endpoint type clusters.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} packageIds
 * @param {*} endpointClusters
 * @returns Array of promises for endpointClusters with attributes
 */
async function resolveDefaultAttributes(
  db,
  endpointTypeId,
  packageIds,
  endpointClusters
) {
  let endpointClustersPromises = endpointClusters.map((cluster) =>
    queryZcl
      .selectAttributesByClusterIdAndSideIncludingGlobal(
        db,
        cluster.clusterRef,
        packageIds,
        cluster.side
      )
      .then((attributes) => {
        let promiseArray = []
        promiseArray.push(
          resolveNonOptionalAndReportableAttributes(
            db,
            endpointTypeId,
            attributes,
            cluster
          )
        )
        return Promise.all(promiseArray)
      })
  )
  return Promise.all(endpointClustersPromises)
}

/**
 * Get Non optional and reportable attributes foor the given arguments.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} attributes
 * @param {*} cluster
 * @returns Promise of Attributes
 */
async function resolveNonOptionalAndReportableAttributes(
  db,
  endpointTypeId,
  attributes,
  cluster
) {
  let promises = attributes.map((attribute) => {
    let settings = []
    if (
      attribute.reportingPolicy == dbEnum.reportingPolicy.mandatory ||
      attribute.reportingPolicy == dbEnum.reportingPolicy.suggested
    )
      settings.push({
        key: restApi.updateKey.attributeReporting,
        value: true
      })
    if (!attribute.isOptional) {
      settings.push({
        key: restApi.updateKey.attributeSelected,
        value: true
      })
    }
    if (cluster.isSingleton) {
      settings.push({
        key: restApi.updateKey.attributeSingleton,
        value: true
      })
    }
    let clusterRef = cluster.clusterRef

    if (settings.length > 0 && clusterRef != null) {
      return insertOrUpdateAttributeState(
        db,
        endpointTypeId,
        clusterRef,
        attribute.side,
        attribute.id,
        settings,
        attribute.reportMinInterval,
        attribute.reportMaxInterval,
        attribute.reportableChange
      )
    } else {
      return Promise.resolve()
    }
  })
  return Promise.all(promises)
}

/**
 * Resolves into the number of endpoint types for session.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise that resolves into a count.
 */
async function selectEndpointTypeCount(db, sessionId) {
  let x = await dbApi.dbGet(
    db,
    `SELECT
      COUNT(ENDPOINT_TYPE_ID) AS CNT
    FROM
      ENDPOINT_TYPE
    INNER JOIN
      SESSION_PARTITION
    ON
      SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
    WHERE
      SESSION_PARTITION.SESSION_REF = ?`,
    [sessionId]
  )
  return x['CNT']
}

/**
 * Resolves into the number of endpoint types for session.
 * by cluster ID
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise that resolves into a count.
 */
async function selectEndpointTypeCountByCluster(
  db,
  sessionId,
  endpointClusterId,
  side
) {
  let x = await dbApi.dbGet(
    db,
    `
SELECT
  COUNT(ENDPOINT_TYPE_ID)
FROM
  ENDPOINT_TYPE
INNER JOIN
  SESSION_PARTITION
ON
  SESSION_PARTITION.SESSION_PARTITION_ID = ENDPOINT_TYPE.SESSION_PARTITION_REF
WHERE SESSION_PARTITION.SESSION_REF = ?
  AND ENDPOINT_TYPE_ID IN
      (SELECT ENDPOINT_TYPE_REF
       FROM ENDPOINT_TYPE_CLUSTER
       WHERE CLUSTER_REF = ? AND SIDE = ? AND ENABLED = 1) `,
    [sessionId, endpointClusterId, side]
  )
  return x['COUNT(ENDPOINT_TYPE_ID)']
}

/**
 * Get or inserts default endpoint type cluster given endpoint type, cluster ref, and side.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef
 * @param {*} side
 */
async function insertOrSelectDefaultEndpointTypeCluster(
  db,
  endpointTypeId,
  clusterRef,
  side
) {
  await dbApi.dbInsert(
    db,
    `
INSERT OR IGNORE
INTO ENDPOINT_TYPE_CLUSTER (
  ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED
) VALUES ( ?, ?, ?, ? )
`,
    [endpointTypeId, clusterRef, side, false]
  )

  let eptClusterData = await dbApi.dbGet(
    db,
    `
SELECT
  ENDPOINT_TYPE_CLUSTER_ID,
  ENDPOINT_TYPE_REF,
  CLUSTER_REF,
  SIDE,
  ENABLED
FROM ENDPOINT_TYPE_CLUSTER
WHERE ENDPOINT_TYPE_REF = ?
  AND CLUSTER_REF = ?
  AND SIDE = ?`,
    [endpointTypeId, clusterRef, side]
  )

  return dbMapping.map.endpointTypeCluster(eptClusterData)
}

/**
 * Returns a promise that resolve into an endpoint type attribute id.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} clusterCode
 * @param {*} attributeCode
 * @param {*} attributeSide
 * @param {*} mfgCode
 * @returns endpointType attribute id or null
 */
async function selectEndpointTypeAttributeId(
  db,
  endpointTypeId,
  packageId,
  clusterCode,
  attributeCode,
  attributeSide,
  mfgCode
) {
  let args = [
    endpointTypeId,
    packageId,
    clusterCode,
    attributeCode,
    attributeSide
  ]
  if (!(mfgCode == 0 || mfgCode == null)) args.push(mfgCode)
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  ENDPOINT_TYPE_ATTRIBUTE_ID
FROM
  ENDPOINT_TYPE_CLUSTER AS ETC
INNER JOIN
  ENDPOINT_TYPE_ATTRIBUTE AS ETA
ON
  ETA.ENDPOINT_TYPE_CLUSTER_REF = ETC.ENDPOINT_TYPE_CLUSTER_ID
INNER JOIN
  ATTRIBUTE AS A
ON
  ETA.ATTRIBUTE_REF = A.ATTRIBUTE_ID
INNER JOIN
  CLUSTER AS C
ON
  C.CLUSTER_ID = A.CLUSTER_REF
WHERE
  ETC.ENDPOINT_TYPE_REF = ?
  AND C.PACKAGE_REF = ?
  AND C.CODE = ?
  AND A.CODE = ?
  AND A.SIDE = ?
  AND ${
    mfgCode == 0 || mfgCode == null
      ? 'A.MANUFACTURER_CODE IS NULL'
      : 'A.MANUFACTURER_CODE = ?'
  }
`,
    args
  )
  if (rows.length == 0) {
    return null
  } else if (rows.length == 1) {
    return rows[0].ENDPOINT_TYPE_ATTRIBUTE_ID
  } else {
    throw new Error(
      `Ambiguity: multiple attributes with same data loaded: ${endpointTypeId} / ${clusterCode} / ${attributeCode} / ${attributeSide}.`
    )
  }
}

/**
 * Retrieves all the attribute data for the session.
 *
 * @param {*} db
 * @param {*} sessionId
 */
async function selectAllSessionAttributes(db, sessionId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  A.NAME,
  A.CODE AS ATTRIBUTE_CODE,
  C.CODE AS CLUSTER_CODE,
  ETA.DEFAULT_VALUE,
  ETA.STORAGE_OPTION,
  ETA.SINGLETON,
  ETA.BOUNDED,
  A.TYPE,
  A.SIDE,
  A.MIN,
  A.MAX,
  A.IS_WRITABLE,
  A.IS_READABLE,
  A.ARRAY_TYPE,
  ETA.INCLUDED_REPORTABLE,
  ETA.MIN_INTERVAL,
  ETA.MAX_INTERVAL,
  ETA.REPORTABLE_CHANGE,
  ETA.ENDPOINT_TYPE_ATTRIBUTE_ID
FROM
  CLUSTER AS C
JOIN
  ATTRIBUTE AS A ON A.CLUSTER_REF = C.CLUSTER_ID
JOIN
  ENDPOINT_TYPE_ATTRIBUTE AS ETA ON ETA.ATTRIBUTE_REF = A.ATTRIBUTE_ID
JOIN
  ENDPOINT_TYPE_CLUSTER AS ETC ON ETA.ENDPOINT_TYPE_CLUSTER_REF = ETC.ENDPOINT_TYPE_CLUSTER_ID
JOIN
  ENDPOINT_TYPE AS ET ON ETC.ENDPOINT_TYPE_REF = ET.ENDPOINT_TYPE_ID
INNER JOIN
  SESSION_PARTITION
ON
  ET.SESSION_PARTITION_REF = SESSION_PARTITION.SESSION_PARTITION_ID
WHERE
  SESSION_PARTITION.SESSION_REF = ? AND ETA.INCLUDED = 1
ORDER BY
  CLUSTER_CODE, ATTRIBUTE_CODE
  `,
      [sessionId]
    )
    .then((rows) =>
      rows.map((row) => {
        return {
          endpointTypeAttributeId: row.ENDPOINT_TYPE_ATTRIBUTE_ID,
          name: row.NAME,
          attributeCode: row.ATTRIBUTE_CODE,
          clusterCode: row.CLUSTER_CODE,
          defaultValue: row.DEFAULT_VALUE,
          storageOption: row.STORAGE_OPTION,
          isSingleton: row.SINGLETON,
          isBounded: row.BOUNDED,
          type: row.TYPE,
          side: row.SIDE,
          min: row.MIN,
          max: row.MAX,
          writable: row.IS_WRITABLE,
          readable: row.IS_READABLE,
          entryType: row.ARRAY_TYPE,
          reportable: {
            included: row.INCLUDED_REPORTABLE,
            minInterval: row.MIN_INTERVAL,
            maxInterval: row.MAX_INTERVAL,
            change: row.REPORTABLE_CHANGE
          }
        }
      })
    )
}

/**
 * Sets a given cluster to be included on a given endpoint.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} clusterCode
 * @param {*} isIncluded
 * @param {*} side
 */
async function setClusterIncluded(
  db,
  packageId,
  endpointTypeId,
  clusterCode,
  isIncluded,
  side
) {
  let cluster = await queryZcl.selectClusterByCode(db, packageId, clusterCode)
  let clusterState = await selectClusterState(
    db,
    endpointTypeId,
    cluster.id,
    side
  )
  let insertDefaults = clusterState == null
  await insertOrReplaceClusterState(
    db,
    endpointTypeId,
    cluster.id,
    side,
    isIncluded
  )
  if (insertDefaults) {
    await insertClusterDefaults(db, endpointTypeId, packageId, {
      clusterRef: cluster.id,
      side: side
    })
  }
}

// exports
exports.insertOrReplaceClusterState = insertOrReplaceClusterState
exports.selectClusterState = selectClusterState
exports.selectClusterStatesForAllEndpoints = selectClusterStatesForAllEndpoints
exports.insertOrUpdateAttributeState = insertOrUpdateAttributeState
exports.insertOrUpdateCommandState = insertOrUpdateCommandState
exports.insertOrUpdateEventState = insertOrUpdateEventState
exports.convertRestKeyToDbColumn = convertRestKeyToDbColumn
exports.duplicateEndpointType = duplicateEndpointType
exports.selectEndpointClusters = selectEndpointClusters

exports.updateEndpoint = updateEndpoint
exports.updateParentEndpoint = updateParentEndpoint

exports.insertEndpointType = insertEndpointType
exports.updateEndpointType = updateEndpointType

exports.selectCountOfEndpointsWithGivenEndpointIdentifier =
  selectCountOfEndpointsWithGivenEndpointIdentifier
exports.selectEndpointTypeCount = selectEndpointTypeCount
exports.selectEndpointTypeCountByCluster = selectEndpointTypeCountByCluster
exports.selectAllSessionAttributes = selectAllSessionAttributes
exports.insertClusterDefaults = insertClusterDefaults

exports.setClusterIncluded = setClusterIncluded
exports.selectEndpointTypeAttributeId = selectEndpointTypeAttributeId
exports.updateEndpointTypeAttribute = updateEndpointTypeAttribute
