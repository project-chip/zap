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
 * This module contains the API for templating block helpers that emit
 * **shared configuration across endpoints for common clusters**.
 *
 * Classification criterion (objective, based on the underlying SQL):
 * a helper belongs in this module if and only if its underlying SQL query
 * does **not** include `ENDPOINT.ENDPOINT_IDENTIFIER` (or any equivalent
 * endpoint-identifying column) in its `GROUP BY` clause. Such queries
 * collapse rows across endpoints, so each unique (cluster, side) — or
 * (cluster, attribute, side), or (cluster, command) — appears only once
 * in the result regardless of how many endpoints declare it.
 *
 * In ZAP terminology a "common cluster" is a cluster (identified by code
 * and side) that appears on more than one endpoint in the user's
 * configuration. Helpers in this module return the configuration that is
 * shared across those instances. The iteration body of a block helper here
 * therefore runs once per unique cluster / attribute / command — not once
 * per (endpoint, cluster) pair.
 *
 * Use these helpers when the generated artifact is global (e.g. a single
 * dispatcher table, a generated-defaults array, or a project-wide manifest)
 * and does not need to differ between endpoints that share the same cluster.
 *
 * Counterpart per-endpoint helpers (whose underlying SQL query groups by
 * `ENDPOINT.ENDPOINT_IDENTIFIER` and whose body therefore executes once per
 * (endpoint, cluster) tuple, allowing per-endpoint defaults / reporting /
 * enabled state) live in the
 * `Templating API: user-data specific helpers` module
 * (`src-electron/generator/helper-session.js`). Singleton-aware hybrid
 * helpers (whose `GROUP BY` conditionally includes
 * `ENDPOINT.ENDPOINT_IDENTIFIER` based on the `SINGLETON` flag) also live
 * in that module since they emit per-endpoint rows for non-singleton
 * attributes.
 *
 * For more detailed instructions, read {@tutorial template-tutorial}.
 *
 * @module Templating API: Shared cross-endpoint configuration helpers
 */

