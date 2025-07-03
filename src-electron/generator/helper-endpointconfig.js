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
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: Matter endpoint config helpers
 */

const cHelper = require('./helper-c.js')
const templateUtil = require('./template-util')
const queryEndpoint = require('../db/query-endpoint.js')
const queryEndpointType = require('../db/query-endpoint-type.js')
const queryPackage = require('../db/query-package.js')
const bin = require('../util/bin')
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
 * Creates Integer Array of parent endpoint identifier fields on endpoints. If the Parent Endpoint is not set then it will default to 0.
 *
 *
 * @returns C array including the { } brackets
 */
function endpoint_fixed_parent_id_array(options) {
  let parentIds = []
  this.endpoints.forEach((ep) => {
    if (ep.parentEndpointIdentifier == null) {
      parentIds.push('kInvalidEndpointId')
    } else {
      parentIds.push(ep.parentEndpointIdentifier)
    }
  })
  return '{ ' + parentIds.join(', ') + ' }'
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

/**
 * Get indexes and manufacturer code.
 *
 * @param {*} codeIndexPairs
 * @returns String
 */
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

/**
 * Get count of attributes with manufacturer code.
 *
 * @param {*} options
 * @returns Count of attributes with manufacturer code
 */
function endpoint_attribute_manufacturer_code_count(options) {
  return this.attributeMfgCodes.length
}

/**
 * Get all command manufacturer codes.
 * @param {*} options
 * @returns all command manufacturer codes
 */
function endpoint_command_manufacturer_codes(options) {
  return createMfgCodes(this.commandMfgCodes)
}

/**
 * Get count of commands with manufacturer code.
 *
 * @param {*} options
 * @returns Count of commands with manufacturer code
 */
function endpoint_command_manufacturer_code_count(options) {
  return this.commandMfgCodes.length
}

/**
 * Get all cluster manufacturer codes.
 * @param {*} options
 * @returns all cluster manufacturer codes
 */
function endpoint_cluster_manufacturer_codes(options) {
  return createMfgCodes(this.clusterMfgCodes)
}

/**
 * Get count of clusters with manufacturer code.
 *
 * @param {*} options
 * @returns Count of clusters with manufacturer code
 */
function endpoint_cluster_manufacturer_code_count(options) {
  return this.clusterMfgCodes.length
}

/**
 * Get size of largest attribute.
 *
 * @param {*} options
 * @returns size of largest attribute
 */
function endpoint_largest_attribute_size(options) {
  return this.largestAttribute + 1
}

/**
 * Get cumulative size of all singleton endpoint type attributes.
 *
 * @param {*} options
 * @returns cumulative size of all singleton endpoint type attributes
 */
function endpoint_singletons_size(options) {
  return this.singletonsSize
}

/**
 * Get cumulative size of all endpoint type attributes.
 *
 * @param {*} options
 * @returns cumulative size of all endpoint type attributes
 */
function endpoint_total_storage_size(options) {
  return this.totalAttributeSize
}

/**
 * Get count of endpoint type commands.
 *
 * @param {*} options
 * @returns Count of endpoint type commands
 */
function endpoint_command_count(options) {
  return this.commandList.length
}

/**
 * Get endpoint type information.
 *
 * @param {*} options
 * @returns endpoint type information
 */
function endpoint_types_list(options) {
  let ret = '{ \\\n'
  this.endpointList.forEach((ep) => {
    ret = ret.concat(
      `  { ZAP_CLUSTER_INDEX(${ep.clusterIndex}), ${ep.clusterCount}, ${ep.attributeSize} }, \\\n`
    )
  })
  return ret.concat('}\n')
}

/**
 * Get count of endpoint type clusters.
 *
 * @param {*} options
 * @returns Count of endpoint type clusters
 */
function endpoint_cluster_count(options) {
  return this.clusterList.length
}

/**
 * Get endpoint type cluster information.
 *
 * @param {*} options
 * @returns endpoint type cluster information
 */
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

/**
 * Get endpoint type command information.
 *
 * @param {*} options
 * @returns endpoint type command information
 */
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

/**
 * Get count of endpoint type attributes.
 *
 * @param {*} options
 * @returns Count of endpoint type attributes
 */
function endpoint_attribute_count(options) {
  return this.attributeList.length
}

/**
 * Get endpoint type attribute information.
 *
 * @param {*} options
 * @returns endpoint type attribute information
 */
function endpoint_attribute_list(options) {
  let order = options.hash.order
  if (order == null || order.length == 0) {
    // This is the default value if none is specified
    order = 'id, type, size, mask, default'
  }
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
    let orderTokens = order.split(',').map((x) => (x ? x.trim() : ''))
    let items = []
    orderTokens.forEach((tok) => {
      switch (tok) {
        case 'default':
          items.push(finalDefaultValue)
          break
        case 'id':
          items.push(at.id)
          break
        case 'size':
          items.push(at.size)
          break
        case 'type':
          items.push(at.type)
          break
        case 'mask':
          items.push(mask)
          break
        default:
          throw new Error(`Unknown token '${tok}' in order optional argument`)
      }
    })

    ret += `  { ${items.join(', ')} }, /* ${at.name} */  \\\n`
  })
  ret += '}\n'

  return ret
}

