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
 * Cluster feature operations (Matter): listing, toggling, previewing what a toggle drags along, and the element requirements of the saved feature map.
 *
 * @module Configuration API: feature operations
 */

const querySessionNotification = require('../../db/query-session-notification.js')
const sessionEdit = require('../session-edit.js')
const resolver = require('../resolver.js')
const operationError = require('../errors.js')
const outcome = require('../outcome.js')

const { listingNext, applyFilter } = require('./listing.js')

const result = outcome.result
const step = outcome.step
const OperationError = operationError.OperationError
const asHex = resolver.asHex
const optionalBoolean = sessionEdit.optionalBoolean

/**
 * Feature lookups and the FeatureMap attribute, shared with post-load scripts
 * so that a feature toggled from either place drags the same elements along.
 */
const featuresOfCluster = sessionEdit.featuresOfCluster
const featureMapAttribute = sessionEdit.featureMapAttribute
const featureMapFromValue = sessionEdit.featureMapFromValue
const matchFeature = sessionEdit.matchFeature

/**
 * Lists the features of a cluster with their bit and current state.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function featureList(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  await sessionEdit.requireClusterConfigurable(ctx, endpoint, cluster)
  let features = await featuresOfCluster(ctx, endpoint, cluster)
  if (features.length === 0) {
    return result(false, [`Cluster ${cluster.name} defines no features`])
  }
  let map = await featureMapAttribute(ctx, endpoint, cluster)
  let enabled = featureMapFromValue(features, map.value)
  let rows = applyFilter(
    features.map((f) => ({
      bit: f.bit,
      code: f.code,
      name: f.name,
      enabled: enabled[f.code] ? 'yes' : 'no',
      // The conformance that actually applies here, which is the device
      // type's where it has one.
      conformance: f.conformance || '',
      requiredBy: f.deviceTypes ? f.deviceTypes.join(', ') : ''
    })),
    params.filter
  )

  let messages = [
    `endpoint ${endpoint.endpointIdentifier}, cluster ${cluster.name}: featureMap ${asHex(
      map.value,
      8
    )}`
  ]
  // Without it the all-off listing below looks like a real answer.
  let warnings = map.included
    ? []
    : [
        `the FeatureMap attribute is not enabled here, so no feature selection is being kept`
      ]

  return result(
    false,
    messages,
    {
      columns: ['bit', 'code', 'name', 'enabled', 'conformance', 'requiredBy'],
      rows: rows
    },
    listingNext(ctx, params, rows, {
      // Only ever propose switching a feature on. Turning one off can be the
      // right thing to do, but never as an unprompted suggestion: the features
      // already on are frequently mandatory for the endpoint's device type.
      pick: (candidates) => candidates.find((r) => r.enabled === 'no'),
      act: (row) =>
        step('feature.enable', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name,
          feature: row.code
        })
    }),
    warnings
  )
}

/**
 * The warning a feature change carries, when the conformance checker means
 * it to be shown.
 *
 * The interface pops up this warning only when displayWarning says to. The
 * message is composed either way, and after an enable that satisfies a
 * mandatory conformance it reads as though the enable had not happened.
 *
 * @param {*} conformance Result of the conformance check, may be null.
 * @returns {string[]} warnings
 */
function conformanceWarnings(conformance) {
  if (conformance == null || !conformance.displayWarning) return []
  return [].concat(conformance.warningMessage || [])
}

/**
 * Enables or disables a cluster feature.
 *
 * A feature is a bit of the FeatureMap attribute, but flipping that bit is
 * only part of the job: the conformance rules decide which attributes,
 * commands and events have to come with it, and can refuse the change
 * outright. This runs the same conformance check the user interface runs
 * before it opens its confirmation dialog, and then applies what the check
 * says, which is what pressing Confirm does.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} enabled
 * @returns {Promise<*>} operation result
 */
async function featureSetEnabled(ctx, params, enabled) {
  let endpoint = await resolver.endpointFromParams(ctx, params)
  let cluster = await resolver.clusterFromParams(ctx, endpoint, params)

  let features = await featuresOfCluster(ctx, endpoint, cluster)
  if (features.length === 0) {
    throw new OperationError(`Cluster ${cluster.name} defines no features`)
  }
  let feature = matchFeature(params.feature, features)
  if (!feature) throw new OperationError(`Unknown feature ${params.feature}`)

  let outcome = await sessionEdit.setFeatureEnabled(
    ctx,
    endpoint,
    cluster,
    feature,
    enabled
  )
  if (!outcome.changed) {
    return {
      ...result(false, [
        `Feature ${feature.name} (${feature.code}) is already ${enabled ? 'enabled' : 'disabled'} on ${cluster.name} of endpoint ${endpoint.endpointIdentifier}`
      ]),
      newValue: outcome.newValue,
      feature: {
        id: feature.id,
        featureId: feature.featureId,
        code: feature.code
      }
    }
  }

  let conformance = outcome.conformance

  // The confirmation dialog is the only place the user interface says how much
  // a feature drags along with it, and it does so by listing the elements. A
  // count says the same thing in one line, which is what a caller watching for
  // a surprise wants to read first.
  let counted = countElements(conformance)

  return {
    ...result(
      true,
      [
        `${enabled ? 'Enabled' : 'Disabled'} feature ${feature.name} (${feature.code}, bit ${feature.bit}) on ${cluster.name} of endpoint ${endpoint.endpointIdentifier}, featureMap ${asHex(outcome.map.value, 8)} -> ${asHex(outcome.newValue, 8)}`,
        counted,
        ...outcome.applied.map(
          (a) => `  ${a.value ? 'enabled' : 'disabled'} ${a.kind} ${a.name}`
        )
      ].filter((line) => line !== null),
      null,
      [],
      conformanceWarnings(conformance)
    ),
    newValue: outcome.newValue,
    feature: {
      id: feature.id,
      featureId: feature.featureId,
      code: feature.code
    }
  }
}