const templateUtil = require('./template-util.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryCommand = require('../db/query-command.js')
const queryAttribute = require('../db/query-attribute.js')
const queryPackage = require('../db/query-package.js')
const helperZcl = require('./helper-zcl.js')
const iteratorUtil = require('../util/iterator-util.js')

/**
 * Creates endpoint type cluster command iterator. This fetches all
 * commands which have been enabled on added endpoints
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
function all_user_cluster_commands(options) {
  let promise = iteratorUtil.all_user_cluster_commands_helper
    .call(this, options)
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
async function all_user_cluster_command_util(
  name,
  side,
  options,
  currentContext,
  isManufacturingSpecific,
  isIrrespectiveOfManufacturingSpecification = false
) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(currentContext)
  let packageIds = await templateUtil.ensureZclPackageIds(currentContext)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      currentContext.global.db,
      endpointTypes
    )
  let endpointCommands
  if (isIrrespectiveOfManufacturingSpecification) {
    endpointCommands =
      await queryCommand.selectCommandDetailsFromAllEndpointTypesAndClusters(
        currentContext.global.db,
        endpointsAndClusters,
        true,
        packageIds
      )
  } else if (isManufacturingSpecific) {
    endpointCommands =
      await queryCommand.selectManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
        currentContext.global.db,
        endpointsAndClusters,
        packageIds
      )
  } else {
    endpointCommands =
      await queryCommand.selectNonManufacturerSpecificCommandDetailsFromAllEndpointTypesAndClusters(
        currentContext.global.db,
        endpointsAndClusters,
        packageIds
      )
  }

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
  return templateUtil.collectBlocks(availableCommands, options, currentContext)
}

/**
 * Get attribute details based on given arguments.
 *
 * @param {*} name
 * @param {*} side
 * @param {*} options
 * @param {*} currentContext
 * @param {*} isManufacturingSpecific
 * @param {*} isIrrespectiveOfManufacturingSpecification
 * @returns Attribute details
 */
async function all_user_cluster_attribute_util(
  name,
  side,
  options,
  currentContext,
  isManufacturingSpecific,
  isIrrespectiveOfManufacturingSpecification = false
) {
  let packageIds = await templateUtil.ensureZclPackageIds(currentContext)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(currentContext)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      currentContext.global.db,
      endpointTypes
    )

  let endpointAttributes

  if (isIrrespectiveOfManufacturingSpecification) {
    endpointAttributes =
      await queryAttribute.selectAllAttributeDetailsFromEnabledClusters(
        currentContext.global.db,
        endpointsAndClusters,
        packageIds,
        side
      )
  } else if (isManufacturingSpecific) {
    endpointAttributes =
      await queryAttribute.selectManufacturerSpecificAttributeDetailsFromAllEndpointTypesAndClusters(
        currentContext.global.db,
        endpointsAndClusters,
        packageIds
      )
  } else {
    endpointAttributes =
      await queryAttribute.selectNonManufacturerSpecificAttributeDetailsFromAllEndpointTypesAndClusters(
        currentContext.global.db,
        endpointsAndClusters,
        packageIds
      )
  }
  if ('removeKeys' in options.hash) {
    let keys = options.hash.removeKeys.split(',').map((k) => k.trim())
    endpointAttributes.forEach((attr) => keys.forEach((k) => delete attr[k]))
  }

  let availableAttributes = []
  for (let i = 0; i < endpointAttributes.length; i++) {
    if (helperZcl.isStrEqual(name, endpointAttributes[i].clusterName)) {
      availableAttributes.push(endpointAttributes[i])
    }
  }
  return templateUtil.collectBlocks(
    availableAttributes,
    options,
    currentContext
  )
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
async function all_commands_for_user_enabled_clusters(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )
  let endpointCommands =
    await queryCommand.selectAllCommandDetailsFromEnabledClusters(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  return templateUtil.collectBlocks(endpointCommands, options, this)
}

/**
 * This helper returns all commands which have cli within the list of enabled
 * clusters.
 *
 * @param options
 * @returns all commands with cli from the list of enabled clusters
 *
 */
async function all_cli_commands_for_user_enabled_clusters(options) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  let endpointCommands =
    await queryCommand.selectAllCliCommandDetailsFromEnabledClusters(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  return templateUtil.collectBlocks(endpointCommands, options, this)
}

/**
 * Creates cluster iterator for all endpoints.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
async function all_user_clusters(options) {
  let side = null
  if (options && options.hash) {
    side = options.hash.side
  }

  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)

  let clusters =
    await queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes,
      side
    )

  return templateUtil.collectBlocks(clusters, options, this)
}

/**
 * Creates cluster command iterator for all endpoints.
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
async function all_user_clusters_irrespective_of_side(options) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)

  let clusters =
    await queryEndpointType.selectAllClustersDetailsIrrespectiveOfSideFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  return templateUtil.collectBlocks(clusters, options, this)
}

/**
 * Creates cluster command iterator for all endpoints whitout any duplicates
 * cause by cluster side
 *
 * @param {*} options
 * @returns Promise of the resolved blocks iterating over cluster commands.
 */
async function all_user_clusters_names(options) {
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let clusters =
    await queryEndpointType.selectAllClustersNamesFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  return templateUtil.collectBlocks(clusters, options, this)
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
 * manufacturer-specific and standard attributes which have been enabled on
 * added endpoints based on the name and side of the cluster. When side
 * is not mentioned then client and server attributes are returned.
 * Available Options:
 * - removeKeys: Removes one or more keys from the map(for eg keys in db-mapping.js)
 * for eg:(#enabled_attributes_for_cluster_and_side
 *          [cluster-name], [cluster-side], removeKeys='isOptional, isNullable')
 * will remove 'isOptional' and 'isNullable' from the results
 *
 * @param name
 * @param side
 * @param options
 * @returns Promise of the resolved blocks iterating over manufacturing specific
 * and standard cluster attributes.
 */
function enabled_attributes_for_cluster_and_side(name, side, options) {
  return all_user_cluster_attribute_util(name, side, options, this, false, true)
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
async function all_user_cluster_attributes_for_generated_defaults(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )
  let endpointAttributes = await queryAttribute.selectAttributeBoundDetails(
    this.global.db,
    endpointsAndClusters,
    packageIds
  )
  return templateUtil.collectBlocks(endpointAttributes, options, this)
}

/**
 * Entails the list of all attributes which have been enabled. Given the
 * cluster is enabled as well. The helper retrieves the attributes across
 * all endpoints.
 * @param options
 * @returns enabled attributes
 */
async function all_user_cluster_generated_attributes(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )
  let endpointAttributes =
    await queryAttribute.selectAttributeDetailsFromEnabledClusters(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  return templateUtil.collectBlocks(endpointAttributes, options, this)
}

/**
 * All available cluster commands across all endpoints and clusters.
 * @param options
 * @returns All available cluster commands across all endpoints and clusters
 */
async function all_user_cluster_generated_commands(options) {
  let endpointTypes = await queryEndpointType.selectUsedEndpointTypeIds(
    this.global.db,
    this.global.sessionId
  )
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointCommands =
    await queryCommand.selectAllAvailableClusterCommandDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes,
      packageIds
    )
  return templateUtil.collectBlocks(endpointCommands, options, this)
}

/**
 * Util function for all clusters with side that have available incoming or
 * outgiong commands across all endpoints.
 * @param options
 * @param is_incoming boolean to check if commands are incoming or outgoing
 * @returns All clusters with side that have available incoming or outgiong
 * commands across all endpoints.
 */
async function all_user_clusters_with_incoming_or_outgoing_commands(
  options,
  currentContext,
  isIncoming
) {
  let packageIds = await templateUtil.ensureZclPackageIds(currentContext)
  let endpointTypes = await queryEndpointType.selectUsedEndpointTypeIds(
    currentContext.global.db,
    currentContext.global.sessionId
  )
  if (isIncoming) {
    if (
      'uniqueClusterCodes' in options.hash &&
      options.hash.uniqueClusterCodes == 'true'
    ) {
      let clustersWithIncomingCommands =
        await queryCommand.selectAllClustersWithIncomingCommands(
          currentContext.global.db,
          endpointTypes,
          true,
          packageIds
        )
      return templateUtil.collectBlocks(
        clustersWithIncomingCommands,
        options,
        currentContext
      )
    } else {
      let clustersWithIncomingCommands =
        await queryCommand.selectAllClustersWithIncomingCommands(
          currentContext.global.db,
          endpointTypes,
          false,
          packageIds
        )
      return templateUtil.collectBlocks(
        clustersWithIncomingCommands,
        options,
        currentContext
      )
    }
  } else {
    if (
      'uniqueClusterCodes' in options.hash &&
      options.hash.uniqueClusterCodes == 'true'
    ) {
      let clustersWithOutgoingCommands =
        await queryCommand.selectAllClustersWithOutgoingCommands(
          currentContext.global.db,
          endpointTypes,
          true,
          packageIds
        )
      return templateUtil.collectBlocks(
        clustersWithOutgoingCommands,
        options,
        currentContext
      )
    } else {
      let clustersWithOutgoingCommands =
        await queryCommand.selectAllClustersWithOutgoingCommands(
          currentContext.global.db,
          endpointTypes,
          false,
          packageIds
        )
      return templateUtil.collectBlocks(
        clustersWithOutgoingCommands,
        options,
        currentContext
      )
    }
  }
}

/**
 * All clusters with side that have available incoming commands
 * @param options
 * @returns All clusters with side that have available incoming commands across
 * all endpoints.
 */
function all_user_clusters_with_incoming_commands(options) {
  return all_user_clusters_with_incoming_or_outgoing_commands(
    options,
    this,
    true
  )
}

/**
 * All clusters with side that have available outgoing commands
 * @param options
 * @returns All clusters with side that have available outgoing commands across
 * all endpoints.
 */
async function all_user_clusters_with_outgoing_commands(options) {
  return all_user_clusters_with_incoming_or_outgoing_commands(
    options,
    this,
    false
  )
}

/**
 * Provide all manufacturing specific clusters that have incoming commands with
 * the given cluster code.
 * @param clusterCode
 * @param options
 * @returns Details of manufacturing specific clusters that have incoming
 * commands with the given cluster code
 */
async function manufacturing_clusters_with_incoming_commands(
  clusterCode,
  options
) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  return queryEndpointType
    .selectUsedEndpointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryCommand.selectMfgClustersWithIncomingCommandsForClusterCode(
        this.global.db,
        endpointTypes,
        clusterCode,
        packageIds
      )
    )
    .then((clustersWithIncomingCommands) =>
      templateUtil.collectBlocks(clustersWithIncomingCommands, options, this)
    )
}

