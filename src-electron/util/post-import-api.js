/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * The post-load script interface. A script names endpoints, clusters and
 * attributes the way it always has; every read and every edit is performed
 * by the configuration engine the command line uses, so a script and a
 * command cannot disagree about what a write is allowed to do.
 *
 *  @module JS API: post-import.
 */

const dbEnum = require('../../src-shared/db-enum.js')
const restApi = require('../../src-shared/rest-api.js')
const env = require('./env')
const configurationApi = require('../configuration')
const operationError = require('../configuration/errors.js')

/**
 * Prints a text to console.
 *
 * @param {*} text
 */
function print(text) {
  console.log(text)
}

/**
 * Prints error message to the console.
 *
 * @param {*} text
 */
function printError(text) {
  console.log(env.formatEmojiMessage('⛔', `SCRIPT API ERROR: ${text}`))
}

/**
 * Prints a warning to the console.
 *
 * @param {*} text
 */
function printWarning(text) {
  console.log(env.formatEmojiMessage('⚠️', `SCRIPT API WARNING: ${text}`))
}

/**
 * The context the configuration engine works with, derived once from the
 * script context. Lookups it caches live on it for the rest of the run.
 *
 * A script that belongs to one package category is narrowed to it, which is
 * how an upgrade rule tells two protocols that reuse an endpoint number
 * apart. A script run on its own has no category, and addresses the whole
 * session, as it always has.
 *
 * @param {*} context
 * @returns {*} `{ db, sessionId, category }`
 */
function editContext(context) {
  if (context.editContext == null) {
    context.editContext = {
      db: context.db,
      sessionId: context.sessionId,
      category: context.script ? context.script.category : null
    }
  }
  return context.editContext
}

/**
 * Runs an engine operation, turning a refusal into a printed error and a null
 * result.
 *
 * The engine refuses what the user interface greys out: a storage the data
 * model fixes, an element of a cluster side that is off, a feature whose
 * conformance leaves no room. A command line stops there; a script carries
 * on, so the refusal is printed with its reason and the call answers null, as
 * this API has always done when it could not do what was asked. A successful
 * edit stays quiet apart from warnings.
 *
 * @param {*} context
 * @param {string} name Dotted operation name, such as 'cluster.enable'.
 * @param {*} params
 * @returns {Promise<*>} the operation result, or null when it was refused
 */
async function run(context, name, params) {
  try {
    // Shared cluster state is reconciled once, after the whole script has
    // run (see `reconcile`), rather than after each call.
    let outcome = await configurationApi.executeOperation(
      editContext(context),
      name,
      params
    )
    ;((outcome && outcome.warnings) || []).forEach((warning) =>
      printWarning(`${name}: ${warning}`)
    )
    return outcome
  } catch (err) {
    if (!(err instanceof operationError.OperationError)) throw err
    printError(err.message)
    ;(err.hints || []).forEach((hint) => print(`   ${hint}`))
    ;(err.remedies || []).forEach((remedy) =>
      print(`   ${remedy.op} ${JSON.stringify(remedy.params)}`)
    )
    return null
  }
}

/**
 * Aligns the cluster states that the data model shares across endpoints,
 * after a script has applied its edits. The script runner calls this once a
 * script function returns; a script does not need to.
 *
 * @param {*} context
 * @returns {Promise<*>} `{ applied, endpoints, clusters }`
 */
async function reconcile(context) {
  return configurationApi.reconcileSharedState(editContext(context))
}

/**
 * Runs a lookup, printing a miss the way `run` prints a refusal.
 *
 * @param {*} context
 * @param {Function} find
 * @returns {Promise<*>} the found row, or null
 */
async function lookup(context, find) {
  try {
    return await find()
  } catch (err) {
    if (!(err instanceof operationError.OperationError)) throw err
    printError(err.message)
    ;(err.hints || []).forEach((hint) => print(`   ${hint}`))
    return null
  }
}

/**
 * Returns an array of endpoints.
 *
 * @param {*} context
 */
async function endpoints(context) {
  return configurationApi.readEndpoints(
    editContext(context),
    context.script ? context.script.category : null
  )
}

/**
 * Deletes an endpoint. The endpoint type behind it goes too, unless another
 * endpoint still uses it, and an endpoint that still has children is refused
 * unless the caller forces it. That is the same removal the command line
 * performs.
 *
 * @param {*} context
 * @param {*} endpoint
 */
async function deleteEndpoint(context, endpoint) {
  return run(context, 'endpoint.delete', {
    endpoint: endpoint.endpointIdentifier
  })
}

