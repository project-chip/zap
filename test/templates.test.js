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
const handlebars = require('handlebars')

test('handlebars: simple test', () => {
  var template = handlebars.compile('{{a}} {{b}} {{c}}!')
  var output = template({ a: 'Very', b: 'simple', c: 'test' })
  expect(output).toEqual('Very simple test!')
})

test('handlebars: comment test', () => {
  var template = handlebars.compile(
    '{{!-- some random comment --}}{{a}} {{b}} {{c}}!'
  )
  var output = template({ a: 'Very', b: 'simple', c: 'test' })
  expect(output).toEqual('Very simple test!')
})

test('handlebars: object test', () => {
  var template = handlebars.compile('{{in.a}} {{in.b}} {{in.c}}!')
  var output = template({ in: { a: 'Very', b: 'simple', c: 'test' } })
  expect(output).toEqual('Very simple test!')
})

test('handlebars: with test', () => {
  var template = handlebars.compile('{{#with in}}{{a}} {{b}} {{c}}!{{/with}}')
  var output = template({ in: { a: 'Very', b: 'simple', c: 'test' } })
  expect(output).toEqual('Very simple test!')
})

test('handlebars: each test', () => {
  var template = handlebars.compile('{{#each in}}{{this}} {{/each}}!')
  var output = template({ in: ['Very', 'simple', 'test'] })
  expect(output).toEqual('Very simple test !')
})

test('handlebars: helper', () => {
  handlebars.registerHelper(
    'supreme_leader',
    (name) => `His most evil excelency, Mr. ${name}`
  )
  var template = handlebars.compile(
    '{{#each list_of_lunatics}}{{supreme_leader this}} {{/each}}'
  )
  var output = template({
    list_of_lunatics: ['Stalin', 'Trotsky', 'Genghis Khan'],
  })
  expect(output).toEqual(
    'His most evil excelency, Mr. Stalin His most evil excelency, Mr. Trotsky His most evil excelency, Mr. Genghis Khan '
  )
})

test('handlebars: if helper', () => {
  var template = handlebars.compile(
    '{{#if flag}}Yes flag!{{else}}No flag!{{/if}}'
  )
  var output = template({ flag: true })
  expect(output).toEqual('Yes flag!')
  output = template({ flag: false })
  expect(output).toEqual('No flag!')
})

test('handlebars: using functions inside the passed input', () => {
  var template = handlebars.compile('{{fn}}')
  var output = template({
    fn: () => {
      var text = 'example text'
      var uc = text.toUpperCase()
      return `Got ${text}, returned ${uc}`
    },
  })
  expect(output).toEqual('Got example text, returned EXAMPLE TEXT')
})

test('handlebars: using helper to populate the context', function () {
  var template = handlebars.compile('{{#each custom_list}}{{value}}{{/each}}')
  var output = template({
    custom_list: () => {
      var list = []
      for (var i = 0; i < 10; i++) {
        list.push({ value: i })
      }
      return list
    },
  })
  expect(output).toEqual('0123456789')
})
