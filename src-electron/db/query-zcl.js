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
async function selectAllEnums(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT ENUM_ID, NAME, TYPE FROM ENUM  WHERE PACKAGE_REF = ? ORDER BY NAME',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.enum))
}

async function selectAllEnumItemsById(db, id) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, VALUE FROM ENUM_ITEM WHERE ENUM_REF = ? ORDER BY FIELD_IDENTIFIER',
      [id]
    )
    .then((rows) => rows.map(dbMapping.map.enumItem))
}

async function selectAllEnumItems(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `SELECT ENUM_ITEM.NAME,
              ENUM_ITEM.VALUE,
              ENUM_ITEM.ENUM_REF
       FROM ENUM_ITEM, ENUM
       WHERE ENUM.PACKAGE_REF = ? AND ENUM.ENUM_ID = ENUM_ITEM.ENUM_REF
       ORDER BY ENUM_ITEM.ENUM_REF, ENUM_ITEM.FIELD_IDENTIFIER`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.enumItem))
}

async function selectEnumById(db, id) {
  return dbApi
    .dbGet(db, 'SELECT ENUM_ID, NAME, TYPE FROM ENUM WHERE ENUM_ID = ?', [id])
    .then(dbMapping.map.enum)
}

async function selectEnumByName(db, name, packageId) {
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
async function selectAllBitmaps(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE PACKAGE_REF = ? ORDER BY NAME',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.bitmap))
}

async function selectAllBitmapFieldsById(db, id) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, MASK, TYPE FROM BITMAP_FIELD WHERE BITMAP_REF = ? ORDER BY FIELD_IDENTIFIER',
      [id]
    )
    .then((rows) => rows.map(dbMapping.map.bitmapField))
}

async function selectAllBitmapFields(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, MASK, TYPE, BITMAP_REF FROM BITMAP_FIELD  WHERE PACKAGE_REF = ? ORDER BY BITMAP_REF, FIELD_IDENTIFIER',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.bitmapField))
}

async function selectBitmapByName(db, packageId, name) {
  return dbApi
    .dbGet(
      db,
      'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE NAME = ? AND PACKAGE_REF = ? ',
      [name, packageId]
    )
    .then(dbMapping.map.bitmap)
}

async function selectBitmapById(db, id) {
  return dbApi
    .dbGet(db, 'SELECT BITMAP_ID, NAME, TYPE FROM BITMAP WHERE BITMAP_ID = ?', [
      id,
    ])
    .then(dbMapping.map.bitmap)
}

/**
 * Retrieves all the domains in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of domains.
 */
async function selectAllDomains(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT DOMAIN_ID, NAME FROM DOMAIN WHERE PACKAGE_REF = ? ORDER BY NAME',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.domain))
}

async function selectDomainById(db, id) {
  return dbApi
    .dbGet(db, 'SELECT DOMAIN_ID, NAME FROM DOMAIN WHERE DOMAIN_ID = ?', [id])
    .then(dbMapping.map.domain)
}

/**
 * Retrieves all the structs in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of structs.
 */
async function selectAllStructs(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT STRUCT.STRUCT_ID, STRUCT.NAME, COUNT(ITEM.NAME) AS ITEM_COUNT FROM STRUCT LEFT JOIN STRUCT_ITEM AS ITEM ON STRUCT.STRUCT_ID = ITEM.STRUCT_REF WHERE STRUCT.PACKAGE_REF = ? GROUP BY STRUCT.NAME ORDER BY STRUCT.NAME',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.struct))
}

async function selectStructById(db, id) {
  return dbApi
    .dbGet(db, 'SELECT STRUCT_ID, NAME FROM STRUCT WHERE STRUCT_ID = ?', [id])
    .then(dbMapping.map.struct)
}

async function selectStructByName(db, name, packageId) {
  return dbApi
    .dbGet(
      db,
      'SELECT STRUCT_ID, NAME FROM STRUCT WHERE NAME = ? AND PACKAGE_REF = ? ORDER BY NAME',
      [name, packageId]
    )
    .then(dbMapping.map.struct)
}

async function selectAllStructItemsById(db, id) {
  return dbApi
    .dbAll(
      db,
      'SELECT NAME, TYPE, STRUCT_REF, ARRAY_TYPE, MIN_LENGTH, MAX_LENGTH, IS_WRITABLE FROM STRUCT_ITEM WHERE STRUCT_REF = ? ORDER BY FIELD_IDENTIFIER',
      [id]
    )
    .then((rows) => rows.map(dbMapping.map.structItem))
}

/**
 *
 *
 * @param  db
 * @param  name
 * @returns the details of the struct items given the name of the struct
 */
