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
const queryZcl = require('../db/query-zcl.js')
const bin = require('../util/bin.js')
const types = require('../util/types.js')

/**
 * Returns number of endpoint types.
 *
 * @param {*} options
 * @returns number of endpoint types
 */
function endpoint_type_count(options) {
  return this.endpointTypes.length
}
/**
 * Returns number of endpoints.
 *
 * @param {*} options
 * @returns number of endpoints
 */
function endpoint_count(options) {
  return this.endpoints.length
}
/**
 * Creates array of endpointId fields on endpoints
 *
 * @param {*} options
 * @returns C array including the { } brackets
 */
function endpoint_fixed_endpoint_array(options) {
  var epIds = []
  this.endpoints.forEach((ep) => {
    epIds.push('0x' + bin.int16ToHex(ep.endpointId))
  })
  return '{ ' + epIds.join(', ') + ' }'
}

/**
 * Creates array of profileId fields on endpoints
 *
 * @param {*} options
 * @returns C array including the { } brackets
 */
function endpoint_fixed_profile_id_array(options) {
  var profileIds = []
  this.endpoints.forEach((ep) => {
    profileIds.push('0x' + bin.int16ToHex(parseInt(ep.profileId)))
  })
  return '{ ' + profileIds.join(', ') + ' }'
}

/**
 * Creates array of networkId fields on endpoints
 *
 * @param {*} options
 * @returns C array including the { } brackets
 */
function endpoint_fixed_network_array(options) {
  return '{ ' + this.endpoints.map((ep) => ep.networkId).join(', ') + ' }'
}

/**
 * Each element of an array contains an index into the
 * endpoint type array, for the appropriate endpoint.
 *
 * @param {*} options
 * @returns C array of indexes, one for each endpoint.
 */
function endpoint_fixed_endpoint_type_array(options) {
  var indexes = []
  for (var i = 0; i < this.endpoints.length; i++) {
    var epType = this.endpoints[i].endpointTypeRef
    var index = -1
    for (var j = 0; j < this.endpointTypes.length; j++) {
      if (epType == this.endpointTypes[j].id) {
        index = j
      }
    }
    indexes.push(index)
  }
  return '{ ' + indexes.join(', ') + ' }'
}

function createMfgCodes(codeIndexPairs) {
  var ret = '{ \\ \n'
  if (codeIndexPairs.length == 0) {
    ret = ret.concat('  { 0x00, 0x00 } \\\n')
  } else {
    codeIndexPairs.forEach((c) => {
      ret = ret.concat(`  { ${c.index}, ${c.mfgCode} }\\\n`)
    })
  }
  return ret.concat('}\n')
}

/**
 * Generates array of { index , mfgCode } pairs, matching
 * the indexes in attribute table.
 *
 * @param {*} options
 * @returns manufacturer code array
 */
function endpoint_attribute_manufacturer_codes(options) {
  return createMfgCodes(this.attributeMfgCodes)
}

function endpoint_attribute_manufacturer_code_count(options) {
  return this.attributeMfgCodes.length
}

function endpoint_command_manufacturer_codes(options) {
  return createMfgCodes(this.commandMfgCodes)
}

function endpoint_command_manufacturer_code_count(options) {
  return this.commandMfgCodes.length
}

function endpoint_cluster_manufacturer_codes(options) {
  return createMfgCodes(this.clusterMfgCodes)
}

function endpoint_cluster_manufacturer_code_count(options) {
  return this.clusterMfgCodes.length
}

function endpoint_largest_attribute_size(options) {
  return this.largestAttribute
}

function endpoint_singletons_size(options) {
  return this.singletonsSize
}

function endpoint_total_storage_size(options) {
  return this.totalAttributeSize
}

function endpoint_command_count(options) {
  return this.commandList.length
}

