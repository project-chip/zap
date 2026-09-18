/**
 *
 *    Copyright (c) 2026 Silicon Labs
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
 * Shared UC component-id helpers used by both the UI (`src/util/util.js`)
 * and Studio IDE integration. Lives in src-shared so the Electron backend
 * can require it without pulling in Quasar, and so `tsc` / packaging include it.
 *
 * @module Shared API: UC component ids
 */

/**
 * Returns the short cluster code from a UC component id, regardless of which
 * prefix format the id uses. Strips everything up to the last '%' and then
 * everything up to the last '-', and lowercases the result. Use this when
 * you need to compare ids that came from different sources.
 *
 * Examples:
 *   "studiocomproot-Zigbee-Cluster_Library-Common-zigbee_basic"
 *     -> "zigbee_basic"
 *   "matter:1.0.0-Matter-Clusters-%extension-matter%matter_level_control"
 *     -> "matter_level_control"
 *   "%extension-zigbee%zigbee_basic"
 *     -> "zigbee_basic"
 *   "zigbee_basic"
 *     -> "zigbee_basic"
 *
 * @param {*} id
 * @returns {string}
 */
function extractUcClusterCode(id) {
  if (id == null) return ''
  let s = String(id).toLowerCase().trim()
  const lastPct = s.lastIndexOf('%')
  if (lastPct >= 0 && lastPct < s.length - 1) s = s.substring(lastPct + 1)
  const lastDash = s.lastIndexOf('-')
  if (lastDash >= 0 && lastDash < s.length - 1) s = s.substring(lastDash + 1)
  return s
}

/**
 * Split a cluster extension default value into component ids.
 * @param {*} ids
 * @returns {string[]}
 */
function splitComponentIds(ids) {
  if (!ids) return []
  return String(ids)
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x)
}

exports.extractUcClusterCode = extractUcClusterCode
exports.splitComponentIds = splitComponentIds
