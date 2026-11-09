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
 * Helpers for the listing operations: narrowing a catalog to what was asked for, and proposing a step built from a real row.
 *
 * @module Configuration API: listing operations
 */

const resolver = require('../resolver.js')

/**
 * Follow-up commands for a listing.
 *
 * When rows came back, the useful next step is to act on one of them, so the
 * suggestion is built from a real row and can be run as printed. `pick` chooses
 * which row, and gets to decline: a suggestion has to be both safe to run and
 * worth running, so nothing is proposed that would undo a mandatory selection
 * or amount to a no-op. When a filter matched nothing, the useful next step is
 * to widen the search instead.
 *
 * @param {*} ctx
 * @param {*} params The parameters the listing was called with.
 * @param {Array} rows The rows it produced.
 * @param {*} handlers `{ pick(rows), act(row), widen() }`.
 * @returns {string[]} suggested commands
 */
function listingNext(ctx, params, rows, handlers) {
  if (rows.length > 0) {
    let row = handlers.pick ? handlers.pick(rows) : rows[0]
    return row != null && handlers.act ? [].concat(handlers.act(row)) : []
  }
  let filtered = params.filter != null && `${params.filter}` !== ''
  if (filtered && handlers.widen) return [].concat(handlers.widen())
  return []
}

/**
 * Chooses the first row that is switched off, so that the command suggested
 * from it does something, falling back to the first row when everything is on.
 *
 * @param {Array} rows
 * @param {string} field Column holding the yes/no state.
 * @returns {*} the chosen row
 */
function firstDisabled(rows, field = 'enabled') {
  return rows.find((r) => r[field] === 'no') || rows[0]
}

/**
 * Narrows a listing to the rows that mention some text. Catalogs run to
 * hundreds of entries, and scanning all of them to find one name is wasteful
 * whether the reader is a person or a program.
 *
 * @param {Array} rows
 * @param {*} filter Text to look for, matched loosely against every column.
 * @returns {Array} the matching rows
 */
function applyFilter(rows, filter) {
  if (filter == null || `${filter}` === '') return rows
  let needle = resolver.normalizeName(filter)
  if (needle === '') return rows
  return rows.filter((row) =>
    Object.values(row).some((value) =>
      resolver.normalizeName(value).includes(needle)
    )
  )
}

exports.listingNext = listingNext
exports.firstDisabled = firstDisabled
exports.applyFilter = applyFilter
