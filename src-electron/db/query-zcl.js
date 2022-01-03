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
const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')
const queryAtomic = require('./query-atomic')
const queryEnum = require('./query-enum')
const queryStruct = require('./query-struct')
const queryBitmap = require('./query-bitmap')

/**
 * Retrieves all the bitmaps that are associated with a cluster.
 * @param {*} db
 * @param {*} packageId
 * @param {*} clusterId
 * @returns cluster-related bitmaps
 */
async function selectClusterBitmaps(db, packageId, clusterId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  B.BITMAP_ID,
  B.NAME,
  B.TYPE
FROM
  BITMAP AS B
INNER JOIN
  BITMAP_CLUSTER AS BC
ON
  B.BITMAP_ID = BC.BITMAP_REF
WHERE
  B.PACKAGE_REF = ?
  AND BC.CLUSTER_REF = ?
ORDER BY B.NAME`,
      [packageId, clusterId]
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
 * Retrieves all the structs in the database, including the count
 * of items.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of structs.
 */
async function selectAllStructsWithItemCount(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  STRUCT.STRUCT_ID,
  STRUCT.NAME,
  COUNT(ITEM.NAME) AS ITEM_COUNT
FROM
  STRUCT
LEFT JOIN
  STRUCT_ITEM AS ITEM
ON
  STRUCT.STRUCT_ID = ITEM.STRUCT_REF
WHERE
  STRUCT.PACKAGE_REF = ?
GROUP BY STRUCT.NAME
ORDER BY STRUCT.NAME`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.struct))
}

/**
 * Returns an array of clusters that struct belongs to.
 * @param {*} db
 * @param {*} structId
 * @returns clusters
 */
async function selectStructClusters(db, structId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  C.CLUSTER_ID,
  C.CODE,
  C.MANUFACTURER_CODE,
  C.NAME,
  C.DESCRIPTION,
  C.DEFINE,
  C.DOMAIN_NAME,
  C.IS_SINGLETON,
  C.REVISION
FROM
  CLUSTER AS C
INNER JOIN
  STRUCT_CLUSTER AS SC
ON
  C.CLUSTER_ID = SC.CLUSTER_REF
WHERE
  SC.STRUCT_REF = ?
ORDER BY C.CODE
    `,
      [structId]
    )
    .then((rows) => rows.map(dbMapping.map.cluster))
}

/**
 * Returns an array of clusters that enum belongs to.
 * @param {*} db
 * @param {*} enumId
 * @returns clusters
 */
async function selectEnumClusters(db, enumId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  C.CLUSTER_ID,
  C.CODE,
  C.MANUFACTURER_CODE,
  C.NAME,
  C.DESCRIPTION,
  C.DEFINE,
  C.DOMAIN_NAME,
  C.IS_SINGLETON,
  C.REVISION
FROM
  CLUSTER AS C
INNER JOIN
  ENUM_CLUSTER AS EC
ON
  C.CLUSTER_ID = EC.CLUSTER_REF
WHERE
  EC.ENUM_REF = ?
    `,
      [enumId]
    )
    .then((rows) => rows.map(dbMapping.map.cluster))
}

/**
 * Returns an array of clusters that enum belongs to.
 * @param {*} db
 * @param {*} enumId
 * @returns clusters
 */
