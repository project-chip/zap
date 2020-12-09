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

const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')

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

function parseForZclData(db, entity, id, packageIdArray) {
  switch (entity) {
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
          type: 'cluster',
        }
      })
    case 'domain':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllDomains, queryZcl.selectDomainById)
      ).then((data) => {
        return { data: data, type: 'domain' }
      })
    case 'bitmap':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllBitmaps, queryZcl.selectBitmapById)
      ).then((x) => {
        return { data: x, type: 'bitmap' }
      })
    case 'enum':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllEnums, queryZcl.selectEnumById)
      ).then((x) => {
        return { data: x, type: 'enum' }
      })
    case 'struct':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllStructs, queryZcl.selectStructById)
      ).then((x) => {
        return { data: x, type: 'struct' }
      })
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
        return { data: x, type: 'device_type' }
      })
    case 'endpointTypeClusters':
      return queryZcl
        .selectEndpointTypeClustersByEndpointTypeId(db, id)
        .then((x) => {
          return { data: x, type: `endpointTypeClusters` }
        })
    case 'endpointTypeAttributes':
      return queryZcl
        .selectEndpointTypeAttributesByEndpointId(db, id)
        .then((x) => {
          return { data: x, type: `endpointTypeAttributes` }
        })
    case 'endpointTypeCommands':
      return queryZcl
        .selectEndpointTypeCommandsByEndpointId(db, id)
        .then((x) => {
          return { data: x, type: `endpointTypeCommands` }
        })
    case `endpointTypeDeviceTypeClusters`:
      return queryZcl
        .selectDeviceTypeClustersByDeviceTypeRef(db, id)
        .then((x) => {
          return { data: x, type: `deviceTypeClusters` }
        })
    case `endpointTypeDeviceTypeAttributes`:
      return queryZcl
        .selectDeviceTypeAttributesByDeviceTypeRef(db, id)
        .then((x) => {
          return { data: x, type: `deviceTypeAttributes` }
        })
    case `endpointTypeDeviceTypeCommands`:
      return queryZcl
        .selectDeviceTypeCommandsByDeviceTypeRef(db, id)
        .then((x) => {
          return { data: x, type: `deviceTypeCommands` }
        })
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

function httpGetZclEntity(db) {
  return (request, response) => {
    const { id, entity } = request.params
    var sessionId = request.session.zapSessionId

    queryPackage
      .getSessionZclPackages(db, sessionId)
      .then((packageArray) =>
        parseForZclData(
          db,
          entity,
          id,
          packageArray.map((pkg) => pkg.packageRef)
        )
      )
      .then((resultData) => response.json(resultData))
  }
}

exports.get = [
  {
    uri: restApi.uri.zclEntity,
    callback: httpGetZclEntity,
  },
]
