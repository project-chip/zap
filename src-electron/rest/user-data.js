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
const httpServer = require('../server/http-server.js')
const restApi = require('../../src-shared/rest-api.js')

function registerSessionApi(db, app) {
  app.post('/cluster', (request, response) => {
    var { id, side, flag, endpointTypeId } = request.body
    queryConfig
      .insertOrReplaceClusterState(db, endpointTypeId, id, side, flag)
      .then(() =>
        response
          .json({
            replyId: restApi.replyId.zclEndpointTypeClusterSelectionResponse,
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

  app.post('/attribute/update', (request, response) => {
    var {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      attributeSide,
    } = request.body
    var param = ''
    var paramType = ''
    switch (listType) {
      case 'selectedAttributes':
        param = 'INCLUDED'
        paramType = 'bool'
        break
      case 'selectedSingleton':
        param = 'SINGLETON'
        paramType = 'bool'
        break
      case 'selectedBounded':
        param = 'BOUNDED'
        paramType = 'bool'
        break
      case 'defaultValue':
        param = 'DEFAULT_VALUE'
        paramType = 'text'
        break
      case 'selectedReporting':
        param = 'INCLUDED_REPORTABLE'
        break
      case 'reportingMin':
        param = 'MIN_INTERVAL'
        break
      case 'reportingMax':
        param = 'MAX_INTERVAL'
        break
      case 'reportableChange':
        param = 'REPORTABLE_CHANGE'
        break
      case 'storageOption':
        param = 'STORAGE_OPTION'
        paramType = 'text'
      default:
        break
    }
    queryConfig
      .insertOrUpdateAttributeState(
        db,
        endpointTypeId,
        clusterRef,
        attributeSide,
        id,
        [{ key: param, value: value, type: paramType }]
      )
      .then((row) => {
        return validation
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
              replyId: restApi.replyId.singleAttributeState,
            })
            return response.status(restApi.httpCode.ok).send()
          })
      })
  })

  app.post('/command/update', (request, response) => {
    var {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      commandSide,
    } = request.body
    var booleanParam = ''

    switch (listType) {
      case 'selectedIn':
        booleanParam = 'INCOMING'
        break
      case 'selectedOut':
        booleanParam = 'OUTGOING'
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
        booleanParam
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
          replyId: restApi.replyId.singleCommandState,
        })
        return response.status(restApi.httpCode.ok).send()
      })
  })

  app.post(restApi.uri.saveSessionKeyValue, (request, response) => {
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
  })

  app.post(restApi.uri.endpoint, (request, response) => {
    var { action, context } = request.body
    var sessionIdexport = request.session.zapSessionId
    switch (action) {
      case restApi.action.create:
        queryConfig
          .insertEndpoint(
            db,
            sessionIdexport,
            context.eptId,
            context.endpointType,
            context.nwkId
          )
          .then((newId) => {
            return validation
              .validateEndpoint(db, newId)
              .then((validationData) => {
                response.json({
                  action: action,
                  id: newId,
                  eptId: context.eptId,
                  endpointType: context.endpointType,
                  nwkId: context.nwkId,
                  replyId: restApi.replyId.zclEndpointResponse,
                  validationIssues: validationData,
                })
                return response.status(restApi.httpCode.ok).send()
              })
          })
          .catch((err) => {
            return response.status(restApi.httpCode.badRequest).send()
          })
        break
      case restApi.action.delete:
        queryConfig.deleteEndpoint(db, context.id).then((removed) => {
          response.json({
            action: action,
            successful: removed > 0,
            id: context.id,
            replyId: restApi.replyId.zclEndpointResponse,
          })
          return response.status(restApi.httpCode.ok).send()
        })
        break
      case restApi.action.update:
        let changes = context.changes.map((data) => {
          var changeParam = ''
          var paramType = ''
          switch (data.updatedKey) {
            case 'endpointId':
              changeParam = 'ENDPOINT_IDENTIFIER'
              break
            case 'endpointType':
              changeParam = 'ENDPOINT_TYPE_REF'
              break
            case 'networkId':
              changeParam = 'NETWORK_IDENTIFIER'
              paramType = 'text'
              break
          }
          return { key: changeParam, value: data.value, type: paramType }
        })

        queryConfig
          .updateEndpoint(db, sessionIdexport, context.id, changes)
          .then((data) => {
            return validation
              .validateEndpoint(db, context.id)
              .then((validationData) => {
                response.json({
                  action: restApi.action.update,
                  endpointId: context.id,
                  changes: context.changes,
                  replyId: restApi.replyId.zclEndpointResponse,
                  validationIssues: validationData,
                })
                return response.status(restApi.httpCode.ok).send()
              })
          })
        break
      default:
        break
    }
  })

  app.post(restApi.uri.endpointType, (request, response) => {
    var { action, context } = request.body
    var sessionId = request.session.zapSessionId
    switch (action) {
      case restApi.action.create:
        queryConfig
          .insertEndpointType(
            db,
            sessionId,
            context.name,
            context.deviceTypeRef
          )
          .then((newId) => {
            response.json({
              action: action,
              id: newId,
              name: context.name,
              deviceTypeRef: context.deviceTypeRef,
              replyId: restApi.replyId.zclEndpointTypeResponse,
            })
            return response.status(restApi.httpCode.ok).send()
          })
          .catch((err) => {
            return response.status(restApi.httpCode.badRequest).send()
          })
        break
      case restApi.action.delete:
        queryConfig.deleteEndpointType(db, context.id).then((removed) => {
          response.json({
            action: action,
            successful: removed > 0,
            id: context.id,
            replyId: restApi.replyId.zclEndpointTypeResponse,
          })
          return response.status(restApi.httpCode.ok).send()
        })
        break
      default:
        break
    }
  })

  app.post('/endpointType/update', (request, response) => {
    var { action, endpointTypeId, updatedKey, updatedValue } = request.body
    var sessionId = request.session.zapSessionId

    var param = ''
    switch (updatedKey) {
      case 'deviceTypeRef':
        param = 'DEVICE_TYPE_REF'
        break
      case 'name':
        param = 'NAME'
      default:
        break
    }

    queryConfig
      .updateEndpointType(db, sessionId, endpointTypeId, param, updatedValue)
      .then(() => {
        response.json({
          action: action,
          endpointTypeId: endpointTypeId,
          updatedKey: updatedKey,
          updatedValue: updatedValue,
          replyId: restApi.replyId.zclEndpointTypeResponse,
        })
        return response.status(restApi.httpCode.ok).send()
      })
  })

  app.get(restApi.uri.initialState, (request, response) => {
    var sessionId = request.session.zapSessionId
    var state = {}

    var statePopulators = []
    var endpointTypes = queryConfig
      .getAllEndpointTypes(db, sessionId)
      .then((rows) => {
        state['endpointTypes'] = rows
      })
    statePopulators.push(endpointTypes)

    var endpoints = queryConfig.getAllEndpoints(db, sessionId).then((rows) => {
      state['endpoints'] = rows
    })
    statePopulators.push(endpoints)

    var sessionKeyValues = queryConfig
      .getAllSessionKeyValues(db, sessionId)
      .then((rows) => {
        state['sessionKeyValues'] = rows
      })
    statePopulators.push(sessionKeyValues)

    Promise.all(statePopulators).then(() => {
      return response.status(restApi.httpCode.ok).json({
        replyId: restApi.replyId.initialState,
        state: state,
      })
    })
  })

  app.get(`${restApi.uri.option}/:option`, (request, response) => {
    var sessionId = request.session.zapSessionId
    const { option } = request.params
    queryPackage.getSessionPackageIds(db, sessionId).then((packageIds) => {
      var p = packageIds.map((packageId) => {
        return queryPackage.selectAllOptionsValues(db, packageId, option)
      })
      Promise.all(p)
        .then((data) => data.flat(1))
        .then((data) => {
          return response.status(restApi.httpCode.ok).json({
            data: data,
            option: option,
            replyId: 'option',
          })
        })
    })
  })

  app.get(`${restApi.uri.getAllSessionKeyValues}`, (request, response) => {
    var sessionId = request.session.zapSessionId
    queryConfig
      .getAllSessionKeyValues(db, sessionId)
      .then((sessionKeyValues) => {
        return response.status(restApi.httpCode.ok).json({
          data: sessionKeyValues,
          replyId: 'sessionKeyValues',
        })
      })
  })
}

exports.registerSessionApi = registerSessionApi
