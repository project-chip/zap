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
 * Package operations: the ZCL and custom XML packages of a configuration, and loading or removing custom XML.
 *
 * @module Configuration API: package operations
 */

const fs = require('fs')
const path = require('path')
const dbEnum = require('../../../src-shared/db-enum.js')
const queryEndpoint = require('../../db/query-endpoint.js')
const queryDeviceType = require('../../db/query-device-type.js')
const queryZcl = require('../../db/query-zcl.js')
const resolver = require('../resolver.js')
const operationError = require('../errors.js')
const sessionContent = require('../../util/session-content.js')
const outcome = require('../outcome.js')

const { applyFilter } = require('./listing.js')

const result = outcome.result
const step = outcome.step
const OperationError = operationError.OperationError
const asHex = resolver.asHex
const asArray = resolver.asArray

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
 * is what lets the refusal say so instead of doing it quietly.
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
    custom.length === 0 ? [step('package.add', { xml: '<file.xml>' })] : []
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
        step('cluster.enable', {
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
        )
      ],
      [step('package.remove', { xml: match.path, force: true })]
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

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'package.list': (ctx, params) => packageList(ctx, params),
  'package.add': (ctx, params) => packageAdd(ctx, params),
  'package.remove': (ctx, params) => packageRemove(ctx, params)
}

exports.operations = operations
