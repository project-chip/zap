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

// Finds the cluster database primary key from code and context.
async function findClusterId(context, code) {
  let sessionId = sessionId(context)
  querySession.get
  return 0
}

// Non-public, common function to modify cluster.
async function modifyCluster(context, endpoint, code, side, enabled) {
  let clusterId = await findClusterId(context, code)
  return queryConfig.insertOrReplaceClusterState(
    context.db,
    endpoint.endpointTypeRef,
    clusterId,
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

async function disableServerCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.server, false)
}

async function enableClientCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.client, true)
}

async function enableServerCluster(context, endpoint, code) {
  return modifyCluster(context, endpoint, code, dbEnum.side.server, true)
}

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
