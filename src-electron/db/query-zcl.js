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
const Env = require('../util/env.js')
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
const dbEnum = require('../../src-shared/db-enum.js')
/**
 * Retrieves all the enums in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of enums.
 */
function selectAllEnums(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT ENUM_ID, NAME, TYPE FROM ENUM  WHERE PACKAGE_REF = ? ORDER BY NAME',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.enum))
}

function selectAllEnumItemsById(db, id) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, VALUE FROM ENUM_ITEM WHERE ENUM_REF = ? ORDER BY ORDINAL',
      [id]
    )
    .then((rows) => rows.map(dbMapping.map.enumItem))
}

function selectAllEnumItems(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, VALUE, ENUM_REF FROM ENUM_ITEM WHERE PACKAGE_REF = ? ORDER BY ENUM_REF, ORDINAL',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.enumItem))
}

function selectEnumById(db, id, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT ENUM_ID, NAME, TYPE FROM ENUM WHERE ENUM_ID = ? AND PACKAGE_REF = ? ORDER BY NAME',
      [id, packageId]
    )
    .then(dbMapping.map.enum)
}

function selectEnumByName(db, name, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT ENUM_ID, NAME, TYPE FROM ENUM WHERE NAME = ? AND PACKAGE_REF = ? ORDER BY NAME',
      [name, packageId]
    )
    .then(dbMapping.map.enum)
}

/**
 * Retrieves all the bitmaps in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of bitmaps.
 */
function selectAllBitmaps(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE PACKAGE_REF = ? ORDER BY NAME',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.bitmap))
}

function selectAllBitmapFieldsById(db, id) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, MASK FROM BITMAP_FIELD WHERE BITMAP_REF=? ORDER BY ORDINAL',
      [id]
    )
    .then((rows) => rows.map(dbMapping.map.bitmapField))
}

function selectAllBitmapFields(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, MASK, BITMAP_REF FROM BITMAP_FIELD  WHERE PACKAGE_REF = ? ORDER BY BITMAP_REF, ORDINAL',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.bitmapField))
}

function selectBitmapByName(db, packageId, name) {
  return dbApi
    .dbGet(
      db,
      'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE NAME = ? AND PACKAGE_REF = ? ',
      [name, packageId]
    )
    .then(dbMapping.map.bitmap)
}

function selectBitmapById(db, id, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE BITMAP_ID = ? AND PACKAGE_REF = ? ORDER BY NAME',
      [id, packageId]
    )
    .then(dbMapping.map.bitmap)
}

/**
 * Retrieves all the domains in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of domains.
 */
function selectAllDomains(db, packageId) {
  return dbApi.dbAll(
    db,
    'SELECT DOMAIN_ID, NAME FROM DOMAIN WHERE PACKAGE_REF = ? ORDER BY NAME',
    [packageId]
  )
}

function selectDomainById(db, id, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT DOMAIN_ID, NAME FROM DOMAIN WHERE DOMAIN_ID = ?AND PACKAGE_REF = ? ORDER BY NAME',
      [id, packageId]
    )
    .then(dbMapping.map.domain)
}

/**
 * Retrieves all the structs in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of structs.
 */
function selectAllStructs(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT STRUCT_ID, NAME FROM STRUCT WHERE PACKAGE_REF = ? ORDER BY NAME',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.struct))
}

function selectStructById(db, id, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT STRUCT_ID, NAME FROM STRUCT WHERE STRUCT_ID = ? AND PACKAGE_REF = ? ORDER BY NAME',
      [id, packageId]
    )
    .then(dbMapping.map.struct)
}

function selectStructByName(db, name, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT STRUCT_ID, NAME FROM STRUCT WHERE NAME = ? AND PACKAGE_REF = ? ORDER BY NAME',
      [name, packageId]
    )
    .then(dbMapping.map.struct)
}

function selectAllStructItemsById(db, id) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, TYPE, STRUCT_REF FROM STRUCT_ITEM WHERE STRUCT_REF = ? ORDER BY ORDINAL',
      [id]
    )
    .then((rows) => rows.map(dbMapping.map.structItem))
}

/**
 * Retrieves all the clusters in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of clusters.
 */
function selectAllClusters(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  CLUSTER_ID,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  DEFINE,
  DOMAIN_NAME
FROM CLUSTER
  WHERE PACKAGE_REF = ?
ORDER BY CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.cluster))
}

function selectClusterById(db, id, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE, DOMAIN_NAME FROM CLUSTER WHERE CLUSTER_ID = ?  AND PACKAGE_REF = ?',
      [id, packageId]
    )
    .then(dbMapping.map.cluster)
}

/**
 * Retrieves all the device types in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of device types.
 */
function selectAllDeviceTypes(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT DEVICE_TYPE_ID, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE PACKAGE_REF = ? ORDER BY CODE',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.deviceType))
}

function selectDeviceTypeById(db, id, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT DEVICE_TYPE_ID, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE DEVICE_TYPE_ID = ? AND PACKAGE_REF = ? ',
      [id, packageId]
    )
    .then(dbMapping.map.deviceType)
}

