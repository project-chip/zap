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
 * This module provides queries related to imports and exports of files.
 *
 * @module DB API: package-based queries.
 */
const dbApi = require('./db-api.js')
const dbMapping = require('./db-mapping.js')

/**
 * Exports packages for externalized form.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise of a data that is listing all the packages in the session.
 */
function exportPackagesFromSession(db, sessionId) {
  var mapFunction = (x) => {
    return {
      path: x.PATH,
      version: x.VERSION,
      type: x.TYPE,
    }
  }
  return dbApi
    .dbAll(
      db,
      `
SELECT 
  PACKAGE.PATH,
  PACKAGE.VERSION,
  PACKAGE.TYPE
FROM PACKAGE
INNER JOIN SESSION_PACKAGE
ON PACKAGE.PACKAGE_ID = SESSION_PACKAGE.PACKAGE_REF
WHERE SESSION_PACKAGE.SESSION_REF = ?`,
      [sessionId]
    )
    .then((rows) => rows.map(mapFunction))
}

/**
 * Exports clusters to an externalized form.
 *
 * @param {*} db
 * @param {*} endpointTypeId
 * @returns Promise that resolves with the data that should go into the external form.
 */
function exportClustersFromEndpointType(db, endpointTypeId) {
  var mapFunction = (x) => {
    return {
      name: x.NAME,
      code: x.CODE,
      mfgCode: x.MANUFACTURER_CODE,
      side: x.SIDE,
    }
  }

  return dbApi
    .dbAll(
      db,
      `
SELECT 
  CLUSTER.CODE, 
  CLUSTER.MANUFACTURER_CODE,
  CLUSTER.NAME,
  ENDPOINT_TYPE_CLUSTER.SIDE
FROM CLUSTER
INNER JOIN ENDPOINT_TYPE_CLUSTER
ON CLUSTER.CLUSTER_ID = ENDPOINT_TYPE_CLUSTER.CLUSTER_REF
WHERE ENDPOINT_TYPE_CLUSTER.ENABLED = 1 AND ENDPOINT_TYPE_CLUSTER.ENDPOINT_TYPE_REF = ?`,
      [endpointTypeId]
    )
    .then((rows) => rows.map(mapFunction))
}

exports.exportClustersFromEndpointType = exportClustersFromEndpointType
exports.exportPackagesFromSession = exportPackagesFromSession
