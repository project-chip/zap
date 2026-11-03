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

const restApi = require('../../src-shared/rest-api.js')
const configurationApi = require('../api').configuration
const { StatusCodes } = require('http-status-codes')

/**
 * HTTP DELETE: endpoint
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpDeleteEndpoint(db) {
  return async (request, response) => {
    let id = request.query.id
    let outcome = await configurationApi.executeRequest(
      db,
      request,
      'endpoint.delete',
      { endpointId: id }
    )

    response.status(StatusCodes.OK).json({
      successful: outcome.changed,
      id: id
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
  return async (request, response) => {
    let id = request.query.id
    let outcome = await configurationApi.executeRequest(
      db,
      request,
      'endpointtype.delete',
      { endpointTypeId: id }
    )
    response.status(StatusCodes.OK).json({
      successful: outcome.changed,
      id: id
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
  return async (request, response) => {
    let {
      endpointId,
      networkId,
      profileId,
      endpointType,
      deviceIdentifier,
      parentEndpointIdentifier
    } = request.body
    let parentEndpointRef = await configurationApi.readParentEndpointRef(
      db,
      parentEndpointIdentifier,
      request.zapSessionId
    )
    if (parentEndpointRef == null && parentEndpointIdentifier != null) {
      parentEndpointIdentifier = null
    }
    let outcome = await configurationApi.executeRequest(
      db,
      request,
      'endpoint.attach',
      {
        endpoint: endpointId,
        endpointTypeId: endpointType,
        network: networkId,
        profile: profileId,
        parentId: parentEndpointRef
      }
    )
    let newId = outcome.id
    try {
      let validationData = await configurationApi.validateEndpoint(db, newId)
      response.status(StatusCodes.OK).json({
        id: newId,
        endpointId: endpointId,
        endpointType: endpointType,
        networkId: networkId,
        parentEndpointIdentifier: parentEndpointIdentifier,
        deviceId: deviceIdentifier,
        profileId: profileId,
        validationIssues: validationData
      })
    } catch (err) {
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err)
    }
  }
}

/**
 * HTTP POST: endpoint
 *
 * @param {*} db Main database to use for the operation.
 * @returns callback for the express uri registration
 */
function httpPatchEndpoint(db) {
  return async (request, response) => {
    let context = request.body
    let parentEndpointIdentifier = context.parentEndpointIdentifier
    let endpoint = await configurationApi.readEndpointById(
      db,
      request.zapSessionId,
      context.id
    )
    if (endpoint == null) {
      return response.status(StatusCodes.NOT_FOUND).json({
        error: `Unknown endpoint id ${context.id}`
      })
    }
    let changes = context.changes.map((data) => ({
      updatedKey: data.updatedKey,
      value: data.value
    }))
    let params = { endpointId: endpoint.id }
    for (const change of changes) {
      if (change.updatedKey === restApi.updateKey.endpointId) {
        params.newEndpoint = change.value
      } else if (change.updatedKey === restApi.updateKey.profileId) {
        params.profile = change.value
      } else if (change.updatedKey === restApi.updateKey.networkId) {
        params.network = change.value
      }
    }
    params.parent =
      parentEndpointIdentifier == null ? null : parentEndpointIdentifier
    if (parentEndpointIdentifier != null) {
      let parentRef = await configurationApi.readParentEndpointRef(
        db,
        parentEndpointIdentifier,
        request.zapSessionId
      )
      params.parentId = parentRef
      if (parentRef == null) {
        parentEndpointIdentifier = null
        params.parent = null
      }
    }
    await configurationApi.executeRequest(
      db,
      request,
      'endpoint.update',
      params
    )
    let validationData = await configurationApi.validateEndpoint(db, context.id)
    response.status(StatusCodes.OK).json({
      endpointId: context.id,
      changes: context.changes,
      validationIssues: validationData,
      parentEndpointIdentifier: parentEndpointIdentifier
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
  return async (request, response) => {
    let { name, deviceTypeRef, deviceIdentifier, deviceVersion } = request.body
    let outcome = await configurationApi.executeRequest(
      db,
      request,
      'endpointtype.create',
      {
        name: name,
        deviceTypeRef: deviceTypeRef,
        deviceVersion: deviceVersion
      }
    )
    response.status(StatusCodes.OK).json({
      id: outcome.id,
      name: name,
      deviceTypeRef: deviceTypeRef,
      deviceTypeIdentifier: deviceIdentifier,
      deviceTypeVersion: deviceVersion
    })
  }
}

/**
 * Handles the HTTP GET request to retrieve the root node.
 *
 * @param {Object} db - The database connection object.
 * @returns {Function} - An async function that handles the HTTP request and response.
 */
function httpGetInitialComposition(db) {
  return async (request, response) => {
    let sessionId = request.zapSessionId
    let rootNode = await configurationApi.readInitialComposition(db, sessionId)
    response.status(StatusCodes.OK).json(rootNode)
  }
}

/**
 * HTTP POST: endpoint type update
 *
 * @param {*} db
 * @returns callback for the express uri registration
 */
function httpPatchEndpointType(db) {
  return async (request, response) => {
    let context = request.body
    let changes = context.changes.map((data) => ({
      key: data.updatedKey,
      value: data.value,
      type: ''
    }))

    await configurationApi.executeRequest(db, request, 'endpointtype.update', {
      endpointTypeId: context.endpointTypeId,
      changes: changes
    })

    response.status(StatusCodes.OK).json({
      endpointTypeId: context.endpointTypeId,
      changes: context.changes
    })
  }
}
exports.get = [
  {
    uri: restApi.uri.loadComposition,
    callback: httpGetInitialComposition
  }
]
exports.post = [
  {
    uri: restApi.uri.endpoint,
    callback: httpPostEndpoint
  },
  {
    uri: restApi.uri.endpointType,
    callback: httpPostEndpointType
  }
]

exports.patch = [
  {
    uri: restApi.uri.endpoint,
    callback: httpPatchEndpoint
  },
  {
    uri: restApi.uri.endpointType,
    callback: httpPatchEndpointType
  }
]

exports.delete = [
  {
    uri: restApi.uri.endpoint,
    callback: httpDeleteEndpoint
  },
  {
    uri: restApi.uri.endpointType,
    callback: httpDeleteEndpointType
  }
]