async function selectAllStructItemsByStructName(db, name) {
  return dbApi
    .dbAll(
      db,
      'SELECT STRUCT_ITEM.NAME, STRUCT_ITEM.TYPE, STRUCT_ITEM.STRUCT_REF, STRUCT_ITEM.ARRAY_TYPE FROM STRUCT_ITEM INNER JOIN STRUCT ON STRUCT.STRUCT_ID = STRUCT_ITEM.STRUCT_REF WHERE STRUCT.NAME = ? ORDER BY FIELD_IDENTIFIER',
      [name]
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
async function selectAllClusters(db, packageId) {
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
  DOMAIN_NAME,
  IS_SINGLETON
FROM CLUSTER
WHERE PACKAGE_REF = ?
ORDER BY CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.cluster))
}

async function selectClusterByCode(db, packageId, clusterCode, mfgCode = null) {
  let query
  let args
  if (mfgCode == null || mfgCode == 0) {
    query = `SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE, DOMAIN_NAME, IS_SINGLETON FROM CLUSTER WHERE PACKAGE_REF = ? AND CODE = ? AND MANUFACTURER_CODE IS NULL`
    args = [packageId, clusterCode]
  } else {
    query = `SELECT CLUSTER_ID, CODE, MANUFACTURER_CODE, NAME, DESCRIPTION, DEFINE, DOMAIN_NAME, IS_SINGLETON FROM CLUSTER WHERE PACKAGE_REF = ? AND CODE = ? AND MANUFACTURER_CODE = ?`
    args = [packageId, clusterCode, mfgCode]
  }
  return dbApi.dbGet(db, query, args).then(dbMapping.map.cluster)
}

/**
 * Returns a promise that resolves into a cluster.
 *
 * @param {*} db
 * @param {*} clusterId
 * @param {*} packageId
 * @returns promise that resolves into a cluster object
 */
async function selectClusterById(db, clusterId) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  CLUSTER_ID,
  PACKAGE_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  DEFINE,
  DOMAIN_NAME,
  IS_SINGLETON
FROM CLUSTER
WHERE CLUSTER_ID = ?`,
      [clusterId]
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
async function selectAllDeviceTypes(db, packageId) {
  return dbApi
    .dbAll(
      db,
      'SELECT DEVICE_TYPE_ID, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE PACKAGE_REF = ? ORDER BY DOMAIN, CODE',
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.deviceType))
}

async function selectDeviceTypeById(db, id) {
  return dbApi
    .dbGet(
      db,
      'SELECT DEVICE_TYPE_ID, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE DEVICE_TYPE_ID = ?',
      [id]
    )
    .then(dbMapping.map.deviceType)
}

async function selectDeviceTypeByCodeAndName(db, packageId, code, name) {
  return dbApi
    .dbGet(
      db,
      'SELECT DEVICE_TYPE_ID, DOMAIN, CODE, PROFILE_ID, NAME, DESCRIPTION FROM DEVICE_TYPE WHERE CODE = ? AND NAME = ? AND PACKAGE_REF = ? ',
      [code, name, packageId]
    )
    .then(dbMapping.map.deviceType)
}

/**
 * Returns attributes for a given cluster.
 * IMPORTANT:
 *    packageId is needed to properly deal with the global attributes.
 *
 * This method will NOT only return the attributes that link to
 * a given cluster, but will ALSO return the attributes that have
 * empty clusterRef (which are global attributes), and the check
 * in that case will be made via packageId.
 *
 * @param {*} db
 * @param {*} clusterId
 * @param {*} packageId
 * @returns promise of a list of attributes, including global attributes
 */
async function selectAttributesByClusterIdIncludingGlobal(
  db,
  clusterId,
  packageId
) {
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
  IS_REPORTABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE
FROM ATTRIBUTE
WHERE (CLUSTER_REF = ? OR CLUSTER_REF IS NULL)
  AND PACKAGE_REF = ? 
ORDER BY CODE`,
      [clusterId, packageId]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

