/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * This module provides queries for data types
 *
 * @module DB API: Data type queries against the database.
 */

const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')
const queryZcl = require('./query-zcl')
const envConfig = require('../util/env')
const dbEnum = require('../../src-shared/db-enum.js')
const dbCache = require('./db-cache')

/**
 * Gathers the data type information of an entry based on data type id along
 * with its actual type from disciminator table.
 * @param db
 * @param id
 * @returns Data type information
 */
async function selectDataTypeById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    DATA_TYPE.DATA_TYPE_ID,
    DATA_TYPE.NAME AS NAME,
    DATA_TYPE.DESCRIPTION,
    DATA_TYPE.DISCRIMINATOR_REF,
    DATA_TYPE.PACKAGE_REF,
    DISCRIMINATOR.NAME AS DISCRIMINATOR_NAME
  FROM
    DATA_TYPE
  INNER JOIN
    DISCRIMINATOR
  ON
    DATA_TYPE.DISCRIMINATOR_REF = DISCRIMINATOR.DISCRIMINATOR_ID
  WHERE
    DATA_TYPE_ID = ?`,
      [id]
    )
    .then(dbMapping.map.dataType)
}

/**
 * Gathers the data type information of an entry based on data type name along
 * with its actual type from disciminator table.
 * @param db
 * @param name
 * @param packageIds
 * @returns Data type information
 */
async function selectDataTypeByName(db, name, packageIds) {
  let smallCaseName = name.toLowerCase()
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    DATA_TYPE.DATA_TYPE_ID,
    DATA_TYPE.NAME AS NAME,
    DATA_TYPE.DESCRIPTION,
    DATA_TYPE.DISCRIMINATOR_REF,
    DATA_TYPE.PACKAGE_REF,
    DISCRIMINATOR.NAME AS DISCRIMINATOR_NAME
  FROM
    DATA_TYPE
  INNER JOIN
    DISCRIMINATOR
  ON
    DATA_TYPE.DISCRIMINATOR_REF = DISCRIMINATOR.DISCRIMINATOR_ID
  WHERE
    (DATA_TYPE.NAME = ? OR DATA_TYPE.NAME = ?) AND DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(
      packageIds
    )})`,
      [name, smallCaseName]
    )
    .then(dbMapping.map.dataType)
}

/**
 * Gathers the data type information based on data type name and
 * clusterId along with its actual type from disciminator table.
 * @param db
 * @param name
 * @param clusterId
 * @param packageIds
 * @returns Data type information
 */
async function selectDataTypeByNameAndClusterId(
  db,
  name,
  clusterId,
  packageIds
) {
  let selectQueryString = `
  SELECT
    DATA_TYPE.DATA_TYPE_ID,
    DATA_TYPE.NAME AS NAME,
    DATA_TYPE.DESCRIPTION,
    DATA_TYPE.DISCRIMINATOR_REF,
    DATA_TYPE.PACKAGE_REF,
    DISCRIMINATOR.NAME AS DISCRIMINATOR_NAME
  FROM
    DATA_TYPE
  INNER JOIN
    DISCRIMINATOR
  ON
    DATA_TYPE.DISCRIMINATOR_REF = DISCRIMINATOR.DISCRIMINATOR_ID `

  let clusterQueryExtension = `
  INNER JOIN
    DATA_TYPE_CLUSTER
  ON
    DATA_TYPE.DATA_TYPE_ID = DATA_TYPE_CLUSTER.DATA_TYPE_REF `

  let whereClause = `
  WHERE
    (DATA_TYPE.NAME = ? OR DATA_TYPE.NAME = ?)
    AND DATA_TYPE.PACKAGE_REF IN (${dbApi.toInClause(packageIds)}) `

  let whereClauseClusterExtension = `
  AND DATA_TYPE_CLUSTER.CLUSTER_REF = ?`

  let queryWithoutClusterId = selectQueryString + whereClause
  let queryWithClusterId =
    selectQueryString +
    clusterQueryExtension +
    whereClause +
    whereClauseClusterExtension

  let smallCaseName = name.toLowerCase()
  let res = await dbApi
    .dbAll(db, queryWithoutClusterId, [name, smallCaseName])
    .then((rows) => rows.map(dbMapping.map.dataType))

  if (res && res.length == 1) {
    return res[0]
  } else {
    return dbApi
      .dbGet(db, queryWithClusterId, [name, smallCaseName, clusterId])
      .then(dbMapping.map.dataType)
  }
}

