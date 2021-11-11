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
 * This module provides the REST API to the user specific data.
 *
 * @module REST API: user data
 */

const env = require('../util/env')
const queryZcl = require('../db/query-zcl.js')
const queryAttribute = require('../db/query-attribute.js')
const queryConfig = require('../db/query-config.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryEndpoint = require('../db/query-endpoint.js')
const querySession = require('../db/query-session.js')
const queryPackage = require('../db/query-package.js')
const asyncValidation = require('../validation/async-validation.js')
const validation = require('../validation/validation.js')
const restApi = require('../../src-shared/rest-api.js')
const zclLoader = require('../zcl/zcl-loader.js')
const dbEnum = require('../../src-shared/db-enum.js')
const { StatusCodes } = require('http-status-codes')

/**
 * HTTP GET: session key values
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetSessionKeyValues(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let sessionKeyValues = await querySession.getAllSessionKeyValues(
      db,
      sessionId
    )
    response.status(StatusCodes.OK).json(sessionKeyValues)
  }
}

/**
 * HTTP POST: save session key value
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostSaveSessionKeyValue(db) {
  return async (request, response) => {
    let { key, value } = request.body
    let sessionId = request.zapSessionId
    env.logDebug(`[${sessionId}]: Saving: ${key} => ${value}`)
    await querySession.updateSessionKeyValue(db, sessionId, key, value)
    response.status(StatusCodes.OK).json({
      key: key,
      value: value,
    })
  }
}

/**
 * HTTP POST: cluster
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCluster(db) {
  return (request, response) => {
    let { id, side, flag, endpointTypeIdList } = request.body
    let sessionId = request.zapSessionId
    let packageId

    queryPackage
      .getSessionPackagesByType(db, sessionId, dbEnum.packageType.zclProperties)
      .then((pkgs) => {
        packageId = pkgs[0].id
      })
      .then(() => {
        if (endpointTypeIdList.length == 0) {
          throw new Error('Invalid function parameter: endpointTypeIdList')
        }
        return Promise.all(
          endpointTypeIdList.map((endpointTypeId) =>
            queryConfig.selectClusterState(db, endpointTypeId, id, side)
          )
        )
      })
      .then((states) => {
        console.log('states: ' + JSON.stringify(states))
        if (states.length == 0) {
          return true
        } else {
          return false
        }
      })
      .then((insertDefaults) => {
        return Promise.all(
          endpointTypeIdList.map((endpointTypeId) =>
            queryConfig
              .insertOrReplaceClusterState(db, endpointTypeId, id, side, flag)
              .then(() => {
                if (insertDefaults) {
                  return queryConfig.insertClusterDefaults(
                    db,
                    endpointTypeId,
                    packageId,
                    {
                      clusterRef: id,
                      side: side,
                    }
                  )
                } else {
                  return Promise.resolve()
                }
              })
          )
        ).then(() =>
          response
            .json({
              endpointTypeIdList: endpointTypeIdList,
              id: id,
              side: side,
              flag: flag,
            })
            .status(StatusCodes.OK)
            .send()
        )
      })
      .catch((err) => {
        response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err)
      })
  }
}
/**
 * HTTP POST attribute update
 *
 * @param {*} db
 * @returns callback for the express uri registration */
function httpPostAttributeUpdate(db) {
  return async (request, response) => {
    let {
      action,
      endpointTypeIdList,
      id,
      value,
      listType,
      clusterRef,
      attributeSide,
      reportMinInterval,
      reportMaxInterval,
      reportableChange,
    } = request.body

    if (!Array.isArray(endpointTypeIdList) || !endpointTypeIdList.length) {
      response.status(StatusCodes.BAD_REQUEST).json()
    }

    let paramType
    switch (listType) {
      case restApi.updateKey.attributeStorage:
      case restApi.updateKey.attributeDefault:
        paramType = 'text'
        break
      default:
        paramType = ''
        break
    }
    let paramArray =
      listType == restApi.updateKey.init
        ? null
        : [{ key: listType, value: value, type: paramType }]

    // all endpoints
    await Promise.all(
      endpointTypeIdList.map((endpointTypeId) =>
        queryConfig.insertOrUpdateAttributeState(
          db,
          endpointTypeId,
          clusterRef,
          attributeSide,
          id,
          paramArray,
          reportMinInterval,
          reportMaxInterval,
          reportableChange
        )
      )
    )

    // send latest value to frontend to update UI
    let eptAttr = queryZcl.selectEndpointTypeAttribute(
      db,
      endpointTypeIdList[0],
      id,
      clusterRef
    )

    // only return 1 validation result.
    // error isn't endpoint specific.
    // endpointTypeId doesn't matter since all attributes are the seame.
    let validationData = await validation.validateAttribute(
      db,
      endpointTypeIdList[0],
      id,
      clusterRef
    )

    response.status(StatusCodes.OK).json({
      action: action,
      endpointTypeIdList: endpointTypeIdList,
      clusterRef: clusterRef,
      id: id,
      added: value,
      listType: listType,
      validationIssues: validationData,
      endpointTypeAttributeData: eptAttr,
    })
  }
}

/**
 * HTTP POST: command update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCommandUpdate(db) {
  return async (request, response) => {
    let {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      commandSide,
    } = request.body
    let isIncoming = null

    switch (listType) {
      case 'selectedIn':
        isIncoming = true
        break
      case 'selectedOut':
        isIncoming = false
        break
      default:
        break
    }
    await queryConfig.insertOrUpdateCommandState(
      db,
      endpointTypeId,
      clusterRef,
      commandSide,
      id,
      value,
      isIncoming
    )
    response.status(StatusCodes.OK).json({
      action: action,
      endpointTypeId: endpointTypeId,
      id: id,
      added: value,
      listType: listType,
      side: commandSide,
      clusterRef: clusterRef,
    })
  }
}

/**
 * HTTP POST: command update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostEventUpdate(db) {
  return async (request, response) => {
    let { action, endpointTypeId, id, value, listType, clusterRef, eventSide } =
      request.body
    await queryConfig.insertOrUpdateEventState(
      db,
      endpointTypeId,
      clusterRef,
      eventSide,
      id,
      value
    )

    response.status(StatusCodes.OK).json({
      action: action,
      endpointTypeId: endpointTypeId,
      id: id,
      added: value,
      listType: listType,
      side: eventSide,
      clusterRef: clusterRef,
    })
  }
}

/**
 * HTTP GET: initial state
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetInitialState(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let state = {}

    let session = await querySession.getSessionFromSessionId(db, sessionId)
    asyncValidation.initAsyncValidation(db, session)

    let results = await Promise.all([
      queryEndpointType.selectAllEndpointTypes(db, sessionId),
      queryEndpoint.selectAllEndpoints(db, sessionId),
      querySession.getAllSessionKeyValues(db, sessionId),
    ])

    state.endpointTypes = results[0]
    state.endpoints = results[1]
    state.sessionKeyValues = results[2]

    response.status(StatusCodes.OK).json(state)
  }
}

/**
 * HTTP GET: option
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetOption(db) {
  return async (request, response) => {
    const { category } = request.params
    let sessionId = request.zapSessionId
    let packages = await queryPackage.getSessionPackages(db, sessionId)
    let p = packages.map((pkg) =>
      queryPackage.selectAllOptionsValues(db, pkg.packageRef, category)
    )
    let data = await Promise.all(p)
    data = data.flat(1)
    response.status(StatusCodes.OK).json(data)
  }
}

/**
 * HTTP GET: Project packages
 */
function httpGetPackages(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let packageSessionPackagePairs =
      await queryPackage.getPackageSessionPackagePairBySessionId(db, sessionId)
    response.status(StatusCodes.OK).json(packageSessionPackagePairs)
  }
}