/**
 * Extracting device versions and identifiers from endpoint types
 *
 * @param {*} context
 * @param {*} options
 * @returns list of device types
 */
async function device_list(context, options) {
  // Extracting device versions and identifiers from endpoint types
  let endpointTypes = context.endpointTypes
  let deviceList = []
  endpointTypes.forEach((ept) =>
    ept.deviceIdentifiers.forEach((dId, index) =>
      deviceList.push({
        endpointIdentifier: ept.endpointId,
        deviceId: dId,
        deviceVersion: ept.deviceVersions[index]
      })
    )
  )
  return deviceList
}

/**
 * Get all device types in the configuration.
 *
 * @param {*} options
 * @returns device types
 */
async function endpoint_fixed_device_type_array(options) {
  let deviceList = await device_list(this, options)
  let isEndpointIncluded =
    options.hash && options.hash.isEndpointIncluded
      ? options.hash.isEndpointIncluded
      : false
  let ret = '{'
  let wroteItem = false
  let endpointIdentifier = ''

  for (let i = 0; i < deviceList.length; i++) {
    if (deviceList[i] != null && deviceList[i].deviceId != null) {
      if (wroteItem) {
        ret += ','
      }
      endpointIdentifier = isEndpointIncluded
        ? ',' + deviceList[i].endpointIdentifier.toString()
        : ''
      ret +=
        '{' +
        '0x' +
        bin.int32ToHex(deviceList[i].deviceId) +
        ',' +
        deviceList[i].deviceVersion.toString() +
        endpointIdentifier +
        '}'
      wroteItem = true
    }
  }

  ret += '}'
  return ret
}

/**
 * Get device type offset per endpoint.
 *
 * @param {*} options
 * @returns Device type offset per endpoint
 */
async function endpoint_fixed_device_type_array_offsets(options) {
  let deviceList = await device_list(this, options)
  let ret = '{ '
  let currentOffset = 0
  let currentEndpoint = -1

  for (let i = 0; i < deviceList.length; i++) {
    if (
      currentEndpoint != -1 &&
      currentEndpoint == deviceList[i].endpointIdentifier
    ) {
      currentOffset += 1
      continue
    }
    if (i != 0) {
      ret += ','
    }

    ret += currentOffset.toString()

    if (deviceList[i] != null && deviceList[i].deviceId != null) {
      currentOffset += 1
    }
    currentEndpoint = deviceList[i].endpointIdentifier
  }

  ret += '}'
  return ret
}

/**
 * Get count of device types per endpoint.
 *
 * @param {*} options
 * @returns Count of device types per endpoint
 */
async function endpoint_fixed_device_type_array_lengths(options) {
  let deviceList = await device_list(this, options)
  let endpointDeviceLengthMap = {}
  let ret = '{ '

  for (let i = 0; i < deviceList.length; i++) {
    if (endpointDeviceLengthMap[deviceList[i].endpointIdentifier]) {
      endpointDeviceLengthMap[deviceList[i].endpointIdentifier] += 1
    } else {
      endpointDeviceLengthMap[deviceList[i].endpointIdentifier] = 1
    }
  }

  for (let i = 0; i < Object.keys(endpointDeviceLengthMap).length; i++) {
    if (i != 0) {
      ret += ','
    }
    ret += Object.values(endpointDeviceLengthMap)[i]
  }

  ret += '}'
  return ret
}

/**
 * Get count of total attributes with min max values listed.
 *
 * @param {*} options
 * @returns count of total attributes with min max values listed
 */
function endpoint_attribute_min_max_count(options) {
  return this.minMaxList.length
}

