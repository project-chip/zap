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
 * Simplicity Studio component integration: the UC components a cluster needs, installed or removed when the cluster is toggled and a Studio session is attached.
 *
 * @module Configuration API: studio components operations
 */

const dbEnum = require('../../../src-shared/db-enum.js')
const queryConfig = require('../../db/query-config.js')
const queryEndpoint = require('../../db/query-endpoint.js')
const queryZcl = require('../../db/query-zcl.js')
const queryPackage = require('../../db/query-package.js')
const { StatusCodes } = require('http-status-codes')
const studio = require('../../ide-integration/studio-rest-api.js')
const zclComponents = require('../../ide-integration/zcl-components.js')

/**
 * Whether the data model wants UC components uninstalled when the last cluster
 * using them is switched off. Declared by the templates as a generator option,
 * exactly as the interface reads it before sending a removal.
 *
 * @param {*} ctx
 * @returns {Promise<boolean>} whether removals should be sent
 */
async function componentRemovalEnabled(ctx) {
  let pairs = await queryPackage.getPackageSessionPackagePairBySessionId(
    ctx.db,
    ctx.sessionId
  )
  for (const pair of pairs) {
    let options = await queryPackage.selectAllOptionsValues(
      ctx.db,
      pair.pkg.id,
      dbEnum.packageOptionCategory.generator
    )
    let disables = options.some(
      (option) =>
        option.optionCode ===
          dbEnum.generatorOptions.disableUcComponentOnZclClusterUpdate &&
        `${option.optionLabel}` === 'true'
    )
    if (disables) return true
  }
  return false
}

/**
 * Whether any endpoint in this session still enables a cluster on a side. A
 * component is shared by every endpoint that uses it, so the last one to let go
 * is the only one that may uninstall it.
 *
 * @param {*} ctx
 * @param {number} clusterRef
 * @param {string} side
 * @returns {Promise<boolean>} whether some endpoint still has it enabled
 */
async function clusterStillInUse(ctx, clusterRef, side) {
  let endpoints = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  for (const endpoint of endpoints) {
    let state = await queryConfig.selectClusterState(
      ctx.db,
      endpoint.endpointTypeRef,
      clusterRef,
      side
    )
    if (state != null && state.enabled) return true
  }
  return false
}

/**
 * Asks Studio to install or uninstall the UC components behind a cluster and
 * describes what came back.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {string[]} sides
 * @param {boolean} add
 * @returns {Promise<string[]>} messages
 */
async function callStudioComponents(ctx, cluster, sides, add) {
  let outcomes
  try {
    outcomes = await studio.updateComponentByClusterIdAndComponentId(
      ctx.db,
      ctx.sessionId,
      [],
      cluster.id,
      add,
      sides
    )
  } catch (err) {
    return [`Studio components for ${cluster.name}: ${err.message || err}`]
  }
  // The call reports a failure by resolving with the error rather than
  // throwing, so an array is the only shape that means it got that far.
  if (outcomes instanceof Error) {
    return [`Studio components for ${cluster.name}: ${outcomes.message}`]
  }
  if (!Array.isArray(outcomes) || outcomes.length === 0) return []
  return outcomes.map((o) =>
    o.status === StatusCodes.OK
      ? `Studio component ${o.id}: ${add ? 'installed' : 'removed'}`
      : `Studio component ${o.id}: failed (${o.status})`
  )
}

/**
 * Names the UC components a set of clusters needs, without installing them.
 * The mapping is a package extension carried by the generation templates, so
 * it is known locally even with no Studio to talk to. Only Studio writes the
 * project file, so naming what is missing is as far as an edit can get on its
 * own, and it is a good deal better than leaving the caller to find out that
 * the cluster has nothing implementing it.
 *
 * Silent when the templates were not loaded, since that is where the mapping
 * lives and there is nothing to report.
 *
 * @param {*} ctx
 * @param {Array} wanted `{ clusterId, sides }` entries
 * @returns {Promise<string[]>} messages naming the components
 */
async function reportUninstalledComponents(ctx, wanted) {
  let ids = []
  for (const entry of wanted) {
    let found = await zclComponents.getComponentIdsByCluster(
      ctx.db,
      ctx.sessionId,
      entry.clusterId,
      entry.sides
    )
    found.forEach((id) => {
      if (!ids.includes(id)) ids.push(id)
    })
  }
  if (ids.length === 0) return []
  return [
    `UC component(s) not installed: ${ids.join(', ')}`,
    `Add them with slc, or pass --studioHttpPort with --ideProjectPath to have Studio install them.`
  ]
}

/**
 * Installs or removes the Simplicity Studio UC components that a cluster needs.
 * Keeping this side effect in the operation means CLI edits follow the same
 * project update path as other configuration changes.
 *
 * Removal is deliberately more cautious than installation: only when the data
 * model asked for it, and only once no endpoint is left using the cluster.
 *
 * Without --studioHttpPort and --ideProjectPath there is nothing to install
 * through, so an enable reports the components it would have installed.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {string[]} sides
 * @param {boolean} enabled
 * @returns {Promise<string[]>} messages describing what Studio did
 */
async function updateStudioComponents(ctx, cluster, sides, enabled) {
  if (!ctx.studioIntegration) {
    return enabled
      ? reportUninstalledComponents(ctx, [
          { clusterId: cluster.id, sides: sides }
        ])
      : []
  }

  if (enabled) return callStudioComponents(ctx, cluster, sides, true)

  if (!(await componentRemovalEnabled(ctx))) return []
  let removable = []
  for (const side of sides) {
    if (!(await clusterStillInUse(ctx, cluster.id, side))) removable.push(side)
  }
  if (removable.length === 0) return []
  return callStudioComponents(ctx, cluster, removable, false)
}

/**
 * Installs the UC components for every cluster an endpoint has enabled. A
 * device type switches on a set of clusters at once, and the interface installs
 * the components for all of them right after the endpoint is created, so
 * hooking cluster enable alone would miss everything a device type brings.
 *
 * Without Studio to install through, the whole set is reported at once rather
 * than one line per cluster.
 *
 * @param {*} ctx
 * @param {Array} clusterStates Rows as returned for the endpoint type.
 * @returns {Promise<string[]>} messages describing what Studio did
 */
async function installStudioComponentsForClusters(ctx, clusterStates) {
  let enabled = clusterStates.filter((s) => s.enabled)
  if (!ctx.studioIntegration) {
    return reportUninstalledComponents(
      ctx,
      enabled.map((s) => ({ clusterId: s.clusterRef, sides: [s.side] }))
    )
  }
  let messages = []
  for (const state of enabled) {
    let cluster = await queryZcl.selectClusterById(ctx.db, state.clusterRef)
    if (cluster == null) continue
    messages.push(
      ...(await callStudioComponents(ctx, cluster, [state.side], true))
    )
  }
  return messages
}

exports.reportUninstalledComponents = reportUninstalledComponents
exports.updateStudioComponents = updateStudioComponents
exports.installStudioComponentsForClusters = installStudioComponentsForClusters
