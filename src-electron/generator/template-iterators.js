/**
 *
 *    Copyright (c) 2023 Silicon Labs
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
 * @module JS API: template iterators.
 */

const dbEnums = require('../../src-shared/db-enum')
const querySessionZcl = require('../db/query-session-zcl')
const queryEndpointType = require('../db/query-endpoint-type')
const templateUtil = require('./template-util')

// this structure links the names of iterators with the function.
const iterators = {}
iterators[dbEnums.iteratorValues.availableCluster] = availableClusterIterator
iterators[dbEnums.iteratorValues.selectedCluster] = selectedClusterIterator
iterators[dbEnums.iteratorValues.selectedServerCluster] =
  selectedServerClusterIterator
iterators[dbEnums.iteratorValues.selectedClientCluster] =
  selectedClientClusterIterator

/**
 * Get all clusters available for a given session
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageCategory - ZCL package category to filter clusters by.
 * @returns promise of all clusters available for a given session
 */
async function availableClusterIterator(db, sessionId, packageCategory) {
  if (packageCategory) {
    return querySessionZcl.selectAllSessionClustersByCategory(
      db,
      sessionId,
      packageCategory
    )
  }
  return querySessionZcl.selectAllSessionClusters(db, sessionId)
}

/**
 * Iterator over all selected clusters.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageCategory - ZCL package category to filter endpoints by.
 * @returns Promise of all clusters in the (filtered) endpoint types.
 */
async function selectedClusterIterator(db, sessionId, packageCategory) {
  let epts = await queryEndpointType.selectEndpointTypeIds(db, sessionId)
  epts = await templateUtil.filterEndpointTypeIdsByCategory(
    db,
    epts,
    packageCategory
  )
  return queryEndpointType.selectAllClustersDetailsFromEndpointTypes(db, epts)
}

/**
 * Iterator over all selected client clusters.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageCategory - ZCL package category to filter endpoints by.
 * @returns Promise of all client clusters in the (filtered) endpoint types.
 */
async function selectedClientClusterIterator(db, sessionId, packageCategory) {
  let epts = await queryEndpointType.selectEndpointTypeIds(db, sessionId)
  epts = await templateUtil.filterEndpointTypeIdsByCategory(
    db,
    epts,
    packageCategory
  )
  return queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
    db,
    epts,
    dbEnums.side.client
  )
}

/**
 * Iterator over all selected server clusters.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageCategory - ZCL package category to filter endpoints by.
 * @returns Promise of all server clusters in the (filtered) endpoint types.
 */
async function selectedServerClusterIterator(db, sessionId, packageCategory) {
  let epts = await queryEndpointType.selectEndpointTypeIds(db, sessionId)
  epts = await templateUtil.filterEndpointTypeIdsByCategory(
    db,
    epts,
    packageCategory
  )
  return queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
    db,
    epts,
    dbEnums.side.server
  )
}

/**
 * Function that returns a given iteration array for a given iterator name.
 *
 * @param {*} iteratorName
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageCategory - e.g. "matter" or "zigbee"; passed to iterators
 *   that filter by ZCL package category. Null for single-protocol sessions.
 * @returns Iterator array
 */
async function getIterativeObject(
  iteratorName,
  db,
  sessionId,
  packageCategory
) {
  let fn = iterators[iteratorName]
  if (fn != null) {
    return fn(db, sessionId, packageCategory)
  } else {
    let validValues = Object.keys(iterators).join(', ')
    throw new Error(
      `Invalid value for iterator: ${iteratorName}. Valid values: ${validValues}`
    )
  }
}

exports.getIterativeObject = getIterativeObject
