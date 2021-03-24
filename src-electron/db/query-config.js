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
const _ = require('lodash')

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
async function getClusterState(db, endpointTypeId, clusterRef, side) {
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
  let promises = []
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
  let cluster = await getOrInsertDefaultEndpointTypeCluster(
    db,
    endpointTypeId,
    clusterRef,
    side
  )

  let staticAttribute = await queryZcl.selectAttributeByAttributeIdAndClusterRef(
    db,
    attributeId,
    clusterRef
  )

  await dbApi.dbInsert(
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
  let query =
    'UPDATE ENDPOINT_TYPE_ATTRIBUTE SET ' +
    getAllParamValuePairArrayClauses(paramValuePairArray) +
    'WHERE ENDPOINT_TYPE_REF = ? AND ENDPOINT_TYPE_CLUSTER_REF = ? AND ATTRIBUTE_REF = ?'

  return dbApi.dbUpdate(db, query, [
    endpointTypeId,
    cluster.endpointTypeClusterId,
    attributeId,
  ])
}

async function updateEndpointTypeAttribute(db, id, restKey, value) {
  let column = convertRestKeyToDbColumn(restKey)
  return dbApi.dbUpdate(
    db,
    `UPDATE ENDPOINT_TYPE_ATTRIBUTE
SET ${column} = ?
WHERE ENDPOINT_TYPE_ATTRIBUTE_ID = ?
  `,
    [value, id]
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
    if (index > 0) currentString += ','
    currentString += convertRestKeyToDbColumn(paramValuePair.key)
    currentString += ' = '
    if (_.isBoolean(paramValuePair.value)) {
      currentString += paramValuePair.value ? '1' : '0'
    } else if (paramValuePair.value == '') {
      currentString += false
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
  let cluster = await getOrInsertDefaultEndpointTypeCluster(
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
  let rows = await dbApi.dbAll(
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

  let result = rows.map((row) => {
    let obj = {
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
  let rows = await dbApi.dbAll(
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
 * Promises to add an endpoint type.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} name
 * @param {*} deviceTypeRef
 * @returns Promise to update endpoints.
 */
async function insertEndpointType(
  db,
  sessionId,
  name,
  deviceTypeRef,
  doTransaction = true
) {
  let newEndpointTypeId = await dbApi.dbInsert(
    db,
    'INSERT OR REPLACE INTO ENDPOINT_TYPE ( SESSION_REF, NAME, DEVICE_TYPE_REF ) VALUES ( ?, ?, ?)',
    [sessionId, name, deviceTypeRef]
  )
  await setEndpointDefaults(db, newEndpointTypeId, deviceTypeRef, doTransaction)
  return newEndpointTypeId
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
  let param = convertRestKeyToDbColumn(updateKey)
  let newEndpointId = await dbApi.dbUpdate(
    db,
    `UPDATE ENDPOINT_TYPE SET ${param} = ? WHERE ENDPOINT_TYPE_ID = ? AND SESSION_REF = ?`,
    [updatedValue, endpointTypeId, sessionId]
  )
  if (param === 'DEVICE_TYPE_REF') {
    await setEndpointDefaults(db, endpointTypeId, updatedValue)
  }
  return newEndpointId
}

/**
 * Promise to set the default attributes and clusters for a endpoint type.
 * @param {*} db
 * @param {*} endpointTypeId
 */
async function setEndpointDefaults(
  db,
  endpointTypeId,
  deviceTypeRef,
  doTransaction = true
) {
  if (doTransaction) {
    await dbApi.dbBeginTransaction(db)
  }
  let clusters = await queryZcl.selectDeviceTypeClustersByDeviceTypeRef(
    db,
    deviceTypeRef
  )
  let defaultClusters = await resolveDefaultClusters(
    db,
    endpointTypeId,
    clusters
  )
  defaultClusters = defaultClusters.flat()

  let promises = []

  promises.push(
    resolveDefaultDeviceTypeAttributes(db, endpointTypeId, deviceTypeRef),
    resolveDefaultDeviceTypeCommands(db, endpointTypeId, deviceTypeRef),
    resolveDefaultAttributes(db, endpointTypeId, defaultClusters),
    resolveNonOptionalCommands(db, endpointTypeId, defaultClusters)
  )

  return Promise.all(promises)
    .catch((err) => {
      console.log(err)
    })
    .finally((data) => {
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
              .then((attribute) =>
                insertOrUpdateAttributeState(
                  db,
                  endpointTypeId,
                  attribute.clusterRef,
                  attribute.side,
                  deviceAttribute.attributeRef,
                  [
                    {
                      key: restApi.updateKey.attributeSelected,
                      value: true,
                    },
                    {
                      key: restApi.updateKey.attributeReporting,
                      value: deviceAttribute.isReportable == true,
                    },
                  ]
                )
              )
          } else {
            return Promise.resolve()
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
    .then((commands) =>
      Promise.all(
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
                    } else {
                      return Promise.resolve()
                    }
                  })
              } else {
                return Promise.resolve()
              }
            })
        })
      )
    )
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
      let settings = []
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
      } else {
        return Promise.resolve()
      }
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
  let x = await dbApi.dbGet(
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
  let x = await dbApi.dbGet(
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
  let rows = await dbApi.dbAll(
    db,
    'SELECT ENDPOINT_TYPE_ID, NAME, DEVICE_TYPE_REF, SESSION_REF FROM ENDPOINT_TYPE WHERE SESSION_REF = ? ORDER BY NAME',
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
  let rows = await dbApi.dbAll(
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
  await dbApi.dbInsert(
    db,
    `
INSERT INTO ENDPOINT_TYPE_CLUSTER (ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED)
SELECT ?, ?, ?, ?
WHERE  (
  ( SELECT COUNT(1) FROM ENDPOINT_TYPE_CLUSTER
    WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?
      AND ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = ?
      AND ENDPOINT_TYPE_CLUSTER.SIDE = ?) == 0 )`,
    [endpointTypeId, clusterRef, side, false, endpointTypeId, clusterRef, side]
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
async function getEndpointTypeAttributeId(
  db,
  endpointTypeId,
  clusterCode,
  attributeCode,
  attributeSide,
  mfgCode
) {
  let args = [endpointTypeId, clusterCode, attributeCode, attributeSide]
  if (!(mfgCode == 0 || mfgCode == null)) args.push(mfgCode)
  let rows = await dbApi.dbAll(
    db,
    `
SELECT 
  ENDPOINT_TYPE_ATTRIBUTE_ID
FROM 
  ENDPOINT_TYPE_ATTRIBUTE AS ETA
INNER JOIN
  ATTRIBUTE AS A
ON
  ETA.ATTRIBUTE_REF = A.ATTRIBUTE_ID 
INNER JOIN
  CLUSTER AS C
ON 
  C.CLUSTER_ID = A.CLUSTER_REF
WHERE
  ETA.ENDPOINT_TYPE_REF = ?
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
    throw Error(
      `Ambiguity: multiple attributes with same data loaded: ${endpointTypeId} / ${clusterCode} / ${attributeCode} / ${attributeSide}.`
    )
  }
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
  A.ARRAY_TYPE,
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
  clusterCode,
  isIncluded,
  side
) {
  return true
}

// exports
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
exports.getEndpointType = getEndpointType

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

exports.setClusterIncluded = setClusterIncluded
exports.getEndpointTypeAttributeId = getEndpointTypeAttributeId
exports.updateEndpointTypeAttribute = updateEndpointTypeAttribute
