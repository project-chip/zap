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
 * Event operations: listing a cluster's events and switching them on or off.
 *
 * @module Configuration API: event operations
 */

const dbEnum = require('../../../src-shared/db-enum.js')
const queryZcl = require('../../db/query-zcl.js')
const sessionEdit = require('../session-edit.js')
const resolver = require('../resolver.js')
const outcome = require('../outcome.js')

const { listingNext, firstDisabled, applyFilter } = require('./listing.js')

const result = outcome.result
const step = outcome.step
const asHex = resolver.asHex

/**
 * Lists the events of a cluster on an endpoint.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function eventList(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  await sessionEdit.requireClusterConfigurable(ctx, endpoint, cluster)
  let states = await queryZcl.selectEndpointTypeEventsByEndpointId(
    ctx.db,
    endpoint.endpointTypeRef
  )
  let byRef = new Map(
    states
      .filter((s) => s.clusterRef === cluster.id)
      .map((s) => [s.eventRef, s])
  )
  let events = await resolver.eventsOfCluster(ctx, cluster)

  let rows = []
  for (let event of events) {
    let state = byRef.get(event.id)
    let included = state != null && state.included
    if (params.enabledOnly === true && !included) continue
    rows.push({
      code: asHex(event.code, 2),
      name: event.name,
      side: event.side,
      enabled: included ? 'yes' : 'no'
    })
  }

  rows = applyFilter(rows, params.filter)

  return result(
    false,
    [
      `endpoint ${endpoint.endpointIdentifier}, cluster ${cluster.name}: ${rows.length} event(s)`
    ],
    { columns: ['code', 'name', 'side', 'enabled'], rows: rows },
    listingNext(ctx, params, rows, {
      pick: (candidates) => firstDisabled(candidates),
      act: (row) =>
        step('event.enable', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name,
          event: row.name
        })
    })
  )
}

/**
 * Enables or disables an event.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} enabled
 * @returns {Promise<*>} operation result
 */
async function eventSetEnabled(ctx, params, enabled) {
  let endpoint = await resolver.endpointFromParams(ctx, params)
  let cluster = await resolver.clusterFromParams(ctx, endpoint, params)
  await sessionEdit.requireClusterConfigurable(ctx, endpoint, cluster)
  let event = await resolver.eventFromParams(ctx, cluster, params)
  let side = params.side || event.side || dbEnum.side.server

  await sessionEdit.setEventEnabled(
    ctx,
    endpoint,
    cluster,
    event,
    side,
    enabled
  )
  await sessionEdit.updateRequiredElementWarning(
    ctx,
    endpoint,
    cluster,
    'events',
    event.id,
    enabled
  )

  return result(true, [
    `${enabled ? 'Enabled' : 'Disabled'} event ${event.name} (${asHex(
      event.code,
      2
    )}) on ${cluster.name} of endpoint ${endpoint.endpointIdentifier}`
  ])
}

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'event.list': (ctx, params) => eventList(ctx, params),
  'event.enable': (ctx, params) => eventSetEnabled(ctx, params, true),
  'event.disable': (ctx, params) => eventSetEnabled(ctx, params, false)
}

exports.operations = operations