/**
 * Previews a feature change with the same conformance plan the write uses.
 * The GUI uses this result to populate its confirmation dialog.
 */
async function featurePreview(ctx, params) {
  let endpoint = await resolver.endpointFromParams(ctx, params)
  let cluster = await resolver.clusterFromParams(ctx, endpoint, params)
  let enabled = optionalBoolean(params.enabled)
  if (enabled === undefined) {
    throw new OperationError("Option 'enabled' is required")
  }
  let features = await featuresOfCluster(ctx, endpoint, cluster)
  let feature = matchFeature(params.feature, features)
  if (!feature) throw new OperationError(`Unknown feature ${params.feature}`)
  const preview = await sessionEdit.previewFeatureChange(
    ctx,
    endpoint,
    cluster,
    feature,
    enabled
  )
  const conformance = preview.conformance
  if (params.persistWarning && conformance && conformance.disableChange) {
    await querySessionNotification.setNotificationOnFeatureChange(
      ctx.db,
      ctx.sessionId,
      conformance
    )
  }
  return {
    ...result(
      false,
      [],
      conformance == null
        ? { columns: ['kind', 'element', 'enabled'], rows: [] }
        : {
            columns: ['kind', 'element', 'enabled'],
            rows: [
              ['attribute', conformance.attributesToUpdate],
              ['command', conformance.commandsToUpdate],
              ['event', conformance.eventsToUpdate]
            ].flatMap(([kind, elements]) =>
              (elements || []).map((element) => ({
                kind,
                element: element.name,
                enabled: element.value ? 'yes' : 'no'
              }))
            )
          },
      [],
      conformanceWarnings(conformance)
    ),
    preview: conformance,
    changed: preview.changed,
    newValue: preview.newValue,
    feature: {
      id: feature.id,
      featureId: feature.featureId,
      code: feature.code
    }
  }
}

/** Returns the required and prohibited elements for the saved feature map. */
async function featureRequirements(ctx, params) {
  const endpoint = await resolver.endpointFromParams(ctx, params)
  const cluster = await resolver.clusterFromParams(ctx, endpoint, params)
  const { requirements } = await sessionEdit.featureRequirementData(
    ctx,
    endpoint,
    cluster
  )
  const rows = [
    ['attribute', requirements.attributesToUpdate],
    ['command', requirements.commandsToUpdate],
    ['event', requirements.eventsToUpdate]
  ].flatMap(([kind, states]) =>
    ['required', 'notSupported'].flatMap((state) =>
      Object.entries(states[state] || {}).map(([id, message]) => ({
        kind,
        id: Number(id),
        state,
        message
      }))
    )
  )
  return {
    ...result(false, [`${rows.length} required or unsupported element(s)`], {
      columns: ['kind', 'id', 'state', 'message'],
      rows
    }),
    requirements
  }
}

/**
 * Summarizes how many elements a conformance check wants changed, in the
 * wording the confirmation dialog uses: enabling comes first, since that is
 * the direction that costs flash.
 *
 * @param {*} conformance Result of `checkElementConformance`.
 * @returns {string | null} the summary, or null when nothing else changed
 */
function countElements(conformance) {
  let kinds = [
    ['attribute', conformance.attributesToUpdate],
    ['command', conformance.commandsToUpdate],
    ['event', conformance.eventsToUpdate]
  ]
  let describe = (wanted) => {
    let parts = kinds
      .map(([kind, list]) => [
        kind,
        (list || []).filter((e) => (e.value ? true : false) === wanted).length
      ])
      .filter(([, count]) => count > 0)
      .map(([kind, count]) => `${count} ${kind}${count === 1 ? '' : 's'}`)
    return parts.length === 0 ? null : parts.join(' and ')
  }
  let phrases = [
    [describe(true), 'enabled'],
    [describe(false), 'disabled']
  ]
    .filter(([text]) => text != null)
    .map(([text, state]) => `${text} ${state}`)
  return phrases.length === 0 ? null : `Its conformance ${phrases.join(', ')}:`
}

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'feature.list': (ctx, params) => featureList(ctx, params),
  'feature.preview': (ctx, params) => featurePreview(ctx, params),
  'feature.requirements': (ctx, params) => featureRequirements(ctx, params),
  'feature.enable': (ctx, params) => featureSetEnabled(ctx, params, true),
  'feature.disable': (ctx, params) => featureSetEnabled(ctx, params, false)
}

exports.operations = operations
