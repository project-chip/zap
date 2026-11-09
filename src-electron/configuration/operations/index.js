/**
 *
 *    Copyright (c) 2024 Silicon Labs
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
 * The operation registry. Every edit, lookup and check the interfaces share
 * is one entry here, keyed by its dotted name (`cluster.enable`), and each
 * subject module contributes its own slice. The command line, the HTTP
 * handlers and post-load scripts all arrive through `execute`.
 *
 * @module Configuration API: operations
 */

const operationError = require('../errors.js')

const OperationError = operationError.OperationError

const operations = Object.freeze({
  ...require('./config.js').operations,
  ...require('./endpoint.js').operations,
  ...require('./device-type.js').operations,
  ...require('./cluster.js').operations,
  ...require('./attribute.js').operations,
  ...require('./command.js').operations,
  ...require('./event.js').operations,
  ...require('./package.js').operations,
  ...require('./feature.js').operations
})

/**
 * Runs a single operation by name.
 *
 * @param {*} ctx
 * @param {string} name Dotted operation name, such as 'cluster.enable'.
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function execute(ctx, name, params) {
  let op = operations[name]
  if (op == null) {
    throw new OperationError(`Unknown operation '${name}'`, [
      `Known operations: ${Object.keys(operations).join(', ')}`
    ])
  }
  return op(ctx, params || {})
}

exports.operations = operations
exports.execute = execute
exports.operationNames = () => Object.keys(operations)
