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
    switch (cleansedHex[i]) {
      case '0':
        out = out.concat('0000')
        break
      case '1':
        out = out.concat('0001')
        break
      case '2':
        out = out.concat('0010')
        break
      case '3':
        out = out.concat('0011')
        break
      case '4':
        out = out.concat('0100')
        break
      case '5':
        out = out.concat('0101')
        break
      case '6':
        out = out.concat('0110')
        break
      case '7':
        out = out.concat('0111')
        break
      case '8':
        out = out.concat('1000')
        break
      case '9':
        out = out.concat('1001')
        break
      case 'A':
        out = out.concat('1010')
        break
      case 'B':
        out = out.concat('1011')
        break
      case 'C':
        out = out.concat('1100')
        break
      case 'D':
        out = out.concat('1101')
        break
      case 'E':
        out = out.concat('1110')
        break
      case 'F':
        out = out.concat('1111')
        break
    }
  }
  return out
}

exports.int32ToHex = int32ToHex
exports.int16ToHex = int16ToHex
exports.int8ToHex = int8ToHex
exports.stringToHex = stringToHex
exports.hexToCBytes = hexToCBytes
exports.hexToBinary = hexToBinary
exports.bitOffset = bitOffset
