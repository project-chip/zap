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
 * Attribute operations: listing a cluster side's attributes and setting their inclusion, storage, default and reporting.
 *
 * @module Configuration API: attribute operations
 */

const dbEnum = require('../../../src-shared/db-enum.js')
const queryConfig = require('../../db/query-config.js')
const queryZcl = require('../../db/query-zcl.js')
const sessionEdit = require('../session-edit.js')
const resolver = require('../resolver.js')
const operationError = require('../errors.js')
const dataModelPolicy = require('../policy.js')
const outcome = require('../outcome.js')

const { listingNext, firstDisabled, applyFilter } = require('./listing.js')

const result = outcome.result
const step = outcome.step
const OperationError = operationError.OperationError
const asHex = resolver.asHex

/**
 * Works out which side an attribute lives on. Callers may pass `--side`
 * explicitly; otherwise we look at where the attribute is defined and, when it
 * exists on both sides, at which side the endpoint actually has enabled.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} spec
 * @param {string} [requestedSide]
 * @returns {Promise<*>} `{ attribute, side }`
 */
async function findAttribute(ctx, endpoint, cluster, spec, requestedSide) {
  if (requestedSide != null && requestedSide !== dbEnum.side.both) {
    return {
      attribute: await resolver.resolveAttribute(
        ctx,
        cluster,
        spec,
        requestedSide
      ),
      side: requestedSide
    }
  }
  let found = []
  let errors = []
  for (let side of [dbEnum.side.server, dbEnum.side.client]) {
    try {
      found.push({
        attribute: await resolver.resolveAttribute(ctx, cluster, spec, side),
        side: side
      })
    } catch (err) {
      errors.push(err)
    }
  }
  if (found.length === 0) throw errors[0]
  if (found.length === 1) return found[0]

  let enabled = []
  for (let candidate of found) {
    if (
      await sessionEdit.isClusterSideEnabled(
        ctx,
        endpoint,
        cluster,
        candidate.side
      )
    ) {
      enabled.push(candidate)
    }
  }
  if (enabled.length === 1) return enabled[0]
  throw new OperationError(
    `Attribute '${spec}' exists on both sides of cluster ${cluster.name}`,
    ['Add --side client or --side server.']
  )
}

/**
 * Lists the attributes of a cluster on an endpoint, with their current
 * configuration.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function attributeList(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  await sessionEdit.requireClusterConfigurable(ctx, endpoint, cluster)
  let states = await queryZcl.selectEndpointTypeAttributesByEndpointId(
    ctx.db,
    endpoint.endpointTypeRef
  )
  let byRef = new Map(
    states
      .filter((s) => s.clusterRef === cluster.id)
      .map((s) => [s.attributeRef, s])
  )

  let rows = []
  for (let side of [dbEnum.side.server, dbEnum.side.client]) {
    let attributes = await resolver.attributesOfCluster(ctx, cluster, side)
    for (let attribute of attributes) {
      let state = byRef.get(attribute.id)
      let enabled = state != null && state.included
      if (params.enabledOnly === true && !enabled) continue
      let policy = await dataModelPolicy.attributePolicy(
        ctx,
        cluster,
        attribute
      )
      rows.push({
        code: asHex(attribute.code),
        name: attribute.name,
        side: side,
        enabled: enabled ? 'yes' : 'no',
        storage: state != null ? state.storageOption : '',
        // Which of the columns to its left the data model decides, so that a
        // caller can tell a value it may change from one it may not.
        fixed: dataModelPolicy.fixedFields(policy),
        default: state != null ? state.defaultValue : attribute.defaultValue,
        singleton: state != null && state.singleton ? 'yes' : '',
        bounded: state != null && state.bounded ? 'yes' : '',
        reporting: state != null && state.includedReportable ? 'yes' : '',
        min: state != null && state.includedReportable ? state.minInterval : '',
        max: state != null && state.includedReportable ? state.maxInterval : '',
        change:
          state != null && state.includedReportable
            ? state.reportableChange
            : ''
      })
    }
  }

  rows = applyFilter(rows, params.filter)

  return result(
    false,
    [
      `endpoint ${endpoint.endpointIdentifier}, cluster ${cluster.name}: ${rows.length} attribute(s)`
    ],
    {
      columns: [
        'code',
        'name',
        'side',
        'enabled',
        'storage',
        'fixed',
        'default',
        'singleton',
        'bounded',
        'reporting',
        'min',
        'max',
        'change'
      ],
      rows: rows
    },
    listingNext(ctx, params, rows, {
      pick: (candidates) => firstDisabled(candidates),
      act: (row) =>
        step('attribute.set', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name,
          attribute: row.name,
          enabled: true
        }),
      widen: () =>
        step('attribute.list', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name
        })
    })
  )
}

/**
 * Applies any combination of attribute settings: inclusion, default value,
 * storage, singleton, bounded and the four reporting fields.
 *
 * This operation's share of the work is reading the parameters. Which of the
 * settings the data model allows, and the write itself, belong to
 * `session-edit`, so that every interface setting the same thing is refused
 * or recorded exactly alike.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} [forceEnabled] Set by the enable/disable shorthands.
 * @returns {Promise<*>} operation result
 */
