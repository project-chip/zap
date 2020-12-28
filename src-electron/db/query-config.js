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
const dbEnum = require('../../src-shared/db-enum.js')
const queryZcl = require('./query-zcl.js')
const restApi = require('../../src-shared/rest-api.js')
/**
 * Promises to update or insert a key/value pair in SESSION_KEY_VALUE table.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} key
 * @param {*} value
 * @returns A promise of creating or updating a row, resolves with the rowid of a new row.
 */
async function updateKeyValue(db, sessionId, key, value) {
  return dbApi.dbInsert(
    db,
    'INSERT OR REPLACE INTO SESSION_KEY_VALUE (SESSION_REF, KEY, VALUE) VALUES (?,?,?)',
    [sessionId, key, value]
  )
}

/**
 * Promises to insert a key/value pair in SESSION_KEY_VALUE table. Ignore if value already exists.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} key
 * @param {*} value
 * @returns A promise of creating or updating a row, resolves with the rowid of a new row.
 */
async function insertKeyValue(db, sessionId, key, value) {
  return dbApi.dbInsert(
    db,
    'INSERT OR IGNORE INTO SESSION_KEY_VALUE (SESSION_REF, KEY, VALUE) VALUES (?,?,?)',
    [sessionId, key, value]
  )
}

/**
 * Retrieves a value of a single session key.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves with a value or with 'undefined' if none is found.
 */
async function getSessionKeyValue(db, sessionId, key) {
  var row = await dbApi.dbGet(
    db,
    'SELECT VALUE FROM SESSION_KEY_VALUE WHERE SESSION_REF = ? AND KEY = ?',
    [sessionId, key]
  )
  if (row == null) return undefined
  else return row.VALUE
}

/**
 * Resolves to an array of objects that contain 'key' and 'value'
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise to retrieve all session key values.
 */
async function getAllSessionKeyValues(db, sessionId) {
  var rows = await dbApi.dbAll(
    db,
    'SELECT KEY, VALUE FROM SESSION_KEY_VALUE WHERE SESSION_REF = ? ORDER BY KEY',
    [sessionId]
  )
  return rows.map((row) => {
    return {
      key: row.KEY,
      value: row.VALUE,
    }
  })
}

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
 * Promise to get a cluster's state.
 * This must return undefined/null for if the cluster state has not been used before for the endpointType
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef
 * @param {*} side
 */
