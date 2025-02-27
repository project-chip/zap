/**
 *
 *    Copyright (c) 2025 Silicon Labs
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
 * This module provides helper functions for conformance-related operations.
 *
 * @module Conformance API: conformance helper functions
 */

const queryAttribute = require('../db/query-attribute')
const queryCommand = require('../db/query-command')
const queryEvent = require('../db/query-event')

/**
 * Get all attributes, commands and events in an endpoint type cluster.
 * @param {*} db
 * @param {*} endpointTypeClusterId
 * @param {*} deviceTypeClusterId
 * @returns elements object containing all attributes, commands and events
 * in an endpoint type cluster
 */
async function getEndpointTypeElements(
  db,
  endpointTypeClusterId,
  deviceTypeClusterId
) {
  let [attributes, commands, events] = await Promise.all([
    queryAttribute.selectAttributesByEndpointTypeClusterIdAndDeviceTypeClusterId(
      db,
      endpointTypeClusterId,
      deviceTypeClusterId
    ),
    queryCommand.selectCommandsByEndpointTypeClusterIdAndDeviceTypeClusterId(
      db,
      endpointTypeClusterId,
      deviceTypeClusterId
    ),
    queryEvent.selectEventsByEndpointTypeClusterIdAndDeviceTypeClusterId(
      db,
      endpointTypeClusterId,
      deviceTypeClusterId
    )
  ])
  return { attributes, commands, events }
}

exports.getEndpointTypeElements = getEndpointTypeElements
