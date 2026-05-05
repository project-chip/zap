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
 * This module contains the API for templating helpers that operate on the
 * **user-data session** with a **per-endpoint (unshared) configuration**
 * lens.
 *
 * Classification criterion (objective, based on the underlying SQL):
 * a block helper belongs in this module if its underlying SQL query
 * includes `ENDPOINT.ENDPOINT_IDENTIFIER` (or an equivalent endpoint-
 * identifying column) in its `GROUP BY` clause — either unconditionally
 * (pure per-endpoint) or conditionally on the `SINGLETON` flag (singleton-
 * aware hybrid). In both cases the result contains at least some rows
 * keyed by endpoint, so the iteration body may run once per
 * (endpoint, cluster) tuple. Helpers backed by per-endpoint exporters
 * (`exportClustersFromEndpointType`, `exportAttributesFromEndpointTypeCluster`,
 * etc.) also belong here because they take a single `endpointTypeId` /
 * `endpointClusterId` and are called inside a per-endpoint block.
 *
 * Inside such a block, fields like enabled/disabled state, default values,
 * reporting configuration and the `SINGLETON` flag can differ between
 * endpoints that share the same cluster code. The body of the iterator
 * therefore runs once per (endpoint, cluster) tuple — not once per unique
 * cluster.
 *
 * This module also hosts session-level utility helpers (manufacturer code,
 * default response policy, session keys, endpoint type lookups, etc.) that
 * do not iterate but rely on the same per-session user data.
 *
 * Counterpart helpers whose underlying SQL `GROUP BY` does **not** include
 * `ENDPOINT.ENDPOINT_IDENTIFIER` — i.e. helpers that aggregate across all
 * endpoints and emit a single shared record per common cluster (for global
 * dispatcher tables, generated-defaults arrays, etc.) — live in the
 * `Templating API: Shared cross-endpoint configuration helpers` module
 * (`src-electron/generator/helper-shared-config.js`).
 *
 * For more detailed instructions, read {@tutorial template-tutorial}.
 *
 * @module Templating API: user-data specific helpers
 */