/**
 * Gathers All the data types
 * @param db
 * @param packageId
 * @returns All data types
 */
async function selectAllDataTypes(db, packageId) {
  return dbApi
    .dbAll(
      db,
      `
  SELECT
    DATA_TYPE.DATA_TYPE_ID,
    DATA_TYPE.NAME AS NAME,
    DATA_TYPE.DESCRIPTION,
    DATA_TYPE.DISCRIMINATOR_REF,
    DATA_TYPE.PACKAGE_REF,
    DISCRIMINATOR.NAME AS DISCRIMINATOR_NAME
  FROM
    DATA_TYPE
  INNER JOIN
    DISCRIMINATOR
  ON
    DATA_TYPE.DISCRIMINATOR_REF = DISCRIMINATOR.DISCRIMINATOR_ID
  WHERE DATA_TYPE.PACKAGE_REF = ?`,
      [packageId]
    )
    .then((rows) => rows.map(dbMapping.map.dataType))
}

/**
 * Return the size of the given value whether it be a reference to it in the data
 * type table in the form of a number or be it the name of the type in the form
 * if string.
 * @param {*} db
 * @param {*} packageIds
 * @param {*} value
 * @returns The size of the given value
 */
async function selectSizeFromType(db, packageIds, value) {
  // Step 1: Extracting the data type based on type id or type name
  let dataType = null
  if (typeof value === 'number') {
    dataType = await queryZcl.selectDataTypeById(db, value)
  } else if (typeof value === 'string') {
    dataType = await queryZcl.selectDataTypeByName(db, value, packageIds)
  }

  // Step 2: Find the size based on the type of data
  try {
    if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.bitmap
    ) {
      let bt = await queryZcl.selectBitmapByName(db, packageIds, dataType.name)
      return bt.size
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.enum
    ) {
      let et = await queryZcl.selectEnumByName(db, dataType.name, packageIds)
      return et.size
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.number
    ) {
      let nt = await queryZcl.selectNumberByName(db, packageIds, dataType.name)
      return nt.size
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.struct
    ) {
      return null
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.string
    ) {
      return null
    } else {
      envConfig.logError(
        `In selectSizeFromType, could not determine the data type. Original value: ${JSON.stringify(value)}, resolved dataType: ${JSON.stringify(dataType)}`
      )
      return null
    }
  } catch (err) {
    envConfig.logError(
      'Could not find the size of type: ' + dataType.name + ' : ' + err
    )
  }
}

/**
 * Numeric endpoint type ids from either raw ids or `{ endpointTypeId }` rows.
 * @param {Array<number|{endpointTypeId: number}>} endpointTypeIds
 * @returns {number[]}
 */
function normalizeEndpointTypeIds(endpointTypeIds) {
  if (endpointTypeIds == null) return []
  return endpointTypeIds
    .map((entry) =>
      entry != null && typeof entry === 'object' ? entry.endpointTypeId : entry
    )
    .filter((id) => id != null)
}

/**
 * Data types used by a zap configuration.
 *
 * Seeds are the included attributes, enabled commands, and included events
 * on enabled clusters of the given endpoint types. A response command's
 * arguments are included when the request command is enabled. List entry
 * types are included with their attributes. The walk then follows struct
 * fields, enum and bitmap size types, and atomic baseType.
 *
 * @param {*} db
 * @param {number[]} packageIds
 * @param {Array<number|{endpointTypeId: number}>} endpointTypeIds
 * @param {number|null} [clusterId] limit to one cluster, or null for the whole configuration
 * @returns {Promise<object[]>} data types in `dbMapping.map.dataType` shape
 */