function selectAttributesByClusterId(db, clusterId, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ATTRIBUTE_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  MIN,
  MAX,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE
FROM ATTRIBUTE
WHERE (CLUSTER_REF = ? OR CLUSTER_REF IS NULL)
  ${packageId != null ? 'AND PACKAGE_REF = ? ' : ''}
ORDER BY CODE`,
      packageId != null ? [clusterId, packageId] : [clusterId]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

function selectAttributesByClusterIdAndSide(db, clusterId, packageId, side) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ATTRIBUTE_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  MIN,
  MAX,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE
FROM ATTRIBUTE
WHERE
  SIDE = ?
  AND (CLUSTER_REF = ? OR CLUSTER_REF IS NULL)
  ${packageId != null ? 'AND PACKAGE_REF = ? ' : ''}
ORDER BY CODE`,
      packageId != null ? [side, clusterId, packageId] : [side, clusterId]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

function selectAttributesByClusterCodeAndManufacturerCode(
  db,
  clusterCode,
  manufacturerCode
) {
  var manufacturerString
  if (manufacturerCode == null) {
    manufacturerString = ' AND CLUSTER.MANUFACTURER_CODE IS NULL'
  } else {
    manufacturerString =
      ' AND CLUSTER.MANUFACTURER_CODE IS NULL OR MANUFACTURER_CODE = ' +
      manufacturerCode
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ATTRIBUTE.ATTRIBUTE_ID,
  ATTRIBUTE.CLUSTER_REF,
  ATTRIBUTE.CODE,
  ATTRIBUTE.MANUFACTURER_CODE,
  ATTRIBUTE.NAME,
  ATTRIBUTE.TYPE,
  ATTRIBUTE.SIDE,
  ATTRIBUTE.DEFINE,
  ATTRIBUTE.MIN,
  ATTRIBUTE.MAX,
  ATTRIBUTE.IS_WRITABLE,
  ATTRIBUTE.DEFAULT_VALUE,
  ATTRIBUTE.IS_OPTIONAL,
  ATTRIBUTE.IS_REPORTABLE
FROM ATTRIBUTE, CLUSTER
WHERE CLUSTER.CODE = ?
  AND CLUSTER.CLUSTER_ID = ATTRIBUTE.CLUSTER_REF
  ${manufacturerString}`,
      [clusterCode]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

function selectAttributeById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  ATTRIBUTE_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  MIN,
  MAX,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE
FROM ATTRIBUTE
WHERE ATTRIBUTE_ID = ?`,
      [id]
    )
    .then(dbMapping.map.attribute)
}

function selectAllAttributes(db, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ATTRIBUTE_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  MIN,
  MAX,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE
FROM ATTRIBUTE
   ${packageId != null ? 'WHERE PACKAGE_REF = ? ' : ''}
ORDER BY CODE`,
      packageId != null ? [packageId] : []
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

function selectAllAttributesBySide(db, side, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ATTRIBUTE_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  MIN,
  MAX,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE
FROM ATTRIBUTE
   WHERE SIDE = ?
   ${packageId != null ? 'AND PACKAGE_REF = ? ' : ''}
ORDER BY CODE`,
      packageId != null ? [side, packageId] : [side]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

function selectCommandById(db, id) {
  return dbApi
    .dbGet(
      db,
      `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND WHERE COMMAND_ID = ?`,
      [id]
    )
    .then(dbMapping.map.command)
}

function selectCommandsByClusterId(db, clusterId, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL
FROM COMMAND WHERE CLUSTER_REF = ?
  ${packageId != null ? 'AND PACKAGE_REF = ? ' : ''}
ORDER BY CODE`,
      packageId != null ? [clusterId, packageId] : [clusterId]
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

function selectAllCommands(db, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL
FROM COMMAND
  ${packageId != null ? 'WHERE PACKAGE_REF = ? ' : ''}
ORDER BY CODE`,
      packageId != null ? [packageId] : []
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

function selectAllGlobalCommands(db, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_ID,
  CLUSTER_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  SOURCE,
  IS_OPTIONAL
FROM COMMAND
WHERE CLUSTER_REF IS NULL ` +
        (packageId != null ? 'AND PACKAGE_REF = ? ' : '') +
        `ORDER BY CODE`,
      packageId != null ? [packageId] : []
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

function selectAllClusterCommands(db, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `SELECT COMMAND_ID, CLUSTER_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL FROM COMMAND WHERE CLUSTER_REF IS NOT NULL ` +
        +(packageId != null ? 'AND PACKAGE_REF = ? ' : '') +
        `ORDER BY CODE`,
      packageId != null ? [packageId] : []
    )
    .then((rows) => rows.map(dbMapping.map.command))
}

function selectAllCommandArguments(db) {
  return dbApi
    .dbAll(
      db,
      `SELECT COMMAND_REF, NAME, TYPE, IS_ARRAY FROM COMMAND_ARG ORDER BY COMMAND_REF`,
      []
    )
    .then((rows) => rows.map(dbMapping.map.commandArgument))
}

function selectEndpointType(db, id) {
  return dbApi
    .dbGet(
      db,
      `SELECT ENDPOINT_TYPE_ID, SESSION_REF, NAME, DEVICE_TYPE_REF FROM ENDPOINT_TYPE WHERE ENDPOINT_TYPE_ID = ?`,
      [id]
    )
    .then(dbMapping.map.endpointType)
}

function selectEndpointTypeClustersByEndpointTypeId(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `SELECT ENDPOINT_TYPE_REF, CLUSTER_REF, SIDE, ENABLED FROM ENDPOINT_TYPE_CLUSTER WHERE ENDPOINT_TYPE_REF = ? ORDER BY CLUSTER_REF`,
      [endpointTypeId]
    )
    .then((rows) => rows.map(dbMapping.map.endpointTypeCluster))
}

function selectEndpointTypeAttributesByEndpointId(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER.CLUSTER_REF,
  ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF,
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
  ENDPOINT_TYPE_ATTRIBUTE, ENDPOINT_TYPE_CLUSTER
WHERE
  ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF = ?
  AND ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
ORDER BY ATTRIBUTE_REF`,
      [endpointTypeId]
    )
    .then((rows) => {
      return rows.map(dbMapping.map.endpointTypeAttribute)
    })
}

function selectEndpointTypeAttribute(
  db,
  endpointTypeId,
  attributeRef,
  clusterRef
) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER.CLUSTER_REF,
  ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF,
  ENDPOINT_TYPE_ATTRIBUTE.INCLUDED,
  ENDPOINT_TYPE_ATTRIBUTE.STORAGE_OPTION,
  ENDPOINT_TYPE_ATTRIBUTE.SINGLETON,
  ENDPOINT_TYPE_ATTRIBUTE.BOUNDED,
  ENDPOINT_TYPE_ATTRIBUTE.DEFAULT_VALUE
FROM
  ENDPOINT_TYPE_ATTRIBUTE, ENDPOINT_TYPE_CLUSTER
WHERE
  ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_REF = ?
  AND ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF = ?
  AND ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  AND ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = ?`,
      [endpointTypeId, attributeRef, clusterRef]
    )
    .then(dbMapping.map.endpointTypeAttribute)
}

function selectEndpointTypeCommandsByEndpointId(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER.CLUSTER_REF,
  ENDPOINT_TYPE_COMMAND.COMMAND_REF,
  ENDPOINT_TYPE_COMMAND.INCOMING,
  ENDPOINT_TYPE_COMMAND.OUTGOING
FROM
  ENDPOINT_TYPE_COMMAND, ENDPOINT_TYPE_CLUSTER
WHERE
  ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF = ?
  AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
ORDER BY COMMAND_REF`,
      [endpointTypeId]
    )
    .then((rows) => rows.map(dbMapping.map.endpointTypeCommand))
}

function selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  DEVICE_TYPE_CLUSTER_ID,
  DEVICE_TYPE_REF,
  CLUSTER_REF,
  CLUSTER_NAME,
  INCLUDE_CLIENT,
  INCLUDE_SERVER,
  LOCK_CLIENT,
  LOCK_SERVER
FROM
  DEVICE_TYPE_CLUSTER
WHERE
  DEVICE_TYPE_REF = ?
ORDER BY CLUSTER_REF`,
      [deviceTypeRef]
    )
    .then((rows) => rows.map(dbMapping.map.deviceTypeCluster))
}

function selectDeviceTypeClusterByDeviceTypeClusterId(db, deviceTypeClusterId) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  DEVICE_TYPE_CLUSTER_ID,
  DEVICE_TYPE_REF,
  CLUSTER_REF,
  CLUSTER_NAME,
  INCLUDE_CLIENT,
  INCLUDE_SERVER,
  LOCK_CLIENT,
  LOCK_SERVER
FROM
  DEVICE_TYPE_CLUSTER
WHERE
  DEVICE_TYPE_CLUSTER_ID = ?`,
      [deviceTypeClusterId]
    )
    .then(dbMapping.map.deviceTypeCluster)
}

function selectDeviceTypeAttributesByDeviceTypeClusterRef(
  db,
  deviceTypeClusterRef
) {
  return dbApi.dbAll(
    db,
    `
SELECT
  DEVICE_TYPE_CLUSTER_REF,
  ATTRIBUTE_REF,
  ATTRIBUTE_NAME
FROM
  DEVICE_TYPE_ATTRIBUTE
WHERE
  DEVICE_TYPE_CLUSTER_REF = ?
ORDER BY ATTRIBUTE_REF`,
    [deviceTypeClusterRef]
  )
}

function selectDeviceTypeCommandsByDeviceTypeClusterRef(
  db,
  deviceTypeClusterRef
) {
  return dbApi.dbAll(
    db,
    `
SELECT
  DEVICE_TYPE_CLUSTER_REF,
  COMMAND_REF,
  COMMAND_NAME
FROM
  DEVICE_TYPE_COMMAND
WHERE
  DEVICE_TYPE_CLUSTER_REF = ?
ORDER BY COMMAND_REF`,
    [deviceTypeClusterRef]
  )
}

function selectDeviceTypeAttributesByDeviceTypeRef(db, deviceTypeRef) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  DEVICE_TYPE_CLUSTER.CLUSTER_REF,
  DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF,
  DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_REF,
  DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_NAME
