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

const queryEndpointType = require('../db/query-endpoint-type.js')
const queryEndpoint = require('../db/query-endpoint.js')
const queryConfig = require('../db/query-config.js')
const querySession = require('../db/query-session.js')
const queryPackage = require('../db/query-package.js')
const validation = require('../validation/validation.js')
const restApi = require('../../src-shared/rest-api.js')
const notification = require('../db/query-session-notification.js')
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
    let removed = await queryEndpoint.deleteEndpoint(db, id)

    response.status(StatusCodes.OK).json({
      successful: removed > 0,
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
    let removed = await queryEndpointType.deleteEndpointType(db, id)
    response.status(StatusCodes.OK).json({
      successful: removed > 0,
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
    let sessionId = request.zapSessionId
    let parentEndpointRef = await queryEndpoint.getParentEndpointRef(
      db,
      parentEndpointIdentifier,
      sessionId
    )
    if (parentEndpointRef == null && parentEndpointIdentifier != null) {
      parentEndpointIdentifier = null
    }
    let newId = await queryEndpoint.insertEndpoint(
      db,
      sessionId,
      endpointId,
      endpointType,
      networkId,
      profileId,
      parentEndpointRef
    )
    try {
      let validationData = await validation.validateEndpoint(db, newId)
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
    let sessionIdexport = request.zapSessionId
    let parentEndpointIdentifier = context.parentEndpointIdentifier
    let parentEndpointRef = await queryEndpoint.getParentEndpointRef(
      db,
      parentEndpointIdentifier,
      sessionIdexport
    )
    if (parentEndpointRef == null && parentEndpointIdentifier != null) {
      parentEndpointIdentifier = null
    }
    await queryConfig.updateParentEndpoint(
      db,
      sessionIdexport,
      context.id,
      parentEndpointRef
    )
    let changes = context.changes.map((data) => {
      let paramType = ''
      return {
        key: data.updatedKey,
        value: data.value,
        type: paramType
      }
    })
    await queryConfig.updateEndpoint(db, sessionIdexport, context.id, changes)
    let validationData = await validation.validateEndpoint(db, context.id)
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
    let sessionId = request.zapSessionId
    // Get session partition given the device type reference
    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromDeviceType(
        db,
        sessionId,
        deviceTypeRef
      )
    try {
      let newId = await queryConfig.insertEndpointType(
        db,
        sessionPartitionInfo[0],
        name,
        deviceTypeRef,
        deviceIdentifier,
        deviceVersion
      )

      response.status(StatusCodes.OK).json({
        id: newId,
        name: name,
        deviceTypeRef: deviceTypeRef,
        deviceTypeIdentifier: deviceVersion,
        deviceTypeVersion: deviceVersion
      })
    } catch (err) {
      response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err)
    }
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
    let packages = await queryPackage.getPackageSessionPackagePairBySessionId(
      db,
      sessionId
    )
    let packageIds = packages.map((item) => item.pkg.id)
    let rootNode = await queryEndpoint.getRootNode(db, packageIds)
    response.status(StatusCodes.OK).json(rootNode[0])
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
    let sessionId = request.zapSessionId
    // Changes may include device type refs, versions or identifiers
    let changes = context.changes.map((data) => {
      let paramType = ''
      return {
        key: data.updatedKey,
        value: data.value,
        type: paramType
      }
    })

    await queryConfig.updateEndpointType(
      db,
      sessionId,
      context.endpointTypeId,
      changes
    )

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