async function selectUsedDataTypes(
  db,
  packageIds,
  endpointTypeIds,
  clusterId = null
) {
  let ids = normalizeEndpointTypeIds(endpointTypeIds)
  if (packageIds == null || packageIds.length === 0 || ids.length === 0) {
    return []
  }
  let packageClause = dbApi.toInClause(packageIds)
  let endpointClause = dbApi.toInClause(ids)
  let clusterSql = clusterId == null ? '' : 'AND ETC.CLUSTER_REF = ?'
  let clusterArgs =
    clusterId == null ? [] : [clusterId, clusterId, clusterId, clusterId]
  let [typeRows, seedRows, structItemRows, baseTypeRows] = await Promise.all([
    dbApi.dbAll(
      db,
      `
SELECT
  DT.DATA_TYPE_ID,
  DT.NAME,
  DT.DESCRIPTION,
  DT.DISCRIMINATOR_REF,
  DT.PACKAGE_REF,
  D.NAME AS DISCRIMINATOR_NAME,
  E.SIZE AS ENUM_SIZE,
  B.SIZE AS BITMAP_SIZE,
  CASE WHEN E.ENUM_ID IS NOT NULL THEN 1 ELSE 0 END AS IS_ENUM,
  CASE WHEN B.BITMAP_ID IS NOT NULL THEN 1 ELSE 0 END AS IS_BITMAP,
  CASE WHEN S.STRUCT_ID IS NOT NULL THEN 1 ELSE 0 END AS IS_STRUCT,
  DTC.CLUSTER_REF
FROM DATA_TYPE AS DT
INNER JOIN DISCRIMINATOR AS D
  ON DT.DISCRIMINATOR_REF = D.DISCRIMINATOR_ID
LEFT JOIN ENUM AS E
  ON E.ENUM_ID = DT.DATA_TYPE_ID
LEFT JOIN BITMAP AS B
  ON B.BITMAP_ID = DT.DATA_TYPE_ID
LEFT JOIN STRUCT AS S
  ON S.STRUCT_ID = DT.DATA_TYPE_ID
LEFT JOIN DATA_TYPE_CLUSTER AS DTC
  ON DTC.DATA_TYPE_REF = DT.DATA_TYPE_ID
WHERE DT.PACKAGE_REF IN (${packageClause})`
    ),
    dbApi.dbAll(
      db,
      `
SELECT ETC.CLUSTER_REF AS CLUSTER_REF, A.TYPE AS TYPE, A.ARRAY_TYPE AS ENTRY_TYPE
FROM ENDPOINT_TYPE_ATTRIBUTE AS ETA
INNER JOIN ENDPOINT_TYPE_CLUSTER AS ETC
  ON ETC.ENDPOINT_TYPE_CLUSTER_ID = ETA.ENDPOINT_TYPE_CLUSTER_REF
INNER JOIN ATTRIBUTE AS A
  ON A.ATTRIBUTE_ID = ETA.ATTRIBUTE_REF
WHERE ETC.ENDPOINT_TYPE_REF IN (${endpointClause})
  AND ETC.ENABLED = 1
  AND ETA.INCLUDED = 1
  AND ETC.SIDE = A.SIDE
  AND A.PACKAGE_REF IN (${packageClause})
  ${clusterSql}
UNION ALL
SELECT ETC.CLUSTER_REF, CA.TYPE, NULL
FROM ENDPOINT_TYPE_COMMAND AS ETCMD
INNER JOIN ENDPOINT_TYPE_CLUSTER AS ETC
  ON ETC.ENDPOINT_TYPE_CLUSTER_ID = ETCMD.ENDPOINT_TYPE_CLUSTER_REF
INNER JOIN COMMAND AS C
  ON C.COMMAND_ID = ETCMD.COMMAND_REF
INNER JOIN COMMAND_ARG AS CA
  ON CA.COMMAND_REF = C.COMMAND_ID
WHERE ETC.ENDPOINT_TYPE_REF IN (${endpointClause})
  AND ETC.ENABLED = 1
  AND ETCMD.IS_ENABLED = 1
  AND C.PACKAGE_REF IN (${packageClause})
  ${clusterSql}
UNION ALL
SELECT ETC.CLUSTER_REF, CA.TYPE, NULL
FROM ENDPOINT_TYPE_COMMAND AS ETCMD
INNER JOIN ENDPOINT_TYPE_CLUSTER AS ETC
  ON ETC.ENDPOINT_TYPE_CLUSTER_ID = ETCMD.ENDPOINT_TYPE_CLUSTER_REF
INNER JOIN COMMAND AS C
  ON C.COMMAND_ID = ETCMD.COMMAND_REF
INNER JOIN COMMAND_ARG AS CA
  ON CA.COMMAND_REF = C.RESPONSE_REF
WHERE ETC.ENDPOINT_TYPE_REF IN (${endpointClause})
  AND ETC.ENABLED = 1
  AND ETCMD.IS_ENABLED = 1
  AND C.RESPONSE_REF IS NOT NULL
  AND C.PACKAGE_REF IN (${packageClause})
  ${clusterSql}
UNION ALL
SELECT ETC.CLUSTER_REF, EF.TYPE, NULL
FROM ENDPOINT_TYPE_EVENT AS ETE
INNER JOIN ENDPOINT_TYPE_CLUSTER AS ETC
  ON ETC.ENDPOINT_TYPE_CLUSTER_ID = ETE.ENDPOINT_TYPE_CLUSTER_REF
INNER JOIN EVENT AS EV
  ON EV.EVENT_ID = ETE.EVENT_REF
INNER JOIN EVENT_FIELD AS EF
  ON EF.EVENT_REF = EV.EVENT_ID
WHERE ETC.ENDPOINT_TYPE_REF IN (${endpointClause})
  AND ETC.ENABLED = 1
  AND ETE.INCLUDED = 1
  AND EV.PACKAGE_REF IN (${packageClause})
  ${clusterSql}`,
      clusterArgs
    ),
    dbApi.dbAll(
      db,
      `
SELECT SI.STRUCT_REF, SI.DATA_TYPE_REF, REF.NAME AS TYPE
FROM STRUCT_ITEM AS SI
INNER JOIN DATA_TYPE AS DT
  ON DT.DATA_TYPE_ID = SI.STRUCT_REF
LEFT JOIN DATA_TYPE AS REF
  ON REF.DATA_TYPE_ID = SI.DATA_TYPE_REF
WHERE DT.PACKAGE_REF IN (${packageClause})`
    ),
    dbApi.dbAll(
      db,
      `
SELECT NAME, BASE_TYPE
FROM ATOMIC
WHERE PACKAGE_REF IN (${packageClause})
  AND BASE_TYPE IS NOT NULL`
    )
  ])

  let used = collectUsedDataTypes(
    indexDataTypes(typeRows),
    seedRows.map(dbMapping.map.configuredType),
    structItemRows.map(dbMapping.map.structItem),
    baseTypeRows.map(dbMapping.map.atomic)
  )

  return used.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
}

