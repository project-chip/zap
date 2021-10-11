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
    let { id, side, flag, endpointTypeId } = request.body
    let sessionId = request.zapSessionId
    let packageId

    queryPackage
      .getSessionPackagesByType(db, sessionId, dbEnum.packageType.zclProperties)
      .then((pkgs) => {
        packageId = pkgs[0].id
      })
      .then(() => queryConfig.selectClusterState(db, endpointTypeId, id, side))
      .then((clusterState) => (clusterState == null ? true : false))
      .then((insertDefaults) => {
        return queryConfig
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
          .then(() =>
            response
              .json({
                endpointTypeId: endpointTypeId,
                id: id,
                side: side,
                flag: flag,
              })
              .status(StatusCodes.OK)
              .send()
          )
          .catch((err) => response.status(StatusCodes.BAD_REQUEST).send())
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
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      attributeSide,
      reportMinInterval,
      reportMaxInterval,
      reportableChange,
    } = request.body
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

    await queryConfig.insertOrUpdateAttributeState(
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

    let eptAttr = await queryZcl.selectEndpointTypeAttribute(
      db,
      endpointTypeId,
      id,
      clusterRef
    )

    let validationData = await validation.validateAttribute(
      db,
      endpointTypeId,
      id,
      clusterRef
    )

    response.status(StatusCodes.OK).json({
      action: action,
      endpointTypeId: endpointTypeId,
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
  return (request, response) => {
    let sessionId = request.zapSessionId
    let state = {}

    querySession.getSessionFromSessionId(db, sessionId).then((session) => {
      asyncValidation.initAsyncValidation(db, session)
    })

    let statePopulators = []
    let endpointTypes = queryEndpointType
      .selectAllEndpointTypes(db, sessionId)
      .then((rows) => {
        state.endpointTypes = rows
      })
    statePopulators.push(endpointTypes)

    let endpoints = queryEndpoint
      .selectAllEndpoints(db, sessionId)
      .then((rows) => {
        state.endpoints = rows
      })
    statePopulators.push(endpoints)

    let sessionKeyValues = querySession
      .getAllSessionKeyValues(db, sessionId)
      .then((rows) => {
        state.sessionKeyValues = rows
      })
    statePopulators.push(sessionKeyValues)

    Promise.all(statePopulators).then(() => {
      return response.status(StatusCodes.OK).json(state)
    })
  }
}

/**
 * HTTP GET: option
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetOption(db) {
  return (request, response) => {
    let sessionId = request.zapSessionId
    const { category } = request.params
    queryPackage.getSessionPackages(db, sessionId).then((packages) => {
      let p = packages.map((pkg) =>
        queryPackage.selectAllOptionsValues(db, pkg.packageRef, category)
      )
      Promise.all(p)
        .then((data) => data.flat(1))
        .then((data) => response.status(StatusCodes.OK).json(data))
    })
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
      env.logError(err)
      res.status(StatusCodes.BAD_REQUEST).send()
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