/**
 * All clusters that have available incoming commands.
 * If there is a client and server enabled on the endpoint, this combines them
 * into a single entry.
 * @param options
 * @returns All clusters that have available incoming commands across
 * all endpoints.
 */
async function all_user_clusters_with_incoming_commands_combined(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  return queryEndpointType
    .selectUsedEndpointTypeIds(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      queryCommand.selectAllClustersWithIncomingCommandsCombined(
        this.global.db,
        endpointTypes,
        packageIds
      )
    )
    .then((clustersWithIncomingCommands) =>
      templateUtil.collectBlocks(clustersWithIncomingCommands, options, this)
    )
}

/**
 * All commands that need to be parsed for a given cluster. This takes in booleans
 * for if the client and or server are included.
 * @param clusterName
 * @param clientSide
 * @param serverSide
 * @param options
 * @returns all commands that need to be parsed for a given cluster
 */
async function all_incoming_commands_for_cluster_combined(
  clusterName,
  clientSide,
  serverSide,
  options
) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let isMfgSpec =
    'isMfgSpecific' in options.hash
      ? options.hash.isMfgSpecific.toLowerCase() === 'true'
      : undefined
  let endpointTypes = await queryEndpointType.selectUsedEndpointTypeIds(
    this.global.db,
    this.global.sessionId
  )

  let clustersWithIncomingCommands =
    await queryCommand.selectAllIncomingCommandsForClusterCombined(
      this.global.db,
      endpointTypes,
      clusterName,
      clientSide,
      serverSide,
      isMfgSpec,
      packageIds
    )

  return templateUtil.collectBlocks(clustersWithIncomingCommands, options, this)
}

