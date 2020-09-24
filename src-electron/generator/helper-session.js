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

/**
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: user-data specific helpers
 */
const templateUtil = require('./template-util.js')
const queryImpexp = require('../db/query-impexp.js')
const queryConfig = require('../db/query-config.js')
const queryZcl = require('../db/query-zcl.js')

/**
 * Creates block iterator helper over the endpoint types.
 *
 * @tutorial template-tutorial
 * @param {*} options
 */
function user_endpoint_types(options) {
  return queryImpexp
    .exportEndpointTypes(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      templateUtil.collectBlocks(endpointTypes, options, this)
    )
}
/**
 * Creates cluster iterator over the endpoint types.
 * This works ony inside user_endpoint_types.
 *
 * @param {*} options
 */
function user_clusters(options) {
  return queryImpexp
    .exportClustersFromEndpointType(this.global.db, this.endpointTypeId)
    .then((endpointClusters) =>
      templateUtil.collectBlocks(endpointClusters, options, this)
    )
}

/**
 * Creates endpoint type cluster attribute iterator. This works only
 * inside user_clusters.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster attributes.
 */
function user_cluster_attributes(options) {
  return queryImpexp
    .exportAttributesFromEndpointTypeCluster(
      this.global.db,
      this.parent.endpointTypeId,
      this.endpointClusterId
    )
    .then((endpointAttributes) =>
      templateUtil.collectBlocks(endpointAttributes, options, this)
    )
}

/**
 * Creates endpoint type cluster command iterator. This works only inside
 * user_clusters.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function user_cluster_commands(options) {
  return queryImpexp
    .exportCommandsFromEndpointTypeCluster(
      this.global.db,
      this.parent.endpointTypeId,
      this.endpointClusterId
    )
    .then((endpointAttributes) =>
      templateUtil.collectBlocks(endpointAttributes, options, this)
    )
}

function user_endpoint_type_count() {
  return queryConfig.getEndpointTypeCount(this.global.db, this.global.sessionId)
}

/**
 * Iterates over all attributes required by the user configuration.
 *
 * @param {*} options
 * @return Promise of the resolved blocks iterating over cluster commands.
 */
function user_all_attributes(options) {
  return queryConfig
    .getAllSessionAttributes(this.global.db, this.global.sessionId)
    .then((atts) => templateUtil.collectBlocks(atts, options, this))
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * commands which have been enabled on added endpoints
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_user_cluster_commands(options) {
  return queryImpexp
    .exportendPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportCommandDetailsFromAllEndpointTypesAndClusters(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
}

/**
 * Creates cluster command iterator for all endpoints.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_user_clusters(options) {
  return queryImpexp
    .exportendPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportAllClustersDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((clusters) => templateUtil.collectBlocks(clusters, options, this))
}

/**
 * Get the count of the number of clusters commands with cli for a cluster.
 * This is used under a cluster block helper
 */
function user_cluster_command_count_with_cli() {
  return queryImpexp
    .exportendPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryImpexp.exportCliCommandCountFromEndpointTypeCluster(
        this.global.db,
        endpointTypes,
        this.endpointClusterId
      )
    )
}

/**
 * Creates endpoint type cluster command iterator. This works only inside
 * cluster block helpers.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function user_cluster_commands_all_endpoints(options) {
  return queryImpexp
    .exportendPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportCommandDetailsFromAllEndpointTypeCluster(
        this.global.db,
        endpointTypes,
        this.endpointClusterId
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.user_endpoint_types = user_endpoint_types
exports.user_clusters = user_clusters
exports.user_cluster_attributes = user_cluster_attributes
exports.user_cluster_commands = user_cluster_commands
exports.user_endpoint_type_count = user_endpoint_type_count
exports.user_all_attributes = user_all_attributes
exports.all_user_cluster_commands = all_user_cluster_commands
exports.all_user_clusters = all_user_clusters
exports.user_cluster_command_count_with_cli = user_cluster_command_count_with_cli
exports.user_cluster_commands_all_endpoints = user_cluster_commands_all_endpoints
