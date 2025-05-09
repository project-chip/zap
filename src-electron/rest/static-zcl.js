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

const queryZcl = require('../db/query-zcl')
const queryDeviceType = require('../db/query-device-type')
const queryCommand = require('../db/query-command')
const queryEvent = require('../db/query-event')
const queryFeature = require('../db/query-feature')
const queryPackage = require('../db/query-package')
const dbEnum = require('../../src-shared/db-enum')
const restApi = require('../../src-shared/rest-api')
const util = require('../util/util')
const env = require('../util/env')
const { StatusCodes } = require('http-status-codes')
const queryNotification = require('../db/query-session-notification.js')

/**
 * This function builds a function that has the following skeleton.
 * This is used to simplify all the logic where we have selectAll and selectById for
 * each of the different ZCL entities.
 *
 * @param {*} selectAllFunction
 * @param {*} selectByIdFunction
 * @returns a certain function based on given arguments to them.
 */
function zclEntityQuery(selectAllFunction, selectByIdFunction) {
  return (db, id, packageId = null) => {
    if (id == 'all') {
      return selectAllFunction(db, packageId)
    } else {
      return selectByIdFunction(db, id, packageId)
    }
  }
}

/**
 * For the CLUSTER path, we have special handling to also sideload attributes, commands, events, and features relevant to that cluster.
 *
 * @param {*} db
 * @param {*} clusterId
 * @param {*} packageId
 * @returns zcl entities
 */
async function returnZclEntitiesForClusterId(db, clusterId, packageId) {
  let clusterData = await zclEntityQuery(
    queryZcl.selectAllClusters,
    queryZcl.selectClusterById
  )(db, clusterId, packageId)

  let attributeData = await zclEntityQuery(
    queryZcl.selectAllAttributes,
    queryZcl.selectAttributesByClusterIdIncludingGlobal
  )(db, clusterId, [packageId])

  let commandData = await zclEntityQuery(
    queryCommand.selectAllCommands,
    queryCommand.selectCommandsByClusterId
  )(db, clusterId, packageId)

  let eventData = await zclEntityQuery(
    queryEvent.selectAllEvents,
    queryEvent.selectEventsByClusterId
  )(db, clusterId, packageId)

  let featureData = await zclEntityQuery(
    queryFeature.selectAllFeatures,
    queryFeature.selectFeaturesByClusterId
  )(db, clusterId, packageId)

  return {
    clusterData,
    attributeData,
    commandData,
    eventData,
    featureData
  }
}

/**
 * This is the special merge function used for the CLUSTER path
 *
 * @param {*} accumulated
 * @param {*} currentValue
 * @returns ZCL entity details object
 */
function mergeZclClusterAttributeCommandEventFeatureData(
  accumulated,
  currentValue
) {
  return {
    clusterData: [accumulated.clusterData, currentValue.clusterData].flat(1),
    commandData: [accumulated.commandData, currentValue.commandData].flat(1),
    attributeData: [accumulated.attributeData, currentValue.attributeData].flat(
      1
    ),
    eventData: [accumulated.eventData, currentValue.eventData].flat(1),
    featureData: [accumulated.featureData, currentValue.featureData].flat(1)
  }
}

/**
 * This maps over each packageId, and runs the query callback.
 * @param {*} db
 * @param {*} id
 * @param {*} packageIdArray
 * @param {*} zclQueryCallback
 * @param {*} mergeFunction
 * @param {*} defaultValue
 * @returns zcl entities
 */
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
  let dataArray = packageIdArray.map((packageId) =>
    zclQueryCallback(db, id, packageId)
  )
  return Promise.all(dataArray).then((x) =>
    x.reduce(mergeFunction, defaultValue)
  )
}

/**
 * Get entity details based on given information.
 *
 * @param {*} db
 * @param {*} entity
 * @param {*} id
 * @param {*} packageIdArray
 * @returns Promise of entity details
 */