async function selectAttributesByClusterIdAndSideIncludingGlobal(
  db,
  clusterId,
  packageId,
  side
) {
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
  IS_REPORTABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE
FROM ATTRIBUTE
WHERE
  SIDE = ?
  AND (CLUSTER_REF = ? OR CLUSTER_REF IS NULL)
  AND PACKAGE_REF = ? 
ORDER BY CODE`,
      [side, clusterId, packageId]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

/**
 * Queries for attributes inside a cluster.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} clusterCode
 * @param {*} manufacturerCode
 * @returns promise that resolves into attributes.
 */
async function selectAttributesByClusterCodeAndManufacturerCode(
  db,
  packageId,
  clusterCode,
  manufacturerCode
) {
  let manufacturerString
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
  ATTRIBUTE.IS_REPORTABLE,
  ATTRIBUTE.IS_SCENE_REQUIRED,
  ATTRIBUTE.ARRAY_TYPE
FROM ATTRIBUTE, CLUSTER
WHERE CLUSTER.CODE = ?
  AND CLUSTER.CLUSTER_ID = ATTRIBUTE.CLUSTER_REF
  AND ATTRIBUTE.PACKAGE_REF = ?
  ${manufacturerString}`,
      [clusterCode, packageId]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

async function selectAttributeById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  ATTRIBUTE_ID,
  CLUSTER_REF,
  PACKAGE_REF,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  TYPE,
  SIDE,
  DEFINE,
  MIN,
  MAX,
  MIN_LENGTH,
  MAX_LENGTH,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE
FROM ATTRIBUTE
WHERE ATTRIBUTE_ID = ?`,
      [id]
    )
    .then(dbMapping.map.attribute)
}
/**
 * This async function should be used when you want to get attributes, while also resolving against any global data that may be overridden by a particular cluster.
 * @param {*} db
 * @param {*} attributeId
 * @param {*} clusterRef
 */
async function selectAttributeByAttributeIdAndClusterRef(
  db,
  attributeId,
  clusterRef
) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  A.ATTRIBUTE_ID,
  A.CLUSTER_REF,
  A.CODE,
  A.MANUFACTURER_CODE,
  A.NAME,
  A.TYPE,
  A.SIDE,
  A.DEFINE,
  A.MIN,
  A.MAX,
  A.IS_WRITABLE,
  CASE
    WHEN A.CLUSTER_REF NOT NULL
    THEN A.DEFAULT_VALUE
  ELSE
    CASE
      WHEN
        EXISTS ( SELECT DEFAULT_VALUE
                 FROM GLOBAL_ATTRIBUTE_DEFAULT
                 WHERE CLUSTER_REF = ?
                   AND ATTRIBUTE_REF = ATTRIBUTE_ID )
      THEN ( SELECT DEFAULT_VALUE
             FROM GLOBAL_ATTRIBUTE_DEFAULT
             WHERE CLUSTER_REF = ?
               AND ATTRIBUTE_REF = ATTRIBUTE_ID)
    ELSE A.DEFAULT_VALUE
    END
  END AS DEFAULT_VALUE,
  A.IS_OPTIONAL,
  A.IS_REPORTABLE,
  A.IS_SCENE_REQUIRED,
  A.ARRAY_TYPE
FROM ATTRIBUTE AS A
WHERE ATTRIBUTE_ID = ?`,
      [clusterRef, clusterRef, attributeId]
    )
    .then(dbMapping.map.attribute)
}

async function selectAllAttributes(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  A.ATTRIBUTE_ID,
  A.CLUSTER_REF,
  A.CODE,
  A.MANUFACTURER_CODE,
  A.NAME,
  A.TYPE,
  A.SIDE,
  A.DEFINE,
  A.MIN,
  A.MAX,
  A.MIN_LENGTH,
  A.MAX_LENGTH,
  A.IS_WRITABLE,
  A.DEFAULT_VALUE,
  A.IS_OPTIONAL,
  A.IS_REPORTABLE,
  A.IS_SCENE_REQUIRED,
  A.ARRAY_TYPE,
  C.CODE AS CLUSTER_CODE
FROM
  ATTRIBUTE AS A
LEFT JOIN
  CLUSTER AS C
ON
  A.CLUSTER_REF = C.CLUSTER_ID
WHERE
  A.PACKAGE_REF = ?
ORDER BY
  C.CODE, A.CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

/**
 * Query for attributes by side.
 *
 * @param {*} db
 * @param {*} side
 * @param {*} packageId
 * @returns promise that resolves into attributes.
 */
async function selectAllAttributesBySide(db, side, packageId) {
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
  IS_REPORTABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE
FROM ATTRIBUTE
   WHERE SIDE = ?
   AND PACKAGE_REF = ?
ORDER BY CODE`,
      [side, packageId]
    )
    .then((rows) => rows.map(dbMapping.map.attribute))
}

async function selectEndpointTypeClustersByEndpointTypeId(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE_REF,
  CLUSTER_REF,
  SIDE,
  ENABLED
FROM
  ENDPOINT_TYPE_CLUSTER
WHERE
  ENDPOINT_TYPE_REF = ?
ORDER BY
  CLUSTER_REF`,
      [endpointTypeId]
    )
    .then((rows) => rows.map(dbMapping.map.endpointTypeCluster))
}

