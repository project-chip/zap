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
 * The GUI reaches this over `/shareClusterStatesAcrossEndpoints`; the command
 * line calls it directly. Both go through the same functions so the two cannot
 * drift apart.
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
            { key: restApi.updateKey.attributeSelected, value: 1 },
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

exports.isSharingEnabled = isSharingEnabled
exports.sharingCategories = sharingCategories
exports.shareClusterStatesAcrossEndpoints = shareClusterStatesAcrossEndpoints
