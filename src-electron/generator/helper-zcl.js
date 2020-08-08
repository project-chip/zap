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
const templateUtil = require('./template-util.js')

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
 * Block helper iterating over all enums.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_enums(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllEnums(this.global.db, packageId))
    .then((ens) => templateUtil.collectBlocks(ens, options.fn, this))
}

/**
 * Iterates over enum items. Valid only inside zcl_enums.
 * @param {*} options
 */
function zcl_enum_items(options) {
  return queryZcl
    .selectAllEnumItemsById(this.global.db, this.id)
    .then((items) => templateUtil.collectBlocks(items, options.fn, this))
}

/**
 * Block helper iterating over all structs.
 *function macroList(options)

 * @param {*} options
 * @returns Promise of content.
 */
function zcl_structs(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllStructs(this.global.db, packageId))
    .then((st) => templateUtil.collectBlocks(st, options.fn, this))
}

/**
 * Block helper iterating over all struct items. Valid only inside zcl_structs.

 * @param {*} options
 * @returns Promise of content.
 */
function zcl_struct_items(options) {
  return queryZcl
    .selectAllStructItemsById(this.global.db, this.id)
    .then((st) => templateUtil.collectBlocks(st, options.fn, this))
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
    .then((cl) => templateUtil.collectBlocks(cl, options.fn, this))
}

/**
 * Block helper iterating over all commands.
 * There are two modes of this helper:
 *   when used in a global context, it iterates over ALL commands in the database.
 *   when used inside a `zcl_cluster` block helper, it iterates only over the commands for that cluster.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_commands(options) {
  return ensurePackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryZcl.selectCommandsByClusterId(
          this.global.db,
          this.id,
          packageId
        )
      } else {
        return queryZcl.selectAllCommands(this.global.db, packageId)
      }
    })
    .then((cmds) => templateUtil.collectBlocks(cmds, options.fn, this))
}

function zcl_attributes(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  return ensurePackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryZcl.selectAttributesByClusterId(
          this.global.db,
          this.id,
          packageId
        )
      } else {
        return queryZcl.selectAllAttributes(this.global.db, packageId)
      }
    })
    .then((atts) => templateUtil.collectBlocks(atts, options.fn, this))
}

function zcl_attributes_client(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  return ensurePackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        return queryZcl.selectAttributesByClusterIdAndSide(
          this.global.db,
          this.id,
          packageId,
          dbEnum.side.client
        )
      } else {
        return queryZcl.selectAllAttributesBySide(
          this.global.db,
          dbEnum.side.client,
          packageId
        )
      }
    })
    .then((atts) => templateUtil.collectBlocks(atts, options.fn, this))
}

function zcl_attributes_server(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  return ensurePackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryZcl.selectAttributesByClusterIdAndSide(
          this.global.db,
          this.id,
          packageId,
          dbEnum.side.server
        )
      } else {
        return queryZcl.selectAllAttributesBySide(
          this.global.db,
          dbEnum.side.server,
          packageId
        )
      }
    })
    .then((atts) => templateUtil.collectBlocks(atts, options.fn, this))
}

/**
 * Block helper iterating over all atomic types.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_atomics(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllAtomics(this.global.db, packageId))
    .then((ats) => templateUtil.collectBlocks(ats, options.fn, this))
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.zcl_enums = zcl_enums
exports.zcl_enum_items = zcl_enum_items
exports.zcl_structs = zcl_structs
exports.zcl_struct_items = zcl_struct_items
exports.zcl_clusters = zcl_clusters
exports.zcl_commands = zcl_commands
exports.zcl_attributes = zcl_attributes
exports.zcl_attributes_client = zcl_attributes_client
exports.zcl_attributes_server = zcl_attributes_server
exports.zcl_atomics = zcl_atomics
