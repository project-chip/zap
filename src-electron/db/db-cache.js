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
 * This module provides cache for commonly used static database queries.
 *
 * @module DB API: zcl database access
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')
const NodeCache = require('node-cache')
const cache = new NodeCache({ useClones: false })
let cacheEnabled = true

/**
 * Clears the entire cache.
 */
function clear() {
  cache.flushAll()
}

/**
 * Puts a data object into the cache under a given key/packageId
 * @param {*} key
 * @param {*} packageId
 * @param {*} data
 * @returns Returns true on success.
 */
function put(key, packageId, data) {
  return cache.set(JSON.stringify([key, packageId]), data)
}

/**
 * Returns a data object under a given key/packageId.
 *
 * @param {*} key
 * @param {*} packageId
 * @returns cached object or undefined if none is present or expired.
 */
function get(key, packageId) {
  return cache.get(JSON.stringify([key, packageId]))
}

/**
 * Returns true if a given key/packageId cache exists.
 *
 * @param {*} key
 * @param {*} packageId
 * @returns true or false, depending on whether the cache is present.
 */
function isCached(key, packageId) {
  return cache.has(JSON.stringify([key, packageId]))
}

/**
 * Cache input / output of provided queryFunction
 * The queryFunction is assumed to have the following signature:
 *
 *   async function queryFunction(db, ...) {...}
 *
 * The DB handle is ignored and the remaining arguments are used as the cache key.
 *
 * @param {*} key
 * @param {*} packageId
 * @returns true or false, depending on whether the cache is present.
 */
function cacheQuery(queryFunction) {
  return function () {
    if (arguments.length && cacheEnabled) {
      // assume queryFunction's first argument is always the DB connection handler
      let key = JSON.stringify([
        queryFunction.name,
        Array.prototype.slice.call(arguments, 1)
      ])

      // check cache
      let value = cache.get(key)
      if (value == undefined) {
        value = queryFunction.apply(this, arguments)
        cache.set(key, value)
      }
      return value
    } else {
      return queryFunction.apply(this, arguments)
    }
  }
}

/**
 * Returns the cache statistics.
 *
 */
function cacheStats() {
  return cache.getStats()
}

/**
 * Enable the Database Query cache
 */
function enable() {
  cacheEnabled = true
}

/**
 * Disable the database cache
 */
function disable() {
  cacheEnabled = false
}

exports.clear = clear
exports.put = put
exports.get = get
exports.isCached = isCached
exports.cacheQuery = cacheQuery
exports.cacheStats = cacheStats
exports.enable = enable
exports.disable = disable
