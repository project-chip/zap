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
const queryEndpointType = require('../db/query-endpoint-type.js')
const bin = require('../util/bin.js')
const types = require('../util/types.js')
const zclUtil = require('../util/zcl-util.js')
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
 * Prints out all the macros that the endpoint config
 * configuration depends on. These macros are created
 * by ZAP, because the use of these macros is also
 * created by ZAP.
 *
 * @returns Macros that need to be created
 */
function endpoint_config_macros(options) {
  let longDef = options.hash.longDefaults
  let minMaxDef = options.hash.minMaxDefaults
  if (longDef == null) longDef = 'def_long_defaults'
  if (minMaxDef == null) minMaxDef = 'def_minmax_defaults'

  return `
#define ZAP_TYPE(type) ZCL_ ## type ## _ATTRIBUTE_TYPE
#define ZAP_LONG_DEFAULTS_INDEX(index) {(uint8_t*)(&${longDef}[index])}
#define ZAP_MIN_MAX_DEFAULTS_INDEX(index) {(uint8_t*)(&${minMaxDef}[index])}
#define ZAP_EMPTY_DEFAULT() {(uint8_t*) 0}
#define ZAP_SIMPLE_DEFAULT(x) {(uint8_t *) x}
`
}

/**
 * Creates array of endpointId fields on endpoints
 *
 * @param {*} options
 * @returns C array including the { } brackets
 */
function endpoint_fixed_endpoint_array(options) {
  let epIds = []
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
  let profileIds = []
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
  let indexes = []
  for (const ep of this.endpoints) {
    let epType = ep.endpointTypeRef
    let index = -1
    for (let j = 0; j < this.endpointTypes.length; j++) {
      if (epType == this.endpointTypes[j].id) {
        index = j
      }
    }
    indexes.push(index)
  }
  return '{ ' + indexes.join(', ') + ' }'
}

