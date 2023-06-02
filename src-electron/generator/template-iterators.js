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

const dbEnums = require('../../src-shared/db-enum')
const querySessionZcl = require('../db/query-session-zcl')
const queryEndpointType = require('../db/query-endpoint-type')

/**
 * @module JS API: template iterators.
 */

// this structure links the names of iterators with the function.
const iterators = {}
iterators[dbEnums.iteratorValues.availableCluster] = availableClusterIterator
iterators[dbEnums.iteratorValues.selectedCluster] = selectedClusterIterator
iterators[dbEnums.iteratorValues.selectedServerCluster] =
  selectedServerClusterIterator
iterators[dbEnums.iteratorValues.selectedClientCluster] =
  selectedClientClusterIterator

// Iterator over all available clusters
async function availableClusterIterator(db, sessionId) {
  return querySessionZcl.selectAllSessionClusters(db, sessionId)
}

// Iterator over all selected clusters
async function selectedClusterIterator(db, sessionId) {
  let epts = await queryEndpointType.selectEndpointTypeIds(db, sessionId)
  return queryEndpointType.selectAllClustersDetailsFromEndpointTypes(db, epts)
}

// Iterator over all selected client clusters
async function selectedClientClusterIterator(db, sessionId) {
  let epts = await queryEndpointType.selectEndpointTypeIds(db, sessionId)
  return queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
    db,
    epts,
    dbEnums.side.client
  )
}

// Iterator over all selected server clusters
async function selectedServerClusterIterator(db, sessionId) {
  let epts = await queryEndpointType.selectEndpointTypeIds(db, sessionId)
  return queryEndpointType.selectAllClustersDetailsFromEndpointTypes(
    db,
    epts,
    dbEnums.side.server
  )
}

// Function that returns a given iteration array for a given iterator name.
async function getIterativeObject(iteratorName, db, sessionId) {
  let fn = iterators[iteratorName]
  if (fn != null) {
    return fn(db, sessionId)
  } else {
    let validValues = Object.keys(iterators).join(', ')
    throw new Error(
      `Invalid value for iterator: ${iteratorName}. Valid values: ${validValues}`
    )
  }
}

exports.getIterativeObject = getIterativeObject