/**
 * Get all incoming commands in the user configuration.
 *
 * @param {*} options
 * @returns all incoming commands enabled by the user.
 */
async function all_user_incoming_commands_for_all_clusters(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let isMfgSpec =
    'isMfgSpecific' in options.hash
      ? options.hash.isMfgSpecific.toLowerCase() === 'true'
      : undefined

  let endpointTypes = await queryEndpointType.selectUsedEndpointTypeIds(
    this.global.db,
    this.global.sessionId
  )

  let clustersWithIncomingCommands =
    await queryCommand.selectAllIncomingCommands(
      this.global.db,
      endpointTypes,
      isMfgSpec,
      packageIds
    )

  return templateUtil.collectBlocks(clustersWithIncomingCommands, options, this)
}

/**
  * A util function for all incoming or outgoing commands that need to be parsed
  * for a given cluster
  * @param clusterName
  * @param clusterSide
  * @param isIncoming
  * @param options
  * @returns All incoming or outgoing commands that need to be parsed for a given
 cluster
  */
async function all_incoming_or_outgoing_commands_for_cluster(
  clusterName,
  clusterSide,
  isIncoming,
  options,
  currentContext
) {
  let packageIds = await templateUtil.ensureZclPackageIds(currentContext)
  let isMfgSpec =
    'isMfgSpecific' in options.hash
      ? options.hash.isMfgSpecific.toLowerCase() === 'true'
      : undefined

  let endpointTypes = await queryEndpointType.selectUsedEndpointTypeIds(
    currentContext.global.db,
    currentContext.global.sessionId
  )

  let clustersWithIncomingOrOutgoingCommands = isIncoming
    ? await queryCommand.selectAllIncomingCommandsForCluster(
        currentContext.global.db,
        endpointTypes,
        clusterName,
        clusterSide,
        isMfgSpec,
        packageIds
      )
    : await queryCommand.selectAllOutgoingCommandsForCluster(
        currentContext.global.db,
        endpointTypes,
        clusterName,
        clusterSide,
        isMfgSpec,
        packageIds
      )

  return templateUtil.collectBlocks(
    clustersWithIncomingOrOutgoingCommands,
    options,
    currentContext
  )
}

