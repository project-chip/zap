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
 * The shape of what an operation answers.
 *
 * An operation reports in data, never in a rendered form: messages are plain
 * sentences, warnings are kept apart from them, tables are columns and rows,
 * and the operations worth running next are named as `{ op, params }` steps.
 * How that is shown — a paste-able `zap` command, a JSON body, a script
 * warning — is each interface's own business, so none of it is decided here.
 *
 * @module Configuration API: outcome
 */

/**
 * Names an operation that could be run, with the parameters it would take.
 *
 * Parameters use the camelCase names the operations themselves accept
 * (`deviceType`, `enabledOnly`). A placeholder such as `'<name>'` is allowed
 * where there is no real value to offer.
 *
 * @param {string} op Dotted operation name, such as 'cluster.enable'.
 * @param {*} [params]
 * @returns {*} `{ op, params }`
 */
function step(op, params = {}) {
  let kept = {}
  for (let [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) kept[key] = value
  }
  return { op: op, params: kept }
}

/**
 * Builds an operation result.
 *
 * @param {boolean} changed Whether the configuration was modified.
 * @param {string[]} messages Lines describing what happened.
 * @param {*} [table] Optional `{ columns, rows }` tabular payload.
 * @param {Array} [next] Steps that are the natural thing to run next.
 * @param {string[]} [warnings] Things that went through but deserve attention.
 * @returns {*} operation result
 */
function result(changed, messages, table = null, next = [], warnings = []) {
  return {
    changed: changed,
    messages: messages,
    warnings: warnings,
    table: table,
    next: next
  }
}

exports.step = step
exports.result = result