/**
 * HTTP POST: Add new project package
 */
function httpPostAddNewPackage(db) {
  return async (req, res) => {
    let sessionId = req.zapSessionId
    let filePath = req.body.path
    try {
      let data = await zclLoader.loadIndividualFile(db, filePath, sessionId)
      let status
      if (data.err) {
        status = {
          isValid: false,
          err: data.err.message,
        }
      } else {
        await queryPackage.insertSessionPackage(
          db,
          sessionId,
          data.packageId,
          false
        )
        status = {
          isValid: true,
          sessionId: sessionId,
        }
      }
      res.status(StatusCodes.OK).json(status)
    } catch (err) {
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err)
    }
  }
}

/**
 * HTTP POST: Unify all Attributes configuration into one presentation.
 *
 * 1) In Zigbee world, the Attribute configuration is a global singleton entity.
 *    To emulate the global singleton entity, this function ensures Attribute changes
 *    are applied to all endpoint specific attribute fields.
 * 2) (native case in ZAP) In Matter, the Attribute configuration are endpoint specific.
 *
 */
function httpPostUnifyAttributesAcrossEndpoints(db) {
  return async (request, response) => {
    let { endpointTypeIdList } = request.body
    let resp = { oldState: {}, newState: {} }

    // let respJson = {oldState: {
    //                            endpointTypeId_1: [{cluster_state_1, cluster_state_2}],
    //                            endpointTypeId_2: [{cluster_state_1, cluster_state_2}],
    //                           },
    //                 newState: {
    //                            endpointTypeId_1: [{cluster_state_1, cluster_state_2}],
    //                            endpointTypeId_2: [{cluster_state_1, cluster_state_2}],
    //                           }}

    if (!Array.isArray(endpointTypeIdList) || !endpointTypeIdList.length) {
      response.status(StatusCodes.BAD_REQUEST).json()
    } else {
      if (endpointTypeIdList.length == 1) {
        return response.status(StatusCodes.OK).json(resp)
      }

      let endpointsAndClusters =
        await queryEndpointType.selectClustersAndEndpointDetailsFromEndpointTypes(
          db,
          endpointTypeIdList.map((x) => {
            return { endpointTypeId: x }
          })
        )

      let unifiedAttributesInfo =
        await queryAttribute.selectAttributeDetailsFromEnabledClusters(
          db,
          endpointsAndClusters
        )
      unifiedAttributesInfo.forEach((entry) => {
        // global attribute do not have cluserRefs field
        // let's fix it up for the attribute update API.
        if (entry.clusterRef == null) {
          entry.clusterRef = entry.clusterId
        }
      })

      let oldEndpointAttributesInfo = await Promise.all(
        endpointsAndClusters.map((endpointsAndCluster) =>
          queryAttribute
            .selectAttributeDetailsFromEnabledClusters(db, [
              endpointsAndCluster,
            ])
            .then((attrDetails) => {
              // global attributes are not tied to specific Clusters
              if (attrDetails.clusterRef == null) {
                queryEndpoint.selectEndpointClusters(db)
              }
            })
        )
      )

      // align all cluster states
      if (endpointTypeIdList.length > 1) {
        endpointTypeIdList.forEach((endpointTypeId) => {
          unifiedAttributesInfo.forEach((attr) =>
            queryConfig.insertOrUpdateAttributeState(
              db,
              endpointTypeId,
              attr.clusterRef,
              attr.side,
              attr.id,
              [
                { key: restApi.updateKey.attributeSelected, value: 1 },
                {
                  key: restApi.updateKey.attributeStorage,
                  value: `"${attr.storageOption}"`,
                },
                {
                  key: restApi.updateKey.attributeSingleton,
                  value: attr.isSingleton,
                },
                {
                  key: restApi.updateKey.attributeBounded,
                  value: attr.isAttributeBounded,
                },
                {
                  key: restApi.updateKey.attributeDefault,
                  value: attr.defaultValue,
                },
                {
                  key: restApi.updateKey.attributeReporting,
                  value: attr.isAttributeReportable,
                },
              ],
              attr.attributeReportableMinValue,
              attr.attributeReportableMaxValue,
              attr.attributeReportableChange
            )
          )
        })
      }

      resp.oldState = []
      endpointTypeIdList.forEach((endpointTypeId, index) => {
        resp.oldState.push({
          endpointTypeId: endpointTypeId,
          attributes: oldEndpointAttributesInfo[index],
        })
      })

      let newEndpointClusterInfos = await Promise.all(
        endpointTypeIdList.map((endpointTypeId) =>
          queryEndpointType.selectAllClustersDetailsFromEndpointTypes(db, [
            { endpointTypeId },
          ])
        )
      ).then((endpointClusterInfos) =>
        // sort by name
        endpointClusterInfos.map((clus) =>
          clus.sort((a, b) => a.name.localeCompare(b.name))
        )
      )

      resp.newState = []
      endpointTypeIdList.forEach((endpointTypeId, index) => {
        resp.newState.push({
          endpointTypeId: endpointTypeId,
          attributes: newEndpointClusterInfos[index],
        })
      })

      response.status(StatusCodes.OK).json(resp)
    }
  }
}

