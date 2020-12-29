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
const helperZcl = require('./helper-zcl.js')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * Creates block iterator helper over the endpoint types.
 *
 * @tutorial template-tutorial
 * @param {*} options
 */
function user_endpoint_types(options) {
  var promise = queryImpexp
    .exportEndpointTypes(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      templateUtil.collectBlocks(endpointTypes, options, this)
    )
  return templateUtil.templatePromise(this.global, promise)
}
/**
 * Creates cluster iterator over the endpoint types.
 * This works ony inside user_endpoint_types.
 *
 * @param {*} options
 */
function user_clusters(options) {
  var promise = queryImpexp
    .exportClustersFromEndpointType(this.global.db, this.endpointTypeId)
    .then((endpointClusters) =>
      templateUtil.collectBlocks(endpointClusters, options, this)
    )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Creates endpoint type cluster attribute iterator. This works only
 * inside user_clusters.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster attributes.
 */
function user_cluster_attributes(options) {
  var promise = queryImpexp
    .exportAttributesFromEndpointTypeCluster(
      this.global.db,
      this.parent.endpointTypeId,
      this.endpointClusterId
    )
    .then((endpointAttributes) =>
      templateUtil.collectBlocks(endpointAttributes, options, this)
    )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Creates endpoint type cluster command iterator. This works only inside
 * user_clusters.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function user_cluster_commands(options) {
  var promise = queryImpexp
    .exportCommandsFromEndpointTypeCluster(
      this.global.db,
      this.parent.endpointTypeId,
      this.endpointClusterId
    )
    .then((endpointAttributes) =>
      templateUtil.collectBlocks(endpointAttributes, options, this)
    )
  return templateUtil.templatePromise(this.global, promise)
}

function user_endpoint_type_count() {
  var promise = queryConfig.getEndpointTypeCount(
    this.global.db,
    this.global.sessionId
  )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Retrieve the number of endpoints which possess the specified
 * cluster type
 *
 * @param {*} clusterTypeId
 * @return Promise of the number of endpoint
 */
function user_endpoint_count_by_cluster(clusterTypeId, side) {
  var promise = queryConfig.getEndpointTypeCountByCluster(
    this.global.db,
    this.global.sessionId,
    clusterTypeId,
    side
  )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Iterates over all attributes required by the user configuration.
 *
 * @param {*} options
 * @return Promise of the resolved blocks iterating over cluster commands.
 */
function user_all_attributes(options) {
  var promise = queryConfig
    .getAllSessionAttributes(this.global.db, this.global.sessionId)
    .then((atts) => templateUtil.collectBlocks(atts, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * commands which have been enabled on added endpoints
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_user_cluster_commands(options) {
  var promise = queryImpexp
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
  return promise
  //return templateUtil.templatePromise(this.global, promise)
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
 * Creates cluster command iterator for all endpoints whitout any duplicates
 * cause by cluster side
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_user_clusters_names(options) {
  return queryImpexp
    .exportendPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportAllClustersNamesFromEndpointTypes(
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

/**
 * Check if the cluster (name) has any enabled commands. This works only inside
 * cluster block helpers.
 *
 * @param {*} name : Cluster name
 * @param {*} side : Cluster side
 * @returns True if cluster has enabled commands otherwise false
 */
function user_cluster_has_enabled_command(name, side) {
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
    .then((endpointCommands) => {
      var cmdCount = 0
      endpointCommands.forEach((command) => {
        if (helperZcl.isStrEqual(name, command.clusterName)) {
          if (
            helperZcl.isCommandAvailable(
              side,
              command.incoming,
              command.outgoing,
              command.commandSource,
              command.name
            )
          ) {
            cmdCount++
          }
        }
      })

      if (cmdCount == 0) {
        return false
      } else {
        return true
      }
    })
}

/**
 * Helper that resolves into a user session key value.
 *
 * @param {*} options
 * @returns Promise of value of the session key or undefined.
 */
async function user_session_key(options) {
  var key = options.hash.key
  var value = await queryConfig.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    key
  )
  if (options.hash.toupper == 'true' && value != null)
    return value.toUpperCase()
  else return value
}

async function user_manufacturer_code(options) {
  var value = await queryConfig.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    dbEnum.sessionOption.manufacturerCodes
  )
  if (options.hash.toupper == 'true' && value != null)
    return value.toUpperCase()
  else return value
}

async function user_default_response_policy(options) {
  var value = await queryConfig.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    dbEnum.sessionOption.defaultResponsePolicy
  )
  if (options.hash.toupper == 'true' && value != null)
    return value.toUpperCase()
  else return value
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
exports.user_endpoint_count_by_cluster = user_endpoint_count_by_cluster
exports.user_all_attributes = user_all_attributes
exports.all_user_cluster_commands = all_user_cluster_commands
exports.all_user_clusters = all_user_clusters
exports.all_user_clusters_names = all_user_clusters_names
exports.user_cluster_command_count_with_cli = user_cluster_command_count_with_cli
exports.user_cluster_commands_all_endpoints = user_cluster_commands_all_endpoints
exports.user_cluster_has_enabled_command = user_cluster_has_enabled_command
exports.user_session_key = user_session_key
exports.user_manufacturer_code = user_manufacturer_code
exports.user_default_response_policy = user_default_response_policy