/**
 * Returns an array of clusters defined on a given endpoint.
 *
 * @param {*} context
 * @param {*} endpoint
 */
async function clusters(context, endpoint) {
  return configurationApi.readClusters(editContext(context), endpoint)
}

/**
 * Returns an array of attributes for a given cluster.
 * The cluster input is required to come from a script-api in this module.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} cluster
 */
async function attributes(context, endpoint, cluster) {
  return configurationApi.readAttributes(
    editContext(context),
    endpoint,
    cluster
  )
}

/**
 * Returns an array of commands for a given cluster
 * The clusters input is required to come from a script-api in this module.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} cluster
 */
async function commands(context, endpoint, cluster) {
  return configurationApi.readCommands(editContext(context), endpoint, cluster)
}

/**
 * Returns array of function names available in this module.
 */
function functions() {
  return Object.keys(exports)
}

/**
 * Returns the session id in the context.
 *
 * @param {*} context
 * @returns sessionId
 */
function sessionId(context) {
  return context.sessionId
}

/**
 *
 * @returns dbEnum
 */
function dbEnums() {
  return dbEnum
}

/**
 * Returns all available clusters.
 *
 * @param {*} context
 * @returns all available clusters
 */
async function availableClusters(context) {
  return configurationApi.readAvailableClusters(editContext(context))
}

/**
 * Finds a cluster by code or by name.
 *
 * A manufacturer code narrows the search to that manufacturer's clusters.
 * Without one, the lookup is the command line's own: `On/Off`, `ON_OFF`,
 * `onoff`, `0x0006` and `6` all name one cluster, and a miss is reported
 * with the nearest candidates.
 *
 * @param {*} context
 * @param {*} spec Cluster code, hex string or name.
 * @param {*} mfgCode
 * @returns promise of cluster details, or null
 */
async function findCluster(context, spec, mfgCode = null) {
  return lookup(context, () =>
    configurationApi.findCluster(editContext(context), spec, mfgCode)
  )
}

/**
 * Finds an attribute of a cluster by code or by name.
 *
 * @param {*} context
 * @param {*} clusterSpec Cluster code, hex string or name.
 * @param {*} side
 * @param {*} attributeSpec Attribute code, hex string or name.
 * @param {*} mfgCode
 * @returns promise of attribute details, or null
 */
async function findAttribute(
  context,
  clusterSpec,
  side,
  attributeSpec,
  mfgCode = null
) {
  let cluster = await findCluster(context, clusterSpec, mfgCode)
  if (cluster == null) return null
  return lookup(context, () =>
    configurationApi.findAttribute(
      editContext(context),
      cluster,
      attributeSpec,
      side
    )
  )
}

/**
 * Finds a command of a cluster by code or by name.
 *
 * @param {*} context
 * @param {*} clusterSpec Cluster code, hex string or name.
 * @param {*} commandSpec Command code, hex string or name.
 * @param {*} source Required with a code, since codes repeat across sources.
 * @returns promise of command details, or null
 */
async function findCommand(context, clusterSpec, commandSpec, source) {
  let cluster = await findCluster(context, clusterSpec)
  if (cluster == null) return null
  return lookup(context, () =>
    configurationApi.findCommand(
      editContext(context),
      cluster,
      commandSpec,
      source
    )
  )
}

/**
 * Finds an event of a cluster by code or by name.
 *
 * @param {*} context
 * @param {*} clusterSpec Cluster code, hex string or name.
 * @param {*} eventSpec Event code, hex string or name.
 * @returns promise of event details, or null
 */
async function findEvent(context, clusterSpec, eventSpec) {
  let cluster = await findCluster(context, clusterSpec)
  if (cluster == null) return null
  return lookup(context, () =>
    configurationApi.findEvent(editContext(context), cluster, eventSpec)
  )
}

/**
 * Non-public, common function to modify cluster.
 *
 * Enabling a cluster for the first time brings in its default attributes and
 * commands, as ticking the checkbox in the user interface does.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 * @param {*} side
 * @param {*} enabled
 * @returns promise of an updated or inserted cluster
 */
async function modifyCluster(context, endpoint, code, side, enabled) {
  return run(context, enabled ? 'cluster.enable' : 'cluster.disable', {
    endpoint: endpoint.endpointIdentifier,
    cluster: code,
    side
  })
}

/**
 * Non-public, common function to modify attribute.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} attributeCode
 * @param {*} side
 * @param {*} enable
 * @returns promise of an updated or inserted attribute
 */
async function modifyAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode,
  side,
  enable
) {
  return run(context, enable ? 'attribute.enable' : 'attribute.disable', {
    endpoint: endpoint.endpointIdentifier,
    cluster: clusterCode,
    attribute: attributeCode,
    side
  })
}

