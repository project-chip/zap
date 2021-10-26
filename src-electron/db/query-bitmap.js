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

const cacheKey = 'bitmap'

async function createCache(db, packageId) {
  let packageSpecificCache = {
    byName: {},
    byId: {},
  }
  let d = await selectAllBitmaps(db, packageId)
  packageSpecificCache.rawData = d
  for (const b of d) {
    packageSpecificCache.byName[b.name] = b
    packageSpecificCache.byId[b.id] = b
  }
  dbCache.put(cacheKey, packageId, packageSpecificCache)
  return packageSpecificCache
}

/**
 * Retrieves all the bitmaps in the database.
 *
 * @export
 * @param {*} db
 * @returns Promise that resolves with the rows of bitmaps.
 */
async function selectAllBitmaps(db, packageId) {
  let rows = await dbApi.dbAll(
    db,
    `
SELECT
  BITMAP_ID,
  NAME,
  TYPE
FROM BITMAP
WHERE PACKAGE_REF = ? ORDER BY NAME`,
    [packageId]
  )
  return rows.map(dbMapping.map.bitmap)
}

async function selectAllBitmapsFromCache(db, packageId) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.rawData
}

async function selectBitmapByName(db, packageId, name) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  BITMAP_ID,
  NAME,
  TYPE
FROM BITMAP
WHERE NAME = ? AND PACKAGE_REF = ?`,
      [name, packageId]
    )
    .then(dbMapping.map.bitmap)
}

async function selectBitmapByNameFromCache(db, name, packageId) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byName[name]
}

async function selectBitmapById(db, id) {
  return dbApi
    .dbGet(
      db,
      `
SELECT
  BITMAP_ID,
  NAME,
  TYPE
FROM BITMAP
WHERE BITMAP_ID = ?`,
      [id]
    )
    .then(dbMapping.map.bitmap)
}

async function selectBitmapByIdFromCache(db, id) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byId[id]
}

exports.selectBitmapById = selectBitmapById
exports.selectAllBitmaps = selectAllBitmaps
exports.selectBitmapByName = selectBitmapByName
