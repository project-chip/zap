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
const querySession = require('../db/query-session.js')
const queryZcl = require('../db/query-zcl.js')
const helperZcl = require('./helper-zcl.js')
const dbEnum = require('../../src-shared/db-enum.js')

/**
 * Creates block iterator over the endpoints.
 *
 * @param {*} options
 */
function user_endpoints(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryImpexp.exportEndpoints(
        this.global.db,
        this.global.sessionId,
        endpointTypes
      )
    )
    .then((endpoints) =>
      endpoints.map((x) => {
        x.endpointTypeId = x.endpointTypeRef
        return x
      })
    )
    .then((endpoints) => templateUtil.collectBlocks(endpoints, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Creates block iterator helper over the endpoint types.
 *
 * @tutorial template-tutorial
 * @param {*} options
 */
function user_endpoint_types(options) {
  let promise = queryImpexp
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
  let promise = queryImpexp
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
  let promise = queryImpexp
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
  let promise = queryImpexp
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
  let promise = queryConfig.getEndpointTypeCount(
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
  let promise = queryConfig.getEndpointTypeCountByCluster(
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
  let promise = queryConfig
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
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
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
}

/**
 *
 * @param name
 * @param side
 * @param options
 * @param currentContext
 * @param isManufacturingSpecific
 * @param isIrrespectiveOfManufacturingSpecification
 * Returns: Promise of the resolved blocks iterating over manufacturing specific,
 * non-manufacturing specific or both of the cluster commands.
 */
function all_user_cluster_command_util(
  name,
  side,
  options,
  currentContext,
  isManufacturingSpecific,
  isIrrespectiveOfManufacturingSpecification = false
) {
  let promise = queryImpexp
    .exportEndPointTypeIds(
      currentContext.global.db,
      currentContext.global.sessionId
    )
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        currentContext.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) => {
      if (isIrrespectiveOfManufacturingSpecification) {
        return queryZcl.exportCommandDetailsFromAllEndpointTypesAndClusters(
          currentContext.global.db,
          endpointsAndClusters
        )
      } else if (isManufacturingSpecific) {
        return queryZcl.exportManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
          currentContext.global.db,
          endpointsAndClusters
        )
      } else {
        return queryZcl.exportNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
          currentContext.global.db,
          endpointsAndClusters
        )
      }
    })
    .then(
      (endpointCommands) =>
        new Promise((resolve, reject) => {
          let availableCommands = []
          for (let i = 0; i < endpointCommands.length; i++) {
            if (helperZcl.isStrEqual(name, endpointCommands[i].clusterName)) {
              if (
                helperZcl.isCommandAvailable(
                  side,
                  endpointCommands[i].incoming,
                  endpointCommands[i].outgoing,
                  endpointCommands[i].commandSource,
                  endpointCommands[i].name
                )
              ) {
                availableCommands.push(endpointCommands[i])
              }
            }
          }
          resolve(availableCommands)
        })
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, currentContext)
    )
  return promise
}

function all_user_cluster_attribute_util(
  name,
  side,
  options,
  currentContext,
  isManufacturingSpecific,
  isIrrespectiveOfManufacturingSpecification = false
) {
  let promise = queryImpexp
    .exportEndPointTypeIds(
      currentContext.global.db,
      currentContext.global.sessionId
    )
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        currentContext.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      isIrrespectiveOfManufacturingSpecification
        ? queryZcl.exportAllAttributeDetailsFromEnabledClusters(
            currentContext.global.db,
            endpointsAndClusters
          )
        : isManufacturingSpecific
        ? queryZcl.exportManufacturerSpecificAttributeDetailsFromAllEndpointTypesAndClusters(
            currentContext.global.db,
            endpointsAndClusters
          )
        : queryZcl.exportNonManufacturerSpecificAttributeDetailsFromAllEndpointTypesAndClusters(
            currentContext.global.db,
            endpointsAndClusters
          )
    )
    .then(
      (endpointAttributes) =>
        new Promise((resolve, reject) => {
          let availableAttributes = []
          for (let i = 0; i < endpointAttributes.length; i++) {
            if (helperZcl.isStrEqual(name, endpointAttributes[i].clusterName)) {
              availableAttributes.push(endpointAttributes[i])
            }
          }
          resolve(availableAttributes)
        })
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, currentContext)
    )
  return promise
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * manufacturing specific commands which have been enabled on added endpoints
 *
 * @param options
 * @returns Promise of the resolved blocks iterating over manufacturing specific
 * cluster commands.
 */
