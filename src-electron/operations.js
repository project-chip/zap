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
 * The configuration engine. The command line and post-load scripts are
 * interfaces over it: each translates its inputs and presents the result, but
 * edits, lookups and refusals are shared here.
 *
 * Each operation takes `(ctx, params)` and returns
 * `{ changed, messages, table, next }`: whether the configuration was
 * modified, lines describing what happened, optional tabular output, and the
 * commands that are the natural thing to run afterwards. `execute` runs one
 * by its dotted name, which is how a batch and a post-load script invoke it.
 *
 * @module JS API: operations
 */

const fs = require('fs')
const path = require('path')

const dbEnum = require('../src-shared/db-enum.js')
const restApi = require('../src-shared/rest-api.js')
const queryConfig = require('./db/query-config.js')
const queryEndpoint = require('./db/query-endpoint.js')
const queryEndpointType = require('./db/query-endpoint-type.js')
const queryDeviceType = require('./db/query-device-type.js')
const queryZcl = require('./db/query-zcl.js')
const queryPackage = require('./db/query-package.js')
const querySession = require('./db/query-session.js')
const querySessionNotification = require('./db/query-session-notification.js')
const querySessionZcl = require('./db/query-session-zcl.js')
const validation = require('./validation/validation.js')
const conformChecker = require('./validation/conformance-checker.js')
const sharedClusterState = require('./util/shared-cluster-state.js')
const sessionEdit = require('./util/session-edit.js')
const studio = require('./ide-integration/studio-rest-api.js')
const zclComponents = require('./ide-integration/zcl-components.js')
const { StatusCodes } = require('http-status-codes')
const resolver = require('./util/resolver.js')
const operationError = require('./util/operation-error.js')
const sessionContent = require('./util/session-content.js')
const validationReport = require('./util/validation-report.js')
const dataModelPolicy = require('./util/policy.js')

const OperationError = operationError.OperationError

const asHex = resolver.asHex
const editableSessionOptionKeys = new Set([
  dbEnum.sessionOption.manufacturerCodes,
  dbEnum.sessionOption.defaultResponsePolicy,
  'commandDiscovery',
  dbEnum.sessionKey.disableComponentToggling,
  dbEnum.sessionKey.informationText
])

/**
 * Shorthand for building an operation result.
 *
 * @param {boolean} changed Whether the configuration was modified.
 * @param {string[]} messages Lines describing what happened.
 * @param {*} [table] Optional `{ columns, rows }` tabular payload.
 * @param {string[]} [next] Commands that are the natural thing to run next.
 * @returns {*} operation result
 */
function result(changed, messages, table = null, next = []) {
  return { changed: changed, messages: messages, table: table, next: next }
}

/**
 * Quotes a value so the suggested commands can be pasted into a shell as they
 * stand. Cluster and device type names routinely contain spaces and slashes.
 *
 * @param {*} value
 * @returns {string} the value, quoted if it needs to be
 */
function shellQuote(value) {
  let text = `${value}`
  return /^[A-Za-z0-9._:/=-]+$/.test(text) ? text : `"${text}"`
}

/**
 * Builds a runnable configuration command against the file in hand.
 *
 * Suggestions are only worth printing if they can be run without editing them
 * first, so the real file name goes in and values are quoted.
 *
 * @param {*} ctx
 * @param {string} operation Space separated group and verb, e.g. 'cluster enable'.
 * @param {*} [options] Flag values, keyed by flag name without the dashes.
 * @returns {string} the command line
 */
function suggestion(ctx, operation, options = {}) {
  let parts = [`zap ${operation}`, shellQuote(ctx.zapFile || '<file.zap>')]
  for (let [flag, value] of Object.entries(options)) {
    if (value === undefined || value === null) continue
    parts.push(value === true ? `--${flag}` : `--${flag} ${shellQuote(value)}`)
  }
  return parts.join(' ')
}

/**
 * Reads an optional boolean parameter, tolerating the string forms that show
 * up in batch scripts.
 *
 * @param {*} value
 * @returns {boolean | undefined} the boolean, or undefined when unset
 */
const optionalBoolean = sessionEdit.optionalBoolean

/**
 * Normalizes a parameter that may be given once or several times into an
 * array.
 *
 * @param {*} value
 * @returns {Array} array form of the value
 */
function asArray(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Follow-up commands for a listing.
 *
 * When rows came back, the useful next step is to act on one of them, so the
 * suggestion is built from a real row and can be run as printed. `pick` chooses
 * which row, and gets to decline: a suggestion has to be both safe to run and
 * worth running, so nothing is proposed that would undo a mandatory selection
 * or amount to a no-op. When a filter matched nothing, the useful next step is
 * to widen the search instead.
 *
 * @param {*} ctx
 * @param {*} params The parameters the listing was called with.
 * @param {Array} rows The rows it produced.
 * @param {*} handlers `{ pick(rows), act(row), widen() }`.
 * @returns {string[]} suggested commands
 */
function listingNext(ctx, params, rows, handlers) {
  if (rows.length > 0) {
    let row = handlers.pick ? handlers.pick(rows) : rows[0]
    return row != null && handlers.act ? [].concat(handlers.act(row)) : []
  }
  let filtered = params.filter != null && `${params.filter}` !== ''
  if (filtered && handlers.widen) return [].concat(handlers.widen())
  return []
}

/**
 * Chooses the first row that is switched off, so that the command suggested
 * from it does something, falling back to the first row when everything is on.
 *
 * @param {Array} rows
 * @param {string} field Column holding the yes/no state.
 * @returns {*} the chosen row
 */
function firstDisabled(rows, field = 'enabled') {
  return rows.find((r) => r[field] === 'no') || rows[0]
}

/**
 * The lowest endpoint identifier not already in use, which is what the user
 * interface offers when you add an endpoint.
 *
 * @param {*} ctx
 * @returns {Promise<number>} a free endpoint identifier
 */
async function lowestFreeEndpoint(ctx) {
  let used = new Set(
    (await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)).map(
      (e) => e.endpointIdentifier
    )
  )
  let candidate = 1
  while (used.has(candidate)) candidate++
  return candidate
}

/**
 * Narrows a listing to the rows that mention some text. Catalogs run to
 * hundreds of entries, and scanning all of them to find one name is wasteful
 * whether the reader is a person or a program.
 *
 * @param {Array} rows
 * @param {*} filter Text to look for, matched loosely against every column.
 * @returns {Array} the matching rows
 */
