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
const bin = require('./bin.js')

/**
 * @module JS API: type related utilities
 */

/**
 * This function resolves with the size of a given type.
 * -1 means that this size is variable.
 *
 * @param {*} db
 * @param {*} zclPackageId
 * @param {*} type
 */
function typeSize(db, zclPackageId, type) {
  return queryZcl.getAtomicSizeFromType(db, zclPackageId, type)
}

/**
 * Returns the size of a real attribute, taking type size and defaults
 * into consideration, so that strings are properly sized.
 *
 * @param {*} db
 * @param {*} zclPackageId
 * @param {*} at
 * @param {*} [defaultValue=null]
 * @returns Promise that resolves into the size of the attribute.
 */
function typeSizeAttribute(db, zclPackageId, at, defaultValue = null) {
  return typeSize(db, zclPackageId, at.type).then((size) => {
    if (size) {
      return size
    } else if (at.maxLength != null) {
      return at.maxLength
    } else if (at.defaultValue) {
      return at.defaultValue.length + 1
    } else {
      if (defaultValue != null) {
        return defaultValue
      } else {
        throw `ERROR: Unknown size for attribute: ${at.label} / ${at.code}`
      }
    }
  })
}

/**
 * If the type is more than 2 bytes long, then this method creates
 *
 * @param {*} size
 * @param {*} type
 * @param {*} value
 */
function longTypeDefaultValue(size, type, value) {
  if (value == null || value.length == 0) {
    return '0x00, '.repeat(size)
  } else if (isNaN(value)) {
    console.log(type)
    if (isOneBytePrefixedString(type)) {
      return bin.stringToOneByteLengthPrefixCBytes(value)
    } else if (isTwoBytePrefixedString(type)) {
      return bin.stringToTwoByteLengthPrefixCBytes(value)
    } else {
      return bin.hexToCBytes(bin.stringToHex(value))
    }
  } else {
    return bin.hexToCBytes(value)
  }
}

function isOneBytePrefixedString(type) {
  return type == 'char_string' || type == 'octet_string'
}

function isTwoBytePrefixedString(type) {
  return type == 'long_char_string' || type == 'long_octet_string'
}

exports.typeSize = typeSize
exports.typeSizeAttribute = typeSizeAttribute
exports.longTypeDefaultValue = longTypeDefaultValue