function all_user_cluster_manufacturer_specific_commands(name, side, options) {
  return all_user_cluster_command_util(name, side, options, this, true)
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * non-manufacturing specific commands which have been enabled on added endpoints
 *
 * @param options
 * @returns Promise of the resolved blocks iterating over non-manufacturing specific
 * cluster commands.
 */
function all_user_cluster_non_manufacturer_specific_commands(
  name,
  side,
  options
) {
  return all_user_cluster_command_util(name, side, options, this, false)
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * manufacturing specific commands which have been enabled on added endpoints
 *
 * @param options
 * @returns Promise of the resolved blocks iterating over manufacturing specific
 * cluster commands.
 */
function all_user_cluster_manufacturer_specific_attributes(
  name,
  side,
  options
) {
  return all_user_cluster_attribute_util(name, side, options, this, true)
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * non-manufacturing specific commands which have been enabled on added endpoints
 *
 * @param options
 * @returns Promise of the resolved blocks iterating over non-manufacturing specific
 * cluster commands.
 */
function all_user_cluster_non_manufacturer_specific_attributes(
  name,
  side,
  options
) {
  return all_user_cluster_attribute_util(name, side, options, this, false)
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * commands which have been enabled on added endpoints
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_commands_for_user_enabled_clusters(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportAllCommandDetailsFromEnabledClusters(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}
/**
 * This helper returns all commands which have cli within the list of enabled
 * clusters.
 *
 * @param options
 * @returns all commands with cli from the list of enabled clusters
 *
 */
function all_cli_commands_for_user_enabled_clusters(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportAllCliCommandDetailsFromEnabledClusters(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * Creates cluster iterator for all endpoints.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_user_clusters(options) {
  return queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportAllClustersDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((clusters) => templateUtil.collectBlocks(clusters, options, this))
}

/**
 * Creates cluster command iterator for all endpoints.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_user_clusters_irrespective_of_side(options) {
  return queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportAllClustersDetailsIrrespectiveOfSideFromEndpointTypes(
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
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
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
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryImpexp.exportCliCommandCountFromEndpointTypeCluster(
        this.global.db,
        endpointTypes,
        this.endpointClusterId
      )
    )
}

/**
 * This helper works within the the cluster block helpers. It is used to get
 * all commands of the cluster which have cli associated with them.
 *
 * param options
 * Returns: all commands with cli for a cluster
 *
 * Example:
 * {{#all_user_clusters_irrespective_of_side}}
 *  {{#user_cluster_commands_with_cli}}
 *  {{/user_cluster_commands_with_cli}}
 * {{/all_user_clusters_irrespective_of_side}}
 */
function user_cluster_commands_with_cli(options) {
  return queryZcl
    .exportCliCommandsFromCluster(this.global.db, this.id)
    .then((cliCommands) =>
      templateUtil.collectBlocks(cliCommands, options, this)
    )
}

/**
 * Creates endpoint type cluster command iterator. This works only inside
 * cluster block helpers.
 *
 * @param options
 * Returns: Promise of the resolved blocks iterating over cluster commands.
 */
function user_cluster_commands_all_endpoints(options) {
  return queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
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
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
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
      let cmdCount = 0
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

      return cmdCount != 0
    })
}

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * manufacturing and non-manufaturing specific commands which have been enabled
 * on added endpoints
 *
 * @param options
 * @returns Promise of the resolved blocks iterating over manufacturing specific
 * and non-manufacturing specific cluster commands.
 */
function all_user_cluster_commands_irrespective_of_manufaturing_specification(
  name,
  side,
  options
) {
  return all_user_cluster_command_util(name, side, options, this, false, true)
}

/**
 * Creates endpoint type cluster attribute iterator. This fetches all
 * manufacturing and non-manufaturing specific attributes which have been enabled
 * on added endpoints
 *
 * @param options
 * @returns Promise of the resolved blocks iterating over manufacturing specific
 * and non-manufacturing specific cluster attributes.
 */
function all_user_cluster_attributes_irrespective_of_manufatucuring_specification(
  name,
  side,
  options
) {
  return all_user_cluster_attribute_util(name, side, options, this, false, true)
}

/**
 * Helper that resolves into a user session key value.
 *
 * @param {*} options
 * @returns Promise of value of the session key or undefined.
 */
async function user_session_key(options) {
  let key = options.hash.key
  let value = await querySession.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    key
  )
  if (options.hash.toupper == 'true' && value != null)
    return value.toUpperCase()
  else return value
}

async function user_manufacturer_code(options) {
  let value = await querySession.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    dbEnum.sessionOption.manufacturerCodes
  )
  if (options.hash.toupper == 'true' && value != null)
    return value.toUpperCase()
  else return value
}

async function user_default_response_policy(options) {
  let value = await querySession.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    dbEnum.sessionOption.defaultResponsePolicy
  )
  if (options.hash.toupper == 'true' && value != null)
    return value.toUpperCase()
  else return value
}

/*
 * @param {*} endpointTypeId
 * Returns the endpoint type identifier for an endpoint type
 */
function endpoint_type_identifier(endpointTypeId) {
  return queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryImpexp.exportEndpoints(
        this.global.db,
        this.global.sessionId,
        endpointTypes
      )
    )
    .then((endpoints) => {
      for (let i = 0; i < endpoints.length; i++) {
        if (endpointTypeId == endpoints[i].endpointTypeRef) {
          if (endpoints[i].endpointId == null) {
            return '0'
          } else {
            return `${endpoints[i].endpointId}`
          }
        }
      }
      return '0'
    })
}

/*
 * @param {*} endpointTypeId
 * Returns the index of the endpoint whose endpointTypeId is endpointTypeId
 * Will return -1 if the given endpoint type is not present.
 */
function endpoint_type_index(endpointTypeId) {
  return queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryImpexp.exportEndpoints(
        this.global.db,
        this.global.sessionId,
        endpointTypes
      )
    )
    .then((endpoints) => {
      for (let i = 0; i < endpoints.length; i++) {
        if (endpointTypeId == endpoints[i].endpointTypeRef) {
          return i
        }
      }
      return -1
    })
}