function applyFilter(rows, filter) {
  if (filter == null || `${filter}` === '') return rows
  let needle = resolver.normalizeName(filter)
  if (needle === '') return rows
  return rows.filter((row) =>
    Object.values(row).some((value) =>
      resolver.normalizeName(value).includes(needle)
    )
  )
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * Lists the endpoints of a configuration together with their device types.
 *
 * @param {*} ctx
 * @returns {Promise<*>} operation result
 */
async function endpointList(ctx) {
  let endpoints = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  // A multiprotocol configuration numbers endpoints per protocol, so the same
  // identifier appears more than once. Showing the category then is the only
  // way the listing makes sense, and it is also what --category selects on.
  let multiprotocol = (await resolver.sessionCategories(ctx)).length > 1

  let rows = []
  for (let ep of endpoints) {
    let devices = await deviceTypesOfEndpoint(ctx, ep)
    let row = {
      endpoint: ep.endpointIdentifier,
      profile: ep.profileId == null ? '' : asHex(ep.profileId),
      network: ep.networkId == null ? '' : ep.networkId,
      parent:
        ep.parentEndpointIdentifier == null ? '' : ep.parentEndpointIdentifier,
      deviceTypes: devices
        .map((d) => `${d.name} (${asHex(d.code)}) v${d.deviceVersion}`)
        .join(', ')
    }
    if (multiprotocol) {
      row.category = (await resolver.endpointCategories(ctx, ep)).join(', ')
    }
    rows.push(row)
  }

  let columns = ['endpoint', 'profile', 'network', 'parent', 'deviceTypes']
  if (multiprotocol) columns.splice(1, 0, 'category')

  return result(
    false,
    [`${rows.length} endpoint(s)`],
    { columns: columns, rows: rows },
    rows.length === 0
      ? [
          suggestion(ctx, 'devicetype list', { all: true }),
          suggestion(ctx, 'endpoint create', {
            endpoint: 1,
            'device-type': '<name>'
          })
        ]
      : [suggestion(ctx, 'cluster list', { endpoint: rows[0].endpoint })]
  )
}

/**
 * The device types attached to an endpoint, in declaration order.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @returns {Promise<Array>} device types with their per-endpoint version
 */
async function deviceTypesOfEndpoint(ctx, endpoint) {
  let links = await queryDeviceType.selectDeviceTypesByEndpointTypeId(
    ctx.db,
    endpoint.endpointTypeRef
  )
  links.sort((a, b) => a.deviceTypeOrder - b.deviceTypeOrder)
  let out = []
  for (let link of links) {
    let dt = await queryDeviceType.selectDeviceTypeById(
      ctx.db,
      link.deviceTypeRef
    )
    out.push({
      ...(dt || {}),
      deviceTypeRef: link.deviceTypeRef,
      deviceIdentifier: link.deviceIdentifier,
      deviceVersion: link.deviceVersion,
      deviceTypeOrder: link.deviceTypeOrder,
      name: dt ? dt.name : `<unknown device type ${link.deviceTypeRef}>`,
      code: dt ? dt.code : link.deviceIdentifier
    })
  }
  return out
}

/**
 * Creates an endpoint together with its endpoint type, exactly like the
 * "Add New Endpoint" dialog does.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function endpointCreate(ctx, params) {
  let identifier = resolver.requireInteger(params.endpoint, 'Endpoint')
  let deviceTypeSpecs = asArray(params.deviceType)
  if (deviceTypeSpecs.length === 0) {
    throw new OperationError('At least one --device-type is required')
  }

  await requireUniqueEndpointIdentifier(ctx, identifier)

  let deviceTypes = []
  for (let spec of deviceTypeSpecs) {
    deviceTypes.push(await resolver.resolveDeviceType(ctx, spec))
  }

  let versions = asArray(params.deviceVersion).map((v) =>
    resolver.requireInteger(v, 'Device version')
  )
  if (versions.length === 0) {
    versions = deviceTypes.map(() => 1)
  } else if (versions.length === 1 && deviceTypes.length > 1) {
    versions = deviceTypes.map(() => versions[0])
  } else if (versions.length !== deviceTypes.length) {
    throw new OperationError(
      `Got ${versions.length} --device-version values for ${deviceTypes.length} device types`
    )
  }

  let profileId =
    params.profile != null
      ? resolver.requireInteger(params.profile, 'Profile')
      : deviceTypes[0].profileId
  let networkId =
    params.network != null
      ? resolver.requireInteger(params.network, 'Network')
      : 0

  let parentRef = null
  if (params.parent != null) {
    let parent = await resolver.resolveEndpoint(ctx, params.parent)
    parentRef = parent.id
  }

  await insertEndpointWithDeviceTypes(ctx, {
    identifier: identifier,
    deviceTypes: deviceTypes,
    versions: versions,
    profileId: profileId,
    networkId: networkId,
    parentRef: parentRef,
    name: params.name
  })

  // The device types have just switched on everything they mandate, so the
  // useful next move is to look at that before adding anything by hand.
  let createdEndpoint = (
    await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  ).find((e) => e.endpointIdentifier === identifier)
  let enabled = await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
    ctx.db,
    createdEndpoint.endpointTypeRef
  )
  let enabledCount = enabled.filter((c) => c.enabled).length

  let messages = [
    `Created endpoint ${identifier} with device type(s) ${deviceTypes
      .map((d) => `${d.name} (${asHex(d.code)})`)
      .join(', ')}`,
    `The device type(s) enabled ${enabledCount} cluster(s) on it`
  ]
  messages.push(...(await installStudioComponentsForClusters(ctx, enabled)))

  let outcome = result(true, messages, null, [
    suggestion(ctx, 'cluster list', {
      endpoint: identifier,
      'enabled-only': true
    }),
    suggestion(ctx, 'cluster enable', {
      endpoint: identifier,
      cluster: '<name>',
      side: 'server'
    })
  ])
  outcome.id = createdEndpoint.id
  return outcome
}

/**
 * Adds an endpoint using an endpoint type that already exists in the session.
 */
async function endpointAttach(ctx, params) {
  const identifier = resolver.requireInteger(params.endpoint, 'Endpoint')
  await requireUniqueEndpointIdentifier(ctx, identifier)
  const endpointTypeId = await requireEndpointTypeInSession(
    ctx,
    params.endpointTypeId
  )
  const endpointType = await queryEndpointType.selectEndpointType(
    ctx.db,
    endpointTypeId
  )
  const primaryDeviceType = endpointType.deviceTypes.length
    ? await queryDeviceType.selectDeviceTypeById(
        ctx.db,
        endpointType.deviceTypes[0]
      )
    : null
  const networkId =
    params.network == null
      ? 0
      : resolver.requireInteger(params.network, 'Network')
  const profileId =
    params.profile == null
      ? primaryDeviceType == null
        ? 0
        : primaryDeviceType.profileId
      : resolver.requireInteger(params.profile, 'Profile')
  let parentRef = null
  if (params.parentId !== undefined) {
    parentRef =
      params.parentId == null
        ? null
        : (
            await resolveOperationEndpoint(ctx, {
              endpointId: params.parentId
            })
          ).id
  } else if (params.parent != null && `${params.parent}` !== '') {
    parentRef = (await resolver.resolveEndpoint(ctx, params.parent)).id
  }
  const id = await queryEndpoint.insertEndpoint(
    ctx.db,
    ctx.sessionId,
    identifier,
    endpointTypeId,
    networkId,
    profileId,
    parentRef
  )
  const clusterStates =
    await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
      ctx.db,
      endpointTypeId
    )
  const outcome = result(true, [
    `Created endpoint ${identifier}`,
    ...(await installStudioComponentsForClusters(ctx, clusterStates))
  ])
  outcome.id = id
  outcome.endpointTypeId = endpointTypeId
  return outcome
}

/** Resolves a GUI's database endpoint id or a CLI's visible endpoint number. */
async function resolveOperationEndpoint(ctx, params) {
  if (params.endpointId == null) {
    return resolver.resolveEndpoint(ctx, params.endpoint)
  }
  const id = resolver.requireInteger(params.endpointId, 'Endpoint id')
  const endpoints = await queryEndpoint.selectAllEndpoints(
    ctx.db,
    ctx.sessionId
  )
  const endpoint = endpoints.find((candidate) => Number(candidate.id) === id)
  if (endpoint == null) throw new OperationError(`Unknown endpoint id ${id}`)
  return endpoint
}

/** Resolves a cluster by its GUI database id or its CLI name/code. */
async function resolveOperationCluster(ctx, endpoint, params) {
  if (params.clusterId == null) {
    return resolver.resolveCluster(ctx, params.cluster, endpoint)
  }
  const id = resolver.requireInteger(params.clusterId, 'Cluster id')
  const clusters = await resolver.clustersForEndpoint(ctx, endpoint)
  const cluster = clusters.find((candidate) => Number(candidate.id) === id)
  if (cluster == null) throw new OperationError(`Unknown cluster id ${id}`)
  return cluster
}

/**
 * Creates the endpoint type and the endpoint itself, once the device types
 * have been resolved.
 *
 * @param {*} ctx
 * @param {*} spec `{ identifier, deviceTypes, versions, profileId, networkId, parentRef, name }`
 * @returns {Promise<number>} the new endpoint type id
 */
async function insertEndpointWithDeviceTypes(ctx, spec) {
  let endpointTypeId = await createEndpointTypeFromDeviceTypes(
    ctx,
    spec.deviceTypes,
    spec.versions,
    spec.name
  )
  await queryEndpoint.insertEndpoint(
    ctx.db,
    ctx.sessionId,
    spec.identifier,
    endpointTypeId,
    spec.networkId,
    spec.profileId,
    spec.parentRef == null ? null : spec.parentRef
  )
  return endpointTypeId
}

/**
 * Creates an endpoint type from resolved device types.
 *
 * @param {*} ctx
 * @param {Array} deviceTypes
 * @param {number[]} versions
 * @param {string} [name]
 * @returns {Promise<number>} the new endpoint type id
 */
async function createEndpointTypeFromDeviceTypes(
  ctx,
  deviceTypes,
  versions,
  name
) {
  let partitions = await querySession.selectSessionPartitionInfoFromDeviceType(
    ctx.db,
    ctx.sessionId,
    deviceTypes.map((d) => d.id)
  )
  if (partitions.length === 0) {
    throw new OperationError(
      `Could not find the ZCL package that owns device type '${deviceTypes[0].name}'`
    )
  }

  return queryConfig.insertEndpointType(
    ctx.db,
    partitions[0],
    name || 'Anonymous Endpoint Type',
    deviceTypes.map((d) => d.id),
    deviceTypes.map((d) => d.code),
    versions
  )
}

/** Refuses endpoint identifiers already used anywhere in the session. */
async function requireUniqueEndpointIdentifier(ctx, identifier) {
  let existing = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  if (existing.some((e) => e.endpointIdentifier === identifier)) {
    // Validation counts endpoint identifiers session-wide, including in
    // multiprotocol configurations, so creating a duplicate would leave an
    // invalid configuration.
    let categories = await resolver.sessionCategories(ctx)
    throw new OperationError(`Endpoint ${identifier} already exists`, [
      `Use 'zap endpoint update' to change it, or pick a free identifier.`,
      ...(categories.length > 1
        ? [
            `This configuration spans ${categories.join(' and ')}, and identifiers`,
            `are counted across all of them by ZAP's validation.`
          ]
        : [])
    ])
  }
}