async function parseForZclData(db, entity, id, packageIdArray) {
  // Retrieve all the standalone custom xml packages
  let packageData = await queryPackage.getPackagesByPackageIds(
    db,
    packageIdArray
  )
  let standalonePackages = packageData.filter(
    (pd) => pd.type === dbEnum.packageType.zclXmlStandalone
  )
  let standAlonePackageIds = standalonePackages.map((sp) => sp.id)

  switch (entity) {
    case 'atomics':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllAtomics, queryZcl.selectAtomicById)
      )
    case 'cluster':
      // Making sure that global attributes are being collected from packages
      // related to the cluster package when querying by clusterId.
      // eg: do not need matter global attributes for a zigbee cluster
      return queryZcl
        .selectClusterById(db, id)
        .then((clusterInfo) =>
          id == 'all'
            ? reduceAndConcatenateZclEntity(
                db,
                id,
                packageIdArray,
                returnZclEntitiesForClusterId,
                mergeZclClusterAttributeCommandEventFeatureData,
                {
                  clusterData: [],
                  attributeData: [],
                  commandData: [],
                  eventData: [],
                  featureData: []
                }
              )
            : reduceAndConcatenateZclEntity(
                db,
                id,
                standAlonePackageIds.includes(clusterInfo.packageRef) // Use packageId array if cluster belongs to standalone xml(custom cluster) else use just the package from the cluster.
                  ? packageIdArray
                  : [...standAlonePackageIds, clusterInfo.packageRef], // Taking cluster package and custom xml into account. Using a set since a cluster may sometimes be a custom one as well thus duplicating this array.
                returnZclEntitiesForClusterId,
                mergeZclClusterAttributeCommandEventFeatureData,
                {
                  clusterData: [],
                  attributeData: [],
                  commandData: [],
                  eventData: [],
                  featureData: []
                }
              )
        )
        .then((data) => {
          return {
            clusterData: data.clusterData,
            attributeData: data.attributeData,
            commandData: data.commandData,
            eventData: data.eventData,
            featureData: data.featureData
          }
        })
    case 'domain':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllDomains, queryZcl.selectDomainById)
      )
    case 'bitmap':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllBitmaps, queryZcl.selectBitmapById)
      )
    case 'enum':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllEnums, queryZcl.selectEnumById)
      )
    case 'struct':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(queryZcl.selectAllStructsWithItemCount, [
          queryZcl.selectStructById
        ])
      )
    case 'deviceType':
      return reduceAndConcatenateZclEntity(
        db,
        id,
        packageIdArray,
        zclEntityQuery(
          queryDeviceType.selectAllDeviceTypes,
          queryDeviceType.selectDeviceTypeById
        )
      )
    case 'endpointTypeClusters':
      return queryZcl.selectEndpointTypeClustersByEndpointTypeId(db, id)
    case 'endpointTypeAttributes':
      return queryZcl.selectEndpointTypeAttributesByEndpointId(db, id)
    case 'endpointTypeCommands':
      return queryZcl.selectEndpointTypeCommandsByEndpointId(db, id)
    case 'endpointTypeEvents':
      return queryZcl.selectEndpointTypeEventsByEndpointId(db, id)
    case `deviceTypeClusters`:
      return queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(db, id)
    case `deviceTypeAttributes`:
      return queryDeviceType.selectDeviceTypeAttributesByDeviceTypeRef(db, id)
    case `deviceTypeCommands`:
      return queryDeviceType.selectDeviceTypeCommandsByDeviceTypeRef(db, id)
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
  return async (request, response) => {
    const { id, entity } = request.params
    let sessionId = request.zapSessionId

    let packageIdArray = await queryPackage.getSessionZclPackageIds(
      db,
      sessionId
    )
    let resultData = await parseForZclData(db, entity, id, packageIdArray)
    response.status(StatusCodes.OK).json(resultData)
  }
}
/**
 * API: /zclExtension/:entity/:extension
 *
 * @param {*} db
 * @returns zcl extension handler
 */
function httpGetZclExtension(db) {
  return (request, response) => {
    const { entity, extensionId } = request.params
    let sessionId = request.zapSessionId
    if (!sessionId) {
      let err = 'Unable to retrieve zcl extension. Invalid sessionId!'
      env.logError(err)
      queryNotification.setNotification(db, 'ERROR', err, sessionId, 1, 0)
      return response.status(StatusCodes.NOT_FOUND).send(err)
    }

    // enable components
    queryPackage
      .getSessionPackagesByType(
        db,
        sessionId,
        dbEnum.packageType.genTemplatesJson
      )
      .then((pkgs) => (pkgs.length == 0 ? null : pkgs[0].id))
      .then((packageId) => {
        if (!packageId) {
          throw new Error('Unable to retrieve valid packageId!')
        }
        return queryPackage.selectPackageExtension(db, packageId, entity)
      })
      .then((exts) => {
        let clusterExt = util.getClusterExtension(exts, extensionId)
        if (clusterExt.length) {
          return response.status(StatusCodes.OK).json(clusterExt[0])
        } else {
          throw new Error(`Unable to find cluster extension by ${extensionId}.`)
        }
      })
      .catch((err) => {
        env.logError(err)
        queryNotification.setNotification(db, 'ERROR', err, sessionId, 1, 0)
        return response.status(StatusCodes.NOT_FOUND).send(err)
      })
  }
}

exports.get = [
  {
    uri: restApi.uri.zclEntity,
    callback: httpGetZclEntity
  },
  {
    uri: restApi.uri.zclExtension,
    callback: httpGetZclExtension
  }
]
