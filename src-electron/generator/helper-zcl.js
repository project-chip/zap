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
const queryCommand = require('../db/query-command.js')
const queryEvent = require('../db/query-event.js')
const dbEnum = require('../../src-shared/db-enum.js')
const templateUtil = require('./template-util.js')
const helperC = require('./helper-c.js')
const env = require('../util/env.js')
const types = require('../util/types.js')

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
  let promise = templateUtil
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
  let promise = queryZcl
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
  let promise = templateUtil
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
  let promise = queryZcl
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
  let promise = templateUtil
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
  let promise = queryZcl
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
  let promise = templateUtil
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
  let promise = templateUtil
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryCommand.selectCommandsByClusterId(
          this.global.db,
          this.id,
          packageId
        )
      } else {
        return queryCommand.selectAllCommands(this.global.db, packageId)
      }
    })
    .then((cmds) => templateUtil.collectBlocks(cmds, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over all events.
 * There are two modes of this helper:
 *   when used in a global context, it iterates over ALL events in the database.
 *   when used inside a `zcl_cluster` block helper, it iterates only over the events for that cluster.
 *
 * @param {*} options
 * @returns Promise of content.
 */
function zcl_events(options) {
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryEvent.selectEventsByClusterId(
          this.global.db,
          this.id,
          packageId
        )
      } else {
        return queryEvent.selectAllEvents(this.global.db, packageId)
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryCommand.selectCommandTree(this.global.db, packageId)
    )
    .then((cmds) => {
      // Now reduce the array by collecting together arguments.
      let reducedCommands = []
      cmds.forEach((el) => {
        let newCommand
        let lastCommand
        if (reducedCommands.length == 0) {
          newCommand = true
        } else {
          lastCommand = reducedCommands[reducedCommands.length - 1]
          if (
            el.code == lastCommand.code &&
            el.clusterCode == lastCommand.clusterCode &&
            el.source == lastCommand.source
          ) {
            newCommand = false
          } else {
            newCommand = true
          }
        }

        let arg
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
          let n = ''
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryCommand.selectAllGlobalCommands(this.global.db, packageId)
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryZcl.selectAttributesByClusterIdIncludingGlobal(
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        return queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
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
  let promise = templateUtil
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
  let promise = templateUtil
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryCommand.selectCommandArgumentsCountByCommandId(
        this.global.db,
        commandId,
        packageId
      )
    )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 *
 * @param commandId
 * @param fixedLengthReturn
 * @param notFixedLengthReturn
 * @param currentContext
 * Returns fixedLengthReturn or notFixedLengthReturn based on whether the
 * command is fixed length or not
 */
async function ifCommandArgumentsHaveFixedLengthWithCurrentContext(
  commandId,
  fixedLengthReturn,
  notFixedLengthReturn,
  currentContext
) {
  let packageId = await templateUtil.ensureZclPackageId(currentContext)
  let commandArgs = await queryCommand.selectCommandArgumentsByCommandId(
    currentContext.global.db,
    commandId,
    packageId
  )

  let isFixedLength = true

  for (let argIndex = 0; argIndex < commandArgs.length; argIndex++) {
    if (
      commandArgs[argIndex].isArray ||
      types.isString(commandArgs[argIndex].type)
    ) {
      isFixedLength = false
    }
  }

  if (fixedLength) {
    return fixedLengthReturn
  } else {
    return notFixedLengthReturn
  }
}

/**
 *
 * @param commandId
 * @param fixedLengthReturn
 * @param notFixedLengthReturn
 * Returns fixedLengthReturn or notFixedLengthReturn based on whether the
 * command is fixed length or not. Does not check if command
 * arguments are always present or not.
 */
function if_command_arguments_have_fixed_length(
  commandId,
  fixedLengthReturn,
  notFixedLengthReturn
) {
  return ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    fixedLengthReturn,
    notFixedLengthReturn,
    this
  )
}

/**
 *
 * @param type
 * @param command
 * @param commandArg
 * @param appendString
 * @param options
 * @returns the underlying zcl type of a command argument if the argument is
 * not fixed length but is always present. If the condition is not met then
 * returns an empty string.
 */
function as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present(
  type,
  command,
  commandArg,
  appendString,
  options
) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryCommand.selectCommandArgumentsByCommandId(
        this.global.db,
        command,
        packageId
      )
    )
    .then(
      (commandArgs) =>
        new Promise((resolve, reject) => {
          for (let ca of commandArgs) {
            if (
              ca.isArray ||
              types.isString(ca.type) ||
              ca.introducedInRef ||
              ca.removedInRef ||
              ca.presentIf
            ) {
              resolve(false)
            }
          }
          resolve(true)
        })
    )
    .then((isFixedLengthCommand) => {
      if (isFixedLengthCommand) {
        return ''
      } else if (
        !(
          commandArg.isArray ||
          commandArg.introducedInRef ||
          commandArg.removedInRef ||
          commandArg.presentIf
        )
      ) {
        return templateUtil
          .ensureZclPackageId(this)
          .then((packageId) =>
            asUnderlyingZclTypeWithPackageId(type, options, packageId, this)
          )
      }
      return ''
    })
    .then((res) => (res ? res + appendString : res))
    .catch((err) => {
      env.logError(
        'Failure in as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present: ' +
          err
      )
    })
}

/**
 *
 * @param type
 * @param commandId
 * @param appendString
 * @param options
 * Returns: Given the commandId and the type of one of its arguments, based on
 * whether the command is fixed length or not either return nothing or return
 * the underlying zcl type appended with the appendString.
 */
function as_underlying_zcl_type_if_command_is_not_fixed_length(
  type,
  commandId,
  appendString,
  options
) {
  let promise = ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  )
    .then((res) => {
      if (res) {
        return ''
      } else {
        return templateUtil
          .ensureZclPackageId(this)
          .then((packageId) =>
            asUnderlyingZclTypeWithPackageId(type, options, packageId, this)
          )
      }
    })
    .then((res) => (res ? res + appendString : res))
    .catch((err) => {
      env.logError(err)
      throw err
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 *
 * @param commandId
 * Returns the size of the command by calculating the sum total of the command arguments
 * Note: This helper should be called on fixed length commands only. It should not be
 * called with commands which do not have a fixed length.
 */
function command_arguments_total_length(commandId) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      let res = queryCommand.selectCommandArgumentsByCommandId(
        this.global.db,
        commandId,
        packageId
      )
      return res
    })
    .then((commandArgs) =>
      new Promise((resolve, reject) => {
        let argsLength = []
        for (let argIndex = 0; argIndex < commandArgs.length; argIndex++) {
          let argType = commandArgs[argIndex].type
          let argOptions = {}
          argOptions.hash = {}
          argOptions.hash[dbEnum.zclType.zclCharFormatter] = true
          let argLength = templateUtil
            .ensureZclPackageId(this)
            .then((packageId) =>
              asUnderlyingZclTypeWithPackageId(
                argType,
                argOptions,
                packageId,
                this
              )
            )
          argsLength.push(argLength)
        }
        resolve(argsLength)
      }).then((argsLength) => {
        return Promise.all(argsLength).then((lengths) =>
          lengths.reduce((a, b) => a + b, 0)
        )
      })
    )
    .catch((err) =>
      env.logError('Unable to get the length of the command arguments: ' + err)
    )
}

/**
 * Block helper iterating over command arguments within a command
 * or a command tree.
 *
 * @param {*} options
 * @returns Promise of command argument iteration.
 */
function zcl_command_arguments(options) {
  let commandArgs = this.commandArgs
  let p

  // When we are coming from commant_tree, then
  // the commandArgs are already present and there is no need
  // to do additional queries.
  if (commandArgs == null) {
    p = templateUtil.ensureZclPackageId(this).then((packageId) => {
      if ('id' in this) {
        // We're functioning inside a nested context with an id, so we will only query for this cluster.
        return queryCommand.selectCommandArgumentsByCommandId(
          this.global.db,
          this.id
        )
      } else {
        return queryCommand.selectAllCommandArguments(this.global.db, packageId)
      }
    })
  } else {
    p = Promise.resolve(commandArgs)
  }

  let promise = p.then((args) =>
    templateUtil.collectBlocks(args, options, this)
  )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Block helper iterating over the event fields inside an event.
 *
 * @param {*} options
 */
function zcl_event_fields(options) {
  let eventFields = this.eventField
  let p

  if (eventFields == null) {
    p = templateUtil.ensureZclPackageId(this).then((packageId) => {
      if ('id' in this) {
        return queryEvent.selectEventFieldsByEventId(this.global.db, this.id)
      } else {
        return queryEvent.selectAllEventFields(this.global.db, packageId)
      }
    })
  } else {
    p = Promise.resolve(eventFields)
  }

  let promise = p.then((fields) =>
    templateUtil.collectBlocks(fields, options, this)
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
  let promise = templateUtil
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
              for (let i = 0; i < res.length; i++) {
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
 * @param currentContext
 * @param packageId
 * @param type
 * @param options
 * @returns zcl cli type for an array
 */
async function array_to_cli_data_type(
  currentContext,
  packageId,
  type,
  options
) {
  const arrayAtomicResult = await queryZcl.selectAtomicType(
    currentContext.global.db,
    packageId,
    type
  )
  let arrayAtomicSize = undefined
  if (arrayAtomicResult) {
    arrayAtomicSize = await calculateBytes(
      arrayAtomicResult.name,
      options,
      currentContext.global.db,
      packageId,
      false
    )
  } else {
    arrayAtomicSize = await calculateBytes(
      type,
      options,
      currentContext.global.db,
      packageId,
      false
    )
  }
  if (arrayAtomicSize == undefined || arrayAtomicSize.isNaN) {
    return helperC.as_zcl_cli_type(dbEnum.zclType.string, true, false)
  } else {
    if (arrayAtomicResult) {
      return helperC.as_zcl_cli_type(
        arrayAtomicSize,
        true,
        arrayAtomicResult.isSigned
      )
    } else {
      return helperC.as_zcl_cli_type(arrayAtomicSize, true, false)
    }
  }
}

/**
 *
 * @param currentContext
 * @param packageId
 * @param type
 * @param options
 * @returns zcl cli type for an enum
 */
async function enum_to_cli_data_type(currentContext, packageId, type, options) {
  const enumRecord = await queryZcl.selectEnumByName(
    currentContext.global.db,
    type,
    packageId
  )
  const enumType = await queryZcl.selectAtomicType(
    currentContext.global.db,
    packageId,
    enumRecord.type
  )
  const enumSize = await calculateBytes(
    enumType.name,
    options,
    currentContext.global.db,
    packageId,
    false
  )
  return helperC.as_zcl_cli_type(enumSize, false, false)
}

/**
 *
 * @param currentContext
 * @param packageId
 * @param type
 * @param options
 * @returns zcl cli type for a bitmap
 */
async function bitmap_to_cli_data_type(
  currentContext,
  packageId,
  type,
  options
) {
  const bitmapRecord = await queryZcl.selectBitmapByName(
    currentContext.global.db,
    packageId,
    type
  )
  const bitmapType = await queryZcl.selectAtomicType(
    currentContext.global.db,
    packageId,
    bitmapRecord.type
  )
  const bitmapSize = await calculateBytes(
    bitmapType.name,
    options,
    currentContext.global.db,
    packageId,
    false
  )
  return helperC.as_zcl_cli_type(bitmapSize, false, false)
}

/**
 * Helper that deals with the type of the argument.
 *
 * @param {*} typeName
 * @param {*} options
 */
async function zcl_command_argument_type_to_cli_data_type(type, options) {
  const packageId = await templateUtil.ensureZclPackageId(this)
  const isEnumType = await isEnum(this.global.db, type, packageId)
  const isBitmapType = await isBitmap(this.global.db, type, packageId)
  if ('isArray' in this && this.isArray) {
    return array_to_cli_data_type(this, packageId, type, options)
  } else if (isEnumType == dbEnum.zclType.enum) {
    return enum_to_cli_data_type(this, packageId, type, options)
  } else if (isBitmapType == dbEnum.zclType.bitmap) {
    return bitmap_to_cli_data_type(this, packageId, type, options)
  } else {
    const atomicResult = await queryZcl.selectAtomicType(
      this.global.db,
      packageId,
      type
    )
    const atomicSize = atomicResult
      ? await calculateBytes(
          atomicResult.name,
          options,
          this.global.db,
          packageId,
          false
        )
      : await calculateBytes(type, options, this.global.db, packageId, false)
    if (atomicSize == undefined || atomicSize.isNaN) {
      return helperC.as_zcl_cli_type(dbEnum.zclType.string, false, false)
    } else {
      if (atomicResult) {
        return helperC.as_zcl_cli_type(atomicSize, false, atomicResult.isSigned)
      } else {
        return helperC.as_zcl_cli_type(atomicSize, false, false)
      }
    }
  }
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
 * This function calculates the number of bytes in the data type and based on
 * that returns the option specified in the template.
 * for eg: Given that options are as follows:
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
 *
 * @param {*} res
 * @param {*} options
 */
function calculateBytes(res, options, db, packageId, isStructType) {
  if (!isStructType) {
    return calculate_bytes_for_types(res, options, db, packageId)
  } else {
    return calculate_bytes_for_structs(res, options, db, packageId)
  }
}

function calculate_bytes_for_types(res, options, db, packageId) {
  return types
    .typeSize(db, packageId, res.toLowerCase())
    .then((x) => {
      return new Promise((resolve, reject) => {
        let result = 0
        switch (x) {
          case 1:
            result = user_defined_output_or_default(options, 'one_byte', x)
            break
          case 2:
            result = user_defined_output_or_default(options, 'two_byte', x)
            break
          case 3:
            result = user_defined_output_or_default(options, 'three_byte', x)
            break
          case 4:
            result = user_defined_output_or_default(options, 'four_byte', x)
            break
          case 5:
            result = user_defined_output_or_default(options, 'five_byte', x)
            break
          case 6:
            result = user_defined_output_or_default(options, 'six_byte', x)
            break
          case 7:
            result = user_defined_output_or_default(options, 'seven_byte', x)
            break
          case 8:
            result = user_defined_output_or_default(options, 'eight_byte', x)
            break
          case 9:
            result = user_defined_output_or_default(options, 'nine_byte', x)
            break
          case 10:
            result = user_defined_output_or_default(options, 'ten_byte', x)
            break
          case 11:
            result = user_defined_output_or_default(options, 'eleven_byte', x)
            break
          case 12:
            result = user_defined_output_or_default(options, 'twelve_byte', x)
            break
          case 13:
            result = user_defined_output_or_default(options, 'thirteen_byte', x)
            break
          case 14:
            result = user_defined_output_or_default(options, 'fourteen_byte', x)
            break
          case 15:
            result = user_defined_output_or_default(options, 'fifteen_byte', x)
            break
          case 16:
            result = user_defined_output_or_default(options, 'sixteen_byte', x)
            break
          default:
            if (
              res != null &&
              res.includes('long') &&
              res.includes(dbEnum.zclType.string)
            ) {
              result = user_defined_output_or_default(
                options,
                'long_string',
                'l'
              )
            } else if (
              res != null &&
              !res.includes('long') &&
              res.includes(dbEnum.zclType.string)
            ) {
              result = user_defined_output_or_default(
                options,
                'short_string',
                's'
              )
            } else if ('default' in options.hash) {
              result = options.hash.default
            }
            break
        }
        resolve(result)
      })
    })
    .catch((err) => {
      env.logError(
        'Could not find size of the given type in' +
          ' calculate_bytes_for_types: ' +
          err
      )
    })
}

function calculate_bytes_for_structs(res, options, db, packageId) {
  if ('struct' in options.hash) {
    return Promise.resolve(options.hash.struct)
  } else {
    return queryZcl
      .selectAllStructItemsByStructName(db, res)
      .then((items) => {
        let promises = []
        items.forEach((item) =>
          promises.push(
            dataTypeCharacterFormatter(db, packageId, item, options, type)
          )
        )
        return Promise.all(promises)
      })
      .then((resolvedPromises) =>
        resolvedPromises.reduce((acc, cur) => acc + cur, 0)
      )
      .catch((err) => {
        env.logError(
          'Could not find size of struct in' +
            ' calculate_size_for_structs: ' +
            err
        )
        return Promise.resolve(0)
      })
  }
}

/**
 *
 * @param options
 * @param optionsKey
 * @param defaultValue
 * Given the values determine to give the user defined value or the calculated value
 */
function user_defined_output_or_default(options, optionsKey, defaultValue) {
  if (optionsKey in options.hash) {
    return options.hash[optionsKey]
  } else {
    return defaultValue
  }
}

/**
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} type
 * @param {*} options
 * @param {*} resType
 * Character associated to a zcl/c data type.
 */
function dataTypeCharacterFormatter(db, packageId, type, options, resType) {
  switch (resType) {
    case dbEnum.zclType.array:
      if (dbEnum.zclType.array in options.hash) {
        return Promise.resolve(options.hash.array)
      } else {
        return Promise.resolve('b')
      }
    case dbEnum.zclType.bitmap:
      return queryZcl
        .selectBitmapByName(db, packageId, type)
        .then((bitmap) => {
          return queryZcl.selectAtomicType(db, packageId, bitmap.type)
        })
        .then((res) => calculateBytes(res.name, options, db, packageId, false))
    case dbEnum.zclType.enum:
      return queryZcl
        .selectEnumByName(db, type, packageId)
        .then((enumRec) => {
          return queryZcl.selectAtomicType(db, packageId, enumRec.type)
        })
        .then((res) => calculateBytes(res.name, options, db, packageId, false))
    case dbEnum.zclType.struct:
      if (dbEnum.zclType.struct in options.hash) {
        return Promise.resolve(options.hash.struct)
      } else {
        return calculateBytes(type, options, db, packageId, true)
      }
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
            return Promise.resolve(atomic.name)
          }
          return Promise.resolve(type)
        })
        .then((res) => calculateBytes(res, options, db, packageId, false))
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
 *
 * @param type
 * @param options
 * @param packageId
 * @param currentInstance
 *
 * Note: If the options has zclCharFormatter set to true then the function will
 * return the user defined data associated with the zcl data type and not the
 * actual data type. It can also be used to calculate the size of the data types
 *
 * This is a utility function which is called from other helper functions using ut current
 * instance. See comments in asUnderlyingZclType for usage instructions.
 */
function asUnderlyingZclTypeWithPackageId(
  type,
  options,
  packageId,
  currentInstance
) {
  return Promise.all([
    new Promise((resolve, reject) => {
      if ('isArray' in currentInstance && currentInstance.isArray)
        resolve(dbEnum.zclType.array)
      else resolve(dbEnum.zclType.unknown)
    }),
    isEnum(currentInstance.global.db, type, packageId),
    isStruct(currentInstance.global.db, type, packageId),
    isBitmap(currentInstance.global.db, type, packageId),
  ])
    .then(
      (res) =>
        new Promise((resolve, reject) => {
          for (let i = 0; i < res.length; i++) {
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
        return dataTypeCharacterFormatter(
          currentInstance.global.db,
          packageId,
          type,
          options,
          resType
        )
      } else {
        return dataTypeHelper(
          type,
          options,
          packageId,
          currentInstance.global.db,
          resType,
          currentInstance.global.overridable
        )
      }
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Helper that deals with the type of the argument.
 *
 * @param {*} typeName
 * @param {*} options
 * Note: If the options has zclCharFormatter set to true then the function will
 * return the user defined data associated with the zcl data type and not the
 * actual data type.
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      asUnderlyingZclTypeWithPackageId(type, options, packageId, this)
    )
    .catch((err) => {
      env.logError(err)
      throw err
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 *
 * @param type
 * @param options
 * Returns the data mentioned in the helper options based on whether the type
 * is short string, long string or not a string
 * Example:
 * {{zcl_string_type_return type short_string="short string output"
 *                               long_string="short string output"
 *                               default="Output when not a string")
 *
 */
function zcl_string_type_return(type, options) {
  if (
    !(
      'short_string' in options.hash &&
      'long_string' in options.hash &&
      'default' in options.hash
    )
  ) {
    throw new Error('Specify all options for the helper')
  }
  if (types.isOneBytePrefixedString(type.toLowerCase())) {
    return options.hash.short_string
  } else if (types.isTwoBytePrefixedString(type.toLowerCase())) {
    return options.hash.long_string
  } else {
    return options.hash.default
  }
}

/**
 *
 * @param type
 * Return: true or false based on whether the type is a string or not.
 */
function is_zcl_string(type) {
  return types.isString(type)
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
 * If helper that checks if a type is a bitmap
 *
 * example:
 * {{#if_is_bitmap type}}
 * type is bitmap
 * {{else}}
 * type is not bitmap
 * {{/if_is_bitmap}}
 *
 * @param {*} type
 * @returns Promise of content.
 */
function if_is_bitmap(type, options) {
  let promise = templateUtil.ensureZclPackageId(this).then((packageId) =>
    queryZcl.selectBitmapByName(this.global.db, packageId, type).then((st) => {
      if (st || type.startsWith('map')) {
        return options.fn(this)
      }
      return options.inverse(this)
    })
  )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * If helper that checks if a type is an enum
 *
 * * example:
 * {{#if_is_enum type}}
 * type is bitmap
 * {{else}}
 * type is not bitmap
 * {{/if_is_enum}}
 *
 * @param {*} type
 * @returns Promise of content.
 */
function if_is_enum(type, options) {
  let promise = templateUtil.ensureZclPackageId(this).then((packageId) =>
    queryZcl.selectEnumByName(this.global.db, type, packageId).then((st) => {
      if (st || type.startsWith('enum')) {
        return options.fn(this)
      }
      return options.inverse(this)
    })
  )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * If helper that checks if a type is an struct
 *
 * * example:
 * {{#if_is_struct type}}
 * type is struct
 * {{else}}
 * type is not struct
 * {{/if_is_struct}}
 *
 * @param type
 * @returns Promise of content.
 */
function if_is_struct(type, options) {
  let promise = templateUtil.ensureZclPackageId(this).then((packageId) =>
    queryZcl.selectStructByName(this.global.db, type, packageId).then((st) => {
      if (st) {
        return options.fn(this)
      }
      return options.inverse(this)
    })
  )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Checks if the side is client or not
 *
 * @param {*} side
 * @returns boolean
 */
function isClient(side) {
  return 0 == side.localeCompare(dbEnum.side.client)
}

/**
 * Checks if the side is server or not
 *
 * @param {*} side
 * @returns boolean
 */
function isServer(side) {
  return 0 == side.localeCompare(dbEnum.side.server)
}

function isStrEqual(str1, str2) {
  return 0 == str1.localeCompare(str2)
}

function isLastElement(index, count) {
  return index == count - 1
}

function isFirstElement(index, count) {
  return index == 0
}

function isEnabled(enable) {
  return 1 == enable
}

function isCommandAvailable(clusterSide, incoming, outgoing, source, name) {
  if (0 == clusterSide.localeCompare(source)) {
    return false
  }

  return (
    (isClient(clusterSide) && incoming) || (isServer(clusterSide) && incoming)
  )
}

/**
 *
 *
 * @param type: type of argument
 * @param commandId: command id
 * @param appendString: append the string to the argument
 * @param introducedInRef: If the command argument is not present in all zcl
 * specifications and was introduced in a certain specification version then this will not be null
 * @param removedInRef: If the command argument is not present in all zcl
 * specifications and was removed in a certain specification version then this will not be null
 * @param presentIf: If the command argument is present conditionally then this will be a condition
 * and not null
 *
 * @param options: options which can be passed to asUnderlyingZclTypeWithPackageId
 * for determining the underlying zcl type for the provided argument type
 * @returns A string as an underlying zcl type if the command is not fixed length and the command
 * argument is always present in all zcl specifications.
 */
function as_underlying_zcl_type_command_argument_always_present(
  type,
  commandId,
  appendString,
  introducedInRef,
  removedInRef,
  presentIf,
  options
) {
  let promise = ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  )
    .then((res) => {
      if (res) {
        return ''
      } else {
        // Return the underlying zcl type since command argument is always present
        if (introducedInRef || removedInRef || presentIf) {
          // Return nothing if the command argument is not always present
          return ''
        } else {
          // Return the underlying zcl type if the command argument is always present.
          return templateUtil
            .ensureZclPackageId(this)
            .then((packageId) =>
              asUnderlyingZclTypeWithPackageId(type, options, packageId, this)
            )
        }
      }
    })
    // Adding the appendString for the underlying zcl type
    .then((res) => (res ? res + appendString : res))
    .catch((err) => {
      env.logError(err)
      throw err
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 *
 *
 * @param commandId
 * @param introducedInRef
 * @param removedInRef
 * @param presentIf
 * @param argumentPresentReturn
 * @param argumentNotPresentReturn
 * @returns argumentPresentReturn if the command is not fixed length and command
 * argument is always present without conditions(introducedInRef, removedInRef,
 * presentIf) else returns argumentNotPresentReturn
 */
function if_command_argument_always_present(
  commandId,
  introducedInRef,
  removedInRef,
  presentIf,
  argumentPresentReturn,
  argumentNotPresentReturn
) {
  return ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  ).then((res) => {
    if (res) {
      return '' // Return nothing since command is a fixed length command
    } else {
      if (introducedInRef || removedInRef || presentIf) {
        return argumentNotPresentReturn
      }
      return argumentPresentReturn
    }
  })
}

/**
 *
 *
 * @param type: type of argument
 * @param commandId: command id
 * @param appendString: append the string to the argument
 * @param introducedInRef: If the command argument is not present in all zcl
 * specifications and was introduced in a certain specification version then this will not be null
 * @param removedInRef: If the command argument is not present in all zcl
 * specifications and was removed in a certain specification version then this will not be null
 * @param presentIf: If the command argument is present conditionally then this will be a condition
 * and not null
 * @param options: options which can be passed to asUnderlyingZclTypeWithPackageId
 * for determining the underlying zcl type for the provided argument type
 * @returns A string as an underlying zcl type if the command is not fixed length, the command
 * argument is not always present in all zcl specifications and there is no present if conditionality
 * on the command argument.
 */

function as_underlying_zcl_type_command_argument_not_always_present_no_presentif(
  type,
  commandId,
  appendString,
  introducedInRef,
  removedInRef,
  presentIf,
  options
) {
  let promise = ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  )
    .then((res) => {
      if (res) {
        return '' // Return nothing since the command is of fixed length
      } else {
        // Return the underlying zcl type since command argument is not always present and there is no present if conditionality
        if ((introducedInRef || removedInRef) && !presentIf) {
          return templateUtil
            .ensureZclPackageId(this)
            .then((packageId) =>
              asUnderlyingZclTypeWithPackageId(type, options, packageId, this)
            )
        } else {
          return ''
        }
      }
    })
    // Adding the appendString for the underlying zcl type
    .then((res) => (res ? res + appendString : res))
    .catch((err) => {
      env.logError(err)
      throw err
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * @param commandArg command argument
 * @param appendString append the string to the argument
 * @param options options which can be passed to asUnderlyingZclTypeWithPackageId
 * for determining the underlying zcl type for the provided argument type
 * @returns A string as an underlying zcl type if the command is not fixed
 * length, the command argument is not always present in all zcl specifications
 * and there is no present if conditionality on the command argument.
 */
function as_underlying_zcl_type_ca_not_always_present_no_presentif(
  commandArg,
  appendString,
  options
) {
  // Return the underlying zcl type since command argument is not always
  // present and there is no present if conditionality
  if (
    (commandArg.introducedInRef || commandArg.removedInRef) &&
    !commandArg.presentIf
  ) {
    let promise = templateUtil
      .ensureZclPackageId(this)
      .then((packageId) =>
        asUnderlyingZclTypeWithPackageId(
          commandArg.type,
          options,
          packageId,
          this
        )
      ) // Adding the appendString for the underlying zcl type
      .then((res) => (res ? res + appendString : res))
      .catch((err) => {
        env.logError(
          'Error in as_underlying_zcl_type_ca_not_always_present_no_presentif ' +
            err
        )
        throw err
      })
    return templateUtil.templatePromise(this.global, promise)
  } else {
    return ''
  }
}

/**
 *
 *
 * @param commandId
 * @param introducedInRef
 * @param removedInRef
 * @param presentIf
 * @param argumentNotInAllVersionsReturn
 * @param argumentInAllVersionsReturn
 * @returns argumentNotInAllVersionsReturn if the command is not fixed length and command
 * argument is present with conditions introducedInRef or removedInRef but no presentIf
 * conditions else returns argumentNotPresentReturn
 */
function if_command_argument_not_always_present_no_presentif(
  commandId,
  introducedInRef,
  removedInRef,
  presentIf,
  argumentNotInAllVersionsReturn,
  argumentInAllVersionsReturn
) {
  return ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  ).then((res) => {
    if (res) {
      return '' // Return nothing since it is a fixed length command
    } else {
      if ((introducedInRef || removedInRef) && !presentIf) {
        return argumentNotInAllVersionsReturn
      }
      return argumentInAllVersionsReturn
    }
  })
}

/**
 *
 *
 * @param type: type of argument
 * @param commandId: command id
 * @param appendString: append the string to the argument
 * @param introducedInRef: If the command argument is not present in all zcl
 * specifications and was introduced in a certain specification version then this will not be null
 * @param removedInRef: If the command argument is not present in all zcl
 * specifications and was removed in a certain specification version then this will not be null
 * @param presentIf: If the command argument is present conditionally then this will be a condition
 * and not null
 * @param options: options which can be passed to asUnderlyingZclTypeWithPackageId
 * for determining the underlying zcl type for the provided argument type
 * @returns A string as an underlying zcl type if the command is not fixed length, the command
 * argument is not always present in all zcl specifications and there is a present if conditionality
 * on the command argument.
 */
function as_underlying_zcl_type_command_argument_not_always_present_with_presentif(
  type,
  commandId,
  appendString,
  introducedInRef,
  removedInRef,
  presentIf,
  options
) {
  let promise = ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  )
    .then((res) => {
      if (res) {
        return '' // Return nothing since the command is of fixed length
      } else {
        // Return the underlying zcl type since command argument is not always present and there is present if conditionality.
        if ((introducedInRef || removedInRef) && presentIf) {
          return templateUtil
            .ensureZclPackageId(this)
            .then((packageId) =>
              asUnderlyingZclTypeWithPackageId(type, options, packageId, this)
            )
        } else {
          return ''
        }
      }
    })
    // Adding the appendString for the underlying zcl type
    .then((res) => (res ? res + appendString : res))
    .catch((err) => {
      env.logError(err)
      throw err
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * @param commandArg command argument
 * @param appendString append the string to the argument
 * @param options options which can be passed to asUnderlyingZclTypeWithPackageId
 * for determining the underlying zcl type for the provided argument type
 * @returns A string as an underlying zcl type if the command is not fixed
 * length, the command argument is not always present in all zcl specifications
 * but there is a present if conditionality on the command argument.
 */
function as_underlying_zcl_type_ca_not_always_present_with_presentif(
  commandArg,
  appendString,
  options
) {
  // Return the underlying zcl type since command argument is not always
  // present and there is a present if conditionality
  if (
    (commandArg.introducedInRef || commandArg.removedInRef) &&
    commandArg.presentIf
  ) {
    let promise = templateUtil
      .ensureZclPackageId(this)
      .then((packageId) =>
        asUnderlyingZclTypeWithPackageId(
          commandArg.type,
          options,
          packageId,
          this
        )
      ) // Adding the appendString for the underlying zcl type
      .then((res) => (res ? res + appendString : res))
      .catch((err) => {
        env.logError(
          'Error in as_underlying_zcl_type_ca_not_always_present_with_presentif ' +
            err
        )
        throw err
      })
    return templateUtil.templatePromise(this.global, promise)
  } else {
    return ''
  }
}

/**
 *
 *
 * @param commandId
 * @param introducedInRef
 * @param removedInRef
 * @param presentIf
 * @param argumentNotInAllVersionsPresentIfReturn
 * @param argumentInAllVersionsReturn
 * @returns argumentNotInAllVersionsReturn if the command is not fixed length, command
 * argument is present with conditions introducedInRef or removedInRef and presentIf
 * conditions exist as well else returns argumentNotPresentReturn
 */
function if_command_argument_not_always_present_with_presentif(
  commandId,
  introducedInRef,
  removedInRef,
  presentIf,
  argumentNotInAllVersionsPresentIfReturn,
  argumentInAllVersionsReturn
) {
  return ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  ).then((res) => {
    if (res) {
      return '' // Return nothing since it is a fixed length command
    } else {
      if ((introducedInRef || removedInRef) && presentIf) {
        return argumentNotInAllVersionsPresentIfReturn
      }
      return argumentInAllVersionsReturn
    }
  })
}

/**
 *
 *
 * @param type: type of argument
 * @param commandId: command id
 * @param appendString: append the string to the argument
 * @param introducedInRef: If the command argument is not present in all zcl
 * specifications and was introduced in a certain specification version then this will not be null
 * @param removedInRef: If the command argument is not present in all zcl
 * specifications and was removed in a certain specification version then this will not be null
 * @param presentIf: If the command argument is present conditionally then this will be a condition
 * and not null
 * @param options: options which can be passed to asUnderlyingZclTypeWithPackageId
 * for determining the underlying zcl type for the provided argument type
 * @returns A string as an underlying zcl type if the command is not fixed length, the command
 * argument is always present in all zcl specifications and there is a present if conditionality
 * on the command argument.
 */
function as_underlying_zcl_type_command_argument_always_present_with_presentif(
  type,
  commandId,
  appendString,
  introducedInRef,
  removedInRef,
  presentIf,
  options
) {
  let promise = ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  )
    .then((res) => {
      if (res) {
        return '' // Return nothing since the command is of fixed length
      } else {
        // Return the underlying zcl type since command argument is always present and there is a present if condition
        if (!(introducedInRef || removedInRef) && presentIf) {
          return templateUtil
            .ensureZclPackageId(this)
            .then((packageId) =>
              asUnderlyingZclTypeWithPackageId(type, options, packageId, this)
            )
        } else {
          return ''
        }
      }
    })
    // Adding the appendString for the underlying zcl type
    .then((res) => (res ? res + appendString : res))
    .catch((err) => {
      env.logError(err)
      throw err
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * @param commandArg command argument
 * @param appendString append the string to the argument
 * @param options options which can be passed to asUnderlyingZclTypeWithPackageId
 * for determining the underlying zcl type for the provided argument type
 * @returns A string as an underlying zcl type if the command is not fixed
 * length, the command argument is always present in all zcl specifications
 * but there is a present if conditionality on the command argument.
 */
function as_underlying_zcl_type_ca_always_present_with_presentif(
  commandArg,
  appendString,
  options
) {
  // Return the underlying zcl type since command argument is always
  // present and there is a present if conditionality
  if (
    !(commandArg.introducedInRef || commandArg.removedInRef) &&
    commandArg.presentIf
  ) {
    let promise = templateUtil
      .ensureZclPackageId(this)
      .then((packageId) =>
        asUnderlyingZclTypeWithPackageId(
          commandArg.type,
          options,
          packageId,
          this
        )
      ) // Adding the appendString for the underlying zcl type
      .then((res) => (res ? res + appendString : res))
      .catch((err) => {
        env.logError(
          'Error in as_underlying_zcl_type_ca_always_present_with_presentif ' +
            err
        )
        throw err
      })
    return templateUtil.templatePromise(this.global, promise)
  } else {
    return ''
  }
}

/**
 *
 *
 * @param commandId
 * @param introducedInRef
 * @param removedInRef
 * @param presentIf
 * @param argumentNotInAllVersionsPresentIfReturn
 * @param argumentInAllVersionsReturn
 * @returns argumentInAllVersionsPresentIfReturn if the command is not fixed length, command
 * argument is always present and presentIf conditions exist else returns argumentNotPresentReturn
 */
async function if_command_argument_always_present_with_presentif(
  commandId,
  introducedInRef,
  removedInRef,
  presentIf,
  argumentInAllVersionsPresentIfReturn,
  argumentNotAlwaysThereReturn
) {
  let res = await ifCommandArgumentsHaveFixedLengthWithCurrentContext(
    commandId,
    true,
    false,
    this
  )
  if (res) {
    return '' // Return nothing since it is a fixed length command
  } else {
    if (!(introducedInRef || removedInRef) && presentIf) {
      return argumentInAllVersionsPresentIfReturn
    }
    return argumentNotAlwaysThereReturn
  }
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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => queryZcl.selectClusterById(this.global.db, clusterId))
    .then((res) => {
      if (res.manufacturerCode != null) {
        return manufacturer_specific_return
      } else {
        return null_manufacturer_specific_return
      }
    })
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Given the value and size of an attribute along with endian as an option.
 * This helper returns the attribute value as big/little endian.
 * Example: {{as_generated_default_macro 0x00003840 4 endian="big"}}
 * will return: 0x00, 0x00, 0x38, 0x40,
 * @param value
 * @param attributeSize
 * @param options
 * @returns Formatted attribute value based on given arguments
 */
async function as_generated_default_macro(value, attributeSize, options) {
  let default_macro_signature = ''
  if (attributeSize > 2) {
    let default_macro = helperC
      .asHex(value, null, null)
      .replace('0x', '')
      .match(/.{1,2}/g)
    let padding_length = attributeSize - default_macro.length
    for (let i = 0; i < padding_length; i++) {
      default_macro_signature += '0x00, '
    }
    for (let j = 0; j < default_macro.length; j++) {
      default_macro_signature += ' 0x' + default_macro[j] + ','
    }
    if (options.hash.endian != 'big') {
      default_macro_signature = default_macro_signature
        .split(' ')
        .reverse()
        .join(' ')
    }
  }
  return default_macro_signature
}

/**
 * Given the attributes of a zcl attribute. Creates an attribute mask based on
 * the given options
 * @param writable
 * @param storageOption
 * @param minMax
 * @param mfgSpecific
 * @param clusterCode
 * @param client
 * @param isSingleton
 * @param prefixString
 * @param postfixString
 * @returns attribute mask based on given values
 */
async function attribute_mask(
  writable,
  storageOption,
  minMax,
  mfgSpecific,
  clusterCode,
  client,
  isSingleton,
  prefixString,
  postfixString
) {
  let attributeMask = ''
  // mask for isWritable
  if (writable) {
    attributeMask +=
      (attributeMask ? '| ' : '') + prefixString + 'WRITABLE' + postfixString
  }

  // mask for storage option
  if (storageOption === 'NVM') {
    attributeMask +=
      (attributeMask ? '| ' : '') + prefixString + 'TOKENIZE' + postfixString
  } else if (storageOption === 'EXTERNAL') {
    attributeMask +=
      (attributeMask ? '| ' : '') + prefixString + 'EXTERNAL' + postfixString
  }

  // mask for bound
  if (minMax) {
    attributeMask +=
      (attributeMask ? '| ' : '') + prefixString + 'MIN_MAX' + postfixString
  }

  // mask for manufacturing specific attributes
  if (mfgSpecific && clusterCode < 64512) {
    attributeMask +=
      (attributeMask ? '| ' : '') +
      prefixString +
      'MANUFACTURER_SPECIFIC' +
      postfixString
  }

  // mask for client side attribute
  if (client === 'client') {
    attributeMask +=
      (attributeMask ? '| ' : '') + prefixString + 'CLIENT' + postfixString
  }

  //mask for singleton attirbute
  if (isSingleton) {
    attributeMask +=
      (attributeMask ? '| ' : '') + prefixString + 'SINGLETON' + postfixString
  }

  if (!attributeMask) {
    attributeMask = '0x00'
  }
  return attributeMask
}

/**
 * Given the attributes of a zcl command. Creates a command mask based on
 * the given options
 * @param commmandSource
 * @param clusterSide
 * @param isIncomingEnabled
 * @param isOutgoingEnabled
 * @param manufacturingCode
 * @param prefixForMask
 * @returns command mask based on given values
 */
async function command_mask(
  commmandSource,
  clusterSide,
  isIncomingEnabled,
  isOutgoingEnabled,
  manufacturingCode,
  prefixForMask
) {
  let commandMask = ''
  if (isClient(commmandSource)) {
    if (
      (isIncomingEnabled && commmandSource != clusterSide) ||
      (isIncomingEnabled && clusterSide == 'either')
    ) {
      commandMask += command_mask_sub_helper(
        commandMask,
        prefixForMask + 'INCOMING_SERVER'
      )
    }
    if (
      (isOutgoingEnabled && commmandSource == clusterSide) ||
      (isOutgoingEnabled && clusterSide == 'either')
    ) {
      commandMask += command_mask_sub_helper(
        commandMask,
        prefixForMask + 'OUTGOING_CLIENT'
      )
    }
  } else {
    if (
      (isIncomingEnabled && commmandSource != clusterSide) ||
      (isIncomingEnabled && clusterSide == 'either')
    ) {
      commandMask += command_mask_sub_helper(
        commandMask,
        prefixForMask + 'INCOMING_CLIENT'
      )
    }
    if (
      (isOutgoingEnabled && commmandSource == clusterSide) ||
      (isOutgoingEnabled && clusterSide == 'either')
    ) {
      commandMask += command_mask_sub_helper(
        commandMask,
        prefixForMask + 'OUTGOING_SERVER'
      )
    }
  }
  if (manufacturingCode && commandMask) {
    commandMask += command_mask_sub_helper(
      commandMask,
      prefixForMask + 'MANUFACTURER_SPECIFIC'
    )
  }
  return commandMask
}

/**
 * A Sub helper api for command_mask to reduce code redundancy
 * @param commandMask
 * @param str
 * @returns command mask addition based on the arguments
 */
function command_mask_sub_helper(commandMask, str) {
  if (commandMask) {
    return ' | ' + str
  } else {
    return str
  }
}

/**
 * This may be used within all_user_cluster_attributes_for_generated_defaults
 * for example:
 * {{format_zcl_string_as_characters_for_generated_defaults 'abc' 5}}
 * will return as follows:
 * 3, 'a', 'b', 'c' 0x00, 0x00
 * @param stringVal
 * @param sizeOfString
 * @returns Formatted string for generated defaults starting with the lenth of a
 * string then each character and then filler for the size allocated for the
 * string
 */
async function format_zcl_string_as_characters_for_generated_defaults(
  stringVal,
  sizeOfString
) {
  let lengthOfString = stringVal.length
  let formatted_string = lengthOfString + ', '
  for (let i = 0; i < lengthOfString; i++) {
    formatted_string += "'" + stringVal.charAt(i) + "', "
  }
  for (let i = lengthOfString + 1; i < sizeOfString; i++) {
    formatted_string += '0x00' + ', '
  }
  return formatted_string
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
exports.zcl_events = zcl_events
exports.zcl_event_fields = zcl_event_fields
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

exports.if_is_bitmap = if_is_bitmap

exports.if_is_enum = if_is_enum

exports.is_struct = isStruct
exports.isStruct = dep(isStruct, { to: 'is_struct' })

exports.is_enum = isEnum
exports.isEnum = dep(isEnum, { to: 'is_enum' })

exports.if_manufacturing_specific_cluster = if_manufacturing_specific_cluster
exports.zcl_command_argument_type_to_cli_data_type = zcl_command_argument_type_to_cli_data_type
exports.zcl_string_type_return = zcl_string_type_return
exports.is_zcl_string = is_zcl_string
exports.if_command_arguments_have_fixed_length = if_command_arguments_have_fixed_length
exports.command_arguments_total_length = command_arguments_total_length
exports.as_underlying_zcl_type_if_command_is_not_fixed_length = as_underlying_zcl_type_if_command_is_not_fixed_length
exports.if_command_argument_always_present = dep(
  if_command_argument_always_present,
  {
    to: 'if_command_is_not_fixed_length_but_command_argument_is_always_present',
  }
)
exports.as_underlying_zcl_type_command_argument_always_present = dep(
  as_underlying_zcl_type_command_argument_always_present,
  {
    to:
      'as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present',
  }
)
exports.if_command_argument_always_present_with_presentif = dep(
  if_command_argument_always_present_with_presentif,
  { to: 'if_ca_always_present_with_presentif' }
)
exports.as_underlying_zcl_type_command_argument_always_present_with_presentif = dep(
  as_underlying_zcl_type_command_argument_always_present_with_presentif,
  {
    to: 'as_underlying_zcl_type_ca_always_present_with_presentif',
  }
)
exports.if_command_argument_not_always_present_with_presentif = dep(
  if_command_argument_not_always_present_with_presentif,
  { to: 'if_ca_not_always_present_with_presentif' }
)
exports.as_underlying_zcl_type_command_argument_not_always_present_with_presentif = dep(
  as_underlying_zcl_type_command_argument_not_always_present_with_presentif,
  { to: 'as_underlying_zcl_type_ca_not_always_present_with_presentif' }
)
exports.if_command_argument_not_always_present_no_presentif = dep(
  if_command_argument_not_always_present_no_presentif,
  { to: 'if_ca_not_always_present_no_presentif' }
)
exports.as_underlying_zcl_type_command_argument_not_always_present_no_presentif = dep(
  as_underlying_zcl_type_command_argument_not_always_present_no_presentif,
  {
    to: 'as_underlying_zcl_type_ca_not_always_present_no_presentif',
  }
)
exports.as_generated_default_macro = as_generated_default_macro
exports.attribute_mask = attribute_mask
exports.command_mask = command_mask
exports.format_zcl_string_as_characters_for_generated_defaults = format_zcl_string_as_characters_for_generated_defaults
exports.as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present = as_underlying_zcl_type_command_is_not_fixed_length_but_command_argument_is_always_present
exports.as_underlying_zcl_type_ca_not_always_present_no_presentif = as_underlying_zcl_type_ca_not_always_present_no_presentif
exports.as_underlying_zcl_type_ca_not_always_present_with_presentif = as_underlying_zcl_type_ca_not_always_present_with_presentif
exports.as_underlying_zcl_type_ca_always_present_with_presentif = as_underlying_zcl_type_ca_always_present_with_presentif
exports.if_is_struct = if_is_struct