function getClusterState(db, endpointTypeId, clusterRef, side) {
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
 * Promise that resolves after inserting the defaults associated with the clusterside to the database.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef
 * @param {*} side
 */
async function insertClusterDefaults(db, endpointTypeId, cluster) {
  var promises = []
  promises.push(resolveDefaultAttributes(db, endpointTypeId, [cluster]))
  promises.push(resolveNonOptionalCommands(db, endpointTypeId, [cluster]))
  return Promise.all(promises)
}

/**
 * Promise to update the attribute state.
 * If the attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
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
  paramValuePairArray
) {
  var cluster = await getOrInsertDefaultEndpointTypeCluster(
    db,
    endpointTypeId,
    clusterRef,
    side
  )

  var staticAttribute = await queryZcl.selectAttributeByAttributeIdAndClusterRef(
    db,
    attributeId,
    clusterRef
  )
  return dbApi
    .dbInsert(
      db,
      `
INSERT
INTO ENDPOINT_TYPE_ATTRIBUTE
  ( ENDPOINT_TYPE_REF, ENDPOINT_TYPE_CLUSTER_REF, ATTRIBUTE_REF, DEFAULT_VALUE, STORAGE_OPTION, SINGLETON)
SELECT ?, ?, ?, ?, ?, (SELECT IS_SINGLETON FROM CLUSTER WHERE CLUSTER_ID = ?)
WHERE (
  ( SELECT COUNT(1) FROM ENDPOINT_TYPE_ATTRIBUTE
    WHERE ENDPOINT_TYPE_REF = ?
      AND ENDPOINT_TYPE_CLUSTER_REF = ?
      AND ATTRIBUTE_REF = ? )
    == 0)`,
      [
        endpointTypeId,
        cluster.endpointTypeClusterId,
        attributeId,
        staticAttribute.defaultValue ? staticAttribute.defaultValue : '',
        dbEnum.storageOption.ram,
        clusterRef,
        endpointTypeId,
        cluster.endpointTypeClusterId,
        attributeId,
      ]
    )
    .then(() =>
      dbApi.dbUpdate(
        db,
        'UPDATE ENDPOINT_TYPE_ATTRIBUTE SET ' +
          getAllParamValuePairArrayClauses(paramValuePairArray) +
          'WHERE ENDPOINT_TYPE_REF = ? AND ENDPOINT_TYPE_CLUSTER_REF = ? AND ATTRIBUTE_REF = ?',
        [endpointTypeId, cluster.endpointTypeClusterId, attributeId]
      )
    )
}

function convertRestKeyToDbColumn(key) {
  switch (key) {
    case restApi.updateKey.endpointId:
      return 'ENDPOINT_IDENTIFIER'
    case restApi.updateKey.endpointType:
      return 'ENDPOINT_TYPE_REF'
    case restApi.updateKey.networkId:
      return 'NETWORK_IDENTIFIER'
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
  throw `Invalid rest update key: ${key}`
}

function getAllParamValuePairArrayClauses(paramValuePairArray) {
  return paramValuePairArray.reduce((currentString, paramValuePair, index) => {
    return (
      currentString +
      (index == 0 ? '' : ',') +
      convertRestKeyToDbColumn(paramValuePair.key) +
      ' = ' +
      (paramValuePair.value == ''
        ? false
        : paramValuePair.type == 'text'
        ? "'" + paramValuePair.value + "'"
        : paramValuePair.value) +
      ' '
    )
  }, '')
}

/**
 * Promise to update the command state.
 * If the attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
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
  id,
  value,
  isIncoming
) {
  var cluster = await getOrInsertDefaultEndpointTypeCluster(
    db,
    endpointTypeId,
    clusterRef,
    side
  )

  await dbApi.dbInsert(
    db,
    `
INSERT
INTO ENDPOINT_TYPE_COMMAND
  ( ENDPOINT_TYPE_REF, ENDPOINT_TYPE_CLUSTER_REF, COMMAND_REF )
SELECT ?, ?, ?
WHERE ( ( SELECT COUNT(1)
          FROM ENDPOINT_TYPE_COMMAND
          WHERE ENDPOINT_TYPE_REF = ?
            AND ENDPOINT_TYPE_CLUSTER_REF = ?
            AND COMMAND_REF = ? )
        == 0)`,
    [
      endpointTypeId,
      cluster.endpointTypeClusterId,
      id,
      endpointTypeId,
      cluster.endpointTypeClusterId,
      id,
    ]
  )
  return dbApi.dbUpdate(
    db,
    'UPDATE ENDPOINT_TYPE_COMMAND SET ' +
      (isIncoming ? 'INCOMING' : 'OUTGOING') +
      ' = ? WHERE ENDPOINT_TYPE_REF = ? AND ENDPOINT_TYPE_CLUSTER_REF = ? AND COMMAND_REF = ? ',
    [value, endpointTypeId, cluster.endpointTypeClusterId, id]
  )
}

/**
 * Resolves into all the cluster states.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with cluster states.
 */
async function getAllEndpointTypeClusterState(db, endpointTypeId) {
  var rows = await dbApi.dbAll(
    db,
    `
SELECT
  CLUSTER.NAME,
  CLUSTER.CODE,
  CLUSTER.MANUFACTURER_CODE,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  ENDPOINT_TYPE_CLUSTER.SIDE,
  ENDPOINT_TYPE_CLUSTER.ENABLED
FROM
  ENDPOINT_TYPE_CLUSTER
INNER JOIN CLUSTER
ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?`,
    [endpointTypeId]
  )
  if (rows == null) return []

  var result = rows.map((row) => {
    var obj = {
      endpointTypeClusterId: row.ENDPOINT_TYPE_CLUSTER_ID,
      clusterName: row.NAME,
      clusterCode: row.CODE,
      side: row.SIDE,
      enabled: row.STATE == '1',
    }
    if (row.MANUFACTURER_CODE != null)
      obj.manufacturerCode = row.MANUFACTURER_CODE
    return obj
  })
  return result
}

/**
 * Promises to add an endpoint.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointIdentifier
 * @param {*} endpointTypeRef
 * @param {*} networkIdentifier
 * @returns Promise to update endpoints.
 */
async function insertEndpoint(
  db,
  sessionId,
  endpointIdentifier,
  endpointTypeRef,
  networkIdentifier
) {
  return dbApi.dbInsert(
    db,
    `
INSERT OR REPLACE
INTO ENDPOINT ( SESSION_REF, ENDPOINT_IDENTIFIER, ENDPOINT_TYPE_REF, NETWORK_IDENTIFIER, PROFILE)
VALUES ( ?, ?, ?, ?,
         ( SELECT DEVICE_TYPE.PROFILE_ID
           FROM DEVICE_TYPE, ENDPOINT_TYPE
           WHERE ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ?
             AND ENDPOINT_TYPE.DEVICE_TYPE_REF = DEVICE_TYPE.DEVICE_TYPE_ID ) )`,
    [
      sessionId,
      endpointIdentifier,
      endpointTypeRef,
      networkIdentifier,
      endpointTypeRef,
    ]
  )
}

/**
 * Deletes an endpoint.
 *
 * @export
 * @param {*} db
 * @param {*} id
 * @returns Promise to delete an endpoint that resolves with the number of rows that were deleted.
 */
async function deleteEndpoint(db, id) {
  return dbApi.dbRemove(db, 'DELETE FROM ENDPOINT WHERE ENDPOINT_ID = ?', [id])
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
 * Returns the number of endpoints with a given endpoint_identifier and sessionid.
 * Used for validation
 *
 * @param {*} endpointIdentifier
 * @param {*} sessionId
 * @returns Promise that resolves into a count.
 */
async function getCountOfEndpointsWithGivenEndpointIdentifier(
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
 * Returns a promise resolving into all endpoints.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise resolving into all endpoints.
 */
async function getAllEndpoints(db, sessionId) {
  var rows = await dbApi.dbAll(
    db,
    `
SELECT
  ENDPOINT_ID,
  SESSION_REF,
  ENDPOINT_TYPE_REF,
  PROFILE,
  ENDPOINT_IDENTIFIER,
  NETWORK_IDENTIFIER
FROM ENDPOINT
WHERE SESSION_REF = ?
ORDER BY ENDPOINT_IDENTIFIER
    `,
    [sessionId]
  )
  return rows.map(dbMapping.map.endpoint)
}

/**
 * Returns a promise of a single endpoint.
 * Mayb resolve into null if invalid reference.
 *
 * @param {*} db
 * @param {*} endpointRef
 * @returns Promise of an endpoint.
 */
async function selectEndpoint(db, endpointRef) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  ENDPOINT_ID,
  SESSION_REF,
  ENDPOINT_IDENTIFIER,
  ENDPOINT_TYPE_REF,
  PROFILE,
  NETWORK_IDENTIFIER
FROM ENDPOINT
WHERE ENDPOINT_ID = ?`,
      [endpointRef]
    )
    .then(dbMapping.map.endpoint)
}

/**
 * Promises to add an endpoint type.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} name
 * @param {*} deviceTypeRef
 * @returns Promise to update endpoints.
 */
async function insertEndpointType(db, sessionId, name, deviceTypeRef) {
  return dbApi
    .dbInsert(
      db,
      'INSERT OR REPLACE INTO ENDPOINT_TYPE ( SESSION_REF, NAME, DEVICE_TYPE_REF ) VALUES ( ?, ?, ?)',
      [sessionId, name, deviceTypeRef]
    )
    .then((newEndpointId) =>
      setEndpointDefaults(db, newEndpointId, deviceTypeRef).then(
        () => newEndpointId
      )
    )
}

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
 * Promise to update a an endpoint type.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointTypeId
 * @param {*} param
 * @param {*} updatedValue
 */
async function updateEndpointType(
  db,
  sessionId,
  endpointTypeId,
  updateKey,
  updatedValue
) {
  var param = convertRestKeyToDbColumn(updateKey)
  return dbApi
    .dbUpdate(
      db,
      `UPDATE ENDPOINT_TYPE SET ${param} = ? WHERE ENDPOINT_TYPE_ID = ? AND SESSION_REF = ?`,
      [updatedValue, endpointTypeId, sessionId]
    )
    .then((newEndpointId) => {
      if (param === 'DEVICE_TYPE_REF') {
        return new Promise((resolve, reject) =>
          setEndpointDefaults(db, endpointTypeId, updatedValue).then(
            (newData) => {
              resolve(newEndpointId)
            }
          )
        )
      } else {
        return new Promise((resolve, reject) => resolve(newEndpointId))
      }
    })
}

/**
 * Promise to set the default attributes and clusters for a endpoint type.
 * @param {*} db
 * @param {*} endpointTypeId
 */
async function setEndpointDefaults(db, endpointTypeId, deviceTypeRef) {
  return dbApi
    .dbBeginTransaction(db)
    .then(() =>
      queryZcl.selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef)
    )
    .then((clusters) => {
      var promises = []
      var clusterPromise = resolveDefaultClusters(db, endpointTypeId, clusters)
      promises.push(
        resolveDefaultDeviceTypeAttributes(db, endpointTypeId, deviceTypeRef)
      )
      promises.push(
        resolveDefaultDeviceTypeCommands(db, endpointTypeId, deviceTypeRef)
      )
      promises.push(
        clusterPromise.then((data) => {
          var allClusters = data.flat()
          var dataPromises = new Promise((resolve, reject) => {
            promises.push(
              resolveDefaultAttributes(db, endpointTypeId, allClusters)
            )
            promises.push(
              resolveNonOptionalCommands(db, endpointTypeId, allClusters)
            )
            resolve()
          })
          return Promise.all([dataPromises])
        })
      )
      return Promise.all(promises)
    })
    .catch((err) => {
      console.log(err)
    })
    .finally((data) => dbApi.dbCommit(db))
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
  var promises = clusters.map((cluster) => {
    var clientServerPromise = []
    if (cluster.includeClient) {
      clientServerPromise.push(
        new Promise((resolve, reject) =>
          insertOrReplaceClusterState(
            db,
            endpointTypeId,
            cluster.clusterRef,
            dbEnum.side.client,
            true
          ).then((data) => {
            resolve({
              clusterRef: cluster.clusterRef,
              side: dbEnum.side.client,
            })
          })
        )
      )
    }
    if (cluster.includeServer) {
      clientServerPromise.push(
        new Promise((resolve, reject) =>
          insertOrReplaceClusterState(
            db,
            endpointTypeId,
            cluster.clusterRef,
            dbEnum.side.server,
            true
          ).then((data) => {
            resolve({
              clusterRef: cluster.clusterRef,
              side: dbEnum.side.server,
            })
          })
        )
      )
    }
    return Promise.all(clientServerPromise)
  })
  return Promise.all(promises)
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
  return queryZcl
    .selectDeviceTypeAttributesByDeviceTypeRef(db, deviceTypeRef)
    .then((deviceTypeAttributes) => {
      return Promise.all(
        deviceTypeAttributes.map((deviceAttribute) => {
          if (deviceAttribute.attributeRef != null) {
            return queryZcl
              .selectAttributeById(db, deviceAttribute.attributeRef)
              .then((attribute) => {
                Promise.all([
                  insertOrUpdateAttributeState(
                    db,
                    endpointTypeId,
                    attribute.clusterRef,
                    attribute.side,
                    deviceAttribute.attributeRef,
                    [
                      { key: restApi.updateKey.attributeSelected, value: true },
                      {
                        key: restApi.updateKey.attributeReporting,
                        value: deviceAttribute.isReportable == true,
                      },
                    ]
                  ),
                ])
              })
          } else {
            return new Promise((resolve, reject) => {
              return resolve()
            })
          }
        })
      )
    })
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
  return queryZcl
    .selectDeviceTypeCommandsByDeviceTypeRef(db, deviceTypeRef)
    .then((commands) => {
      return Promise.all(
        commands.map((deviceCommand) => {
          return queryZcl
            .selectDeviceTypeClusterByDeviceTypeClusterId(
              db,
              deviceCommand.deviceTypeClusterRef
            )
            .then((deviceTypeCluster) => {
              if (deviceCommand.commandRef != null) {
                return queryZcl
                  .selectCommandById(db, deviceCommand.commandRef)
                  .then((command) => {
                    if (command != null) {
                      var promises = []
                      if (deviceTypeCluster.includeClient == 1) {
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
                      if (deviceTypeCluster.includeServer == 1) {
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
                    } else {
                      return Promise.resolve()
                    }
                  })
              } else {
                return new Promise((resolve, reject) => {
                  return resolve()
                })
              }
            })
        })
      )
    })
}

async function resolveNonOptionalCommands(db, endpointTypeId, clusters) {
  return Promise.all(
    clusters.map((cluster) => {
      return queryZcl
        .selectCommandsByClusterId(db, cluster.clusterRef)
        .then((commands) => {
          return Promise.all(
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
                return new Promise((resolve, reject) => {
                  return resolve()
                })
              }
            })
          )
        })
    })
  )
}

async function resolveDefaultAttributes(db, endpointTypeId, clusters) {
  return Promise.all(
    clusters.map((cluster) => {
      return queryZcl
        .selectAttributesByClusterId(db, cluster.clusterRef)
        .then((attributes) => {
          var promiseArray = []
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
    })
  )
}

async function resolveNonOptionalAndReportableAttributes(
  db,
  endpointTypeId,
  attributes,
  cluster
) {
  return Promise.all(
    attributes.map((attribute) => {
      var settings = []
      if (attribute.isReportable)
        settings.push({
          key: restApi.updateKey.attributeReporting,
          value: true,
        })
      if (!attribute.isOptional) {
        settings.push({
          key: restApi.updateKey.attributeSelected,
          value: true,
        })
      }
      if (cluster.isSingleton) {
        settings.push({
          key: restApi.updateKey.attributeSingleton,
          value: true,
        })
      }
      if (settings.length > 0) {
        return insertOrUpdateAttributeState(
          db,
          endpointTypeId,
          cluster.clusterRef,
          attribute.side,
          attribute.id,
          settings
        )
      } else return Promise.resolve()
    })
  )
}

/**
 * Inserts endpoint types.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpoints
 */
async function insertEndpointTypes(db, sessionId, endpoints) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO ENDPOINT_TYPE (SESSION_REF, NAME, DEVICE_TYPE_REF) VALUES (?,?,?)',
    endpoints.map((endpoint) => {
      return [sessionId, endpoint.name, endpoint.deviceTypeId]
    })
  )
}

/**
 * Resolves into the number of endpoint types for session.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise that resolves into a count.
 */
async function getEndpointTypeCount(db, sessionId) {
  var x = await dbApi.dbGet(
    db,
    'SELECT COUNT(ENDPOINT_TYPE_ID) FROM ENDPOINT_TYPE WHERE SESSION_REF = ?',
    [sessionId]
  )
  return x['COUNT(ENDPOINT_TYPE_ID)']
}

/**
 * Resolves into the number of endpoint types for session.
 * by cluster ID
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise that resolves into a count.
 */
async function getEndpointTypeCountByCluster(
  db,
  sessionId,
  endpointClusterId,
  side
) {
  var x = await dbApi.dbGet(
    db,
    `SELECT COUNT(ENDPOINT_TYPE_ID) FROM ENDPOINT_TYPE WHERE SESSION_REF = ? AND ENDPOINT_TYPE_ID IN
      (SELECT ENDPOINT_TYPE_REF FROM ENDPOINT_TYPE_CLUSTER WHERE CLUSTER_REF = ? AND SIDE = ? AND ENABLED = 1) `,
    [sessionId, endpointClusterId, side]
  )
  return x['COUNT(ENDPOINT_TYPE_ID)']
}

/**
 * Extracts raw endpoint types rows.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
async function getAllEndpointTypes(db, sessionId) {
  var rows = await dbApi.dbAll(
    db,
    'SELECT ENDPOINT_TYPE_ID, NAME, DEVICE_TYPE_REF FROM ENDPOINT_TYPE WHERE SESSION_REF = ? ORDER BY NAME',
    [sessionId]
  )
  return rows.map(dbMapping.map.endpointType)
}

/**
 * Extracts endpoint type row.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns promise that resolves into rows in the database table.
 */
async function getEndpointType(db, endpointTypeId) {
  return dbApi
    .dbGet(
      db,
      'SELECT ENDPOINT_TYPE_ID, NAME, DEVICE_TYPE_REF FROM ENDPOINT_TYPE WHERE ENDPOINT_TYPE_ID = ?',
      [endpointTypeId]
    )
    .then(dbMapping.map.endpointType)
}

/**
 * Extracts clusters from the endpoint_type_cluster table.
 *
 * @export
 * @param {*} endpointTypeId
 * @returns A promise that resolves into the rows.
 */
async function getEndpointTypeClusters(db, endpointTypeId) {
  var rows = await dbApi.dbAll(
    db,
    `
SELECT
  ENDPOINT_TYPE_CLUSTER_ID,
  ENDPOINT_TYPE_REF,
  CLUSTER_REF,
  SIDE,
  ENABLED
FROM ENDPOINT_TYPE_CLUSTER
WHERE ENDPOINT_TYPE_REF = ?`,
    [endpointTypeId]
  )
  return rows.map(dbMapping.map.endpointTypeCluster)
}

/**
 * Get or inserts default endpoint type cluster given endpoint type, cluster ref, and side.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterRef
 * @param {*} side
 */

async function getOrInsertDefaultEndpointTypeCluster(
  db,
  endpointTypeId,
  clusterRef,
  side
) {
  return dbApi
    .dbInsert(
      db,
      `
INSERT INTO ENDPOINT_TYPE_CLUSTER (ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED)
SELECT ?, ?, ?, ?
WHERE  (
  ( SELECT COUNT(1) FROM ENDPOINT_TYPE_CLUSTER
    WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?
      AND ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = ?
      AND ENDPOINT_TYPE_CLUSTER.SIDE = ?) == 0 )`,
      [
        endpointTypeId,
        clusterRef,
        side,
        false,
        endpointTypeId,
        clusterRef,
        side,
      ]
    )
    .then((rows) => {
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
WHERE ENDPOINT_TYPE_REF = ?
  AND CLUSTER_REF = ?
  AND SIDE = ?`,
          [endpointTypeId, clusterRef, side]
        )
        .then((eptClusterData) => {
          return dbMapping.map.endpointTypeCluster(eptClusterData)
        })
    })
}

