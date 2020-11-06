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

// Binary utilities to deal with hex numbers and such.

var byteBuffer = require('bytebuffer')

/**
 * Takes an int8 value and turns it into a hex.
 *
 * @param {*} value
 * @returns hex string, 2 characters long without '0x'
 */
function int8ToHex(value, littleEndian = false) {
  var bb = new byteBuffer(1, littleEndian, byteBuffer.DEFAULT_NOASSERT)
  bb.writeInt8(value)
  bb.flip()
  return bb.toHex().toUpperCase()
}

/**
 * Takes an int16 value and turns it into a hex.
 *
 * @param {*} value
 * @returns hex string, 4 characters long without '0x'
 */
function int16ToHex(value, littleEndian = false) {
  var bb = new byteBuffer(2, littleEndian, byteBuffer.DEFAULT_NOASSERT)
  bb.writeInt16(value)
  bb.flip()
  return bb.toHex().toUpperCase()
}

/**
 * Takes an int8 value and turns it into a hex.
 *
 * @param {*} value
 * @returns hex string, 8 characters long without '0x'
 */
function int32ToHex(value, littleEndian = false) {
  var bb = new byteBuffer(4, littleEndian, byteBuffer.DEFAULT_NOASSERT)
  bb.writeInt32(value)
  bb.flip()
  return bb.toHex().toUpperCase()
}

/**
 * Converts a string to the hex value.
 *
 * @param {*} value
 * @returns hex string, value.length * 2 + 2 characters long. It appends the terminating NULL, so 0x00 is at the end.
 */
function stringToHex(value) {
  var bb = new byteBuffer(value.length, false, byteBuffer.DEFAULT_NOASSERT)
  bb.writeCString(value)
  bb.flip()
  return bb.toHex().toUpperCase()
}

/**
 * Takes the raw hex string, such as `abcd` and
 * converts it into a C constant array, such as
 * `0xAB, 0xCD`.
 *
 * @param {*} value
 * @returns C byte array
 */
function hexToCBytes(value) {
  var out = ''
  var infix = ''
  for (var i = 0; i < value.length; i += 2) {
    out += infix
    out += '0x'.concat(value.substring(i, i + 2).toUpperCase())
    infix = ', '
  }
  return out
}

/**
 * Getting a binary string ("0001101010010") it returns the number of zero bits at the end.
 * @param {*} binary
 */
function bitOffset(binary) {
  var lastIndex = binary.lastIndexOf('1')
  return binary.length - lastIndex - 1
}

const hexDigits = {
  0: '0000',
  1: '0001',
  2: '0010',
  3: '0011',
  4: '0100',
  5: '0101',
  6: '0110',
  7: '0111',
  8: '1000',
  9: '1001',
  A: '1010',
  B: '1011',
  C: '1100',
  D: '1101',
  E: '1110',
  F: '1111',
}

/**
 * Convert a hex number to a binary. Hex has to be in a format
 * as obtained by intToHex methods above: no '0x' prefix and upper-case
 * letters, as in "12AB".
 *
 * @param {*} hex
 */
function hexToBinary(hex) {
  var cleansedHex = hex
  if (cleansedHex.startsWith('0x') || cleansedHex.startsWith('0X'))
    cleansedHex = cleansedHex.slice(2)
  cleansedHex = cleansedHex.toUpperCase()

  var out = ''
  for (var i = 0; i < cleansedHex.length; i++) {
    var str = hexDigits[cleansedHex[i]]
    if (str != null) out = out.concat(str)
  }
  return out
}

/**
 * Returns string as C bytes, prefixed with one-byte length.
 * If maxLength is greater than length of value, then
 * the resulting array is padded with 0x00.
 *
 * @param {*} value
 */
function stringToOneByteLengthPrefixCBytes(value, maxLength) {
  var len = value.length
  var ret = `${len}, `
  for (var i = 0; i < len; i++) {
    ret = ret.concat(`'${value[i]}', `)
  }
  if (maxLength > len) {
    for (var i = 0; i < maxLength - len; i++) {
      ret = ret.concat('0x00, ')
    }
  }
  return ret
}

/**
 * Returns string as C bytes, prefixed with two-byte length
 * If maxLength is greater than length of value, then
 * the resulting array is padded with 0x00.
 *
 * @param {*} value
 */
function stringToTwoByteLengthPrefixCBytes(value, maxLength) {
  var len = value.length
  var ret = `${(len >> 8) & 0xff}, `
  ret = ret.concat(`${len & 0xff}, `)
  for (var i = 0; i < len; i++) {
    ret = ret.concat(`'${value[i]}', `)
  }
  if (maxLength > len) {
    for (var i = 0; i < maxLength - len; i++) {
      ret = ret.concat('0x00, ')
    }
  }
  return ret
}

exports.int32ToHex = int32ToHex
exports.int16ToHex = int16ToHex
exports.int8ToHex = int8ToHex
exports.stringToHex = stringToHex
exports.hexToCBytes = hexToCBytes
exports.hexToBinary = hexToBinary
exports.bitOffset = bitOffset
exports.stringToOneByteLengthPrefixCBytes = stringToOneByteLengthPrefixCBytes
exports.stringToTwoByteLengthPrefixCBytes = stringToTwoByteLengthPrefixCBytes
