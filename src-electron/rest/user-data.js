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

import { logInfo } from '../util/env'
import { httpCode } from '../server/http-server'
import {
  insertOrReplaceClusterState,
  insertOrUpdateAttributeState,
  insertOrUpdateCommandState,
  updateKeyValue,
  insertEndpoint,
  deleteEndpoint,
  updateEndpoint,
  insertEndpointType,
  deleteEndpointType,
  updateEndpointType,
} from '../db/query-config'
import { validateEndpoint, validateAttribute } from '../validation/validation'

export function registerSessionApi(db, app) {
  app.post('/post/cluster', (request, response) => {
    var { id, side, flag, endpointTypeId } = request.body
    insertOrReplaceClusterState(db, endpointTypeId, id, side, flag)
      .then(() =>
        response
          .json({
            replyId: 'zcl-endpointType-cluster-selection-response',
            endpointTypeId: endpointTypeId,
            id: id,
            side: side,
            flag: flag,
          })
          .status(httpCode.ok)
          .send()
      )
      .catch((err) => response.status(httpCode.badRequest).send())
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
      case 'defaultValue':
        booleanParam = 'DEFAULT_VALUE'
        paramType = 'text'
      default:
        break
    }

    if (paramType != '') {
      insertOrUpdateAttributeState(
        db,
        endpointTypeId,
        clusterRef,
        attributeSide,
        id,
        [{ key: booleanParam, value: value, type: paramType }]
      ).then((row) => {
        return validateAttribute(db, endpointTypeId, id).then(
          (validationData) => {
            response.json({
              action: action,
              endpointTypeId: endpointTypeId,
              clusterRef: clusterRef,
              id: id,
              added: value,
              listType: listType,
              validationIssues: validationData,
              replyId: 'singleAttributeState',
            })
            return response.status(httpCode.ok).send()
          }
        )
      })
    }
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
    insertOrUpdateCommandState(
      db,
      endpointTypeId,
      clusterRef,
      commandSide,
      id,
      value,
      booleanParam
    ).then(() => {
      response.json({
        action: action,
        endpointTypeId: endpointTypeId,
        id: id,
        added: value,
        listType: listType,
        side: commandSide,
        clusterRef: clusterRef,
        replyId: 'singleCommandState',
      })
      return response.status(httpCode.ok).send()
    })
  })

  app.post('/post/reportableAttribute/update', (request, response) => {
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
    switch (listType) {
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
    insertOrUpdateAttributeState(
      db,
      endpointTypeId,
      clusterRef,
      attributeSide,
      id,
      [{ key: booleanParam, value: value }]
    ).then(() => {
      response.json({
        action: action,
        endpointTypeId: endpointTypeId,
        id: id,
        added: value,
        listType: listType,
        replyId: 'singleReportableAttributeState',
      })
      return response.status(httpCode.ok).send()
    })
  })

  app.post('/post/save', (request, response) => {
    var { key, value } = request.body
    var sessionId = request.session.zapSessionId
    logInfo(`[${sessionId}]: Saving: ${key} => ${value}`)
    updateKeyValue(db, sessionId, key, value)
      .then(() => {
        response.status(httpCode.ok)
      })
      .catch((err) => {
        throw err
      })
  })

  app.post('/post/endpoint', (request, response) => {
    var { action, context } = request.body
    var sessionId = request.session.zapSessionId
    switch (action) {
      case 'c':
        insertEndpoint(
          db,
          sessionId,
          context.eptId,
          context.endpointType,
          context.nwkId
        )
          .then((newId) => {
            return validateEndpoint(db, newId).then((validationData) => {
              response.json({
                action: 'c',
                id: newId,
                eptId: context.eptId,
                endpointType: context.endpointType,
                nwkId: context.nwkId,
                replyId: 'zcl-endpoint-response',
                validationIssues: validationData,
              })
              return response.status(httpCode.ok).send()
            })
          })
          .catch((err) => {
            return response.status(httpCode.badRequest).send()
          })
        break
      case 'd':
        deleteEndpoint(db, context.id).then((removed) => {
          response.json({
            action: 'd',
            successful: removed > 0,
            id: context.id,
            replyId: 'zcl-endpoint-response',
          })
          return response.status(httpCode.ok).send()
        })
        break
      case 'e':
        var changeParam = ''
        switch (context.updatedKey) {
          case 'endpointId':
            changeParam = 'ENDPOINT_ID'
            break
          case 'endpointType':
            changeParam = 'ENDPOINT_TYPE_REF'
            break
          case 'networkId':
            changeParam = 'NETWORK_ID'
            break
        }
        updateEndpoint(
          db,
          sessionId,
          context.id,
          changeParam,
          context.value
        ).then((data) => {
          return validateEndpoint(db, context.id).then((validationData) => {
            response.json({
              action: 'u',
              endpointId: context.id,
              updatedKey: context.updatedKey,
              updatedValue: context.value,
              replyId: 'zcl-endpoint-response',
              validationIssues: validationData,
            })
            return response.status(httpCode.ok).send()
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
      case 'c':
        insertEndpointType(db, sessionId, context.name, context.deviceTypeRef)
          .then((newId) => {
            response.json({
              action: 'c',
              id: newId,
              name: context.name,
              deviceTypeRef: context.deviceTypeRef,
              replyId: 'zcl-endpointType-response',
            })
            return response.status(httpCode.ok).send()
          })
          .catch((err) => {
            return response.status(httpCode.badRequest).send()
          })
        break
      case 'd':
        deleteEndpointType(db, context.id).then((removed) => {
          response.json({
            action: 'd',
            successful: removed > 0,
            id: context.id,
            replyId: 'zcl-endpointType-response',
          })
          return response.status(httpCode.ok).send()
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

    updateEndpointType(db, sessionId, endpointTypeId, param, updatedValue).then(
      () => {
        response.json({
          action: action,
          endpointTypeId: endpointTypeId,
          updatedKey: updatedKey,
          updatedValue: updatedValue,
          replyId: 'zcl-endpointType-response',
        })
        return response.status(httpCode.ok).send()
      }
    )
  })
}