/**
 * Get all attributes with min max values defined.
 *
 * @param {*} options
 * @returns All attributes with min max values listed
 */
function endpoint_attribute_min_max_list(options) {
  let comment = null
  let order = options.hash.order
  if (order == null || order.length == 0) {
    order = 'def,min,max'
  }
  let ret = '{ \\\n'
  const category = options.data?.root?.global?.genTemplatePackage?.category
  this.minMaxList.forEach((mm, index) => {
    if (mm.typeSize > 2 && category === dbEnum.helperCategory.zigbee) {
      throw new Error(
        `Can't have min/max for attributes larger than 2 bytes like '${mm.name}'`
      )
    }
    if (mm.comment != comment) {
      ret += `\\\n  /* ${mm.comment} */ \\\n`
      comment = mm.comment
    }

    let def = parseInt(mm.default)
    let min = parseInt(mm.min)
    let max = parseInt(mm.max)

    if (isNaN(def)) def = 0
    if (isNaN(min)) min = 0
    if (isNaN(max)) max = '0x' + 'FF'.repeat(mm.typeSize)

    let defS =
      (def >= 0 ? '' : '-') + '0x' + Math.abs(def).toString(16).toUpperCase()
    let minS =
      (min >= 0 ? '' : '-') + '0x' + Math.abs(min).toString(16).toUpperCase()
    let maxS =
      (max >= 0 ? '' : '-') + '0x' + Math.abs(max).toString(16).toUpperCase()
    let defMinMaxItems = []
    order
      .split(',')
      .map((x) => (x ? x.trim() : ''))
      .forEach((tok) => {
        switch (tok) {
          case 'def':
            defMinMaxItems.push(
              `(${mm.isTypeSigned ? '' : 'u'}int${mm.typeSize * 8}_t)${defS}`
            )
            break
          case 'min':
            defMinMaxItems.push(
              `(${mm.isTypeSigned ? '' : 'u'}int${mm.typeSize * 8}_t)${minS}`
            )
            break
          case 'max':
            defMinMaxItems.push(
              `(${mm.isTypeSigned ? '' : 'u'}int${mm.typeSize * 8}_t)${maxS}`
            )
            break
        }
      })
    ret += `  { ${defMinMaxItems.join(', ')} }${
      index == this.minMaxList.length - 1 ? '' : ','
    } /* ${mm.name} */ \\\n`
  })
  ret += '}\n'

  return ret
}

/**
 * This helper supports an "order" CSV string, such as:
 *   "direction,endpoint,clusterId,attributeId,mask,mfgCode,minmax"
 * The string above is a default value, and it determines in what order are the fields generated.
 *
 * @param {*} options
 */
function endpoint_reporting_config_defaults(options) {
  let order = options.hash.order
  if (order == null || order.length == 0) {
    // This is the default value if none is specified
    order = 'direction,endpoint,clusterId,attributeId,mask,mfgCode,minmax'
  }
  let minmaxorder = options.hash.minmaxorder
  if (minmaxorder == null || minmaxorder.length == 0) {
    minmaxorder = 'min,max,change'
  }
  let comment = null

  let ret = '{ \\\n'
  this.reportList.forEach((r) => {
    if (r.comment != comment) {
      ret += `\\\n  /* ${r.comment} */ \\\n`
      comment = r.comment
    }

    let minmaxItems = []
    let minmaxToks = minmaxorder.split(',').map((x) => (x ? x.trim() : ''))
    minmaxToks.forEach((tok) => {
      switch (tok) {
        case 'min':
          minmaxItems.push(r.minOrSource)
          break
        case 'max':
          minmaxItems.push(r.maxOrEndpoint)
          break
        case 'change':
          minmaxItems.push(r.reportableChangeOrTimeout)
          break
      }
    })
    let minmax = minmaxItems.join(', ')
    let mask = ''
    if (r.mask.length == 0) {
      mask = '0'
    } else {
      mask = r.mask
        .map((m) => `ZAP_CLUSTER_MASK(${m.toUpperCase()})`)
        .join(' | ')
    }
    let orderTokens = order.split(',').map((x) => (x ? x.trim() : ''))
    let items = []
    orderTokens.forEach((tok) => {
      switch (tok) {
        case 'direction':
          items.push(`ZAP_REPORT_DIRECTION(${r.direction})`)
          break
        case 'endpoint':
          items.push(r.endpoint)
          break
        case 'clusterId':
          items.push(r.clusterId)
          break
        case 'attributeId':
          items.push(r.attributeId)
          break
        case 'mask':
          items.push(mask)
          break
        case 'mfgCode':
          items.push(r.mfgCode)
          break
        case 'minmax':
          items.push(`{{ ${minmax} }}`)
          break
        default:
          throw new Error(`Unknown token '${tok}' in order optional argument`)
      }
    })

    let singleRow = `  { ${items.join(', ')} }, /* ${r.name} */ \\\n`
    ret += singleRow
  })
  ret += '}\n'

  return ret
}