/** Resolves an endpoint type only when it belongs to the active session. */
async function requireEndpointTypeInSession(ctx, endpointTypeRef) {
  const endpointTypeId = resolver.requireInteger(
    endpointTypeRef,
    'Endpoint type'
  )
  const endpointType = await queryEndpointType.selectEndpointType(
    ctx.db,
    endpointTypeId
  )
  if (
    endpointType == null ||
    Number(endpointType.sessionRef) !== Number(ctx.sessionId)
  ) {
    throw new OperationError(`Unknown endpoint type ${endpointTypeId}`)
  }
  return endpointTypeId
}

/**
 * Creates the Root Node endpoint that every Matter configuration needs.
 *
 * A Matter data model declares one mandatory device type that has to sit on
 * endpoint 0, and the user interface puts it there as soon as you start a new
 * configuration. A configuration without it is not a valid Matter application,
 * so building one from the command line has to do the same thing. Data models
 * that declare no such device type, Zigbee among them, are left alone.
 *
 * @param {*} ctx
 * @returns {Promise<*>} operation result, unchanged when there is nothing to do
 */
async function createRootNode(ctx) {
  let packageIds = await resolver.zclPackageIds(ctx)
  let rootNodes = await queryEndpoint.getRootNode(ctx.db, packageIds)
  if (rootNodes.length === 0) return result(false, [])

  let rootNode = rootNodes[0]
  let existing = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  if (
    existing.some((e) => e.endpointIdentifier === dbEnum.rootNode.endpointId)
  ) {
    return result(false, [])
  }

  await insertEndpointWithDeviceTypes(ctx, {
    identifier: dbEnum.rootNode.endpointId,
    // Taken straight from the composition data, so no name lookup can pick the
    // wrong device type in a multiprotocol configuration.
    deviceTypes: [
      { id: rootNode.deviceTypeRef, code: rootNode.code, name: rootNode.name }
    ],
    versions: [dbEnum.rootNode.deviceVersion],
    profileId: dbEnum.rootNode.profileID,
    networkId: 0,
    parentRef: null,
    name: rootNode.name
  })

  let createdEndpoint = (
    await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  ).find((e) => e.endpointIdentifier === dbEnum.rootNode.endpointId)
  let clusterStates = await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
    ctx.db,
    createdEndpoint.endpointTypeRef
  )
  return result(true, [
    `Created endpoint ${dbEnum.rootNode.endpointId} with the Root Node device type ${rootNode.name} (${asHex(rootNode.code)})`,
    ...(await installStudioComponentsForClusters(ctx, clusterStates))
  ])
}

/**
 * Changes the identity of an existing endpoint: its identifier, profile,
 * network and parent.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function endpointUpdate(ctx, params) {
  let endpoint = await resolveOperationEndpoint(ctx, params)
  let changes = []
  let messages = []

  if (params.newEndpoint != null) {
    let value = resolver.requireInteger(params.newEndpoint, 'New endpoint')
    let existing = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
    if (
      value !== endpoint.endpointIdentifier &&
      existing.some((e) => e.endpointIdentifier === value)
    ) {
      throw new OperationError(`Endpoint ${value} already exists`)
    }
    changes.push({ key: restApi.updateKey.endpointId, value: value, type: '' })
    messages.push(
      `endpoint identifier ${endpoint.endpointIdentifier} -> ${value}`
    )
  }
  if (params.profile != null) {
    let value = resolver.requireInteger(params.profile, 'Profile')
    changes.push({ key: restApi.updateKey.profileId, value: value, type: '' })
    messages.push(`profile -> ${asHex(value)}`)
  }
  if (params.network != null) {
    let value = resolver.requireInteger(params.network, 'Network')
    changes.push({ key: restApi.updateKey.networkId, value: value, type: '' })
    messages.push(`network -> ${value}`)
  }

  if (params.parent !== undefined) {
    let parentRef = null
    if (params.parent != null && `${params.parent}` !== '') {
      let parent =
        params.parentId != null
          ? await resolveOperationEndpoint(ctx, {
              endpointId: params.parentId
            })
          : await resolver.resolveEndpoint(ctx, params.parent)
      if (parent.id === endpoint.id) {
        throw new OperationError('An endpoint cannot be its own parent')
      }
      await requireNoParentCycle(ctx, endpoint, parent)
      parentRef = parent.id
      messages.push(`parent -> ${parent.endpointIdentifier}`)
    } else {
      messages.push('parent -> none')
    }
    await queryConfig.updateParentEndpoint(
      ctx.db,
      ctx.sessionId,
      endpoint.id,
      parentRef
    )
  }

  if (changes.length > 0) {
    await queryConfig.updateEndpoint(
      ctx.db,
      ctx.sessionId,
      endpoint.id,
      changes
    )
  }

  if (messages.length === 0) {
    return result(false, ['Nothing to change'])
  }
  return result(true, [
    `Updated endpoint ${endpoint.endpointIdentifier}: ${messages.join(', ')}`
  ])
}

/**
 * Refuses a re-parenting that would put an endpoint underneath one of its own
 * descendants.
 *
 * Composition is a tree, and a cycle in it is not something the rest of ZAP is
 * prepared for: walking the parent chain during generation would not
 * terminate. Nothing else checks this, so it is checked here before the link
 * is written rather than discovered later.
 *
 * @param {*} ctx
 * @param {*} endpoint The endpoint being re-parented.
 * @param {*} parent The endpoint proposed as its parent.
 * @returns {Promise} resolves when the link is safe, throws otherwise
 */
async function requireNoParentCycle(ctx, endpoint, parent) {
  let all = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  let byId = new Map(all.map((e) => [e.id, e]))

  let chain = [parent.endpointIdentifier]
  let seen = new Set([endpoint.id])
  let cursor = parent
  while (cursor != null) {
    if (seen.has(cursor.id)) {
      throw new OperationError(
        `Making endpoint ${parent.endpointIdentifier} the parent of endpoint ${endpoint.endpointIdentifier} would form a loop`,
        [
          `  ${endpoint.endpointIdentifier} -> ${chain.join(' -> ')}`,
          `Detach the intermediate endpoint first, with --parent ''.`
        ]
      )
    }
    seen.add(cursor.id)
    cursor = cursor.parentRef == null ? null : byId.get(cursor.parentRef)
    if (cursor != null) chain.push(cursor.endpointIdentifier)
  }
}

/**
 * Removes an endpoint. The endpoint type behind it is removed too, unless
 * another endpoint still refers to it.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function endpointDelete(ctx, params) {
  let endpoint = await resolveOperationEndpoint(ctx, params)
  let all = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)

  // selectAllEndpoints maps PARENT_ENDPOINT_REF to parentRef (see
  // dbMapping.map.endpointExtended). parentEndpointRef is only a local name
  // used inside query-endpoint helpers, not a field on these rows.
  let children = all.filter((e) => e.parentRef === endpoint.id)
  if (children.length > 0 && params.force !== true) {
    throw new OperationError(
      `Endpoint ${endpoint.endpointIdentifier} is the parent of ${children
        .map((c) => c.endpointIdentifier)
        .join(', ')}`,
      ['Re-run with --force to delete it and orphan the children.']
    )
  }

  await queryEndpoint.deleteEndpoint(ctx.db, endpoint.id)

  let stillUsed = all.some(
    (e) =>
      e.id !== endpoint.id && e.endpointTypeRef === endpoint.endpointTypeRef
  )
  let removedEndpointTypeId = null
  if (!stillUsed) {
    await queryEndpointType.deleteEndpointType(ctx.db, endpoint.endpointTypeRef)
    removedEndpointTypeId = endpoint.endpointTypeRef
  }

  const outcome = result(true, [
    `Deleted endpoint ${endpoint.endpointIdentifier}`
  ])
  outcome.id = endpoint.id
  outcome.removedEndpointTypeId = removedEndpointTypeId
  return outcome
}

/**
 * Copies an endpoint, including every cluster, attribute, command and event
 * selection on it.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function endpointDuplicate(ctx, params) {
  let endpoint = await resolveOperationEndpoint(ctx, params)
  let all = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  let used = new Set(all.map((e) => e.endpointIdentifier))

  let newIdentifier
  if (params.newEndpoint != null) {
    newIdentifier = resolver.requireInteger(params.newEndpoint, 'New endpoint')
    if (used.has(newIdentifier)) {
      throw new OperationError(`Endpoint ${newIdentifier} already exists`)
    }
  } else {
    newIdentifier = 1
    while (used.has(newIdentifier)) newIdentifier++
  }

  let newEndpointTypeId =
    params.endpointTypeId == null
      ? await duplicateEndpointTypeConfiguration(ctx, endpoint.endpointTypeRef)
      : await requireEndpointTypeInSession(ctx, params.endpointTypeId)
  const id = await queryEndpoint.duplicateEndpoint(
    ctx.db,
    endpoint.id,
    newIdentifier,
    newEndpointTypeId
  )

  const outcome = result(true, [
    `Duplicated endpoint ${endpoint.endpointIdentifier} as endpoint ${newIdentifier}`
  ])
  outcome.id = id
  return outcome
}

/** Creates an endpoint type from database device type references. */
async function endpointTypeCreate(ctx, params) {
  const deviceTypeRefs = asArray(params.deviceTypeRef).map(Number)
  if (!deviceTypeRefs.length)
    throw new OperationError('At least one deviceTypeRef is required')
  const deviceTypes = []
  for (const ref of deviceTypeRefs) {
    const type = await queryDeviceType.selectDeviceTypeById(ctx.db, ref)
    if (!type) throw new OperationError(`Unknown device type ${ref}`)
    deviceTypes.push(type)
  }
  let versions = asArray(params.deviceVersion).map((value) =>
    resolver.requireInteger(value, 'Device version')
  )
  if (versions.length === 0) versions = deviceTypeRefs.map(() => 1)
  if (versions.length === 1 && deviceTypeRefs.length > 1)
    versions = deviceTypeRefs.map(() => versions[0])
  if (versions.length !== deviceTypeRefs.length)
    throw new OperationError(
      'Device version count must match device type count'
    )
  const id = await createEndpointTypeFromDeviceTypes(
    ctx,
    deviceTypes,
    versions,
    params.name
  )
  const outcome = result(true, [`Created endpoint type ${id}`])
  outcome.id = id
  outcome.deviceIdentifier = deviceTypes.map((deviceType) => deviceType.code)
  outcome.deviceVersion = versions
  return outcome
}

