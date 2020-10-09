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
const dbEnum = require('../../src-shared/db-enum.js')
const templateUtil = require('./template-util.js')

/**
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: static zcl helpers
 */

/**
 * Block helper iterating over all bitmaps.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_bitmaps(options) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllBitmaps(this.global.db, packageId))
    .then((ens) => templateUtil.collectBlocks(ens, options, this))
}

/**
 * Iterates over enum items. Valid only inside zcl_enums.
 * @param {*} options
 */
function zcl_bitmap_items(options) {
  return queryZcl
    .selectAllBitmapFieldsById(this.global.db, this.id)
    .then((items) => templateUtil.collectBlocks(items, options, this))
}

/**
 * Block helper iterating over all enums.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_enums(options) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllEnums(this.global.db, packageId))
    .then((ens) => templateUtil.collectBlocks(ens, options, this))
}

/**
 * Iterates over enum items. Valid only inside zcl_enums.
 * @param {*} options
 */
function zcl_enum_items(options) {
  return queryZcl
    .selectAllEnumItemsById(this.global.db, this.id)
    .then((items) => templateUtil.collectBlocks(items, options, this))
}

/**
 * Block helper iterating over all structs.
 *function macroList(options)

 * @param {*} options
 * @returns Promise of content.
 */
function zcl_structs(options) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllStructs(this.global.db, packageId))
    .then((st) => templateUtil.collectBlocks(st, options, this))
}

/**
 * Block helper iterating over all struct items. Valid only inside zcl_structs.

 * @param {*} options
 * @returns Promise of content.
 */
function zcl_struct_items(options) {
  return queryZcl
    .selectAllStructItemsById(this.global.db, this.id)
    .then((st) => templateUtil.collectBlocks(st, options, this))
}

/**
 * Block helper iterating over all clusters.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_clusters(options) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllClusters(this.global.db, packageId))
    .then((cl) => templateUtil.collectBlocks(cl, options, this))
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
  return templateUtil
    .ensureZclPackageId(this)
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
    .then((cmds) => templateUtil.collectBlocks(cmds, options, this))
}

/**
 * Helper to iterate over all global commands.
 *
 * @param {*} options
 * @returns Promise of global command iteration.
 */
function zcl_global_commands(options) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryZcl.selectAllGlobalCommands(this.global.db, packageId)
    )
    .then((cmds) => templateUtil.collectBlocks(cmds, options, this))
}

/**
 * Iterator over the attributes. If it is used at toplevel, if iterates over all the attributes
 * in the database. If used within zcl_cluster context, it iterates over all the attributes
 * that belong to that cluster.
 *
 * @param {*} options
 * @returns Promise of attribute iteration.
 */
function zcl_attributes(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  return templateUtil
    .ensureZclPackageId(this)
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
    .then((atts) => templateUtil.collectBlocks(atts, options, this))
}

/**
 * Iterator over the client attributes. If it is used at toplevel, if iterates over all the client attributes
 * in the database. If used within zcl_cluster context, it iterates over all the client attributes
 * that belong to that cluster.
 *
 * @param {*} options
 * @returns Promise of attribute iteration.
 */
function zcl_attributes_client(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  return templateUtil
    .ensureZclPackageId(this)
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
    .then((atts) => templateUtil.collectBlocks(atts, options, this))
}

/**
 * Iterator over the server attributes. If it is used at toplevel, if iterates over all the server attributes
 * in the database. If used within zcl_cluster context, it iterates over all the server attributes
 * that belong to that cluster.
 *
 * @param {*} options
 * @returns Promise of attribute iteration.
 */
function zcl_attributes_server(options) {
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  return templateUtil
    .ensureZclPackageId(this)
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
    .then((atts) => templateUtil.collectBlocks(atts, options, this))
}

/**
 * Block helper iterating over all atomic types.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_atomics(options) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllAtomics(this.global.db, packageId))
    .then((ats) => templateUtil.collectBlocks(ats, options, this))
}

/**
 *
 *
 * Given: N/A
 * @returns the length of largest cluster name in a list of clusters
 */
function zcl_cluster_largest_label_length() {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllClusters(this.global.db, packageId))
    .then((cl) => largestLabelLength(cl))
}

/**
 *
 *
 * @param {*} An Array
 * @returns the length of largest object name in an array. Helper for
 * zcl_cluster_largest_label_length
 */
function largestLabelLength(arr) {
  var lengthOfLargestString = 0,
    i = 0,
    stringLength = 0
  for (i = 0; i < arr.length; i++) {
    stringLength = arr[i].label.length
    if (stringLength > lengthOfLargestString) {
      lengthOfLargestString = stringLength
    }
  }
  return lengthOfLargestString
}

/**
 * Helper to extract the number of command arguments in a command
 *
 * @param {*} commandId
 * @returns Number of command arguments as an integer
 */
function zcl_command_arguments_count(commandId) {
  return templateUtil.ensureZclPackageId(this).then((packageId) => {
    var res = queryZcl.selectCommandArgumentsCountByCommandId(
      this.global.db,
      commandId,
      packageId
    )
    return res
  })
}

/**
 * Block helper iterating over command arguments within a command
 *
 * @param {*} options
 * @returns Promise of command argument iteration.
 */
function zcl_command_arguments(options) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryZcl.selectCommandArgumentsByCommandId(
          this.global.db,
          this.id,
          packageId
        )
      } else {
        return queryZcl.selectAllCommandArguments(this.global.db)
      }
    })
    .then((cmds) => templateUtil.collectBlocks(cmds, options, this))
}

/**
 * Helper that checks if an enum by this name exists
 *
 * @param {*} options
 * @returns Promise of content.
 */
function isEnum(enum_name) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryZcl.selectEnumByName(this.global.db, enum_name, packageId)
    )
    .then((enums) => (enums ? 1 : 0))
}

/**
 * Helper that checks if an enum by this name exists
 *
 * @param {*} options
 * @returns Promise of content.
 */
function isStruct(struct_name) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryZcl.selectStructByName(this.global.db, struct_name, packageId)
    )
    .then((st) => (st ? 1 : 0))
}

function isBitmap(bitmap_name) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryZcl.selectBitmapByName(this.global.db, packageId, bitmap_name)
    )
    .then((st) => (st ? 1 : 0))
}

function isClient(side) {
  return 0 == side.localeCompare('client')
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.zcl_bitmaps = zcl_bitmaps
exports.zcl_bitmap_items = zcl_bitmap_items
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
exports.zcl_global_commands = zcl_global_commands
exports.zcl_cluster_largest_label_length = zcl_cluster_largest_label_length
exports.zcl_command_arguments_count = zcl_command_arguments_count
exports.zcl_command_arguments = zcl_command_arguments
exports.isEnum = isEnum
exports.isStruct = isStruct
exports.isBitmap = isBitmap
exports.isClient = isClient
