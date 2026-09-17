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
 * Turns the human friendly identifiers that a person types on a command line
 * ("On/Off", "0x0006", "MA-onofflight") into the database references that the
 * rest of ZAP works with.
 *
 * @module CLI API: entity resolution
 */

const dbEnum = require('../../src-shared/db-enum.js')
const queryZcl = require('../db/query-zcl.js')
const queryCommand = require('../db/query-command.js')
const queryEvent = require('../db/query-event.js')
const queryDeviceType = require('../db/query-device-type.js')
const queryEndpoint = require('../db/query-endpoint.js')
const queryPackage = require('../db/query-package.js')
const cliError = require('./cli-error.js')

const CliError = cliError.CliError

/**
 * Reduces a name to a form that ignores the punctuation and casing differences
 * between how a spec writes a name and how a person types it, so that `onoff`,
 * `On/Off` and `ON_OFF` all compare equal.
 *
 * @param {string} name
 * @returns {string} normalized name
 */
function normalizeName(name) {
  if (name == null) return ''
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Parses a numeric identifier, accepting decimal and 0x-prefixed hex.
 * Returns null when the text is not purely numeric, which is how the resolvers
 * tell a code apart from a name.
 *
 * @param {*} spec
 * @returns {number | null} the numeric value or null
 */
function parseCode(spec) {
  if (spec == null) return null
  if (typeof spec === 'number') return Number.isInteger(spec) ? spec : null
  let s = String(spec).trim()
  if (/^0[xX][0-9a-fA-F]+$/.test(s)) return parseInt(s, 16)
  if (/^[0-9]+$/.test(s)) return parseInt(s, 10)
  return null
}

/**
 * Parses a required integer command line value, accepting decimal and hex.
 *
 * @param {*} spec
 * @param {string} what Name of the option, used in the error message.
 * @returns {number} parsed integer
 */
function requireInteger(spec, what) {
  let value = parseCode(spec)
  if (value == null) {
    throw new CliError(`${what} must be a number, got '${spec}'`)
  }
  return value
}

/**
 * Formats a code the way ZCL documentation does, so that CLI output can be
 * pasted straight back into a CLI argument.
 *
 * @param {number} code
 * @param {number} width Number of hex digits.
 * @returns {string} hex string such as '0x0006'
 */
function asHex(code, width = 4) {
  if (code == null) return ''
  return '0x' + Number(code).toString(16).toUpperCase().padStart(width, '0')
}

/**
 * Picks the single match out of a candidate list, or raises a descriptive
 * error when there are none or several.
 *
 * @param {string} what
 * @param {string} spec
 * @param {Array} matches
 * @param {Array} all Everything that was searched, used to build suggestions.
 * @param {Function} describe Renders one entry for the error message.
 * @returns {*} the single match
 */
function exactlyOne(what, spec, matches, all, describe) {
  if (matches.length === 1) return matches[0]
  if (matches.length === 0) {
    throw cliError.notFound(what, spec, all.map(describe))
  }
  throw cliError.ambiguous(what, spec, matches.map(describe))
}

/**
 * Generic name-or-code lookup shared by every entity kind.
 *
 * @param {string} what
 * @param {*} spec
 * @param {Array} all
 * @param {Function} describe
 * @param {string[]} nameFields Object fields that hold a matchable name.
 * @returns {*} the resolved entity
 */
function matchByNameOrCode(what, spec, all, describe, nameFields = ['name']) {
  let code = parseCode(spec)
  if (code != null) {
    let byCode = all.filter((e) => e.code === code)
    return exactlyOne(what, spec, byCode, all, describe)
  }
  let normalized = normalizeName(spec)
  let byName = all.filter((e) =>
    nameFields.some((f) => normalizeName(e[f]) === normalized)
  )
  return exactlyOne(what, spec, byName, all, describe)
}

/**
 * Every ZCL package attached to the session, regardless of category.
 *
 * @param {*} ctx CLI session context.
 * @returns {Promise<Array>} array of package records
 */
async function allZclPackages(ctx) {
  if (ctx.zclPackageCache == null) {
    let pairs = await queryPackage.getPackageSessionPackagePairBySessionId(
      ctx.db,
      ctx.sessionId
    )
    ctx.zclPackageCache = pairs
      .map((p) => p.pkg)
      .filter(
        (p) =>
          p.type === dbEnum.packageType.zclProperties ||
          p.type === dbEnum.packageType.zclXmlStandalone
      )
  }
  return ctx.zclPackageCache
}

/**
 * True when two package category names refer to the same protocol.
 *
 * Callers write Matter and Zigbee as often as matter and zigbee; the
 * comparison is case-insensitive so either form selects the same packages.
 *
 * @param {string|null|undefined} a
 * @param {string|null|undefined} b
 * @returns {boolean} whether the names match
 */
function sameCategory(a, b) {
  if (a == null || b == null) return false
  return `${a}`.toLowerCase() === `${b}`.toLowerCase()
}

/**
 * The categories the session spans. A multiprotocol configuration carries one
 * per protocol, which is what makes `--category` necessary.
 *
 * @param {*} ctx
 * @returns {Promise<string[]>} category names
 */
async function sessionCategories(ctx) {
  let pkgs = await allZclPackages(ctx)
  return [...new Set(pkgs.map((p) => p.category).filter((c) => c != null))]
}

/**
 * The ZCL packages attached to the session, narrowed to a single category when
 * one was asked for. Categories are how ZAP separates, for example, the Zigbee
 * and the Matter halves of a multiprotocol configuration.
 *
 * @param {*} ctx CLI session context.
 * @param {string} [category] Overrides the category on the context.
 * @returns {Promise<Array>} array of package records
 */
async function zclPackages(ctx, category = null) {
  let pkgs = await allZclPackages(ctx)
  let wanted = category != null ? category : ctx.category
  if (wanted == null) return pkgs

  // Custom XML always stays in scope: it extends whatever else is loaded.
  let filtered = pkgs.filter(
    (p) =>
      sameCategory(p.category, wanted) ||
      p.type === dbEnum.packageType.zclXmlStandalone
  )
  if (filtered.length === 0) {
    let available = await sessionCategories(ctx)
    throw new CliError(
      `No ZCL package with category '${wanted}' is attached to this configuration`,
      [`Available categories: ${available.join(', ') || '(none)'}`]
    )
  }
  return filtered
}

/**
 * Returns the ZCL package ids that are attached to the session.
 *
 * @param {*} ctx
 * @param {string} [category]
 * @returns {Promise<number[]>} package ids
 */
async function zclPackageIds(ctx, category = null) {
  let pkgs = await zclPackages(ctx, category)
  return pkgs.map((p) => p.id)
}

/**
 * Every device type visible to the session.
 *
 * @param {*} ctx
 * @param {string} [category]
 * @returns {Promise<Array>} device types
 */
async function allDeviceTypes(ctx, category = null) {
  let ids = await zclPackageIds(ctx, category)
  let out = []
  for (let id of ids) {
    out.push(...(await queryDeviceType.selectAllDeviceTypes(ctx.db, id)))
  }
  return out
}

/**
 * Every cluster visible to the session.
 *
 * @param {*} ctx
 * @param {string} [category]
 * @returns {Promise<Array>} clusters
 */
async function allClusters(ctx, category = null) {
  let ids = await zclPackageIds(ctx, category)
  let out = []
  for (let id of ids) {
    out.push(...(await queryZcl.selectAllClusters(ctx.db, id)))
  }
  return out
}

/**
 * Resolves `--device-type`.
 *
 * @param {*} ctx
 * @param {*} spec Name or code.
 * @param {string} [category]
 * @returns {Promise<*>} the device type
 */
async function resolveDeviceType(ctx, spec, category = null) {
  let all = await allDeviceTypes(ctx, category)
  return matchByNameOrCode(
    'device type',
    spec,
    all,
    (d) => `${d.name} (${asHex(d.code)}) [${d.caption || d.domain || ''}]`,
    ['name', 'caption']
  )
}

/**
 * Resolves `--cluster`. When an endpoint is in play the search is limited to
 * the packages that the endpoint's device types come from, which keeps
 * multiprotocol configurations unambiguous.
 *
 * @param {*} ctx
 * @param {*} spec Name, define or code.
 * @param {*} [endpoint] Endpoint record used to narrow the package set.
 * @returns {Promise<*>} the cluster
 */
async function resolveCluster(ctx, spec, endpoint = null) {
  let all =
    endpoint != null
      ? await clustersForEndpoint(ctx, endpoint)
      : await allClusters(ctx)
  return matchByNameOrCode(
    'cluster',
    spec,
    all,
    (c) => `${c.name} (${asHex(c.code)})`,
    ['name', 'define']
  )
}

/**
 * The clusters that are meaningful for a given endpoint, that is the ones
 * defined by the same packages as the endpoint's device types.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @returns {Promise<Array>} clusters
 */
async function clustersForEndpoint(ctx, endpoint) {
  let ids = await packageIdsForEndpoint(ctx, endpoint)
  let out = []
  for (let id of ids) {
    out.push(...(await queryZcl.selectAllClusters(ctx.db, id)))
  }
  return out
}

/**
 * The ZCL package ids relevant to a single endpoint. Falls back to every
 * session package when the endpoint has no resolvable device type.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @returns {Promise<number[]>} package ids
 */
async function packageIdsForEndpoint(ctx, endpoint) {
  let refs = new Set(await packageRefsOfEndpoint(ctx, endpoint))
  let sessionPkgs = await zclPackages(ctx)
  // Custom XML always stays in scope: it extends whatever else is loaded.
  sessionPkgs
    .filter((p) => p.type === dbEnum.packageType.zclXmlStandalone)
    .forEach((p) => refs.add(p.id))
  if (refs.size === 0) return sessionPkgs.map((p) => p.id)
  let sessionIds = new Set(sessionPkgs.map((p) => p.id))
  return [...refs].filter((r) => sessionIds.has(r))
}

/**
 * The ZCL packages an endpoint's device types are defined by.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @returns {Promise<number[]>} package ids
 */
async function packageRefsOfEndpoint(ctx, endpoint) {
  let devices = await queryDeviceType.selectDeviceTypesByEndpointTypeId(
    ctx.db,
    endpoint.endpointTypeRef
  )
  let refs = new Set()
  for (let d of devices) {
    let dt = await queryDeviceType.selectDeviceTypeById(ctx.db, d.deviceTypeRef)
    if (dt != null && dt.packageRef != null) refs.add(dt.packageRef)
  }
  return [...refs]
}

/**
 * The categories an endpoint belongs to, taken from the packages that define
 * its device types. In a multiprotocol configuration this is what tells the
 * Zigbee endpoint 1 apart from the Matter endpoint 1.
 *
 * @param {*} ctx
 * @param {*} endpoint
 * @returns {Promise<string[]>} category names
 */
async function endpointCategories(ctx, endpoint) {
  let refs = await packageRefsOfEndpoint(ctx, endpoint)
  let byId = new Map((await allZclPackages(ctx)).map((p) => [p.id, p]))
  return [
    ...new Set(
      refs
        .map((r) => byId.get(r))
        .filter((p) => p != null && p.category != null)
        .map((p) => p.category)
    )
  ]
}

/**
 * Resolves `--attribute` within a cluster. Global attributes such as
 * ClusterRevision are included, matching what the GUI shows.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} spec Name, define or code.
 * @param {string} side 'client' or 'server'.
 * @returns {Promise<*>} the attribute
 */
async function resolveAttribute(ctx, cluster, spec, side) {
  let all = await attributesOfCluster(ctx, cluster, side)
  return matchByNameOrCode(
    `attribute of cluster ${cluster.name} (${side})`,
    spec,
    all,
    (a) => `${a.name} (${asHex(a.code)})`,
    ['name', 'define']
  )
}

/**
 * All attributes of a cluster on one side, including global attributes.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {string} side
 * @returns {Promise<Array>} attributes
 */
async function attributesOfCluster(ctx, cluster, side) {
  let ids = await zclPackageIds(ctx)
  return queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
    ctx.db,
    cluster.id,
    ids,
    side
  )
}