async function selectEndpointTypeAttributesByEndpointId(db, endpointTypeId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  ETA.ENDPOINT_TYPE_REF,
  ETC.CLUSTER_REF,
  ETA.ATTRIBUTE_REF,
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
  ENDPOINT_TYPE_ATTRIBUTE AS ETA,
  ENDPOINT_TYPE_CLUSTER AS ETC
WHERE
  ETA.ENDPOINT_TYPE_REF = ?
  AND ETA.ENDPOINT_TYPE_CLUSTER_REF = ETC.ENDPOINT_TYPE_CLUSTER_ID
ORDER BY ATTRIBUTE_REF`,
      [endpointTypeId]
    )
    .then((rows) => {
      return rows.map(dbMapping.map.endpointTypeAttribute)
    })
}

async function selectEndpointTypeAttribute(
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
  ETA.ENDPOINT_TYPE_REF,
  ETC.CLUSTER_REF,
  ETA.ATTRIBUTE_REF,
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
  ENDPOINT_TYPE_ATTRIBUTE AS ETA, ENDPOINT_TYPE_CLUSTER AS ETC
WHERE
  ETA.ENDPOINT_TYPE_REF = ?
  AND ETA.ATTRIBUTE_REF = ?
  AND ETA.ENDPOINT_TYPE_CLUSTER_REF = ETC.ENDPOINT_TYPE_CLUSTER_ID
  AND ETC.CLUSTER_REF = ?`,
      [endpointTypeId, attributeRef, clusterRef]
    )
    .then(dbMapping.map.endpointTypeAttribute)
}

