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

const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * @module JS API: generator logic
 */

/**
 * Helpful function that collects the individual blocks by using elements of an array as a context,
 * executing promises for each, and collecting them into the outgoing string.
 *
 * @param {*} resultArray
 * @param {*} fn
 * @param {*} context The context from within this was called.
 * @returns Promise that resolves with a content string.
 */
function collectBlocks(resultArray, fn, context) {
  var promises = []
  resultArray.forEach((element) => {
    var newContext = {
      global: context.global,
      parent: context,
      ...element,
    }
    var block = fn(newContext)
    promises.push(block)
  })
  return Promise.all(promises).then((blocks) => {
    var ret = ''
    blocks.forEach((b) => {
      ret = ret.concat(b)
    })
    return ret
  })
}

/**
 * Returns the promise that resolves with the ZCL properties package id.
 *
 * @param {*} context
 * @returns promise that resolves with the package id.
 */
function ensurePackageId(context) {
  if ('packageId' in context.global) {
    return Promise.resolve(context.global.packageId)
  } else {
    return queryPackage
      .getSessionPackagesByType(
        context.global.db,
        context.global.sessionId,
        dbEnum.packageType.zclProperties
      )
      .then((pkgs) => {
        if (pkgs.length == 0) {
          return null
        } else {
          context.global.packageId = pkgs[0].id
          return pkgs[0].id
        }
      })
  }
}

exports.collectBlocks = collectBlocks
exports.ensurePackageId = ensurePackageId
