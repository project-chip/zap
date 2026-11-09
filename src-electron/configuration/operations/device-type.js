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
 * Device type operations: the catalog, and adding, removing or replacing the device types of an endpoint.
 *
 * @module Configuration API: device type operations
 */

const restApi = require('../../../src-shared/rest-api.js')
const queryConfig = require('../../db/query-config.js')
const resolver = require('../resolver.js')
const operationError = require('../errors.js')
const outcome = require('../outcome.js')

const { listingNext, applyFilter } = require('./listing.js')
const { lowestFreeEndpoint, deviceTypesOfEndpoint } = require('./endpoint.js')

const result = outcome.result
const step = outcome.step
const OperationError = operationError.OperationError
const asHex = resolver.asHex
const asArray = resolver.asArray

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
          step('endpoint.create', {
            endpoint: lowestFree,
            deviceType: row.name
          }),
        widen: () => step('devicetype.list', { all: true })
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

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'devicetype.list': (ctx, params) => deviceTypeList(ctx, params),
  'devicetype.add': (ctx, params) => deviceTypeAdd(ctx, params),
  'devicetype.remove': (ctx, params) => deviceTypeRemove(ctx, params),
  'devicetype.set': (ctx, params) => deviceTypeSet(ctx, params)
}

exports.operations = operations
