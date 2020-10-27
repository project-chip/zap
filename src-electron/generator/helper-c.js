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
const queryPackage = require('../db/query-package.js')
const templateUtil = require('./template-util.js')
const bin = require('../util/bin.js')
const env = require('../util/env.js')

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
  l = l.startsWith('_') ? l.substring(1) : l
  l = l.endsWith('_') ? l.substring(0, l.length - 1) : l
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
  label = label.replace(/\.?([A-Z][a-z])/g, function (x, y) {
    return '_' + y
  })
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
function asHex(rawValue, padding) {
  if (rawValue == null) rawValue = 0 // upgrade null to zero
  let value = rawValue.toString()
  var ret = value.trim()
  if (ret.startsWith('0x') || ret.startsWith('0X')) {
    return `0x${value.slice(2).toUpperCase()}`
  } else {
    var val = parseInt(value)
    return `0x${val.toString(16).padStart(padding, '0').toUpperCase()}`
  }
}

/**
 * Converts the actual zcl type into an underlying usable C type.
 * @param {*} value
 */
function asUnderlyingType(value) {
  return templateUtil
    .ensureZclPackageId(this)
    .then((packageId) =>
      queryZcl.selectAtomicType(this.global.db, packageId, value)
    )
    .then((atomic) => {
      if (atomic == null) {
        return queryZcl
          .selectBitmapByName(this.global.db, this.global.zclPackageId, value)
          .then((bitmap) => {
            if (bitmap == null) {
              return atomic
            } else {
              return queryZcl.selectAtomicType(
                this.global.db,
                this.global.zclPackageId,
                bitmap.type
              )
            }
          })
      } else {
        // Just pass it through
        return atomic
      }
    })
    .then((atomic) => {
      if (atomic == null) {
        return this.global.overridable.nonAtomicType({ name: value })
      } else {
        return queryPackage
          .selectSpecificOptionValue(
            this.global.db,
            this.global.genTemplatePackageId,
            'types',
            atomic.name
          )
          .then((opt) => {
            if (opt == null) return this.global.overridable.atomicType(atomic)
            else return opt.optionLabel
          })
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
  return value.replace(/[ |-]/g, '')
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
      .ensureZclPackageId(this)
      .then((packageId) =>
        queryZcl.getAtomicSizeFromType(this.global.db, packageId, type)
      )
      .then((x) => {
        if (x == null) {
          if (value == null) {
            return '0x00'
          } else {
            return bin.hexToCBytes(bin.stringToHex(value))
          }
        } else {
          return formatValue(value, x, type)
        }
      })
  }
}

/**
 * Given a string convert it into a camelCased string
 *
 * @param {*} str
 * @returns a spaced out string in lowercase
 */
function asCamelCased(label, firstLower = true) {
  var str = label.split(/ |-|\//)
  var res = ''
  for (let i = 0; i < str.length; i++) {
    if (i == 0) {
      if (firstLower) {
        res += str[i].charAt(0).toLowerCase() + str[i].substring(1)
      } else {
        res += str[i].charAt(0).toUpperCase() + str[i].substring(1)
      }
      continue
    }
    res += str[i].charAt(0).toUpperCase() + str[i].substring(1)
  }
  return res
}

/**
 * returns a string after converting ':' and '-' into '_'
 * @param {*} label
 */
function cleanseLabel(label) {
  var l = label.trim()
  l = l.replace(' ', '_')
  l = l.replace(' ', '_')
  l = l.replace(/__+/g, '_')
  l = l.replace(/[:/-]/g, '_').toLowerCase()
  return l
}

/**
 * Given a camel case string, convert it into one with underscore and lowercase
 *
 * @param {*} str
 * @returns String in lowercase with underscores
 */
function asUnderscoreLowercase(str) {
  var label = str.replace(/\.?([A-Z][a-z])/g, function (x, y) {
    return '_' + y
  })
  if (label.startsWith('_')) {
    label = label.substring(1)
  }
  return label.toLowerCase()
}

/**
 * Given a camel case string convert it into one with space and lowercase
 *
 * @param {*} str
 * @returns a spaced out string in lowercase
 */
function asSpacedLowercase(str) {
  var res = str.replace(/\.?([A-Z][a-z])/g, function (x, y) {
    return ' ' + y
  })
  return res.toLowerCase()
}

/**
 * Given a camel case string convert it into one with underscore and uppercase
 *
 * @param {*} str
 * @returns String in uppercase with underscores
 */
function asUnderscoreUppercase(str) {
  var label = str.replace(/\.?([A-Z][a-z])/g, function (x, y) {
    return '_' + y
  })
  label = cleanseLabel(label)
  if (label.startsWith('_')) {
    label = label.substring(1)
  }
  return label.toUpperCase()
}

function asCliType(str) {
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
    return str
  }
  return 'SL_CLI_ARG_' + str.toUpperCase()
}

/**
 * Returns the type of bitmap
 *
 * @param {*} db
 * @param {*} bitmap_name
 * @param {*} packageId
 */
function dataTypeForBitmap(db, bitmap_name, packageId) {
  return queryZcl.selectBitmapByName(db, packageId, bitmap_name).then((bm) => {
    if (bm == null) {
      return `!!Invalid bitmap: ${bitmap_name}`
    } else {
      return asCliType(bm.type)
    }
  })
}

/**
 * Returns the type of enum
 *
 * @param {*} db
 * @param {*} enum_name
 * @param {*} packageId
 */
function dataTypeForEnum(db, enum_name, packageId) {
  return queryZcl.selectEnumByName(db, enum_name, packageId).then((e) => {
    if (e == null) {
      return `!!Invalid enum: ${enum_name}`
    } else {
      return asCliType(e.type)
    }
  })
}

/**
 * Returns the number by adding 1 to it.
 * @param {*} number
 */
function addOne(number) {
  return number + 1
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.
exports.asHex = asHex
exports.asType = asType
exports.asSymbol = asSymbol
exports.asBytes = asBytes
exports.asDelimitedMacro = asDelimitedMacro
exports.asOffset = asOffset
exports.asUnderlyingType = asUnderlyingType
exports.asCamelCased = asCamelCased
exports.cleanseLabel = cleanseLabel
exports.asUnderscoreLowercase = asUnderscoreLowercase
exports.asSpacedLowercase = asSpacedLowercase
exports.asUnderscoreUppercase = asUnderscoreUppercase
exports.asCliType = asCliType
exports.dataTypeForBitmap = dataTypeForBitmap
exports.dataTypeForEnum = dataTypeForEnum
exports.addOne = addOne