/**
 * The attribute change each REST update key stands for. Scripts have always
 * spoken in these keys, and the shared layer speaks in field names.
 */
const changeForUpdateKey = {
  [restApi.updateKey.attributeSelected]: 'enabled',
  [restApi.updateKey.attributeDefault]: 'default',
  [restApi.updateKey.attributeStorage]: 'storage',
  [restApi.updateKey.attributeSingleton]: 'singleton',
  [restApi.updateKey.attributeBounded]: 'bounded',
  [restApi.updateKey.attributeReporting]: 'reporting',
  [restApi.updateKey.attributeReportMin]: 'minInterval',
  [restApi.updateKey.attributeReportMax]: 'maxInterval',
  [restApi.updateKey.attributeReportChange]: 'reportableChange'
}

/**
 * Update an attribute with given parameters.
 *
 * `params` is an array of `{ key, value }` where the key is one of
 * `context.updateKey.attribute*`. The change goes through the same policy the
 * user interface and the command line apply: a storage the data model fixes,
 * or a default on an attribute that is not included, is refused and reported.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} attribute As returned by `attributes()`.
 * @param {*} params
 * @returns promise of an updated or inserted attribute with parameters provided
 */
async function updateAttribute(context, endpoint, cluster, attribute, params) {
  let changes = {}
  for (let param of params || []) {
    let field = changeForUpdateKey[param.key]
    if (field == null) {
      printError(`Unknown attribute update key '${param.key}'.`)
      return null
    }
    changes[field] = param.value
  }
  // The row already names one attribute. Resolving by that name keeps a
  // manufacturer attribute from colliding with a standard attribute that
  // happens to carry the same code.
  return run(context, 'attribute.set', {
    endpoint: endpoint.endpointIdentifier,
    cluster: cluster.name != null ? cluster.name : cluster.code,
    attribute: attribute.name != null ? attribute.name : attribute.code,
    side: attribute.side || cluster.side,
    ...changes
  })
}

/**
 * Non-public, common function to modify command.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} commandCode
 * @param {*} source
 * @param {*} isIncoming
 * @param {*} enable
 * @returns promise of an updated or inserted command
 */
async function modifyCommand(
  context,
  endpoint,
  clusterCode,
  commandCode,
  source,
  isIncoming,
  enable
) {
  return run(context, enable ? 'command.enable' : 'command.disable', {
    endpoint: endpoint.endpointIdentifier,
    cluster: clusterCode,
    command: commandCode,
    source,
    direction: isIncoming ? 'in' : 'out'
  })
}

/**
 * Non-public, common function to modify an event.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterSpec Cluster code, hex string or name.
 * @param {*} eventSpec Event code, hex string or name.
 * @param {*} side Defaults to the side the event is defined on.
 * @param {*} enabled
 * @returns promise of the event state write, or null when refused
 */
async function modifyEvent(
  context,
  endpoint,
  clusterSpec,
  eventSpec,
  side,
  enabled
) {
  return run(context, enabled ? 'event.enable' : 'event.disable', {
    endpoint: endpoint.endpointIdentifier,
    cluster: clusterSpec,
    event: eventSpec,
    side
  })
}

/**
 * Enables an event of a cluster on an endpoint.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterSpec Cluster code, hex string or name.
 * @param {*} eventSpec Event code, hex string or name.
 * @param {*} side Optional; defaults to the side the event is defined on.
 */
async function enableEvent(context, endpoint, clusterSpec, eventSpec, side) {
  return modifyEvent(context, endpoint, clusterSpec, eventSpec, side, true)
}

/**
 * Disables an event of a cluster on an endpoint.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterSpec Cluster code, hex string or name.
 * @param {*} eventSpec Event code, hex string or name.
 * @param {*} side Optional; defaults to the side the event is defined on.
 */
async function disableEvent(context, endpoint, clusterSpec, eventSpec, side) {
  return modifyEvent(context, endpoint, clusterSpec, eventSpec, side, false)
}

/**
 * Non-public, common function to toggle a feature.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} feature Feature code such as 'LT', name, or bit position.
 * @param {*} enabled
 * @returns {Promise<*>} the operation outcome, or null when refused
 */
async function modifyFeature(context, endpoint, clusterCode, feature, enabled) {
  return run(context, enabled ? 'feature.enable' : 'feature.disable', {
    endpoint: endpoint.endpointIdentifier,
    cluster: clusterCode,
    feature
  })
}

/**
 * Returns the features a cluster defines on an endpoint, each with its bit,
 * its conformance as the endpoint's device type sees it, and whether it is
 * currently enabled.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} cluster As returned by `clusters()`.
 * @returns promise of an array of features
 */
