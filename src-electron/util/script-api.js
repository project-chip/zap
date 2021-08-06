/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * This module contains the API functions for the post-load
 * scripting functionality.
 *
 *  @module JS API: post-import.
 */
const queryEndpoint = require('../db/query-endpoint.js')
const queryConfig = require('../db/query-config.js')
const dbEnum = require('../../src-shared/db-enum.js')
const queryPackage = require('../db/query-package.js')
const querySessionZcl = require('../db/query-session-zcl.js')

/**
 * Prints a text to console.
 *
 * @param {*} text
 */
function print(text) {
  console.log(text)
}

/**
 * Returns an array of endpoints.
 *
 * @param {*} context
 */
function endpoints(context) {
  return queryEndpoint.selectAllEndpoints(context.db, context.sessionId)
}

/**
 * Deletes an endpoint
 *
 * @param {*} context
 * @param {*} endpoint
 */
function deleteEndpoint(context, endpoint) {
  return queryEndpoint.deleteEndpoint(context.db, endpoint.id)
}

/**
 * Returns an array of clusters defined on a given endpoint.
 *
 * @param {*} context
 * @param {*} endpoint
 */
function clusters(context, endpoint) {
  return queryEndpoint.selectEndpointClusters(
    context.db,
    endpoint.endpointTypeRef
  )
}

/**
 * Returns an array of attributes for a given cluster.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} cluster
 */
function attributes(context, endpoint, cluster) {
  return queryEndpoint.selectEndpointClusterAttributes(
    context.db,
    cluster.clusterId,
    cluster.side,
    endpoint.endpointTypeRef
  )
}

/**
 * Returns an array of commands for a given cluster
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} cluster
 */
function commands(context, endpoint, cluster) {
  return queryEndpoint.selectEndpointClusterCommands(
    context.db,
    cluster.clusterId,
    endpoint.endpointTypeRef
  )
}

/**
 * Returns array of function names available in this module.
 */
function functions() {
  return Object.keys(exports)
}

/**
 * Returns the session id in the context.
 *
 * @param {*} context
 * @returns sessionId
 */
function sessionId(context) {
  return context.sessionId
}

/**
 * Returns all available clusters.
 *
 * @param {*} context
 * @returns all available clusters
 */
async function availableClusters(context) {
  return querySessionZcl.selectAllSessionClusters(context.db, context.sessionId)
}

// Finds the cluster database primary key from code and context.
async function findCluster(context, code) {
  return querySessionZcl.selectSessionClusterByCode(
    context.db,
    context.sessionId,
    code
  )
}

// Non-public, common function to modify cluster.
async function modifyCluster(context, endpoint, code, side, enabled) {
  let cluster = await findCluster(context, code)
  if (cluster == null) return null
  return queryConfig.insertOrReplaceClusterState(
    context.db,
    endpoint.endpointTypeRef,
    cluster.id,
    side,
    enabled
  )
}

/**
 * Disables the client cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function disableClientCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.client, false)
}

/**
 * Disables the server cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function disableServerCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.server, false)
}

/**
 * Enables the client cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function enableClientCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.client, true)
}

/**
 * Enables the server cluster on an endpoint.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} code
 */
async function enableServerCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.server, true)
}

/**
 * Internal function that actually processes the attribute toggles.
 * @param {*} context
 * @param {*} endpoint
 * @param {*} clusterCode
 * @param {*} attributeCode
 * @param {*} side
 * @param {*} enable
 */
async function modifyAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode,
  side,
  enable
) {
  return
}

async function disableClientAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.client,
    false
  )
}

async function enableClientAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.client,
    true
  )
}

async function disableServerAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.server,
    false
  )
}

async function enableServerAttribute(
  context,
  endpoint,
  clusterCode,
  attributeCode
) {
  return modifyAttribute(
    context,
    endpoint,
    clusterCode,
    attributeCode,
    dbEnum.side.server,
    true
  )
}

async function modifyCommand(
  context,
  endpoint,
  clusterCode,
  commandCode,
  isIncoming,
  enable
) {}

async function disableIncomingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode
) {
  return modifyCommand(context, endpoint, clusterCode, commandCode, true, false)
}

async function enableIncomingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode
) {
  return modifyCommand(context, endpoint, clusterCode, commandCode, true, true)
}

async function disableOutgoingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode
) {
  return modifyCommand(
    context,
    endpoint,
    clusterCode,
    commandCode,
    false,
    false
  )
}

async function enableOutgoingCommand(
  context,
  endpoint,
  clusterCode,
  commandCode
) {
  return modifyCommand(context, endpoint, clusterCode, commandCode, false, true)
}

exports.availableClusters = availableClusters

exports.print = print
exports.functions = functions
exports.sessionId = sessionId

exports.endpoints = endpoints
exports.deleteEndpoint = deleteEndpoint

exports.clusters = clusters
exports.attributes = attributes
exports.commands = commands

exports.disableClientCluster = disableClientCluster
exports.disableServerCluster = disableServerCluster
exports.enableClientCluster = enableClientCluster
exports.enableServerCluster = enableServerCluster

exports.disableClientAttribute = disableClientAttribute
exports.enableClientAttribute = enableClientAttribute
exports.disableServerAttribute = disableServerAttribute
exports.enableServerAttribute = enableServerAttribute

exports.disableClientAttribute = disableClientAttribute
exports.enableClientAttribute = enableClientAttribute
exports.disableServerAttribute = disableServerAttribute
exports.enableServerAttribute = enableServerAttribute

exports.disableIncomingCommand = disableIncomingCommand
exports.enableIncomingCommand = enableIncomingCommand
exports.disableOutgoingCommand = disableOutgoingCommand
exports.enableOutgoingCommand = enableOutgoingCommand