/** Updates an endpoint type using the shared query layer. */
async function endpointTypeUpdate(ctx, params) {
  const endpointTypeId = await requireEndpointTypeInSession(
    ctx,
    params.endpointTypeId
  )
  await queryConfig.updateEndpointType(
    ctx.db,
    ctx.sessionId,
    endpointTypeId,
    params.changes || []
  )
  const clusterStates =
    await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
      ctx.db,
      endpointTypeId
    )
  return result(true, [
    `Updated endpoint type ${params.endpointTypeId}`,
    ...(await installStudioComponentsForClusters(ctx, clusterStates))
  ])
}

/** Deletes an endpoint type. */
async function endpointTypeDelete(ctx, params) {
  const endpointTypeId = await requireEndpointTypeInSession(
    ctx,
    params.endpointTypeId
  )
  const removed = await queryEndpointType.deleteEndpointType(
    ctx.db,
    endpointTypeId
  )
  return result(removed > 0, [`Deleted endpoint type ${params.endpointTypeId}`])
}

/** Duplicates an endpoint type and its configured cluster and element states. */
async function endpointTypeDuplicate(ctx, params) {
  const source = await requireEndpointTypeInSession(ctx, params.endpointTypeId)
  const id = await duplicateEndpointTypeConfiguration(ctx, source)
  const outcome = result(true, [`Duplicated endpoint type ${source} as ${id}`])
  outcome.id = id
  return outcome
}

/** Duplicates an endpoint type together with its selected cluster elements. */
async function duplicateEndpointTypeConfiguration(ctx, sourceId) {
  const id = await queryConfig.duplicateEndpointType(ctx.db, sourceId)
  if (!id) throw new OperationError(`Unknown endpoint type ${sourceId}`)
  await queryConfig.duplicateEndpointTypeClusters(ctx.db, sourceId, id)
  return id
}

// ---------------------------------------------------------------------------
// Device types
// ---------------------------------------------------------------------------

/**
 * Lists either the device types on an endpoint, or the whole catalog of device
 * types the configuration could use.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function deviceTypeList(ctx, params) {
  if (params.all === true || params.endpoint == null) {
    let lowestFree = await lowestFreeEndpoint(ctx)
    let all = await resolver.allDeviceTypes(ctx)
    all.sort((a, b) => a.name.localeCompare(b.name))
    let rows = applyFilter(
      all.map((d) => ({
        code: asHex(d.code),
        name: d.name,
        domain: d.domain || '',
        profile: d.profileId == null ? '' : asHex(d.profileId)
      })),
      params.filter
    )
    return result(
      false,
      [`${rows.length} device type(s) available`],
      { columns: ['code', 'name', 'domain', 'profile'], rows: rows },
      listingNext(ctx, params, rows, {
        act: (row) =>
          suggestion(ctx, 'endpoint create', {
            endpoint: lowestFree,
            'device-type': row.name
          }),
        widen: () => suggestion(ctx, 'devicetype list', { all: true })
      })
    )
  }
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let devices = await deviceTypesOfEndpoint(ctx, endpoint)
  let rows = applyFilter(
    devices.map((d) => ({
      order: d.deviceTypeOrder,
      code: asHex(d.code),
      name: d.name,
      version: d.deviceVersion
    })),
    params.filter
  )
  return result(
    false,
    [`endpoint ${endpoint.endpointIdentifier}: ${rows.length} device type(s)`],
    { columns: ['order', 'code', 'name', 'version'], rows: rows }
  )
}

/**
 * Writes a new device type list onto an endpoint type, re-applying the
 * defaults of any newly added device type.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {Array} devices `{ deviceTypeRef, deviceIdentifier, deviceVersion }`
 * @returns {Promise} promise of the update
 */
async function writeDeviceTypes(ctx, endpoint, devices) {
  return queryConfig.updateEndpointType(
    ctx.db,
    ctx.sessionId,
    endpoint.endpointTypeRef,
    [
      {
        key: restApi.updateKey.deviceTypeRef,
        value: devices.map((d) => d.deviceTypeRef),
        type: ''
      },
      {
        key: restApi.updateKey.deviceVersion,
        value: devices.map((d) => d.deviceVersion),
        type: ''
      },
      {
        key: restApi.updateKey.deviceId,
        value: devices.map((d) => d.deviceIdentifier),
        type: ''
      }
    ]
  )
}

