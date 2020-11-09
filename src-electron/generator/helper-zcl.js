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
const helperC = require('./helper-c.js')
const env = require('../util/env.js')

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
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllBitmaps(this.global.db, packageId))
    .then((ens) => templateUtil.collectBlocks(ens, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Iterates over enum items. Valid only inside zcl_enums.
 * @param {*} options
 */
function zcl_bitmap_items(options) {
  var promise = queryZcl
    .selectAllBitmapFieldsById(this.global.db, this.id)
    .then((items) => templateUtil.collectBlocks(items, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over all enums.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_enums(options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllEnums(this.global.db, packageId))
    .then((ens) => templateUtil.collectBlocks(ens, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Iterates over enum items. Valid only inside zcl_enums.
 * @param {*} options
 */
function zcl_enum_items(options) {
  var promise = queryZcl
    .selectAllEnumItemsById(this.global.db, this.id)
    .then((items) => templateUtil.collectBlocks(items, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over all structs.
 *function macroList(options)

 * @param {*} options
 * @returns Promise of content.
 */
function zcl_structs(options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllStructs(this.global.db, packageId))
    .then((st) => templateUtil.collectBlocks(st, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over all struct items. Valid only inside zcl_structs.

 * @param {*} options
 * @returns Promise of content.
 */
function zcl_struct_items(options) {
  var promise = queryZcl
    .selectAllStructItemsById(this.global.db, this.id)
    .then((st) => templateUtil.collectBlocks(st, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over all clusters.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_clusters(options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllClusters(this.global.db, packageId))
    .then((cl) => templateUtil.collectBlocks(cl, options, this))
  return templateUtil.templatePromise(this.global, promise)
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
  var promise = templateUtil
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
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over all commands, including their arguments and clusters.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_command_tree(options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      return queryZcl.selectCommandTree(this.global.db, packageId)
    })
    .then((cmds) => {
      // Now reduce the array by collecting together arguments.
      var reducedCommands = []
      cmds.forEach((el) => {
        var newCommand
        var lastCommand
        if (reducedCommands.length == 0) {
          newCommand = true
        } else {
          lastCommand = reducedCommands[reducedCommands.length - 1]
          if (
            el.code == lastCommand.code &&
            el.clusterCode == lastCommand.clusterCode
          ) {
            newCommand = false
          } else {
            newCommand = true
          }
        }

        var arg = {
          name: el.argName,
          type: el.argType,
          isArray: el.argIsArray,
        }
        if (newCommand) {
          el.commandArgs = []
          el.commandArgs.push(arg)
          var n = ''
          if (el.clusterCode == null) {
            n = n.concat('Global')
          }
          if (el.source == dbEnum.source.client) {
            n = n.concat('ClientToServer')
          } else {
            n = n.concat('ServerToClient')
          }
          if (el.clusterName != null) {
            n = n.concat(el.clusterName)
          }
          n = n.concat(el.name)
          el.clientMacroName = n
          el.isGlobal = el.clusterCode == null
          reducedCommands.push(el)
        } else {
          lastCommand.commandArgs.push(arg)
        }
      })
      return reducedCommands
    })
    .then((cmds) => templateUtil.collectBlocks(cmds, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Helper to iterate over all global commands.
 *
 * @param {*} options
 * @returns Promise of global command iteration.
 */
function zcl_global_commands(options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryZcl.selectAllGlobalCommands(this.global.db, packageId)
    )
    .then((cmds) => templateUtil.collectBlocks(cmds, options, this))
  return templateUtil.templatePromise(this.global, promise)
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
  var promise = templateUtil
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
  return templateUtil.templatePromise(this.global, promise)
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
  var promise = templateUtil
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
  return templateUtil.templatePromise(this.global, promise)
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
  var promise = templateUtil
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
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over all atomic types.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_atomics(options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllAtomics(this.global.db, packageId))
    .then((ats) => templateUtil.collectBlocks(ats, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 *
 *
 * Given: N/A
 * @returns the length of largest cluster name in a list of clusters
 */
function zcl_cluster_largest_label_length() {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectAllClusters(this.global.db, packageId))
    .then((cl) => largestLabelLength(cl))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 *
 *
 * @param {*} An Array
 * @returns the length of largest object name in an array. Helper for
 * zcl_cluster_largest_label_length
 */
function largestLabelLength(arrayOfClusters) {
  return Math.max(...arrayOfClusters.map((cl) => cl.label.length))
}

/**
 * Helper to extract the number of command arguments in a command
 *
 * @param {*} commandId
 * @returns Number of command arguments as an integer
 */
function zcl_command_arguments_count(commandId) {
  var promise = templateUtil.ensureZclPackageId(this).then((packageId) => {
    var res = queryZcl.selectCommandArgumentsCountByCommandId(
      this.global.db,
      commandId,
      packageId
    )
    return res
  })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over command arguments within a command
 * or a command tree.
 *
 * @param {*} options
 * @returns Promise of command argument iteration.
 */
function zcl_command_arguments(options) {
  var commandArgs = this.commandArgs
  var p

  // When we are coming from commant_tree, then
  // the commandArgs are already present and there is no need
  // to do additional queries.
  if (commandArgs == null) {
    p = templateUtil.ensureZclPackageId(this).then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryZcl.selectCommandArgumentsByCommandId(
          this.global.db,
          this.id,
          packageId
        )
      } else {
        return queryZcl.selectAllCommandArguments(this.global.db, packageId)
      }
    })
  } else {
    p = Promise.resolve(commandArgs)
  }

  var promise = p.then((args) =>
    templateUtil.collectBlocks(args, options, this)
  )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Helper that deals with the type of the argument.
 *
 * @param {*} typeName
 * @param {*} options
 */
function zcl_command_argument_data_type(type, options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      Promise.all([
        isEnum(this.global.db, type, packageId),
        isStruct(this.global.db, type, packageId),
        isBitmap(this.global.db, type, packageId),
      ])
        .then(
          (res) =>
            new Promise((resolve, reject) => {
              for (var i = 0; i < res.length; i++) {
                if (res[i] != 'unknown') {
                  resolve(res[i])
                  return
                }
              }
              resolve(dbEnum.zclType.unknown)
            })
        )
        .then((resType) => {
          switch (resType) {
            case dbEnum.zclType.bitmap:
              return helperC.dataTypeForBitmap(this.global.db, type, packageId)
            case dbEnum.zclType.enum:
              return helperC.dataTypeForEnum(this.global.db, type, packageId)
            case dbEnum.zclType.struct:
              return options.hash.struct
            case dbEnum.zclType.atomic:
            case dbEnum.zclType.unknown:
            default:
              return helperC.asCliType(type)
          }
        })
        .catch((err) => {
          env.logError(err)
          throw err
        })
    )
    .catch((err) => {
      env.logError(err)
      throw err
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Local function that checks if an enum by the name exists
 *
 * @param {*} db
 * @param {*} enum_name
 * @param {*} packageId
 * @returns Promise of content.
 */
function isEnum(db, enum_name, packageId) {
  return queryZcl
    .selectEnumByName(db, enum_name, packageId)
    .then((enums) => (enums ? dbEnum.zclType.enum : dbEnum.zclType.unknown))
}

/**
 * Local function that checks if an enum by the name exists
 *
 * @param {*} db
 * @param {*} struct_name
 * @param {*} packageId
 * @returns Promise of content.
 */
function isStruct(db, struct_name, packageId) {
  return queryZcl
    .selectStructByName(db, struct_name, packageId)
    .then((st) => (st ? dbEnum.zclType.struct : dbEnum.zclType.unknown))
}

/**
 * Local function that checks if a bitmap by the name exists
 *
 * @param {*} db
 * @param {*} bitmap_name
 * @param {*} packageId
 * @returns Promise of content.
 */
function isBitmap(db, bitmap_name, packageId) {
  return queryZcl
    .selectBitmapByName(db, packageId, bitmap_name)
    .then((st) => (st ? dbEnum.zclType.bitmap : dbEnum.zclType.unknown))
}

/**
 * Checks if the side is client or not
 *
 * @param {*} side
 * @returns boolean
 */
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
exports.zcl_command_tree = zcl_command_tree
exports.zcl_attributes = zcl_attributes
exports.zcl_attributes_client = zcl_attributes_client
exports.zcl_attributes_server = zcl_attributes_server
exports.zcl_atomics = zcl_atomics
exports.zcl_global_commands = zcl_global_commands
exports.zcl_cluster_largest_label_length = zcl_cluster_largest_label_length
exports.zcl_command_arguments_count = zcl_command_arguments_count
exports.zcl_command_arguments = zcl_command_arguments
exports.zcl_command_argument_data_type = zcl_command_argument_data_type
exports.isClient = isClient