FROM
  DEVICE_TYPE_ATTRIBUTE,
  DEVICE_TYPE_CLUSTER
WHERE
  DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ?
  AND DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF`,
      [deviceTypeRef]
    )
    .then((rows) => rows.map(dbMapping.map.deviceTypeAttribute))
}

function selectDeviceTypeCommandsByDeviceTypeRef(db, deviceTypeRef) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  DEVICE_TYPE_CLUSTER.CLUSTER_REF,
  DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF,
  DEVICE_TYPE_COMMAND.COMMAND_REF,
  DEVICE_TYPE_COMMAND.COMMAND_NAME
FROM
  DEVICE_TYPE_COMMAND,
  DEVICE_TYPE_CLUSTER
WHERE
  DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF = ?
  AND DEVICE_TYPE_CLUSTER.DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF`,
      [deviceTypeRef]
    )
    .then((rows) => rows.map(dbMapping.map.deviceTypeCommand))
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
function insertGlobals(db, packageId, data) {
  Env.logInfo(`Insert globals: ${data.length}`)
  var commandsToLoad = []
  var attributesToLoad = []
  var argsForCommands = []
  var argsToLoad = []
  var i
  for (i = 0; i < data.length; i++) {
    if ('commands' in data[i]) {
      var commands = data[i].commands
      commandsToLoad.push(
        ...commands.map((command) => [
          null, // clusterId
          packageId,
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
          null, // clusterId
          packageId,
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
  var pCommand = dbApi
    .dbMultiInsert(
      db,
      'INSERT INTO COMMAND (CLUSTER_REF, PACKAGE_REF, CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL) VALUES (?,?,?,?,?,?,?)',
      commandsToLoad
    )
    .then((lids) => {
      var j
      for (j = 0; j < lids.length; j++) {
        var lastCmdId = lids[j]
        var args = argsForCommands[j]
        if (args != undefined && args != null) {
          argsToLoad.push(
            ...args.map((arg) => [lastCmdId, arg.name, arg.type, arg.isArray])
          )
        }
      }
      return dbApi.dbMultiInsert(
        db,
        'INSERT INTO COMMAND_ARG (COMMAND_REF, NAME, TYPE, IS_ARRAY) VALUES (?,?,?,?)',
        argsToLoad
      )
    })
  var pAttribute = dbApi.dbMultiInsert(
    db,
    `
INSERT INTO ATTRIBUTE
  ( CLUSTER_REF,
    PACKAGE_REF,
    CODE,
    NAME,
    TYPE,
    SIDE,
    DEFINE,
    MIN,
    MAX,
    IS_WRITABLE,
    DEFAULT_VALUE,
    IS_OPTIONAL,
    IS_REPORTABLE)
VALUES
  (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
function insertClusterExtensions(db, packageId, data) {
  return dbApi
    .dbMultiSelect(
      db,
      'SELECT CLUSTER_ID FROM CLUSTER WHERE CODE = ?',
      data.map((cluster) => [cluster.code])
    )
    .then((rows) => {
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
                packageId,
                command.code,
                command.manufacturerCode,
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
                packageId,
                attribute.code,
                attribute.manufacturerCode,
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
      var pCommand = dbApi
        .dbMultiInsert(
          db,
          'INSERT INTO COMMAND (CLUSTER_REF, PACKAGE_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL) VALUES (?,?,?,?,?,?,?,?)',
          commandsToLoad
        )
        .then((lids) => {
          var j
          for (j = 0; j < lids.length; j++) {
            var lastId = lids[j]
            var args = argsForCommands[j]
            if (args != undefined && args != null) {
              argsToLoad.push(
                ...args.map((arg) => [lastId, arg.name, arg.type, arg.isArray])
              )
            }
          }
          return dbApi.dbMultiInsert(
            db,
            'INSERT INTO COMMAND_ARG (COMMAND_REF, NAME, TYPE, IS_ARRAY) VALUES (?,?,?,?)',
            argsToLoad
          )
        })
      var pAttribute = dbApi.dbMultiInsert(
        db,
        'INSERT INTO ATTRIBUTE (CLUSTER_REF, PACKAGE_REF, CODE, MANUFACTURER_CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        attributesToLoad
      )
      return Promise.all([pCommand, pAttribute])
    })
}

/**
 * Inserts global attribute defaults into the database.
 *
 * @param {*} db
 * @param {*} packagaId
 * @param {*} data array of objects that contain: code, manufacturerCode and subarrays of globalAttribute[] which contain: side, code, value
 * @returns Promise of data insertion.
 */
function insertGlobalAttributeDefault(db, packageId, data) {
  var individualClusterPromise = []
  data.forEach((d) => {
    var args = []
    d.globalAttribute.forEach((ga) => {
      if (ga.side == 'either') {
        args.push([
          packageId,
          d.code,
          packageId,
          ga.code,
          dbEnum.side.client,
          ga.value,
        ])
        args.push([
          packageId,
          d.code,
          packageId,
          ga.code,
          dbEnum.side.server,
          ga.value,
        ])
      } else {
        args.push([packageId, d.code, packageId, ga.code, ga.side, ga.value])
      }
    })
    var p = dbApi.dbMultiInsert(
      db,
      `
  INSERT OR IGNORE INTO GLOBAL_ATTRIBUTE_DEFAULT (
    CLUSTER_REF, ATTRIBUTE_REF, DEFAULT_VALUE
  ) VALUES ( 
    ( SELECT CLUSTER_ID FROM CLUSTER WHERE PACKAGE_REF = ? AND CODE = ? ), 
    ( SELECT ATTRIBUTE_ID FROM ATTRIBUTE WHERE PACKAGE_REF = ? AND CODE = ? AND SIDE = ? ), 
    ?) 
    `,
      args
    )
    individualClusterPromise.push(p)
  })
  return Promise.all(individualClusterPromise)
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
function insertClusters(db, packageId, data) {
  // If data is extension, we only have code there and we need to simply add commands and clusters.
  // But if it's not an extension, we need to insert the cluster and then run with
  return dbApi
    .dbMultiInsert(
      db,
      'INSERT INTO CLUSTER (PACKAGE_REF, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE, DOMAIN_NAME) VALUES (?, ?, ?, ?, ?, ?, ?)',
      data.map((cluster) => {
        return [
          packageId,
          cluster.code,
          cluster.manufacturerCode,
          cluster.name,
          cluster.description,
          cluster.define,
          cluster.domain,
        ]
      })
    )
    .then((lastIdsArray) => {
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
              packageId,
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
              packageId,
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
      var pCommand = dbApi
        .dbMultiInsert(
          db,
          'INSERT INTO COMMAND (CLUSTER_REF, PACKAGE_REF, CODE, NAME, DESCRIPTION, SOURCE, IS_OPTIONAL) VALUES (?,?,?,?,?,?,?)',
          commandsToLoad
        )
        .then((lids) => {
          var j
          for (j = 0; j < lids.length; j++) {
            var lastCmdId = lids[j]
            var args = argsForCommands[j]
            if (args != undefined && args != null) {
              argsToLoad.push(
                ...args.map((arg) => [
                  lastCmdId,
                  arg.name,
                  arg.type,
                  arg.isArray,
                ])
              )
            }
          }
          return dbApi.dbMultiInsert(
            db,
            'INSERT INTO COMMAND_ARG (COMMAND_REF, NAME, TYPE, IS_ARRAY) VALUES (?,?,?,?)',
            argsToLoad
          )
        })
      var pAttribute = dbApi.dbMultiInsert(
        db,
        'INSERT INTO ATTRIBUTE (CLUSTER_REF, PACKAGE_REF, CODE, NAME, TYPE, SIDE, DEFINE, MIN, MAX, IS_WRITABLE, DEFAULT_VALUE, IS_OPTIONAL, IS_REPORTABLE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
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
function insertDeviceTypes(db, packageId, data) {
  return dbApi
    .dbMultiInsert(
      db,
      'INSERT INTO DEVICE_TYPE (PACKAGE_REF, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION) VALUES (?, ?, ?, ?, ?, ?)',
      data.map((dt) => {
        return [
          packageId,
          dt.domain,
          dt.code,
          dt.profileId,
          dt.name,
          dt.description,
        ]
      })
    )
    .then((lastIdsArray) => {
      var i
      var itemsToLoad = []
      for (i = 0; i < lastIdsArray.length; i++) {
        if ('clusters' in data[i]) {
          var lastId = lastIdsArray[i]
          var clusters = data[i].clusters
          // This is an array that links the generated deviceTyepRef to the cluster via generating an array of arrays,
          var zclIdsPromises = Promise.all(
            clusters.map((cluster) => {
              return dbApi
                .dbInsert(
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
                )
                .then((deviceTypeClusterRef) => {
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
function insertDeviceTypeAttributes(db, dtClusterRefDataPairs) {
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
  return dbApi.dbMultiInsert(
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
function insertDeviceTypeCommands(db, dtClusterRefDataPairs) {
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
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO DEVICE_TYPE_COMMAND (DEVICE_TYPE_CLUSTER_REF, COMMAND_NAME) VALUES (?, ?)',
    commands
  )
}

function updateClusterReferencesForDeviceTypeClusters(db) {
  return dbApi.dbUpdate(
    db,
    `
UPDATE
  DEVICE_TYPE_CLUSTER
SET
  CLUSTER_REF =
  ( SELECT
      CLUSTER.CLUSTER_ID
    FROM
      CLUSTER
    WHERE lower(CLUSTER.NAME) = lower(DEVICE_TYPE_CLUSTER.CLUSTER_NAME)
  )`,
    []
  )
}

function updateAttributeReferencesForDeviceTypeReferences(db) {
  return dbApi.dbUpdate(
    db,
    `
UPDATE
  DEVICE_TYPE_ATTRIBUTE
SET
  ATTRIBUTE_REF =
  ( SELECT
      ATTRIBUTE.ATTRIBUTE_ID
    FROM
      ATTRIBUTE
    WHERE upper(ATTRIBUTE.DEFINE) = upper(DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_NAME)
  )`,
    []
  )
}

function updateCommandReferencesForDeviceTypeReferences(db) {
  return dbApi.dbUpdate(
    db,
    `
UPDATE
  DEVICE_TYPE_COMMAND
SET
  COMMAND_REF =
  ( SELECT
      COMMAND.COMMAND_ID
    FROM
      COMMAND
    WHERE upper(COMMAND.NAME) = upper(DEVICE_TYPE_COMMAND.COMMAND_NAME)
  )`,
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
function insertDomains(db, packageId, data) {
  return dbApi.dbMultiInsert(
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
function insertStructs(db, packageId, data) {
  return dbApi
    .dbMultiInsert(
      db,
      'INSERT INTO STRUCT (PACKAGE_REF, NAME) VALUES (?, ?)',
      data.map((struct) => {
        return [packageId, struct.name]
      })
    )
    .then((lastIdsArray) => {
      var i
      var itemsToLoad = []
      for (i = 0; i < lastIdsArray.length; i++) {
        if ('items' in data[i]) {
          var lastId = lastIdsArray[i]
          var items = data[i].items
          itemsToLoad.push(
            ...items.map((item) => [lastId, item.name, item.type])
          )
        }
      }
      return dbApi.dbMultiInsert(
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
function insertEnums(db, packageId, data) {
  return dbApi
    .dbMultiInsert(
      db,
      'INSERT INTO ENUM (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)',
      data.map((en) => {
        return [packageId, en.name, en.type]
      })
    )
    .then((lastIdsArray) => {
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
      return dbApi.dbMultiInsert(
        db,
        'INSERT INTO ENUM_ITEM (ENUM_REF, NAME, VALUE) VALUES (?, ?, ?)',
        itemsToLoad
      )
    })
}

/**
 * Insert atomics into the database.
 * Data is an array of objects that must contains: name, id, description.
 * Object might also contain 'size', but possibly not.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} data
 */
function insertAtomics(db, packageId, data) {
  return dbApi.dbMultiInsert(
    db,
    'INSERT INTO ATOMIC (PACKAGE_REF, NAME, DESCRIPTION, ATOMIC_IDENTIFIER, ATOMIC_SIZE) VALUES (?, ?, ?, ?, ?)',
    data.map((at) => [packageId, at.name, at.description, at.id, at.size])
  )
}

/**
 * Locates atomic type based on a type name.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} typeName
 */
function selectAtomicType(db, packageId, typeName) {
  return dbApi
    .dbGet(
      db,
      'SELECT ATOMIC_IDENTIFIER, NAME, DESCRIPTION, ATOMIC_SIZE FROM ATOMIC WHERE PACKAGE_REF = ? AND NAME = ?',
      [packageId, typeName == null ? typeName : typeName.toLowerCase()]
    )
    .then(dbMapping.map.atomic)
}

/**
 * Retrieve the atomic by name, returning promise that resolves into an atomic, or null.
 * @param {*} db
 * @param {*} name
 * @param {*} packageId
 */
function selectAtomicByName(db, name, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT ATOMIC_IDENTIFIER, NAME, DESCRIPTION, ATOMIC_SIZE FROM ATOMIC WHERE PACKAGE_REF = ? AND NAME = ?',
      [packageId, name]
    )
    .then(dbMapping.map.atomic)
}

/**
 * Retrieves all atomic types under a given package Id.
 * @param {*} db
 * @param {*} packageId
 */
function selectAllAtomics(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT ATOMIC_IDENTIFIER, NAME, DESCRIPTION, ATOMIC_SIZE FROM ATOMIC WHERE PACKAGE_REF = ? ORDER BY ATOMIC_IDENTIFIER',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.atomic))
}

/**
 * Retrieves the size from atomic type.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 */
function getAtomicSizeFromType(db, packageId, type) {
  return dbApi
    .dbGet(
      db,
      'SELECT ATOMIC_SIZE FROM ATOMIC WHERE PACKAGE_REF = ? AND NAME = ?',
      [packageId, type]
    )
    .then((row) => {
      if (row == null) return -1
      else return row.ATOMIC_SIZE
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
function insertBitmaps(db, packageId, data) {
  return dbApi
    .dbMultiInsert(
      db,
      'INSERT INTO BITMAP (PACKAGE_REF, NAME, TYPE) VALUES (?, ?, ?)',
      data.map((bm) => [packageId, bm.name, bm.type])
    )
    .then((lastIdsArray) => {
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
      return dbApi.dbMultiInsert(
        db,
        'INSERT INTO BITMAP_FIELD (BITMAP_REF, NAME, MASK) VALUES (?, ?, ?)',
        fieldsToLoad
      )
    })
}

/**
 * Exports clusters and endpoint ids
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the data that contains cluster
 * and endpoint id references
 */
function exportClustersAndEndpointDetailsFromEndpointTypes(db, endpointTypes) {
  var endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  var mapFunction = (x) => {
    return {
      endpointId: x.ENDPOINT_TYPE_REF,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
FROM CLUSTER
INNER JOIN ENDPOINT_TYPE_CLUSTER
ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF IN (${endpointTypeIds})`
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Returns a promise of data for commands inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
function exportCommandDetailsFromAllEndpointTypesAndClusters(
  db,
  endpointsAndClusters
) {
  var endpointTypeIds = endpointsAndClusters
    .map((ep) => ep.endpointId)
    .toString()
  var endpointClusterIds = endpointsAndClusters
    .map((ep) => ep.endpointClusterId)
    .toString()
  var mapFunction = (x) => {
    return {
      id: x.COMMAND_ID,
      name: x.NAME,
      code: x.CODE,
      commandSource: x.SOURCE,
      mfgCode: x.MANUFACTURER_CODE,
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
      description: x.DESCRIPTION,
      clusterSide: x.SIDE,
      clusterName: x.CLUSTER_NAME,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    COMMAND.COMMAND_ID,
    COMMAND.NAME,
    COMMAND.CODE,
    COMMAND.SOURCE,
    COMMAND.MANUFACTURER_CODE,
    ENDPOINT_TYPE_COMMAND.INCOMING,
    ENDPOINT_TYPE_COMMAND.OUTGOING,
    COMMAND.DESCRIPTION,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    CLUSTER.NAME AS CLUSTER_NAME
  FROM COMMAND
  INNER JOIN ENDPOINT_TYPE_COMMAND
  ON COMMAND.COMMAND_ID = ENDPOINT_TYPE_COMMAND.COMMAND_REF
  INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds}) AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF in (${endpointClusterIds})
  GROUP BY COMMAND.NAME
        `
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Get the number of command arguments for a command
 *
 * @param {*} db
 * @param {*} commandId
 * @param {*} [packageId=null]
 * @returns A promise with number of command arguments for a command
 */
function selectCommandArgumentsCountByCommandId(
  db,
  commandId,
  packageId = null
) {
  return dbApi
    .dbAll(
      db,
      `
SELECT COUNT(*) AS count
FROM COMMAND_ARG WHERE COMMAND_REF = ? `,
      [commandId]
    )
    .then((res) => res[0].count)
}

/**
 * Extract the command arguments for a command
 *
 * @param {*} db
 * @param {*} commandId
 * @param {*} [packageId=null]
 * @returns A promise with command arguments for a command
 */
function selectCommandArgumentsByCommandId(db, commandId, packageId = null) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  COMMAND_REF,
  NAME,
  TYPE,
  IS_ARRAY
FROM COMMAND_ARG WHERE COMMAND_REF = ? 
ORDER BY ORDINAL`,
      [commandId]
    )
    .then((rows) => rows.map(dbMapping.map.commandArgument))
}

/**
 * Returns a promise that resolves into one of the zclType enum
 * values.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 */
function determineType(db, type, packageId) {
  return selectStructByName(db, type, packageId)
    .then((struct) => {
      if (struct == null) {
        return null
      } else {
        return dbEnum.zclType.struct
      }
    })
    .then((zclType) => {
      if (zclType != null) {
        return zclType
      } else {
        return selectEnumByName(db, type, packageId).then((theEnum) => {
          if (theEnum == null) return null
          else return dbEnum.zclType.enum
        })
      }
    })
    .then((zclType) => {
      if (zclType != null) {
        return zclType
      } else {
        return selectBitmapByName(db, type, packageId).then((theBitmap) => {
          if (theBitmap == null) return null
          else return dbEnum.zclType.bitmap
        })
      }
    })
    .then((zclType) => {
      if (zclType != null) {
        return zclType
      } else {
        return selectAtomicByName(db, type, packageId).then((atomic) => {
          if (atomic == null) return null
          else return dbEnum.zclType.atomic
        })
      }
    })
    .then((zclType) => {
      if (zclType != null) {
        return zclType
      } else {
        return dbEnum.zclType.unknown
      }
    })
}

/**
 * Exports clusters to an externalized form.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the data that should go into the external form.
 */
function exportAllClustersDetailsFromEndpointTypes(db, endpointTypes) {
  var endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  var mapFunction = (x) => {
    return {
      id: x.CLUSTER_ID,
      name: x.NAME,
      code: x.CODE,
      define: x.DEFINE,
      mfgCode: x.MANUFACTURER_CODE,
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
  CLUSTER.CLUSTER_ID,
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
WHERE ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
AND ENDPOINT_TYPE_CLUSTER.SIDE IS NOT ""
GROUP BY NAME, SIDE`
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Returns a promise of data for commands inside all existing endpoint types.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
function exportCommandDetailsFromAllEndpointTypeCluster(
  db,
  endpointTypes,
  endpointClusterId
) {
  var endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  var mapFunction = (x) => {
    return {
      id: x.COMMAND_ID,
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      incoming: x.INCOMING,
      outgoing: x.OUTGOING,
      description: x.DESCRIPTION,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    COMMAND.COMMAND_ID,
    COMMAND.NAME,
    COMMAND.CODE,
    COMMAND.MANUFACTURER_CODE,
    ENDPOINT_TYPE_COMMAND.INCOMING,
    ENDPOINT_TYPE_COMMAND.OUTGOING,
    COMMAND.DESCRIPTION
  FROM COMMAND
  INNER JOIN ENDPOINT_TYPE_COMMAND
  ON COMMAND.COMMAND_ID = ENDPOINT_TYPE_COMMAND.COMMAND_REF
  WHERE ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds}) AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ?
        `,
      [endpointClusterId]
    )
    .then((rows) => rows.map(mapFunction))
}

// exports
exports.selectAllEnums = selectAllEnums
exports.selectAllEnumItemsById = selectAllEnumItemsById
exports.selectAllEnumItems = selectAllEnumItems
exports.selectEnumById = selectEnumById
exports.selectAllBitmaps = selectAllBitmaps
exports.selectAllBitmapFields = selectAllBitmapFields
exports.selectBitmapById = selectBitmapById
exports.selectAllDomains = selectAllDomains
exports.selectDomainById = selectDomainById
exports.selectAtomicByName = selectAtomicByName
exports.selectAllStructs = selectAllStructs
exports.selectStructById = selectStructById
exports.selectAllStructItemsById = selectAllStructItemsById
exports.selectAllClusters = selectAllClusters
exports.selectClusterById = selectClusterById
exports.selectAllDeviceTypes = selectAllDeviceTypes
exports.selectDeviceTypeById = selectDeviceTypeById
exports.selectAttributesByClusterIdAndSide = selectAttributesByClusterIdAndSide
exports.selectAttributesByClusterId = selectAttributesByClusterId
exports.selectAttributesByClusterCodeAndManufacturerCode = selectAttributesByClusterCodeAndManufacturerCode
exports.selectAttributeById = selectAttributeById
exports.selectAllAttributes = selectAllAttributes
exports.selectAllAttributesBySide = selectAllAttributesBySide
exports.selectCommandById = selectCommandById
exports.selectCommandsByClusterId = selectCommandsByClusterId
exports.selectAllCommands = selectAllCommands
exports.selectAllGlobalCommands = selectAllGlobalCommands
exports.selectAllClusterCommands = selectAllClusterCommands
exports.selectAllCommandArguments = selectAllCommandArguments
exports.selectEndpointTypeClustersByEndpointTypeId = selectEndpointTypeClustersByEndpointTypeId
exports.selectEndpointTypeAttributesByEndpointId = selectEndpointTypeAttributesByEndpointId
exports.selectEndpointTypeAttribute = selectEndpointTypeAttribute
exports.selectEndpointTypeCommandsByEndpointId = selectEndpointTypeCommandsByEndpointId
exports.selectDeviceTypeClustersByDeviceTypeRef = selectDeviceTypeClustersByDeviceTypeRef
exports.selectDeviceTypeClusterByDeviceTypeClusterId = selectDeviceTypeClusterByDeviceTypeClusterId
exports.selectDeviceTypeAttributesByDeviceTypeClusterRef = selectDeviceTypeAttributesByDeviceTypeClusterRef
exports.selectDeviceTypeCommandsByDeviceTypeClusterRef = selectDeviceTypeCommandsByDeviceTypeClusterRef
exports.selectDeviceTypeAttributesByDeviceTypeRef = selectDeviceTypeAttributesByDeviceTypeRef
exports.selectDeviceTypeCommandsByDeviceTypeRef = selectDeviceTypeCommandsByDeviceTypeRef
exports.insertGlobals = insertGlobals
exports.insertClusterExtensions = insertClusterExtensions
exports.insertClusters = insertClusters
exports.insertDeviceTypes = insertDeviceTypes
exports.insertDeviceTypeAttributes = insertDeviceTypeAttributes
exports.insertDeviceTypeCommands = insertDeviceTypeCommands
exports.updateClusterReferencesForDeviceTypeClusters = updateClusterReferencesForDeviceTypeClusters
exports.updateAttributeReferencesForDeviceTypeReferences = updateAttributeReferencesForDeviceTypeReferences
exports.updateCommandReferencesForDeviceTypeReferences = updateCommandReferencesForDeviceTypeReferences
exports.insertDomains = insertDomains
exports.insertStructs = insertStructs
exports.insertEnums = insertEnums
exports.insertBitmaps = insertBitmaps
exports.selectEndpointType = selectEndpointType
exports.insertAtomics = insertAtomics
exports.selectAllAtomics = selectAllAtomics
exports.getAtomicSizeFromType = getAtomicSizeFromType
exports.selectAtomicType = selectAtomicType
exports.selectAllBitmapFieldsById = selectAllBitmapFieldsById
exports.selectBitmapByName = selectBitmapByName
exports.exportClustersAndEndpointDetailsFromEndpointTypes = exportClustersAndEndpointDetailsFromEndpointTypes
exports.exportCommandDetailsFromAllEndpointTypesAndClusters = exportCommandDetailsFromAllEndpointTypesAndClusters
exports.selectCommandArgumentsCountByCommandId = selectCommandArgumentsCountByCommandId
exports.selectCommandArgumentsByCommandId = selectCommandArgumentsByCommandId
exports.exportAllClustersDetailsFromEndpointTypes = exportAllClustersDetailsFromEndpointTypes
exports.exportCommandDetailsFromAllEndpointTypeCluster = exportCommandDetailsFromAllEndpointTypeCluster
exports.insertGlobalAttributeDefault = insertGlobalAttributeDefault
exports.selectEnumByName = selectEnumByName
exports.selectStructByName = selectStructByName
exports.determineType = determineType
