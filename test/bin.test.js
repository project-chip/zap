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
 *
 *
 * @jest-environment node
 */

const bin = require('../src-electron/util/bin.js')

test('32-bit hex conversions', () => {
  var xN = 0x1234abcd
  expect(bin.int32ToHex(xN)).toEqual('1234ABCD')
  expect(bin.int32ToHex(xN, true)).toEqual('CDAB3412')
})

test('16-bit hex conversions', () => {
  var xN = 0xabcd
  expect(bin.int16ToHex(xN)).toEqual('ABCD')
  expect(bin.int16ToHex(xN, true)).toEqual('CDAB')
})

test('8-bit hex conversions', () => {
  var xN = 0xab
  expect(bin.int8ToHex(xN)).toEqual('AB')
  expect(bin.int8ToHex(xN, true)).toEqual('AB')
})

test('Hex to bytes conversions', () => {
  expect(bin.hexToCBytes('1234abcd')).toEqual('0x12, 0x34, 0xAB, 0xCD')
})

test('String hex conversions', () => {
  var xN = 'abcdABCD'
  var xS = bin.stringToHex(xN)
  expect(xS).toEqual('616263644142434400')
  expect(bin.hexToCBytes(xS)).toEqual(
    '0x61, 0x62, 0x63, 0x64, 0x41, 0x42, 0x43, 0x44, 0x00'
  )
})

test('Hex to binary', () => {
  var hex = bin.int32ToHex(1234)
  expect(hex).toBe('000004D2')
  expect(bin.hexToBinary(hex)).toBe('00000000000000000000010011010010')
})
