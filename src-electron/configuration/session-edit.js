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
 * The write sequence of a configuration edit, and the rules that gate it.
 *
 * The user interface, the configuration commands (`zap cluster enable`) and
 * the post-load scripts (`--postImportScript`, SDK upgrade rules) all change a
 * session through the operations, and the operations change it through here.
 * Everything that decides whether an edit is allowed, and what else it brings
 * along, lives in this module so that the interfaces cannot drift apart: the
 * storage and reporting policy of the data model, the rule that a Matter
 * cluster enabled as a client only has no configuration page, the defaults a
 * cluster receives when it is first enabled, and the conformance consequences
 * of a feature toggle.
 *
 * Refusals are thrown as `OperationError`, carrying the operations that would
 * make the edit possible as `remedies`, for the caller to present however it
 * presents things.
 *
 * The context is `{ db, sessionId, category }`. `category` narrows the ZCL
 * packages in a multiprotocol configuration and may be null. Lookups are
 * cached on the context for the duration of a run.
 *
 * @module Configuration API: session edits
 */

const dbEnum = require('../../src-shared/db-enum.js')
const restApi = require('../../src-shared/rest-api.js')
const queryConfig = require('../db/query-config.js')
const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')
const queryFeature = require('../db/query-feature.js')
const queryDeviceType = require('../db/query-device-type.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const querySessionNotification = require('../db/query-session-notification.js')
const validation = require('../validation/validation.js')
const conformChecker = require('../validation/conformance-checker.js')
const resolver = require('./resolver.js')
const policy = require('./policy.js')
const operationError = require('./errors.js')
const outcome = require('./outcome.js')

const OperationError = operationError.OperationError
const asHex = resolver.asHex

/**
 * The step that enables a cluster side, offered as the remedy whenever a
 * refusal comes down to that side being off.
 *
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @returns {*} a `cluster.enable` step
 */
function enableClusterStep(endpoint, cluster, side) {
  return outcome.step('cluster.enable', {
    endpoint: endpoint.endpointIdentifier,
    cluster: cluster.name,
    side: side
  })
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/**
 * Reads an optional boolean, tolerating the string forms that show up in
 * batch scripts and in the parameter arrays post-load scripts pass.
 *
 * @param {*} value
 * @returns {boolean | undefined} the boolean, or undefined when unset
 */
function optionalBoolean(value) {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  let s = String(value).toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(s)) return true
  if (['false', '0', 'no', 'off'].includes(s)) return false
  throw new OperationError(`Expected a boolean, got '${value}'`)
}

/**
 * Reads a storage option as the data model spells it, from whatever case the
 * caller used.
 *
 * @param {*} value
 * @returns {string | undefined} the option, or undefined when unset
 */
function storageOption(value) {
  if (value === undefined || value === null) return undefined
  let allowed = Object.values(dbEnum.storageOption)
  let found = allowed.find((s) => s.toLowerCase() === `${value}`.toLowerCase())
  if (found == null) {
    throw new OperationError(
      `Invalid storage '${value}', expected one of ${allowed.join(', ')}`
    )
  }
  return found
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

/**
 * The ZCL packages attached to a session, as ids. This is what cluster
 * defaults are drawn from when a cluster is first enabled.
 *
 * @param {*} ctx
 * @returns {Promise<number[]>} package ids
 */
async function zclPackageIds(ctx) {
  return resolver.zclPackageIds(ctx)
}

/**
 * The ZCL packages attached to a session, without a context. The HTTP layer
 * has a session id and nothing else when the cluster checkbox is ticked.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns {Promise<number[]>} package ids
 */
async function sessionZclPackageIds(db, sessionId) {
  let pkgs = await queryPackage.getSessionPackagesWithTypes(db, sessionId)
  return pkgs
    .filter(
      (pkg) =>
        pkg.type == dbEnum.packageType.zclProperties ||
        pkg.type == dbEnum.packageType.zclXmlStandalone
    )
    .map((pkg) => pkg.packageRef)
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

/**
 * True when a cluster side is enabled on an endpoint.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @returns {Promise<boolean>} whether the side is enabled
 */
async function isClusterSideEnabled(ctx, endpoint, cluster, side) {
  let state = await queryConfig.selectClusterState(
    ctx.db,
    endpoint.endpointTypeRef,
    cluster.id,
    side
  )
  return state != null && state.enabled === true
}

/**
 * Refuses to touch an element of a cluster side that is not enabled.
 *
 * The saved file format only keeps the elements of enabled clusters, so such
 * an edit would be silently discarded on the next save. The user interface
 * avoids the problem by only offering the element checkboxes of clusters that
 * are switched on; here we say so out loud instead.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @returns {Promise} resolves when the side is enabled, throws otherwise
 */
async function requireClusterSideEnabled(ctx, endpoint, cluster, side) {
  if (await isClusterSideEnabled(ctx, endpoint, cluster, side)) return
  throw new OperationError(
    `Cluster ${cluster.name} (${asHex(cluster.code)}) is not enabled on the ${side} side of endpoint ${endpoint.endpointIdentifier}`,
    [
      `Elements of a disabled cluster are not written to the .zap file. Enable it first:`
    ],
    [enableClusterStep(endpoint, cluster, side)]
  )
}

/**
 * Refuses to open the element surface of a Matter cluster that is enabled as
 * a client only.
 *
 * The user interface greys out Configure in exactly this case
 * (`enableServerOnly`, which is the Matter features flag): a Matter client
 * cluster has no attributes, commands, events or features page. Zigbee does
 * not have that restriction, and a Matter cluster that also has its server
 * side on is configurable as usual. Matching the selected endpoint's category
 * is what keeps multiprotocol honest — a Zigbee endpoint in the same file is
 * left alone.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @returns {Promise} resolves when the cluster is configurable, throws otherwise
 */
async function requireClusterConfigurable(ctx, endpoint, cluster) {
  let categories = await resolver.endpointCategories(ctx, endpoint)
  let matter = categories.some((c) =>
    resolver.sameCategory(c, dbEnum.helperCategory.matter)
  )
  if (!matter) return

  let client = await isClusterSideEnabled(
    ctx,
    endpoint,
    cluster,
    dbEnum.side.client
  )
  let server = await isClusterSideEnabled(
    ctx,
    endpoint,
    cluster,
    dbEnum.side.server
  )
  if (!(client && !server)) return

  throw new OperationError(
    `Cluster ${cluster.name} (${asHex(cluster.code)}) is enabled as a client only on endpoint ${endpoint.endpointIdentifier}, which has no configuration page`,
    [
      `Matter does not offer a page for attributes, commands, events or features of a client-only cluster. Enable the server side to configure it:`
    ],
    [enableClusterStep(endpoint, cluster, dbEnum.side.server)]
  )
}

/**
 * Enables or disables one side of a cluster on an endpoint type.
 *
 * The first time that side is enabled, the cluster's default attributes and
 * non-optional commands are inserted. That is the sequence run when the user
 * interface ticks the cluster checkbox. A side that is being turned off, and
 * has no row yet, is recorded as disabled and does not receive those defaults.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @param {*} clusterId
 * @param {string} side
 * @param {boolean} enabled
 * @param {*} packageIds ZCL packages the defaults are drawn from.
 * @returns {Promise<*>} the result of writing the cluster state row
 */
async function writeClusterState(
  db,
  endpointTypeId,
  clusterId,
  side,
  enabled,
  packageIds
) {
  let previous = await queryConfig.selectClusterState(
    db,
    endpointTypeId,
    clusterId,
    side
  )
  let result = await queryConfig.insertOrReplaceClusterState(
    db,
    endpointTypeId,
    clusterId,
    side,
    enabled
  )
  if (previous == null && enabled) {
    await queryConfig.insertClusterDefaults(db, endpointTypeId, packageIds, {
      clusterRef: clusterId,
      side: side
    })
  }
  return result
}

/**
 * Enables or disables one side of a cluster on an endpoint, with the defaults
 * the user interface inserts on first enable.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @param {boolean} enabled
 * @returns {Promise<*>} the result of writing the cluster state row
 */
async function setClusterSideEnabled(ctx, endpoint, cluster, side, enabled) {
  return writeClusterState(
    ctx.db,
    endpoint.endpointTypeRef,
    cluster.id,
    side,
    enabled,
    await zclPackageIds(ctx)
  )
}

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

/**
 * How one attribute is currently configured on an endpoint, or null when the
 * configuration has nothing recorded about it.
 *
 * The attribute reference is enough to name it precisely, including for the
 * global attributes that belong to every cluster: those are defined once per
 * side, so FeatureMap on the server and FeatureMap on the client are two
 * attributes and not one asked about twice.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} attribute
 * @returns {Promise<*>} the endpoint type attribute, or null
 */
async function attributeState(ctx, endpoint, cluster, attribute) {
  let states = await queryZcl.selectEndpointTypeAttributesByEndpointId(
    ctx.db,
    endpoint.endpointTypeRef
  )
  let state = states.find(
    (s) => s.clusterRef === cluster.id && s.attributeRef === attribute.id
  )
  return state === undefined ? null : state
}

/**
 * Refuses the attribute changes the user interface does not offer.
 *
 * Three kinds of thing are checked, all of them things the interface expresses
 * by greying a control out. Storage and reporting can be fixed by the data
 * model. An external attribute has nowhere to keep a default value. And how an
 * attribute is kept only means anything once the attribute is included.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @param {*} attribute
 * @param {*} requested `{ enabled, storage, reporting, default, singleton, bounded }`, undefined per field where not asked for.
 * @returns {Promise<undefined>} nothing, throws when a change is not the caller's to make
 */
async function requireAttributeChangeAllowed(
  ctx,
  endpoint,
  cluster,
  side,
  attribute,
  requested
) {
  let where = {
    attribute: attribute,
    cluster: cluster,
    side: side,
    endpoint: endpoint.endpointIdentifier
  }
  let attributePolicy = await policy.attributePolicy(ctx, cluster, attribute)
  let state = await attributeState(ctx, endpoint, cluster, attribute)

  // These fields configure how an included attribute is stored. An attribute
  // default can still be edited while disabled so the UI can validate the
  // value; it remains inactive until the attribute is included.
  let fieldsNeedingInclusion = [
    requested.storage !== undefined ? '--storage' : null,
    requested.singleton !== undefined ? '--singleton' : null,
    requested.bounded !== undefined ? '--bounded' : null
  ].filter((field) => field != null)
  if (fieldsNeedingInclusion.length > 0) {
    let included =
      requested.enabled !== undefined
        ? requested.enabled
        : state != null && !!state.included
    policy.requireIncluded(included, fieldsNeedingInclusion, where)
  }

  policy.requirePolicyRespected(attributePolicy, requested, where)

  if (requested.default !== undefined) {
    // The storage that will apply, which is what decides whether a default has
    // anywhere to live: what was asked for, else what is already set, else what
    // enabling the attribute would give it.
    let storage = requested.storage
    if (storage === undefined && state != null && state.storageOption != null) {
      storage = state.storageOption
    }
    if (storage === undefined) {
      storage =
        attributePolicy.storage != null
          ? attributePolicy.storage
          : dbEnum.storageOption.ram
    }
    policy.requireDefaultCanBeKept(
      requested.default,
      storage,
      attributePolicy,
      where
    )
  }
}

/**
 * Turns a set of attribute changes into the column updates that record them,
 * checking each value against the attribute on the way.
 *
 * `changes` may carry any of `enabled`, `default`, `storage`, `singleton`,
 * `bounded`, `reporting`, `minInterval`, `maxInterval` and `reportableChange`.
 * A field that is undefined is left alone. `default` may be null, or the
 * string 'null', to clear the value of a nullable attribute.
 *
 * @param {*} attribute
 * @param {*} changes
 * @returns {*} `{ updates, described, requested }`: the key/value pairs to
 *   write, one phrase per change, and the normalized request for the policy
 */
function attributeUpdates(attribute, changes) {
  let updates = []
  let described = []
  let push = (key, value, type, phrase) => {
    updates.push({ key: key, value: value, type: type })
    described.push(phrase)
  }

  let enabled = optionalBoolean(changes.enabled)
  if (enabled !== undefined) {
    push(
      restApi.updateKey.attributeSelected,
      enabled,
      '',
      enabled ? 'enabled' : 'disabled'
    )
  }

  let requestedDefault = changes.default
  if (requestedDefault !== undefined) {
    if (requestedDefault !== null && `${requestedDefault}` === '') {
      // The column write turns an empty string into 0, so accepting this would
      // quietly set a different value than the one asked for.
      throw new OperationError('An empty default is not a value', [
        `Pass the value you want, or 'null' for a nullable attribute.`
      ])
    }
    if (
      requestedDefault === null ||
      `${requestedDefault}`.toLowerCase() === 'null'
    ) {
      if (!attribute.isNullable) {
        throw new OperationError(`Attribute ${attribute.name} is not nullable`)
      }
      requestedDefault = null
      push(restApi.updateKey.attributeDefault, null, 'text', 'default=null')
    } else {
      push(
        restApi.updateKey.attributeDefault,
        `${requestedDefault}`,
        'text',
        `default=${requestedDefault}`
      )
    }
  }

  let storage = storageOption(changes.storage)
  if (storage !== undefined) {
    push(
      restApi.updateKey.attributeStorage,
      storage,
      'text',
      `storage=${storage}`
    )
  }

  let singleton = optionalBoolean(changes.singleton)
  if (singleton !== undefined) {
    push(
      restApi.updateKey.attributeSingleton,
      singleton,
      '',
      `singleton=${singleton}`
    )
  }

  let bounded = optionalBoolean(changes.bounded)
  if (bounded !== undefined) {
    push(restApi.updateKey.attributeBounded, bounded, '', `bounded=${bounded}`)
  }

  let reporting = optionalBoolean(changes.reporting)
  if (reporting !== undefined) {
    push(
      restApi.updateKey.attributeReporting,
      reporting,
      '',
      `reporting=${reporting}`
    )
  }

  if (changes.minInterval != null) {
    let value = resolver.requireInteger(changes.minInterval, 'Min interval')
    push(
      restApi.updateKey.attributeReportMin,
      value,
      '',
      `minInterval=${value}`
    )
  }
  if (changes.maxInterval != null) {
    let value = resolver.requireInteger(changes.maxInterval, 'Max interval')
    push(
      restApi.updateKey.attributeReportMax,
      value,
      '',
      `maxInterval=${value}`
    )
  }
  if (changes.reportableChange != null) {
    let value = resolver.requireInteger(
      changes.reportableChange,
      'Reportable change'
    )
    push(
      restApi.updateKey.attributeReportChange,
      value,
      '',
      `reportableChange=${value}`
    )
  }

  return {
    updates: updates,
    described: described,
    requested: {
      enabled: enabled,
      storage: storage,
      reporting: reporting,
      default: requestedDefault,
      singleton: singleton,
      bounded: bounded
    }
  }
}

/**
 * True for the FeatureMap attribute, whose value is the cluster's feature
 * selection.
 *
 * @param {*} attribute
 * @returns {boolean} whether this is FeatureMap
 */
function isFeatureMap(attribute) {
  return (
    attribute.code === dbEnum.featureMapAttribute.code &&
    attribute.name === dbEnum.featureMapAttribute.name
  )
}

/**
 * Applies any combination of attribute settings to one attribute on one
 * endpoint, refusing what the user interface would grey out.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @param {*} attribute The attribute definition, as the ZCL queries return it.
 * @param {*} changes See `attributeUpdates`.
 * @returns {Promise<*>} `{ described, warnings }`: one phrase per change made,
 *   and anything worth knowing that did not stop the write
 */
async function setAttribute(ctx, endpoint, cluster, side, attribute, changes) {
  await requireClusterConfigurable(ctx, endpoint, cluster)
  await requireClusterSideEnabled(ctx, endpoint, cluster, side)

  let { updates, described, requested } = attributeUpdates(attribute, changes)
  if (updates.length === 0) {
    throw new OperationError('Nothing to set', [
      'Pass at least one of enabled, default, storage, singleton, bounded,',
      'reporting, minInterval, maxInterval, reportableChange.'
    ])
  }

  await requireAttributeChangeAllowed(
    ctx,
    endpoint,
    cluster,
    side,
    attribute,
    requested
  )

  await queryConfig.insertOrUpdateAttributeState(
    ctx.db,
    endpoint.endpointTypeRef,
    cluster.id,
    side,
    attribute.id,
    updates,
    attribute.reportMinInterval,
    attribute.reportMaxInterval,
    attribute.reportableChange
  )

  let warnings = []

  // Excluding FeatureMap discards the cluster's whole feature selection,
  // because that selection is the attribute's value.
  if (requested.enabled === false && isFeatureMap(attribute)) {
    let features = await featuresOfCluster(ctx, endpoint, cluster)
    if (features.length > 0) {
      warnings.push(
        `${cluster.name} keeps its feature selection in FeatureMap, so excluding the attribute drops it`
      )
    }
  }

  let issues = await validation.validateAttribute(
    ctx.db,
    endpoint.endpointTypeRef,
    attribute.id,
    cluster.id,
    ctx.sessionId
  )
  warnings.push(...((issues && issues.defaultValue) || []))

  return { described: described, warnings: warnings }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/**
 * The cluster side a command direction is recorded against. A command the
 * device sends belongs to the side that is its source; one it receives belongs
 * to the opposite side.
 *
 * This deliberately mirrors the calculation inside `insertOrUpdateCommandState`
 * so that the side checked before writing is the side actually written to. It
 * inherits one quirk from it: a command declared with source `either` has no
 * opposite, so the outgoing direction lands on `either`, which is not a side a
 * cluster can have. `describeUnwritableDirection` explains that rather than
 * letting the caller puzzle over it.
 *
 * @param {*} command
 * @param {boolean} isIncoming
 * @returns {string} the cluster side, or the command source when it has none
 */
function commandSide(command, isIncoming) {
  if (!isIncoming) return command.source
  return command.source === dbEnum.source.client
    ? dbEnum.source.server
    : dbEnum.source.client
}

/**
 * Explains a direction that cannot be recorded at all, as opposed to one whose
 * cluster side merely happens to be switched off.
 *
 * @param {*} command
 * @param {boolean} isIncoming
 * @returns {*} a OperationError, or null when the direction is expressible
 */
function describeUnwritableDirection(command, isIncoming) {
  let side = commandSide(command, isIncoming)
  if (side === dbEnum.source.client || side === dbEnum.source.server) {
    return null
  }
  return new OperationError(
    `Command ${command.name} is declared with source '${command.source}', so ZAP has no cluster side to record its outgoing direction against`,
    [`Enable it as an incoming command instead:`, `  --direction in`]
  )
}

/**
 * Enables or disables a command in one direction on an endpoint, refusing a
 * direction that has no cluster side to be recorded against or whose side is
 * not enabled.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} command
 * @param {boolean} isIncoming
 * @param {boolean} enabled
 * @returns {Promise<*>} the result of writing the command state
 */
async function setCommandEnabled(
  ctx,
  endpoint,
  cluster,
  command,
  isIncoming,
  enabled
) {
  await requireClusterConfigurable(ctx, endpoint, cluster)
  let unwritable = describeUnwritableDirection(command, isIncoming)
  if (unwritable != null) throw unwritable
  await requireClusterSideEnabled(
    ctx,
    endpoint,
    cluster,
    commandSide(command, isIncoming)
  )
  return queryConfig.insertOrUpdateCommandState(
    ctx.db,
    endpoint.endpointTypeRef,
    cluster.id,
    command.source,
    command.id,
    enabled,
    isIncoming
  )
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Enables or disables an event on an endpoint, refusing an event of a cluster
 * side that is not enabled.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} event
 * @param {string} side
 * @param {boolean} enabled
 * @returns {Promise<*>} the result of writing the event state
 */
async function setEventEnabled(ctx, endpoint, cluster, event, side, enabled) {
  await requireClusterConfigurable(ctx, endpoint, cluster)
  await requireClusterSideEnabled(ctx, endpoint, cluster, side)
  return queryConfig.insertOrUpdateEventState(
    ctx.db,
    endpoint.endpointTypeRef,
    cluster.id,
    side,
    event.id,
    enabled
  )
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

/**
 * The features a cluster defines, as they apply to one endpoint.
 *
 * A feature's conformance can be overridden by the endpoint's device type:
 * Lighting is conditional on On/Off in general and mandatory on a Dimmable
 * Light. The device type's view is what the user interface shows and what the
 * conformance checker needs, so it is what is returned, with the cluster's own
 * conformance kept alongside.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @returns {Promise<Array>} features, in bit order
 */
async function featuresOfCluster(ctx, endpoint, cluster) {
  let features = await queryFeature.selectFeaturesByClusterId(
    ctx.db,
    cluster.id
  )
  let deviceTypeRefs = (
    await queryDeviceType.selectDeviceTypesByEndpointTypeId(
      ctx.db,
      endpoint.endpointTypeRef
    )
  ).map((d) => d.deviceTypeRef)
  let deviceTypeFeatures =
    deviceTypeRefs.length > 0
      ? await queryFeature.getFeaturesByDeviceTypeRefs(
          ctx.db,
          deviceTypeRefs,
          endpoint.endpointTypeRef
        )
      : []

  return features.map((feature) => {
    let fromDeviceType = deviceTypeFeatures.find(
      (dtf) =>
        dtf.featureId === feature.featureId &&
        dtf.clusterRef === feature.clusterRef
    )
    return {
      ...feature,
      cluster: cluster.name,
      clusterConformance: feature.conformance,
      conformance: fromDeviceType
        ? fromDeviceType.conformance
        : feature.conformance,
      deviceTypes: fromDeviceType ? fromDeviceType.deviceTypes : undefined
    }
  })
}

/**
 * Finds the FeatureMap attribute of a cluster and its state on an endpoint.
 * Features are represented as bits of this attribute's value.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @returns {Promise<*>} `{ definition, state, value, included }`
 */
async function featureMapAttribute(ctx, endpoint, cluster) {
  let attributes = await resolver.attributesOfCluster(
    ctx,
    cluster,
    dbEnum.side.server
  )
  let definition = attributes.find(isFeatureMap)
  if (definition == null) {
    throw new OperationError(
      `Cluster ${cluster.name} has no FeatureMap attribute, so it has no features to toggle`
    )
  }
  let state = await queryZcl.selectEndpointTypeAttribute(
    ctx.db,
    endpoint.endpointTypeRef,
    definition.id,
    cluster.id
  )
  let raw = state != null ? state.defaultValue : definition.defaultValue
  let value = resolver.parseCode(raw)
  return {
    definition: definition,
    state: state,
    value: value == null ? 0 : value,
    // Features live in this attribute's value, so if the attribute is not part
    // of the configuration the features have nowhere to be recorded.
    included: state != null && state.included === true
  }
}

/**
 * Refuses a feature change that could not be recorded.
 *
 * A feature is a bit of the FeatureMap attribute's value, and the saved file
 * format only keeps attributes that are part of the configuration. Toggling a
 * feature while that attribute is excluded looks like it works and is gone by
 * the next load, so it is refused instead.
 *
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} map Result of `featureMapAttribute`.
 * @returns {undefined} nothing, throws when the change could not be kept
 */
function requireFeatureMapIncluded(endpoint, cluster, map) {
  if (map.included) return
  throw new OperationError(
    `The FeatureMap attribute of ${cluster.name} is not enabled on endpoint ${endpoint.endpointIdentifier}, so feature changes cannot be saved`,
    [`Features are bits of that attribute's value. Enable it first:`],
    [
      outcome.step('attribute.enable', {
        endpoint: endpoint.endpointIdentifier,
        cluster: cluster.name,
        attribute: dbEnum.featureMapAttribute.name
      })
    ]
  )
}

/**
 * Builds the `{ featureCode: boolean }` map the conformance checker works
 * with, out of a FeatureMap value.
 *
 * @param {Array} features
 * @param {number} value
 * @returns {*} the feature map
 */
function featureMapFromValue(features, value) {
  let map = {}
  features.forEach((f) => {
    map[f.code] = (value & (1 << f.bit)) !== 0
  })
  return map
}

/**
 * Picks a feature out of a cluster's list. Feature codes are short letter
 * codes such as LT rather than numbers, so a bare number is read as a bit
 * position; a name matches too.
 *
 * @param {*} spec Code, name or bit.
 * @param {Array} features Result of `featuresOfCluster`.
 * @returns {*} the feature
 */
function matchFeature(spec, features) {
  let bit = resolver.parseCode(spec)
  let describe = (f) => `${f.name} (${f.code}, bit ${f.bit})`
  let matches
  if (bit != null) {
    matches = features.filter((f) => f.bit === bit)
  } else {
    let normalized = resolver.normalizeName(spec)
    matches = features.filter(
      (f) =>
        resolver.normalizeName(f.name) === normalized ||
        resolver.normalizeName(f.code) === normalized
    )
  }
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) {
    throw operationError.notFound('feature', spec, features.map(describe))
  }
  throw operationError.ambiguous('feature', spec, matches.map(describe))
}

/**
 * Enables or disables a cluster feature on an endpoint.
 *
 * A feature is a bit of the FeatureMap attribute, but flipping that bit is
 * only part of the job: the conformance rules decide which attributes,
 * commands and events have to come with it, and can refuse the change
 * outright. This runs the same conformance check the user interface runs
 * before it opens its confirmation dialog, and then applies what the check
 * says, which is what pressing Confirm does.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} feature One of `featuresOfCluster`.
 * @param {boolean} enabled
 * @returns {Promise<*>} `{ changed, map, newValue, conformance, elements }`
 *   where `applied` lists `{ kind, name, value }` for every element the
 *   conformance rules changed alongside the feature
 */
async function previewFeatureChange(ctx, endpoint, cluster, feature, enabled) {
  await requireClusterConfigurable(ctx, endpoint, cluster)
  await requireClusterSideEnabled(ctx, endpoint, cluster, dbEnum.side.server)
  policy.requireToggleableFeature(feature, cluster, endpoint.endpointIdentifier)

  let features = await featuresOfCluster(ctx, endpoint, cluster)
  let map = await featureMapAttribute(ctx, endpoint, cluster)
  requireFeatureMapIncluded(endpoint, cluster, map)
  let newValue = enabled
    ? map.value | (1 << feature.bit)
    : map.value & ~(1 << feature.bit)
  if (newValue === map.value) {
    return {
      changed: false,
      map: map,
      newValue: newValue,
      conformance: null,
      applied: []
    }
  }

  let endpointTypeClusterId =
    await conformChecker.getEndpointTypeClusterIdFromFeatureData(
      ctx.db,
      feature,
      endpoint.endpointTypeRef
    )
  let elements = await queryEndpointType.getEndpointTypeElements(
    ctx.db,
    endpointTypeClusterId
  )
  let conformance = conformChecker.checkElementConformance(
    elements,
    featureMapFromValue(features, newValue),
    feature,
    endpoint.endpointIdentifier,
    features
  )

  return {
    changed: true,
    map: map,
    newValue: newValue,
    conformance: conformance,
    elements: elements,
    features: features
  }
}

/** Applies a previewed feature change to its endpoint type. */
async function setFeatureEnabled(ctx, endpoint, cluster, feature, enabled) {
  const preview = await previewFeatureChange(
    ctx,
    endpoint,
    cluster,
    feature,
    enabled
  )
  if (!preview.changed) return { ...preview, applied: [] }

  const { map, newValue, conformance } = preview
  const { elements, features } = preview

  await querySessionNotification.setNotificationOnFeatureChange(
    ctx.db,
    ctx.sessionId,
    conformance
  )

  if (conformance.disableChange) {
    throw new OperationError(
      `Feature ${feature.name} (${feature.code}) cannot be ${enabled ? 'enabled' : 'disabled'} on ${cluster.name} of endpoint ${endpoint.endpointIdentifier}`,
      [].concat(conformance.warningMessage || [])
    )
  }

  const outdatedWarnings = conformChecker.getOutdatedElementWarning(
    feature.code,
    elements,
    conformance.elementMap
  )
  await querySessionNotification.deleteNotificationWithPatterns(
    ctx.db,
    ctx.sessionId,
    outdatedWarnings
  )

  let applied = []
  for (let attribute of conformance.attributesToUpdate || []) {
    await queryConfig.insertOrUpdateAttributeState(
      ctx.db,
      endpoint.endpointTypeRef,
      attribute.clusterRef,
      attribute.side,
      attribute.id,
      [
        {
          key: restApi.updateKey.attributeSelected,
          value: attribute.value,
          type: ''
        }
      ],
      attribute.reportMinInterval,
      attribute.reportMaxInterval,
      attribute.reportableChange
    )
    applied.push({
      kind: 'attribute',
      name: attribute.name,
      value: !!attribute.value
    })
  }
  for (let command of conformance.commandsToUpdate || []) {
    await queryConfig.insertOrUpdateCommandState(
      ctx.db,
      endpoint.endpointTypeRef,
      command.clusterRef,
      command.source,
      command.id,
      command.value,
      command.source === dbEnum.source.client
    )
    applied.push({
      kind: 'command',
      name: command.name,
      value: !!command.value
    })
  }
  for (let event of conformance.eventsToUpdate || []) {
    await queryConfig.insertOrUpdateEventState(
      ctx.db,
      endpoint.endpointTypeRef,
      event.clusterRef,
      event.side,
      event.id,
      event.value
    )
    applied.push({ kind: 'event', name: event.name, value: !!event.value })
  }

  await queryConfig.insertOrUpdateAttributeState(
    ctx.db,
    endpoint.endpointTypeRef,
    cluster.id,
    dbEnum.side.server,
    map.definition.id,
    [
      {
        key: restApi.updateKey.attributeDefault,
        value: `${newValue}`,
        type: 'text'
      }
    ],
    map.state != null ? map.state.minInterval : undefined,
    map.state != null ? map.state.maxInterval : undefined,
    map.state != null ? map.state.reportableChange : undefined
  )

  await updateRequiredElementWarnings(
    ctx,
    endpoint,
    cluster,
    preview.elements,
    conformance,
    features,
    newValue
  )

  return {
    changed: true,
    map: map,
    newValue: newValue,
    conformance: conformance,
    applied: applied
  }
}

/** Keep the feature-related required/unsupported warnings in sync with the writes. */
async function updateRequiredElementWarnings(
  ctx,
  endpoint,
  cluster,
  sourceElements,
  conformance,
  features,
  featureMapValue
) {
  const elements = {
    attributes: sourceElements.attributes.map((element) => ({ ...element })),
    commands: sourceElements.commands.map((element) => ({ ...element })),
    events: sourceElements.events.map((element) => ({ ...element }))
  }
  const groups = [
    ['attributes', conformance.attributesToUpdate, 'included'],
    ['commands', conformance.commandsToUpdate, 'isEnabled'],
    ['events', conformance.eventsToUpdate, 'included']
  ]
  groups.forEach(([kind, updates, stateKey]) => {
    for (const update of updates || []) {
      const current = elements[kind].find((element) => element.id === update.id)
      if (current != null) current[stateKey] = !!update.value
    }
  })

  const required = conformChecker.checkElementConformance(
    elements,
    featureMapFromValue(features, featureMapValue)
  )
  for (const [kind, updates, stateKey] of groups) {
    const resultKey =
      kind === 'attributes'
        ? 'attributesToUpdate'
        : kind === 'commands'
          ? 'commandsToUpdate'
          : 'eventsToUpdate'
    const warnings = required[resultKey]
    const contextMessage =
      `⚠ Check Feature Compliance on endpoint: ${endpoint.endpointIdentifier}, ` +
      `cluster: ${cluster.name}, ${kind.slice(0, -1)}: `
    for (const update of updates || []) {
      const element = elements[kind].find(
        (candidate) => candidate.id === update.id
      )
      if (element == null) continue
      await querySessionNotification.setRequiredElementWarning(
        ctx.db,
        {
          element,
          contextMessage,
          requiredText: warnings.required[element.id],
          notSupportedText: warnings.notSupported[element.id],
          added: !!element[stateKey]
        },
        ctx.sessionId
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Element conformance
// ---------------------------------------------------------------------------

/**
 * The element conformance of one cluster on an endpoint, judged against the
 * saved feature map: which attributes, commands and events the selected
 * features require or forbid.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {boolean} [allowMissingMap] Treat a cluster without a FeatureMap as having none selected.
 * @returns {Promise<*>} `{ elements, requirements }`
 */
async function featureRequirementData(
  ctx,
  endpoint,
  cluster,
  allowMissingMap = false
) {
  const features = await featuresOfCluster(ctx, endpoint, cluster)
  let featureMap = featureMapFromValue(features, 0)
  if (features.length > 0) {
    try {
      const map = await featureMapAttribute(ctx, endpoint, cluster)
      featureMap = featureMapFromValue(features, map.value)
    } catch (error) {
      if (
        !allowMissingMap ||
        !(error instanceof OperationError) ||
        !error.message.includes('has no FeatureMap attribute')
      ) {
        throw error
      }
    }
  }
  const endpointTypeClusterId =
    await conformChecker.getEndpointTypeClusterIdFromFeatureData(
      ctx.db,
      null,
      endpoint.endpointTypeRef,
      cluster.id
    )
  const elements = await queryEndpointType.getEndpointTypeElements(
    ctx.db,
    endpointTypeClusterId
  )
  const requirements = conformChecker.checkElementConformance(
    elements,
    featureMap
  )
  return { elements, requirements }
}

/**
 * Records, as a session notification, whether an element that was just
 * toggled is one its cluster's features require or forbid. This is the
 * notice the user interface raises when a checkbox goes against conformance.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} kind 'attributes', 'commands' or 'events'.
 * @param {number} elementId
 * @param {boolean} added Whether the element was switched on.
 * @returns {Promise} resolves when the notification is in step
 */
async function updateRequiredElementWarning(
  ctx,
  endpoint,
  cluster,
  kind,
  elementId,
  added
) {
  const { elements, requirements } = await featureRequirementData(
    ctx,
    endpoint,
    cluster,
    true
  )
  const kindResult = {
    attributes: 'attributesToUpdate',
    commands: 'commandsToUpdate',
    events: 'eventsToUpdate'
  }[kind]
  const element = elements[kind].find(
    (candidate) => Number(candidate.id) === Number(elementId)
  )
  if (element == null) return
  const conformance = requirements[kindResult]
  await querySessionNotification.setRequiredElementWarning(
    ctx.db,
    {
      element,
      contextMessage:
        `⚠ Check Feature Compliance on endpoint: ${endpoint.endpointIdentifier}, ` +
        `cluster: ${cluster.name}, ${kind.slice(0, -1)}: `,
      requiredText: conformance.required[element.id],
      notSupportedText: conformance.notSupported[element.id],
      added
    },
    ctx.sessionId
  )
}

exports.optionalBoolean = optionalBoolean
exports.storageOption = storageOption

exports.zclPackageIds = zclPackageIds
exports.sessionZclPackageIds = sessionZclPackageIds

exports.isClusterSideEnabled = isClusterSideEnabled
exports.requireClusterSideEnabled = requireClusterSideEnabled
exports.requireClusterConfigurable = requireClusterConfigurable
exports.writeClusterState = writeClusterState
exports.setClusterSideEnabled = setClusterSideEnabled

exports.attributeState = attributeState
exports.requireAttributeChangeAllowed = requireAttributeChangeAllowed
exports.attributeUpdates = attributeUpdates
exports.isFeatureMap = isFeatureMap
exports.setAttribute = setAttribute

exports.commandSide = commandSide
exports.describeUnwritableDirection = describeUnwritableDirection
exports.setCommandEnabled = setCommandEnabled

exports.setEventEnabled = setEventEnabled

exports.featuresOfCluster = featuresOfCluster
exports.featureMapAttribute = featureMapAttribute
exports.requireFeatureMapIncluded = requireFeatureMapIncluded
exports.featureMapFromValue = featureMapFromValue
exports.matchFeature = matchFeature
exports.previewFeatureChange = previewFeatureChange
exports.setFeatureEnabled = setFeatureEnabled
exports.featureRequirementData = featureRequirementData
exports.updateRequiredElementWarning = updateRequiredElementWarning