/**
 * Default values for the attributes longer than a pointer.
 * All attribute values with size greater than 2 bytes.
 * Excluding 0 values and externally saved values
 *
 * @param name
 * @param side
 * @param options
 * @returns Attribute values greater than 2 bytes and not 0 nor externally saved.
 */
function all_user_cluster_attributes_for_generated_defaults(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportAttributeBoundDetails(this.global.db, endpointsAndClusters)
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * Entails the list of all attributes which have been enabled. Given the
 * cluster is enabled as well. The helper retrieves the attributes across
 * all endpoints.
 * @param options
 * @returns enabled attributes
 */
function all_user_cluster_generated_attributes(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportAttributeDetailsFromEnabledClusters(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * Entails the list of reportable attributes which have been enabled. Given the
 * cluster is enabled as well. The helper retrieves the reportable attributes
 * per endpoint per cluster.
 * @param options
 * @returns Reportable attributes
 */
function all_user_reportable_attributes(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportReportableAttributeDetailsFromEnabledClustersAndEndpoints(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * All available cluster commands across all endpoints and clusters.
 * @param options
 * @returns All available cluster commands across all endpoints and clusters
 */
function all_user_cluster_generated_commands(options) {
  let promise = queryImpexp
    .exportUsedEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportAllAvailableClusterCommandDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * Entails the Cluster details per endpoint
 * @param {*} options
 * @returns Cluster Details per endpoint with attribute summaries within the clusters
 */
function generated_clustes_details(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportClusterDetailsFromEnabledClusters(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * Entails Endpoint type details along with their cluster summaries
 * @param options
 * @returns
 */
function generated_endpoint_type_details(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportEndpointDetailsFromAddedEndpoints(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * Returns attributes inside an endpoint type that either have a default or a
 * bounded attribute.
 *
 * @param name
 * @param side
 * @param options
 * @returns endpoints with bounds or defaults
 */
function all_user_cluster_attributes_min_max_defaults(options) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportAttributeDetailsWithABoundFromEnabledClusters(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then((endpointCommands) =>
      templateUtil.collectBlocks(endpointCommands, options, this)
    )
  return promise
}

/**
 * Extracts the index of generated defaults array which come from
 * all_user_cluster_attributes_for_generated_defaults
 * @param clusterName
 * @param attributeName
 * @param attributeValueType
 * @param attributeValue
 * @param prefixReturn
 * @param postFixReturn
 * @returns index of the generated default array
 */
function generated_defaults_index(
  clusterName,
  attributeName,
  attributeValueType,
  attributeValue,
  prefixReturn,
  postFixReturn
) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportAttributeBoundDetails(this.global.db, endpointsAndClusters)
    )
    .then(
      (endpointAttributes) =>
        new Promise((resolve, reject) => {
          let dataPtr = attributeValue
          for (let i = 0; i < endpointAttributes.length; i++) {
            if (
              endpointAttributes[i].clusterName === clusterName &&
              endpointAttributes[i].name === attributeName &&
              endpointAttributes[i].attributeValueType === attributeValueType
            ) {
              if (endpointAttributes[i].arrayIndex) {
                dataPtr = endpointAttributes[i].arrayIndex
              } else {
                dataPtr = 0
              }
            }
          }
          if (dataPtr === attributeValue) {
            if (dataPtr) {
              dataPtr = '(uint8_t*)' + dataPtr
            } else {
              dataPtr = 'NULL'
            }
          } else {
            dataPtr = prefixReturn + dataPtr + postFixReturn
          }
          resolve(dataPtr)
        })
    )

  return promise
}

/**
 *
 * Extracts the index of generated min max defaults array which come from
 * all_user_cluster_attributes_min_max_defaults
 * @param name
 * @param side
 * @param options
 * @returns index of the generated min max default array
 */
function generated_attributes_min_max_index(clusterName, attributeName) {
  let promise = queryImpexp
    .exportEndPointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryZcl.exportClustersAndEndpointDetailsFromEndpointTypes(
        this.global.db,
        endpointTypes
      )
    )
    .then((endpointsAndClusters) =>
      queryZcl.exportAttributeDetailsWithABoundFromEnabledClusters(
        this.global.db,
        endpointsAndClusters
      )
    )
    .then(
      (endpointAttributes) =>
        new Promise((resolve, reject) => {
          let dataPtr = 0
          for (let i = 0; i < endpointAttributes.length; i++) {
            if (
              endpointAttributes[i].clusterName === clusterName &&
              endpointAttributes[i].name === attributeName
            ) {
              dataPtr = i
            }
          }
          resolve(dataPtr)
        })
    )
  return promise
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.user_endpoint_types = user_endpoint_types
exports.user_endpoints = user_endpoints
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
exports.endpoint_type_identifier = endpoint_type_identifier
exports.endpoint_type_index = endpoint_type_index
exports.all_commands_for_user_enabled_clusters = all_commands_for_user_enabled_clusters
exports.all_user_clusters_irrespective_of_side = all_user_clusters_irrespective_of_side
exports.all_user_cluster_manufacturer_specific_commands = all_user_cluster_manufacturer_specific_commands
exports.all_user_cluster_non_manufacturer_specific_commands = all_user_cluster_non_manufacturer_specific_commands
exports.user_cluster_commands_with_cli = user_cluster_commands_with_cli
exports.all_cli_commands_for_user_enabled_clusters = all_cli_commands_for_user_enabled_clusters
exports.all_user_cluster_commands_irrespective_of_manufaturing_specification = all_user_cluster_commands_irrespective_of_manufaturing_specification
exports.all_user_cluster_manufacturer_specific_attributes = all_user_cluster_manufacturer_specific_attributes
exports.all_user_cluster_non_manufacturer_specific_attributes = all_user_cluster_non_manufacturer_specific_attributes
exports.all_user_cluster_attributes_irrespective_of_manufatucuring_specification = all_user_cluster_attributes_irrespective_of_manufatucuring_specification
exports.all_user_cluster_attributes_for_generated_defaults = all_user_cluster_attributes_for_generated_defaults
exports.all_user_cluster_generated_attributes = all_user_cluster_generated_attributes
exports.all_user_reportable_attributes = all_user_reportable_attributes
exports.all_user_cluster_generated_commands = all_user_cluster_generated_commands
exports.generated_clustes_details = generated_clustes_details
exports.generated_endpoint_type_details = generated_endpoint_type_details
exports.all_user_cluster_attributes_min_max_defaults = all_user_cluster_attributes_min_max_defaults
exports.generated_defaults_index = generated_defaults_index
exports.generated_attributes_min_max_index = generated_attributes_min_max_index
