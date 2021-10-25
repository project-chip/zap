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

// This module supports caching, because > 20% of all generation time is
// spent in looking up these atomic types.
const supportCaching = true
const cache = {}

// Raw query versions without caching.

async function selectAllAtomicsNoCache(db, packageId) {
  let rows = await dbApi.dbAll(
    db,
    `${ATOMIC_QUERY} WHERE PACKAGE_REF = ? ORDER BY ATOMIC_IDENTIFIER`,
    [packageId]
  )
  return rows.map(dbMapping.map.atomic)
}

async function selectAtomicSizeFromTypeNoCache(db, packageId, type) {
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
async function selectAtomicTypeNoCache(db, packageId, name) {
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
async function selectAtomicByIdNoCache(db, id) {
  return dbApi
    .dbGet(db, `${ATOMIC_QUERY} WHERE ATOMIC_ID = ?`, [id])
    .then((rows) => rows.map(dbMapping.map.atomic))
}

async function createCache(db, packageId) {
  let packageSpecificCache = {
    byName: {},
    byId: {},
  }
  let d = await selectAllAtomicsNoCache(db, packageId)
  packageSpecificCache.rawData = d
  for (const at of d) {
    packageSpecificCache.byName[at.name.toUpperCase()] = at
    packageSpecificCache.byId[at.id] = at
  }
  return packageSpecificCache
}

/**
 * Locates atomic type based on a type name. Query is not case sensitive.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} typeName
 */
async function selectAtomicType(db, packageId, name) {
  if (supportCaching) {
    if (cache[packageId] == null) {
      cache[packageId] = await createCache(db, packageId)
    }
    return cache[packageId].byName[name.toUpperCase()]
  } else {
    return selectAtomicTypeNoCache(db, packageId, name)
  }
}

/**
 * Retrieves all atomic types under a given package Id.
 * @param {*} db
 * @param {*} packageId
 */
async function selectAllAtomics(db, packageId) {
  if (supportCaching) {
    if (cache[packageId] == null) {
      cache[packageId] = await createCache(db, packageId)
    }
    let ret = cache[packageId].rawData
    return ret
  } else {
    return selectAllAtomicsNoCache(db, packageId)
  }
}

/**
 * Retrieves atomic type by a given Id.
 * @param {*} db
 * @param {*} packageId
 */
async function selectAtomicById(db, id) {
  if (supportCaching) {
    if (cache[packageId] == null) {
      cache[packageId] = await createCache(db, packageId)
    }
    return cache[packageId].byId[id]
  } else {
    return selectAtomicByIdNoCache(db, id)
  }
}

/**
 * Retrieves the size from atomic type.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 */
async function selectAtomicSizeFromType(db, packageId, type) {
  if (supportCaching) {
    if (cache[packageId] == null) {
      cache[packageId] = await createCache(db, packageId)
    }
    let at = cache[packageId].byName[type.toUpperCase()]
    if (at == null) {
      return null
    } else {
      return at.size
    }
  } else {
    return selectAtomicSizeFromTypeNoCache(db, packageId, type)
  }
}

exports.selectAllAtomics = supportCaching
  ? selectAllAtomics
  : selectAllAtomicsNoCache
exports.selectAtomicSizeFromType = supportCaching
  ? selectAtomicSizeFromType
  : selectAtomicSizeFromTypeNoCache
exports.selectAtomicType = supportCaching
  ? selectAtomicType
  : selectAtomicTypeNoCache
exports.selectAtomicById = supportCaching
  ? selectAtomicById
  : selectAtomicByIdNoCache
