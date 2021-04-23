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
 * @module REST API: endpoint
 */
const queryConfig = require('../db/query-config.js')
const validation = require('../validation/validation.js')
const restApi = require('../../src-shared/rest-api.js')

/**
 * HTTP DELETE: endpoint
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpDeleteEndpoint(db) {
  return (request, response) => {
    let id = request.query.id
    queryConfig.deleteEndpoint(db, id).then((removed) => {
      response.json({
        successful: removed > 0,
        id: id,
      })
      return response.status(restApi.httpCode.ok).send()
    })
  }
}

/**
 * HTTP DELETE: endpoint type
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpDeleteEndpointType(db) {
  return (request, response) => {
    let id = request.query.id
    queryConfig.deleteEndpointType(db, id).then((removed) => {
      response.json({
        successful: removed > 0,
        id: id,
      })
      return response.status(restApi.httpCode.ok).send()
    })
  }
}

/**
 * HTTP POST: endpoint
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostEndpoint(db) {
  return (request, response) => {
    let {
      endpointId,
      networkId,
      endpointType,
      endpointVersion,
      deviceIdentifier,
    } = request.body
    let sessionIdexport = request.zapSessionId
    queryConfig
      .insertEndpoint(
        db,
        sessionIdexport,
        endpointId,
        endpointType,
        networkId,
        endpointVersion,
        deviceIdentifier
      )
      .then((newId) =>
        validation.validateEndpoint(db, newId).then((validationData) => {
          response.json({
            id: newId,
            endpointId: endpointId,
            endpointType: endpointType,
            networkId: networkId,
            endpointVersion: endpointVersion,
            validationIssues: validationData,
          })
        })
      )
      .catch((err) => response.status(restApi.httpCode.badRequest).send())
  }
}

/**
 * HTTP POST: endpoint
 *
 * @param {*} db Main database to use for the operation.
 * @returns callback for the express uri registration
 */
function httpPatchEndpoint(db) {
  return (request, response) => {
    let context = request.body
    let sessionIdexport = request.zapSessionId
    let changes = context.changes.map((data) => {
      let paramType = ''
      return {
        key: data.updatedKey,
        value: data.value,
        type: paramType,
      }
    })

    queryConfig
      .updateEndpoint(db, sessionIdexport, context.id, changes)
      .then((data) => {
        return validation
          .validateEndpoint(db, context.id)
          .then((validationData) => {
            response.json({
              endpointId: context.id,
              changes: context.changes,
              validationIssues: validationData,
            })
            return response.status(restApi.httpCode.ok).send()
          })
      })
  }
}

/**
 * HTTP POST endpoint type
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPostEndpointType(db) {
  return (request, response) => {
    let { name, deviceTypeRef } = request.body
    let sessionId = request.zapSessionId
    queryConfig
      .insertEndpointType(db, sessionId, name, deviceTypeRef)
      .then((newId) =>
        response.json({
          id: newId,
          name: name,
          deviceTypeRef: deviceTypeRef,
        })
      )
      .catch((err) => response.status(restApi.httpCode.badRequest).send())
  }
}

/**
 * HTTP POST: endpoint type update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPatchEndpointType(db) {
  return (request, response) => {
    let { endpointTypeId, updatedKey, updatedValue } = request.body
    let sessionId = request.zapSessionId

    queryConfig
      .updateEndpointType(
        db,
        sessionId,
        endpointTypeId,
        updatedKey,
        updatedValue
      )
      .then(() => {
        response.json({
          endpointTypeId: endpointTypeId,
          updatedKey: updatedKey,
          updatedValue: updatedValue,
        })
        return response.status(restApi.httpCode.ok).send()
      })
  }
}

exports.post = [
  {
    uri: restApi.uri.endpoint,
    callback: httpPostEndpoint,
  },
  {
    uri: restApi.uri.endpointType,
    callback: httpPostEndpointType,
  },
]

exports.patch = [
  {
    uri: restApi.uri.endpoint,
    callback: httpPatchEndpoint,
  },
  {
    uri: restApi.uri.endpointType,
    callback: httpPatchEndpointType,
  },
]

exports.delete = [
  {
    uri: restApi.uri.endpoint,
    callback: httpDeleteEndpoint,
  },
  {
    uri: restApi.uri.endpointType,
    callback: httpDeleteEndpointType,
  },
]
