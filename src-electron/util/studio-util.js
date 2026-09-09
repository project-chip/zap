/**
 *
 *    Copyright (c) 2023 Silicon Labs
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
 * @module JS API: Studio utilities
 */

const path = require('path')

/**
 * Studio puts the project path in a single URL path segment. Percent-encoding
 * alone turns `/` into `%2F`, which Jetty 12 (UriCompliance.RFC3986) rejects as
 * an ambiguous path separator. Studio therefore replaces `%` with `_` after
 * encoding, and reverses that before decode. The GUI opens ZAP with paths
 * already in that form; the CLI must apply the same mangling when talking to
 * Jetty or component add/remove fails with a 400/404.
 *
 * Idempotent on an already-mangled path: those strings have no `%`, so a
 * second encode+replace leaves them unchanged.
 *
 * @param {string} studioProjectPath filesystem path or Studio-mangled path
 * @returns {string} path safe as one Jetty path segment
 */
function encodeStudioProjectPath(studioProjectPath) {
  if (studioProjectPath == null) return studioProjectPath
  return encodeURIComponent(studioProjectPath).replace(/%/g, '_')
}

/**
 * Reverse {@link encodeStudioProjectPath} (and Studio's own mangling).
 * @param {string} studioProjectPath
 * @returns {string}
 */
function decodeStudioProjectPath(studioProjectPath) {
  if (studioProjectPath == null) return studioProjectPath
  return decodeURIComponent(String(studioProjectPath).replace(/_/g, '%'))
}

/**
 *  Extract project name from the Studio project path
 * @param {} db
 * @param {*} sessionId
 * @returns '' if parsing fails
 */
function projectName(studioProjectPath) {
  try {
    let p = path.parse(decodeStudioProjectPath(studioProjectPath))
    return p.name
  } catch (error) {
    return ''
  }
}

exports.encodeStudioProjectPath = encodeStudioProjectPath
exports.decodeStudioProjectPath = decodeStudioProjectPath
exports.projectName = projectName
