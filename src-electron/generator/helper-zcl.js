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

const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../db/db-enum.js')

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
 * Block helper iterating over all enums.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_enums(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllEnums(this.global.db, packageId))
    .then((ens) => collectBlocks(ens, options.fn, this))
}

/**
 * Block helper iterating over all structs.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_structs(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllStructs(this.global.db, packageId))
    .then((st) => collectBlocks(st, options.fn, this))
}

/**
 * Block helper iterating over all clusters.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_clusters(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllClusters(this.global.db, packageId))
    .then((cl) => collectBlocks(cl, options.fn, this))
}

/**
 * Block helper iterating over all commands.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_commands(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllCommands(this.global.db, packageId))
    .then((cmds) => collectBlocks(cmds, options.fn, this))
}

/**
 * Block helper iterating over all attributes.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_attributes(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  return ensurePackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for attributes inside this cluster.
        return queryZcl.selectAttributesByClusterId(
          this.global.db,
          this.id,
          packageId
        )
      } else {
        return queryZcl.selectAllAttributes(this.global.db, packageId)
      }
    })
    .then((atts) => collectBlocks(atts, options.fn, this))
}

exports.zcl_enums = zcl_enums
exports.zcl_structs = zcl_structs
exports.zcl_clusters = zcl_clusters
exports.zcl_commands = zcl_commands
exports.zcl_attributes = zcl_attributes