/**
 * Adds a device type to an endpoint, keeping the ones already there.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function deviceTypeAdd(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let specs = asArray(params.deviceType)
  if (specs.length === 0) {
    throw new OperationError('At least one --device-type is required')
  }
  let version =
    params.deviceVersion != null
      ? resolver.requireInteger(params.deviceVersion, 'Device version')
      : 1

  let current = await deviceTypesOfEndpoint(ctx, endpoint)
  let devices = current.map((d) => ({
    deviceTypeRef: d.deviceTypeRef,
    deviceIdentifier: d.deviceIdentifier,
    deviceVersion: d.deviceVersion
  }))

  let added = []
  for (let spec of specs) {
    let dt = await resolver.resolveDeviceType(ctx, spec)
    if (devices.some((d) => d.deviceTypeRef === dt.id)) {
      throw new OperationError(
        `Endpoint ${endpoint.endpointIdentifier} already has device type ${dt.name}`
      )
    }
    devices.push({
      deviceTypeRef: dt.id,
      deviceIdentifier: dt.code,
      deviceVersion: version
    })
    added.push(`${dt.name} (${asHex(dt.code)})`)
  }

  await writeDeviceTypes(ctx, endpoint, devices)
  return result(true, [
    `Added device type(s) ${added.join(', ')} to endpoint ${endpoint.endpointIdentifier}`
  ])
}

/**
 * Removes a device type from an endpoint. Cluster selections that came from
 * that device type are left alone.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function deviceTypeRemove(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let specs = asArray(params.deviceType)
  if (specs.length === 0) {
    throw new OperationError('At least one --device-type is required')
  }

  let current = await deviceTypesOfEndpoint(ctx, endpoint)
  let devices = current.map((d) => ({
    deviceTypeRef: d.deviceTypeRef,
    deviceIdentifier: d.deviceIdentifier,
    deviceVersion: d.deviceVersion
  }))

  let removed = []
  for (let spec of specs) {
    let dt = await resolver.resolveDeviceType(ctx, spec)
    let index = devices.findIndex((d) => d.deviceTypeRef === dt.id)
    if (index < 0) {
      throw new OperationError(
        `Endpoint ${endpoint.endpointIdentifier} does not have device type ${dt.name}`
      )
    }
    devices.splice(index, 1)
    removed.push(`${dt.name} (${asHex(dt.code)})`)
  }
  if (devices.length === 0) {
    throw new OperationError('An endpoint must keep at least one device type', [
      `Delete the endpoint instead, or add a replacement device type first.`
    ])
  }

  await writeDeviceTypes(ctx, endpoint, devices)
  return result(true, [
    `Removed device type(s) ${removed.join(', ')} from endpoint ${endpoint.endpointIdentifier}`
  ])
}

/**
 * Replaces the whole device type list of an endpoint, and optionally the
 * per-device versions.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function deviceTypeSet(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let specs = asArray(params.deviceType)
  if (specs.length === 0) {
    throw new OperationError('At least one --device-type is required')
  }
  let versions = asArray(params.deviceVersion).map((v) =>
    resolver.requireInteger(v, 'Device version')
  )

  let current = await deviceTypesOfEndpoint(ctx, endpoint)
  let devices = []
  for (let i = 0; i < specs.length; i++) {
    let dt = await resolver.resolveDeviceType(ctx, specs[i])
    let existing = current.find((d) => d.deviceTypeRef === dt.id)
    let version
    if (versions.length === 0) {
      version = existing != null ? existing.deviceVersion : 1
    } else if (versions.length === 1) {
      version = versions[0]
    } else if (versions.length === specs.length) {
      version = versions[i]
    } else {
      throw new OperationError(
        `Got ${versions.length} --device-version values for ${specs.length} device types`
      )
    }
    devices.push({
      deviceTypeRef: dt.id,
      deviceIdentifier: dt.code,
      deviceVersion: version
    })
  }

  await writeDeviceTypes(ctx, endpoint, devices)
  return result(true, [
    `Endpoint ${endpoint.endpointIdentifier} device types set to ${devices.length} entr${
      devices.length === 1 ? 'y' : 'ies'
    }`
  ])
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

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
        widen: () => suggestion(ctx, 'cluster list', { all: true })
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
        suggestion(ctx, 'attribute list', {
          endpoint: endpoint.endpointIdentifier,
          cluster: row.name
        }),
      widen: () =>
        suggestion(ctx, 'cluster list', {
          endpoint: endpoint.endpointIdentifier
        })
    })
  )
}

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
  let endpoint = await resolveOperationEndpoint(ctx, params)
  let cluster = await resolveOperationCluster(ctx, endpoint, params)
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
        ...(await reportUninstalledComponents(ctx, [
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
    ...(await updateStudioComponents(ctx, cluster, changedSides, enabled))
  )

  return result(
    true,
    messages,
    null,
    enabled
      ? [
          suggestion(ctx, 'attribute list', {
            endpoint: endpoint.endpointIdentifier,
            cluster: cluster.name
          }),
          suggestion(ctx, 'command list', {
            endpoint: endpoint.endpointIdentifier,
            cluster: cluster.name
          })
        ]
      : []
  )
}

// ---------------------------------------------------------------------------
// Attributes
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
const isClusterSideEnabled = sessionEdit.isClusterSideEnabled

/**
 * The paste-able command that enables a cluster side, for the refusals the
 * shared layer raises when a side is off. Only the command line knows what
 * the user typed to get here, which is why the hint is composed on this side.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @returns {string[]} one indented line
 */
function clusterEnableRemedy(ctx, endpoint, cluster, side) {
  return [
    `  ${suggestion(ctx, 'cluster enable', {
      endpoint: endpoint.endpointIdentifier,
      cluster: cluster.name,
      side: side
    })}`
  ]
}

/**
 * Refuses to touch an element of a cluster side that is not enabled, naming
 * the command that would enable it.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {string} side
 * @returns {Promise} resolves when the side is enabled, throws otherwise
 */
async function requireClusterSideEnabled(ctx, endpoint, cluster, side) {
  return sessionEdit.requireClusterSideEnabled(
    ctx,
    endpoint,
    cluster,
    side,
    clusterEnableRemedy(ctx, endpoint, cluster, side)
  )
}

/**
 * Refuses to open the element surface of a Matter cluster that is enabled as
 * a client only, naming the command that would enable its server side.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @returns {Promise} resolves when the cluster is configurable, throws otherwise
 */
async function requireClusterConfigurable(ctx, endpoint, cluster) {
  return sessionEdit.requireClusterConfigurable(
    ctx,
    endpoint,
    cluster,
    clusterEnableRemedy(ctx, endpoint, cluster, dbEnum.side.server)
  )
}

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
    if (await isClusterSideEnabled(ctx, endpoint, cluster, candidate.side)) {
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
  await requireClusterConfigurable(ctx, endpoint, cluster)
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
        suggestion(ctx, 'attribute set', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name,
          attribute: row.name,
          enabled: true
        }),
      widen: () =>
        suggestion(ctx, 'attribute list', {
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
 * The command line's share of the work is reading the flags. Which of the
 * settings the data model allows, and the write itself, are the shared
 * layer's, so that a post-load script setting the same thing is refused or
 * recorded exactly as this is.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} [forceEnabled] Set by the enable/disable shorthands.
 * @returns {Promise<*>} operation result
 */
async function attributeSet(ctx, params, forceEnabled = undefined) {
  let endpoint = await resolveOperationEndpoint(ctx, params)
  let cluster = await resolveOperationCluster(ctx, endpoint, params)
  await requireClusterConfigurable(ctx, endpoint, cluster)
  let found
  if (params.attributeId != null) {
    const id = resolver.requireInteger(params.attributeId, 'Attribute id')
    const attributes = await resolver.attributesOfCluster(
      ctx,
      cluster,
      params.side
    )
    const attribute = attributes.find(
      (candidate) => Number(candidate.id) === id
    )
    if (attribute == null)
      throw new OperationError(`Unknown attribute id ${id}`)
    found = { attribute: attribute, side: params.side }
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
  await requireClusterSideEnabled(ctx, endpoint, cluster, side)

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
    await updateRequiredElementWarning(
      ctx,
      endpoint,
      cluster,
      'attributes',
      attribute.id,
      !!changes.enabled
    )
  }

  return result(true, [
    `Attribute ${attribute.name} (${asHex(attribute.code)}) on ${cluster.name}/${side} of endpoint ${
      endpoint.endpointIdentifier
    }: ${outcome.described.join(', ')}`,
    ...outcome.warnings.map((w) => `warning: ${w}`)
  ])
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

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
  await requireClusterConfigurable(ctx, endpoint, cluster)
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
        suggestion(ctx, 'command enable', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name,
          command: row.name,
          direction: 'in'
        }),
      widen: () =>
        suggestion(ctx, 'command list', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name
        })
    })
  )
}

/**
 * Resolves the command an operation names. With no source, this is the command
 * line's own lookup. A source, which a post-load script passes because a code
 * can exist once per source, narrows the lookup to commands declared with it.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} params
 * @returns {Promise<*>} the command
 */