async function attributeSet(ctx, params, forceEnabled = undefined) {
  let endpoint = await resolver.endpointFromParams(ctx, params)
  let cluster = await resolver.clusterFromParams(ctx, endpoint, params)
  await sessionEdit.requireClusterConfigurable(ctx, endpoint, cluster)
  let found
  if (params.attributeId != null) {
    found = {
      attribute: resolver.byId(
        'Attribute',
        params.attributeId,
        await resolver.attributesOfCluster(ctx, cluster, params.side)
      ),
      side: params.side
    }
  } else {
    found = await findAttribute(
      ctx,
      endpoint,
      cluster,
      params.attribute,
      params.side
    )
  }
  let attribute = found.attribute
  let side = found.side
  await sessionEdit.requireClusterSideEnabled(ctx, endpoint, cluster, side)

  if (params.initialize === true) {
    await queryConfig.insertOrUpdateAttributeState(
      ctx.db,
      endpoint.endpointTypeRef,
      cluster.id,
      side,
      attribute.id,
      null,
      params.minInterval ?? attribute.reportMinInterval,
      params.maxInterval ?? attribute.reportMaxInterval,
      params.reportableChange ?? attribute.reportableChange
    )
    return result(true, [])
  }

  let changes = {
    enabled: forceEnabled !== undefined ? forceEnabled : params.enabled,
    default: params.default,
    storage: params.storage === null ? undefined : params.storage,
    singleton: params.singleton,
    bounded: params.bounded,
    reporting: params.reporting,
    minInterval: params.minInterval,
    maxInterval: params.maxInterval,
    reportableChange: params.reportableChange
  }
  if (Object.values(changes).every((v) => v === undefined || v === null)) {
    throw new OperationError('Nothing to set', [
      'Pass at least one of --enabled, --default, --storage, --singleton,',
      '--bounded, --reporting, --min-interval, --max-interval, --reportable-change.'
    ])
  }

  let outcome = await sessionEdit.setAttribute(
    ctx,
    endpoint,
    cluster,
    side,
    attribute,
    changes
  )
  if (changes.enabled !== undefined && changes.enabled !== null) {
    await sessionEdit.updateRequiredElementWarning(
      ctx,
      endpoint,
      cluster,
      'attributes',
      attribute.id,
      !!changes.enabled
    )
  }

  return result(
    true,
    [
      `Attribute ${attribute.name} (${asHex(attribute.code)}) on ${cluster.name}/${side} of endpoint ${
        endpoint.endpointIdentifier
      }: ${outcome.described.join(', ')}`
    ],
    null,
    [],
    outcome.warnings
  )
}

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'attribute.list': (ctx, params) => attributeList(ctx, params),
  'attribute.set': (ctx, params) => attributeSet(ctx, params),
  'attribute.enable': (ctx, params) => attributeSet(ctx, params, true),
  'attribute.disable': (ctx, params) => attributeSet(ctx, params, false)
}

exports.operations = operations