/**
 * HTTP POST: Unify all Clusters configuration into one presentation.
 *
 * 1) In Zigbee world, the Clusters configuration is a global singleton entity.
 *    To emulate the global singleton entity, this function ensures changes 1 cluster
 *    are applied to all endpoint specific cluster fields.
 * 2) (native case in ZAP) In Matter, the Cluster configuration are endpoint specific.
 *
 */
function httpPostUnifyClustersAcrossEndpoints(db) {
  return async (request, response) => {
    let { endpointTypeIdList } = request.body
    let resp = { oldState: {}, newState: {} }

    // let respJson = {oldState: {
    //                            endpointTypeId_1: [{cluster_state_1, cluster_state_2}],
    //                            endpointTypeId_2: [{cluster_state_1, cluster_state_2}],
    //                           },
    //                 newState: {
    //                            endpointTypeId_1: [{cluster_state_1, cluster_state_2}],
    //                            endpointTypeId_2: [{cluster_state_1, cluster_state_2}],
    //                           }}

    if (!Array.isArray(endpointTypeIdList) || !endpointTypeIdList.length) {
      response.status(StatusCodes.BAD_REQUEST).send()
    } else {
      if (endpointTypeIdList.length == 1) {
        return response.status(StatusCodes.OK).json(resp)
      }

      let unifiedClustersInfo =
        await queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
          db,
          endpointTypeIdList.map((x) => {
            return { endpointTypeId: x }
          })
        )

      let oldEndpointAttributesInfo = await Promise.all(
        endpointTypeIdList.map((endpointTypeId) =>
          queryEndpointType.selectAllClustersDetailsFromEndpointTypes(db, [
            { endpointTypeId },
          ])
        )
      ).then((endpointClusterInfos) =>
        // sort by name
        endpointClusterInfos.map((clus) =>
          clus.sort((a, b) => a.name.localeCompare(b.name))
        )
      )

      // align all cluster states
      if (endpointTypeIdList.length > 1) {
        endpointTypeIdList.forEach((endpointTypeId) => {
          unifiedClustersInfo.forEach((clus) => {
            queryConfig.insertOrReplaceClusterState(
              db,
              endpointTypeId,
              clus.id,
              clus.side,
              clus.enabled
            )
          })
        })
      }

      resp.oldState = []
      endpointTypeIdList.forEach((endpointTypeId, index) => {
        resp.oldState.push({
          endpointTypeId: endpointTypeId,
          clusters: oldEndpointAttributesInfo[index],
        })
      })

      let newEndpointClusterInfos = await Promise.all(
        endpointTypeIdList.map((endpointTypeId) =>
          queryEndpointType.selectAllClustersDetailsFromEndpointTypes(db, [
            { endpointTypeId },
          ])
        )
      ).then((endpointClusterInfos) =>
        // sort by name
        endpointClusterInfos.map((clus) =>
          clus.sort((a, b) => a.name.localeCompare(b.name))
        )
      )

      resp.newState = []
      endpointTypeIdList.forEach((endpointTypeId, index) => {
        resp.newState.push({
          endpointTypeId: endpointTypeId,
          clusters: newEndpointClusterInfos[index],
        })
      })

      // env.logInfo(`Unifying cluster states across endpoint`)
      // env.logInfo(`Before:`)
      // resp.oldState.forEach((ep) => {
      //   ep.clusters.forEach((clus) => {
      //     env.logInfo(
      //       `ep_id: ${ep.endpointTypeId}, clus_id:${clus.id}, name:${clus.name}, side:${clus.side}, enabled:${clus.enabled}`
      //     )
      //   })
      // })
      // env.logInfo(`After:`)
      // resp.newState.forEach((ep) => {
      //   ep.clusters.forEach((clus) => {
      //     env.logInfo(
      //       `ep_id: ${ep.endpointTypeId}, clus_id:${clus.id}, name:${clus.name}, side:${clus.side}, enabled:${clus.enabled}`
      //     )
      //   })
      // })
      response.status(StatusCodes.OK).json(resp)
    }
  }
}