/**
 * Get count of total attributes with reporting enabled
 *
 * @param {*} options
 * @returns Count of total attributes with reporting enabled
 */
function endpoint_reporting_config_default_count(options) {
  return this.reportList.length
}

/**
 * Get long(size>2 bytes) attribute count.
 *
 * @param {*} options
 * @returns count of long attributes
 */
function endpoint_attribute_long_defaults_count(options) {
  return this.longDefaultsList.length
}

/**
 * Get long(size>2 bytes) attribute default values based on endianness.
 *
 * @param {*} options
 * @returns Long attribute's default values
 */
function endpoint_attribute_long_defaults(options) {
  let comment = null

  let littleEndian = true
  if (options.hash.endian == 'big') {
    littleEndian = false
  }

  let ret = '{ \\\n'
  this.longDefaultsList.forEach((ld) => {
    let value = ld.value
    if (littleEndian && !types.isString(ld.type)) {
      // ld.value is in big-endian order.  For types for which endianness
      // matters, we need to reverse it.
      let valArr = value.split(/\s*,\s*/).filter((s) => s.length != 0)
      valArr.reverse()
      value = valArr.join(', ') + ', '
    }
    if (ld.comment != comment) {
      ret += `\\\n  /* ${ld.comment}, ${
        littleEndian ? 'little-endian' : 'big-endian'
      } */\\\n\\\n`
      comment = ld.comment
    }
    ret += `  /* ${ld.index} - ${ld.name}, */\\\n  ${value}\\\n\\\n`
  })
  ret += '}\n'

  return ret
}

/**
 * Get 32 bit code from the given code and manufacturer code.
 * @param {*} manufacturerCode
 * @param {*} code
 * @returns 32 bit Hex Code.
 */
function asMEI(manufacturerCode, code) {
  // Left-shift (and for that matter bitwise or) produces a _signed_ 32-bit
  // number, which will probably be negative.  Force it to unsigned 32-bit using
  // >>> 0.
  return '0x' + bin.int32ToHex(((manufacturerCode << 16) | code) >>> 0)
}

/**
 * The representation of null depends on the type, so we can't use a single
 * macro that's defined elsewhere for "null value".
 * Get the default value of an attribute.
 * @param {*} specifiedDefault
 * @param {*} type
 * @param {*} typeSize
 * @param {*} isNullable
 * @param {*} db
 * @param {*} sessionId
 * @returns Attribute's default value
 */
async function determineAttributeDefaultValue(
  specifiedDefault,
  type,
  typeSize,
  isNullable,
  db,
  sessionId
) {
  if (specifiedDefault !== null || !isNullable) {
    return specifiedDefault
  }

  if (types.isString(type)) {
    // Handled elsewhere.
    return null
  }

  if (await types.isSignedInteger(db, sessionId, type)) {
    return '0x80' + '00'.repeat(typeSize - 1)
  }

  if (types.isFloat(type)) {
    // Not supported yet.
    throw new Error(
      "Don't know how to output a null default value for a float type"
    )
  }

  // Assume everything else is an unsigned integer.
  return '0x' + 'FF'.repeat(typeSize)
}

/**
 * Attribute collection works like this:
 *    1.) Go over all the clusters that exist.
 *    2.) If client is included on at least one endpoint add client atts.
 *    3.) If server is included on at least one endpoint add server atts.
 */