const templateUtil = require('./template-util.js')
const queryImpexp = require('../db/query-impexp.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryCommand = require('../db/query-command.js')
const queryConfig = require('../db/query-config.js')
const querySession = require('../db/query-session.js')
const queryAttribute = require('../db/query-attribute.js')
const queryCluster = require('../db/query-cluster.js')
const helperZcl = require('./helper-zcl.js')
const dbEnum = require('../../src-shared/db-enum.js')
const queryDeviceType = require('../db/query-device-type.js')

/**
 * Creates block iterator over the endpoints.
 *
 * @param {*} options
 */
function user_endpoints(options) {
  let promise = templateUtil
    .ensureTemplatePackageCategory(this)
    .then((packageInfoCategory) =>
      Promise.all([
        queryEndpointType.selectAllEndpointTypes(
          this.global.db,
          this.global.sessionId
        ),
        templateUtil
          .ensureEndpointTypeIds(this)
          .then((endpointTypes) =>
            queryImpexp.exportEndpoints(
              this.global.db,
              this.global.sessionId,
              endpointTypes
            )
          )
      ])
        .then(
          (EptEp) =>
            new Promise((resolve, reject) => {
              let endpointTypeMap = {}
              let endpointTypes = EptEp[0]
              let endpoints = EptEp[1]
              endpointTypes.forEach(
                (ept) =>
                  (endpointTypeMap[ept.endpointTypeId] = {
                    deviceVersions: ept.deviceVersion,
                    deviceIdentifiers: ept.deviceIdentifier,
                    deviceCategories: ept.deviceCategory
                  })
              )
              // Adding device Identifiers and versions to endpoints from endpoint types
              endpoints.forEach((ep) => {
                ep.deviceIdentifier =
                  endpointTypeMap[ep.endpointTypeRef].deviceIdentifiers
                ep.endpointVersion =
                  endpointTypeMap[ep.endpointTypeRef].deviceVersions
                ep.endpointCategories =
                  endpointTypeMap[ep.endpointTypeRef].deviceCategories
              })
              resolve(endpoints)
            })
        )
        .then((endpoints) =>
          packageInfoCategory
            ? endpoints.filter(
                (ep) =>
                  ep.endpointCategories.includes(packageInfoCategory) ||
                  ep.endpointCategories.includes(undefined) ||
                  ep.endpointCategories.includes(null)
              )
            : endpoints
        )
        .then((endpoints) =>
          endpoints.map((x) => {
            x.endpointTypeId = x.endpointTypeRef
            return x
          })
        )
        .then((endpoints) =>
          templateUtil.collectBlocks(endpoints, options, this)
        )
    )

  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Creates device type iterator over an endpoint type id.
 * This works inside user_endpoints or user_endpoint_types.
 * From `exports.map.endpointTypeDeviceExtended` in `src-electron/db/db-mapping.js`:
 * - clusterId
 * - composition
 * - conformance
 * - deviceId
 * - deviceIdentifier
 * - deviceTypeOrder
 * - deviceTypeRef
 * - deviceVersion
 * - endpointTypeId
 * - endpointTypeRef
 * - featureBit
 * - featureCode
 * - featureId
 * - featureName
 * - id
 * @param {*} options
 */
async function user_device_types(options) {
  let promise = queryDeviceType
    .selectDeviceTypesWithCompositionByEndpointTypeId(
      this.global.db,
      this.endpointTypeId
    )
    .then((deviceTypes) =>
      templateUtil.collectBlocks(deviceTypes, options, this)
    )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Creates iterator over endpoint composition requirements for a device type.
 * This works inside user_device_types context where device type ref is available.
 * Returns required device types that must be on separate endpoints.
 * From `exports.map.endpointCompositionRequirement` in `src-electron/db/db-mapping.js`:
 * - compositionType
 * - conformance
 * - deviceConstraint
 * - endpointCompositionId
 * - requiredDeviceCode
 * - requiredDeviceName
 * - requiredDeviceTypeRef
 * @param {*} options
 */
async function user_endpoint_composition_requirements(options) {
  if (!this.deviceTypeRef) {
    throw new Error(
      'user_endpoint_composition_requirements must be called within user_device_types context'
    )
  }
  let promise = queryDeviceType
    .selectEndpointCompositionRequirementsByDeviceTypeRef(
      this.global.db,
      this.deviceTypeRef
    )
    .then((requirements) =>
      templateUtil.collectBlocks(requirements, options, this)
    )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Creates block iterator helper over the endpoint types.
 * From `exports.map.endpointType` in `src-electron/db/db-mapping.js`:
 * - deviceTypeRef
 * - deviceTypes
 * - endpointTypeId
 * - id
 * - name
 * - sessionRef
 * Also populated in `query-endpoint-type.selectAllEndpointTypes`:
 * - deviceCategory
 * - deviceIdentifier
 * - devicePackageRef
 * - deviceTypeCode
 * - deviceTypeName
 * - deviceVersion
 *
 * @tutorial template-tutorial
 * @param {*} options
 */
function user_endpoint_types(options) {
  let promise = queryEndpointType
    .selectAllEndpointTypes(this.global.db, this.global.sessionId)
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

/**
 * Creates endpoint type cluster event iterator. This works only inside
 * user_clusters.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster events.
 */
function user_cluster_events(options) {
  let promise = queryImpexp
    .exportEventsFromEndpointTypeCluster(this.global.db, this.endpointClusterId)
    .then((endpointEvents) =>
      templateUtil.collectBlocks(endpointEvents, options, this)
    )
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Get count of total endpoint types.
 *
 * @returns count of total endpoint types
 */
function user_endpoint_type_count() {
  let promise = queryConfig.selectEndpointTypeCount(
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
  let promise = queryConfig.selectEndpointTypeCountByCluster(
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
    .selectAllSessionAttributes(this.global.db, this.global.sessionId)
    .then((atts) => templateUtil.collectBlocks(atts, options, this))
  return templateUtil.templatePromise(this.global, promise)
}

/**
 * Get the count of the number of clusters commands with cli for a cluster.
 * This is used under a cluster block helper
 */
async function user_cluster_command_count_with_cli() {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  return queryCommand.selectCliCommandCountFromEndpointTypeCluster(
    this.global.db,
    endpointTypes,
    this.endpointClusterId,
    packageIds
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
async function user_cluster_commands_with_cli(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let cliCommands = await queryCommand.selectCliCommandsFromCluster(
    this.global.db,
    this.id,
    packageIds
  )
  return templateUtil.collectBlocks(cliCommands, options, this)
}

/**
 * Creates endpoint type cluster command iterator. This works only inside
 * cluster block helpers.
 *
 * @param options
 * Returns: Promise of the resolved blocks iterating over cluster commands.
 */
async function user_cluster_commands_all_endpoints(options) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointCommands =
    await queryEndpointType.selectCommandDetailsFromAllEndpointTypeCluster(
      this.global.db,
      endpointTypes,
      this.endpointClusterId,
      packageIds
    )
  return endpointsAndClusterstemplateUtil.collectBlocks(
    endpointCommands,
    options,
    this
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
async function user_cluster_has_enabled_command(name, side) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  let endpointCommands =
    await queryCommand.selectCommandDetailsFromAllEndpointTypesAndClusters(
      this.global.db,
      endpointsAndClusters,
      false,
      packageIds
    )
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

/**
 * If helper that checks if command discovery is enabled
 *
 * example:
 * {{#if_command_discovery_enabled}}
 * command discovery is enabled
 * {{else}}
 * command discovery is not enabled
 * {{/if_command_discovery_enabled}}
 */
async function if_command_discovery_enabled(options) {
  const key = 'commandDiscovery'
  let value = await querySession.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    key
  )
  if (value == 1) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
}

/**
 * Get Session's manufacturer code.
 *
 * @param {*} options
 * @returns session's manufacturer code
 */
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

/**
 * Get user's default response policy selected.
 *
 * @param {*} options
 * @returns user's default response policy selected
 */
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

/**
 * An if helper to check if default response for a command is enabled or not.
 * @param {*} command
 * @param {*} options
 * @returns true if the the default response policy is either always or
 * when the policy is not never and the command has the disable default
 * response policy set to false(not true)
 */
async function is_command_default_response_enabled(command, options) {
  let defaultRespPolicy = await querySession.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    dbEnum.sessionOption.defaultResponsePolicy
  )
  if (
    defaultRespPolicy.toUpperCase() == 'ALWAYS' ||
    (defaultRespPolicy.toUpperCase() != 'NEVER' &&
      command.isDefaultResponseEnabled)
  ) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
}

/**
 * An if helper to check if default response for a command is disabled or not.
 * @param {*} command
 * @param {*} options
 * @returns true if the the default response policy is either never or
 * when the policy is not always and the command has the disable default
 * response policy set to true(for eg disableDefaultResponse="true" in xml).
 */
async function is_command_default_response_disabled(command, options) {
  let defaultRespPolicy = await querySession.getSessionKeyValue(
    this.global.db,
    this.global.sessionId,
    dbEnum.sessionOption.defaultResponsePolicy
  )
  if (
    defaultRespPolicy.toUpperCase() == 'NEVER' ||
    (defaultRespPolicy.toUpperCase() != 'ALWAYS' &&
      !command.isDefaultResponseEnabled)
  ) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
}

/**
 * Get endpoint identifier from the given endpoint type ID.
 * @param {*} endpointTypeId
 * @returns the endpoint type identifier for an endpoint type
 */
async function endpoint_type_identifier(endpointTypeId) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpoints = await queryImpexp.exportEndpoints(
    this.global.db,
    this.global.sessionId,
    endpointTypes
  )
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
}

/**
 * Get the index of the endpoint whose endpointTypeId is endpointTypeId
 * Will return -1 if the given endpoint type is not present.
 * @param {*} endpointTypeId
 * @returns integer
 */
async function endpoint_type_index(endpointTypeId) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpoints = await queryImpexp.exportEndpoints(
    this.global.db,
    this.global.sessionId,
    endpointTypes
  )
  for (let i = 0; i < endpoints.length; i++) {
    if (endpointTypeId == endpoints[i].endpointTypeRef) {
      return i
    }
  }
  return -1
}

/**
 * Entails the Cluster details per endpoint.
 *
 * Per-endpoint helper: the underlying SQL query
 * (`selectClusterDetailsFromEnabledClusters`) groups by
 * `ENDPOINT.ENDPOINT_IDENTIFIER, CLUSTER.NAME, ENDPOINT_TYPE_CLUSTER.SIDE,
 * ATTRIBUTE.NAME`, so it returns one row per (endpoint, cluster, side).
 * @param {*} options
 * @returns Cluster Details per endpoint with attribute summaries within the clusters
 */
async function generated_clustes_details(options) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )
  let clusterDetails =
    await queryCluster.selectClusterDetailsFromEnabledClusters(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  return templateUtil.collectBlocks(clusterDetails, options, this)
}

/**
 * Entails Endpoint type details along with their cluster summaries.
 *
 * Per-endpoint helper: the underlying SQL query
 * (`selectEndpointDetailsFromAddedEndpoints`) groups by
 * `ENDPOINT.ENDPOINT_IDENTIFIER, ...`, so it returns one row per endpoint.
 * @param options
 * @returns Endpoint type details along with their cluster summaries
 */
async function generated_endpoint_type_details(options) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )
  let endpointDetails =
    await queryEndpointType.selectEndpointDetailsFromAddedEndpoints(
      this.global.db,
      endpointsAndClusters
    )
  return templateUtil.collectBlocks(endpointDetails, options, this)
}

/**
 * Entails the list of reportable attributes which have been enabled. Given the
 * cluster is enabled as well. The helper retrieves the reportable attributes
 * per endpoint per cluster.
 *
 * Per-endpoint helper (singleton-aware hybrid): the underlying SQL query
 * (`selectReportableAttributeDetailsFromEnabledClustersAndEndpoints`) groups
 * by `CASE WHEN SINGLETON=0 THEN ENDPOINT.ENDPOINT_IDENTIFIER END,
 * CLUSTER..., ATTRIBUTE...`, so non-singleton attributes get one row per
 * endpoint while singleton attributes (shared across endpoints with the same
 * cluster) get a single row.
 * @param options
 * @returns Reportable attributes
 */
async function all_user_reportable_attributes(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )
  let endpointAttributes =
    await queryAttribute.selectReportableAttributeDetailsFromEnabledClustersAndEndpoints(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  return templateUtil.collectBlocks(endpointAttributes, options, this)
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
exports.user_cluster_events = user_cluster_events
exports.user_endpoint_type_count = user_endpoint_type_count
exports.user_endpoint_count_by_cluster = user_endpoint_count_by_cluster
exports.user_all_attributes = user_all_attributes
exports.user_cluster_command_count_with_cli =
  user_cluster_command_count_with_cli
exports.user_cluster_commands_all_endpoints =
  user_cluster_commands_all_endpoints
exports.user_cluster_has_enabled_command = user_cluster_has_enabled_command
exports.user_session_key = user_session_key
exports.user_manufacturer_code = user_manufacturer_code
exports.user_default_response_policy = user_default_response_policy
exports.endpoint_type_identifier = endpoint_type_identifier
exports.endpoint_type_index = endpoint_type_index
exports.user_cluster_commands_with_cli = user_cluster_commands_with_cli
exports.if_command_discovery_enabled = if_command_discovery_enabled
exports.is_command_default_response_enabled =
  is_command_default_response_enabled
exports.is_command_default_response_disabled =
  is_command_default_response_disabled
exports.user_device_types = user_device_types
exports.user_endpoint_composition_requirements =
  user_endpoint_composition_requirements
exports.generated_clustes_details = generated_clustes_details
exports.generated_endpoint_type_details = generated_endpoint_type_details
exports.all_user_reportable_attributes = all_user_reportable_attributes
