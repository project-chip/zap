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
 * Every edit and query that `zap edit` can perform on a configuration.
 *
 * These are deliberately written on top of the same `query-*` modules that the
 * REST layer uses, so that a change made from the command line is
 * indistinguishable from the same change made in the GUI.
 *
 * Each operation takes `(ctx, params)` and returns
 * `{ changed, messages, table, next }`: whether the configuration was
 * modified, lines describing what happened, optional tabular output, and the
 * commands that are the natural thing to run afterwards.
 *
 * @module CLI API: operations
 */

const fs = require('fs')
const path = require('path')

const dbEnum = require('../../src-shared/db-enum.js')
const restApi = require('../../src-shared/rest-api.js')
const queryConfig = require('../db/query-config.js')
const queryEndpoint = require('../db/query-endpoint.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryDeviceType = require('../db/query-device-type.js')
const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')
const querySession = require('../db/query-session.js')
const queryFeature = require('../db/query-feature.js')
const validation = require('../validation/validation.js')
const conformChecker = require('../validation/conformance-checker.js')
const sharedClusterState = require('../util/shared-cluster-state.js')
const studio = require('../ide-integration/studio-rest-api.js')
const { StatusCodes } = require('http-status-codes')
const resolver = require('./cli-resolver.js')
const cliError = require('./cli-error.js')
const cliOutput = require('./cli-output.js')
const cliPolicy = require('./cli-policy.js')
const cliSession = require('./cli-session.js')

const CliError = cliError.CliError
const asHex = resolver.asHex

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
 * Builds a runnable `zap edit` command line against the configuration in hand.
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
  let parts = [`zap edit ${operation}`, shellQuote(ctx.zapFile || '<file.zap>')]
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
function optionalBoolean(value) {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  let s = String(value).toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(s)) return true
  if (['false', '0', 'no', 'off'].includes(s)) return false
  throw new CliError(`Expected a boolean, got '${value}'`)
}

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
 * The ZCL packages a session can pull cluster defaults from.
 *
 * @param {*} ctx
 * @returns {Promise<number[]>} package ids
 */
