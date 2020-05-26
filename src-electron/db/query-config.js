// Copyright (c) 2020 Silicon Labs. All rights reserved.

/**
 * This module provides queries for user configuration.
 *
 * @module DB API: user configuration queries against the database.
 */
import {
  dbAll,
  dbBeginTransaction,
  dbCommit,
  dbGet,
  dbInsert,
  dbMultiInsert,
  dbRemove,
  dbUpdate,
} from './db-api.js'
import { dbMap } from './db-mapping.js'
import {
  selectAttributeById,
  selectDeviceTypeAttributesByDeviceTypeRef,
  selectDeviceTypeClustersByDeviceTypeRef,
  selectDeviceTypeCommandsByDeviceTypeRef,
  selectCommandsByClusterId,
  selectAttributesByClusterId,
} from './query-zcl.js'

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
export function updateKeyValue(db, sessionId, key, value) {
  return dbInsert(
    db,
    'INSERT OR REPLACE INTO SESSION_KEY_VALUE (SESSION_REF, KEY, VALUE) VALUES (?,?,?)',
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
export function getSessionKeyValue(db, sessionId, key) {
  return dbGet(
    db,
    'SELECT VALUE FROM SESSION_KEY_VALUE WHERE SESSION_REF = ? AND KEY = ?',
    [sessionId, key]
  ).then(
    (row) =>
      new Promise((resolve, reject) => {
        if (row == null) resolve(undefined)
        else resolve(row.VALUE)
      })
  )
}

/**
 * Resolves to an array of objects that contain 'key' and 'value'
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise to retrieve all session key values.
 */
export function getAllSessionKeyValues(db, sessionId) {
  return dbAll(
    db,
    'SELECT KEY, VALUE FROM SESSION_KEY_VALUE WHERE SESSION_REF = ? ORDER BY KEY',
    [sessionId]
  ).then(
    (rows) =>
      new Promise((resolve, reject) => {
        resolve(
          rows.map((row) => {
            return {
              key: row.KEY,
              value: row.VALUE,
            }
          })
        )
      })
  )
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
export function insertOrReplaceClusterState(
  db,
  endpointTypeId,
  clusterRef,
  side,
  enabled
) {
  return dbGet(
    db,
    'SELECT COUNT(1) FROM ENDPOINT_TYPE_CLUSTER WHERE ENDPOINT_TYPE_REF = ? AND CLUSTER_REF = ? AND SIDE = ?',
    [endpointTypeId, clusterRef, side]
  ).then((count) => {
    if (count['COUNT(1)'] > 0) {
      return dbUpdate(
        db,
        'UPDATE ENDPOINT_TYPE_CLUSTER SET ENABLED = ? WHERE ENDPOINT_TYPE_REF = ? AND CLUSTER_REF = ? AND SIDE = ?',
        [enabled, endpointTypeId, clusterRef, side]
      )
    } else {
      return dbInsert(
        db,
        'INSERT OR REPLACE INTO ENDPOINT_TYPE_CLUSTER ( ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED ) VALUES ( ?, ?, ?, ?)',
        [endpointTypeId, clusterRef, side, enabled]
      )
    }
  })
}

/**
 * Promise to update the attribute state.
 * If the attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
 * Afterwards, update entry.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} attributeId
 * @param {*} value
 * @param {*} booleanParam
 */
export function insertOrUpdateAttributeState(
  db,
  endpointTypeId,
  attributeId,
  value,
  param
) {
  return selectAttributeById(db, attributeId).then((staticAttribute) => {
    return dbGet(
      db,
      'SELECT COUNT(1) FROM ENDPOINT_TYPE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? AND ATTRIBUTE_REF = ?',
      [endpointTypeId, attributeId]
    ).then((count) => {
      return (count['COUNT(1)'] == 0
        ? dbInsert(
            db,
            'INSERT INTO ENDPOINT_TYPE_ATTRIBUTE (ENDPOINT_TYPE_REF, ATTRIBUTE_REF, DEFAULT_VALUE) VALUES ( ?, ?, ?)',
            [
              endpointTypeId,
              attributeId,
              staticAttribute.defaultValue ? staticAttribute.defaultValue : '',
            ]
          )
        : new Promise((resolve, reject) => {
            resolve()
          })
      ).then((promiseResult) =>
        dbUpdate(
          db,
          'UPDATE ENDPOINT_TYPE_ATTRIBUTE SET ' +
            param +
            ' = ? WHERE ENDPOINT_TYPE_REF = ? AND ATTRIBUTE_REF = ?',
          [value, endpointTypeId, attributeId]
        )
      )
    })
  })
}

/**
 * Promise to update the command state.
 * If the attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
 * Afterwards, update entry.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} id
 * @param {*} value
 * @param {*} booleanParam
 */
export function insertOrUpdateCommandState(
  db,
  endpointTypeId,
  id,
  value,
  param
) {
  return dbGet(
    db,
    'SELECT COUNT(1) FROM ENDPOINT_TYPE_COMMAND WHERE ENDPOINT_TYPE_REF = ? AND COMMAND_REF = ?',
    [endpointTypeId, id]
  ).then((count) => {
    return (count['COUNT(1)'] == 0
      ? dbInsert(
          db,
          'INSERT INTO ENDPOINT_TYPE_COMMAND (ENDPOINT_TYPE_REF, COMMAND_REF) VALUES ( ?, ?)',
          [endpointTypeId, id]
        )
      : new Promise((resolve, reject) => {
          resolve()
        })
    ).then((promiseResult) =>
      dbUpdate(
        db,
        'UPDATE ENDPOINT_TYPE_COMMAND SET ' +
          param +
          ' = ? WHERE ENDPOINT_TYPE_REF = ? AND COMMAND_REF = ?',
        [value, endpointTypeId, id]
      )
    )
  })
}

/**
 * Promise to update the reportable attribute state.
 * If the reportable attribute entry [as defined uniquely by endpointTypeId and id], is not there, then create a default entry
 * Afterwards, update entry.
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} id
 * @param {*} value
 * @param {*} booleanParam
 */
export function insertOrUpdateReportableAttributeState(
  db,
  endpointTypeId,
  id,
  value,
  param
) {
  return dbGet(
    db,
    'SELECT COUNT(1) FROM ENDPOINT_TYPE_REPORTABLE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? AND ATTRIBUTE_REF = ?',
    [endpointTypeId, id]
  ).then((count) => {
    return (count['COUNT(1)'] == 0
      ? dbInsert(
          db,
          'INSERT INTO ENDPOINT_TYPE_REPORTABLE_ATTRIBUTE (ENDPOINT_TYPE_REF, ATTRIBUTE_REF) VALUES ( ?, ?)',
          [endpointTypeId, id]
        )
      : new Promise((resolve, reject) => {
          resolve()
        })
    ).then((promiseResult) =>
      dbUpdate(
        db,
        'UPDATE ENDPOINT_TYPE_REPORTABLE_ATTRIBUTE SET ' +
          param +
          ' = ? WHERE ENDPOINT_TYPE_REF = ? AND ATTRIBUTE_REF = ?',
        [value, endpointTypeId, id]
      )
    )
  })
}

/**
 * Resolves into all the cluster states.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with cluster states.
 */
export function getAllEndpointTypeClusterState(db, endpointTypeId) {
  return dbAll(
    db,
    'SELECT CLUSTER.NAME, CLUSTER.CODE, CLUSTER.MANUFACTURER_CODE, ENDPOINT_TYPE_CLUSTER.SIDE, ENDPOINT_TYPE_CLUSTER.ENABLED FROM ENDPOINT_TYPE_CLUSTER INNER JOIN CLUSTER WHERE ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?',
    [endpointTypeId]
  ).then(
    (rows) =>
      new Promise((resolve, reject) => {
        if (rows == null) {
          resolve([])
        } else {
          var result = rows.map((row) => {
            var obj = {
              clusterName: row.NAME,
              clusterCode: row.CODE,
              side: row.SIDE,
              enabled: row.STATE == '1',
            }
            if (row.MANUFACTURER_CODE != null)
              obj.manufacturerCode = row.MANUFACTURER_CODE
            return obj
          })
          resolve(result)
        }
      })
  )
}

/**
 * Promises to add an endpoint.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointId
 * @param {*} endpointTypeRef
 * @param {*} networkId
 * @returns Promise to update endpoints.
 */
export function insertEndpoint(
  db,
  sessionId,
  endpointId,
  endpointTypeRef,
  networkId
) {
  return dbInsert(
    db,
    'INSERT OR REPLACE INTO ENDPOINT ( SESSION_REF, ENDPOINT_ID, ENDPOINT_TYPE_REF, NETWORK_ID ) VALUES ( ?, ?, ?, ?)',
    [sessionId, endpointId, endpointTypeRef, networkId]
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
export function deleteEndpoint(db, id) {
  return dbRemove(db, 'DELETE FROM ENDPOINT WHERE ENDPOINT_REF = ?', [id])
}

export function updateEndpoint(
  db,
  sessionId,
  endpointRef,
  param,
  updatedValue
) {
  return dbUpdate(
    db,
    `UPDATE ENDPOINT SET ${param} = ? WHERE ENDPOINT_REF = ? AND SESSION_REF = ?`,
    [updatedValue, endpointRef, sessionId]
  )
}

export function selectEndpoint(db, endpointRef) {
  return dbGet(
    db,
    'SELECT ENDPOINT_REF, SESSION_REF, ENDPOINT_ID, ENDPOINT_TYPE_REF, PROFILE, NETWORK_ID FROM ENDPOINT WHERE ENDPOINT_REF = ?',
    [endpointRef]
  ).then(dbMap.endpoint)
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
export function insertEndpointType(db, sessionId, name, deviceTypeRef) {
  return dbInsert(
    db,
    'INSERT OR REPLACE INTO ENDPOINT_TYPE ( SESSION_REF, NAME, DEVICE_TYPE_REF ) VALUES ( ?, ?, ?)',
    [sessionId, name, deviceTypeRef]
  ).then((newEndpointId) => {
    return setEndpointDefaults(db, newEndpointId, deviceTypeRef).then(
      (newData) => {
        return newEndpointId
      }
    )
  })
}

/**
 * Promise to delete an endpoint type.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} id
 */

export function deleteEndpointType(db, id) {
  return dbRemove(db, 'DELETE FROM ENDPOINT_TYPE WHERE ENDPOINT_TYPE_ID = ?', [
    id,
  ])
}

/**
 * Deletes referenced things. This should be done with CASCADE DELETE
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise of removal.
 */
export function deleteEndpointTypeData(db, endpointTypeId) {
  return Promise.all([
    dbRemove(
      db,
      'DELETE FROM ENDPOINT_TYPE_CLUSTER WHERE ENDPOINT_TYPE_REF = ?',
      [endpointTypeId]
    ),
    dbRemove(
      db,
      'DELETE FROM ENDPOINT_TYPE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ?',
      [endpointTypeId]
    ),
    dbRemove(
      db,
      'DELETE FROM ENDPOINT_TYPE_COMMAND WHERE ENDPOINT_TYPE_REF = ?',
      [endpointTypeId]
    ),
    dbRemove(
      db,
      'DELETE FROM ENDPOINT_TYPE_REPORTABLE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? ',
      [endpointTypeId]
    ),
  ])
}

/**
 * Promise to update a an endpoint type.
 * @param {*} db
 * @param {*} sessionId
 * @param {*} endpointTypeId
 * @param {*} param
 * @param {*} updatedValue
 */
export function updateEndpointType(
  db,
  sessionId,
  endpointTypeId,
  param,
  updatedValue
) {
  return dbUpdate(
    db,
    `UPDATE ENDPOINT_TYPE SET ${param} = ? WHERE ENDPOINT_TYPE_ID = ? AND SESSION_REF = ?`,
    [updatedValue, endpointTypeId, sessionId]
  ).then((newEndpointId) => {
    if (param === 'DEVICE_TYPE_REF') {
      return new Promise((resolve, reject) =>
        deleteEndpointTypeData(db, endpointTypeId).then((newData) =>
          setEndpointDefaults(db, endpointTypeId, updatedValue).then(
            (newData) => {
              resolve(newEndpointId)
            }
          )
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
export function setEndpointDefaults(db, endpointTypeId, deviceTypeRef) {
  return dbBeginTransaction(db)
    .then((data) => {
      var promises = []
      var clusterPromise = resolveDefaultClusters(
        db,
        endpointTypeId,
        deviceTypeRef
      )
      promises.push(
        resolveDefaultDeviceTypeAttributes(db, endpointTypeId, deviceTypeRef)
      )
      promises.push(
        resolveDefaultDeviceTypeCommands(db, endpointTypeId, deviceTypeRef)
      )
      promises.push(
        clusterPromise.then((data) => {
          var clusters = data.flat()
          var dataPromises = new Promise((resolve, reject) => {
            promises.push(
              resolveDefaultAttributes(db, endpointTypeId, clusters)
            )
            promises.push(
              resolveNonOptionalCommands(db, endpointTypeId, clusters)
            )
            resolve()
          })
          return Promise.all([dataPromises])
        })
      )
      return Promise.all(promises)
    })
    .then((data) => dbCommit(db))
    .catch((err) => {
      console.log(err)
    })
}

function resolveDefaultClusters(db, endpointTypeId, deviceTypeRef) {
  return selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef).then(
    (clusters) => {
      return Promise.all(
        clusters.map((cluster) => {
          var clientServerPromise = []
          if (cluster.includeClient) {
            clientServerPromise.push(
              new Promise((resolve, reject) =>
                insertOrReplaceClusterState(
                  db,
                  endpointTypeId,
                  cluster.clusterRef,
                  'client',
                  true
                ).then((data) => {
                  resolve({ clusterRef: cluster.clusterRef, side: 'client' })
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
                  'server',
                  true
                ).then((data) => {
                  resolve({ clusterRef: cluster.clusterRef, side: 'server' })
                })
              )
            )
          }
          return Promise.all(clientServerPromise)
        })
      )
    }
  )
}

function resolveDefaultDeviceTypeAttributes(db, endpointTypeId, deviceTypeRef) {
  return selectDeviceTypeAttributesByDeviceTypeRef(db, deviceTypeRef).then(
    (attributes) => {
      return Promise.all(
        attributes.map((attribute) => {
          if (attribute.attributeRef != null) {
            return Promise.all([
              insertOrUpdateAttributeState(
                db,
                endpointTypeId,
                attribute.attributeRef,
                true,
                'INCLUDED'
              ),
              resolveReportableAttribute(db, endpointTypeId, attribute),
            ])
          } else {
            return new Promise((resolve, reject) => {
              return resolve()
            })
          }
        })
      )
    }
  )
}

function resolveReportableAttribute(db, endpointTypeId, attribute) {
  if (attribute.isReportable) {
    return insertOrUpdateReportableAttributeState(
      db,
      endpointTypeId,
      attribute.id,
      true,
      'INCLUDED'
    )
  } else {
    return new Promise((resolve, reject) => {
      return resolve()
    })
  }
}

function resolveReportableAttributesList(db, endpointTypeId, attributes) {
  return Promise.all(
    attributes.map((attribute) => {
      return resolveReportableAttribute(db, endpointTypeId, attribute)
    })
  )
}

function resolveDefaultDeviceTypeCommands(db, endpointTypeId, deviceTypeRef) {
  return selectDeviceTypeCommandsByDeviceTypeRef(db, deviceTypeRef).then(
    (commands) => {
      return Promise.all(
        commands.map((command) => {
          if (command.commandRef != null) {
            return insertOrUpdateCommandState(
              db,
              endpointTypeId,
              command.commandRef,
              true,
              'OUTGOING'
            )
          } else {
            return new Promise((resolve, reject) => {
              return resolve()
            })
          }
        })
      )
    }
  )
}

function resolveNonOptionalCommands(db, endpointTypeId, clusters) {
  return Promise.all(
    clusters.map((cluster) => {
      return selectCommandsByClusterId(db, cluster.clusterRef).then(
        (commands) => {
          return Promise.all(
            commands.map((command) => {
              if (!command.isOptional) {
                return insertOrUpdateCommandState(
                  db,
                  endpointTypeId,
                  command.id,
                  true,
                  'OUTGOING'
                )
              } else {
                return new Promise((resolve, reject) => {
                  return resolve()
                })
              }
            })
          )
        }
      )
    })
  )
}

function resolveDefaultAttributes(db, endpointTypeId, clusters) {
  return Promise.all(
    clusters.map((cluster) => {
      return selectAttributesByClusterId(db, cluster.clusterRef).then(
        (attribute) => {
          var promiseArray = []
          promiseArray.push(
            resolveReportableAttributesList(db, endpointTypeId, attribute)
          )
          promiseArray.push(
            resolveNonOptionalAttributes(db, endpointTypeId, attribute)
          )
          return Promise.all(promiseArray)
        }
      )
    })
  )
}

function resolveNonOptionalAttributes(db, endpointTypeId, attributes) {
  return Promise.all(
    attributes.map((attribute) => {
      if (!attribute.isOptional) {
        return insertOrUpdateAttributeState(
          db,
          endpointTypeId,
          attribute.id,
          true,
          'INCLUDED'
        )
      } else {
        return new Promise((resolve, reject) => {
          return resolve()
        })
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
export function insertEndpointTypes(db, sessionId, endpoints) {
  return dbMultiInsert(
    db,
    'INSERT INTO ENDPOINT_TYPE (SESSION_REF, NAME, DEVICE_TYPE_REF) VALUES (?,?,?)',
    endpoints.map((endpoint) => {
      return [sessionId, endpoint.name, endpoint.deviceTypeId]
    })
  )
}

/**
 * Extracts raw endpoint types rows.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into rows in the database table.
 */
export function getAllEndpointTypes(db, sessionId) {
  return dbAll(
    db,
    'SELECT ENDPOINT_TYPE_ID, NAME, DEVICE_TYPE_REF FROM ENDPOINT_TYPE WHERE SESSION_REF = ? ORDER BY NAME',
    [sessionId]
  ).then((rows) =>
    rows.map((row) => {
      return {
        endpointTypeId: row.ENDPOINT_TYPE_ID,
        name: row.NAME,
        deviceTypeId: row.DEVICE_TYPE_REF,
      }
    })
  )
}

/**
 * Extracts clusters from the endpoint_type_cluster table.
 *
 * @export
 * @param {*} endpointTypeId
 * @returns A promise that resolves into the rows.
 */
export function getEndpointTypeClusters(db, endpointTypeId) {
  return dbAll(
    db,
    'SELECT CLUSTER_REF, SIDE, ENABLED FROM ENDPOINT_TYPE_CLUSTER WHERE ENDPOINT_TYPE_REF = ?',
    [endpointTypeId]
  ).then((rows) =>
    rows.map((row) => {
      return {
        clusterId: row.CLUSTER_REF,
        side: row.SIDE,
        isEnabled: row.ENABLED,
      }
    })
  )
}

/**
 * Extracts attributes from the endpoint_type_attribute table.
 *
 * @export
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns A promise that resolves into the rows.
 */
export function getEndpointTypeAttributes(db, endpointTypeId) {
  return dbAll(
    db,
    'SELECT ATTRIBUTE_REF, INCLUDED, EXTERNAL, FLASH, SINGLETON, BOUNDED, DEFAULT_VALUE FROM ENDPOINT_TYPE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ?',
    [endpointTypeId]
  ).then((rows) =>
    rows.map((row) => {
      return {
        attributeId: row.ATTRIBUTE_REF,
        isIncluded: row.INCLUDED,
        isExternal: row.EXTERNAL,
        isFlash: row.FLASH,
        isSingleton: row.SINGLETON,
        isBounder: row.BOUNDED,
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
export function getEndpointTypeCommands(db, endpointTypeId) {
  return dbAll(
    db,
    'SELECT COMMAND_REF, INCOMING, OUTGOING FROM ENDPOINT_TYPE_COMMAND WHERE ENDPOINT_TYPE_REF = ?',
    [endpointTypeId]
  ).then((rows) =>
    rows.map((row) => {
      return {
        commandID: row.COMMAND_REF,
        isIncoming: row.INCOMING,
        isOutgoing: row.OUTGOING,
      }
    })
  )
}