/**
 * Group data-type rows, which repeat once per cluster link, into one record.
 * `clusterIds` is walk state: one type can link to many clusters, and
 * `clusterRef` is only the link on this row.
 * @param {object[]} rows
 * @returns {object[]} `dbMapping.map.dataType` records
 */
function indexDataTypes(rows) {
  let byId = new Map()
  for (const row of rows) {
    let mapped = dbMapping.map.dataType(row)
    let clusterRef = mapped.clusterRef
    delete mapped.clusterRef
    let type = byId.get(mapped.id)
    if (type == null) {
      mapped.clusterIds = new Set()
      byId.set(mapped.id, mapped)
      type = mapped
    }
    if (clusterRef != null) type.clusterIds.add(clusterRef)
  }
  return Array.from(byId.values())
}

/**
 * Pick the data type for a name. One match wins. Several matches prefer a
 * type linked to one of `clusterIds`, then a type with no cluster links.
 * @param {Map<string, object[]>} byLowerName
 * @param {string} name
 * @param {Iterable<number>} clusterIds
 * @returns {object|null}
 */
function resolveUsedDataType(byLowerName, name, clusterIds) {
  if (name == null || name === '') return null
  let matches = byLowerName.get(String(name).toLowerCase())
  if (matches == null || matches.length === 0) return null
  if (matches.length === 1) return matches[0]
  for (const clusterId of clusterIds) {
    let clustered = matches.find((type) => type.clusterIds.has(clusterId))
    if (clustered != null) return clustered
  }
  return matches.find((type) => type.clusterIds.size === 0) || matches[0]
}

/**
 * True when `name` is an atomic size type such as enum8 or bitmap32.
 * @param {string} name
 * @param {string} kind `dbEnum.zclType.enum` or `dbEnum.zclType.bitmap`
 * @returns {boolean}
 */