async function resolveCommandParam(ctx, cluster, params) {
  if (params.source == null) {
    return resolver.resolveCommand(ctx, cluster, params.command)
  }
  let all = await resolver.commandsOfCluster(ctx, cluster)
  let code = resolver.parseCode(params.command)
  let normalized = resolver.normalizeName(params.command)
  let matches = all.filter((command) => {
    if (command.source !== params.source) return false
    if (code != null) return command.code === code
    return resolver.normalizeName(command.name) === normalized
  })
  let describe = (command) =>
    `${command.name} (${resolver.asHex(command.code, 2)}, source: ${command.source})`
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) {
    throw operationError.notFound(
      `command of cluster ${cluster.name} with source '${params.source}'`,
      params.command,
      all.filter((command) => command.source === params.source).map(describe)
    )
  }
  throw cliError.ambiguous(
    `command of cluster ${cluster.name}`,
    params.command,
    matches.map(describe)
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
  let endpoint = await resolveOperationEndpoint(ctx, params)
  let cluster = await resolveOperationCluster(ctx, endpoint, params)
  await requireClusterConfigurable(ctx, endpoint, cluster)
  let command
  if (params.commandId != null) {
    const id = resolver.requireInteger(params.commandId, 'Command id')
    command = (await resolver.commandsOfCluster(ctx, cluster)).find(
      (candidate) => Number(candidate.id) === id
    )
    if (command == null) throw new OperationError(`Unknown command id ${id}`)
  } else {
    command = await resolveCommandParam(ctx, cluster, params)
  }
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
      (await isClusterSideEnabled(
        ctx,
        endpoint,
        cluster,
        commandSide(command, isIncoming)
      ))
    ) {
      applicable.push(isIncoming)
    } else if (directions.length === 1) {
      if (unwritable != null) throw unwritable
      await requireClusterSideEnabled(
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
    await requireClusterSideEnabled(
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
      enabled,
      clusterEnableRemedy(
        ctx,
        endpoint,
        cluster,
        commandSide(command, isIncoming)
      )
    )
    await updateRequiredElementWarning(
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

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

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
  await requireClusterConfigurable(ctx, endpoint, cluster)
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
        suggestion(ctx, 'event enable', {
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
  let endpoint = await resolveOperationEndpoint(ctx, params)
  let cluster = await resolveOperationCluster(ctx, endpoint, params)
  await requireClusterConfigurable(ctx, endpoint, cluster)
  let event
  if (params.eventId != null) {
    const id = resolver.requireInteger(params.eventId, 'Event id')
    event = (await resolver.eventsOfCluster(ctx, cluster)).find(
      (candidate) => Number(candidate.id) === id
    )
    if (event == null) throw new OperationError(`Unknown event id ${id}`)
  } else {
    event = await resolver.resolveEvent(ctx, cluster, params.event)
  }
  let side = params.side || event.side || dbEnum.side.server

  await sessionEdit.setEventEnabled(
    ctx,
    endpoint,
    cluster,
    event,
    side,
    enabled,
    clusterEnableRemedy(ctx, endpoint, cluster, side)
  )
  await updateRequiredElementWarning(
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

// ---------------------------------------------------------------------------
// Cluster features (Matter)
// ---------------------------------------------------------------------------

/**
 * Feature lookups and the FeatureMap attribute, shared with post-load scripts
 * so that a feature toggled from either place drags the same elements along.
 */
const featuresOfCluster = sessionEdit.featuresOfCluster
const featureMapAttribute = sessionEdit.featureMapAttribute
const featureMapFromValue = sessionEdit.featureMapFromValue
const matchFeature = sessionEdit.matchFeature

/**
 * Refuses a feature change that could not be recorded, naming the command
 * that would enable the FeatureMap attribute.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} map Result of `featureMapAttribute`.
 * @returns {undefined} nothing, throws when the change could not be kept
 */
function requireFeatureMapIncluded(ctx, endpoint, cluster, map) {
  return sessionEdit.requireFeatureMapIncluded(endpoint, cluster, map, [
    `  ${suggestion(ctx, 'attribute enable', {
      endpoint: endpoint.endpointIdentifier,
      cluster: cluster.name,
      attribute: dbEnum.featureMapAttribute.name
    })}`
  ])
}

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
  await requireClusterConfigurable(ctx, endpoint, cluster)
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
  if (!map.included) {
    // Otherwise the all-off listing below looks like a real answer.
    messages.push(
      `warning: the FeatureMap attribute is not enabled here, so no feature selection is being kept`
    )
  }

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
        suggestion(ctx, 'feature enable', {
          endpoint: endpoint.endpointIdentifier,
          cluster: cluster.name,
          feature: row.code
        })
    })
  )
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
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)

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
        ),
        // The interface pops up this warning only when displayWarning says to.
        // The message is composed either way, and after an enable that satisfies
        // a mandatory conformance it reads as though the enable had not happened.
        ...(conformance.displayWarning
          ? []
              .concat(conformance.warningMessage || [])
              .map((w) => `warning: ${w}`)
          : [])
      ].filter((line) => line !== null)
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
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
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
      conformance && conformance.displayWarning
        ? []
            .concat(conformance.warningMessage || [])
            .map((w) => `warning: ${w}`)
        : [],
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
          }
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

/** Reads the current conformance requirements for one endpoint cluster. */
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

/** Updates the warning for an edited element using the current operation state. */
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

/** Returns the required and prohibited elements for the saved feature map. */
async function featureRequirements(ctx, params) {
  const endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  const cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  const { elements, requirements } = await featureRequirementData(
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

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

/**
 * What a package contributes to the data model.
 *
 * @param {*} ctx
 * @param {number} packageId
 * @returns {Promise<*>} `{ clusters, deviceTypes }`
 */
async function packageContents(ctx, packageId) {
  return {
    clusters: await queryZcl.selectAllClusters(ctx.db, packageId),
    deviceTypes: await queryDeviceType.selectAllDeviceTypes(ctx.db, packageId)
  }
}

/**
 * The endpoint configuration that would go with a package if it were removed.
 *
 * Disabling a custom XML package makes database triggers delete the endpoint
 * clusters, attributes, commands and events that came from it. Counting first
 * is what lets the CLI say so instead of doing it quietly.
 *
 * @param {*} ctx
 * @param {number} packageId
 * @returns {Promise<Array>} `{ endpoint, cluster, side }` per enabled cluster
 */
async function endpointUseOfPackage(ctx, packageId) {
  let clusters = await queryZcl.selectAllClusters(ctx.db, packageId)
  let byId = new Map(clusters.map((c) => [c.id, c]))
  let endpoints = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)

  let used = []
  for (let endpoint of endpoints) {
    let states = await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
      ctx.db,
      endpoint.endpointTypeRef
    )
    for (let state of states) {
      let cluster = byId.get(state.clusterRef)
      if (cluster == null || !state.enabled) continue
      used.push({
        endpoint: endpoint.endpointIdentifier,
        cluster: cluster.name,
        code: asHex(cluster.code),
        side: state.side
      })
    }
  }
  return used
}

/**
 * Lists the packages of a configuration, including the custom XML it names but
 * does not have.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function packageList(ctx, params) {
  let substituted = ctx.substitutedCustomXml || []
  let rows = (await sessionContent.packages(ctx)).map((p) => ({
    type: p.pkg.type,
    category: p.pkg.category || '',
    version: p.pkg.version || '',
    status: substituted.some((s) => s.id === p.pkg.id)
      ? 'loaded, not named by the file'
      : fs.existsSync(p.pkg.path)
        ? 'loaded'
        : 'loaded, file gone',
    path: p.pkg.path
  }))
  // The point of asking is usually the ones that are not there.
  for (let missing of ctx.unresolvedCustomXml || []) {
    rows.push({
      type: dbEnum.packageType.zclXmlStandalone,
      category: '',
      version: '',
      status: missing.exists ? 'not loaded' : 'missing',
      path: missing.path
    })
  }
  rows = applyFilter(rows, params.filter)

  let custom = rows.filter(
    (r) => r.type === dbEnum.packageType.zclXmlStandalone
  )
  return result(
    false,
    [`${rows.length} package(s), ${custom.length} of them custom XML`],
    {
      columns: ['type', 'category', 'version', 'status', 'path'],
      rows: rows
    },
    custom.length === 0
      ? [suggestion(ctx, 'package add', { xml: '<file.xml>' })]
      : []
  )
}

/**
 * Loads custom XML into the configuration, the way the Extensions page does.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function packageAdd(ctx, params) {
  let files = asArray(params.xml)
  if (files.length === 0) {
    throw new OperationError('At least one --xml is required')
  }

  let messages = []
  let next = []
  for (let file of files) {
    if (!fs.existsSync(file)) {
      throw new OperationError(`No such file: ${file}`, [
        `--xml takes the path of a ZCL XML file describing custom clusters.`
      ])
    }
    if (path.extname(file).toLowerCase() !== '.xml') {
      throw new OperationError(`${file} is not an XML file`, [
        `Custom clusters are described in a ZCL XML file. A zcl.json metafile`,
        `belongs on --zclProperties instead.`
      ])
    }

    let outcome = await sessionContent.addCustomXml(ctx, path.resolve(file))
    if (!outcome.succeeded) {
      throw new OperationError(`Could not load ${file}`, [
        `  ${outcome.err ? outcome.err.message || outcome.err : 'unknown error'}`
      ])
    }

    let contents = await packageContents(ctx, outcome.packageId)
    messages.push(
      `Loaded custom XML ${file}: ${contents.clusters.length} cluster(s), ${contents.deviceTypes.length} device type(s)`
    )
    contents.clusters.forEach((c) =>
      messages.push(`  cluster ${c.name} (${asHex(c.code)})`)
    )
    contents.deviceTypes.forEach((d) =>
      messages.push(`  device type ${d.name} (${asHex(d.code)})`)
    )
    if (contents.clusters.length > 0) {
      next.push(
        suggestion(ctx, 'cluster enable', {
          endpoint: '<id>',
          cluster: contents.clusters[0].name,
          side: 'server'
        })
      )
    }
  }

  return result(true, messages, null, next)
}

/**
 * Takes custom XML back out of the configuration, the way the Delete button on
 * the Extensions page does.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function packageRemove(ctx, params) {
  let spec = params.xml
  if ((spec == null || `${spec}` === '') && params.packageRef == null) {
    throw new OperationError('--xml is required')
  }

  let custom = (await sessionContent.packages(ctx))
    .map((p) => p.pkg)
    .filter((p) => p.type === dbEnum.packageType.zclXmlStandalone)
  let match =
    params.packageRef == null
      ? null
      : custom.find((p) => p.id === Number(params.packageRef))
  match =
    match ||
    custom.find((p) => sessionContent.samePath(p.path, spec)) ||
    custom.find((p) => path.basename(p.path) === path.basename(`${spec}`))

  if (match == null) {
    // A file that was named but never loaded is still worth removing: the
    // reference is what is wrong with the configuration.
    let declared = (ctx.unresolvedCustomXml || []).find(
      (p) =>
        sessionContent.samePath(p.path, spec) ||
        path.basename(p.path) === path.basename(`${spec}`)
    )
    if (declared != null) {
      return result(true, [
        `${declared.declared} is named by the configuration but was never loaded`,
        `Saving drops the reference to it`
      ])
    }
    throw operationError.notFound(
      'custom XML package',
      spec,
      custom.map((p) => p.path)
    )
  }

  let used = await endpointUseOfPackage(ctx, match.id)
  if (used.length > 0 && params.force !== true) {
    throw new OperationError(
      `${path.basename(match.path)} defines ${used.length} cluster(s) that this configuration uses`,
      [
        `Removing it deletes their endpoint configuration:`,
        ...used.map(
          (u) => `  endpoint ${u.endpoint}: ${u.cluster} (${u.code}) ${u.side}`
        ),
        `  ${suggestion(ctx, 'package remove', {
          xml: match.path,
          force: true
        })}`
      ]
    )
  }

  let removed = await sessionContent.removeCustomXml(ctx, match.id)
  if (!removed) {
    throw new OperationError(
      `${match.path} is not attached to this configuration`
    )
  }

  let messages = [`Removed custom XML ${match.path}`]
  if (used.length > 0) {
    messages.push(
      `Its ${used.length} cluster(s) were dropped from the endpoints using them`
    )
    used.forEach((u) =>
      messages.push(
        `  endpoint ${u.endpoint}: ${u.cluster} (${u.code}) ${u.side}`
      )
    )
  }
  return result(true, messages)
}

// ---------------------------------------------------------------------------
// Whole configuration
// ---------------------------------------------------------------------------

/**
 * Prints a summary of the configuration: its packages and its endpoints.
 *
 * @param {*} ctx
 * @returns {Promise<*>} operation result
 */
