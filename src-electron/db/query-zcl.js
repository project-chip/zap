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
 * This module provides queries for ZCL static queries.
 *
 * @module DB API: zcl database access
 */
import * as DbApi from './db-api.js'
import * as Env from '../util/env.js'
import * as DbMapping from './db-mapping.js'

/**
 * Retrieves all the enums in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of enums.
 */
export function selectAllEnums(db) {
  return DbApi.dbAll(
    db,
    'SELECT ENUM_ID, NAME, TYPE FROM ENUM ORDER BY NAME',
    []
  )
}

export function selectAllEnumItemsById(db, id) {
  return DbApi.dbAll(db, 'SELECT NAME FROM ENUM_ITEM WHERE ENUM_REF=?', [id])
}

export function selectAllEnumItems(db) {
  return DbApi.dbAll(
    db,
    'SELECT NAME, VALUE, ENUM_REF FROM ENUM_ITEM ORDER BY ENUM_REF',
    []
  )
}

export function selectEnumById(db, id) {
  return DbApi.dbGet(
    db,
    'SELECT ENUM_ID, NAME, TYPE FROM ENUM WHERE ENUM_ID = ? ORDER BY NAME',
    [id]
  ).then(DbMapping.dbMap.enum)
}

/**
 * Retrieves all the bitmaps in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of bitmaps.
 */
export function selectAllBitmaps(db) {
  return DbApi.dbAll(
    db,
    'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP ORDER BY NAME',
    []
  )
}

export function selectAllBitmapFields(db) {
  return DbApi.dbAll(
    db,
    'SELECT NAME, MASK, BITMAP_REF FROM BITMAP_FIELD ORDER BY NAME',
    []
  )
}

export function selectBitmapById(db, id) {
  return DbApi.dbGet(
    db,
    'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE BITMAP_ID = ? ORDER BY NAME',
    [id]
  ).then(DbMapping.dbMap.bitmap)
}

/**
 * Retrieves all the domains in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of domains.
 */
export function selectAllDomains(db) {
  return DbApi.dbAll(db, 'SELECT DOMAIN_ID, NAME FROM DOMAIN ORDER BY NAME', [])
}

export function selectDomainById(db, id) {
  return DbApi.dbGet(
    db,
    'SELECT DOMAIN_ID, NAME FROM DOMAIN WHERE DOMAIN_ID = ? ORDER BY NAME',
    [id]
  ).then(DbMapping.dbMap.domain)
}

/**
 * Retrieves all the structs in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of structs.
 */
export function selectAllStructs(db) {
  return DbApi.dbAll(db, 'SELECT STRUCT_ID, NAME FROM STRUCT ORDER BY NAME', [])
}

export function selectStructById(db, id) {
  return DbApi.dbGet(
    db,
    'SELECT STRUCT_ID, NAME FROM STRUCT WHERE STRUCT_ID = ? ORDER BY NAME',
    [id]
  ).then(DbMapping.dbMap.struct)
}

export function selectAllStructItems(db) {
  return DbApi.dbAll(
    db,
    'SELECT NAME, TYPE, STRUCT_REF FROM STRUCT_ITEM ORDER BY STRUCT_REF',
    []
  )
}

export function selectStructItemById(db, id) {
  return DbApi.dbAll(db, 'SELECT NAME FROM STRUCT_ITEM WHERE STRUCT_REF=?', [
    id,
  ])
}

/**
 * Retrieves all the clusters in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of clusters.
 */
export function selectAllClusters(db) {
  return DbApi.dbAll(
    db,
    'SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE FROM CLUSTER ORDER BY CODE',
    []
  )
}

export function selectClusterById(db, id) {
  return DbApi.dbGet(
    db,
    'SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE FROM CLUSTER WHERE CLUSTER_ID = ?',
    [id]
  ).then(DbMapping.dbMap.cluster)
}

/**
 * Retrieves all the device types in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of device types.
 */
