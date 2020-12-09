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
const types = require('../util/types.js')
const queryPackage = require('../db/query-package.js')

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
 * Block helper iterating over all deviceTypes.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_device_types(options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryZcl.selectAllDeviceTypes(this.global.db, packageId)
    )
    .then((cl) => templateUtil.collectBlocks(cl, options, this))
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

        var arg
        if (el.argName == null) {
          arg = null
        } else {
          arg = {
            name: el.argName,
            type: el.argType,
            isArray: el.argIsArray,
            hasLength: el.argIsArray,
            nameLength: el.argName.concat('Len'),
          }
          if (el.argIsArray) {
            arg.formatChar = 'b'
          } else if (types.isOneBytePrefixedString(el.argType)) {
            arg.formatChar = 's'
          } else if (types.isTwoBytePrefixedString(el.argType)) {
            arg.formatChar = 'l'
          } else {
            arg.formatChar = 'u'
          }
        }
        if (newCommand) {
          el.commandArgs = []
          if (arg != null) {
            el.commandArgs.push(arg)
            el.argsstring = arg.formatChar
          } else {
            el.argsstring = ''
          }
          var n = ''
          if (el.clusterCode == null) {
            n = n.concat('Global')
          } else {
            n = n.concat(el.clusterName + 'Cluster')
          }
          if (el.source == dbEnum.source.either) {
            // We will need to create two here.
            n = n.concat('ClientToServer')
          }
          n = n.concat(el.name)
          el.clientMacroName = n
          el.isGlobal = el.clusterCode == null
          reducedCommands.push(el)
        } else {
          if (arg != null) {
            lastCommand.commandArgs.push(arg)
            lastCommand.argsstring = lastCommand.argsstring.concat(
              arg.formatChar
            )
          }
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
 *
 * @param {*} commandId
 * @param {*} argument_return
 * @param {*} no_argument_return
 *
 * If the command arguments for a command exist then returns argument_return
 * else returns no_argument_return
 * Example: {{if_command_arguments_exist [command-id] "," ""}}
 * The above will return ',' if the command arguments for a command exist
 * and will return nothing if the command arguments for a command do not exist.
 *
 */
function if_command_arguments_exist(
  commandId,
  argument_return,
  no_argument_return
) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      var res = queryZcl.selectCommandArgumentsCountByCommandId(
        this.global.db,
        commandId,
        packageId
      )
      return res
    })
    .then((res) => {
      if (res > 0) {
        return argument_return
      } else {
        return no_argument_return
      }
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
              return helperC.data_type_for_bitmap(
                this.global.db,
                type,
                packageId
              )
            case dbEnum.zclType.enum:
              return helperC.data_type_for_enum(this.global.db, type, packageId)
            case dbEnum.zclType.struct:
              return options.hash.struct
            case dbEnum.zclType.atomic:
            case dbEnum.zclType.unknown:
            default:
              return helperC.as_cli_type(type)
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
 *
 * @param {*} fromType
 * @param {*} toType
 * @param {*} noWarning
 *
 * Type warning message. If noWarning is set to true then the warning message
 * will not be shown.
 */
function defaultMessageForTypeConversion(fromType, toType, noWarning) {
  if (!noWarning) {
    return `/* TYPE WARNING: ${fromType} defaults to */ ` + toType
  } else {
    return toType
  }
}

/**
 *
 * @param {*} res
 * @param {*} options
 * This function calculates the number of bytes in the data type and based on
 * that returns the option specified in the template.
 * for eg: Give that options is
 * options.hash.array="b"
 * options.hash.one_byte="u"
 * options.hash.two_byte="v"
 * options.hash.three_byte="x"
 * options.hash.four_byte="w"
 * options.hash.short_string="s"
 * options.hash.long_string="l"
 * options.hash.default="b"
 *
 * calculateBytes("char_string", options)
 * will return 's'
 */
function calculateBytes(res, options) {
  var numberPattern = /\d+/g
  let num = res.match(numberPattern)
  switch (num / 8) {
    case 1:
      return options.hash.one_byte
    case 2:
      return options.hash.two_byte
    case 3:
      return options.hash.three_byte
    case 4:
      return options.hash.four_byte
    default:
      if (res.includes('long') && res.includes('string')) {
        return options.hash.long_string
      } else if (!res.includes('long') && res.includes('string')) {
        return options.hash.short_string
      } else {
        return options.hash.default
      }
  }
}

/**
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 * @param {*} options
 * @param {*} overridable
 * @param {*} resType
 * Character associated to a zcl/c data type.
 */
function dataTypeCharacterFormatter(
  db,
  packageId,
  type,
  options,
  overridable,
  resType
) {
  switch (resType) {
    case dbEnum.zclType.array:
      return options.hash.array
    case dbEnum.zclType.bitmap:
      return queryZcl
        .selectBitmapByName(db, packageId, type)
        .then((bitmap) => {
          return queryZcl.selectAtomicType(db, packageId, bitmap.type)
        })
        .then((res) => {
          return overridable.atomicType(res)
        })
        .then((res) => {
          return calculateBytes(res, options)
        })
    case dbEnum.zclType.enum:
      return queryZcl
        .selectEnumByName(db, type, packageId)
        .then((enumRec) => {
          return queryZcl.selectAtomicType(db, packageId, enumRec.type)
        })
        .then((res) => {
          return overridable.atomicType(res)
        })
        .then((res) => {
          return calculateBytes(res, options)
        })
    case dbEnum.zclType.struct:
      return options.hash.struct
    case dbEnum.zclType.atomic:
    case dbEnum.zclType.unknown:
    default:
      return queryZcl
        .selectAtomicType(db, packageId, type)
        .then((atomic) => {
          if (
            atomic &&
            (atomic.name == 'char_string' ||
              atomic.name == 'octet_string' ||
              atomic.name == 'long_octet_string' ||
              atomic.name == 'long_char_string')
          ) {
            return atomic.name
          }
          return overridable.atomicType(atomic)
        })
        .then((res) => {
          return calculateBytes(res, options)
        })
  }
}

/**
 *
 *
 * @param {*} type
 * @param {*} options
 * @param {*} packageId
 * @param {*} db
 * @param {*} resolvedType
 * @param {*} overridable
 * @returns the data type associated with the resolvedType
 */
function dataTypeHelper(
  type,
  options,
  packageId,
  db,
  resolvedType,
  overridable
) {
  switch (resolvedType) {
    case dbEnum.zclType.array:
      if ('array' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type} array`,
          options.hash.array,
          options.hash.no_warning
        )
      } else {
        return queryZcl
          .selectAtomicType(db, packageId, dbEnum.zclType.array)
          .then((atomic) => {
            return overridable.atomicType(atomic)
          })
      }
    case dbEnum.zclType.bitmap:
      if ('bitmap' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type}`,
          options.hash.bitmap,
          options.hash.no_warning
        )
      } else {
        return queryZcl
          .selectBitmapByName(db, packageId, type)
          .then((bitmap) => {
            return queryZcl.selectAtomicType(db, packageId, bitmap.type)
          })
          .then((res) => {
            return overridable.atomicType(res)
          })
      }
    case dbEnum.zclType.enum:
      if ('enum' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type}`,
          options.hash.enum,
          options.hash.no_warning
        )
      } else {
        return queryZcl
          .selectEnumByName(db, type, packageId)
          .then((enumRec) => {
            return queryZcl.selectAtomicType(db, packageId, enumRec.type)
          })
          .then((res) => {
            return overridable.atomicType(res)
          })
      }
    case dbEnum.zclType.struct:
      if ('struct' in options.hash) {
        return defaultMessageForTypeConversion(
          `${type}`,
          options.hash.struct,
          options.hash.no_warning
        )
      } else {
        return type
      }
    case dbEnum.zclType.atomic:
    case dbEnum.zclType.unknown:
    default:
      return queryZcl.selectAtomicType(db, packageId, type).then((atomic) => {
        return overridable.atomicType(atomic)
      })
  }
}

/**
 * Helper that deals with the type of the argument.
 *
 * @param {*} typeName
 * @param {*} options
 * Note: If the options has zclCharFormatter set to true then the function will
 * return the character associated with the zcl data type and not the actual data type.
 *
 * example:
 * {{asUnderlyingZclType [array type] array="b" one_byte="u" two_byte="v" three_byte="x"
 *  four_byte="w" short_string="s" long_string="l" default="b"
 *  zclCharFormatter="true"}}
 *
 * For the above if asUnderlyingZclType was given [array type] then the above
 * will return 'b'
 */
function asUnderlyingZclType(type, options) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      Promise.all([
        new Promise((resolve, reject) => {
          if ('isArray' in this && this.isArray) resolve(dbEnum.zclType.array)
          else resolve(dbEnum.zclType.unknown)
        }),
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
          if (dbEnum.zclType.zclCharFormatter in options.hash) {
            if (
              'array' in options.hash &&
              'one_byte' in options.hash &&
              'two_byte' in options.hash &&
              'three_byte' in options.hash &&
              'four_byte' in options.hash &&
              'short_string' in options.hash &&
              'long_string' in options.hash &&
              'default' in options.hash
            ) {
              return dataTypeCharacterFormatter(
                this.global.db,
                packageId,
                type,
                options,
                this.global.overridable,
                resType
              )
            } else {
              throw new Error(
                'array, one_byte, two_byte, three_byte, \
               four_byte, short_string, long_string and default need \
               to be defined as options as well when zclCharFormatter \
               is set to true.'
              )
            }
          } else {
            return dataTypeHelper(
              type,
              options,
              packageId,
              this.global.db,
              resType,
              this.global.overridable
            )
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

/**
 * Checks if the side is server or not
 *
 * @param {*} side
 * @returns boolean
 */
function isServer(side) {
  return 0 == side.localeCompare('server')
}

function isStrEqual(str1, str2) {
  return 0 == str1.localeCompare(str2)
}

function isLastElement(index, count) {
  return index == count - 1
}

function isFirstElement(index, count) {
  return index == count - 1
}

function isEnabled(enable) {
  return 1 == enable
}

function isCommandAvailable(clusterSide, incoming, outgoing, source, name) {
  if (0 == clusterSide.localeCompare(source)) {
    return false
  }

  if (isClient(clusterSide) && outgoing) {
    return true
  } else if (isServer(clusterSide) && incoming) {
    return true
  }
  return false
}

/**
 *
 *
 * @param {*} clusterId
 * @param {*} manufacturer_specific_return
 * @param {*} null_manufacturer_specific_return
 * @returns manufacturer_specific_return if the cluster is manufacturer
 * specific or returns null_manufacturer_specific_return if cluster is
 * not manufacturer specific.
 */
function if_manufacturing_specific_cluster(
  clusterId,
  manufacturer_specific_return,
  null_manufacturer_specific_return
) {
  var promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      var res = queryZcl.selectClusterById(this.global.db, clusterId, packageId)
      return res
    })
    .then((res) => {
      if (res.manufacturerCode != null) {
        return manufacturer_specific_return
      } else {
        return null_manufacturer_specific_return
      }
    })
  return templateUtil.templatePromise(this.global, promise)
}

const dep = templateUtil.deprecatedHelper

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
exports.zcl_device_types = zcl_device_types
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

exports.is_client = isClient
exports.isClient = dep(isClient, { to: 'is_client' })

exports.is_server = isServer
exports.isServer = dep(isServer, { to: 'is_server' })

exports.is_str_equal = isStrEqual
exports.isStrEqual = dep(isStrEqual, { to: 'str_equal' })

exports.is_last_element = isLastElement
exports.isLastElement = dep(isLastElement, {
  to: 'is_last_element',
})

exports.is_first_element = isFirstElement
exports.isFirstElement = dep(isFirstElement, {
  to: 'is_first_element',
})

exports.is_enabled = isEnabled
exports.isEnabled = dep(isEnabled, { to: 'is_enabled' })

exports.is_command_available = isCommandAvailable
exports.isCommandAvailable = dep(isCommandAvailable, {
  to: 'is_command_available',
})

exports.as_underlying_zcl_type = asUnderlyingZclType
exports.asUnderlyingZclType = dep(asUnderlyingZclType, {
  to: 'as_underlying_zcl_type',
})

exports.is_bitmap = isBitmap
exports.isBitmap = dep(isBitmap, { to: 'is_bitmap' })

exports.is_struct = isStruct
exports.isStruct = dep(isStruct, { to: 'is_struct' })

exports.is_enum = isEnum
exports.isEnum = dep(isEnum, { to: 'is_enum' })

exports.if_command_arguments_exist = if_command_arguments_exist
exports.if_manufacturing_specific_cluster = if_manufacturing_specific_cluster