/**
 * Extracts attributes from the endpoint_type_attribute table.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns A promise that resolves into the rows.
 */
async function getEndpointTypeAttributes(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  ENDPOINT_TYPE_ATTRIBUTE.INCLUDED,
  ENDPOINT_TYPE_ATTRIBUTE.STORAGE_OPTION,
  ENDPOINT_TYPE_ATTRIBUTE.SINGLETON,
  ENDPOINT_TYPE_ATTRIBUTE.BOUNDED,
  ENDPOINT_TYPE_ATTRIBUTE.DEFAULT_VALUE
FROM ENDPOINT_TYPE_ATTRIBUTE, ENDPOINT_TYPE_CLUSTER
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID = ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF
  AND ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF = ?`,
      [endpointTypeId]
    )
    .then((rows) =>
      rows.map((row) => {
        return {
          attributeId: row.ATTRIBUTE_REF,
          isIncluded: row.INCLUDED,
          storageOption: row.STORAGE_OPTION,
          isSingleton: row.SINGLETON,
          isBounded: row.BOUNDED,
          defaultValue: row.DEFAULT_VALUE,
        }
      })
    )
}

/**
 * Extracts commands from the endpoint_type_command table.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns A promise that resolves into the rows.
 */
async function getEndpointTypeCommands(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      'SELECT COMMAND_REF, INCOMING, OUTGOING FROM ENDPOINT_TYPE_COMMAND WHERE ENDPOINT_TYPE_REF = ?',
      [endpointTypeId]
    )
    .then((rows) =>
      rows.map((row) => {
        return {
          commandID: row.COMMAND_REF,
          isIncoming: row.INCOMING,
          isOutgoing: row.OUTGOING,
        }
      })
    )
}

/**
 * Retrieves all the attribute data for the session.
 *
 * @param {*} db
 * @param {*} sessionId
 */
async function getAllSessionAttributes(db, sessionId) {
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
  ETA.INCLUDED_REPORTABLE,
  ETA.MIN_INTERVAL,
  ETA.MAX_INTERVAL,
  ETA.REPORTABLE_CHANGE
FROM
  ENDPOINT_TYPE_ATTRIBUTE AS ETA
JOIN
  ENDPOINT_TYPE_CLUSTER AS ETC ON ETA.ENDPOINT_TYPE_CLUSTER_REF = ETC.ENDPOINT_TYPE_CLUSTER_ID
JOIN
  CLUSTER AS C ON ETC.CLUSTER_REF = C.CLUSTER_ID
JOIN
  ATTRIBUTE AS A ON ETA.ATTRIBUTE_REF = A.ATTRIBUTE_ID
JOIN
  ENDPOINT_TYPE AS ET ON ETA.ENDPOINT_TYPE_REF = ET.ENDPOINT_TYPE_ID
WHERE
  ET.SESSION_REF = ? AND ETA.INCLUDED = 1
ORDER BY
  CLUSTER_CODE, ATTRIBUTE_CODE
  `,
      [sessionId]
    )
    .then((rows) =>
      rows.map((row) => {
        return {
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
          reportable: {
            included: row.INCLUDED_REPORTABLE,
            minInterval: row.MIN_INTERVAL,
            maxInterval: row.MAX_INTERVAL,
            change: row.REPORTABLE_CHANGE,
          },
        }
      })
    )
}