async function defaultsPackageIds(ctx) {
  return resolver.zclPackageIds(ctx)
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
    throw new CliError('At least one --device-type is required')
  }

  let existing = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  if (existing.some((e) => e.endpointIdentifier === identifier)) {
    // Multiprotocol configurations do reuse identifiers across protocols, and
    // the read side copes with that, but ZAP's own validation counts endpoints
    // session-wide and reports any repeat as 'Duplicate EndpointIds Exist'.
    // Creating one on purpose would mean producing a configuration the rest of
    // ZAP calls invalid, so it is refused and the reason given.
    let categories = await resolver.sessionCategories(ctx)
    throw new CliError(`Endpoint ${identifier} already exists`, [
      `Use 'zap edit endpoint update' to change it, or pick a free identifier.`,
      ...(categories.length > 1
        ? [
            `This configuration spans ${categories.join(' and ')}, and identifiers`,
            `are counted across all of them by ZAP's validation.`
          ]
        : [])
    ])
  }

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
    throw new CliError(
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
  let enabled = await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
    ctx.db,
    (await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)).find(
      (e) => e.endpointIdentifier === identifier
    ).endpointTypeRef
  )
  let enabledCount = enabled.filter((c) => c.enabled).length

  let messages = [
    `Created endpoint ${identifier} with device type(s) ${deviceTypes
      .map((d) => `${d.name} (${asHex(d.code)})`)
      .join(', ')}`,
    `The device type(s) enabled ${enabledCount} cluster(s) on it`
  ]
  messages.push(...(await installStudioComponentsForClusters(ctx, enabled)))

  return result(true, messages, null, [
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
  let partitions = await querySession.selectSessionPartitionInfoFromDeviceType(
    ctx.db,
    ctx.sessionId,
    spec.deviceTypes.map((d) => d.id)
  )
  if (partitions.length === 0) {
    throw new CliError(
      `Could not find the ZCL package that owns device type '${spec.deviceTypes[0].name}'`
    )
  }

  let endpointTypeId = await queryConfig.insertEndpointType(
    ctx.db,
    partitions[0],
    spec.name || 'Anonymous Endpoint Type',
    spec.deviceTypes.map((d) => d.id),
    spec.deviceTypes.map((d) => d.code),
    spec.versions
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

  return result(true, [
    `Created endpoint ${dbEnum.rootNode.endpointId} with the Root Node device type ${rootNode.name} (${asHex(rootNode.code)})`
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
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let changes = []
  let messages = []

  if (params.newEndpoint != null) {
    let value = resolver.requireInteger(params.newEndpoint, 'New endpoint')
    let existing = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
    if (
      value !== endpoint.endpointIdentifier &&
      existing.some((e) => e.endpointIdentifier === value)
    ) {
      throw new CliError(`Endpoint ${value} already exists`)
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
      let parent = await resolver.resolveEndpoint(ctx, params.parent)
      if (parent.id === endpoint.id) {
        throw new CliError('An endpoint cannot be its own parent')
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
      throw new CliError(
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
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let all = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)

  // selectAllEndpoints maps PARENT_ENDPOINT_REF to parentRef (see
  // dbMapping.map.endpointExtended). parentEndpointRef is only a local name
  // used inside query-endpoint helpers, not a field on these rows.
  let children = all.filter((e) => e.parentRef === endpoint.id)
  if (children.length > 0 && params.force !== true) {
    throw new CliError(
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
  if (!stillUsed) {
    await queryEndpointType.deleteEndpointType(ctx.db, endpoint.endpointTypeRef)
  }

  return result(true, [`Deleted endpoint ${endpoint.endpointIdentifier}`])
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
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let all = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  let used = new Set(all.map((e) => e.endpointIdentifier))

  let newIdentifier
  if (params.newEndpoint != null) {
    newIdentifier = resolver.requireInteger(params.newEndpoint, 'New endpoint')
    if (used.has(newIdentifier)) {
      throw new CliError(`Endpoint ${newIdentifier} already exists`)
    }
  } else {
    newIdentifier = 1
    while (used.has(newIdentifier)) newIdentifier++
  }

  let newEndpointTypeId = await queryConfig.duplicateEndpointType(
    ctx.db,
    endpoint.endpointTypeRef
  )
  await queryConfig.duplicateEndpointTypeClusters(
    ctx.db,
    endpoint.endpointTypeRef,
    newEndpointTypeId
  )
  await queryEndpoint.duplicateEndpoint(
    ctx.db,
    endpoint.id,
    newIdentifier,
    newEndpointTypeId
  )

  return result(true, [
    `Duplicated endpoint ${endpoint.endpointIdentifier} as endpoint ${newIdentifier}`
  ])
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
    throw new CliError('At least one --device-type is required')
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
      throw new CliError(
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
 * that device type are left alone, which is what the GUI does as well.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function deviceTypeRemove(ctx, params) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let specs = asArray(params.deviceType)
  if (specs.length === 0) {
    throw new CliError('At least one --device-type is required')
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
      throw new CliError(
        `Endpoint ${endpoint.endpointIdentifier} does not have device type ${dt.name}`
      )
    }
    devices.splice(index, 1)
    removed.push(`${dt.name} (${asHex(dt.code)})`)
  }
  if (devices.length === 0) {
    throw new CliError('An endpoint must keep at least one device type', [
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
    throw new CliError('At least one --device-type is required')
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
      throw new CliError(
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
 * Installs or removes the Simplicity Studio UC components that a cluster needs,
 * which is the other half of what ticking the checkbox in the interface does.
 * The interface sends this from the front end, so a command line edit has to
 * send it too, or the project ends up with the cluster configured and nothing
 * implementing it.
 *
 * Removal is deliberately more cautious than installation, and mirrors what
 * `ZclDomainClusterView` does: only when the data model asked for it, and only
 * once no endpoint is left using the cluster.
 *
 * Does nothing unless --studioHttpPort and --ideProjectPath were both given, so
 * an ordinary edit outside Studio stays silent.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {string[]} sides
 * @param {boolean} enabled
 * @returns {Promise<string[]>} messages describing what Studio did
 */
async function updateStudioComponents(ctx, cluster, sides, enabled) {
  if (!ctx.studioIntegration) return []

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
 * @param {*} ctx
 * @param {Array} clusterStates Rows as returned for the endpoint type.
 * @returns {Promise<string[]>} messages describing what Studio did
 */
async function installStudioComponentsForClusters(ctx, clusterStates) {
  if (!ctx.studioIntegration) return []
  let messages = []
  for (const state of clusterStates.filter((s) => s.enabled)) {
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
 * the first time also brings in its mandatory attributes and commands, which
 * is what happens when the checkbox is ticked in the GUI.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} enabled
 * @returns {Promise<*>} operation result
 */
async function clusterSetEnabled(ctx, params, enabled) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  let sides = resolver.expandSides(params.side)
  let packageIds = await defaultsPackageIds(ctx)

  for (let side of sides) {
    let previous = await queryConfig.selectClusterState(
      ctx.db,
      endpoint.endpointTypeRef,
      cluster.id,
      side
    )
    await queryConfig.insertOrReplaceClusterState(
      ctx.db,
      endpoint.endpointTypeRef,
      cluster.id,
      side,
      enabled
    )
    if (previous == null && enabled) {
      await queryConfig.insertClusterDefaults(
        ctx.db,
        endpoint.endpointTypeRef,
        packageIds,
        { clusterRef: cluster.id, side: side }
      )
    }
  }

  let messages = [
    `${enabled ? 'Enabled' : 'Disabled'} cluster ${cluster.name} (${asHex(
      cluster.code
    )}) ${sides.join('/')} on endpoint ${endpoint.endpointIdentifier}`
  ]
  messages.push(...(await updateStudioComponents(ctx, cluster, sides, enabled)))

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
  throw new CliError(
    `Cluster ${cluster.name} (${asHex(cluster.code)}) is not enabled on the ${side} side of endpoint ${endpoint.endpointIdentifier}`,
    [
      `Elements of a disabled cluster are not written to the .zap file. Enable it first:`,
      `  ${suggestion(ctx, 'cluster enable', {
        endpoint: endpoint.endpointIdentifier,
        cluster: cluster.name,
        side: side
      })}`
    ]
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

  throw new CliError(
    `Cluster ${cluster.name} (${asHex(cluster.code)}) is enabled as a client only on endpoint ${endpoint.endpointIdentifier}, which has no configuration page`,
    [
      `Matter does not offer a page for attributes, commands, events or features of a client-only cluster. Enable the server side to configure it:`,
      `  ${suggestion(ctx, 'cluster enable', {
        endpoint: endpoint.endpointIdentifier,
        cluster: cluster.name,
        side: dbEnum.side.server
      })}`
    ]
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
  throw new CliError(
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
      let policy = await cliPolicy.attributePolicy(ctx, cluster, attribute)
      rows.push({
        code: asHex(attribute.code),
        name: attribute.name,
        side: side,
        enabled: enabled ? 'yes' : 'no',
        storage: state != null ? state.storageOption : '',
        // Which of the columns to its left the data model decides, so that a
        // caller can tell a value it may change from one it may not.
        fixed: cliPolicy.fixedFields(policy),
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
 * @param {*} requested What the command line asked for, undefined per field where it did not.
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
  let policy = await cliPolicy.attributePolicy(ctx, cluster, attribute)
  let state = await attributeState(ctx, endpoint, cluster, attribute)

  // The four fields the interface greys out until the attribute is switched on.
  let fieldsNeedingInclusion = [
    requested.storage !== undefined ? '--storage' : null,
    requested.default !== undefined ? '--default' : null,
    requested.singleton !== undefined ? '--singleton' : null,
    requested.bounded !== undefined ? '--bounded' : null
  ].filter((field) => field != null)
  if (fieldsNeedingInclusion.length > 0) {
    let included =
      requested.enabled !== undefined
        ? requested.enabled
        : state != null && !!state.included
    cliPolicy.requireIncluded(included, fieldsNeedingInclusion, where)
  }

  cliPolicy.requirePolicyRespected(policy, requested, where)

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
        policy.storage != null ? policy.storage : dbEnum.storageOption.ram
    }
    cliPolicy.requireDefaultCanBeKept(requested.default, storage, policy, where)
  }
}

/**
 * Applies any combination of attribute settings: inclusion, default value,
 * storage, singleton, bounded and the four reporting fields.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} [forceEnabled] Set by the enable/disable shorthands.
 * @returns {Promise<*>} operation result
 */
async function attributeSet(ctx, params, forceEnabled = undefined) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  await requireClusterConfigurable(ctx, endpoint, cluster)
  let found = await findAttribute(
    ctx,
    endpoint,
    cluster,
    params.attribute,
    params.side
  )
  let attribute = found.attribute
  let side = found.side
  await requireClusterSideEnabled(ctx, endpoint, cluster, side)

  let updates = []
  let described = []

  let enabled =
    forceEnabled !== undefined ? forceEnabled : optionalBoolean(params.enabled)
  if (enabled !== undefined) {
    updates.push({
      key: restApi.updateKey.attributeSelected,
      value: enabled,
      type: ''
    })
    described.push(enabled ? 'enabled' : 'disabled')
  }

  if (params.default !== undefined) {
    let value = params.default
    if (value !== null && `${value}` === '') {
      // The column write turns an empty string into 0, so accepting this would
      // quietly set a different value than the one asked for.
      throw new CliError('An empty --default is not a value', [
        `Pass the value you want, or 'null' for a nullable attribute.`
      ])
    }
    if (value === null || `${value}`.toLowerCase() === 'null') {
      if (!attribute.isNullable) {
        throw new CliError(`Attribute ${attribute.name} is not nullable`)
      }
      updates.push({
        key: restApi.updateKey.attributeDefault,
        value: null,
        type: 'text'
      })
      described.push('default=null')
    } else {
      updates.push({
        key: restApi.updateKey.attributeDefault,
        value: `${value}`,
        type: 'text'
      })
      described.push(`default=${value}`)
    }
  }

  let requestedStorage
  if (params.storage !== undefined && params.storage !== null) {
    let allowed = Object.values(dbEnum.storageOption)
    requestedStorage = allowed.find(
      (s) => s.toLowerCase() === `${params.storage}`.toLowerCase()
    )
    if (requestedStorage == null) {
      throw new CliError(
        `Invalid --storage '${params.storage}', expected one of ${allowed.join(', ')}`
      )
    }
    updates.push({
      key: restApi.updateKey.attributeStorage,
      value: requestedStorage,
      type: 'text'
    })
    described.push(`storage=${requestedStorage}`)
  }

  let singleton = optionalBoolean(params.singleton)
  if (singleton !== undefined) {
    updates.push({
      key: restApi.updateKey.attributeSingleton,
      value: singleton,
      type: ''
    })
    described.push(`singleton=${singleton}`)
  }

  let bounded = optionalBoolean(params.bounded)
  if (bounded !== undefined) {
    updates.push({
      key: restApi.updateKey.attributeBounded,
      value: bounded,
      type: ''
    })
    described.push(`bounded=${bounded}`)
  }

  let reporting = optionalBoolean(params.reporting)
  if (reporting !== undefined) {
    updates.push({
      key: restApi.updateKey.attributeReporting,
      value: reporting,
      type: ''
    })
    described.push(`reporting=${reporting}`)
  }

  if (params.minInterval != null) {
    let value = resolver.requireInteger(params.minInterval, 'Min interval')
    updates.push({
      key: restApi.updateKey.attributeReportMin,
      value: value,
      type: ''
    })
    described.push(`minInterval=${value}`)
  }
  if (params.maxInterval != null) {
    let value = resolver.requireInteger(params.maxInterval, 'Max interval')
    updates.push({
      key: restApi.updateKey.attributeReportMax,
      value: value,
      type: ''
    })
    described.push(`maxInterval=${value}`)
  }
  if (params.reportableChange != null) {
    let value = resolver.requireInteger(
      params.reportableChange,
      'Reportable change'
    )
    updates.push({
      key: restApi.updateKey.attributeReportChange,
      value: value,
      type: ''
    })
    described.push(`reportableChange=${value}`)
  }

  if (updates.length === 0) {
    throw new CliError('Nothing to set', [
      'Pass at least one of --enabled, --default, --storage, --singleton,',
      '--bounded, --reporting, --min-interval, --max-interval, --reportable-change.'
    ])
  }

  await requireAttributeChangeAllowed(ctx, endpoint, cluster, side, attribute, {
    enabled: enabled,
    storage: requestedStorage,
    reporting: reporting,
    default: params.default,
    singleton: singleton,
    bounded: bounded
  })

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

  let messages = [
    `Attribute ${attribute.name} (${asHex(attribute.code)}) on ${cluster.name}/${side} of endpoint ${
      endpoint.endpointIdentifier
    }: ${described.join(', ')}`
  ]

  // Excluding FeatureMap discards the cluster's whole feature selection,
  // because that selection is the attribute's value.
  if (
    enabled === false &&
    attribute.code === dbEnum.featureMapAttribute.code &&
    attribute.name === dbEnum.featureMapAttribute.name
  ) {
    let features = await featuresOfCluster(ctx, endpoint, cluster)
    if (features.length > 0) {
      messages.push(
        `warning: ${cluster.name} keeps its feature selection in FeatureMap, so excluding the attribute drops it`
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
  let defaultIssues = (issues && issues.defaultValue) || []
  defaultIssues.forEach((issue) => messages.push(`warning: ${issue}`))

  return result(true, messages)
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
  throw new CliError(
    `Invalid direction '${direction}', expected in, out or both`
  )
}

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
 * @returns {*} a CliError, or null when the direction is expressible
 */
function describeUnwritableDirection(command, isIncoming) {
  let side = commandSide(command, isIncoming)
  if (side === dbEnum.source.client || side === dbEnum.source.server) {
    return null
  }
  return new CliError(
    `Command ${command.name} is declared with source '${command.source}', so ZAP has no cluster side to record its outgoing direction against`,
    [`Enable it as an incoming command instead:`, `  --direction in`]
  )
}

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
 * Enables or disables a command in the incoming and/or outgoing direction.
 *
 * @param {*} ctx
 * @param {*} params
 * @param {boolean} enabled
 * @returns {Promise<*>} operation result
 */
async function commandSetEnabled(ctx, params, enabled) {
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  await requireClusterConfigurable(ctx, endpoint, cluster)
  let command = await resolver.resolveCommand(ctx, cluster, params.command)
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
    await queryConfig.insertOrUpdateCommandState(
      ctx.db,
      endpoint.endpointTypeRef,
      cluster.id,
      command.source,
      command.id,
      enabled,
      isIncoming
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
  let endpoint = await resolver.resolveEndpoint(ctx, params.endpoint)
  let cluster = await resolver.resolveCluster(ctx, params.cluster, endpoint)
  await requireClusterConfigurable(ctx, endpoint, cluster)
  let event = await resolver.resolveEvent(ctx, cluster, params.event)
  let side = params.side || event.side || dbEnum.side.server
  await requireClusterSideEnabled(ctx, endpoint, cluster, side)

  await queryConfig.insertOrUpdateEventState(
    ctx.db,
    endpoint.endpointTypeRef,
    cluster.id,
    side,
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
 * The features a cluster defines, as they apply to one endpoint.
 *
 * A feature carries two conformances: the one the cluster specification gives
 * it, and the one the endpoint's device type gives it, which is often stricter.
 * Lighting on the On/Off cluster is conditional in general but mandatory on a
 * Dimmable Light. The device type has the final say, so where one exists it
 * replaces the cluster conformance, exactly as the user interface does before
 * it runs a conformance check.
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
 * @returns {Promise<*>} `{ definition, state, value }`
 */
async function featureMapAttribute(ctx, endpoint, cluster) {
  let attributes = await resolver.attributesOfCluster(
    ctx,
    cluster,
    dbEnum.side.server
  )
  let definition = attributes.find(
    (a) =>
      a.code === dbEnum.featureMapAttribute.code &&
      a.name === dbEnum.featureMapAttribute.name
  )
  if (definition == null) {
    throw new CliError(
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
 * @param {*} ctx
 * @param {*} endpoint
 * @param {*} cluster
 * @param {*} map Result of `featureMapAttribute`.
 * @returns {undefined} nothing, throws when the change could not be kept
 */
function requireFeatureMapIncluded(ctx, endpoint, cluster, map) {
  if (map.included) return
  throw new CliError(
    `The FeatureMap attribute of ${cluster.name} is not enabled on endpoint ${endpoint.endpointIdentifier}, so feature changes cannot be saved`,
    [
      `Features are bits of that attribute's value. Enable it first:`,
      `  ${suggestion(ctx, 'attribute enable', {
        endpoint: endpoint.endpointIdentifier,
        cluster: cluster.name,
        attribute: dbEnum.featureMapAttribute.name
      })}`
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
  await requireClusterConfigurable(ctx, endpoint, cluster)
  await requireClusterSideEnabled(ctx, endpoint, cluster, dbEnum.side.server)

  let features = await featuresOfCluster(ctx, endpoint, cluster)
  if (features.length === 0) {
    throw new CliError(`Cluster ${cluster.name} defines no features`)
  }
  let feature = matchFeature(params.feature, features)
  cliPolicy.requireToggleableFeature(
    feature,
    cluster,
    endpoint.endpointIdentifier
  )

  let map = await featureMapAttribute(ctx, endpoint, cluster)
  requireFeatureMapIncluded(ctx, endpoint, cluster, map)
  let newValue = enabled
    ? map.value | (1 << feature.bit)
    : map.value & ~(1 << feature.bit)
  if (newValue === map.value) {
    return result(false, [
      `Feature ${feature.name} (${feature.code}) is already ${enabled ? 'enabled' : 'disabled'} on ${cluster.name} of endpoint ${endpoint.endpointIdentifier}`
    ])
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

  if (conformance.disableChange) {
    throw new CliError(
      `Feature ${feature.name} (${feature.code}) cannot be ${enabled ? 'enabled' : 'disabled'} on ${cluster.name} of endpoint ${endpoint.endpointIdentifier}`,
      [].concat(conformance.warningMessage || [])
    )
  }

  let messages = []
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
    messages.push(
      `  ${attribute.value ? 'enabled' : 'disabled'} attribute ${attribute.name}`
    )
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
    messages.push(
      `  ${command.value ? 'enabled' : 'disabled'} command ${command.name}`
    )
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
    messages.push(
      `  ${event.value ? 'enabled' : 'disabled'} event ${event.name}`
    )
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

  // The confirmation dialog is the only place the user interface says how much
  // a feature drags along with it, and it does so by listing the elements. A
  // count says the same thing in one line, which is what a caller watching for
  // a surprise wants to read first.
  let counted = countElements(conformance)

  return result(
    true,
    [
      `${enabled ? 'Enabled' : 'Disabled'} feature ${feature.name} (${feature.code}, bit ${feature.bit}) on ${cluster.name} of endpoint ${endpoint.endpointIdentifier}, featureMap ${asHex(map.value, 8)} -> ${asHex(newValue, 8)}`,
      counted,
      ...messages,
      // The interface pops up this warning only when displayWarning says to.
      // The message is composed either way, and after an enable that satisfies
      // a mandatory conformance it reads as though the enable had not happened.
      ...(conformance.displayWarning
        ? []
            .concat(conformance.warningMessage || [])
            .map((w) => `warning: ${w}`)
        : [])
    ].filter((line) => line !== null)
  )
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
 * Resolves `--feature`. Feature codes are short letter codes such as LT rather
 * than numbers, so a bare number is read as a bit position.
 *
 * @param {*} spec
 * @param {Array} features
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
    throw cliError.notFound('feature', spec, features.map(describe))
  }
  throw cliError.ambiguous('feature', spec, matches.map(describe))
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
 * clusters, attributes, commands and events that came from it, which is how
 * the GUI behaves too. Counting first is what lets the CLI say so instead of
 * doing it quietly.
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
  let rows = (await cliSession.packages(ctx)).map((p) => ({
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
    throw new CliError('At least one --xml is required')
  }

  let messages = []
  let next = []
  for (let file of files) {
    if (!fs.existsSync(file)) {
      throw new CliError(`No such file: ${file}`, [
        `--xml takes the path of a ZCL XML file describing custom clusters.`
      ])
    }
    if (path.extname(file).toLowerCase() !== '.xml') {
      throw new CliError(`${file} is not an XML file`, [
        `Custom clusters are described in a ZCL XML file. A zcl.json metafile`,
        `belongs on --zclProperties instead.`
      ])
    }

    let outcome = await cliSession.addCustomXml(ctx, path.resolve(file))
    if (!outcome.succeeded) {
      throw new CliError(`Could not load ${file}`, [
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
  if (spec == null || `${spec}` === '') {
    throw new CliError('--xml is required')
  }

  let custom = (await cliSession.packages(ctx))
    .map((p) => p.pkg)
    .filter((p) => p.type === dbEnum.packageType.zclXmlStandalone)
  let match =
    custom.find((p) => cliSession.samePath(p.path, spec)) ||
    custom.find((p) => path.basename(p.path) === path.basename(`${spec}`))

  if (match == null) {
    // A file that was named but never loaded is still worth removing: the
    // reference is what is wrong with the configuration.
    let declared = (ctx.unresolvedCustomXml || []).find(
      (p) =>
        cliSession.samePath(p.path, spec) ||
        path.basename(p.path) === path.basename(`${spec}`)
    )
    if (declared != null) {
      return result(true, [
        `${declared.declared} is named by the configuration but was never loaded`,
        `Saving drops the reference to it`
      ])
    }
    throw cliError.notFound(
      'custom XML package',
      spec,
      custom.map((p) => p.path)
    )
  }

  let used = await endpointUseOfPackage(ctx, match.id)
  if (used.length > 0 && params.force !== true) {
    throw new CliError(
      `${path.basename(match.path)} defines ${used.length} cluster(s) that this configuration uses`,
      [
        `Removing it deletes their endpoint configuration, as it does in the GUI:`,
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

  let removed = await cliSession.removeCustomXml(ctx, match.id)
  if (!removed) {
    throw new CliError(`${match.path} is not attached to this configuration`)
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
  let issues = cliOutput.collectIssues(await cliSession.validate(ctx))
  let rows = issues.map((issue) => ({
    kind: issue.kind,
    source: 'validation',
    message: issue.text
  }))

  let notifications = await cliSession.notifications(ctx)
  if (params.packages === true) {
    notifications = notifications.concat(
      await cliSession.packageNotifications(ctx)
    )
  }
  let reported = issues.map((issue) => cliOutput.complianceKey(issue.text))
  for (let notification of notifications) {
    let key = cliOutput.complianceKey(notification.message)
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

/**
 * The operation table. Keys are the dotted names used by both the yargs
 * command tree and the batch script format.
 */
const operations = {
  'config.info': (ctx) => configInfo(ctx),
  'config.check': (ctx, params) => configCheck(ctx, params),

  'endpoint.list': (ctx) => endpointList(ctx),
  'endpoint.create': (ctx, params) => endpointCreate(ctx, params),
  'endpoint.update': (ctx, params) => endpointUpdate(ctx, params),
  'endpoint.delete': (ctx, params) => endpointDelete(ctx, params),
  'endpoint.duplicate': (ctx, params) => endpointDuplicate(ctx, params),

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

  let endpointTypeIds = [...new Set(included.map((e) => e.endpointTypeRef))]
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
    throw new CliError(`Unknown operation '${name}'`, [
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
