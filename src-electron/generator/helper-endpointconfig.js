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

const templateUtil = require('./template-util')
const queryConfig = require('../db/query-config.js')
const bin = require('../util/bin')

function endpoint_attribute_min_max_storage(options) {
  var ret = '// TODO: ' + options.name + '\n'
  this.attributes.forEach((at) => {
    ret = ret.concat(`min max: ${at.name} \n`)
  })
  return ret
}

function endpoint_type_count(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_count(options) {
  return this.endpoints.length
}

function endpoint_attribute_long_storage(options) {
  var littleEndian = true
  if (options.hash.endian == 'big') {
    littleEndian = false
  }
  var ret = '// TODO: ' + options.name + '\n'
  this.attributes.forEach((at) => {
    var def = at.defaultValue
    var cBytes = bin.hexToCBytes(def)
    ret = ret.concat(`${cBytes} \n`)
  })
  return ret
}

function endpoint_attribute_list(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_cluster_list(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_types_list(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_cluster_manufacturer_codes(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_cluster_manufacturer_code_count(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_attribute_manufacturer_codes(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_attribute_manufacturer_code_count(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_command_manufacturer_codes(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_command_manufacturer_code_count(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_largest_attribute_size(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_singletons_size(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_total_storage_size(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_fixed_endpoint_array(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_fixed_endpoint_type_array(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_fixed_device_id_array(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_fixed_device_version_array(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_fixed_profile_id_array(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_fixed_network_array(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_commands(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_command_count(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

function endpoint_reporting_config_defaults(options) {
  var ret = '// TODO: ' + options.name + '\n'
  return ret
}

function endpoint_reporting_config_default_count(options) {
  var ret = '// TODO: ' + options.name
  return ret
}

/**
 * Starts the endpoint configuration block.
 *
 * @param {*} options
 * @returns a promise of a rendered block
 */
function endpoint_config(options) {
  var newContext = {
    global: this.global,
    parent: this,
  }
  var db = this.global.db
  var sessionId = this.global.sessionId
  var promise = queryConfig
    .getAllEndpoints(db, sessionId)
    .then((endpoints) => {
      newContext.endpoints = endpoints
    })
    .then(() =>
      queryConfig.getAllSessionAttributes(this.global.db, this.global.sessionId)
    )
    .then((atts) => {
      newContext.attributes = atts // TODO: Put attributes into the context
    })
    .then(() => options.fn(newContext))
  return templateUtil.templatePromise(this.global, promise)
}

exports.endpoint_attribute_long_storage = endpoint_attribute_long_storage
exports.endpoint_config = endpoint_config
exports.endpoint_attribute_min_max_storage = endpoint_attribute_min_max_storage
exports.endpoint_attribute_list = endpoint_attribute_list
exports.endpoint_cluster_list = endpoint_cluster_list
exports.endpoint_types_list = endpoint_types_list
exports.endpoint_type_count = endpoint_type_count
exports.endpoint_cluster_manufacturer_codes = endpoint_cluster_manufacturer_codes
exports.endpoint_cluster_manufacturer_code_count = endpoint_cluster_manufacturer_code_count
exports.endpoint_command_manufacturer_codes = endpoint_command_manufacturer_codes
exports.endpoint_command_manufacturer_code_count = endpoint_command_manufacturer_code_count
exports.endpoint_attribute_manufacturer_codes = endpoint_attribute_manufacturer_codes
exports.endpoint_attribute_manufacturer_code_count = endpoint_attribute_manufacturer_code_count
exports.endpoint_largest_attribute_size = endpoint_largest_attribute_size
exports.endpoint_total_storage_size = endpoint_total_storage_size
exports.endpoint_singletons_size = endpoint_singletons_size
exports.endpoint_fixed_endpoint_array = endpoint_fixed_endpoint_array
exports.endpoint_fixed_endpoint_type_array = endpoint_fixed_endpoint_type_array
exports.endpoint_fixed_device_id_array = endpoint_fixed_device_id_array
exports.endpoint_fixed_device_version_array = endpoint_fixed_device_version_array
exports.endpoint_fixed_profile_id_array = endpoint_fixed_profile_id_array
exports.endpoint_fixed_network_array = endpoint_fixed_network_array
exports.endpoint_commands = endpoint_commands
exports.endpoint_command_count = endpoint_command_count
exports.endpoint_reporting_config_defaults = endpoint_reporting_config_defaults
exports.endpoint_reporting_config_default_count = endpoint_reporting_config_default_count
exports.endpoint_count = endpoint_count
