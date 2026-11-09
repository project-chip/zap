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
 * Endpoint and endpoint type operations: list, create, attach, update, delete, duplicate, and the root node a Matter configuration starts with.
 *
 * @module Configuration API: endpoint operations
 */

const dbEnum = require('../../../src-shared/db-enum.js')
const restApi = require('../../../src-shared/rest-api.js')
const queryConfig = require('../../db/query-config.js')
const queryEndpoint = require('../../db/query-endpoint.js')
const queryEndpointType = require('../../db/query-endpoint-type.js')
const queryDeviceType = require('../../db/query-device-type.js')
const queryZcl = require('../../db/query-zcl.js')
const querySession = require('../../db/query-session.js')
const resolver = require('../resolver.js')
const operationError = require('../errors.js')
const outcome = require('../outcome.js')

const studioComponents = require('./studio-components.js')

const result = outcome.result
const step = outcome.step
const OperationError = operationError.OperationError
const asHex = resolver.asHex
const asArray = resolver.asArray

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
          step('devicetype.list', { all: true }),
          step('endpoint.create', {
            endpoint: 1,
            deviceType: '<name>'
          })
        ]
      : [step('cluster.list', { endpoint: rows[0].endpoint })]
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
  messages.push(
    ...(await studioComponents.installStudioComponentsForClusters(ctx, enabled))
  )

  let outcome = result(true, messages, null, [
    step('cluster.list', {
      endpoint: identifier,
      enabledOnly: true
    }),
    step('cluster.enable', {
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
            await resolver.endpointFromParams(ctx, {
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
    ...(await studioComponents.installStudioComponentsForClusters(
      ctx,
      clusterStates
    ))
  ])
  outcome.id = id
  outcome.endpointTypeId = endpointTypeId
  return outcome
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
    throw new OperationError(
      `Endpoint ${identifier} already exists`,
      [
        `Pick a free identifier, or change the existing endpoint instead:`,
        ...(categories.length > 1
          ? [
              `This configuration spans ${categories.join(' and ')}, and identifiers`,
              `are counted across all of them by ZAP's validation.`
            ]
          : [])
      ],
      [step('endpoint.update', { endpoint: identifier })]
    )
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
    ...(await studioComponents.installStudioComponentsForClusters(
      ctx,
      clusterStates
    ))
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
  let endpoint = await resolver.endpointFromParams(ctx, params)
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
          ? await resolver.endpointFromParams(ctx, {
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
  let endpoint = await resolver.endpointFromParams(ctx, params)
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
      ['Deleting it anyway orphans the children:'],
      [
        step('endpoint.delete', {
          endpoint: endpoint.endpointIdentifier,
          force: true
        })
      ]
    )
  }

  await queryEndpoint.deleteEndpoint(ctx.db, endpoint.id)

  // An endpoint whose type was already removed has a null reference, and two
  // such endpoints do not "share" a type.
  let stillUsed =
    endpoint.endpointTypeRef == null ||
    all.some(
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
  let endpoint = await resolver.endpointFromParams(ctx, params)
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
    ...(await studioComponents.installStudioComponentsForClusters(
      ctx,
      clusterStates
    ))
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

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'endpoint.list': (ctx) => endpointList(ctx),
  'endpoint.create': (ctx, params) => endpointCreate(ctx, params),
  'endpoint.attach': (ctx, params) => endpointAttach(ctx, params),
  'endpoint.update': (ctx, params) => endpointUpdate(ctx, params),
  'endpoint.delete': (ctx, params) => endpointDelete(ctx, params),
  'endpoint.duplicate': (ctx, params) => endpointDuplicate(ctx, params),
  'endpointtype.create': (ctx, params) => endpointTypeCreate(ctx, params),
  'endpointtype.update': (ctx, params) => endpointTypeUpdate(ctx, params),
  'endpointtype.delete': (ctx, params) => endpointTypeDelete(ctx, params),
  'endpointtype.duplicate': (ctx, params) => endpointTypeDuplicate(ctx, params)
}

exports.operations = operations
exports.lowestFreeEndpoint = lowestFreeEndpoint
exports.deviceTypesOfEndpoint = deviceTypesOfEndpoint
exports.createRootNode = createRootNode