function httpDeleteSessionPackage(db) {
  return async (request, response) => {
    let { sessionRef, packageRef } = request.query
    let removed = await queryPackage.deleteSessionPackage(
      db,
      sessionRef,
      packageRef
    )

    response.status(StatusCodes.OK).json({
      successful: removed > 0,
      sessionRef: sessionRef,
      packageRef: packageRef,
    })
  }
}

exports.post = [
  {
    uri: restApi.uri.cluster,
    callback: httpPostCluster,
  },
  {
    uri: restApi.uri.attributeUpdate,
    callback: httpPostAttributeUpdate,
  },
  {
    uri: restApi.uri.commandUpdate,
    callback: httpPostCommandUpdate,
  },
  {
    uri: restApi.uri.eventUpdate,
    callback: httpPostEventUpdate,
  },
  {
    uri: restApi.uri.saveSessionKeyValue,
    callback: httpPostSaveSessionKeyValue,
  },
  {
    uri: restApi.uri.addNewPackage,
    callback: httpPostAddNewPackage,
  },
  {
    uri: restApi.uri.unifyClustersAcrossEndpoints,
    callback: httpPostUnifyClustersAcrossEndpoints,
  },
  {
    uri: restApi.uri.unifyAttributesAcrossEndpoints,
    callback: httpPostUnifyAttributesAcrossEndpoints,
  },
]

exports.get = [
  {
    uri: restApi.uri.getAllSessionKeyValues,
    callback: httpGetSessionKeyValues,
  },
  {
    uri: restApi.uri.initialState,
    callback: httpGetInitialState,
  },
  {
    uri: `${restApi.uri.option}/:category`,
    callback: httpGetOption,
  },
  {
    uri: restApi.uri.packages,
    callback: httpGetPackages,
  },
]

exports.delete = [
  {
    uri: restApi.uri.sessionPackage,
    callback: httpDeleteSessionPackage,
  },
]
