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

const templateUtil = require('./template-util.js')
const queryImpexp = require('../db/query-impexp.js')
/**
 * Creates block iterator helper over the endpoint types.
 *
 * @param {*} options
 */
function user_endpoint_types(options) {
  return queryImpexp
    .exportEndpointTypes(this.global.db, this.global.sessionId)
    .then((endpointTypes) =>
      templateUtil.collectBlocks(endpointTypes, options.fn, this)
    )
}
/**
 * Creates cluster iterator over the endpoint types.
 *
 * @param {*} options
 */
function user_clusters(options) {
  return queryImpexp
    .exportClustersFromEndpointType(this.global.db, this.endpointTypeId)
    .then((endpointClusters) =>
      templateUtil.collectBlocks(endpointClusters, options.fn, this)
    )
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.user_endpoint_types = user_endpoint_types
exports.user_clusters = user_clusters
