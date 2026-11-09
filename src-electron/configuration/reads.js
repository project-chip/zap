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
 * Plain reads of a loaded configuration, in the row shapes a post-load script
 * walks. The command line renders the same facts as tables through the
 * listing operations; these return the data as stored.
 *
 * @module Configuration API: reads
 */

const queryEndpoint = require('../db/query-endpoint.js')
const querySessionZcl = require('../db/query-session-zcl.js')
const sessionEdit = require('./session-edit.js')

/**
 * The endpoints of a session, optionally narrowed to one package category.
 * This is the row shape a post-load script walks; the command line renders
 * its own table from the same query.
 *
 * @param {*} ctx
 * @param {string} [category]
 * @returns {Promise<Array>} endpoints
 */
async function readEndpoints(ctx, category = null) {
  return queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId, category)
}

/**
 * The clusters enabled on an endpoint.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @returns {Promise<Array>} clusters
 */
async function readClusters(ctx, endpoint) {
  return queryEndpoint.selectEndpointClusters(ctx.db, endpoint.endpointTypeRef)
}

/**
 * The attributes of one cluster side on an endpoint, as stored. Codes stay
 * numeric: upgrade scripts parse them, and the command line's listing formats
 * them as hex instead.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster A row from `readClusters`, carrying `clusterId` and `side`.
 * @returns {Promise<Array>} attributes
 */
async function readAttributes(ctx, endpoint, cluster) {
  return queryEndpoint.selectEndpointClusterAttributes(
    ctx.db,
    cluster.clusterId,
    cluster.side,
    endpoint.endpointTypeRef
  )
}

/**
 * The commands of one cluster on an endpoint, as stored.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster A row from `readClusters`, carrying `clusterId`.
 * @returns {Promise<Array>} commands
 */
async function readCommands(ctx, endpoint, cluster) {
  return queryEndpoint.selectEndpointClusterCommands(
    ctx.db,
    cluster.clusterId,
    endpoint.endpointTypeRef
  )
}

/**
 * Every cluster the session's packages define.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} clusters
 */
async function readAvailableClusters(ctx) {
  return querySessionZcl.selectAllSessionClusters(ctx.db, ctx.sessionId)
}

/**
 * The features a cluster defines on an endpoint, each marked with whether its
 * bit is set. This is the row a post-load script walks; the command line
 * renders the same facts as a table.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster A cluster row, as `readClusters` returns it, or a
 *   resolved cluster definition. Either carries the id the feature query uses.
 * @returns {Promise<Array>} features
 */
async function readFeatures(ctx, endpoint, cluster) {
  let features = await sessionEdit.featuresOfCluster(ctx, endpoint, cluster)
  if (features.length === 0) return []
  let map = await sessionEdit.featureMapAttribute(ctx, endpoint, cluster)
  let enabled = sessionEdit.featureMapFromValue(features, map.value)
  return features.map((f) => ({ ...f, enabled: enabled[f.code] === true }))
}

exports.readEndpoints = readEndpoints
exports.readClusters = readClusters
exports.readAttributes = readAttributes
exports.readCommands = readCommands
exports.readAvailableClusters = readAvailableClusters
exports.readFeatures = readFeatures