async function configInfo(ctx) {
  let pairs = await queryPackage.getPackageSessionPackagePairBySessionId(
    ctx.db,
    ctx.sessionId
  )
  let endpoints = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  let rows = pairs.map((p) => ({
    type: p.pkg.type,
    category: p.pkg.category || '',
    version: p.pkg.version || '',
    path: p.pkg.path
  }))
  let messages = [
    `${ctx.zapFile == null ? 'new configuration' : ctx.zapFile}`,
    `${endpoints.length} endpoint(s), ${rows.length} package(s)`
  ]
  // Said here as well as by `package list`, because a configuration missing
  // part of its data model is not a detail to go looking for.
  for (let missing of ctx.unresolvedCustomXml || []) {
    messages.push(
      `custom XML not loaded: ${missing.path}${missing.exists ? '' : ' (no such file)'}`
    )
  }
  return result(false, messages, {
    columns: ['type', 'category', 'version', 'path'],
    rows: rows
  })
}

/**
 * Reports everything ZAP knows to be wrong with the configuration, without
 * changing it.
 *
 * Two things are asked, because the user interface shows both and they do not
 * see the same problems. Validation recomputes the specification requirements
 * from the current state: malformed endpoints, defaults out of range, clusters,
 * attributes and commands a device type requires, and elements that a cluster's
 * feature selection makes mandatory or unsupported. The notifications hold what
 * was observed as the configuration was read and edited, which is the only place
 * some things are recorded: a provisional cluster in use, a command whose
 * response is missing, a duplicate, a device type that is no longer known.
 *
 * Where both describe the same problem the validation account is kept, being the
 * one recomputed just now.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function configCheck(ctx, params) {
  let issues = validationReport.collectIssues(
    await sessionContent.validate(ctx)
  )
  let rows = issues.map((issue) => ({
    kind: issue.kind,
    source: 'validation',
    message: issue.text
  }))

  let notifications = await sessionContent.notifications(ctx)
  if (params.packages === true) {
    notifications = notifications.concat(
      await sessionContent.packageNotifications(ctx)
    )
  }
  let reported = issues.map((issue) =>
    validationReport.complianceKey(issue.text)
  )
  for (let notification of notifications) {
    let key = validationReport.complianceKey(notification.message)
    if (reported.some((seen) => seen.includes(key))) continue
    rows.push({
      kind: `${notification.type}`.toLowerCase(),
      source: notification.scope,
      message: notification.message
    })
  }

  let errors = rows.filter((r) => r.kind === 'error').length
  let warnings = rows.length - errors
  // The table is reported even when it is empty, so that something reading the
  // JSON always has a list of findings to walk rather than sometimes nothing.
  let report = result(
    false,
    [
      `${ctx.zapFile == null ? 'configuration' : ctx.zapFile}: ${errors} error(s), ${warnings} warning(s)`,
      ...(rows.length === 0 ? ['nothing to report'] : [])
    ],
    { columns: ['kind', 'source', 'message'], rows: rows }
  )
  report.failed = errors > 0
  return report
}

/** Stores a user-editable configuration option in the active session. */
async function optionSet(ctx, params) {
  const key = params.key
  const value = params.value
  if (typeof key !== 'string' || !editableSessionOptionKeys.has(key)) {
    throw new OperationError(`Unknown editable configuration option '${key}'`, [
      `Editable options: ${[...editableSessionOptionKeys].join(', ')}`
    ])
  }
  if (
    value === undefined ||
    (value !== null && !['string', 'number', 'boolean'].includes(typeof value))
  ) {
    throw new OperationError(`Option '${key}' requires a scalar value`)
  }

  await querySession.updateSessionKeyValue(ctx.db, ctx.sessionId, key, value)
  const outcome = result(true, [`Updated configuration option ${key}`])
  outcome.key = key
  outcome.value = value
  return outcome
}

/**
 * The operation table. Keys are the dotted names used by both the yargs
 * command tree and the batch script format.
 */
const operations = {
  'config.info': (ctx) => configInfo(ctx),
  'config.check': (ctx, params) => configCheck(ctx, params),
  'option.set': (ctx, params) => optionSet(ctx, params),

  'endpoint.list': (ctx) => endpointList(ctx),
  'endpoint.create': (ctx, params) => endpointCreate(ctx, params),
  'endpoint.attach': (ctx, params) => endpointAttach(ctx, params),
  'endpoint.update': (ctx, params) => endpointUpdate(ctx, params),
  'endpoint.delete': (ctx, params) => endpointDelete(ctx, params),
  'endpoint.duplicate': (ctx, params) => endpointDuplicate(ctx, params),
  'endpointtype.create': (ctx, params) => endpointTypeCreate(ctx, params),
  'endpointtype.update': (ctx, params) => endpointTypeUpdate(ctx, params),
  'endpointtype.delete': (ctx, params) => endpointTypeDelete(ctx, params),
  'endpointtype.duplicate': (ctx, params) => endpointTypeDuplicate(ctx, params),

  'devicetype.list': (ctx, params) => deviceTypeList(ctx, params),
  'devicetype.add': (ctx, params) => deviceTypeAdd(ctx, params),
  'devicetype.remove': (ctx, params) => deviceTypeRemove(ctx, params),
  'devicetype.set': (ctx, params) => deviceTypeSet(ctx, params),

  'cluster.list': (ctx, params) => clusterList(ctx, params),
  'cluster.enable': (ctx, params) => clusterSetEnabled(ctx, params, true),
  'cluster.disable': (ctx, params) => clusterSetEnabled(ctx, params, false),

  'attribute.list': (ctx, params) => attributeList(ctx, params),
  'attribute.set': (ctx, params) => attributeSet(ctx, params),
  'attribute.enable': (ctx, params) => attributeSet(ctx, params, true),
  'attribute.disable': (ctx, params) => attributeSet(ctx, params, false),

  'command.list': (ctx, params) => commandList(ctx, params),
  'command.enable': (ctx, params) => commandSetEnabled(ctx, params, true),
  'command.disable': (ctx, params) => commandSetEnabled(ctx, params, false),

  'event.list': (ctx, params) => eventList(ctx, params),
  'event.enable': (ctx, params) => eventSetEnabled(ctx, params, true),
  'event.disable': (ctx, params) => eventSetEnabled(ctx, params, false),

  'package.list': (ctx, params) => packageList(ctx, params),
  'package.add': (ctx, params) => packageAdd(ctx, params),
  'package.remove': (ctx, params) => packageRemove(ctx, params),

  'feature.list': (ctx, params) => featureList(ctx, params),
  'feature.preview': (ctx, params) => featurePreview(ctx, params),
  'feature.requirements': (ctx, params) => featureRequirements(ctx, params),
  'feature.enable': (ctx, params) => featureSetEnabled(ctx, params, true),
  'feature.disable': (ctx, params) => featureSetEnabled(ctx, params, false)
}