export function selectAllDeviceTypes(db) {
  return DbApi.dbAll(
    db,
    'SELECT DEVICE_TYPE_ID, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE ORDER BY CODE',
    []
  ).then((rows) => rows.map(DbMapping.dbMap.deviceType))
}

export function selectDeviceTypeById(db, id) {
  return DbApi.dbGet(
    db,
    'SELECT DEVICE_TYPE_ID, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE DEVICE_TYPE_ID = ?',
    [id]
  ).then(DbMapping.dbMap.deviceType)
}

export function selectAttributesByClusterId(db, clusterId) {
  return DbApi.dbAll(
    db,
    `SELECT ATTRIBUTE_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE FROM ATTRIBUTE WHERE CLUSTER_REF = ? ORDER BY CODE`,
    [clusterId]
  ).then((rows) => rows.map(DbMapping.dbMap.attribute))
}

export function selectAttributeById(db, id) {
  return DbApi.dbGet(
    db,
    'SELECT ATTRIBUTE_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE FROM ATTRIBUTE WHERE ATTRIBUTE_ID = ?',
    [id]
  ).then(DbMapping.dbMap.attribute)
}

export function selectAllAttributes(db) {
  return DbApi.dbAll(
    db,
    `SELECT ATTRIBUTE_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE FROM ATTRIBUTE ORDER BY CODE`,
    []
  ).then((rows) => rows.map(DbMapping.dbMap.attribute))
}

export function selectCommandsByClusterId(db, clusterId) {
  return DbApi.dbAll(
    db,
    `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND WHERE CLUSTER_REF = ? ORDER BY CODE`,
    [clusterId]
  ).then((rows) => rows.map(DbMapping.dbMap.command))
}

export function selectAllCommands(db) {
  return DbApi.dbAll(
    db,
    `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND ORDER BY CODE`,
    []
  )
}

export function selectAllGlobalCommands(db) {
  return DbApi.dbAll(
    db,
    `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND WHERE CLUSTER_REF IS NULL ORDER BY CODE`,
    []
  )
}

export function selectAllClusterCommands(db) {
  return DbApi.dbAll(
    db,
    `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND WHERE CLUSTER_REF IS NOT NULL ORDER BY CODE`,
    []
  )
}

export function selectAllCommandArguments(db) {
  return DbApi.dbAll(
    db,
    `SELECT COMMAND_REF, NAME, TYPE, IS_ARRAY FROM COMMAND_ARG ORDER BY COMMAND_REF`,
    []
  )
}

export function selectEndpointTypeClustersByEndpointTypeId(db, endpointTypeId) {
  return DbApi.dbAll(
    db,
    `SELECT ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED FROM ENDPOINT_TYPE_CLUSTER WHERE ENDPOINT_TYPE_REF = ? ORDER BY CLUSTER_REF`,
    [endpointTypeId]
  ).then((rows) => rows.map(DbMapping.dbMap.endpointTypeCluster))
}

export function selectEndpointTypeAttributesByEndpointId(db, endpointTypeId) {
  return DbApi.dbAll(
    db,
    `SELECT ENDPOINT_TYPE_REF, ATTRIBUTE_REF, INCLUDED, EXTERNAL, FLASH, SINGLETON, BOUNDED, DEFAULT_VALUE FROM ENDPOINT_TYPE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? ORDER BY ATTRIBUTE_REF`,
    [endpointTypeId]
  ).then((rows) => {
    return rows.map(DbMapping.dbMap.endpointTypeAttribute)
  })
}

export function selectEndpointTypeAttribute(db, endpointTypeId, attributeRef) {
  return DbApi.dbGet(
    db,
    'SELECT ENDPOINT_TYPE_REF, ATTRIBUTE_REF, INCLUDED, EXTERNAL, FLASH, SINGLETON, BOUNDED, DEFAULT_VALUE FROM ENDPOINT_TYPE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? AND ATTRIBUTE_REF = ?',
    [endpointTypeId, attributeRef]
  ).then(DbMapping.dbMap.endpointTypeAttribute)
}

