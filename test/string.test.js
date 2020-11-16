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

const string = require('../src-electron/util/string.js')

test('Clean symbol', () => {
  expect(string.toCleanSymbol('a b c')).toEqual('a_b_c')
  expect(string.toCleanSymbol('a:b-c')).toEqual('a_b_c')
  expect(string.toCleanSymbol('a____:___c')).toEqual('a_c')
})

test('Snake case', () => {
  expect(string.toSnakeCaseAllCaps('VerySimpleLabel')).toEqual(
    'VERY_SIMPLE_LABEL'
  )
})

test('Camel case', () => {
  expect(string.toCamelCase('some random string')).toEqual('someRandomString')
  expect(string.toCamelCase('some random string', false)).toEqual(
    'SomeRandomString'
  )
  expect(string.toCamelCase('ZLL Commissioning')).toEqual('zllCommissioning')
})