/**
 * All incoming commands that need to be parsed for a given cluster
 * @param clusterName
 * @param options
 * @returns all incoming commands that need to be parsed for a given cluster
 */
async function all_incoming_commands_for_cluster(
  clusterName,
  clusterSide,
  options
) {
  return all_incoming_or_outgoing_commands_for_cluster(
    clusterName,
    clusterSide,
    true,
    options,
    this
  )
}

/**
 * All outgoing commands that need to be parsed for a given cluster
 * @param clusterName
 * @param options
 * @returns all outgoing commands that need to be parsed for a given cluster
 */
async function all_outgoing_commands_for_cluster(
  clusterName,
  clusterSide,
  options
) {
  return all_incoming_or_outgoing_commands_for_cluster(
    clusterName,
    clusterSide,
    false,
    options,
    this
  )
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
async function all_user_cluster_attributes_min_max_defaults(options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )
  let endpointAttributes =
    await queryAttribute.selectAttributeDetailsWithABoundFromEnabledClusters(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  return templateUtil.collectBlocks(endpointAttributes, options, this)
}

/**
 *
 * @param clusterName
 * @param attributeName
 * @param attributeSide
 * @param attributeValue
 * @param attributeValueType
 * @param endpointAttributes
 * @returns arrayIndex
 */
async function checkAttributeMatch(
  clusterName,
  attributeName,
  attributeSide,
  attributeValue,
  attributeValueType,
  endpointAttributes
) {
  let dataPtr
  for (const ea of endpointAttributes) {
    if (
      ea.clusterName === clusterName &&
      ea.name === attributeName &&
      ea.side === attributeSide &&
      ea.attributeValueType === attributeValueType
    ) {
      dataPtr = ea.arrayIndex ? ea.arrayIndex : 0
      return dataPtr
    }
  }
  return attributeValue
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
async function generated_defaults_index(
  clusterName,
  attributeName,
  attributeValueType,
  attributeValue,
  prefixReturn,
  postFixReturn
) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)

  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  let endpointAttributes = await queryAttribute.selectAttributeBoundDetails(
    this.global.db,
    endpointsAndClusters,
    packageIds
  )

  let dataPtr = attributeValue
  for (const ea of endpointAttributes) {
    if (
      ea.clusterName === clusterName &&
      ea.name === attributeName &&
      ea.attributeValueType === attributeValueType
    ) {
      dataPtr = ea.arrayIndex ? ea.arrayIndex : 0
    }
  }
  if (dataPtr === attributeValue) {
    dataPtr = dataPtr ? '(uint8_t*)' + dataPtr : 'NULL'
  } else {
    dataPtr = prefixReturn + dataPtr + postFixReturn
  }
  return dataPtr
}

/**
 * Extracts the index of generated defaults array which come from
 * all_user_cluster_attributes_for_generated_defaults
 * @param clusterName
 * @param attributeName
 * @param attributeSide
 * @param attributeValueType
 * @param attributeValue
 * @param prefixReturn
 * @param postFixReturn
 * @returns deafult value's index in the generated default array
 */
