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
const queryEndpoint = require('../db/query-endpoint.js')
const bin = require('../util/bin.js')
const types = require('../util/types.js')
const dbEnum = require('../../src-shared/db-enum.js')
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
  var ret = '{ \\\n'
  if (codeIndexPairs.length == 0) {
    ret = ret.concat('  { 0x00, 0x00 } \\\n')
  } else {
    codeIndexPairs.forEach((c) => {
      ret = ret.concat(`  { ${c.index}, ${c.mfgCode} },\\\n`)
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
  var ret = '{ \\\n'
  this.endpointList.forEach((ep) => {
    ret = ret.concat(
      `  { ZAP_CLUSTER_INDEX(${ep.clusterIndex}), ${ep.clusterCount}, ${ep.attributeSize} }, \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_cluster_count(options) {
  return this.clusterList.length
}

function endpoint_cluster_list(options) {
  var ret = '{ \\\n'
  this.clusterList.forEach((c) => {
    ret = ret.concat(
      `  { ${c.clusterId}, ZAP_ATTRIBUTE_INDEX(${c.attributeIndex}), ${c.attributeCount}, ${c.attributeSize}, ${c.mask}, ${c.functions} }, /* ${c.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_command_list(options) {
  var ret = '{ \\\n'
  this.commandList.forEach((cmd) => {
    var mask = ''
    if (cmd.mask.length == 0) {
      mask = '0'
    } else {
      mask = cmd.mask
        .map((m) => `ZAP_COMMAND_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    ret = ret.concat(
      `  { ${cmd.clusterId}, ${cmd.commandId}, ${mask} }, /* ${cmd.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_attribute_count(options) {
  return this.attributeList.length
}

function endpoint_attribute_list(options) {
  var ret = '{ \\\n'
  this.attributeList.forEach((at) => {
    var mask = ''
    if (at.mask.length == 0) {
      mask = '0'
    } else {
      mask = at.mask
        .map((m) => `ZAP_ATTRIBUTE_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    // If no default value is found, default to 0
    if (!at.defaultValue) {
      at.defaultValue = '0'
    }
    ret = ret.concat(
      `  { ${at.id}, ${at.type}, ${at.size}, ${mask}, { (uint8_t *) ${at.defaultValue} } }, /* ${at.comment} */  \\\n`
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
  var ret = '{ \\\n'
  this.minMaxList.forEach((mm) => {
    ret = ret.concat(
      `  { ${mm.default}, ${mm.min}, ${mm.max} } /* ${mm.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_reporting_config_defaults(options) {
  var ret = '{ \\\n'
  this.reportList.forEach((r) => {
    var mask = ''
    if (r.mask.length == 0) {
      mask = '0'
    } else {
      mask = r.mask
        .map((m) => `ZAP_CLUSTER_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    ret = ret.concat(
      `  { ZAP_REPORT_DIRECTION(${r.direction}), ${r.endpoint}, ${r.clusterId}, ${r.attributeId}, ${mask}, ${r.mfgCode}, {{ ${r.minOrSource}, ${r.maxOrEndpoint}, ${r.reportableChangeOrTimeout} }} }, /* ${r.comment} */ \\\n`
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
  var ret = '{ \\\n'
  this.longDefaultsList.forEach((ld) => {
    ret = ret.concat(
      `  ${ld.value}  /* ${ld.comment}, ${
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
  var clusterList = [] // Array of { clusterId, attributeIndex, attributeCount, attributeSize, mask, functions, comment }
  var longDefaults = [] // Array of strings representing bytes
  var longDefaultsIndex = 0
  var minMaxIndex = 0
  var largestAttribute = 0
  var singletonsSize = 0
  var totalAttributeSize = 0
  var clusterAttributeSize = 0
  var endpointAttributeSize = 0
  var clusterIndex = 0
  var deviceList = [] // Array of { deviceId, deviceVersion }
  var minMaxList = [] // Array of { default, min, max }
  var reportList = [] // Array of { direction, endpoint, clusterId, attributeId, mask, mfgCode, minOrSource, maxOrEndpoint, reportableChangeOrTimeout }
  var longDefaultsList = [] // Array if { value, size. comment }

  endpointTypes.forEach((ept) => {
    var endpoint = {
      clusterIndex: clusterIndex,
      clusterCount: ept.clusters.length,
      attributeSize: 0,
    }

    var device = {
      deviceId: 0,
      deviceVersion: 1,
    }
    endpointAttributeSize = 0
    deviceList.push(device)

    // Go over all the clusters in the endpoint and add them to the list.
    var attributeIndex = 0
    ept.clusters.forEach((c) => {
      var cluster = {
        clusterId: c.hexCode,
        attributeIndex: attributeIndex,
        attributeCount: c.attributes.length,
        attributeSize: 0,
        mask: 0,
        functions: 'NULL',
        comment: `Endpoint: ${ept.endpointId}, Cluster: ${c.name} (${c.side})`,
      }
      clusterAttributeSize = 0

      clusterIndex++
      attributeIndex += c.attributes.length

      // Go over all the attributes in the endpoint and add them to the list.
      c.attributes.forEach((a) => {
        var attributeDefaultValue = a.defaultValue
        if (a.typeSize > 2) {
          // We will need to generate the GENERATED_DEFAULTS
          longDefaults.push(a)
          var def = types.longTypeDefaultValue(
            a.typeSize,
            a.type,
            a.defaultValue
          )
          var longDef = {
            value: def,
            size: a.typeSize,
            comment: `Default for cluster: "${c.name}", attribute: "${a.name}". side: ${a.side}`,
          }
          attributeDefaultValue = `ZAP_LONG_DEFAULTS_INDEX(${longDefaultsIndex})`
          longDefaultsList.push(longDef)
          longDefaultsIndex += a.typeSize
        }
        if (a.isBound) {
          var minMax = {
            default: a.defaultValue,
            min: a.min,
            max: a.max,
            comment: `Attribute: ${a.name}`,
          }
          attributeDefaultValue = `ZAP_MIN_MAX_DEFAULTS_INDEX(${minMaxIndex})`
          minMaxList.push(minMax)
          minMaxIndex++
        }
        var rptMask = [c.side]
        if (a.includedReportable) {
          var rpt = {
            direction: 'REPORTED', // or 'RECEIVED'
            endpoint: '0x' + bin.int16ToHex(ept.endpointId),
            clusterId: c.hexCode,
            attributeId: a.hexCode,
            mask: rptMask,
            mfgCode:
              a.manufacturerCode == null
                ? '0x0000'
                : '0x' + bin.int16ToHex(a.manufacturerCode),
            minOrSource: a.minInterval,
            maxOrEndpoint: a.maxInterval,
            reportableChangeOrTimeout: a.reportableChange,
            comment: `Reporting for cluster: "${c.name}", attribute: "${a.name}". side: ${a.side}`,
          }
          reportList.push(rpt)
        }
        if (a.typeSize > largestAttribute) {
          largestAttribute = a.typeSize
        }
        if (a.isSingleton) {
          singletonsSize += a.typeSize
        }
        clusterAttributeSize += a.typeSize
        totalAttributeSize += a.typeSize
        var mask = []
        if (a.side == dbEnum.side.client) {
          mask.push('client')
        }
        if (a.isSingleton) mask.push('singleton')
        var attr = {
          id: a.hexCode, // attribute code
          type: `ZAP_TYPE(${a.type.toUpperCase()})`, // type
          size: a.typeSize, // size
          mask: mask, // array of special properties
          defaultValue: attributeDefaultValue, // default value, pointer to default value, or pointer to min/max/value triplet.
          comment: `${c.name} (${c.side}): ${a.name}`,
        }
        attributeList.push(attr)
      })
      // Go over the commands
      c.commands.forEach((cmd) => {
        var mask = []
        if (cmd.isOptional) {
          if (cmd.isIncoming) {
            if (c.side == dbEnum.side.server) mask.push('incoming_server')
            else mask.push('incoming_client')
          }
          if (cmd.isOutgoing) {
            if (c.side == dbEnum.side.server) mask.push('outgoing_server')
            else mask.push('outgoing_client')
          }
        } else {
          if (cmd.source == dbEnum.source.client) {
            mask.push('incoming_server')
          } else {
            mask.push('incoming_client')
          }
        }
        var command = {
          clId: c.code, // for sorting
          cmId: cmd.code, // for sorting
          clusterId: c.hexCode,
          commandId: cmd.hexCode,
          mask: mask,
          comment: `${c.name} (${c.side}): ${cmd.name}`,
        }
        commandList.push(command)
      })
      endpointAttributeSize += clusterAttributeSize
      cluster.attributeSize = clusterAttributeSize
      clusterList.push(cluster)
    })
    endpoint.attributeSize = endpointAttributeSize
    endpointList.push(endpoint)
  })

  // Sort command list by clusterId / commandId
  commandList.sort((a, b) => {
    if (a.clId != b.clId) {
      return a.clId - b.clId
    } else if (a.cmId != b.cmId) {
      return a.cmId - b.cmId
    } else {
      if (a.comment < b.comment) return -1
      else if (a.comment > b.comment) return 1
      else return 0
    }
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
 * This function goes over all the attributes and populates sizes.
 *
 * @param {*} endpointTypes
 * @returns promise that resolves with the passed endpointTypes, after populating the attribute type sizes.
 *
 */
function collectAttributeSizes(db, zclPackageId, endpointTypes) {
  var ps = []
  endpointTypes.forEach((ept) => {
    ept.clusters.forEach((cl) => {
      cl.attributes.forEach((at) => {
        ps.push(
          types
            .typeSizeAttribute(
              db,
              zclPackageId,
              at,
              `ERROR: ${at.name}, invalid size, ${at.type}`
            )
            .then((size) => {
              at.typeSize = size
            })
        )
      })
    })
  })
  return Promise.all(ps).then(() => endpointTypes)
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
    .then(() => queryEndpoint.queryEndpoints(db, sessionId))
    .then((endpoints) => {
      newContext.endpoints = endpoints
      var endpointTypeIds = []
      endpoints.forEach((ep) => {
        endpointTypeIds.push({
          endpointTypeId: ep.endpointTypeRef,
          endpointIdentifier: ep.endpointId,
        })
      })
      return endpointTypeIds
    })
    .then((endpointTypeIds) => {
      var endpointTypePromises = []
      endpointTypeIds.forEach((eptId) => {
        endpointTypePromises.push(
          queryEndpoint
            .queryEndpointType(db, eptId.endpointTypeId)
            .then((ept) => {
              ept.endpointId = eptId.endpointIdentifier
              return ept
            })
        )
      })
      return Promise.all(endpointTypePromises)
    })
    .then((endpointTypes) => {
      var promises = []
      newContext.endpointTypes = endpointTypes
      endpointTypes.forEach((ept) => {
        promises.push(
          queryEndpoint.queryEndpointClusters(db, ept.id).then((clusters) => {
            ept.clusters = clusters // Put 'clusters' into endpoint
            var ps = []
            clusters.forEach((cl) => {
              ps.push(
                queryEndpoint
                  .queryEndpointClusterAttributes(
                    db,
                    cl.clusterId,
                    cl.side,
                    ept.id
                  )
                  .then((attributes) => {
                    cl.attributes = attributes
                  })
              )
              ps.push(
                queryEndpoint
                  .queryEndpointClusterCommands(db, cl.clusterId, ept.id)
                  .then((commands) => {
                    cl.commands = commands
                  })
              )
            })
            return Promise.all(ps)
          })
        )
      })
      return Promise.all(promises).then(() => endpointTypes)
    })
    .then((endpointTypes) =>
      collectAttributeSizes(db, this.global.zclPackageId, endpointTypes)
    )
    .then((endpointTypes) => collectAttributes(endpointTypes))
    .then((collection) => {
      Object.assign(newContext, collection)
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
