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
 * Reads the batch scripts consumed by `zap edit apply`.
 *
 * Loading the ZCL metadata dominates the cost of any single `zap edit`
 * invocation, so applying a list of operations in one process is the
 * recommended way to make more than a couple of changes.
 *
 * @module CLI API: batch scripts
 */

const fs = require('fs')
const YAML = require('yaml')
const cliError = require('./cli-error.js')
const cliOperations = require('./cli-operations.js')

const CliError = cliError.CliError

/**
 * Reads the whole of stdin.
 *
 * @returns {Promise<string>} stdin contents
 */
async function readStdin() {
  let chunks = []
  for await (let chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Loads a batch script from a file, or from stdin when the path is '-'.
 *
 * The script is a YAML or JSON list of operations. Each entry names an
 * operation and carries the same parameters as the matching subcommand, with
 * the flag names written in camelCase:
 *
 * ```yaml
 * - op: endpoint.create
 *   endpoint: 1
 *   deviceType: Matter On/Off Light
 * - op: cluster.enable
 *   endpoint: 1
 *   cluster: Level Control
 *   side: server
 * ```
 *
 * A top level `operations:` key wrapping the list is also accepted.
 *
 * @param {string} scriptPath Path to the script, or '-' for stdin.
 * @returns {Promise<Array>} the parsed operation list
 */
async function load(scriptPath) {
  let text
  if (scriptPath === '-') {
    text = await readStdin()
  } else {
    if (!fs.existsSync(scriptPath)) {
      throw new CliError(`No such script: ${scriptPath}`)
    }
    text = fs.readFileSync(scriptPath, 'utf8')
  }
  let parsed
  try {
    parsed = YAML.parse(text)
  } catch (err) {
    throw new CliError(`Could not parse ${scriptPath}: ${err.message}`)
  }
  return normalize(parsed, scriptPath)
}

/**
 * Validates the parsed script and turns it into a plain operation list.
 *
 * @param {*} parsed
 * @param {string} source Used in error messages.
 * @returns {Array} array of `{ op, params }`
 */
function normalize(parsed, source = 'script') {
  if (parsed == null) return []
  let list = Array.isArray(parsed) ? parsed : parsed.operations
  if (!Array.isArray(list)) {
    throw new CliError(
      `${source} must contain a list of operations, or an 'operations:' key holding one`
    )
  }
  let known = cliOperations.operationNames()
  return list.map((entry, index) => {
    if (entry == null || typeof entry !== 'object') {
      throw new CliError(`${source}: entry ${index + 1} is not an object`)
    }
    let { op, ...params } = entry
    if (op == null) {
      throw new CliError(`${source}: entry ${index + 1} is missing 'op'`)
    }
    if (!known.includes(op)) {
      throw new CliError(
        `${source}: entry ${index + 1} has unknown op '${op}'`,
        [`Known operations: ${known.join(', ')}`]
      )
    }
    return { op: op, params: params }
  })
}

exports.load = load
exports.normalize = normalize