function isAtomicSizeType(name, kind) {
  return new RegExp('^' + kind + '\\d+$', 'i').test(name)
}

/**
 * @param {object[]} queue
 * @param {Set<number>} usedIds
 * @param {object|null} type
 */
function queueUsedDataType(queue, usedIds, type) {
  if (type == null || usedIds.has(type.id)) return
  usedIds.add(type.id)
  queue.push(type)
}

/**
 * Types reachable from the configuration seeds, including struct fields,
 * enum and bitmap size types, and atomic base types.
 * @param {object[]} types
 * @param {object[]} seeds
 * @param {object[]} structItems
 * @param {object[]} atomicBaseTypes
 * @returns {object[]}
 */
function collectUsedDataTypes(types, seeds, structItems, atomicBaseTypes) {
  let byId = new Map()
  let byLowerName = new Map()
  for (const type of types) {
    byId.set(type.id, type)
    let key = type.name.toLowerCase()
    if (!byLowerName.has(key)) byLowerName.set(key, [])
    byLowerName.get(key).push(type)
  }

  let itemsByStruct = new Map()
  for (const item of structItems) {
    if (!itemsByStruct.has(item.structRef))
      itemsByStruct.set(item.structRef, [])
    itemsByStruct.get(item.structRef).push(item)
  }

  let baseByName = new Map()
  for (const atomic of atomicBaseTypes) {
    if (atomic.baseType) {
      baseByName.set(atomic.name.toLowerCase(), atomic.baseType)
    }
  }

  let usedIds = new Set()
  let queue = []
  for (const seed of seeds) {
    let seedClusters = seed.clusterRef == null ? [] : [seed.clusterRef]
    queueUsedDataType(
      queue,
      usedIds,
      resolveUsedDataType(byLowerName, seed.type, seedClusters)
    )
    queueUsedDataType(
      queue,
      usedIds,
      resolveUsedDataType(byLowerName, seed.entryType, seedClusters)
    )
  }

  while (queue.length > 0) {
    let type = queue.pop()
    if (type.isStruct) {
      // STRUCT_ITEM.DATA_TYPE_REF is linked by name only at load time, so a
      // field naming a cluster-specific type can point at another cluster's
      // type of the same name. Resolve within the struct's own clusters.
      for (const item of itemsByStruct.get(type.id) || []) {
        queueUsedDataType(
          queue,
          usedIds,
          resolveUsedDataType(byLowerName, item.type, type.clusterIds) ||
            byId.get(item.dataTypeReference)
        )
      }
    }
    if (
      type.isEnum &&
      type.enumSize != null &&
      !isAtomicSizeType(type.name, dbEnum.zclType.enum)
    ) {
      queueUsedDataType(
        queue,
        usedIds,
        resolveUsedDataType(
          byLowerName,
          dbEnum.zclType.enum + Number(type.enumSize) * 8,
          []
        )
      )
    }
    if (
      type.isBitmap &&
      type.bitmapSize != null &&
      !isAtomicSizeType(type.name, dbEnum.zclType.bitmap)
    ) {
      queueUsedDataType(
        queue,
        usedIds,
        resolveUsedDataType(
          byLowerName,
          dbEnum.zclType.bitmap + Number(type.bitmapSize) * 8,
          []
        )
      )
    }
    let baseType = baseByName.get(type.name.toLowerCase())
    if (baseType) {
      queueUsedDataType(
        queue,
        usedIds,
        resolveUsedDataType(byLowerName, baseType, [])
      )
    }
  }

  for (const type of types) delete type.clusterIds
  return Array.from(usedIds).map((id) => byId.get(id))
}

exports.selectDataTypeById = selectDataTypeById
exports.selectDataTypeByName = dbCache.cacheQuery(selectDataTypeByName)
exports.selectAllDataTypes = selectAllDataTypes
exports.selectSizeFromType = selectSizeFromType
exports.selectDataTypeByNameAndClusterId = dbCache.cacheQuery(
  selectDataTypeByNameAndClusterId
)
exports.selectUsedDataTypes = dbCache.cacheQuery(selectUsedDataTypes)