export function selectEndpointTypeCommandsByEndpointId(db, endpointTypeId) {
  return DbApi.dbAll(
    db,
    `SELECT ENDPOINT_TYPE_REF, COMMAND_REF, INCOMING, OUTGOING FROM ENDPOINT_TYPE_COMMAND WHERE ENDPOINT_TYPE_REF = ? ORDER BY COMMAND_REF`,
    [endpointTypeId]
  ).then((rows) => rows.map(DbMapping.dbMap.endpointTypeCommand))
}

export function selectEndpointTypeReportableAttributeByEndpointId(
  db,
  endpointTypeId
) {
  return DbApi.dbAll(
    db,
    `SELECT ENDPOINT_TYPE_REF, ATTRIBUTE_REF, INCLUDED, MIN_INTERVAL, MAX_INTERVAL, REPORTABLE_CHANGE FROM ENDPOINT_TYPE_REPORTABLE_ATTRIBUTE WHERE ENDPOINT_TYPE_REF = ? ORDER BY ATTRIBUTE_REF`,
    [endpointTypeId]
  ).then((rows) => rows.map(DbMapping.dbMap.endpointTypeReportableAttribute))
}

export function selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef) {
  return DbApi.dbAll(
    db,
    `SELECT DEVICE_TYPE_CLUSTER_ID, DEVICE_TYPE_REF, CLUSTER_REF, CLUSTER_NAME, INCLUDE_CLIENT, INCLUDE_SERVER, LOCK_CLIENT, LOCK_SERVER FROM DEVICE_TYPE_CLUSTER WHERE DEVICE_TYPE_REF = ? ORDER BY CLUSTER_REF`,
    [deviceTypeRef]
  ).then((rows) => rows.map(DbMapping.dbMap.deviceTypeCluster))
}

export function selectDeviceTypeAttributesByDeviceTypeClusterRef(
  db,
  deviceTypeClusterRef
) {
  return DbApi.dbAll(
    db,
    `SELECT DEVICE_TYPE_CLUSTER_REF, ATTRIBUTE_REF, ATTRIBUTE_NAME FROM DEVICE_TYPE_ATTRIBUTE WHERE DEVICE_TYPE_CLUSTER_REF = ? ORDER BY ATTRIBUTE_REF`,
    [deviceTypeClusterRef]
  )
}

export function selectDeviceTypeCommandsByDeviceTypeClusterRef(
  db,
  deviceTypeClusterRef
) {
  return DbApi.dbAll(
    db,
    `SELECT DEVICE_TYPE_CLUSTER_REF, COMMAND_REF, COMMAND_NAME FROM DEVICE_TYPE_COMMAND WHERE DEVICE_TYPE_CLUSTER_REF = ? ORDER BY COMMAND_REF`,
    [deviceTypeClusterRef]
  )
}

export function selectDeviceTypeAttributesByDeviceTypeRef(db, deviceTypeRef) {
  return DbApi.dbAll(
    db,
    `SELECT DEVICE_TYPE_CLUSTER.CLUSTER_REF, DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF, DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_REF, DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_NAME FROM DEVICE_TYPE_ATTRIBUTE, DEVICE_TYPE_CLUSTER WHERE DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ? AND DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF`,
    [deviceTypeRef]
  ).then((rows) => rows.map(DbMapping.dbMap.deviceTypeAttribute))
}

export function selectDeviceTypeCommandsByDeviceTypeRef(db, deviceTypeRef) {
  return DbApi.dbAll(
    db,
    `SELECT DEVICE_TYPE_CLUSTER.CLUSTER_REF, DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF, DEVICE_TYPE_COMMAND.COMMAND_REF, DEVICE_TYPE_COMMAND.COMMAND_NAME FROM DEVICE_TYPE_COMMAND, DEVICE_TYPE_CLUSTER WHERE DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ? AND DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF`,

    [deviceTypeRef]
  ).then((rows) => rows.map(DbMapping.dbMap.deviceTypeCommand))
}

