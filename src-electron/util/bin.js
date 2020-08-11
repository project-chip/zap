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
  return bb.toHex()
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
  return bb.toHex()
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
  return bb.toHex()
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
  return bb.toHex()
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

exports.int32ToHex = int32ToHex
exports.int16ToHex = int16ToHex
exports.int8ToHex = int8ToHex
exports.stringToHex = stringToHex
exports.hexToCBytes = hexToCBytes
