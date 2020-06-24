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
const validation = require('../validation/validation.js')
const httpServer = require('../server/http-server.js')
const restApi = require('../../src-shared/rest-api.js')

function registerSessionApi(db, app) {
  app.post('/post/cluster', (request, response) => {
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
          .status(httpServer.httpCode.ok)
          .send()
      )
      .catch((err) => response.status(httpServer.httpCode.badRequest).send())
  })

  app.post('/post/attribute/update', (request, response) => {
    var {
      action,
      endpointTypeId,
      id,
      value,
      listType,
      clusterRef,
      attributeSide,
    } = request.body
    var booleanParam = ''
    var paramType = ''
    switch (listType) {
      case 'selectedAttributes':
        booleanParam = 'INCLUDED'
        paramType = 'bool'
        break
      case 'selectedExternal':
        booleanParam = 'EXTERNAL'
        paramType = 'bool'
        break
      case 'selectedFlash':
        booleanParam = 'FLASH'
        paramType = 'bool'
        break
      case 'selectedSingleton':
        booleanParam = 'SINGLETON'
        paramType = 'bool'
        break
      case 'selectedBounded':
        booleanParam = 'BOUNDED'
        paramType = 'bool'
        break
      case 'defaultValue':
        booleanParam = 'DEFAULT_VALUE'
        paramType = 'text'
        break
      case 'selectedReporting':
        booleanParam = 'INCLUDED_REPORTABLE'
        break
      case 'reportingMin':
        booleanParam = 'MIN_INTERVAL'
        break
      case 'reportingMax':
        booleanParam = 'MAX_INTERVAL'
        break
      case 'reportableChange':
        booleanParam = 'REPORTABLE_CHANGE'
        break
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
        [{ key: booleanParam, value: value }]
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
            return response.status(httpServer.httpCode.ok).send()
          })
      })
  })

  app.post('/post/command/update', (request, response) => {
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
        return response.status(httpServer.httpCode.ok).send()
      })
  })

  app.post('/post/save', (request, response) => {
    var { key, value } = request.body
    var sessionId = request.session.zapSessionId
    env.logInfo(`[${sessionId}]: Saving: ${key} => ${value}`)
    queryConfig
      .updateKeyValue(db, sessionId, key, value)
      .then(() => {
        response.status(httpServer.httpCode.ok)
      })
      .catch((err) => {
        throw err
      })
  })

  app.post('/post/endpoint', (request, response) => {
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
                return response.status(httpServer.httpCode.ok).send()
              })
          })
          .catch((err) => {
            return response.status(httpServer.httpCode.badRequest).send()
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
          return response.status(httpServer.httpCode.ok).send()
        })
        break
      case restApi.action.update:
        var changeParam = ''
        switch (context.updatedKey) {
          case 'endpointId':
            changeParam = 'ENDPOINT_IDENTIFIER'
            break
          case 'endpointType':
            changeParam = 'ENDPOINT_TYPE_REF'
            break
          case 'networkId':
            changeParam = 'NETWORK_IDENTIFIER'
            break
        }
        queryConfig
          .updateEndpoint(
            db,
            sessionIdexport,
            context.id,
            changeParam,
            context.value
          )
          .then((data) => {
            return validation
              .validateEndpoint(db, context.id)
              .then((validationData) => {
                response.json({
                  action: restApi.action.update,
                  endpointId: context.id,
                  updatedKey: context.updatedKey,
                  updatedValue: context.value,
                  replyId: restApi.replyId.zclEndpointResponse,
                  validationIssues: validationData,
                })
                return response.status(httpServer.httpCode.ok).send()
              })
          })
        break
      default:
        break
    }
  })

  app.post('/post/endpointType', (request, response) => {
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
            return response.status(httpServer.httpCode.ok).send()
          })
          .catch((err) => {
            return response.status(httpServer.httpCode.badRequest).send()
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
          return response.status(httpServer.httpCode.ok).send()
        })
        break
      default:
        break
    }
  })

  app.post('/post/endpointType/update', (request, response) => {
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
        return response.status(httpServer.httpCode.ok).send()
      })
  })
}

exports.registerSessionApi = registerSessionApi
