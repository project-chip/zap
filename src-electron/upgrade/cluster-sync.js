/**
 *
 *    Copyright (c) 2023 Silicon Labs
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

const queryAttribute = require('../db/query-attribute.js')
const queryCommand = require('../db/query-command.js')
const queryConfig = require('../db/query-config.js')
const queryEndpoint = require('../db/query-endpoint.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')
const fs = require('fs')
const fsp = fs.promises
const restApi = require('../../src-shared/rest-api.js')

/**
 *  This file syncs the values of cluster attributes across multiple endpoints in headless generation mode.
 *  It specifically covers the use case where user manually edits .zap files and causing shared attribues across
 *  different endpoints to have different values / out of sync. It can potentially cause a project to hit segmentation
 *  fault during runtime.
 *
 */

async function clusterSync(db, sessionId, endpointTypeIdList) {
  let packages = await queryPackage.getSessionPackagesByType(
    db,
    sessionId,
    dbEnum.packageType.zclProperties
  )
  let packageIds = packages.map((x) => x.id)

  // Get a list of clusters enabled by multiple (>1) endpoints
  let sharedClusterList = await queryEndpointType
    .selectAllClustersDetailsFromEndpointTypes(
      db,
      endpointTypeIdList.map((id) => {
        return { endpointTypeId: id }
      })
    )
    .then((list) => list.filter((entry) => entry.endpointCount > 1))

  let sharedAttributeDefaultList = await attributeDefaults(
    db,
    endpointTypeIdList,
    sharedClusterList,
    packageIds
  )
  await writeAttributeDefaults(db, sharedAttributeDefaultList)

  let sharedCommandDefaultList = await commandDefaults(
    db,
    endpointTypeIdList,
    sharedClusterList,
    packageIds
  )
  await writeCommandDefaults(db, sharedCommandDefaultList)

  return {
    sharedClusterList,
    sharedAttributeDefaultList,
    sharedCommandDefaultList,
  }
}

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
        define: sharedAttr.define,
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
            {
              key: restApi.updateKey.attributeStorage,
              value: `"${attr.storage}"`,
            },
            {
              key: restApi.updateKey.attributeSingleton,
              value: attr.isSingleton,
            },
            {
              key: restApi.updateKey.attributeBounded,
              value: attr.isBounded,
            },
            {
              key: restApi.updateKey.attributeDefault,
              value: attr.defaultValue,
            },
            {
              key: restApi.updateKey.attributeReporting,
              value: attr.includedReportable,
            },
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
        mfgCode: sharedCmd.mfgCode,
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

function commandEquals(a, b) {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.code === b.code &&
    a.source === b.source &&
    a.manufacturerCode === b.mfgCode
  )
}

exports.clusterSync = clusterSync
