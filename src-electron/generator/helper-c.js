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

/**
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: C formatting helpers
 */

/**
 * Formats label as a C macro.
 *
 * @param {*} label
 * @returns Label formatted as C macro.
 */
function asMacro(label) {
  var l = label.toUpperCase().replace(/ /g, '_')
  l = l.replace(/[:/]/g, '_')
  return l
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
