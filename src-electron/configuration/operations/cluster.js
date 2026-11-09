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
 * Cluster operations: the catalog, what an endpoint enables, and switching a cluster side on or off.
 *
 * @module Configuration API: cluster operations
 */

const queryConfig = require('../../db/query-config.js')
const queryZcl = require('../../db/query-zcl.js')
const sessionEdit = require('../session-edit.js')
const resolver = require('../resolver.js')
const outcome = require('../outcome.js')

const { listingNext, applyFilter } = require('./listing.js')
const studioComponents = require('./studio-components.js')

const result = outcome.result
const step = outcome.step
const asHex = resolver.asHex

/**
 * Lists the clusters of an endpoint with their enabled state, or the whole
 * cluster catalog when `--all` is given.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function clusterList(ctx, params) {
  if (params.all === true || params.endpoint == null) {
    let all = await resolver.allClusters(ctx)
    all.sort((a, b) => a.code - b.code)
    let catalog = applyFilter(
      all.map((c) => ({
        code: asHex(c.code),
        name: c.name,
        domain: c.domainName || ''
      })),
      params.filter
    )
    return result(
      false,
      [`${catalog.length} cluster(s) available`],
      { columns: ['code', 'name', 'domain'], rows: catalog },
      listingNext(ctx, params, catalog, {
        widen: () => step('cluster.list', { all: true })
      })
    )
  }

  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let states = await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
    ctx.db,
    endpoint.endpointTypeRef
  )
  let clusters = await resolver.clustersForEndpoint(ctx, endpoint)
  let byId = new Map(clusters.map((c) => [c.id, c]))

  let rows = []
  for (let state of states) {
    let cluster = byId.get(state.clusterRef)
    if (cluster == null) continue
    if (params.enabledOnly === true && !state.enabled) continue
    rows.push({
      code: asHex(cluster.code),
      name: cluster.name,
      side: state.side,
      enabled: state.enabled ? 'yes' : 'no'
    })
  }
  rows.sort(
    (a, b) => a.code.localeCompare(b.code) || a.side.localeCompare(b.side)
  )
  rows = applyFilter(rows, params.filter)

  return result(
    false,
    [`endpoint ${endpoint.endpointIdentifier}: ${rows.length} cluster row(s)`],
    { columns: ['code', 'name', 'side', 'enabled'], rows: rows },
    listingNext(ctx, params, rows, {
      // Point at a cluster that is switched on, since that is the one whose
      // elements can actually be configured.
      pick: (candidates) =>
        candidates.find((r) => r.enabled === 'yes') || candidates[0],
      act: (row) =>
        step('attribute.list', {
          endpoint: endpoint.endpointIdentifier,
          cluster: row.name
        }),
      widen: () =>
        step('cluster.list', {
          endpoint: endpoint.endpointIdentifier
        })
    })
  )
}

/**
 * Enables or disables a cluster on one or both sides. Enabling a cluster for
 * the first time also brings in its mandatory attributes and commands.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} enabled
 * @returns {Promise<*>} operation result
 */
async function clusterSetEnabled(ctx, params, enabled) {
  let endpoint = await resolver.endpointFromParams(ctx, params)
  let cluster = await resolver.clusterFromParams(ctx, endpoint, params)
  let sides = resolver.expandSides(params.side)
  let changedSides = []

  for (let side of sides) {
    let previous = await queryConfig.selectClusterState(
      ctx.db,
      endpoint.endpointTypeRef,
      cluster.id,
      side
    )
    if ((previous != null && previous.enabled === true) === enabled) continue
    await sessionEdit.setClusterSideEnabled(
      ctx,
      endpoint,
      cluster,
      side,
      enabled
    )
    changedSides.push(side)
  }

  if (changedSides.length === 0) {
    let messages = [
      `${enabled ? 'Enabled' : 'Disabled'} cluster ${cluster.name} (${asHex(
        cluster.code
      )}) ${sides.join('/')} on endpoint ${endpoint.endpointIdentifier}`
    ]
    if (enabled && !ctx.studioIntegration) {
      messages.push(
        ...(await studioComponents.reportUninstalledComponents(ctx, [
          { clusterId: cluster.id, sides: sides }
        ]))
      )
    }
    return result(true, messages)
  }

  let messages = [
    `${enabled ? 'Enabled' : 'Disabled'} cluster ${cluster.name} (${asHex(
      cluster.code
    )}) ${changedSides.join('/')} on endpoint ${endpoint.endpointIdentifier}`
  ]
  messages.push(
    ...(await studioComponents.updateStudioComponents(
      ctx,
      cluster,
      changedSides,
      enabled
    ))
  )

  return result(
    true,
    messages,
    null,
    enabled
      ? [
          step('attribute.list', {
            endpoint: endpoint.endpointIdentifier,
            cluster: cluster.name
          }),
          step('command.list', {
            endpoint: endpoint.endpointIdentifier,
            cluster: cluster.name
          })
        ]
      : []
  )
}

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'cluster.list': (ctx, params) => clusterList(ctx, params),
  'cluster.enable': (ctx, params) => clusterSetEnabled(ctx, params, true),
  'cluster.disable': (ctx, params) => clusterSetEnabled(ctx, params, false)
}

exports.operations = operations