async function generated_default_index(
  clusterName,
  attributeName,
  attributeSide,
  attributeValueType,
  attributeValue,
  prefixReturn,
  postFixReturn
) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)

  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  let endpointAttributes = await queryAttribute.selectAttributeBoundDetails(
    this.global.db,
    endpointsAndClusters,
    packageIds
  )

  let dataPtr = await checkAttributeMatch(
    clusterName,
    attributeName,
    attributeSide,
    attributeValue,
    attributeValueType,
    endpointAttributes
  )
  if (dataPtr === attributeValue) {
    dataPtr = dataPtr ? '(uint8_t*)' + dataPtr : 'NULL'
  } else {
    dataPtr = prefixReturn + dataPtr + postFixReturn
  }
  return dataPtr
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
async function generated_attributes_min_max_index(clusterName, attributeName) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  let endpointAttributes =
    await queryAttribute.selectAttributeDetailsWithABoundFromEnabledClusters(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  let dataPtr = 0
  for (let i = 0; i < endpointAttributes.length; i++) {
    if (
      endpointAttributes[i].clusterName === clusterName &&
      endpointAttributes[i].name === attributeName
    ) {
      dataPtr = i
    }
  }
  return dataPtr
}

/**
 *
 * Extracts the index of generated min max defaults array which come from
 * all_user_cluster_attributes_min_max_defaults
 * @param clusterName
 * @param attributeName
 * @param attributeSide
 * @param options
 * @returns index of the generated min max default in the array
 */
async function generated_attribute_min_max_index(
  clusterName,
  attributeName,
  attributeSide
) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let endpointsAndClusters =
    await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes
    )

  let endpointAttributes =
    await queryAttribute.selectAttributeDetailsWithABoundFromEnabledClusters(
      this.global.db,
      endpointsAndClusters,
      packageIds
    )
  let dataPtr = 0
  for (let i = 0; i < endpointAttributes.length; i++) {
    if (
      endpointAttributes[i].clusterName === clusterName &&
      endpointAttributes[i].name === attributeName &&
      endpointAttributes[i].side === attributeSide
    ) {
      dataPtr = i
    }
  }
  return dataPtr
}

/**
 * If helper that checks if there are clusters enabled
 * Available options:
 * - side: side="client/server" can be used to check if there are client or
 * server side clusters are available
 * @param {*} options
 * @returns Promise of content.
 *
 */
async function if_enabled_clusters(options) {
  let side = null
  if (options && options.hash) {
    side = options.hash.side
  }
  let endpointTypes = await templateUtil.ensureEndpointTypeIds(this)
  let clusters =
    await queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
      this.global.db,
      endpointTypes,
      side
    )
  if (clusters.length > 0) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
}

/**
 * Check if multi-protocol is enabled for the application.
 * @param {*} options
 * @returns boolean based on existence of attribute-attribute associations.
 */
async function if_multi_protocol_attributes_enabled(options) {
  let sessionPackageIds = await queryPackage.getSessionZclPackageIds(
    this.global.db,
    this.global.sessionId
  )
  // Get all attribute mappings which have both attributes belonging to one of the sessionPackages
  let attributeMappings =
    await queryAttribute.selectAttributeMappingsByPackageIds(
      this.global.db,
      sessionPackageIds
    )
  if (attributeMappings.length > 0) {
    return options.fn(this)
  } else {
    return options.inverse(this)
  }
}

/**
 * Retrieve all the attribute-attribute associations for the current session.
 * From `exports.map.attributeMapping` in `src-electron/db/db-mapping.js`:
 * - attributeCode1
 * - attributeCode2
 * - attributeMappingId
 * - attributeMfgCode1
 * - attributeMfgCode2
 * - attributeName1
 * - attributeName2
 * - attributeRef1
 * - attributeRef2
 * - clusterCode1
 * - clusterCode2
 * - clusterMappingIndex
 * - clusterMfgCode1
 * - clusterMfgCode2
 * - clusterName1
 * - clusterName2
 * - isLastPartition
 * - totalClusterMappedAttributes
 * @param {*} options
 * @returns attribute-attribute mapping entries
 */
