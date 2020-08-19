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

const queryZcl = require('../db/query-zcl.js')
const templateUtil = require('./template-util.js')
const bin = require('../util/bin.js')
const { exportClustersFromEndpointType } = require('../db/query-impexp.js')

/**
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: C formatting helpers
 */

/**
 * Formats label as a C macro. This method performs a very simply substition
 * of illegal characters, such as ' ', ':' and such into a '_' character.
 *
 * @param {*} label
 * @returns Label formatted as C macro.
 */
function asMacro(label) {
  var l = label.toUpperCase().replace(/ /g, '_')
  l = l.replace(/[:/-]/g, '_')
  l = l.replace('___', '_')
  l = l.replace('__', '_')
  l = l.replace('._', '_')
  l = l.replace('.', '_')
  l = l.replace('-', '_')
  return l
}

/**
 * Given a hex number, it prints the offset, which is the index of the first non-zero bit.
 * @param {*} hex
 */
function asOffset(hex) {
  return bin.bitOffset(bin.hexToBinary(hex))
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9'
}

/**
 * Takes a label, and delimits is on camelcasing.
 * For example:
 *    VerySimpleLabel will turn into VERY_SIMPLE_LABEL
 * @param {*} label
 */
function asDelimitedMacro(label) {
  var ret = ''
  if (label == null) return ret

  var wasUp = false
  for (var i = 0; i < label.length; i++) {
    var ch = label.charAt(i)
    var upch = ch.toUpperCase()
    if (ch == '_') {
      ret = ret.concat('_')
      wasUp = true
    } else if (isDigit(ch)) {
      ret = ret.concat(ch)
      wasUp = false
    } else if (ch == upch) {
      // uppercase
      if (i != 0 && !wasUp) ret = ret.concat('_')
      ret = ret.concat(upch)
      wasUp = true
    } else {
      // lowercase
      ret = ret.concat(upch)
      wasUp = false
    }
  }
  return asMacro(ret)
}

/**
 * Formats label as a C hex constant.
 * If value starts as 0x or 0X it is already treated as hex,
 * otherwise it is assumed decimal and converted to hex.
 *
 * @param {*} label
 * @returns Label formatted as C hex constant.
 */
function asHex(value) {
  var ret = value.trim()
  if (ret.startsWith('0x') || ret.startsWith('0X')) {
    return `0x${value.slice(2)}`
  } else {
    var val = parseInt(value)
    return `0x${val.toString(16)}`
  }
}

/**
 * Returns the default atomic C type for a given atomic from
 * the database. These values are used unless there is an
 * override in template package json file. (Not yet fully
 * implemented, but the plan is for template pkg to be able
 * to override these.)
 *
 * @param {*} atomic
 */
function defaultAtomicType(atomic) {
  if (atomic.name.startsWith('int')) {
    var signed
    if (atomic.name.endsWith('s')) signed = true
    else signed = false

    var ret = `${signed ? '' : 'u'}int${atomic.size * 8}_t`

    // few exceptions
    if (ret == 'uint24_t') ret = 'uint32_t'

    return ret
  } else if (atomic.name.startsWith('enum') || atomic.name.startsWith('data')) {
    return `uint${atomic.name.slice(4)}_t`
  } else if (atomic.name.startsWith('bitmap')) {
    return `uint${atomic.name.slice(6)}_t`
  } else {
    switch (atomic.name) {
      case 'utc_time':
      case 'date':
        return 'uint32_t'
      case 'attribute_id':
      case 'cluster_id':
        return 'uint16_t'
      case 'no_data':
      case 'octet_string':
      case 'char_string':
      case 'ieee_address':
        return 'uint8_t *'
      case 'boolean':
        return 'uint8_t'
      default:
        return `/* TYPE WARNING: ${atomic.name} defaults to */ uint8_t * `
    }
  }
}

/**
 * Converts the actual zcl type into an underlying usable C type.
 * @param {*} value
 */
function asUnderlyingType(value) {
  return templateUtil
    .ensurePackageId(this)
    .then((packageId) =>
      queryZcl.selectAtomicType(this.global.db, packageId, value)
    )
    .then((atomic) => {
      if (atomic == null) {
        // try to retrieve the atomic as a bitmap.
      }
      return atomic
    })
    .then((atomic) => {
      if (atomic == null) {
        return `EmberAf${value}`
      } else {
        return defaultAtomicType(atomic)
      }
    })
}

/**
 * Formats label as a C type.
 *
 * @param {*} label
 * @returns Label formatted as C type.
 */
function asType(value) {
  return value.replace(/ /g, '')
}

/**
 * Formats label as a C symbol.
 *
 * @param {*} label
 * @returns Label formatted as C symbol.
 */
function asSymbol(value) {
  return value
}

// Formats the default value into an attribute of a given length
function formatValue(value, length, type) {
  var out = ''
  if (length < 0) {
    out = out.concat(value.length())
    for (var i = 0; i < value.length; i++) {
      var ch = value.charAt(i)
      out = out.concat(",'").concat(ch).concat("'")
    }
  } else {
    if (type.startsWith('int')) {
      var val = 0
      if (value.startsWith('0x') || value.startsWith('0X')) {
        val = parseInt(value.slice(2), 16)
      } else {
        val = parseInt(value)
      }
      if (Number.isNaN(val)) {
        val = 0
      }
      switch (length) {
        case 1:
          out = out.concat(bin.hexToCBytes(bin.int8ToHex(val)))
          break
        case 2:
          out = out.concat(bin.hexToCBytes(bin.int16ToHex(val)))
          break
        case 4:
          out = out.concat(bin.hexToCBytes(bin.int32ToHex(val)))
          break
      }
    } else {
      out = out.concat(value)
    }
  }
  return out
}

/**
 * Given a default value of attribute, this method converts it into bytes
 *
 * @param {*} value
 */
function asBytes(value, type) {
  if (type == null) {
    return Promise.resolve(value)
  } else {
    return templateUtil
      .ensurePackageId(this)
      .then((packageId) =>
        queryZcl.getAtomicSizeFromType(this.global.db, packageId, type)
      )
      .then((x) => {
        if (x == -1) {
          return value
        } else {
          return formatValue(value, x, type)
        }
      })
  }
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.asMacro = asMacro
exports.asHex = asHex
exports.asType = asType
exports.asSymbol = asSymbol
exports.asBytes = asBytes
exports.asDelimitedMacro = asDelimitedMacro
exports.asOffset = asOffset
exports.asUnderlyingType = asUnderlyingType
