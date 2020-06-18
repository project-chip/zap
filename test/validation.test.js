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

const dbApi = require('../src-electron/db/db-api.js')
const { loadZcl } = require('../src-electron/zcl/zcl-loader.js')
const Validation = require('../src-electron/validation/validation.js')

const {
  logInfo,
  schemaFile,
  sqliteTestFile,
  zapVersion,
} = require('../src-electron/util/env.js')

const args = require('../src-electron/main-process/args')

const {
  selectAttributesByClusterCodeAndManufacturerCode,
} = require('../src-electron/db/query-zcl.js')

var db

beforeAll(() => {
  var file = sqliteTestFile('validation')
  return dbApi
    .initDatabase(file)
    .then((d) => dbApi.loadSchema(d, schemaFile(), zapVersion()))
    .then((d) => {
      db = d
      logInfo('DB initialized.')
    })
})

test('Load the static data.', () => {
  return loadZcl(db, args.zclPropertiesFile)
}, 5000)

test('isValidNumberString Functions', () => {
  // Integer
  expect(Validation.isValidNumberString('0x0000')).toBeTruthy()
  expect(Validation.isValidNumberString('0x0001')).toBeTruthy()
  expect(!Validation.isValidNumberString('0x00asdfajaklsf;01')).toBeTruthy()
  // Float
  expect(Validation.isValidFloat('5.6')).toBeTruthy()
  expect(Validation.isValidFloat('5')).toBeTruthy()
  expect(!Validation.isValidFloat('5.6....')).toBeTruthy()
  expect(Validation.isValidFloat('.0001')).toBeTruthy()
})

test('extractValue Functions', () => {
  //Integer
  expect(Validation.extractIntegerValue('5') == 5).toBeTruthy()
  expect(Validation.extractIntegerValue('0x05') == 5).toBeTruthy()
  expect(Validation.extractIntegerValue('A') == 10).toBeTruthy()
  //float
  expect(Validation.extractFloatValue('0.53') == 0.53).toBeTruthy()
  expect(Validation.extractFloatValue('.53') == 0.53).toBeTruthy()
})

test('Test int bounds', () => {
  //Integer
  expect(Validation.checkBoundsInteger(50, 25, 60)).toBeTruthy()
  expect(!Validation.checkBoundsInteger(50, 25, 20)).toBeTruthy()
  expect(!Validation.checkBoundsInteger(50, 51, 55)).toBeTruthy()
  expect(!Validation.checkBoundsInteger(30, 'avaa', 2)).toBeTruthy()
  expect(!Validation.checkBoundsInteger(30, 45, 50)).toBeTruthy()
  expect(Validation.checkBoundsInteger('asdfa', 40, 50)).toBeFalsy()

  //Float
  expect(Validation.checkBoundsFloat(35.0, 25, 50.0))
  expect(!Validation.checkBoundsFloat(351.0, 25, 50.0))
  expect(!Validation.checkBoundsFloat(351.0, 355, 5650.0))
})

test('Validate types', () => {
  expect(Validation.isStringType('CHAR_STRING'))
  expect(Validation.isStringType('OCTET_STRING'))
  expect(Validation.isStringType('LONG_CHAR_STRING'))
  expect(Validation.isStringType('LONG_OCTET_STRING'))
  expect(!Validation.isStringType('FLOAT_SEMI'))

  expect(Validation.isFloatType('FLOAT_SEMI'))
  expect(Validation.isFloatType('FLOAT_SINGLE'))
  expect(Validation.isFloatType('FLOAT_DOUBLE'))
  expect(!Validation.isFloatType('LONG_OCTET_STRING'))
})

test('Integer Test', () => {
  return selectAttributesByClusterCodeAndManufacturerCode(
    db,
    '0x0003',
    null
  ).then((attribute) => {
    var attribute = attribute.filter((e) => {
      return e.code === '0x0000'
    })[0]

    //Test Constraints
    var minMax = Validation.getBoundsInteger(attribute)
    expect(minMax.min == 0).toBeTruthy()
    expect(minMax.max === 0xffff).toBeTruthy()

    return Promise.resolve()
  })
}, 1000)

test('validate Attribute Test', () => {
  var fakeEndpointAttribute = {
    defaultValue: '30',
  }

  var fakeAttribute = {
    type: 'UINT16',
    min: '0x0010',
    max: '50',
  }

  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeTruthy()
  // Check for if attribute is out of bounds.
  fakeEndpointAttribute.defaultValue = '60'
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeFalsy()
  fakeEndpointAttribute.defaultValue = '5'
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeFalsy()

  //Check if attribute is actually a number
  fakeEndpointAttribute.defaultValue = 'xxxxxx'
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeFalsy()

  var fakeAttribute = {
    type: 'FLOAT_SINGLE',
    min: '0.5',
    max: '2',
  }

  var fakeEndpointAttribute = {
    defaultValue: '1.5',
  }
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeTruthy()
  //Check out of bounds.
  var fakeEndpointAttribute = {
    defaultValue: '4.5',
  }
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeFalsy()
  var fakeEndpointAttribute = {
    defaultValue: '.25',
  }
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeFalsy()

  //Check if attribute is actually a number
  fakeEndpointAttribute.defaultValue = 'xxxxxx'
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeFalsy()

  // Expect no issues with strings.
  var fakeAttribute = {
    type: 'CHAR_STRING',
  }
  var fakeEndpointAttribute = {
    defaultValue: '30adfadf',
  }
  expect(
    Validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
      .defaultValue.length == 0
  ).toBeTruthy()
}, 2000)

test('validate endpoint test', () => {
  //Validate normal operation
  var endpoint = {
    endpointId: '1',
    networkId: '0',
  }
  expect(
    Validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
  ).toBeTruthy()
  expect(
    Validation.validateSpecificEndpoint(endpoint).networkId.length == 0
  ).toBeTruthy()

  //Validate not a number
  var endpoint = {
    endpointId: 'blah',
    networkId: 'blah',
  }
  expect(
    Validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
  ).toBeFalsy()
  expect(
    Validation.validateSpecificEndpoint(endpoint).networkId.length == 0
  ).toBeFalsy()

  //Validate 0 not being valid Endpoint ID
  var endpoint = {
    endpointId: '0',
    networkId: 'blah',
  }
  expect(
    Validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
  ).toBeFalsy()

  //Validate out of bounds on endpointId
  var endpoint = {
    endpointId: '0xFFFFFFFF',
    networkId: 'blah',
  }
  expect(
    Validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
  ).toBeFalsy()
}, 2000)