async function all_multi_protocol_attributes(options) {
  let sessionPackageIds = await queryPackage.getSessionZclPackageIds(
    this.global.db,
    this.global.sessionId
  )
  // Get all attribute mappings which have both attributes belonging to one of the sessionPackages
  let attributeMappings =
    await queryAttribute.selectAttributeMappingsByPackageIds(
      this.global.db,
      sessionPackageIds
    )
  return templateUtil.collectBlocks(attributeMappings, options, this)
}

const dep = templateUtil.deprecatedHelper

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.all_user_cluster_commands = all_user_cluster_commands
exports.all_user_clusters = all_user_clusters
exports.all_user_clusters_names = all_user_clusters_names
exports.all_commands_for_user_enabled_clusters =
  all_commands_for_user_enabled_clusters
exports.all_user_clusters_irrespective_of_side =
  all_user_clusters_irrespective_of_side
exports.all_user_cluster_manufacturer_specific_commands =
  all_user_cluster_manufacturer_specific_commands
exports.all_user_cluster_non_manufacturer_specific_commands =
  all_user_cluster_non_manufacturer_specific_commands
exports.all_cli_commands_for_user_enabled_clusters =
  all_cli_commands_for_user_enabled_clusters
exports.all_user_cluster_commands_irrespective_of_manufaturing_specification =
  all_user_cluster_commands_irrespective_of_manufaturing_specification
exports.all_user_cluster_manufacturer_specific_attributes =
  all_user_cluster_manufacturer_specific_attributes
exports.all_user_cluster_non_manufacturer_specific_attributes =
  all_user_cluster_non_manufacturer_specific_attributes
exports.all_user_cluster_attributes_irrespective_of_manufatucuring_specification =
  dep(enabled_attributes_for_cluster_and_side, {
    from: 'all_user_cluster_attributes_irrespective_of_manufatucuring_specification',
    to: 'enabled_attributes_for_cluster_and_side'
  })
exports.enabled_attributes_for_cluster_and_side =
  enabled_attributes_for_cluster_and_side

exports.all_user_cluster_attributes_for_generated_defaults =
  all_user_cluster_attributes_for_generated_defaults
exports.all_user_cluster_generated_attributes =
  all_user_cluster_generated_attributes
exports.all_user_cluster_generated_commands =
  all_user_cluster_generated_commands
exports.all_user_cluster_attributes_min_max_defaults =
  all_user_cluster_attributes_min_max_defaults
exports.generated_defaults_index = dep(generated_defaults_index, {
  to: 'generated_default_index'
})
exports.generated_default_index = generated_default_index
exports.generated_attributes_min_max_index = dep(
  generated_attributes_min_max_index,
  { to: 'generated_attribute_min_max_index' }
)
exports.generated_attribute_min_max_index = generated_attribute_min_max_index
exports.all_user_clusters_with_incoming_commands =
  all_user_clusters_with_incoming_commands
exports.all_user_incoming_commands_for_all_clusters =
  all_user_incoming_commands_for_all_clusters
exports.all_user_clusters_with_incoming_commands_combined = dep(
  all_user_clusters_with_incoming_commands_combined,
  { to: 'all_user_incoming_commands_for_all_clusters' }
)
exports.all_incoming_commands_for_cluster = all_incoming_commands_for_cluster
exports.all_incoming_commands_for_cluster_combined = dep(
  all_incoming_commands_for_cluster_combined,
  { to: 'all_user_incoming_commands_for_all_clusters' }
)
exports.manufacturing_clusters_with_incoming_commands =
  manufacturing_clusters_with_incoming_commands
exports.all_user_clusters_with_outgoing_commands =
  all_user_clusters_with_outgoing_commands
exports.all_outgoing_commands_for_cluster = all_outgoing_commands_for_cluster
exports.if_enabled_clusters = if_enabled_clusters
exports.if_multi_protocol_attributes_enabled =
  if_multi_protocol_attributes_enabled
exports.all_multi_protocol_attributes = all_multi_protocol_attributes