/**
 * Inserts globals into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of globals insertion.
 */
export function insertGlobals(db, packageId, data) {
  Env.logInfo(`Insert globals: ${data.length}`)
  var commandsToLoad = []
  var attributesToLoad = []
  var argsForCommands = []
  var argsToLoad = []
  var i
  for (i = 0; i < data.length; i++) {
    var lastId = null
    if ('commands' in data[i]) {
      var commands = data[i].commands
      commandsToLoad.push(
        ...commands.map((command) => [
          lastId,
          command.code,
          command.name,
          command.description,
          command.source,
          command.isOptional,
        ])
      )
      argsForCommands.push(...commands.map((command) => command.args))
    }
    if ('attributes' in data[i]) {
      var attributes = data[i].attributes
      attributesToLoad.push(
        ...attributes.map((attribute) => [
          lastId,
          attribute.code,
          attribute.name,
          attribute.type,
          attribute.side,
          attribute.define,
          attribute.min,
          attribute.max,
          attribute.isWritable,
          attribute.defaultValue,
          attribute.isOptional,
          attribute.isReportable,
        ])
      )
    }
  }
  var pCommand = DbApi.dbMultiInsert(
    db,
    'INSERT INTO COMMAND (CLUSTER_REF, CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL) VALUES (?,?,?,?,?,?)',
    commandsToLoad
  ).then((lids) => {
    var i
    for (i = 0; i < lids.length; i++) {
      var lastId = lids[i]
      var args = argsForCommands[i]
      if (args != undefined && args != null) {
        argsToLoad.push(
          ...args.map((arg) => [lastId, arg.name, arg.type, arg.isArray])
        )
      }
    }
    return DbApi.dbMultiInsert(
      db,
      'INSERT INTO COMMAND_ARG (COMMAND_REF, NAME, TYPE, IS_ARRAY) VALUES (?,?,?,?)',
      argsToLoad
    )
  })
  var pAttribute = DbApi.dbMultiInsert(
    db,
    'INSERT INTO ATTRIBUTE (CLUSTER_REF, CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    attributesToLoad
  )
  return Promise.all([pCommand, pAttribute])
}

/**
 *  Inserts cluster extensions into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns Promise of cluster extension insertion.
 */
export function insertClusterExtensions(db, packageId, data) {
  return DbApi.dbMultiSelect(
    db,
    'SELECT CLUSTER_ID FROM CLUSTER WHERE CODE = ?',
    data.map((cluster) => [cluster.code])
  ).then((rows) => {
    var commandsToLoad = []
    var attributesToLoad = []
    var argsForCommands = []
    var argsToLoad = []
    var i
    for (i = 0; i < rows.length; i++) {
      var row = rows[i]
      if (row != null) {
        var lastId = row.CLUSTER_ID
        if ('commands' in data[i]) {
          var commands = data[i].commands
          commandsToLoad.push(
            ...commands.map((command) => [
              lastId,
              command.code,
              command.name,
              command.description,
              command.source,
              command.isOptional,
            ])
          )
          argsForCommands.push(...commands.map((command) => command.args))
        }
        if ('attributes' in data[i]) {
          var attributes = data[i].attributes
          attributesToLoad.push(
            ...attributes.map((attribute) => [
              lastId,
              attribute.code,
              attribute.name,
              attribute.type,
              attribute.side,
              attribute.define,
              attribute.min,
              attribute.max,
              attribute.isWritable,
              attribute.defaultValue,
              attribute.isOptional,
              attribute.isReportable,
            ])
          )
        }
      } else {
        // DANGER: We got here, but we don't have rows. Why not?
        // Because clusters at this point have not yet been created? Odd.
        Env.logWarning(
          `Attempting to insert cluster extension, but the cluster was not found: ${data[i].code}`
        )
      }
    }
    var pCommand = DbApi.dbMultiInsert(
      db,
      'INSERT INTO COMMAND (CLUSTER_REF, CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL) VALUES (?,?,?,?,?,?)',
      commandsToLoad
    ).then((lids) => {
      var i
      for (i = 0; i < lids.length; i++) {
        var lastId = lids[i]
        var args = argsForCommands[i]
        if (args != undefined && args != null) {
          argsToLoad.push(
            ...args.map((arg) => [lastId, arg.name, arg.type, arg.isArray])
          )
        }
      }
      return DbApi.dbMultiInsert(
        db,
        'INSERT INTO COMMAND_ARG (COMMAND_REF, NAME, TYPE, IS_ARRAY) VALUES (?,?,?,?)',
        argsToLoad
      )
    })
    var pAttribute = DbApi.dbMultiInsert(
      db,
      'INSERT INTO ATTRIBUTE (CLUSTER_REF, CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      attributesToLoad
    )
    return Promise.all([pCommand, pAttribute])
  })
}

