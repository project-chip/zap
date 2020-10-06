/**
 *
 *    Copyright (c) 2020 Silicon Labs
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
 * This module provides the REST API to the static zcl queries.
 *
 * @module REST API: static zcl functions
 */

const httpServer = require('../server/http-server.js')

const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')
const dbMapping = require('../db/db-mapping.js')

const itemList = 'zcl-item-list'
const singleItem = 'zcl-item'
const restApi = require('../../src-shared/rest-api.js')

// This function builds a function that has the following skeleton.
// This is used to simplify all the logic where we have selectAll and selectById for
// each of the different ZCL entities.
function zclEntityQuery(selectAllFunction, selectByIdFunction) {
  return (db, id, packageId = null) => {
    if (id == 'all') {
      return selectAllFunction(db, packageId)
    } else {
      return selectByIdFunction(db, id, packageId)
    }
  }
}

// For the CLUSTER path, we have special handling to also sideload attributes and commands relevant to that cluster.
function returnZclEntitiesForClusterId(db, clusterId, packageId) {
  return zclEntityQuery(queryZcl.selectAllClusters, queryZcl.selectClusterById)(
    db,
    clusterId,
    packageId
  ).then((x) =>
    zclEntityQuery(
      queryZcl.selectAllAttributes,
      queryZcl.selectAttributesByClusterId
    )(db, clusterId, packageId).then((y) =>
      zclEntityQuery(
        queryZcl.selectAllCommands,
        queryZcl.selectCommandsByClusterId
      )(db, clusterId, packageId).then((z) => {
        return { clusterData: x, attributeData: y, commandData: z }
      })
    )
  )
}

// This is the special merge function used for the CLUSTER path
function mergeZclClusterAttributeCommandData(accumulated, currentValue) {
  return {
    clusterData: [accumulated.clusterData, currentValue.clusterData].flat(1),
    commandData: [accumulated.commandData, currentValue.commandData].flat(1),
    attributeData: [accumulated.attributeData, currentValue.attributeData].flat(
      1
    ),
  }
}
//This maps over each packageId, and runs the query callback.
function reduceAndConcatenateZclEntity(
  db,
  id,
  packageIdArray,
  zclQueryCallback,
  mergeFunction = (accumulated, currentValue) => {
    return [accumulated, currentValue].flat(1)
  },
  defaultValue = []
) {
  var dataArray = packageIdArray.map((packageId) =>
    zclQueryCallback(db, id, packageId)
  )
  return Promise.all(dataArray).then((x) =>
    x.reduce(mergeFunction, defaultValue)
  )
}

function parseForZclData(db, path, id, packageIdArray) {
  switch (path) {
    case 'cluster':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        returnZclEntitiesForClusterId,
        mergeZclClusterAttributeCommandData,
        { clusterData: [], attributeData: [], commandData: [] }
      ).then((data) => {
        return {
          data: data.clusterData,
          attributeData: data.attributeData,
          commandData: data.commandData,
          title: `Cluster: ${id}`,
          type: 'cluster',
        }
      })
      break
    case 'domain':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllDomains, queryZcl.selectDomainById)
      ).then((data) => {
        return { data: data, title: `Domain: ${id}`, type: 'domain' }
      })
      break
    case 'bitmap':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllBitmaps, queryZcl.selectBitmapById)
      ).then((x) => {
        return { data: x, title: `Bitmap: ${id}`, type: 'bitmap' }
      })
      break
    case 'enum':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllEnums, queryZcl.selectEnumById)
      ).then((x) => {
        return { data: x, title: `Enum: ${id}`, type: 'enum' }
      })
      break
    case 'struct':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllStructs, queryZcl.selectStructById)
      ).then((x) => {
        return { data: x, title: `Struct: ${id}`, type: 'struct' }
      })
      break
    case 'deviceType':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(
          queryZcl.selectAllDeviceTypes,
          queryZcl.selectDeviceTypeById
        )
      ).then((x) => {
        return {
          data: x,
          title: `Device type: ${id}`,
          type: 'device_type',
        }
      })
      break
    case 'endpointTypeClusters':
      return queryZcl
        .selectEndpointTypeClustersByEndpointTypeId(db, id)
        .then((x) => {
          return { data: x, type: `endpointTypeClusters` }
        })
      break
    case 'endpointTypeAttributes':
      return queryZcl
        .selectEndpointTypeAttributesByEndpointId(db, id)
        .then((x) => {
          return { data: x, type: `endpointTypeAttributes` }
        })
      break
    case 'endpointTypeCommands':
      return queryZcl
        .selectEndpointTypeCommandsByEndpointId(db, id)
        .then((x) => {
          return { data: x, type: `endpointTypeCommands` }
        })
      break
    case `endpointTypeDeviceTypeClusters`:
      return queryZcl
        .selectDeviceTypeClustersByDeviceTypeRef(db, id)
        .then((x) => {
          return { data: x, type: `deviceTypeClusters` }
        })
      break
    case `endpointTypeDeviceTypeAttributes`:
      return queryZcl
        .selectDeviceTypeAttributesByDeviceTypeRef(db, id)
        .then((x) => {
          return { data: x, type: `deviceTypeAttributes` }
        })
      break
    case `endpointTypeDeviceTypeCommands`:
      return queryZcl
        .selectDeviceTypeCommandsByDeviceTypeRef(db, id)
        .then((x) => {
          return { data: x, type: `deviceTypeCommands` }
        })
      break
    default:
      return { type: 'Unknown' }
  }
}

/**
 * API: /zcl/:entity/:id
 *
 * @export
 * @param {*} app Express instance.
 */
function registerStaticZclApi(db, app) {
  app.get('/zcl/:entity/:id', (request, response) => {
    const { id, entity } = request.params
    var sessionId = request.session.zapSessionId

    var replyId = id === 'all' ? itemList : singleItem
    queryPackage
      .getSessionPackageIds(db, sessionId)
      .then((packageIdArray) => {
        return parseForZclData(db, entity, id, packageIdArray)
      })
      .then((finalData) => {
        finalData.replyId = replyId
        response.status(restApi.httpCode.ok).json(finalData)
      })
  })
}

exports.registerStaticZclApi = registerStaticZclApi