function endpoint_types_list(options) {
  var ret = '{ \\ \n'
  this.endpointList.forEach((ep) => {
    ret = ret.concat(
      `  { ZAP_CLUSTER_INDEX(${ep.clusterIndex}), ${ep.clusterCount}, ${ep.attributeSize} } \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_cluster_count(options) {
  return this.clusterList.length
}

function endpoint_cluster_list(options) {
  var ret = '{ \\ \n'
  this.clusterList.forEach((c) => {
    ret = ret.concat(
      `  { ${c.clusterId}, ZAP_ATTRIBUTE_INDEX(${c.attributeIndex}), ${c.attributeCount}, ${c.mask}, ${c.functions} } /* ${c.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_command_list(options) {
  var ret = '{ \\ \n'
  this.commandList.forEach((cmd) => {
    ret = ret.concat(
      `  { ${cmd.clusterId}, ${cmd.commandId}, ${cmd.mask} } /* ${cmd.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_attribute_count(options) {
  return this.attributeList.length
}

function endpoint_attribute_list(options) {
  var ret = '{ \\ \n'
  this.attributeList.forEach((at) => {
    ret = ret.concat(
      `  { ${at.id}, ${at.type}, ${at.size}, ${at.mask}, ${at.defaultValue} } /* ${at.comment} */  \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_fixed_device_id_array(options) {
  return (
    '{ ' + this.deviceList.map((device) => device.deviceId).join(', ') + ' }'
  )
}

function endpoint_fixed_device_version_array(options) {
  return (
    '{ ' +
    this.deviceList.map((device) => device.deviceVersion).join(', ') +
    ' }'
  )
}

function endpoint_attribute_min_max_count(options) {
  return this.minMaxList.length
}

function endpoint_attribute_min_max_list(options) {
  var ret = '{ \\ \n'
  this.minMaxList.forEach((mm) => {
    ret = ret.concat(
      `  { ${mm.default}, ${mm.min}, ${mm.max} } /* ${mm.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_reporting_config_defaults(options) {
  var ret = '{ \\ \n'
  this.reportList.forEach((r) => {
    ret = ret.concat(
      `  { ZAP_REPORT_DIRECTION(${r.direction}), ${r.endpoint}, ${r.clusterId}, ${r.attributeId}, ${r.mask}, ${r.mfgCode}, ${r.minOrSource}, ${r.maxOrEndpoint}, ${r.reportableChangeOrTimeout} } /* ${r.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_reporting_config_default_count(options) {
  return this.reportList.length
}

function endpoint_attribute_long_defaults(options) {
  var littleEndian = true
  if (options.hash.endian == 'big') {
    littleEndian = false
  }
  var ret = '{ \\ \n'
  this.longDefaultsList.forEach((ld) => {
    var def
    if (def == null) {
      def = '0x00, '.repeat(ld.size)
    } else {
      def = bin.hexToCBytes(ld.value)
    }
    ret = ret.concat(
      `  ${def}  /* ${ld.comment}, ${
        littleEndian ? 'little-endian' : 'big-endian'
      } */ \\\n`
    )
  })
  return ret.concat('}\n')
}

/**
 * Attribute collection works like this:
 *    1.) Go over all the clusters that exist.
 *    2.) If client is included on at least one endpoint add client atts.
 *    3.) If server is included on at least one endpoint add server atts.
 */
function collectAttributes(endpointTypes) {
  var commandMfgCodes = [] // Array of { index, mfgCode } objects
  var clusterMfgCodes = [] // Array of { index, mfgCode } objects
  var attributeMfgCodes = [] // Array of { index, mfgCode } objects
  var attributeList = []
  var commandList = []
  var endpointList = [] // Array of { clusterIndex, clusterCount, attributeSize }
  var clusterList = [] // Array of { clusterId, attributeIndex, attributeCount, mask, functions, comment }
  var longDefaults = [] // Array of strings representing bytes
  var longDefaultsIndex = 0
  var largestAttribute = 0
  var singletonsSize = 0
  var totalAttributeSize = 0
  var clusterIndex = 0
  var deviceList = [] // Array of { deviceId, deviceVersion }
  var minMaxList = [] // Array of { default, min, max }
  var reportList = [] // Array of { direction, endpoint, clusterId, attributeId, mask, mfgCode, minOrSource, maxOrEndpoint, reportableChangeOrTimeout }
  var longDefaultsList = [] // Array if { value, size. comment }

  endpointTypes.forEach((ept) => {
    var endpoint = {
      clusterIndex: clusterIndex,
      clusterCount: 0,
      attributeSize: 0,
    }

    var device = {
      deviceId: 0,
      deviceVersion: 1,
    }

    deviceList.push(device)
    endpointList.push(endpoint)

    var clusterCount = 0
    // Go over all the clusters in the endpoint and add them to the list.
    ept.clusters.forEach((c) => {
      var cluster = {
        clusterId: 0,
        attributeIndex: 0,
        attributeCount: 0,
        mask: 0,
        functions: 'NULL',
        comment: `Endpoint: ${ept.endpointId}, Cluster: ${c.clusterRef}`,
      }
      clusterList.push(cluster)
      clusterIndex++
      clusterCount++
    })
    endpoint.clusterCount = clusterCount

    // Go over the commands
    ept.commands.forEach((cmd) => {
      var cmd = {
        clusterId: 0,
        commandId: cmd.id,
        mask: 0,
        comment: 'Command',
      }
      commandList.push(cmd)
    })

    // Go over all the attributes in the endpoint and add them to the list.
    ept.attributes.forEach((a) => {
      if (a.attribute == null) return
      var attributeDefaultValue = 0
      if (a.typeSize > 2) {
        // We will need to generate the GENERATED_DEFAULTS
        attributeDefaultValue = `ZAP_LONG_DEFAULTS_INDEX(${longDefaultsIndex})`
        longDefaults.push(a)
        longDefaultsIndex += a.typeSize
        var longDef = {
          value: a.attribute.defaultValue,
          size: a.typeSize,
          comment: `Default for attribute ${a.attribute.label}`,
        }
        longDefaultsList.push(longDef)
      }
      if (a.isBounded) {
        var minMax = {
          default: '0',
          min: '0',
          max: '10',
          comment: `Attribute: ${a.attribute.label}`,
        }
        minMaxList.push(minMax)
      }
      if (a.isReportable) {
        var rpt = {
          direction: 'REPORTED', // or 'RECEIVED'
          endpoint: 0,
          clusterId: 1,
          attributeId: 2,
          mask: 12,
          mfgCode: 0,
          minOrSource: 44,
          maxOrEndpoint: 34,
          reportableChangeOrTimeout: 0,
        }
        reportList.push(rpt)
      }
      if (a.typeSize > largestAttribute) {
        largestAttribute = a.typeSize
      }
      if (a.isSingleton) {
        singletonsSize += a.typeSize
      }
      totalAttributeSize += a.typeSize
      var attr = {
        id: a.attribute.code, // attribute code
        type: `ZAP_TYPE(${a.attribute.type.toUpperCase()})`, // type
        size: a.typeSize, // size
        mask: [], // array of special properties
        defaultValue: attributeDefaultValue, // default value, pointer to default value, or pointer to min/max/value triplet.
        comment: `${a.attribute.label}`,
      }
      attributeList.push(attr)
    })
  })
  return Promise.resolve({
    endpointList: endpointList,
    clusterList: clusterList,
    attributeList: attributeList,
    commandList: commandList,
    longDefaults: longDefaults,
    clusterMfgCodes: clusterMfgCodes,
    commandMfgCodes: commandMfgCodes,
    attributeMfgCodes: attributeMfgCodes,
    largestAttribute: largestAttribute,
    singletonsSize: singletonsSize,
    totalAttributeSize: totalAttributeSize,
    deviceList: deviceList,
    minMaxList: minMaxList,
    reportList: reportList,
    longDefaultsList: longDefaultsList,
  })
}

/**
 * Starts the endpoint configuration block.,
 * longDefaults: longDefaults
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
  var promise = templateUtil
    .ensureZclPackageId(newContext)
    .then(() => queryConfig.getAllEndpoints(db, sessionId))
    .then((endpoints) => {
      newContext.endpoints = endpoints
      var endpointTypeIds = []
      endpoints.forEach((ep) => {
        endpointTypeIds.push(ep.endpointTypeRef)
      })
      return endpointTypeIds
    })
    .then((endpointTypeIds) => {
      var endpointTypePromises = []
      endpointTypeIds.forEach((eptId) => {
        endpointTypePromises.push(queryConfig.getEndpointType(db, eptId))
      })
      return Promise.all(endpointTypePromises)
    })
    .then((endpointTypes) => {
      var promises = []
      newContext.endpointTypes = endpointTypes
      endpointTypes.forEach((ept) => {
        var id = ept.id
        promises.push(
          queryConfig
            .getEndpointTypeAttributes(db, id)
            .then((attributes) => (ept.attributes = attributes))
            .then((attributes) => {
              var ps = []
              attributes.forEach((at) => {
                if (at.isIncluded) {
                  ps.push(
                    queryZcl
                      .selectAttributeById(db, at.attributeId)
                      .then((a) => (at.attribute = a))
                      .then((a) => {
                        if (a)
                          return types.typeSize(
                            db,
                            newContext.global.zclPackageId,
                            a.type
                          )
                        else return null
                      })
                      .then((size) => (at.typeSize = size))
                  )
                }
              })
              return Promise.all(ps)
            })
        )
        promises.push(
          queryConfig
            .getEndpointTypeCommands(db, id)
            .then((commands) => (ept.commands = commands))
        )
        promises.push(
          queryConfig.getEndpointTypeClusters(db, id).then((clusters) => {
            ept.clusters = clusters.filter((c) => c.enabled)
          })
        )
        promises.push(
          queryConfig.getEndpointTypeCommands(db, id).then((commands) => {
            ept.commands = commands
          })
        )
      })
      return Promise.all(promises).then(() => endpointTypes)
    })
    .then((endpointTypes) => collectAttributes(endpointTypes))
    .then((collection) => {
      Object.assign(newContext, collection)
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

exports.endpoint_attribute_long_defaults = endpoint_attribute_long_defaults
exports.endpoint_config = endpoint_config
exports.endpoint_attribute_min_max_list = endpoint_attribute_min_max_list
exports.endpoint_attribute_min_max_count = endpoint_attribute_min_max_count
exports.endpoint_attribute_list = endpoint_attribute_list
exports.endpoint_attribute_count = endpoint_attribute_count
exports.endpoint_cluster_list = endpoint_cluster_list
exports.endpoint_cluster_count = endpoint_cluster_count
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
exports.endpoint_command_list = endpoint_command_list
exports.endpoint_command_count = endpoint_command_count
exports.endpoint_reporting_config_defaults = endpoint_reporting_config_defaults
exports.endpoint_reporting_config_default_count = endpoint_reporting_config_default_count
exports.endpoint_count = endpoint_count