async function selectBitmapClusters(db, bitmapId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  C.CLUSTER_ID,
  C.CODE,
  C.MANUFACTURER_CODE,
  C.NAME,
  C.DESCRIPTION,
  C.DEFINE,
  C.DOMAIN_NAME,
  C.IS_SINGLETON,
  C.REVISION
FROM
  CLUSTER AS C
INNER JOIN
  BITMAP_CLUSTER AS BC
ON
  C.CLUSTER_ID = BC.CLUSTER_REF
WHERE
  BC.BITMAP_REF = ?
    `,
      [bitmapId]
    )
    .then((rows) => rows.map(dbMapping.map.cluster))
}

/**
 * Retrieves all the cluster-related structs in the database with the items.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of structs, each one containing items field with rows of items.
 */
async function selectClusterStructsWithItems(db, packageId, clusterId) {
  return selectStructsWithItemsImpl(db, packageId, clusterId)
}

/**
 * Retrieves all the structs in the database with the items.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of structs, each one containing items field with rows of items.
 */
async function selectAllStructsWithItems(db, packageId) {
  return selectStructsWithItemsImpl(db, packageId, null)
}

async function selectStructsWithItemsImpl(db, packageId, clusterId) {
  let query
  let args
  if (clusterId == null) {
    query = `
    SELECT
      S.STRUCT_ID AS STRUCT_ID,
      S.NAME AS STRUCT_NAME,
      (SELECT COUNT(1) FROM STRUCT_CLUSTER WHERE STRUCT_CLUSTER.STRUCT_REF = S.STRUCT_ID) AS STRUCT_CLUSTER_COUNT,
      SI.NAME AS ITEM_NAME,
      SI.FIELD_IDENTIFIER AS ITEM_IDENTIFIER,
      SI.TYPE AS ITEM_TYPE,
      SI.IS_ARRAY AS ITEM_IS_ARRAY,
      SI.IS_ENUM AS ITEM_IS_ENUM,
      SI.MIN_LENGTH AS ITEM_MIN_LENGTH,
      SI.MAX_LENGTH AS ITEM_MAX_LENGTH,
      SI.IS_WRITABLE AS ITEM_IS_WRITABLE,
      SI.IS_NULLABLE AS ITEM_IS_NULLABLE,
      SI.IS_OPTIONAL AS ITEM_IS_OPTIONAL,
      SI.IS_FABRIC_SENSITIVE AS ITEM_IS_FABRIC_SENSITIVE
    FROM
      STRUCT AS S
    LEFT JOIN
      STRUCT_ITEM AS SI
    ON
      S.STRUCT_ID = SI.STRUCT_REF
    WHERE
      S.PACKAGE_REF = ?
    ORDER BY S.NAME, SI.FIELD_IDENTIFIER`
    args = [packageId]
  } else {
    query = `
    SELECT
      S.STRUCT_ID AS STRUCT_ID,
      S.NAME AS STRUCT_NAME,
      (SELECT COUNT(1) FROM STRUCT_CLUSTER WHERE STRUCT_CLUSTER.STRUCT_REF = S.STRUCT_ID) AS STRUCT_CLUSTER_COUNT,
      SI.NAME AS ITEM_NAME,
      SI.FIELD_IDENTIFIER AS ITEM_IDENTIFIER,
      SI.TYPE AS ITEM_TYPE,
      SI.IS_ARRAY AS ITEM_IS_ARRAY,
      SI.IS_ENUM AS ITEM_IS_ENUM,
      SI.MIN_LENGTH AS ITEM_MIN_LENGTH,
      SI.MAX_LENGTH AS ITEM_MAX_LENGTH,
      SI.IS_WRITABLE AS ITEM_IS_WRITABLE,
      SI.IS_NULLABLE AS ITEM_IS_NULLABLE,
      SI.IS_OPTIONAL AS ITEM_IS_OPTIONAL,
      SI.IS_FABRIC_SENSITIVE AS ITEM_IS_FABRIC_SENSITIVE
    FROM
      STRUCT AS S
    INNER JOIN
      STRUCT_CLUSTER AS SC
    ON
      S.STRUCT_ID = SC.STRUCT_REF
    LEFT JOIN
      STRUCT_ITEM AS SI
    ON
      S.STRUCT_ID = SI.STRUCT_REF
    WHERE
      S.PACKAGE_REF = ?
    AND
      SC.CLUSTER_REF = ?
    ORDER BY S.NAME, SI.FIELD_IDENTIFIER`
    args = [packageId, clusterId]
  }

  let rows = await dbApi.dbAll(db, query, args)
  return rows.reduce((acc, value) => {
    let objectToActOn
    if (acc.length == 0 || acc[acc.length - 1].name != value.STRUCT_NAME) {
      // Create a new object
      objectToActOn = {
        id: value.STRUCT_ID,
        name: value.STRUCT_NAME,
        label: value.STRUCT_NAME,
        struct_cluster_count: value.STRUCT_CLUSTER_COUNT,
        items: [],
        itemCnt: 0,
      }
      acc.push(objectToActOn)
    } else {
      objectToActOn = acc[acc.length - 1]
    }
    objectToActOn.items.push({
      name: value.ITEM_NAME,
      label: value.ITEM_NAME,
      fieldIdentifier: value.ITEM_IDENTIFIER,
      type: value.ITEM_TYPE,
      isArray: dbApi.fromDbBool(value.ITEM_IS_ARRAY),
      isEnum: dbApi.fromDbBool(value.ITEM_IS_ENUM),
      minLength: value.ITEM_MIN_LENGTH,
      maxLength: value.ITEM_MAX_LENGTH,
      isWritable: dbApi.fromDbBool(value.ITEM_IS_WRITABLE),
      isNullable: dbApi.fromDbBool(value.ITEM_IS_NULLABLE),
      isOptional: dbApi.fromDbBool(value.ITEM_IS_OPTIONAL),
      isFabricSensitive: dbApi.fromDbBool(value.ITEM_IS_FABRIC_SENSITIVE),
    })
    objectToActOn.itemCnt++
    return acc
  }, [])
}

async function selectAllStructItemsById(db, id) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  FIELD_IDENTIFIER,
  NAME,
  TYPE,
  STRUCT_REF,
  IS_ARRAY,
  IS_ENUM,
  MIN_LENGTH,
  MAX_LENGTH,
  IS_WRITABLE,
  IS_NULLABLE,
  IS_OPTIONAL,
  IS_FABRIC_SENSITIVE
FROM
  STRUCT_ITEM
WHERE STRUCT_REF = ?
ORDER BY
  FIELD_IDENTIFIER`,
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
async function selectAllStructItemsByStructName(db, name, packageId) {
  return dbApi
    .dbAll(
      db,
      `
SELECT
  SI.FIELD_IDENTIFIER,
  SI.NAME,
  SI.TYPE,
  SI.STRUCT_REF,
  SI.IS_ARRAY,
  SI.IS_ENUM,
  SI.MIN_LENGTH,
  SI.MAX_LENGTH,
  SI.IS_WRITABLE,
  SI.IS_NULLABLE,
  SI.IS_OPTIONAL,
  SI.IS_FABRIC_SENSITIVE
FROM
  STRUCT_ITEM AS SI
INNER JOIN
  STRUCT
ON
  STRUCT.STRUCT_ID = SI.STRUCT_REF
WHERE STRUCT.NAME = ?
  AND STRUCT.PACKAGE_REF = ?
ORDER BY FIELD_IDENTIFIER`,
      [name, packageId]
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
  IS_SINGLETON,
  REVISION
FROM CLUSTER
WHERE
  PACKAGE_REF = ?
ORDER BY CODE`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.cluster))
}

/**
 * Finds cluster by code.
 *
 * @param {*} db
 * @param {*} packageId Single packageId or an array of them.
 * @param {*} clusterCode
 * @param {*} mfgCode
 * @returns cluster by code in a single package id.
 */
async function selectClusterByCode(db, packageId, clusterCode, mfgCode = null) {
  let query = `
SELECT
  CLUSTER_ID,
  CODE,
  MANUFACTURER_CODE,
  NAME,
  DESCRIPTION,
  DEFINE,
  DOMAIN_NAME,
  IS_SINGLETON,
  REVISION
FROM
  CLUSTER
WHERE
  PACKAGE_REF = ?
  AND CODE = ?`

  let args
  if (mfgCode == null || mfgCode == 0) {
    query = query + ` AND MANUFACTURER_CODE IS NULL`
    args = [packageId, clusterCode]
  } else {
    query = query + ` AND MANUFACTURER_CODE = ?`
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
  IS_SINGLETON,
  REVISION
FROM
  CLUSTER
WHERE
  CLUSTER_ID = ?`,
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
  MIN_LENGTH,
  MAX_LENGTH,
  REPORT_MIN_INTERVAL,
  REPORT_MAX_INTERVAL,
  REPORTABLE_CHANGE,
  REPORTABLE_CHANGE_LENGTH,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE,
  IS_NULLABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE,
  MUST_USE_TIMED_WRITE
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
  MIN_LENGTH,
  MAX_LENGTH,
  REPORT_MIN_INTERVAL,
  REPORT_MAX_INTERVAL,
  REPORTABLE_CHANGE,
  REPORTABLE_CHANGE_LENGTH,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE,
  IS_NULLABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE,
  MUST_USE_TIMED_WRITE
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
  ATTRIBUTE.MIN_LENGTH,
  ATTRIBUTE.MAX_LENGTH,
  ATTRIBUTE.REPORT_MIN_INTERVAL,
  ATTRIBUTE.REPORT_MAX_INTERVAL,
  ATTRIBUTE.REPORTABLE_CHANGE,
  ATTRIBUTE.REPORTABLE_CHANGE_LENGTH,
  ATTRIBUTE.IS_WRITABLE,
  ATTRIBUTE.DEFAULT_VALUE,
  ATTRIBUTE.IS_OPTIONAL,
  ATTRIBUTE.IS_REPORTABLE,
  ATTRIBUTE.IS_NULLABLE,
  ATTRIBUTE.IS_SCENE_REQUIRED,
  ATTRIBUTE.ARRAY_TYPE,
  ATTRIBUTE.MUST_USE_TIMED_WRITE
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
  REPORT_MIN_INTERVAL,
  REPORT_MAX_INTERVAL,
  REPORTABLE_CHANGE,
  REPORTABLE_CHANGE_LENGTH,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE,
  IS_NULLABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE,
  MUST_USE_TIMED_WRITE
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
  A.MIN_LENGTH,
  A.MAX_LENGTH,
  A.REPORT_MIN_INTERVAL,
  A.REPORT_MAX_INTERVAL,
  A.REPORTABLE_CHANGE,
  A.REPORTABLE_CHANGE_LENGTH,
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
  A.IS_NULLABLE,
  A.IS_SCENE_REQUIRED,
  A.ARRAY_TYPE,
  A.MUST_USE_TIMED_WRITE
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
  A.REPORT_MIN_INTERVAL,
  A.REPORT_MAX_INTERVAL,
  A.REPORTABLE_CHANGE,
  A.REPORTABLE_CHANGE_LENGTH,
  A.IS_WRITABLE,
  A.DEFAULT_VALUE,
  A.IS_OPTIONAL,
  A.IS_REPORTABLE,
  A.IS_NULLABLE,
  A.IS_SCENE_REQUIRED,
  A.ARRAY_TYPE,
  A.MUST_USE_TIMED_WRITE,
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
  let rows = await dbApi.dbAll(
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
  MIN_LENGTH,
  MAX_LENGTH,
  REPORT_MIN_INTERVAL,
  REPORT_MAX_INTERVAL,
  REPORTABLE_CHANGE,
  REPORTABLE_CHANGE_LENGTH,
  IS_WRITABLE,
  DEFAULT_VALUE,
  IS_OPTIONAL,
  IS_REPORTABLE,
  IS_NULLABLE,
  IS_SCENE_REQUIRED,
  ARRAY_TYPE,
  MUST_USE_TIMED_WRITE
FROM ATTRIBUTE
   WHERE SIDE = ?
   AND PACKAGE_REF = ?
ORDER BY CODE`,
    [side, packageId]
  )
  return rows.map(dbMapping.map.attribute)
}

async function selectEndpointTypeClustersByEndpointTypeId(db, endpointTypeId) {
  let rows = await dbApi.dbAll(
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
  return rows.map(dbMapping.map.endpointTypeCluster)
}

async function selectEndpointTypeAttributesByEndpointId(db, endpointTypeId) {
  let rows = await dbApi.dbAll(
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
  return rows.map(dbMapping.map.endpointTypeAttribute)
}

async function selectEndpointTypeAttribute(
  db,
  endpointTypeId,
  attributeRef,
  clusterRef
) {
  let row = await dbApi.dbGet(
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
  return dbMapping.map.endpointTypeAttribute(row)
}

async function selectEndpointTypeCommandsByEndpointId(db, endpointTypeId) {
  let rows = await dbApi.dbAll(
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
  return rows.map(dbMapping.map.endpointTypeCommand)
}

async function selectDeviceTypeClustersByDeviceTypeRef(db, deviceTypeRef) {
  let rows = await dbApi.dbAll(
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
  return rows.map(dbMapping.map.deviceTypeCluster)
}

async function selectDeviceTypeClusterByDeviceTypeClusterId(
  db,
  deviceTypeClusterId
) {
  let row = await dbApi.dbGet(
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
  return dbMapping.map.deviceTypeCluster(row)
}

async function selectDeviceTypeAttributesByDeviceTypeRef(db, deviceTypeRef) {
  let rows = await dbApi.dbAll(
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
  return rows.map(dbMapping.map.deviceTypeAttribute)
}

async function selectDeviceTypeCommandsByDeviceTypeRef(db, deviceTypeRef) {
  let rows = await dbApi.dbAll(
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
  return rows.map(dbMapping.map.deviceTypeCommand)
}

/**
 * After loading up device type cluster table with the names,
 * this method links the refererence to actual cluster reference.
 *
 * @param {*} db
 * @returns promise of completion
 */
async function updateClusterReferencesForDeviceTypeClusters(db, packageId) {
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
    WHERE
      lower(CLUSTER.NAME) = lower(DEVICE_TYPE_CLUSTER.CLUSTER_NAME)
    AND
      CLUSTER.PACKAGE_REF = ?
  )
WHERE
  ( SELECT PACKAGE_REF
    FROM DEVICE_TYPE
    WHERE DEVICE_TYPE_ID = DEVICE_TYPE_CLUSTER.DEVICE_TYPE_REF
  ) = ?`,
    [packageId, packageId]
  )
}

/**
 * After loading up device type attribute table with the names,
 * this method links the refererence to actual attribute reference.
 *
 * @param {*} db
 * @returns promise of completion
 */
async function updateAttributeReferencesForDeviceTypeReferences(db, packageId) {
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
    WHERE
      upper(ATTRIBUTE.DEFINE) = upper(DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_NAME)
    AND
      ATTRIBUTE.CLUSTER_REF = (
        SELECT
          DEVICE_TYPE_CLUSTER.CLUSTER_REF
        FROM
          DEVICE_TYPE_CLUSTER
        WHERE
          DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_ATTRIBUTE.DEVICE_TYPE_CLUSTER_REF
      )
    AND
      ATTRIBUTE.PACKAGE_REF = ?
  )
WHERE
  (
    SELECT PACKAGE_REF
    FROM ATTRIBUTE
    WHERE ATTRIBUTE.ATTRIBUTE_ID = DEVICE_TYPE_ATTRIBUTE.ATTRIBUTE_REF
  ) = ?
  `,
    [packageId, packageId]
  )
}

/**
 * After loading up device type command table with the names,
 * this method links the refererence to actual command reference.
 *
 * @param {*} db
 * @returns promise of completion
 */
async function updateCommandReferencesForDeviceTypeReferences(db, packageId) {
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
    WHERE
      upper(COMMAND.NAME) = upper(DEVICE_TYPE_COMMAND.COMMAND_NAME)
    AND
      COMMAND.CLUSTER_REF =
      ( SELECT
          DEVICE_TYPE_CLUSTER.CLUSTER_REF
        FROM
          DEVICE_TYPE_CLUSTER
        WHERE
          DEVICE_TYPE_CLUSTER_ID = DEVICE_TYPE_COMMAND.DEVICE_TYPE_CLUSTER_REF
      )
    AND
      COMMAND.PACKAGE_REF = ?
  )
WHERE
  (
    SELECT PACKAGE_REF
    FROM COMMAND
    WHERE COMMAND.COMMAND_ID = DEVICE_TYPE_COMMAND.COMMAND_REF
  ) = ?`,
    [packageId, packageId]
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
async function updateDeviceTypeEntityReferences(db, packageId) {
  await updateClusterReferencesForDeviceTypeClusters(db, packageId)
  await updateAttributeReferencesForDeviceTypeReferences(db, packageId)
  return updateCommandReferencesForDeviceTypeReferences(db, packageId)
}

// exports
exports.selectClusterBitmaps = selectClusterBitmaps
exports.selectAllBitmapFields = selectAllBitmapFields
exports.selectAllBitmapFieldsById = selectAllBitmapFieldsById

exports.selectAllDomains = selectAllDomains
exports.selectDomainById = selectDomainById

exports.selectAllStructsWithItemCount = selectAllStructsWithItemCount
exports.selectAllStructsWithItems = selectAllStructsWithItems
exports.selectClusterStructsWithItems = selectClusterStructsWithItems

exports.selectAllStructItemsById = selectAllStructItemsById
exports.selectAllStructItemsByStructName = selectAllStructItemsByStructName

exports.selectAllClusters = selectAllClusters
exports.selectClusterById = selectClusterById
exports.selectClusterByCode = selectClusterByCode

exports.selectAllDeviceTypes = selectAllDeviceTypes
exports.selectDeviceTypeById = selectDeviceTypeById
exports.selectDeviceTypeByCodeAndName = selectDeviceTypeByCodeAndName

exports.selectAttributesByClusterIdAndSideIncludingGlobal =
  selectAttributesByClusterIdAndSideIncludingGlobal
exports.selectAttributesByClusterIdIncludingGlobal =
  selectAttributesByClusterIdIncludingGlobal
exports.selectAttributesByClusterCodeAndManufacturerCode =
  selectAttributesByClusterCodeAndManufacturerCode
exports.selectAttributeById = selectAttributeById
exports.selectAttributeByAttributeIdAndClusterRef =
  selectAttributeByAttributeIdAndClusterRef
exports.selectAllAttributes = selectAllAttributes
exports.selectAllAttributesBySide = selectAllAttributesBySide

exports.selectEndpointTypeClustersByEndpointTypeId =
  selectEndpointTypeClustersByEndpointTypeId
exports.selectEndpointTypeAttributesByEndpointId =
  selectEndpointTypeAttributesByEndpointId
exports.selectEndpointTypeAttribute = selectEndpointTypeAttribute
exports.selectEndpointTypeCommandsByEndpointId =
  selectEndpointTypeCommandsByEndpointId

exports.selectDeviceTypeClustersByDeviceTypeRef =
  selectDeviceTypeClustersByDeviceTypeRef
exports.selectDeviceTypeClusterByDeviceTypeClusterId =
  selectDeviceTypeClusterByDeviceTypeClusterId
exports.selectDeviceTypeAttributesByDeviceTypeRef =
  selectDeviceTypeAttributesByDeviceTypeRef
exports.selectDeviceTypeCommandsByDeviceTypeRef =
  selectDeviceTypeCommandsByDeviceTypeRef
exports.updateDeviceTypeEntityReferences = updateDeviceTypeEntityReferences

exports.selectEnumClusters = selectEnumClusters
exports.selectStructClusters = selectStructClusters
exports.selectBitmapClusters = selectBitmapClusters

// Forwarded exports so we don't break API.
exports.selectAllAtomics = queryAtomic.selectAllAtomics
exports.selectAtomicSizeFromType = queryAtomic.selectAtomicSizeFromType
exports.selectAtomicType = queryAtomic.selectAtomicType
exports.selectAtomicById = queryAtomic.selectAtomicById

exports.selectAllEnums = queryEnum.selectAllEnums
exports.selectClusterEnums = queryEnum.selectClusterEnums
exports.selectAllEnumItemsById = queryEnum.selectAllEnumItemsById
exports.selectAllEnumItems = queryEnum.selectAllEnumItems
exports.selectEnumById = queryEnum.selectEnumById
exports.selectEnumByName = queryEnum.selectEnumByName

exports.selectStructById = queryStruct.selectStructById
exports.selectStructByName = queryStruct.selectStructByName

exports.selectBitmapById = queryBitmap.selectBitmapById
exports.selectAllBitmaps = queryBitmap.selectAllBitmaps
exports.selectBitmapByName = queryBitmap.selectBitmapByName