async function collectAttributes(
  db,
  sessionId,
  endpointTypes,
  options,
  zclPackageIds
) {
  let commandMfgCodes = [] // Array of { index, mfgCode } objects
  let clusterMfgCodes = [] // Array of { index, mfgCode } objects
  let attributeMfgCodes = [] // Array of { index, mfgCode } objects
  let eventList = []
  let attributeList = []
  let commandList = []
  let endpointList = [] // Array of { clusterIndex, clusterCount, attributeSize }
  let clusterList = [] // Array of { clusterId, attributeIndex, attributeCount, attributeSize, eventIndex, eventCount, mask, functions, comment }
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
  let eventIndex = 0
  let spaceForDefaultValue =
    options.spaceForDefaultValue !== undefined
      ? options.spaceForDefaultValue
      : 2

  for (let ept of endpointTypes) {
    let endpoint = {
      clusterIndex: clusterIndex,
      clusterCount: ept.clusters.length,
      attributeSize: 0
    }

    let device = {
      deviceId: ept.deviceIdentifier,
      deviceVersion: ept.deviceVersion
    }
    endpointAttributeSize = 0
    deviceList.push(device)

    // Go over all the clusters in the endpoint and add them to the list.

    ept.clusters.sort(zclUtil.clusterComparator)

    for (let c of ept.clusters) {
      let cluster = {
        endpointId: ept.endpointId,
        clusterId: asMEI(c.manufacturerCode, c.code),
        clusterName: c.name,
        clusterSide: c.side,
        attributeIndex: attributeIndex,
        attributeCount: c.attributes.length,
        attributeSize: 0,
        eventIndex: eventIndex,
        eventCount: c.events.length,
        mask: [],
        commands: [],
        functions: 'NULL',
        comment: `Endpoint: ${ept.endpointId}, Cluster: ${c.name} (${c.side})`
      }
      clusterAttributeSize = 0
      cluster.mask.push(c.side)

      clusterIndex++
      attributeIndex += c.attributes.length
      eventIndex += c.events.length

      c.attributes.sort(zclUtil.attributeComparator)

      // Go over all the attributes in the endpoint and add them to the list.
      for (let a of c.attributes) {
        // typeSize is the size of a buffer needed to hold the attribute, if
        // that's known.
        let typeSize = a.typeSize
        // defaultSize is the size of the attribute in the readonly defaults
        // store.
        let defaultSize = typeSize
        let attributeDefaultValue = await determineAttributeDefaultValue(
          a.defaultValue,
          a.type,
          typeSize,
          a.isNullable,
          db,
          sessionId
        )
        // Various types store the length of the actual content in bytes.
        // For those, we can size the default storage to be just big enough for
        // the actual default value.
        if (types.isOneBytePrefixedString(a.type)) {
          typeSize += 1
          defaultSize =
            (attributeDefaultValue ? attributeDefaultValue.length : 0) + 1
        } else if (types.isTwoBytePrefixedString(a.type)) {
          typeSize += 2
          defaultSize =
            (attributeDefaultValue ? attributeDefaultValue.length : 0) + 2
        }
        // storageSize is the size of the attribute in the read/write attribute
        // store.
        let storageSize = typeSize
        // External attributes should not take up space in the default store or
        // the read/write store.
        if (a.storage == dbEnum.storageOption.external) {
          storageSize = 0
          defaultSize = 0
          // Some external attributes do not have a usable typeSize
          // (e.g. structs or lists of structs); the value of typeSize in those
          // cases is an error string.  Use 0 in those cases.
          if (typeof typeSize == 'string') {
            typeSize = 0
          }
          // List-typed attributes don't have a useful typeSize no matter what.
          // typeSizeAttribute will return values here based on various XML bits
          // and ZAP file default values, but all of those have nothing to do
          // with the actual attribute.
          if (a.typeInfo.atomicType == 'array') {
            typeSize = 0
          }
          attributeDefaultValue = undefined
        }

        let defaultValueIsMacro = false
        // Zero-length strings can just use ZAP_EMPTY_DEFAULT() as the default
        // and don't need long defaults.  Similar for external strings.
        //
        // Apart from that, there are a few string cases that _could_ fit into our
        // default value as the size is determined by spaceForDefaultValue.  Some
        // example strings that would fit if spaceForDefaultValue were 2 bytes are:
        // a 1-char-long short string, or a null string.  But figuring out how
        // to produce a uint8_t* for those as a literal value is a pain, so just
        // force all non-external strings with a nonempty default value to use
        // long defaults.
        if (
          defaultSize > spaceForDefaultValue ||
          (types.isString(a.type) &&
            attributeDefaultValue !== undefined &&
            attributeDefaultValue !== '')
        ) {
          // We will need to generate the GENERATED_DEFAULTS
          longDefaults.push(a)

          let def
          if (
            types.isString(a.type) &&
            attributeDefaultValue === null &&
            a.isNullable
          ) {
            def = types.nullStringDefaultValue(a.type)
          } else {
            def = types.longTypeDefaultValue(
              defaultSize,
              a.type,
              attributeDefaultValue
            )
          }
          let longDef = {
            value: def,
            size: defaultSize,
            index: longDefaultsIndex,
            name: a.name,
            comment: cluster.comment,
            type: a.type
          }
          attributeDefaultValue = `ZAP_LONG_DEFAULTS_INDEX(${longDefaultsIndex})`
          defaultValueIsMacro = true
          longDefaultsList.push(longDef)
          longDefaultsIndex += defaultSize
        }
        let mask = []
        if ((a.min != null || a.max != null) && a.isWritable) {
          mask.push('min_max')
          let type_size_and_sign = await types.getSignAndSizeOfZclType(
            db,
            a.type,
            zclPackageIds
          )
          let min, max
          if (a.min != null) {
            min = a.min
          } else {
            if (type_size_and_sign.isTypeSigned) {
              // Signed min: -2^(typeSize*8-1)
              min = -(2 ** (typeSize * 8 - 1))
            } else {
              // Unsigned min: 0
              min = 0
            }
          }
          if (a.max != null) {
            max = a.max
          } else {
            if (type_size_and_sign.isTypeSigned) {
              // Signed max: 2^(typeSize*8-1) - 1
              max = 2 ** (typeSize * 8 - 1) - 1
            } else {
              // Unsigned max: 2^(typeSize*8) - 1
              max = 2 ** (typeSize * 8) - 1
            }
          }
          let minMax = {
            default: attributeDefaultValue,
            min: min,
            max: max,
            name: a.name,
            comment: cluster.comment,
            typeSize: typeSize,
            isTypeSigned: type_size_and_sign.isTypeSigned
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
            clusterId: asMEI(c.manufacturerCode, c.code),
            attributeId: asMEI(a.manufacturerCode, a.code),
            mask: rptMask,
            mfgCode:
              a.manufacturerCode == null
                ? '0x0000'
                : '0x' + bin.int16ToHex(a.manufacturerCode),
            minOrSource: a.minInterval,
            maxOrEndpoint: a.maxInterval,
            reportableChangeOrTimeout: a.reportableChange,
            name: a.name,
            comment: cluster.comment
          }
          reportList.push(rpt)
        }
        if (typeSize > largestAttribute) {
          largestAttribute = typeSize
        }
        if (a.isSingleton) {
          singletonsSize += storageSize
        }
        clusterAttributeSize += storageSize
        totalAttributeSize += storageSize
        if (a.side == dbEnum.side.client) {
          mask.push('client')
        }
        if (a.storage == dbEnum.storageOption.nvm) {
          mask.push('TOKENIZE')
        } else if (a.storage == dbEnum.storageOption.external) {
          mask.push('EXTERNAL_STORAGE')
        } else if (a.storage == dbEnum.storageOption.ram) {
          // Nothing to do
        } else {
          if (!options.allowUnknownStorageOption)
            throw new Error(
              `Unknown storage type "${a.storage}" for attribute "${
                a.name
              }" of cluster "${c.name}" on endpoint ${
                ept.endpointId
              }.  Valid values are: ${[
                dbEnum.storageOption.nvm,
                dbEnum.storageOption.external,
                dbEnum.storageOption.ram
              ]
                .map((s) => `"${s}"`)
                .join(', ')}`
            )
        }
        if (a.isSingleton) mask.push('singleton')
        if (a.isWritable) mask.push('writable')
        if (a.isNullable) mask.push('nullable')
        if (a.mustUseTimedWrite) mask.push('must_use_timed_write')
        let zap_type = 'UNKNOWN ATTRIBUTE TYPE'
        if (a.typeInfo.atomicType) {
          zap_type = a.typeInfo.atomicType
        } else if (a.typeInfo.type == dbEnum.zclType.struct) {
          zap_type = 'STRUCT'
        } else if (a.typeInfo.type == dbEnum.zclType.enum && a.typeInfo.size) {
          zap_type = 'ENUM' + a.typeInfo.size * 8
        } else if (
          a.typeInfo.type == dbEnum.zclType.bitmap &&
          a.typeInfo.size
        ) {
          zap_type = 'BITMAP' + a.typeInfo.size * 8
        }
        let attr = {
          id: asMEI(a.manufacturerCode, a.code), // attribute code
          type: `ZAP_TYPE(${cHelper.asDelimitedMacro(zap_type)})`, // type
          size: typeSize, // size
          mask: mask, // array of special properties
          defaultValue: attributeDefaultValue, // default value, pointer to default value, or pointer to min/max/value triplet.
          isMacro: defaultValueIsMacro,
          name: a.name,
          comment: cluster.comment
        }
        attributeList.push(attr)

        if (a.manufacturerCode) {
          let att = {
            index: attributeList.indexOf(attr),
            mfgCode: a.manufacturerCode
          }
          attributeMfgCodes.push(att)
        }
      }

      // Go over the commands
      c.commands.sort(zclUtil.commandComparator)

      c.commands.forEach((cmd) => {
        let mask = []
        // ZAP files can have nonsense incoming/outgoing values,
        // unfortunately, claiming that client-sourced commands are
        // incoming for a client-side cluster.  Make sure that we only
        // set the flags that actually make sense based on the command
        // and cluster instance we are looking at.
        if (
          cmd.source == dbEnum.source.client &&
          c.side == dbEnum.side.server &&
          cmd.isIncoming
        ) {
          mask.push('incoming_server')
        }
        if (
          cmd.source == dbEnum.source.client &&
          c.side == dbEnum.side.client &&
          cmd.isOutgoing
        ) {
          mask.push('outgoing_client')
        }
        if (
          cmd.source == dbEnum.source.server &&
          c.side == dbEnum.side.server &&
          cmd.isOutgoing
        ) {
          mask.push('outgoing_server')
        }
        if (
          cmd.source == dbEnum.source.server &&
          c.side == dbEnum.side.client &&
          cmd.isIncoming
        ) {
          mask.push('incoming_client')
        }
        let command = {
          endpointId: ept.endpointId,
          clusterId: asMEI(c.manufacturerCode, c.code),
          commandId: asMEI(cmd.manufacturerCode, cmd.code),
          mask: mask,
          name: cmd.name,
          comment: cluster.comment,
          responseName: cmd.responseName,
          responseId:
            cmd.responseRef !== null
              ? asMEI(cmd.responseManufacturerCode, cmd.responseCode)
              : null
        }
        commandList.push(command)
        cluster.commands.push(command)

        if (cmd.manufacturerCode) {
          let mfgCmd = {
            index: commandList.length - 1,
            mfgCode: cmd.manufacturerCode
          }
          commandMfgCodes.push(mfgCmd)
        }
      })

      // Go over the events
      c.events.sort(zclUtil.eventComparator)

      c.events.forEach((ev) => {
        let event = {
          eventId: asMEI(ev.manufacturerCode, ev.code),
          name: ev.name,
          comment: cluster.comment
        }
        eventList.push(event)
      })

      endpointAttributeSize += clusterAttributeSize
      cluster.attributeSize = clusterAttributeSize
      clusterList.push(cluster)

      if (c.manufacturerCode) {
        let clt = {
          index: clusterList.length - 1,
          mfgCode: c.manufacturerCode
        }
        clusterMfgCodes.push(clt)
      }
    }
    endpoint.attributeSize = endpointAttributeSize
    endpointList.push(endpoint)
  }

  return {
    endpointList: endpointList,
    clusterList: clusterList,
    attributeList: attributeList,
    commandList: commandList,
    eventList: eventList,
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
    longDefaultsList: longDefaultsList
  }
}

