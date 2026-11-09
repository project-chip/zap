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
 * Command operations: listing a cluster's commands and switching them on or off in each direction.
 *
 * @module Configuration API: command operations
 */

const queryZcl = require('../../db/query-zcl.js')
const sessionEdit = require('../session-edit.js')
const resolver = require('../resolver.js')
const operationError = require('../errors.js')
const outcome = require('../outcome.js')

const { listingNext, firstDisabled, applyFilter } = require('./listing.js')

const result = outcome.result
const step = outcome.step
const OperationError = operationError.OperationError
const asHex = resolver.asHex

/**
 * Turns `--direction` into the incoming flags to write.
 *
 * @param {string} direction 'in', 'out' or 'both'.
 * @returns {boolean[]} values for the isIncoming flag
 */
function expandDirections(direction) {
  if (direction === 'in') return [true]
  if (direction === 'out') return [false]
  if (direction === 'both') return [true, false]
  throw new OperationError(
    `Invalid direction '${direction}', expected in, out or both`
  )
}

/**
 * The cluster side a command direction is recorded against. See the shared
 * layer for the reasoning; the command line only needs the answer to work out
 * which of `--direction both` an endpoint can hold.
 */
const commandSide = sessionEdit.commandSide
const describeUnwritableDirection = sessionEdit.describeUnwritableDirection

/**
 * Lists the commands of a cluster on an endpoint with their incoming and
 * outgoing state.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function commandList(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  await sessionEdit.requireClusterConfigurable(ctx, endpoint, cluster)
  let states = await queryZcl.selectEndpointTypeCommandsByEndpointId(
    ctx.db,
    endpoint.endpointTypeRef
  )
  let byRef = new Map(
    states
      .filter((s) => s.clusterRef === cluster.id)
      .map((s) => [s.commandRef, s])
  )
  let commands = await resolver.commandsOfCluster(ctx, cluster)

  let rows = []
  for (let command of commands) {
    let state = byRef.get(command.id)
    let incoming = state != null && state.incoming
    let outgoing = state != null && state.outgoing
    if (params.enabledOnly === true && !incoming && !outgoing) continue
    rows.push({
      code: asHex(command.code, 2),
      name: command.name,
      source: command.source,
      in: incoming ? 'yes' : 'no',
      out: outgoing ? 'yes' : 'no'
    })
  }

  rows = applyFilter(rows, params.filter)

  return result(
    false,
    [
      `endpoint ${endpoint.endpointIdentifier}, cluster ${cluster.name}: ${rows.length} command(s)`
    ],
    { columns: ['code', 'name', 'source', 'in', 'out'], rows: rows },
    listingNext(ctx, params, rows, {
      pick: (candidates) => firstDisabled(candidates, 'in'),
      act: (row) =>
        step('command.enable', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name,
          command: row.name,
          direction: 'in'
        }),
      widen: () =>
        step('command.list', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name
        })
    })
  )
}

/**
 * Enables or disables a command in the incoming and/or outgoing direction.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} enabled
 * @returns {Promise<*>} operation result
 */
async function commandSetEnabled(ctx, params, enabled) {
  let endpoint = await resolver.endpointFromParams(ctx, params)
  let cluster = await resolver.clusterFromParams(ctx, endpoint, params)
  await sessionEdit.requireClusterConfigurable(ctx, endpoint, cluster)
  let command = await resolver.commandFromParams(ctx, cluster, params)
  if (!command || command.clusterRef !== cluster.id)
    throw new OperationError(`Unknown command ${params.command}`)
  let directions = expandDirections(params.direction)

  // 'both' means "whichever of the two the endpoint can actually hold", so
  // that asking for both sides on a single-sided cluster still does the useful
  // half. A single explicit direction has to be honoured or refused.
  let applicable = []
  for (let isIncoming of directions) {
    let unwritable = describeUnwritableDirection(command, isIncoming)
    if (
      unwritable == null &&
      (await sessionEdit.isClusterSideEnabled(
        ctx,
        endpoint,
        cluster,
        commandSide(command, isIncoming)
      ))
    ) {
      applicable.push(isIncoming)
    } else if (directions.length === 1) {
      if (unwritable != null) throw unwritable
      await sessionEdit.requireClusterSideEnabled(
        ctx,
        endpoint,
        cluster,
        commandSide(command, isIncoming)
      )
    }
  }
  if (applicable.length === 0) {
    let unwritable = describeUnwritableDirection(command, directions[0])
    if (unwritable != null) throw unwritable
    await sessionEdit.requireClusterSideEnabled(
      ctx,
      endpoint,
      cluster,
      commandSide(command, directions[0])
    )
  }

  for (let isIncoming of applicable) {
    await sessionEdit.setCommandEnabled(
      ctx,
      endpoint,
      cluster,
      command,
      isIncoming,
      enabled
    )
    await sessionEdit.updateRequiredElementWarning(
      ctx,
      endpoint,
      cluster,
      'commands',
      command.id,
      enabled
    )
  }

  return result(true, [
    `${enabled ? 'Enabled' : 'Disabled'} command ${command.name} (${asHex(
      command.code,
      2
    )}) ${applicable.map((d) => (d ? 'in' : 'out')).join('/')} on ${cluster.name} of endpoint ${
      endpoint.endpointIdentifier
    }`
  ])
}

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'command.list': (ctx, params) => commandList(ctx, params),
  'command.enable': (ctx, params) => commandSetEnabled(ctx, params, true),
  'command.disable': (ctx, params) => commandSetEnabled(ctx, params, false)
}

exports.operations = operations