/**
 * Inserts clusters into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data an array of objects that must contain: code, name, description, define. It also contains commands: and attributes:
 * @returns Promise of cluster insertion.
 */
export function insertClusters(db, packageId, data) {
  // If data is extension, we only have code there and we need to simply add commands and clusters.
  // But if it's not an extension, we need to insert the cluster and then run with
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO CLUSTER (PACKAGE_REF, CODE, NAME, DESCRIPTION, DEFINE) VALUES (?, ?, ?, ?, ?)',
    data.map((cluster) => [
      packageId,
      cluster.code,
      cluster.name,
      cluster.description,
      cluster.define,
    ])
  ).then((lastIdsArray) => {
    var commandsToLoad = []
    var attributesToLoad = []
    var argsForCommands = []
    var argsToLoad = []
    var i
    for (i = 0; i < lastIdsArray.length; i++) {
      var lastId = lastIdsArray[i]
      if ('commands' in data[i]) {
        var commands = data[i].commands
        commandsToLoad.push(
          ...commands.map((command) => [
            lastId,
            command.code,
            command.name,
            command.description,
            command.source,
            command.isOptional,
          ])
        )
        argsForCommands.push(...commands.map((command) => command.args))
      }
      if ('attributes' in data[i]) {
        var attributes = data[i].attributes
        attributesToLoad.push(
          ...attributes.map((attribute) => [
            lastId,
            attribute.code,
            attribute.name,
            attribute.type,
            attribute.side,
            attribute.define,
            attribute.min,
            attribute.max,
            attribute.isWritable,
            attribute.defaultValue,
            attribute.isOptional,
            attribute.isReportable,
          ])
        )
      }
    }
    var pCommand = DbApi.dbMultiInsert(
      db,
      'INSERT INTO COMMAND (CLUSTER_REF, CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL) VALUES (?,?,?,?,?,?)',
      commandsToLoad
    ).then((lids) => {
      var i
      for (i = 0; i < lids.length; i++) {
        var lastId = lids[i]
        var args = argsForCommands[i]
        if (args != undefined && args != null) {
          argsToLoad.push(
            ...args.map((arg) => [lastId, arg.name, arg.type, arg.isArray])
          )
        }
      }
      return DbApi.dbMultiInsert(
        db,
        'INSERT INTO COMMAND_ARG (COMMAND_REF, NAME, TYPE, IS_ARRAY) VALUES (?,?,?,?)',
        argsToLoad
      )
    })
    var pAttribute = DbApi.dbMultiInsert(
      db,
      'INSERT INTO ATTRIBUTE (CLUSTER_REF, CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      attributesToLoad
    )
    return Promise.all([pCommand, pAttribute])
  })
}

/**
 * Inserts device types into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data an array of objects that must contain: code, name, description
 * @returns Promise of an insertion of device types.
 */