/**
 * Resolves `--command` within a cluster.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} spec Name or code.
 * @returns {Promise<*>} the command
 */
async function resolveCommand(ctx, cluster, spec) {
  let all = await commandsOfCluster(ctx, cluster)
  return matchByNameOrCode(
    `command of cluster ${cluster.name}`,
    spec,
    all,
    (c) => `${c.name} (${asHex(c.code, 2)}, source: ${c.source})`,
    ['name']
  )
}

/**
 * All commands of a cluster.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @returns {Promise<Array>} commands
 */
async function commandsOfCluster(ctx, cluster) {
  let ids = await zclPackageIds(ctx)
  return queryCommand.selectCommandsByClusterId(ctx.db, cluster.id, ids)
}

/**
 * Resolves `--event` within a cluster.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} spec Name or code.
 * @returns {Promise<*>} the event
 */
async function resolveEvent(ctx, cluster, spec) {
  let all = await eventsOfCluster(ctx, cluster)
  if (all.length === 0) {
    throw new CliError(`Cluster ${cluster.name} does not define any events`)
  }
  return matchByNameOrCode(
    `event of cluster ${cluster.name}`,
    spec,
    all,
    (e) => `${e.name} (${asHex(e.code, 2)})`,
    ['name']
  )
}

/**
 * All events of a cluster.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @returns {Promise<Array>} events
 */