async function selectEndpointTypeCommandsByEndpointId(db, endpointTypeId) {
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

async function selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef) {
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

async function selectDeviceTypeClusterByDeviceTypeClusterId(
  db,
  deviceTypeClusterId
) {
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

async function selectDeviceTypeAttributesByDeviceTypeRef(db, deviceTypeRef) {
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

async function selectDeviceTypeCommandsByDeviceTypeRef(db, deviceTypeRef) {
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
 * After loading up device type cluster table with the names,
 * this method links the refererence to actual cluster reference.
 *
 * @param {*} db
 * @returns promise of completion
 */
async function updateClusterReferencesForDeviceTypeClusters(db) {
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

/**
 * After loading up device type attribute table with the names,
 * this method links the refererence to actual attribute reference.
 *
 * @param {*} db
 * @returns promise of completion
 */
async function updateAttributeReferencesForDeviceTypeReferences(db) {
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

/**
 * After loading up device type command table with the names,
 * this method links the refererence to actual command reference.
 *
 * @param {*} db
 * @returns promise of completion
 */
async function updateCommandReferencesForDeviceTypeReferences(db) {
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
 * This method returns the promise of linking the device type clusters
 * commands and attributes to the correct IDs in the cluster, attribute
 * and command tables.
 *
 * Initial load only populates the names, so once everything is loaded,
 * we have to link the foreign keys.
 *
 * @param {*} db
 * @returns promise of completed linking
 */
async function updateDeviceTypeEntityReferences(db) {
  await updateClusterReferencesForDeviceTypeClusters(db)
  await updateAttributeReferencesForDeviceTypeReferences(db)
  return updateCommandReferencesForDeviceTypeReferences(db)
}

const ATOMIC_QUERY = `
SELECT
  ATOMIC_IDENTIFIER,
  NAME,
  DESCRIPTION,
  ATOMIC_SIZE,
  IS_DISCRETE,
  IS_STRING,
  IS_LONG,
  IS_CHAR,
  IS_SIGNED
FROM ATOMIC
`

/**
 * Locates atomic type based on a type name.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} typeName
 */
async function selectAtomicType(db, packageId, typeName) {
  return dbApi
    .dbGet(db, `${ATOMIC_QUERY} WHERE PACKAGE_REF = ? AND NAME = ?`, [
      packageId,
      typeName == null ? typeName : typeName.toLowerCase(),
    ])
    .then(dbMapping.map.atomic)
}

/**
 * Retrieve the atomic by name, returning promise that resolves into an atomic, or null.
 * @param {*} db
 * @param {*} name
 * @param {*} packageId
 */
async function selectAtomicByName(db, name, packageId) {
  return dbApi
    .dbGet(db, `${ATOMIC_QUERY} WHERE PACKAGE_REF = ? AND NAME = ?`, [
      packageId,
      name,
    ])
    .then(dbMapping.map.atomic)
}

/**
 * Retrieves all atomic types under a given package Id.
 * @param {*} db
 * @param {*} packageId
 */
async function selectAllAtomics(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `${ATOMIC_QUERY} WHERE PACKAGE_REF = ? ORDER BY ATOMIC_IDENTIFIER`,
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
async function selectAtomicSizeFromType(db, packageId, type) {
  let row = await dbApi.dbGet(
    db,
    'SELECT ATOMIC_SIZE FROM ATOMIC WHERE PACKAGE_REF = ? AND NAME = ?',
    [packageId, type]
  )
  if (row == null) {
    return null
  } else {
    return row.ATOMIC_SIZE
  }
}

/**
 * Exports clusters and endpoint ids
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the data that contains cluster
 * and endpoint id references
 */
async function exportClustersAndEndpointDetailsFromEndpointTypes(
  db,
  endpointTypes
) {
  let endpointTypeIds = endpointTypes.map((ep) => ep.endpointTypeId).toString()
  let mapFunction = (x) => {
    return {
      endpointId: x.ENDPOINT_TYPE_REF,
      endpointClusterId: x.ENDPOINT_TYPE_CLUSTER_ID,
      endpointTypeClusterRef: x.CLUSTER_REF,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF,
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID,
  ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
FROM 
  CLUSTER
INNER JOIN 
  ENDPOINT_TYPE_CLUSTER
ON 
  CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
WHERE
  ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF IN (${endpointTypeIds})`
    )
    .then((rows) => rows.map(mapFunction))
}

function commandMap(x) {
  return {
    id: x.COMMAND_ID,
    name: x.NAME,
    code: x.CODE,
    commandSource: x.SOURCE,
    source: x.SOURCE,
    mfgCode: x.MANUFACTURER_CODE,
    incoming: x.INCOMING,
    outgoing: x.OUTGOING,
    description: x.DESCRIPTION,
    clusterSide: x.SIDE,
    clusterName: x.CLUSTER_NAME,
    isClusterEnabled: x.ENABLED,
  }
}

/**
 * Returns a promise of data for commands inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
async function exportCommandDetailsFromAllEndpointTypesAndClusters(
  db,
  endpointsAndClusters
) {
  let endpointTypeIds = endpointsAndClusters
    .map((ep) => ep.endpointId)
    .toString()
  let endpointClusterIds = endpointsAndClusters
    .map((ep) => ep.endpointClusterId)
    .toString()
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
    CLUSTER.NAME AS CLUSTER_NAME,
    ENDPOINT_TYPE_CLUSTER.ENABLED
  FROM
    COMMAND
  INNER JOIN
    ENDPOINT_TYPE_COMMAND
  ON
    COMMAND.COMMAND_ID = ENDPOINT_TYPE_COMMAND.COMMAND_REF
  INNER JOIN
    ENDPOINT_TYPE_CLUSTER
  ON
    ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN
    CLUSTER
  ON
    COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds}) 
    AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF in (${endpointClusterIds})
  GROUP BY
    COMMAND.NAME, COMMAND.COMMAND_ID
        `
    )
    .then((rows) => rows.map(commandMap))
}

/**
 * Returns a promise of data for manufacturing/non-manufacturing specific commands
 * inside an endpoint type.
 *
 * @param db
 * @param endpointTypeId
 * @returns Promise that resolves with the manufacturing/non-manufacturing
 * specific command data.
 */
async function exportCommandDetailsFromAllEndpointTypesAndClustersUtil(
  db,
  endpointsAndClusters,
  isManufacturingSpecific
) {
  let endpointTypeIds = endpointsAndClusters
    .map((ep) => ep.endpointId)
    .toString()
  let endpointClusterIds = endpointsAndClusters
    .map((ep) => ep.endpointClusterId)
    .toString()
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
    CLUSTER.NAME AS CLUSTER_NAME,
    ENDPOINT_TYPE_CLUSTER.ENABLED
  FROM
    COMMAND
  INNER JOIN
    ENDPOINT_TYPE_COMMAND
  ON
    COMMAND.COMMAND_ID = ENDPOINT_TYPE_COMMAND.COMMAND_REF
  INNER JOIN
    ENDPOINT_TYPE_CLUSTER
  ON
    ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN
    CLUSTER
  ON
    COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  WHERE
    ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_REF IN (${endpointTypeIds})
    AND ENDPOINT_TYPE_COMMAND.ENDPOINT_TYPE_CLUSTER_REF in (${endpointClusterIds})
    AND COMMAND.MANUFACTURER_CODE IS ${
      isManufacturingSpecific ? `NOT` : ``
    } NULL
  GROUP BY COMMAND.NAME
        `
    )
    .then((rows) => rows.map(commandMap))
}

/**
 * Returns a promise of data for manufacturing specific commands inside an endpoint type.
 *
 * @param db
 * @param endpointTypeId
 * @returns Promise that resolves with the manufacturing specific command data.
 */
async function exportManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
  db,
  endpointsAndClusters
) {
  return exportCommandDetailsFromAllEndpointTypesAndClustersUtil(
    db,
    endpointsAndClusters,
    true
  )
}

/**
 * Returns a promise of data for commands with no manufacturing specific information inside an endpoint type.
 *
 * @param db
 * @param endpointTypeId
 * @returns Promise that resolves with the non-manufacturing specific command data.
 */
async function exportNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
  db,
  endpointsAndClusters
) {
  return exportCommandDetailsFromAllEndpointTypesAndClustersUtil(
    db,
    endpointsAndClusters,
    false
  )
}

function commandMapFunction(x) {
  return {
    id: x.COMMAND_ID,
    name: x.NAME,
    code: x.CODE,
    commandSource: x.SOURCE,
    mfgCode: x.MANUFACTURER_CODE,
    description: x.DESCRIPTION,
    clusterSide: x.SIDE,
    clusterName: x.CLUSTER_NAME,
    clusterDefine: x.CLUSTER_DEFINE,
    isClusterEnabled: x.ENABLED,
  }
}

/**
 * Returns a promise of data for commands inside an endpoint type.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the command data.
 */
async function exportAllCommandDetailsFromEnabledClusters(
  db,
  endpointsAndClusters
) {
  let endpointTypeClusterRef = endpointsAndClusters
    .map((ep) => ep.endpointTypeClusterRef)
    .toString()
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
    COMMAND.DESCRIPTION,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    CLUSTER.NAME AS CLUSTER_NAME,
    ENDPOINT_TYPE_CLUSTER.ENABLED
  FROM COMMAND
  INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
  WHERE ENDPOINT_TYPE_CLUSTER.CLUSTER_REF in (${endpointTypeClusterRef})
  GROUP BY COMMAND.NAME
        `
    )
    .then((rows) => rows.map(commandMapFunction))
}

/**
 *
 * @param db
 * @param endpointsAndClusters
 * @returns  Returns a promise of data for commands with cli inside an endpoint type.
 */
async function exportAllCliCommandDetailsFromEnabledClusters(
  db,
  endpointsAndClusters
) {
  let endpointTypeClusterRef = endpointsAndClusters
    .map((ep) => ep.endpointTypeClusterRef)
    .toString()
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
    COMMAND.DESCRIPTION,
    ENDPOINT_TYPE_CLUSTER.SIDE,
    CLUSTER.NAME AS CLUSTER_NAME,
    CLUSTER.DEFINE AS CLUSTER_DEFINE,
    ENDPOINT_TYPE_CLUSTER.ENABLED
  FROM COMMAND
  INNER JOIN CLUSTER
  ON COMMAND.CLUSTER_REF = CLUSTER.CLUSTER_ID
  INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
  INNER JOIN PACKAGE_OPTION
  ON PACKAGE_OPTION.OPTION_CODE = COMMAND.NAME
  WHERE ENDPOINT_TYPE_CLUSTER.CLUSTER_REF in (${endpointTypeClusterRef}) AND ENDPOINT_TYPE_CLUSTER.ENABLED=1
  GROUP BY COMMAND.NAME, CLUSTER.NAME
        `
    )
    .then((rows) => rows.map(commandMapFunction))
}

/**
 * Returns a promise that resolves into one of the zclType enum
 * values.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 */
async function determineType(db, type, packageId) {
  let atomic = await selectAtomicByName(db, type, packageId)
  if (atomic != null) return dbEnum.zclType.atomic

  let theEnum = await selectEnumByName(db, type, packageId)
  if (theEnum != null) return dbEnum.zclType.enum

  let struct = await selectStructByName(db, type, packageId)
  if (struct != null) return dbEnum.zclType.struct

  let theBitmap = await selectBitmapByName(db, packageId, type)
  if (theBitmap != null) return dbEnum.zclType.bitmap

  return dbEnum.zclType.unknown
}

/**
 * All cluster details along with their attribute details per endpoint.
 * @param db
 * @param endpointsAndClusters
 * @returns cluster details along with their attribute details per endpoint.
 */
async function exportClusterDetailsFromEnabledClusters(
  db,
  endpointsAndClusters
) {
  let endpointClusterIds = endpointsAndClusters
    .map((ep) => ep.endpointClusterId)
    .toString()
  let mapFunction = (x) => {
    return {
      id: x.ATTRIBUTE_ID,
      name: x.NAME,
      code: x.CODE,
      side: x.SIDE,
      type: x.TYPE,
      define: x.DEFINE,
      mfgCode: x.MANUFACTURER_CODE,
      isWritable: x.IS_WRITABLE,
      clusterSide: x.CLUSTER_SIDE,
      clusterName: x.CLUSTER_NAME,
      clusterCode: x.CLUSTER_CODE,
      isClusterEnabled: x.ENABLED,
      isAttributeBounded: x.BOUNDED,
      storageOption: x.STORAGE_OPTION,
      isSingleton: x.SINGLETON,
      attributeMinValue: x.MIN,
      attributeMaxValue: x.MAX,
      defaultValue: x.DEFAULT_VALUE,
      attributeSize: x.ATOMIC_SIZE,
      clusterIndex: x.CLUSTER_INDEX,
      endpointIndex: x.ENDPOINT_INDEX,
      rowNumber: x.ROW_INDEX,
      attributeCount: x.ATTRIBUTE_COUNT,
      clusterCount: x.CLUSTER_COUNT,
      attributesSize: x.ATTRIBUTES_SIZE,
      endpointTypeId: x.ENDPOINT_TYPE_ID,
      endpointIdentifier: x.ENDPOINT_IDENTIFIER,
      mfgClusterCount: x.MANUFACTURING_SPECIFIC_CLUSTER_COUNT,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
  SELECT *, COUNT(MANUFACTURER_CODE) OVER () AS MANUFACTURING_SPECIFIC_CLUSTER_COUNT FROM (
  SELECT
    ATTRIBUTE.ATTRIBUTE_ID AS ATTRIBUTE_ID,
    ATTRIBUTE.NAME AS NAME,
    ATTRIBUTE.CODE AS CODE,
    ATTRIBUTE.SIDE AS SIDE,
    ATTRIBUTE.TYPE AS TYPE,
    ATTRIBUTE.DEFINE AS DEFINE,
    CLUSTER.MANUFACTURER_CODE AS MANUFACTURER_CODE,
    ATTRIBUTE.IS_WRITABLE AS IS_WRITABLE,
    ENDPOINT_TYPE_CLUSTER.SIDE AS CLUSTER_SIDE,
    CLUSTER.NAME AS CLUSTER_NAME,
    CLUSTER.CODE AS CLUSTER_CODE,
    ENDPOINT_TYPE_CLUSTER.ENABLED AS ENABLED,
    ENDPOINT_TYPE_ATTRIBUTE.BOUNDED AS BOUNDED,
    ENDPOINT_TYPE_ATTRIBUTE.STORAGE_OPTION AS STORAGE_OPTION,
    ENDPOINT_TYPE_ATTRIBUTE.SINGLETON AS SINGLETON,
    ATTRIBUTE.MIN AS MIN,
    ATTRIBUTE.MAX AS MAX,
    ENDPOINT_TYPE_ATTRIBUTE.DEFAULT_VALUE AS DEFAULT_VALUE,
    CASE
      WHEN ATOMIC.IS_STRING=1 THEN 
        CASE WHEN ATOMIC.IS_LONG=0 THEN ATTRIBUTE.MAX_LENGTH+1
             WHEN ATOMIC.IS_LONG=1 THEN ATTRIBUTE.MAX_LENGTH+2
             ELSE ATOMIC.ATOMIC_SIZE
             END
        ELSE ATOMIC.ATOMIC_SIZE
    END AS ATOMIC_SIZE,
    ROW_NUMBER() OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE) CLUSTER_INDEX,
    ROW_NUMBER() OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER) ENDPOINT_INDEX,
    ROW_NUMBER() OVER () ROW_INDEX,
    COUNT(ATTRIBUTE.CODE) OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE) ATTRIBUTE_COUNT,
    COUNT(CLUSTER.CODE) OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.NAME) CLUSTER_COUNT,
    SUM(CASE WHEN ATOMIC.IS_STRING=1 THEN 
      CASE WHEN ATOMIC.IS_LONG=0 THEN ATTRIBUTE.MAX_LENGTH+1
          WHEN ATOMIC.IS_LONG=1 THEN ATTRIBUTE.MAX_LENGTH+2
          ELSE ATOMIC.ATOMIC_SIZE
      END
    ELSE ATOMIC.ATOMIC_SIZE
    END) OVER (PARTITION BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE) ATTRIBUTES_SIZE,
    ENDPOINT_TYPE.ENDPOINT_TYPE_ID AS ENDPOINT_TYPE_ID,
    ENDPOINT.ENDPOINT_IDENTIFIER AS ENDPOINT_IDENTIFIER
  FROM ATTRIBUTE
  INNER JOIN ENDPOINT_TYPE_ATTRIBUTE
  ON ATTRIBUTE.ATTRIBUTE_ID = ENDPOINT_TYPE_ATTRIBUTE.ATTRIBUTE_REF
  INNER JOIN ENDPOINT_TYPE_CLUSTER
  ON ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_CLUSTER_ID
  INNER JOIN CLUSTER
  ON ENDPOINT_TYPE_CLUSTER.CLUSTER_REF = CLUSTER.CLUSTER_ID
  INNER JOIN ATOMIC
  ON ATOMIC.NAME = ATTRIBUTE.TYPE
  INNER JOIN ENDPOINT_TYPE
  ON ENDPOINT_TYPE.ENDPOINT_TYPE_ID = ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF
  INNER JOIN ENDPOINT
  ON
  ENDPOINT.ENDPOINT_TYPE_REF = ENDPOINT_TYPE.ENDPOINT_TYPE_ID
  WHERE ENDPOINT_TYPE_ATTRIBUTE.ENDPOINT_TYPE_CLUSTER_REF IN (${endpointClusterIds}) AND ENDPOINT_TYPE_CLUSTER.ENABLED=1
  AND ENDPOINT_TYPE_ATTRIBUTE.INCLUDED = 1 AND ENDPOINT_TYPE_CLUSTER.SIDE=ATTRIBUTE.SIDE
  GROUP BY ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE, ATTRIBUTE.NAME ) WHERE CLUSTER_INDEX=1 ORDER BY ENDPOINT_IDENTIFIER, CLUSTER_NAME, CLUSTER_SIDE
        `
    )
    .then((rows) => rows.map(mapFunction))
}

// exports
exports.selectAllEnums = selectAllEnums
exports.selectAllEnumItemsById = selectAllEnumItemsById
exports.selectAllEnumItems = selectAllEnumItems
exports.selectEnumById = selectEnumById
exports.selectEnumByName = selectEnumByName

exports.selectAllBitmaps = selectAllBitmaps
exports.selectAllBitmapFields = selectAllBitmapFields
exports.selectBitmapById = selectBitmapById
exports.selectAllBitmapFieldsById = selectAllBitmapFieldsById
exports.selectBitmapByName = selectBitmapByName

exports.selectAllDomains = selectAllDomains
exports.selectDomainById = selectDomainById

exports.selectAtomicByName = selectAtomicByName
exports.selectAllAtomics = selectAllAtomics
exports.selectAtomicSizeFromType = selectAtomicSizeFromType
exports.selectAtomicType = selectAtomicType

exports.selectAllStructs = selectAllStructs
exports.selectStructById = selectStructById
exports.selectAllStructItemsById = selectAllStructItemsById
exports.selectAllStructItemsByStructName = selectAllStructItemsByStructName
exports.selectStructByName = selectStructByName

exports.selectAllClusters = selectAllClusters
exports.selectClusterById = selectClusterById
exports.selectClusterByCode = selectClusterByCode

exports.selectAllDeviceTypes = selectAllDeviceTypes
exports.selectDeviceTypeById = selectDeviceTypeById
exports.selectDeviceTypeByCodeAndName = selectDeviceTypeByCodeAndName

exports.selectAttributesByClusterIdAndSideIncludingGlobal = selectAttributesByClusterIdAndSideIncludingGlobal
exports.selectAttributesByClusterIdIncludingGlobal = selectAttributesByClusterIdIncludingGlobal
exports.selectAttributesByClusterCodeAndManufacturerCode = selectAttributesByClusterCodeAndManufacturerCode
exports.selectAttributeById = selectAttributeById
exports.selectAttributeByAttributeIdAndClusterRef = selectAttributeByAttributeIdAndClusterRef
exports.selectAllAttributes = selectAllAttributes
exports.selectAllAttributesBySide = selectAllAttributesBySide

exports.selectEndpointTypeClustersByEndpointTypeId = selectEndpointTypeClustersByEndpointTypeId
exports.selectEndpointTypeAttributesByEndpointId = selectEndpointTypeAttributesByEndpointId
exports.selectEndpointTypeAttribute = selectEndpointTypeAttribute
exports.selectEndpointTypeCommandsByEndpointId = selectEndpointTypeCommandsByEndpointId

exports.selectDeviceTypeClustersByDeviceTypeRef = selectDeviceTypeClustersByDeviceTypeRef
exports.selectDeviceTypeClusterByDeviceTypeClusterId = selectDeviceTypeClusterByDeviceTypeClusterId
exports.selectDeviceTypeAttributesByDeviceTypeRef = selectDeviceTypeAttributesByDeviceTypeRef
exports.selectDeviceTypeCommandsByDeviceTypeRef = selectDeviceTypeCommandsByDeviceTypeRef
exports.updateDeviceTypeEntityReferences = updateDeviceTypeEntityReferences

exports.determineType = determineType

exports.exportClustersAndEndpointDetailsFromEndpointTypes = exportClustersAndEndpointDetailsFromEndpointTypes
exports.exportCommandDetailsFromAllEndpointTypesAndClusters = exportCommandDetailsFromAllEndpointTypesAndClusters
exports.exportAllCommandDetailsFromEnabledClusters = exportAllCommandDetailsFromEnabledClusters
exports.exportManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters = exportManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters
exports.exportNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters = exportNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters
exports.exportAllCliCommandDetailsFromEnabledClusters = exportAllCliCommandDetailsFromEnabledClusters
exports.exportClusterDetailsFromEnabledClusters = exportClusterDetailsFromEnabledClusters