export function insertDeviceTypes(db, packageId, data) {
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO DEVICE_TYPE (PACKAGE_REF, CODE, PROFILE_ID, NAME, DESCRIPTION) VALUES (?, ?, ?, ?, ?)',
    data.map((dt) => {
      return [packageId, dt.code, dt.profileId, dt.name, dt.description]
    })
  ).then((lastIdsArray) => {
    var i
    var itemsToLoad = []
    for (i = 0; i < lastIdsArray.length; i++) {
      if ('clusters' in data[i]) {
        var lastId = lastIdsArray[i]
        var clusters = data[i].clusters
        // This is an array that links the generated deviceTyepRef to the cluster via generating an array of arrays,
        var zclIdsPromises = Promise.all(
          clusters.map((cluster) => {
            return DbApi.dbInsert(
              db,
              'INSERT INTO DEVICE_TYPE_CLUSTER (DEVICE_TYPE_REF, CLUSTER_NAME, INCLUDE_CLIENT, INCLUDE_SERVER, LOCK_CLIENT, LOCK_SERVER) VALUES (?,?,?,?,?,?)',
              [
                lastId,
                cluster.clusterName,
                cluster.client,
                cluster.server,
                cluster.clientLocked,
                cluster.serverLocked,
              ],
              true
            ).then((deviceTypeClusterRef) => {
              return {
                dtClusterRef: deviceTypeClusterRef,
                clusterData: cluster,
              }
            })
          })
        )

        zclIdsPromises.then((dtClusterRefDataPairs) => {
          insertDeviceTypeAttributes(db, dtClusterRefDataPairs)
          insertDeviceTypeCommands(db, dtClusterRefDataPairs)
        })
      }
    }
    return zclIdsPromises
  })
}

/**
 * This handles the loading of device type attribute requirements into the database.
 * There is a need to post-process to attach the actual attribute ref after the fact
 * @param {*} db
 * @param {*} dtClusterRefDataPairs
 */
export function insertDeviceTypeAttributes(db, dtClusterRefDataPairs) {
  var attributes = []
  dtClusterRefDataPairs.map((dtClusterRefDataPair) => {
    var dtClusterRef = dtClusterRefDataPair.dtClusterRef
    var clusterData = dtClusterRefDataPair.clusterData
    if ('requiredAttributes' in clusterData) {
      clusterData.requiredAttributes.forEach((attributeName) => {
        attributes.push([dtClusterRef, attributeName])
      })
    }
  })
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO DEVICE_TYPE_ATTRIBUTE (DEVICE_TYPE_CLUSTER_REF, ATTRIBUTE_NAME) VALUES (?, ?)',
    attributes
  )
}

/**
 * This handles the loading of device type command requirements into the database.
 * There is a need to post-process to attach the actual command ref after the fact
 * @param {*} db
 * @param {*} dtClusterRefDataPairs
 */
export function insertDeviceTypeCommands(db, dtClusterRefDataPairs) {
  var commands = []
  dtClusterRefDataPairs.map((dtClusterRefDataPair) => {
    var dtClusterRef = dtClusterRefDataPair.dtClusterRef
    var clusterData = dtClusterRefDataPair.clusterData
    if ('requiredCommands' in clusterData) {
      clusterData.requiredCommands.forEach((commandName) => {
        commands.push([dtClusterRef, commandName])
      })
    }
  })
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO DEVICE_TYPE_COMMAND (DEVICE_TYPE_CLUSTER_REF, COMMAND_NAME) VALUES (?, ?)',
    commands
  )
}

export function updateClusterReferencesForDeviceTypeClusters(db) {
  return DbApi.dbUpdate(
    db,
    'UPDATE DEVICE_TYPE_CLUSTER SET CLUSTER_REF = (SELECT CLUSTER.CLUSTER_ID FROM CLUSTER WHERE lower(CLUSTER.NAME) = lower(DEVICE_TYPE_CLUSTER.CLUSTER_NAME))',
    []
  )
}

