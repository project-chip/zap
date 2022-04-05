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
 * This module provides queries for numbers
 */

const dbApi = require('./db-api')
const dbMapping = require('./db-mapping')
const dbCache = require('./db-cache')

const cacheKey = 'number'

/**
 * Select an number matched by name.
 *
 * @param db
 * @param name
 * @param packageId
 * @returns number or undefined
 */
async function selectNumberByName(db, packageId, name) {
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    NUMBER.NUMBER_ID,
    NUMBER.IS_SIGNED,
    DATA_TYPE.NAME AS NAME,
    NUMBER.SIZE AS SIZE
  FROM NUMBER
  INNER JOIN DATA_TYPE ON NUMBER.NUMBER_ID = DATA_TYPE.DATA_TYPE_ID
  WHERE NAME = ? AND PACKAGE_REF = ?`,
      [name, packageId]
    )
    .then(dbMapping.map.number)
}

/**
 * Select all numbers.
 *
 * @param db
 * @param packageId
 * @returns All numbers
 */
async function selectAllNumbers(db, packageId) {
  return dbApi
    .dbGet(
      db,
      `
  SELECT
    NUMBER.NUMBER_ID,
    NUMBER.IS_SIGNED,
    DATA_TYPE.NAME AS NAME,
    NUMBER.SIZE AS SIZE
  FROM NUMBER
  INNER JOIN DATA_TYPE ON NUMBER.NUMBER_ID = DATA_TYPE.DATA_TYPE_ID
  WHERE PACKAGE_REF = ?`,
      [packageId]
    )
    .then(dbMapping.map.number)
}

/**
 * Select an enum matched by name from cache.
 *
 * @param {*} db
 * @param {*} name
 * @param {*} packageId
 * @returns enum or undefined
 */
async function selectNumberByNameFromCache(db, packageId, name) {
  let cache
  if (dbCache.isCached(cacheKey, packageId)) {
    cache = dbCache.get(cacheKey, packageId)
  } else {
    cache = await createCache(db, packageId)
  }
  return cache.byName[name]
}

exports.selectNumberByName = selectNumberByName
exports.selectAllNumbers = selectAllNumbers