async function eventsOfCluster(ctx, cluster) {
  return queryEvent.selectEventsByClusterId(ctx.db, cluster.id)
}

/**
 * Resolves `--endpoint`, which always refers to the endpoint identifier that
 * the user sees in the GUI and in generated code, never to a database row id.
 *
 * @param {*} ctx
 * @param {*} spec
 * @returns {Promise<*>} the endpoint
 */
async function resolveEndpoint(ctx, spec) {
  let identifier = requireInteger(spec, 'Endpoint identifier')
  let all = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  let matches = all.filter((e) => e.endpointIdentifier === identifier)
  if (matches.length === 0) {
    throw cliError.notFound(
      'endpoint',
      spec,
      all.map((e) => `${e.endpointIdentifier}`)
    )
  }
  if (matches.length === 1) return matches[0]

  // A multiprotocol configuration numbers its endpoints per protocol, so the
  // same identifier legitimately appears once per category, and --category is
  // what tells them apart.
  let annotated = []
  for (let candidate of matches) {
    annotated.push({
      endpoint: candidate,
      categories: await endpointCategories(ctx, candidate)
    })
  }

  if (ctx.category != null) {
    let holds = annotated.filter((a) =>
      a.categories.some((c) => sameCategory(c, ctx.category))
    )
    if (holds.length === 1) return holds[0].endpoint
    // A device type whose name exists in both data models leaves its endpoint
    // looking like it belongs to both. The one that belongs to the requested
    // protocol alone is the one that was meant.
    let only = holds.filter(
      (a) =>
        a.categories.length === 1 && sameCategory(a.categories[0], ctx.category)
    )
    if (only.length === 1) return only[0].endpoint
  }

  throw new CliError(
    `Endpoint ${identifier} is defined ${matches.length} times in this configuration`,
    [
      ...annotated.map(
        (a) =>
          `  endpoint ${identifier} (${a.categories.join(', ') || 'no category'})`
      ),
      ctx.category == null
        ? `Add --category to say which one you mean.`
        : `--category ${ctx.category} did not narrow it to one.`
    ]
  )
}

