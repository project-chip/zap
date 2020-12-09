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

const env = require('../util/env.js')
const queryConfig = require('../db/query-config.js')
const queryPackage = require('../db/query-package.js')
const validation = require('../validation/validation.js')
const restApi = require('../../src-shared/rest-api.js')
const zclLoader = require('../zcl/zcl-loader.js')

/**
 * HTTP GET: session key values
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpGetSessionKeyValues(db) {
  return (request, response) => {
    var sessionId = request.session.zapSessionId
    queryConfig
      .getAllSessionKeyValues(db, sessionId)
      .then((sessionKeyValues) =>
        response.status(restApi.httpCode.ok).json(sessionKeyValues)
      )
  }
}

/**
 * HTTP POST: save session key value
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostSaveSessionKeyValue(db) {
  return (request, response) => {
    var { key, value } = request.body
    var sessionId = request.session.zapSessionId
    env.logInfo(`[${sessionId}]: Saving: ${key} => ${value}`)
    queryConfig
      .updateKeyValue(db, sessionId, key, value)
      .then(() => {
        response.json({
          key: key,
          value: value,
        })
        response.status(restApi.httpCode.ok).send()
      })
      .catch((err) => {
        throw err
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
    var { id, side, flag, endpointTypeId } = request.body

    queryConfig
      .getClusterState(db, endpointTypeId, id, side)
      .then((clusterState) => (clusterState == null ? true : false))
      .then((insertDefaults) => {
        return queryConfig
          .insertOrReplaceClusterState(db, endpointTypeId, id, side, flag)
          .then(() => {
            if (insertDefaults) {
              return queryConfig.insertClusterDefaults(db, endpointTypeId, {
                clusterRef: id,
                side: side,
              })
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
              .status(restApi.httpCode.ok)
              .send()
          )
          .catch((err) => response.status(restApi.httpCode.badRequest).send())
      })
  }
}

/**
 * HTTP POST attribute update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostAttributeUpdate(db) {
  return (request, response) => {
    var {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      attributeSide,
    } = request.body
    var paramType
    switch (listType) {
      case restApi.updateKey.attributeStorage:
      case restApi.updateKey.attributeDefault:
        paramType = 'text'
        break
      default:
        paramType = ''
        break
    }
    queryConfig
      .insertOrUpdateAttributeState(
        db,
        endpointTypeId,
        clusterRef,
        attributeSide,
        id,
        [{ key: listType, value: value, type: paramType }]
      )
      .then((row) =>
        validation
          .validateAttribute(db, endpointTypeId, id, clusterRef)
          .then((validationData) => {
            response.json({
              action: action,
              endpointTypeId: endpointTypeId,
              clusterRef: clusterRef,
              id: id,
              added: value,
              listType: listType,
              validationIssues: validationData,
            })
            return response.status(restApi.httpCode.ok).send()
          })
      )
  }
}

/**
 * HTTP POST: command update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostCommandUpdate(db) {
  return (request, response) => {
    var {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      commandSide,
    } = request.body
    var isIncoming = null

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
    queryConfig
      .insertOrUpdateCommandState(
        db,
        endpointTypeId,
        clusterRef,
        commandSide,
        id,
        value,
        isIncoming
      )
      .then(() => {
        response.json({
          action: action,
          endpointTypeId: endpointTypeId,
          id: id,
          added: value,
          listType: listType,
          side: commandSide,
          clusterRef: clusterRef,
        })
        return response.status(restApi.httpCode.ok).send()
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
    var sessionId = request.session.zapSessionId
    var state = {}

    var statePopulators = []
    var endpointTypes = queryConfig
      .getAllEndpointTypes(db, sessionId)
      .then((rows) => {
        state.endpointTypes = rows
      })
    statePopulators.push(endpointTypes)

    var endpoints = queryConfig.getAllEndpoints(db, sessionId).then((rows) => {
      state.endpoints = rows
    })
    statePopulators.push(endpoints)

    var sessionKeyValues = queryConfig
      .getAllSessionKeyValues(db, sessionId)
      .then((rows) => {
        state.sessionKeyValues = rows
      })
    statePopulators.push(sessionKeyValues)

    Promise.all(statePopulators).then(() => {
      return response.status(restApi.httpCode.ok).json(state)
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
    var sessionId = request.session.zapSessionId
    const { category } = request.params
    queryPackage.getSessionPackages(db, sessionId).then((packages) => {
      var p = packages.map((pkg) =>
        queryPackage.selectAllOptionsValues(db, pkg.packageRef, category)
      )
      Promise.all(p)
        .then((data) => data.flat(1))
        .then((data) => {
          return response.status(restApi.httpCode.ok).json(data)
        })
    })
  }
}

/**
 * HTTP GET: Project packages
 */
function httpGetPackages(db) {
  return (request, response) => {
    var sessionId = request.session.zapSessionId
    queryPackage
      .getPackageSessionPackagePairBySessionId(db, sessionId)
      .then((packageSessionPackagePairs) => {
        return response
          .status(restApi.httpCode.ok)
          .json(packageSessionPackagePairs)
      })
  }
}

/**
 * HTTP POST: Add new project package
 */
function httpPostAddNewPackage(db) {
  return (request, response) => {
    var sessionId = request.session.zapSessionId
    var { filePath } = request.body
    try {
      zclLoader
        .loadIndividualFile(db, filePath)
        .then((packageId) => {
          return queryPackage
            .insertSessionPackage(db, sessionId, packageId, false)
            .then(() => sessionId)
        })
        .then(() => {
          return response.status(restApi.httpCode.ok).send()
        })
    } catch (err) {
      console.log(err)
      return response.status(restApi.httpCode.badRequest).send()
    }
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