/**
 * Aligns the attribute and command states of clusters that more than one
 * endpoint enables, where the data model says they are shared.
 *
 * In Zigbee a cluster's configuration is one global thing: the Basic cluster on
 * three endpoints includes the same attributes on all three, and the framework
 * keeps one copy. ZAP stores state per endpoint type, so the user interface
 * re-aligns them after every change. Editing without that step produced files
 * the interface would never have written.
 *
 * Two things keep this from touching Matter, where an attribute genuinely is
 * per endpoint. The behaviour is only attempted when the loaded templates
 * declare `shareClusterStatesAcrossEndpoints`, which is how the interface
 * decides. And in a multiprotocol configuration only the endpoints whose device
 * types come from a package that asked for it are included, so the Matter half
 * of the same file is left exactly as it was.
 *
 * @param {*} ctx
 * @returns {Promise<*>} `{ applied, endpoints, clusters }`
 */
async function unifySharedClusterStates(ctx) {
  let quiet = { applied: false, endpoints: [], clusters: 0 }
  let sharing = (
    await sharedClusterState.sharingCategories(ctx.db, ctx.sessionId)
  ).filter((c) => c !== '')
  if (sharing.length === 0) return quiet

  let endpoints = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)

  // An endpoint is in scope when its device types come from a category that
  // shares state, which is what keeps a Matter endpoint out of a Zigbee
  // unification even when both data models are loaded. An endpoint whose
  // category cannot be determined is included, since a data model that names no
  // category is the single-protocol case rather than a foreign one.
  let included = []
  for (let endpoint of endpoints) {
    let own = (await resolver.endpointCategories(ctx, endpoint)).map((c) =>
      `${c}`.toLowerCase()
    )
    if (own.length === 0 || own.some((c) => sharing.includes(c))) {
      included.push(endpoint)
    }
  }

  // A session can temporarily contain endpoints whose endpoint type was not
  // imported. They have no configuration state to align and must not produce
  // an empty SQL item in the reconciliation query.
  let endpointTypeIds = [
    ...new Set(
      included.map((e) => e.endpointTypeRef).filter((id) => id != null)
    )
  ]
  if (endpointTypeIds.length < 2) return quiet

  // Narrow the metadata to the sharing categories where that is possible. A
  // data model can declare the option from its templates while its ZCL package
  // carries no category, so an empty narrowing means all of it rather than none.
  let all = await resolver.zclPackages(ctx)
  let narrowed = all.filter((p) =>
    sharing.includes(`${p.category || ''}`.toLowerCase())
  )
  let packageIds = (narrowed.length > 0 ? narrowed : all).map((p) => p.id)

  let unified = await sharedClusterState.shareClusterStatesAcrossEndpoints(
    ctx.db,
    endpointTypeIds,
    packageIds
  )
  let clusters = new Set(
    (unified.sharedClusterList || []).map((c) => `${c.clusterId}/${c.side}`)
  )
  return {
    applied: clusters.size > 0,
    endpoints: included.map((e) => e.endpointIdentifier),
    clusters: clusters.size
  }
}

/**
 * The endpoints of a session, optionally narrowed to one package category.
 * This is the row shape a post-load script walks; the command line renders
 * its own table from the same query.
 *
 * @param {*} ctx
 * @param {string} [category]
 * @returns {Promise<Array>} endpoints
 */
async function readEndpoints(ctx, category = null) {
  return queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId, category)
}

/**
 * The clusters enabled on an endpoint.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @returns {Promise<Array>} clusters
 */
async function readClusters(ctx, endpoint) {
  return queryEndpoint.selectEndpointClusters(ctx.db, endpoint.endpointTypeRef)
}

/**
 * The attributes of one cluster side on an endpoint, as stored. Codes stay
 * numeric: upgrade scripts parse them, and the command line's listing formats
 * them as hex instead.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster A row from `readClusters`, carrying `clusterId` and `side`.
 * @returns {Promise<Array>} attributes
 */
async function readAttributes(ctx, endpoint, cluster) {
  return queryEndpoint.selectEndpointClusterAttributes(
    ctx.db,
    cluster.clusterId,
    cluster.side,
    endpoint.endpointTypeRef
  )
}

/**
 * The commands of one cluster on an endpoint, as stored.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster A row from `readClusters`, carrying `clusterId`.
 * @returns {Promise<Array>} commands
 */
async function readCommands(ctx, endpoint, cluster) {
  return queryEndpoint.selectEndpointClusterCommands(
    ctx.db,
    cluster.clusterId,
    endpoint.endpointTypeRef
  )
}

/**
 * Every cluster the session's packages define.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} clusters
 */
async function readAvailableClusters(ctx) {
  return querySessionZcl.selectAllSessionClusters(ctx.db, ctx.sessionId)
}

/**
 * The features a cluster defines on an endpoint, each marked with whether its
 * bit is set. This is the row a post-load script walks; the command line
 * renders the same facts as a table.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster A cluster row, as `readClusters` returns it, or a
 *   resolved cluster definition. Either carries the id the feature query uses.
 * @returns {Promise<Array>} features
 */
async function readFeatures(ctx, endpoint, cluster) {
  let features = await featuresOfCluster(ctx, endpoint, cluster)
  if (features.length === 0) return []
  let map = await featureMapAttribute(ctx, endpoint, cluster)
  let enabled = featureMapFromValue(features, map.value)
  return features.map((f) => ({ ...f, enabled: enabled[f.code] === true }))
}

/**
 * True when a cluster carries the manufacturer code being asked for. No code
 * means a standard cluster, whose manufacturer code is null.
 *
 * @param {*} cluster
 * @param {*} mfgCode
 * @returns {boolean} whether the cluster matches
 */
function manufacturerMatches(cluster, mfgCode) {
  if (mfgCode == null || mfgCode === 0) {
    return cluster.manufacturerCode == null || cluster.manufacturerCode === 0
  }
  return cluster.manufacturerCode === mfgCode
}

/**
 * Finds a cluster by name or by code. A manufacturer code narrows the search
 * to that manufacturer's clusters; without one, the command line's own lookup
 * is used.
 *
 * @param {*} ctx
 * @param {*} spec Name, define or code.
 * @param {*} [mfgCode]
 * @returns {Promise<*>} the cluster
 */
async function findCluster(ctx, spec, mfgCode = null) {
  if (mfgCode == null || mfgCode === 0) {
    return resolver.resolveCluster(ctx, spec)
  }
  let all = (await resolver.allClusters(ctx)).filter((cluster) =>
    manufacturerMatches(cluster, mfgCode)
  )
  let code = resolver.parseCode(spec)
  let describe = (cluster) =>
    `${cluster.name} (${resolver.asHex(cluster.code)})`
  let matches
  if (code != null) {
    matches = all.filter((cluster) => cluster.code === code)
  } else {
    let normalized = resolver.normalizeName(spec)
    matches = all.filter(
      (cluster) =>
        resolver.normalizeName(cluster.name) === normalized ||
        resolver.normalizeName(cluster.define) === normalized
    )
  }
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) {
    throw operationError.notFound('cluster', spec, all.map(describe))
  }
  throw cliError.ambiguous('cluster', spec, matches.map(describe))
}

/**
 * Finds an attribute of a cluster by name or by code.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} spec Name, define or code.
 * @param {string} side
 * @returns {Promise<*>} the attribute
 */
async function lookupAttribute(ctx, cluster, spec, side) {
  return resolver.resolveAttribute(ctx, cluster, spec, side)
}

/**
 * Finds a command of a cluster by name or by code. A source narrows the
 * lookup the same way `command.enable` does when `params.source` is set.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} spec Name or code.
 * @param {string} [source]
 * @returns {Promise<*>} the command
 */
async function findCommand(ctx, cluster, spec, source) {
  return resolveCommandParam(ctx, cluster, { command: spec, source: source })
}

/**
 * Finds an event of a cluster by name or by code.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} spec Name or code.
 * @returns {Promise<*>} the event
 */
async function findEvent(ctx, cluster, spec) {
  return resolver.resolveEvent(ctx, cluster, spec)
}

/**
 * Runs a single operation by name.
 *
 * @param {*} ctx
 * @param {string} name Dotted operation name, such as 'cluster.enable'.
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function execute(ctx, name, params) {
  let op = operations[name]
  if (op == null) {
    throw new OperationError(`Unknown operation '${name}'`, [
      `Known operations: ${Object.keys(operations).join(', ')}`
    ])
  }
  return op(ctx, params || {})
}

exports.operations = operations
exports.execute = execute
exports.createRootNode = createRootNode
exports.unifySharedClusterStates = unifySharedClusterStates
exports.operationNames = () => Object.keys(operations)
exports.readEndpoints = readEndpoints
exports.readClusters = readClusters
exports.readAttributes = readAttributes
exports.readCommands = readCommands
exports.readAvailableClusters = readAvailableClusters
exports.readFeatures = readFeatures
exports.findCluster = findCluster
exports.findAttribute = lookupAttribute
exports.findCommand = findCommand
exports.findEvent = findEvent
