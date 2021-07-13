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

const queryZcl = require('../db/query-zcl.js')
const queryCommand = require('../db/query-command.js')
const queryEvent = require('../db/query-event.js')
const dbEnum = require('../../src-shared/db-enum.js')
const templateUtil = require('./template-util.js')
const helperC = require('./helper-c.js')
const env = require('../util/env.js')
const types = require('../util/types.js')

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
  let promise = templateUtil
    .ensureZclPackageId(this)
    .then((packageId) => {
      let res = queryCommand.selectCommandArgumentsCountByCommandId(
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
 *
 * @param commandArg
 * @param trueReturn
 * @param falseReturn
 * @returns trueReturn if command argument is always present and there is a
 * presentIf condition else returns false
 */
function if_ca_always_present_with_presentif(
  commandArg,
  trueReturn,
  falseReturn
) {
  if (
    !(commandArg.introducedInRef || commandArg.removedInRef) &&
    commandArg.presentIf
  ) {
    return trueReturn
  } else {
    return falseReturn
  }
}

/**
 *
 * @param command
 * @param commandArg
 * @param trueReturn
 * @param falseReturn
 * @returns trueReturn if command is not fixed length but command argument is
 * always present else returns falseReturn
 */
async function if_command_is_not_fixed_length_but_command_argument_is_always_present(
  command,
  commandArg,
  trueReturn,
  falseReturn
) {
  let packageId = await templateUtil.ensureZclPackageId(this)

  let commandArgs = await queryCommand.selectCommandArgumentsByCommandId(
    this.global.db,
    command,
    packageId
  )
  let isFixedLengthCommand = true
  for (let ca of commandArgs) {
    if (
      ca.isArray ||
      types.isString(ca.type) ||
      ca.introducedInRef ||
      ca.removedInRef ||
      ca.presentIf
    ) {
      isFixedLengthCommand = false
    }
  }

  if (isFixedLengthCommand) {
    return falseReturn
  } else if (
    !(
      commandArg.isArray ||
      commandArg.introducedInRef ||
      commandArg.removedInRef ||
      commandArg.presentIf
    )
  ) {
    return trueReturn
  } else {
    return falseReturn
  }
}

exports.if_command_arguments_exist = if_command_arguments_exist
exports.if_ca_always_present_with_presentif =
  if_ca_always_present_with_presentif
exports.if_command_is_not_fixed_length_but_command_argument_is_always_present =
  if_command_is_not_fixed_length_but_command_argument_is_always_present