/**
 * This function goes over all the attributes and populates sizes.
 *
 * @param {*} db
 * @param {*} zclPackageIds
 * @param {*} endpointTypes
 * @returns promise that resolves with the passed endpointTypes, after populating the attribute type sizes.
 *
 */
async function collectAttributeSizes(db, zclPackageIds, endpointTypes) {
  let ps = []
  endpointTypes.forEach((ept) => {
    ept.clusters.forEach((cl) => {
      cl.attributes.forEach((at) => {
        ps.push(
          types
            .typeSizeAttribute(
              db,
              zclPackageIds,
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
 * This function goes over all attributes and populates atomic types.
 * @param {*} db
 * @param {*} zclPackageIds
 * @param {*} endpointTypes
 * @returns promise that resolves with the passed endpointTypes, after populating the attribute atomic types.
 *
 */
async function collectAttributeTypeInfo(db, zclPackageIds, endpointTypes) {
  let ps = []
  endpointTypes.forEach((ept) => {
    ept.clusters.forEach((cl) => {
      cl.attributes.forEach((at) => {
        ps.push(
          zclUtil.determineType(db, at.type, zclPackageIds).then((typeInfo) => {
            at.typeInfo = typeInfo
          })
        )
      })
    })
  })
  await Promise.all(ps)
  return endpointTypes
}

/**
 * Checks if global attribute is excluded from the meta data.
 *
 * @param {*} attr
 * @returns boolean
 */
function isGlobalAttrExcludedFromMetadata(attr) {
  // See Matter specification section "7.13. Global Elements".
  return (
    attr.manufacturerCode === null &&
    [0xfff8, 0xfff9, 0xfffa, 0xfffb].includes(attr.code)
  )
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
    parent: this
  }
  let db = this.global.db
  let sessionId = this.global.sessionId
  let collectAttributesOptions = {
    allowUnknownStorageOption:
      options.hash.allowUnknownStorageOption === 'false' ? false : true,
    spaceForDefaultValue: options.hash.spaceForDefaultValue
  }
  let promise = templateUtil
    .ensureZclPackageIds(newContext)
    .then(() =>
      queryPackage.getPackageByPackageId(
        newContext.global.db,
        newContext.global.genTemplatePackageId
      )
    )
    .then((templatePackage) =>
      templatePackage && templatePackage.category
        ? queryEndpoint.selectAllEndpointsBasedOnTemplateCategory(
            db,
            sessionId,
            templatePackage.category
          )
        : queryEndpoint.selectAllEndpoints(db, sessionId)
    )
    .then((endpoints) => {
      newContext.endpoints = endpoints
      let endpointTypeIds = []
      endpoints.forEach((ep) => {
        endpointTypeIds.push({
          deviceIdentifier: ep.deviceIdentifier,
          deviceVersion: ep.deviceVersion,
          endpointTypeId: ep.endpointTypeRef,
          endpointIdentifier: ep.endpointId
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
              ept.deviceVersion = eptId.deviceVersion
              ept.deviceIdentifier = eptId.deviceIdentifier
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
              // No client-side attributes, commands, and events (at least for
              // endpoint_config purposes) in Matter.
              if (cl.side == dbEnum.side.client) {
                cl.attributes = []
                cl.commands = []
                cl.events = []
                return
              }
              ps.push(
                queryEndpoint
                  .selectEndpointClusterAttributes(
                    db,
                    cl.clusterId,
                    cl.side,
                    ept.id
                  )
                  .then((attributes) => {
                    // Keep only the enabled attributes, and not the global ones
                    // we exclude from metadata.
                    cl.attributes = attributes.filter(
                      (a) =>
                        a.isIncluded && !isGlobalAttrExcludedFromMetadata(a)
                    )
                  })
              )
              ps.push(
                queryEndpoint
                  .selectEndpointClusterCommands(db, cl.clusterId, ept.id)
                  .then((commands) => {
                    cl.commands = commands
                  })
              )
              ps.push(
                queryEndpoint
                  .selectEndpointClusterEvents(db, cl.clusterId, ept.id)
                  .then((events) => {
                    cl.events = events
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
      collectAttributeTypeInfo(db, this.global.zclPackageIds, endpointTypes)
    )
    .then((endpointTypes) =>
      collectAttributeSizes(db, this.global.zclPackageIds, endpointTypes)
    )
    .then((endpointTypes) =>
      collectAttributes(
        db,
        sessionId,
        endpointTypes,
        collectAttributesOptions,
        this.global.zclPackageIds
      )
    )
    .then((collection) => {
      Object.assign(newContext, collection)
    })
    .then(() => options.fn(newContext))
    .catch((err) =>
      console.log('Error in endpoint_config helper: ' + err.message)
    )
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
exports.endpoint_fixed_device_type_array = endpoint_fixed_device_type_array
exports.endpoint_fixed_device_type_array_offsets =
  endpoint_fixed_device_type_array_offsets
exports.endpoint_fixed_device_type_array_lengths =
  endpoint_fixed_device_type_array_lengths
exports.endpoint_fixed_profile_id_array = endpoint_fixed_profile_id_array
exports.endpoint_fixed_parent_id_array = endpoint_fixed_parent_id_array
exports.endpoint_fixed_network_array = endpoint_fixed_network_array
exports.endpoint_command_list = endpoint_command_list
exports.endpoint_command_count = endpoint_command_count
exports.endpoint_reporting_config_defaults = endpoint_reporting_config_defaults
exports.endpoint_reporting_config_default_count =
  endpoint_reporting_config_default_count
exports.endpoint_count = endpoint_count
exports.endpoint_config_macros = endpoint_config_macros