/**
 * Expands a `--side` value into the list of sides it stands for.
 *
 * @param {string} side 'client', 'server' or 'both'.
 * @returns {string[]} concrete sides
 */
function expandSides(side) {
  if (side === dbEnum.side.both) {
    return [dbEnum.side.client, dbEnum.side.server]
  }
  if (side === dbEnum.side.client || side === dbEnum.side.server) {
    return [side]
  }
  throw new CliError(`Invalid side '${side}', expected client, server or both`)
}

exports.normalizeName = normalizeName
exports.parseCode = parseCode
exports.requireInteger = requireInteger
exports.asHex = asHex
exports.sameCategory = sameCategory
exports.zclPackages = zclPackages
exports.zclPackageIds = zclPackageIds
exports.sessionCategories = sessionCategories
exports.endpointCategories = endpointCategories
exports.allDeviceTypes = allDeviceTypes
exports.allClusters = allClusters
exports.clustersForEndpoint = clustersForEndpoint
exports.attributesOfCluster = attributesOfCluster
exports.commandsOfCluster = commandsOfCluster
exports.eventsOfCluster = eventsOfCluster
exports.resolveDeviceType = resolveDeviceType
exports.resolveCluster = resolveCluster
exports.resolveAttribute = resolveAttribute
exports.resolveCommand = resolveCommand
exports.resolveEvent = resolveEvent
exports.resolveEndpoint = resolveEndpoint
exports.expandSides = expandSides