async function features(context, endpoint, cluster) {
  let rows = await lookup(context, () =>
    configurationApi.readFeatures(editContext(context), endpoint, cluster)
  )
  return rows || []
}

/**
 * Enables a feature of a cluster on an endpoint, bringing along the
 * attributes, commands and events its conformance requires.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} feature Feature code such as 'LT', name, or bit position.
 */
async function enableFeature(context, endpoint, clusterCode, feature) {
  return modifyFeature(context, endpoint, clusterCode, feature, true)
}

/**
 * Disables a feature of a cluster on an endpoint, removing the attributes,
 * commands and events that only it required.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} feature Feature code such as 'LT', name, or bit position.
 */
async function disableFeature(context, endpoint, clusterCode, feature) {
  return modifyFeature(context, endpoint, clusterCode, feature, false)
}

/**
 * Disables the client cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function disableClientCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.client, false)
}

/**
 * Disables the server cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function disableServerCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.server, false)
}

/**
 * Enables the client cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function enableClientCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.client, true)
}

/**
 * Enables the server cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function enableServerCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.server, true)
}

/**
 * Disable client attribute.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} attributeCode
 */
async function disableClientAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.client,
    false
  )
}

/**
 * Enable client attribute.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} attributeCode
 */
async function enableClientAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.client,
    true
  )
}

/**
 * Disable server attribute.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} attributeCode
 */
async function disableServerAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.server,
    false
  )
}

/**
 * Enable server attribute.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} attributeCode
 */
async function enableServerAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.server,
    true
  )
}

/**
 * Disable incoming commands.
 * Source should be derived from dbEnums().source.client/server
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} commandCode
 * @param {*} source
 */
async function disableIncomingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode,
  source
) {
  return modifyCommand(
    context,
    endpoint,
    clusterCode,
    commandCode,
    source,
    true,
    false
  )
}

/**
 * Enable incoming commands.
 * Source should be derived from dbEnums().source.client/server
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} commandCode
 * @param {*} source
 */
async function enableIncomingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode,
  source
) {
  return modifyCommand(
    context,
    endpoint,
    clusterCode,
    commandCode,
    source,
    true,
    true
  )
}

/**
 * Disable outgoing commands.
 * Source should be derived from dbEnums().source.client/server
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} commandCode
 * @param {*} source
 */
async function disableOutgoingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode,
  source
) {
  return modifyCommand(
    context,
    endpoint,
    clusterCode,
    commandCode,
    source,
    false,
    false
  )
}

/**
 * Enable outgoing commands.
 * Source should be derived from dbEnums().source.client/server
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} commandCode
 * @param {*} source
 */
async function enableOutgoingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode,
  source
) {
  return modifyCommand(
    context,
    endpoint,
    clusterCode,
    commandCode,
    source,
    false,
    true
  )
}

exports.availableClusters = availableClusters

exports.print = print
exports.functions = functions
exports.sessionId = sessionId
exports.dbEnums = dbEnums

exports.endpoints = endpoints
exports.deleteEndpoint = deleteEndpoint

exports.clusters = clusters
exports.attributes = attributes
exports.commands = commands

exports.findCluster = findCluster
exports.findAttribute = findAttribute
exports.findCommand = findCommand
exports.findEvent = findEvent

exports.disableClientCluster = disableClientCluster
exports.disableServerCluster = disableServerCluster
exports.enableClientCluster = enableClientCluster
exports.enableServerCluster = enableServerCluster

exports.disableClientAttribute = disableClientAttribute
exports.enableClientAttribute = enableClientAttribute
exports.disableServerAttribute = disableServerAttribute
exports.enableServerAttribute = enableServerAttribute

exports.disableClientAttribute = disableClientAttribute
exports.enableClientAttribute = enableClientAttribute
exports.disableServerAttribute = disableServerAttribute
exports.enableServerAttribute = enableServerAttribute

exports.disableIncomingCommand = disableIncomingCommand
exports.enableIncomingCommand = enableIncomingCommand
exports.disableOutgoingCommand = disableOutgoingCommand
exports.enableOutgoingCommand = enableOutgoingCommand
exports.updateAttribute = updateAttribute

exports.enableEvent = enableEvent
exports.disableEvent = disableEvent

exports.features = features
exports.enableFeature = enableFeature
exports.disableFeature = disableFeature

// Used by the script runner, not by scripts.
exports.reconcile = reconcile

// Constants that are used a lot
exports.client = dbEnum.source.client
exports.server = dbEnum.source.server