function createMfgCodes(codeIndexPairs) {
  let ret = '{ \\\n'
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
  return this.largestAttribute + 1
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
  let ret = '{ \\\n'
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
  let ret = '{ \\\n'
  this.clusterList.forEach((c) => {
    let mask = ''
    if (c.mask.length == 0) {
      mask = '0'
    } else {
      mask = c.mask
        .map((m) => `ZAP_CLUSTER_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    ret = ret.concat(
      `  { ${c.clusterId}, ZAP_ATTRIBUTE_INDEX(${c.attributeIndex}), ${c.attributeCount}, ${c.attributeSize}, ${mask}, ${c.functions} }, /* ${c.comment} */ \\\n`
    )
  })
  return ret.concat('}\n')
}

function endpoint_command_list(options) {
  let comment = null

  let ret = '{ \\\n'
  this.commandList.forEach((cmd) => {
    if (cmd.comment != comment) {
      ret += `\\\n  /* ${cmd.comment} */ \\\n`
      comment = cmd.comment
    }

    let mask = ''
    if (cmd.mask.length == 0) {
      mask = '0'
    } else {
      mask = cmd.mask
        .map((m) => `ZAP_COMMAND_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    ret += `  { ${cmd.clusterId}, ${cmd.commandId}, ${mask} }, /* ${cmd.name} */ \\\n`
  })
  ret += '}\n'

  return ret
}

function endpoint_attribute_count(options) {
  return this.attributeList.length
}

function endpoint_attribute_list(options) {
  let comment = null

  let littleEndian = true
  let pointerSize = 4
  if (options.hash.endian == 'big') {
    littleEndian = false
    if (typeof options.hash.pointer != 'undefined') {
      pointerSize = options.hash.pointer
    }
  }

  let ret = '{ \\\n'
  this.attributeList.forEach((at) => {
    if (at.comment != comment) {
      ret += `\\\n  /* ${at.comment} */ \\\n`
      comment = at.comment
    }

    let mask = ''
    if (at.mask.length == 0) {
      mask = '0'
    } else {
      mask = at.mask
        .map((m) => `ZAP_ATTRIBUTE_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    // If no default value is found, default to 0
    let finalDefaultValue
    if (!at.defaultValue) {
      finalDefaultValue = `ZAP_EMPTY_DEFAULT()`
    } else if (at.isMacro) {
      finalDefaultValue = at.defaultValue
    } else {
      let defaultValue = at.defaultValue
      if (!littleEndian) {
        defaultValue = Number(defaultValue)
          .toString(16)
          .padStart(6, '0x0000')
          .padEnd(2 + 2 * pointerSize, '0')
      }
      finalDefaultValue = `ZAP_SIMPLE_DEFAULT(${defaultValue})`
    }
    ret += `  { ${at.id}, ${at.type}, ${at.size}, ${mask}, ${finalDefaultValue} }, /* ${at.name} */  \\\n`
  })
  ret += '}\n'

  return ret
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
  let comment = null

  let ret = '{ \\\n'
  this.minMaxList.forEach((mm, index) => {
    if (mm.comment != comment) {
      ret += `\\\n  /* ${mm.comment} */ \\\n`
      comment = mm.comment
    }

    let def = parseInt(mm.default)
    let min = parseInt(mm.min)
    let max = parseInt(mm.max)

    if (isNaN(def)) def = 0
    if (isNaN(min)) min = 0
    if (isNaN(max)) max = 0xffff
    let defS =
      (def >= 0 ? '' : '-') + '0x' + Math.abs(def).toString(16).toUpperCase()
    let minS =
      (min >= 0 ? '' : '-') + '0x' + Math.abs(min).toString(16).toUpperCase()
    let maxS =
      (max >= 0 ? '' : '-') + '0x' + Math.abs(max).toString(16).toUpperCase()
    ret += `  { (uint8_t*)${defS}, (uint8_t*)${minS}, (uint8_t*)${maxS} }${
      index == this.minMaxList.length - 1 ? '' : ','
    } /* ${mm.name} */ \\\n`
  })
  ret += '}\n'

  return ret
}

function endpoint_reporting_config_defaults(options) {
  let comment = null

  let ret = '{ \\\n'
  this.reportList.forEach((r) => {
    if (r.comment != comment) {
      ret += `\\\n  /* ${r.comment} */ \\\n`
      comment = r.comment
    }

    let mask = ''
    if (r.mask.length == 0) {
      mask = '0'
    } else {
      mask = r.mask
        .map((m) => `ZAP_CLUSTER_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    ret += `  { ZAP_REPORT_DIRECTION(${r.direction}), ${r.endpoint}, ${r.clusterId}, ${r.attributeId}, ${mask}, ${r.mfgCode}, {{ ${r.minOrSource}, ${r.maxOrEndpoint}, ${r.reportableChangeOrTimeout} }} }, /* ${r.name} */ \\\n`
  })
  ret += '}\n'

  return ret
}

function endpoint_reporting_config_default_count(options) {
  return this.reportList.length
}

function endpoint_attribute_long_defaults_count(options) {
  return this.longDefaultsList.length
}

function endpoint_attribute_long_defaults(options) {
  let comment = null

  let littleEndian = true
  if (options.hash.endian == 'big') {
    littleEndian = false
  }

  let ret = '{ \\\n'
  this.longDefaultsList.forEach((ld) => {
    if (ld.comment != comment) {
      ret += `\\\n  /* ${ld.comment}, ${
        littleEndian ? 'little-endian' : 'big-endian'
      } */\\\n\\\n`
      comment = ld.comment
    }
    ret += `  /* ${ld.index} - ${ld.name}, */\\\n  ${ld.value}\\\n\\\n`
  })
  ret += '}\n'

  return ret
}

/**
 * Attribute collection works like this:
 *    1.) Go over all the clusters that exist.
 *    2.) If client is included on at least one endpoint add client atts.
 *    3.) If server is included on at least one endpoint add server atts.
 */
async function collectAttributes(endpointTypes) {
  let commandMfgCodes = [] // Array of { index, mfgCode } objects
  let clusterMfgCodes = [] // Array of { index, mfgCode } objects
  let attributeMfgCodes = [] // Array of { index, mfgCode } objects
  let attributeList = []
  let commandList = []
  let endpointList = [] // Array of { clusterIndex, clusterCount, attributeSize }
  let clusterList = [] // Array of { clusterId, attributeIndex, attributeCount, attributeSize, mask, functions, comment }
  let longDefaults = [] // Array of strings representing bytes
  let longDefaultsIndex = 0
  let minMaxIndex = 0
  let largestAttribute = 0
  let singletonsSize = 0
  let totalAttributeSize = 0
  let clusterAttributeSize = 0
  let endpointAttributeSize = 0
  let clusterIndex = 0
  let deviceList = [] // Array of { deviceId, deviceVersion }
  let minMaxList = [] // Array of { default, min, max }
  let reportList = [] // Array of { direction, endpoint, clusterId, attributeId, mask, mfgCode, minOrSource, maxOrEndpoint, reportableChangeOrTimeout }
  let longDefaultsList = [] // Array of { value, size. comment }
  let attributeIndex = 0

  endpointTypes.forEach((ept) => {
    let endpoint = {
      clusterIndex: clusterIndex,
      clusterCount: ept.clusters.length,
      attributeSize: 0,
    }

    let device = {
      deviceId: 0,
      deviceVersion: 1,
    }
    endpointAttributeSize = 0
    deviceList.push(device)

    // Go over all the clusters in the endpoint and add them to the list.

    ept.clusters.sort(zclUtil.clusterComparator)

    ept.clusters.forEach((c) => {
      let cluster = {
        clusterId: c.hexCode,
        clusterName: c.name,
        clusterSide: c.side,
        attributeIndex: attributeIndex,
        attributeCount: c.attributes.length,
        attributeSize: 0,
        mask: [],
        functions: 'NULL',
        comment: `Endpoint: ${ept.endpointId}, Cluster: ${c.name} (${c.side})`,
      }
      clusterAttributeSize = 0
      cluster.mask.push(c.side)

      clusterIndex++
      attributeIndex += c.attributes.length

      c.attributes.sort(zclUtil.attributeComparator)

      // Go over all the attributes in the endpoint and add them to the list.
      c.attributes.forEach((a) => {
        let defaultValueIsMacro = false
        let attributeDefaultValue = a.defaultValue
        if (a.typeSize > 2) {
          // We will need to generate the GENERATED_DEFAULTS
          longDefaults.push(a)
          let def = types.longTypeDefaultValue(
            a.typeSize,
            a.type,
            a.defaultValue
          )
          let longDef = {
            value: def,
            size: a.typeSize,
            index: longDefaultsIndex,
            name: a.name,
            comment: cluster.comment,
          }
          attributeDefaultValue = `ZAP_LONG_DEFAULTS_INDEX(${longDefaultsIndex})`
          defaultValueIsMacro = true
          longDefaultsList.push(longDef)
          longDefaultsIndex += a.typeSize
        }
        if (a.isBound) {
          let minMax = {
            default: a.defaultValue,
            min: a.min,
            max: a.max,
            name: a.name,
            comment: cluster.comment,
          }
          attributeDefaultValue = `ZAP_MIN_MAX_DEFAULTS_INDEX(${minMaxIndex})`
          defaultValueIsMacro = true
          minMaxList.push(minMax)
          minMaxIndex++
        }
        let rptMask = [c.side]
        if (a.includedReportable) {
          let rpt = {
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
            name: a.name,
            comment: cluster.comment,
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
        let mask = []
        if (a.side == dbEnum.side.client) {
          mask.push('client')
        }
        if (a.storage == dbEnum.storageOption.nvm) {
          mask.push('TOKENIZE')
        }
        if (a.storage == dbEnum.storageOption.external) {
          mask.push('EXTERNAL_STORAGE')
        }
        if (a.isSingleton) mask.push('singleton')
        if (a.isWritable) mask.push('writable')
        let attr = {
          id: a.hexCode, // attribute code
          type: `ZAP_TYPE(${a.type.toUpperCase()})`, // type
          size: a.typeSize, // size
          mask: mask, // array of special properties
          defaultValue: attributeDefaultValue, // default value, pointer to default value, or pointer to min/max/value triplet.
          isMacro: defaultValueIsMacro,
          name: a.name,
          comment: cluster.comment,
        }
        attributeList.push(attr)

        if (a.manufacturerCode) {
          let att = {
            index: attributeList.indexOf(attr),
            mfgCode: a.manufacturerCode,
          }
          attributeMfgCodes.push(att)
        }
      })

      // Go over the commands
      c.commands.sort(zclUtil.commandComparator)

      c.commands.forEach((cmd) => {
        let mask = []
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
        let command = {
          clusterId: c.hexCode,
          commandId: cmd.hexCode,
          mask: mask,
          name: cmd.name,
          comment: cluster.comment,
        }
        commandList.push(command)

        if (cmd.manufacturerCode) {
          let mfgCmd = {
            index: commandList.length - 1,
            mfgCode: cmd.manufacturerCode,
          }
          commandMfgCodes.push(mfgCmd)
        }
      })
      endpointAttributeSize += clusterAttributeSize
      cluster.attributeSize = clusterAttributeSize
      clusterList.push(cluster)

      if (c.manufacturerCode) {
        let clt = {
          index: clusterList.length - 1,
          mfgCode: c.manufacturerCode,
        }
        clusterMfgCodes.push(clt)
      }
    })
    endpoint.attributeSize = endpointAttributeSize
    endpointList.push(endpoint)
  })

  return {
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
  }
}

/**
 * This function goes over all the attributes and populates sizes.
 *
 * @param {*} endpointTypes
 * @returns promise that resolves with the passed endpointTypes, after populating the attribute type sizes.
 *
 */
async function collectAttributeSizes(db, zclPackageId, endpointTypes) {
  let ps = []
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
  await Promise.all(ps)
  return endpointTypes
}

/**
 * Starts the endpoint configuration block.,
 * longDefaults: longDefaults
 *
 * @param {*} options
 * @returns a promise of a rendered block
 */
function endpoint_config(options) {
  let newContext = {
    global: this.global,
    parent: this,
  }
  let db = this.global.db
  let sessionId = this.global.sessionId
  let promise = templateUtil
    .ensureZclPackageId(newContext)
    .then(() => queryEndpoint.selectAllEndpoints(db, sessionId))
    .then((endpoints) => {
      newContext.endpoints = endpoints
      let endpointTypeIds = []
      endpoints.forEach((ep) => {
        endpointTypeIds.push({
          endpointTypeId: ep.endpointTypeRef,
          endpointIdentifier: ep.endpointId,
        })
      })
      return endpointTypeIds
    })
    .then((endpointTypeIds) => {
      let endpointTypePromises = []
      endpointTypeIds.forEach((eptId) => {
        endpointTypePromises.push(
          queryEndpointType
            .selectEndpointType(db, eptId.endpointTypeId)
            .then((ept) => {
              ept.endpointId = eptId.endpointIdentifier
              return ept
            })
        )
      })
      return Promise.all(endpointTypePromises)
    })
    .then((endpointTypes) => {
      let promises = []
      newContext.endpointTypes = endpointTypes
      endpointTypes.forEach((ept) => {
        promises.push(
          queryEndpoint.selectEndpointClusters(db, ept.id).then((clusters) => {
            ept.clusters = clusters // Put 'clusters' into endpoint
            let ps = []
            clusters.forEach((cl) => {
              ps.push(
                queryEndpoint
                  .selectEndpointClusterAttributes(
                    db,
                    cl.clusterId,
                    cl.side,
                    ept.id
                  )
                  .then((attributes) => {
                    // Keep only the enabled attributes
                    cl.attributes = attributes.filter((a) => a.isIncluded === 1)
                  })
              )
              ps.push(
                queryEndpoint
                  .selectEndpointClusterCommands(db, cl.clusterId, ept.id)
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

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.

exports.endpoint_attribute_long_defaults_count =
  endpoint_attribute_long_defaults_count
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
exports.endpoint_cluster_manufacturer_codes =
  endpoint_cluster_manufacturer_codes
exports.endpoint_cluster_manufacturer_code_count =
  endpoint_cluster_manufacturer_code_count
exports.endpoint_command_manufacturer_codes =
  endpoint_command_manufacturer_codes
exports.endpoint_command_manufacturer_code_count =
  endpoint_command_manufacturer_code_count
exports.endpoint_attribute_manufacturer_codes =
  endpoint_attribute_manufacturer_codes
exports.endpoint_attribute_manufacturer_code_count =
  endpoint_attribute_manufacturer_code_count
exports.endpoint_largest_attribute_size = endpoint_largest_attribute_size
exports.endpoint_total_storage_size = endpoint_total_storage_size
exports.endpoint_singletons_size = endpoint_singletons_size
exports.endpoint_fixed_endpoint_array = endpoint_fixed_endpoint_array
exports.endpoint_fixed_endpoint_type_array = endpoint_fixed_endpoint_type_array
exports.endpoint_fixed_device_id_array = endpoint_fixed_device_id_array
exports.endpoint_fixed_device_version_array =
  endpoint_fixed_device_version_array
exports.endpoint_fixed_profile_id_array = endpoint_fixed_profile_id_array
exports.endpoint_fixed_network_array = endpoint_fixed_network_array
exports.endpoint_command_list = endpoint_command_list
exports.endpoint_command_count = endpoint_command_count
exports.endpoint_reporting_config_defaults = endpoint_reporting_config_defaults
exports.endpoint_reporting_config_default_count =
  endpoint_reporting_config_default_count
exports.endpoint_count = endpoint_count
exports.endpoint_config_macros = endpoint_config_macros
