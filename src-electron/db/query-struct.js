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
 * This module provides queries for enums.
 *
 * @module DB API: zcl database access
 */
const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')
const dbCache = require('./db-cache')

const cacheKey = 'struct'

async function createCache(db, packageId) {
  let packageSpecificCache = {
    byName: {},
    byId: {},
  }
  let d = await selectAllStructs(db, packageId)
  packageSpecificCache.rawData = d
  for (const s of d) {
    packageSpecificCache.byName[s.name] = s
    packageSpecificCache.byId[s.id] = s
  }
  dbCache.put(cacheKey, packageId, packageSpecificCache)
  return packageSpecificCache
}

async function selectAllStructs(db, packageId) {
  let rows = await dbApi.dbAll(
    db,
    'SELECT STRUCT_ID, NAME FROM STRUCT WHERE PACKAGE_REF = ? ORDER BY NAME',
    [packageId]
  )
  return rows.map(dbMapping.map.struct)
}

async function selectAllStructsFromCache(db, packageId) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.rawData
}

async function selectStructById(db, id) {
  return dbApi
    .dbGet(db, 'SELECT STRUCT_ID, NAME FROM STRUCT WHERE STRUCT_ID = ?', [id])
    .then(dbMapping.map.struct)
}

async function selectStructByIdFromCache(db, id) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byId[id]
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

async function selectStructByNameFromCache(db, name, packageId) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byName[name]
}

exports.selectStructById = selectStructById
exports.selectAllStructs = dbCache.cacheEnabled
  ? selectAllStructsFromCache
  : selectAllStructs
exports.selectStructByName = dbCache.cacheEnabled
  ? selectStructByNameFromCache
  : selectStructByName