export function updateAttributeReferencesForDeviceTypeReferences(db) {
  return DbApi.dbUpdate(
    db,
    'UPDATE DEVICE_TYPE_ATTRIBUTE SET ATTRIBUTE_REF = (SELECT ATTRIBUTE.ATTRIBUTE_ID FROM ATTRIBUTE WHERE upper(ATTRIBUTE.DEFINE) = upper(DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_NAME))',
    []
  )
}

export function updateCommandReferencesForDeviceTypeReferences(db) {
  return DbApi.dbUpdate(
    db,
    'UPDATE DEVICE_TYPE_COMMAND SET COMMAND_REF = (SELECT COMMAND.COMMAND_ID FROM COMMAND WHERE upper(COMMAND.NAME) = upper(DEVICE_TYPE_COMMAND.COMMAND_NAME))',
    []
  )
}

/**
 *
 * Inserts domains into the database.
 * data is an array of objects that must contain: name
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns A promise that resolves with an array of rowids of all inserted domains.
 */
export function insertDomains(db, packageId, data) {
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO DOMAIN (PACKAGE_REF, NAME) VALUES (?, ?)',
    data.map((domain) => {
      return [packageId, domain.name]
    })
  )
}

/**
 *
 * Inserts structs into the database.
 * data is an array of objects that must contain: name
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 * @returns A promise that resolves with an array of struct item rowids.
 */
export function insertStructs(db, packageId, data) {
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO STRUCT (PACKAGE_REF, NAME) VALUES (?, ?)',
    data.map((struct) => {
      return [packageId, struct.name]
    })
  ).then((lastIdsArray) => {
    var i
    var itemsToLoad = []
    for (i = 0; i < lastIdsArray.length; i++) {
      if ('items' in data[i]) {
        var lastId = lastIdsArray[i]
        var items = data[i].items
        itemsToLoad.push(...items.map((item) => [lastId, item.name, item.type]))
      }
    }
    return DbApi.dbMultiInsert(
      db,
      'INSERT INTO STRUCT_ITEM (STRUCT_REF, NAME, TYPE) VALUES (?,?,?)',
      itemsToLoad
    )
  })
}

/**
 * Inserts enums into the database.
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data an array of objects that must contain: name, type
 * @returns A promise of enum insertion.
 */
export function insertEnums(db, packageId, data) {
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO ENUM (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)',
    data.map((en) => {
      return [packageId, en.name, en.type]
    })
  ).then((lastIdsArray) => {
    var i
    var itemsToLoad = []
    for (i = 0; i < lastIdsArray.length; i++) {
      if ('items' in data[i]) {
        var lastId = lastIdsArray[i]
        var items = data[i].items
        itemsToLoad.push(
          ...items.map((item) => [lastId, item.name, item.value])
        )
      }
    }
    return DbApi.dbMultiInsert(
      db,
      'INSERT INTO ENUM_ITEM (ENUM_REF, NAME, VALUE) VALUES (?, ?, ?)',
      itemsToLoad
    )
  })
}

/**
 * Inserts bitmaps into the database. Data is an array of objects that must contain: name, type
 *
 * @export
 * @param {*} db
 * @param {*} packageId
 * @param {*} data Array of object containing 'name' and 'type'.
 * @returns A promise of bitmap insertions.
 */
export function insertBitmaps(db, packageId, data) {
  return DbApi.dbMultiInsert(
    db,
    'INSERT INTO BITMAP (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)',
    data.map((bm) => [packageId, bm.name, bm.type])
  ).then((lastIdsArray) => {
    var i
    var fieldsToLoad = []
    for (i = 0; i < lastIdsArray.length; i++) {
      if ('fields' in data[i]) {
        var lastId = lastIdsArray[i]
        var fields = data[i].fields
        fieldsToLoad.push(
          ...fields.map((field) => [lastId, field.name, field.mask])
        )
      }
    }
    return DbApi.dbMultiInsert(
      db,
      'INSERT INTO BITMAP_FIELD (BITMAP_REF, NAME, MASK) VALUES (?, ?, ?)',
      fieldsToLoad
    )
  })
}