// exports
exports.updateKeyValue = updateKeyValue
exports.insertKeyValue = insertKeyValue
exports.getSessionKeyValue = getSessionKeyValue
exports.getAllSessionKeyValues = getAllSessionKeyValues
exports.insertOrReplaceClusterState = insertOrReplaceClusterState
exports.getClusterState = getClusterState
exports.insertOrUpdateAttributeState = insertOrUpdateAttributeState
exports.insertOrUpdateCommandState = insertOrUpdateCommandState
exports.getAllEndpointTypeClusterState = getAllEndpointTypeClusterState
exports.convertRestKeyToDbColumn = convertRestKeyToDbColumn
exports.insertEndpoint = insertEndpoint
exports.deleteEndpoint = deleteEndpoint
exports.updateEndpoint = updateEndpoint
exports.selectEndpoint = selectEndpoint
exports.insertEndpointType = insertEndpointType
exports.deleteEndpointType = deleteEndpointType
exports.updateEndpointType = updateEndpointType
exports.insertEndpointTypes = insertEndpointTypes
exports.getAllEndpointTypes = getAllEndpointTypes
exports.getEndpointTypeClusters = getEndpointTypeClusters
exports.getOrInsertDefaultEndpointTypeCluster = getOrInsertDefaultEndpointTypeCluster
exports.getEndpointTypeAttributes = getEndpointTypeAttributes
exports.getEndpointTypeCommands = getEndpointTypeCommands
exports.getAllEndpoints = getAllEndpoints
exports.getCountOfEndpointsWithGivenEndpointIdentifier = getCountOfEndpointsWithGivenEndpointIdentifier
exports.getEndpointTypeCount = getEndpointTypeCount
exports.getEndpointTypeCountByCluster = getEndpointTypeCountByCluster
exports.getAllSessionAttributes = getAllSessionAttributes
exports.insertClusterDefaults = insertClusterDefaults
exports.getEndpointType = getEndpointType
