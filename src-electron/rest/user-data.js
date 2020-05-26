// Copyright (c) 2020 Silicon Labs. All rights reserved.

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
  insertOrUpdateReportableAttributeState,
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
    var { action, endpointTypeId, id, value, listType } = request.body
    var booleanParam = ''
    switch (listType) {
      case 'selectedAttributes':
        booleanParam = 'INCLUDED'
        break
      case 'selectedExternal':
        booleanParam = 'EXTERNAL'
        break
      case 'selectedFlash':
        booleanParam = 'FLASH'
        break
      case 'selectedSingleton':
        booleanParam = 'SINGLETON'
        break
      case 'selectedBounded':
        booleanParam = 'BOUNDED'
      case 'defaultValue':
        booleanParam = 'DEFAULT_VALUE'
      default:
        break
    }
    insertOrUpdateAttributeState(
      db,
      endpointTypeId,
      id,
      value,
      booleanParam
    ).then((row) => {
      return validateAttribute(db, endpointTypeId, id).then(
        (validationData) => {
          response.json({
            action: action,
            endpointTypeId: endpointTypeId,
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
  })

  app.post('/post/command/update', (request, response) => {
    var { action, endpointTypeId, id, value, listType } = request.body
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
    switch (action) {
      case 'boolean':
        insertOrUpdateCommandState(
          db,
          endpointTypeId,
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
            replyId: 'singleCommandState',
          })
          return response.status(httpCode.ok).send()
        })
        break
      default:
        break
    }
  })

  app.post('/post/reportableAttribute/update', (request, response) => {
    var { action, endpointTypeId, id, value, listType } = request.body
    var booleanParam = ''
    switch (listType) {
      case 'selectedReporting':
        booleanParam = 'INCLUDED'
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
    insertOrUpdateReportableAttributeState(
      db,
      endpointTypeId,
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
