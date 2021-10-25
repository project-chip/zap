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
 * This module provides queries for atomic type queries.
 *
 * @module DB API: zcl database access
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
const dbCache = require('./db-cache')

const ATOMIC_QUERY = `
SELECT
  ATOMIC_ID,
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

const cacheKey = 'atomic'

// Raw query versions without caching.

async function selectAllAtomics(db, packageId) {
  let rows = await dbApi.dbAll(
    db,
    `${ATOMIC_QUERY} WHERE PACKAGE_REF = ? ORDER BY ATOMIC_IDENTIFIER`,
    [packageId]
  )
  return rows.map(dbMapping.map.atomic)
}

async function selectAtomicSizeFromType(db, packageId, type) {
  let row = await dbApi.dbGet(
    db,
    'SELECT ATOMIC_SIZE FROM ATOMIC WHERE PACKAGE_REF = ? AND NAME = ?',
    // The types in the ATOMIC table are always lowercase.
    [packageId, type.toLowerCase()]
  )
  if (row == null) {
    return null
  } else {
    return row.ATOMIC_SIZE
  }
}

/**
 * Locates atomic type based on a type name. Query is not case sensitive.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} typeName
 */
async function selectAtomicType(db, packageId, name) {
  return dbApi
    .dbGet(db, `${ATOMIC_QUERY} WHERE PACKAGE_REF = ? AND UPPER(NAME) = ?`, [
      packageId,
      name == null ? name : name.toUpperCase(),
    ])
    .then(dbMapping.map.atomic)
}

/**
 * Retrieves atomic type by a given Id.
 * @param {*} db
 * @param {*} packageId
 */
async function selectAtomicById(db, id) {
  return dbApi
    .dbGet(db, `${ATOMIC_QUERY} WHERE ATOMIC_ID = ?`, [id])
    .then((rows) => rows.map(dbMapping.map.atomic))
}

/**
 * Function that populates cache.
 *
 * @param {*} db
 * @param {*} packageId
 * @returns Newly created cache object, after it's put into the cache.
 */
async function createCache(db, packageId) {
  let packageSpecificCache = {
    byName: {},
    byId: {},
  }
  let d = await selectAllAtomics(db, packageId)
  packageSpecificCache.rawData = d
  for (const at of d) {
    packageSpecificCache.byName[at.name.toUpperCase()] = at
    packageSpecificCache.byId[at.id] = at
  }
  dbCache.put(cacheKey, packageId, packageSpecificCache)
  return packageSpecificCache
}

/**
 * Locates atomic type based on a type name. Query is not case sensitive.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} typeName
 */
async function selectAtomicTypeFromCache(db, packageId, name) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byName[name.toUpperCase()]
}

/**
 * Retrieves all atomic types under a given package Id.
 * @param {*} db
 * @param {*} packageId
 */
async function selectAllAtomicsFromCache(db, packageId) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.rawData
}

/**
 * Retrieves atomic type by a given Id.
 * @param {*} db
 * @param {*} packageId
 */
async function selectAtomicByIdFromCache(db, id) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byId[id]
}

/**
 * Retrieves the size from atomic type.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 */
async function selectAtomicSizeFromTypeFromCache(db, packageId, type) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  let at = cache.byName[type.toUpperCase()]
  if (at == null) {
    return null
  } else {
    return at.size
  }
}

exports.selectAllAtomics = dbCache.cacheEnabled
  ? selectAllAtomicsFromCache
  : selectAllAtomics
exports.selectAtomicSizeFromType = dbCache.cacheEnabled
  ? selectAtomicSizeFromTypeFromCache
  : selectAtomicSizeFromType
exports.selectAtomicType = dbCache.cacheEnabled
  ? selectAtomicTypeFromCache
  : selectAtomicType
exports.selectAtomicById = dbCache.cacheEnabled
  ? selectAtomicByIdFromCache
  : selectAtomicById
