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
 * Unifying the attribute and command states of a cluster that more than one
 * endpoint enables.
 *
 * In Zigbee the configuration of a cluster is a single global entity: if the
 * Basic cluster is on three endpoints, the attributes and commands it includes
 * are the same on all three, and the framework stores one copy. ZAP's tables
 * are per endpoint type, so that shape has to be enforced rather than assumed:
 * after a change, every endpoint type that enables a shared cluster is aligned
 * to the first matching entry.
 *
 * Matter is the opposite and needs none of this, since an attribute there is
 * genuinely per endpoint. Which behaviour applies is a property of the data
 * model, declared by the `shareClusterStatesAcrossEndpoints` generator option,
 * so nothing here decides it by looking at names.
 *
 * The CLI operation runner reconciles this after each committed operation;
 * post-load scripts reconcile after applying their batch. Both call this same
 * function so their saved state cannot drift apart.
 *
 * @module JS API: shared cluster state
 */

const queryAttribute = require('../db/query-attribute.js')
const queryCommand = require('../db/query-command.js')
const queryConfig = require('../db/query-config.js')
const queryEndpoint = require('../db/query-endpoint.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryPackage = require('../db/query-package.js')
const restApi = require('../../src-shared/rest-api.js')
const dbEnum = require('../../src-shared/db-enum.js')
const resolver = require('./resolver.js')

/**
 * The package categories that asked for cluster states to be shared across
 * endpoints, lowercased.
 *
 * This is the same question the user interface asks before it unifies anything:
 * a generator option declared by the templates, which the Zigbee ones set and
 * the Matter ones do not. Reporting it per category is what lets a caller leave
 * the Matter half of a multiprotocol configuration alone.
 *
 * A package with no category still counts, under an empty name, so a data model
 * that declares the option without naming itself is not silently ignored.
 *
 * @param {*} db
 * @param {number} sessionId
 * @returns {Promise<string[]>} category names that share cluster states
 */
async function sharingCategories(db, sessionId) {
  let pairs = await queryPackage.getPackageSessionPackagePairBySessionId(
    db,
    sessionId
  )
  let categories = new Set()
  for (const pair of pairs) {
    let options = await queryPackage.selectAllOptionsValues(
      db,
      pair.pkg.id,
      dbEnum.packageOptionCategory.generator
    )
    let shares = options.some(
      (option) =>
        option.optionCode ===
          dbEnum.generatorOptions.shareClusterStatesAcrossEndpoints &&
        `${option.optionLabel}` === 'true'
    )
    if (shares) {
      categories.add(`${pair.pkg.category || ''}`.toLowerCase())
    }
  }
  return [...categories]
}

/**
 * Whether anything in this session wants cluster states shared across
 * endpoints.
 *
 * @param {*} db
 * @param {number} sessionId
 * @returns {Promise<boolean>} whether sharing applies
 */
async function isSharingEnabled(db, sessionId) {
  return (await sharingCategories(db, sessionId)).length > 0
}

/**
 * Aligns the attribute and command states of every cluster that more than one
 * of the given endpoint types enables.
 *
 * @param {*} db
 * @param {number[]} endpointTypeIdList Endpoint types to align with each other.
 * @param {number[]} packageIds ZCL packages in scope.
 * @returns {Promise<*>} `{ sharedClusterList, sharedAttributeDefaults }`
 */
async function shareClusterStatesAcrossEndpoints(
  db,
  endpointTypeIdList,
  packageIds
) {
  // Only a cluster that more than one endpoint enables has anything to share.
  let sharedClusterList = await queryEndpointType
    .selectAllClustersDetailsFromEndpointTypes(
      db,
      endpointTypeIdList.map((id) => ({ endpointTypeId: id }))
    )
    .then((list) => list.filter((entry) => entry.endpointCount > 1))

  let attrDefaults = await attributeDefaults(
    db,
    endpointTypeIdList,
    sharedClusterList,
    packageIds
  )
  await writeAttributeDefaults(db, attrDefaults)

  let cmdDefaults = await commandDefaults(
    db,
    endpointTypeIdList,
    sharedClusterList,
    packageIds
  )
  await writeCommandDefaults(db, cmdDefaults)

  return {
    sharedClusterList: sharedClusterList,
    sharedAttributeDefaults: attrDefaults
  }
}

/**
 * Get shared command defaults across endpoints.
 *
 * @param {*} db
 * @param {*} endpointTypeIdList
 * @param {*} sharedClusterList
 * @param {*} packageIds
 * @returns {Promise<*>} sharedCmdDefaults
 */
async function commandDefaults(
  db,
  endpointTypeIdList,
  sharedClusterList,
  packageIds
) {
  let sharedCmdDefaults = {}
  let clusCmdToCmdObj = {}
  let sharedCommandList =
    await queryCommand.selectAllCommandDetailsFromEnabledClusters(
      db,
      sharedClusterList.map((c) => {
        return { endpointTypeClusterRef: c.endpointClusterId }
      }),
      packageIds
    )

  for (const endpointTypeId of endpointTypeIdList) {
    for (const sharedCmd of sharedCommandList) {
      let clusCmdKey = JSON.stringify({
        clusterId: sharedCmd.clusterId,
        clusterSide: sharedCmd.clusterSide,
        id: sharedCmd.id, // command id
        code: sharedCmd.code,
        mfgCode: sharedCmd.mfgCode
      })

      if (!(endpointTypeId in sharedCmdDefaults)) {
        sharedCmdDefaults[endpointTypeId] = []
      }

      if (clusCmdKey in clusCmdToCmdObj) {
        sharedCmdDefaults[endpointTypeId].push(clusCmdToCmdObj[clusCmdKey])
      } else {
        let cmds = await queryEndpoint.selectEndpointClusterCommands(
          db,
          sharedCmd.clusterId,
          endpointTypeId
        )

        // find attr
        let matched = cmds.filter((cmd) => commandEquals(cmd, sharedCmd))
        if (matched.length) {
          let m = matched.shift()

          sharedCmdDefaults[endpointTypeId].push(m)
          clusCmdToCmdObj[clusCmdKey] = m
        }
      }
    }
  }
  return sharedCmdDefaults
}

/**
 * Insert command defaults into the database.
 *
 * @param {*} db
 * @param {*} defaults
 * @returns {Promise} promise of written command states
 */
async function writeCommandDefaults(db, defaults) {
  let promises = []
  for (const [endpointTypeId, commandList] of Object.entries(defaults)) {
    for (const cmd of commandList) {
      promises.push(
        queryConfig.insertOrUpdateCommandState(
          db,
          endpointTypeId,
          cmd.clusterId,
          cmd.source,
          cmd.id,
          cmd.isIncoming,
          true
        )
      )

      promises.push(
        queryConfig.insertOrUpdateCommandState(
          db,
          endpointTypeId,
          cmd.clusterId,
          cmd.source,
          cmd.id,
          cmd.isOutgoing,
          false
        )
      )
    }
  }
  await Promise.all(promises)
}

/**
 * Shared attribute defaults across endpoints.
 *
 * @param {*} db
 * @param {*} endpointTypeIdList
 * @param {*} sharedClusterList
 * @param {*} packageIds
 * @returns {Promise<*>} sharedAttributeDefaults
 */
async function attributeDefaults(
  db,
  endpointTypeIdList,
  sharedClusterList,
  packageIds
) {
  let sharedAttributeDefaults = {}
  let clusterIdnSideToAttrCache = {}
  let sharedAttributeList =
    await queryAttribute.selectAttributeDetailsFromEnabledClusters(
      db,
      sharedClusterList,
      packageIds
    )

  for (const endpointTypeId of endpointTypeIdList) {
    for (const sharedAttr of sharedAttributeList) {
      let clusAttrCacheKey = JSON.stringify({
        clusterId: sharedAttr.clusterId,
        side: sharedAttr.side,
        id: sharedAttr.id, // attr id
        code: sharedAttr.code,
        name: sharedAttr.name,
        type: sharedAttr.type,
        mfgCode: sharedAttr.mfgCode,
        define: sharedAttr.define
      })

      if (clusAttrCacheKey in clusterIdnSideToAttrCache) {
        !(endpointTypeId in sharedAttributeDefaults) &&
          (sharedAttributeDefaults[endpointTypeId] = [])
        sharedAttributeDefaults[endpointTypeId].push(
          clusterIdnSideToAttrCache[clusAttrCacheKey]
        )
      } else {
        let attributes = await queryEndpoint.selectEndpointClusterAttributes(
          db,
          sharedAttr.clusterId,
          sharedAttr.side,
          endpointTypeId
        )

        // find attr
        let matched = attributes.filter((attr) =>
          attributeEquals(attr, sharedAttr)
        )
        if (matched.length) {
          let m = matched.shift()

          !(endpointTypeId in sharedAttributeDefaults) &&
            (sharedAttributeDefaults[endpointTypeId] = [])
          sharedAttributeDefaults[endpointTypeId].push(m)
          clusterIdnSideToAttrCache[clusAttrCacheKey] = m
        }
      }
    }
  }
  return sharedAttributeDefaults
}

/**
 * Write attribute defaults.
 *
 * @param {*} db
 * @param {*} defaults
 * @returns {Promise} promise of written attribute states
 */
async function writeAttributeDefaults(db, defaults) {
  let promises = []
  for (const [endpointTypeId, attributeList] of Object.entries(defaults)) {
    for (const attr of attributeList) {
      promises.push(
        queryConfig.insertOrUpdateAttributeState(
          db,
          endpointTypeId,
          attr.clusterId,
          attr.side,
          attr.id,
          [
            {
              key: restApi.updateKey.attributeSelected,
              value: attr.isIncluded
            },
            // Storage and default are text columns, and saying so is what gets
            // them quoted. Without it a default such as a manufacturer name
            // arrives as bare SQL and the statement does not parse.
            {
              key: restApi.updateKey.attributeStorage,
              value: attr.storage,
              type: 'text'
            },
            {
              key: restApi.updateKey.attributeSingleton,
              value: attr.isSingleton
            },
            {
              key: restApi.updateKey.attributeBounded,
              value: attr.isBound,
              type: ''
            },
            {
              key: restApi.updateKey.attributeDefault,
              value: attr.defaultValue,
              type: 'text'
            },
            {
              key: restApi.updateKey.attributeReporting,
              value: attr.includedReportable
            }
          ],
          attr.min,
          attr.max,
          attr.reportableChange
        )
      )
    }
  }

  await Promise.all(promises)
}

/**
 * Compares 2 commands for equality.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean} whether the two describe the same command
 */
function commandEquals(a, b) {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.code === b.code &&
    a.source === b.source &&
    a.manufacturerCode === b.mfgCode
  )
}

/**
 * Compares 2 attributes for equality.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean} whether the two describe the same attribute
 */
function attributeEquals(a, b) {
  return (
    a.id === b.id &&
    a.code === b.code &&
    a.name === b.name &&
    a.side === b.side &&
    a.type === b.type &&
    a.manufacturerCode === b.mfgCode &&
    a.define === b.define
  )
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
  let sharing = (await sharingCategories(ctx.db, ctx.sessionId)).filter(
    (c) => c !== ''
  )
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

  let unified = await shareClusterStatesAcrossEndpoints(
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

exports.isSharingEnabled = isSharingEnabled
exports.sharingCategories = sharingCategories
exports.shareClusterStatesAcrossEndpoints = shareClusterStatesAcrossEndpoints
exports.unifySharedClusterStates = unifySharedClusterStates
