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
const bin = require('./bin')
const env = require('./env')

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
async function typeSize(db, zclPackageId, type) {
  return queryZcl.selectAtomicSizeFromType(db, zclPackageId, type)
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
async function typeSizeAttribute(db, zclPackageId, at, defaultValue = null) {
  let size = await typeSize(db, zclPackageId, at.type)

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
      throw new Error(
        `ERROR: Unknown size for attribute: ${at.label} / ${at.code}`
      )
    }
  }
}

/**
 * If the type is more than 2 bytes long, then this method creates
 * the default byte array.
 *
 * @param {*} size Size of bytes generated.
 * @param {*} type Type of the object.
 * @param {*} value Default value.
 * @returns string which is a C-formatted byte array.
 */
function longTypeDefaultValue(size, type, value) {
  let v
  if (value == null || value.length == 0) {
    v = '0x00, '.repeat(size)
  } else if (isNaN(value)) {
    if (isOneBytePrefixedString(type)) {
      v = bin.stringToOneByteLengthPrefixCBytes(value, size).content
    } else if (isTwoBytePrefixedString(type)) {
      v = bin.stringToTwoByteLengthPrefixCBytes(value, size).content
    } else {
      v = bin.hexToCBytes(bin.stringToHex(value))
    }
  } else {
    // First strip off the 0x.
    if (value.startsWith('0x') || value.startsWith('0X'))
      value = value.substring(2)

    // Now pad the zeroes to the required size
    if (size > 0) {
      while (value.length / 2 < size) {
        value = '0' + value
      }
    }
    v = bin.hexToCBytes(value) + ', '
  }
  return v
}

/**
 * Conversion to a CLI type. THis is here temporarily until we come up
 * with a proper type engine.
 *
 * @param {*} str
 * @returns converted type
 */
function convertToCliType(str) {
  str = str.trim()
  if (str.toLowerCase().endsWith('u')) {
    str = str.substring(0, str.length - 1)
    str = 'u' + str
  } else if (
    str.toLowerCase().startsWith('int') &&
    str.toLowerCase().endsWith('s')
  ) {
    str = str.substring(0, str.length - 1)
  } else if (str.toLowerCase().endsWith('char_string')) {
    str = 'string'
  } else if (str.toLowerCase().startsWith('bitmap')) {
    str = str.toLowerCase().replace('bitmap', 'uint')
  } else if (str.toLowerCase().startsWith('enum')) {
    str = str.toLowerCase().replace('enum', 'uint')
  } else {
    env.logInfo('Cli type not found: ' + str)
  }
  return str
}

/**
 * Returns true if a given ZCL type is a string type.
 * @param {*} type
 * @returns true if type is string, false otherwise
 */
function isString(type) {
  switch (type.toUpperCase()) {
    case 'CHAR_STRING':
    case 'OCTET_STRING':
    case 'LONG_CHAR_STRING':
    case 'LONG_OCTET_STRING':
      return true
    default:
      return false
  }
}

/**
 * Returns true if a given ZCL type is a float type.
 * @param {*} type
 * @returns true if type is float, false otherwise
 */
function isFloat(type) {
  switch (type) {
    case 'FLOAT_SEMI':
    case 'FLOAT_SINGLE':
    case 'FLOAT_DOUBLE':
      return true
    default:
      return false
  }
}

/**
 * Checks if type is a one-byte lengh string.
 *
 * @param {*} type
 * @returns true if the said type is a string prefixed by one byte length
 */
function isOneBytePrefixedString(type) {
  return type == 'char_string' || type == 'octet_string'
}
/**
 * Checks if type is a two-byte lengh string.
 *
 * @param {*} type
 * @returns true if the said type is a string prefixed by two byte length
 */
function isTwoBytePrefixedString(type) {
  return type == 'long_char_string' || type == 'long_octet_string'
}

exports.typeSize = typeSize
exports.typeSizeAttribute = typeSizeAttribute
exports.longTypeDefaultValue = longTypeDefaultValue
exports.isOneBytePrefixedString = isOneBytePrefixedString
exports.isTwoBytePrefixedString = isTwoBytePrefixedString
exports.convertToCliType = convertToCliType
exports.isString = isString
exports.isFloat = isFloat
