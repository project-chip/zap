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

const fs = require('fs')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const validation = require('../src-electron/validation/validation')
const querySession = require('../src-electron/db/query-session')
const queryConfig = require('../src-electron/db/query-config')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const queryEndpointType = require('../src-electron/db/query-endpoint-type')
const queryZcl = require('../src-electron/db/query-zcl')
const queryDeviceType = require('../src-electron/db/query-device-type')
const testQuery = require('./test-query')
const env = require('../src-electron/util/env')
const types = require('../src-electron/util/types')
const { timeout } = require('./test-util')

let db
let sid
let pkgId

beforeAll(() => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('validation')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
    })
}, timeout.medium())

afterAll(() => dbApi.closeDatabase(db), timeout.short())

test(
  'Load the static data.',
  async () => {
    let context = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
    pkgId = context.packageId
    sid = await testQuery.createSession(
      db,
      'USER',
      'SESSION',
      env.builtinSilabsZclMetafile(),
      env.builtinTemplateMetafile()
    )
  },
  timeout.medium()
)

test(
  'isValidNumberString Functions',
  () => {
    // Integer
    expect(validation.isValidNumberString('5')).toBeTruthy()
    expect(validation.isValidNumberString('-5')).toBeTruthy()
    expect(validation.isValidNumberString('5.6')).toBeFalsy()
    expect(validation.isValidNumberString('-5.6')).toBeFalsy()
    expect(validation.isValidNumberString('.0001')).toBeFalsy()
    expect(validation.isValidNumberString('-.0001')).toBeFalsy()
    expect(validation.isValidNumberString('0x0000')).toBeTruthy()
    expect(validation.isValidNumberString('0x0001')).toBeTruthy()
    expect(validation.isValidNumberString('0x000G')).toBeFalsy()
    // Float
    expect(validation.isValidFloat('5')).toBeTruthy()
    expect(validation.isValidFloat('-5')).toBeTruthy()
    expect(validation.isValidFloat('5.6')).toBeTruthy()
    expect(validation.isValidFloat('-5.6')).toBeTruthy()
    expect(validation.isValidFloat('.0001')).toBeTruthy()
    expect(validation.isValidFloat('-.0001')).toBeTruthy()
    expect(validation.isValidFloat('0x0000')).toBeFalsy()
    expect(validation.isValidFloat('0x0001')).toBeFalsy()
    expect(validation.isValidFloat('0x000G')).toBeFalsy()
    expect(validation.isValidFloat('5.6....')).toBeFalsy()
  },
  timeout.medium()
)

test(
  'extractValue Functions',
  () => {
    //Integer
    expect(validation.extractIntegerValue('5') == 5).toBeTruthy()
    expect(validation.extractIntegerValue('0x05') == 5).toBeTruthy()
    expect(validation.extractIntegerValue('A') == 10).toBeTruthy()
    //float
    expect(validation.extractFloatValue('0.53') == 0.53).toBeTruthy()
    expect(validation.extractFloatValue('.53') == 0.53).toBeTruthy()
    // big
    expect(
      validation.extractBigIntegerValue('0x7FFFFFFFFFFFFF') ==
        36028797018963967n
    ).toBeTruthy()
  },
  timeout.medium()
)

test('getIntegerFromAttribute function', () => {
  //Decimal over hex
  //expect(validation.getIntegerFromAttribute(''))
  //Convert hex
})

test('Test hex unsigned to signed conversion', () => {
  // testing the available bit representation extreme values

  //8 bits
  expect(validation.unsignedToSignedInteger(0x80, 8) == -128).toBeTruthy()
  expect(validation.unsignedToSignedInteger(0x7f, 8) == 127).toBeTruthy()

  // 16 bits
  expect(validation.unsignedToSignedInteger(0x8000, 16) == -32768).toBeTruthy()
  expect(validation.unsignedToSignedInteger(0x7fff, 16) == 32767).toBeTruthy()

  // 24 bits
  expect(
    validation.unsignedToSignedInteger(0x800000, 24) == -8388608
  ).toBeTruthy()
  expect(
    validation.unsignedToSignedInteger(0x7fffff, 24) == 8388607
  ).toBeTruthy()

  // 32 bits
  expect(
    validation.unsignedToSignedInteger(0x80000000n, 32) == -2147483648n
  ).toBeTruthy()
  expect(
    validation.unsignedToSignedInteger(0x7fffffffn, 32) == 2147483647n
  ).toBeTruthy()

  // 40 bits
  expect(
    validation.unsignedToSignedInteger(0x8000000000n, 40) == -549755813888n
  ).toBeTruthy()
  expect(
    validation.unsignedToSignedInteger(0x7fffffffffn, 40) == 549755813887n
  ).toBeTruthy()

  // 48 bits
  expect(
    validation.unsignedToSignedInteger(0x800000000000n, 48) == -140737488355328n
  ).toBeTruthy()
  expect(
    validation.unsignedToSignedInteger(0x7fffffffffffn, 48) == 140737488355327n
  ).toBeTruthy()

  // 54 bits
  expect(
    validation.unsignedToSignedInteger(0x80000000000000n, 56) ==
      -36028797018963968n
  ).toBeTruthy()

  expect(
    validation.unsignedToSignedInteger(0x7fffffffffffffn, 56) ==
      36028797018963967n
  ).toBeTruthy()

  // 64 bits
  expect(
    validation.unsignedToSignedInteger(0x8000000000000000n, 64) ==
      -9223372036854775808n
  ).toBeTruthy()
  expect(
    validation.unsignedToSignedInteger(0x7fffffffffffffffn, 64) ==
      9223372036854775807n
  ).toBeTruthy()
})

test(
  'Test int bounds',
  () => {
    //Integer
    expect(validation.checkBoundsInteger(50, 25, 60)).toBeTruthy()
    expect(!validation.checkBoundsInteger(50, 25, 20)).toBeTruthy()
    expect(!validation.checkBoundsInteger(50, 51, 55)).toBeTruthy()
    expect(!validation.checkBoundsInteger(30, 'avaa', 2)).toBeTruthy()
    expect(!validation.checkBoundsInteger(30, 45, 50)).toBeTruthy()
    expect(validation.checkBoundsInteger('asdfa', 40, 50)).toBeFalsy()
    expect(validation.checkBoundsInteger(-32, -128, 127)).toBeTruthy()

    //Float
    expect(validation.checkBoundsFloat(35.0, 25, 50.0))
    expect(!validation.checkBoundsFloat(351.0, 25, 50.0))
    expect(!validation.checkBoundsFloat(351.0, 355, 5650.0))
  },
  timeout.medium()
)

test(
  'Validate types',
  () => {
    expect(types.isString('CHAR_STRING'))

    expect(types.isString('char_string'))
    expect(types.isString('OCTET_STRING'))
    expect(types.isString('LONG_CHAR_STRING'))
    expect(types.isString('LONG_OCTET_STRING'))
    expect(!types.isString('FLOAT_SEMI'))

    expect(types.isFloat('FLOAT_SEMI'))
    expect(types.isFloat('FLOAT_SINGLE'))
    expect(types.isFloat('FLOAT_DOUBLE'))
    expect(!types.isFloat('LONG_OCTET_STRING'))
  },
  timeout.medium()
)

test(
  'Integer Test',
  async () => {
    let attribute =
      await queryZcl.selectAttributesByClusterCodeAndManufacturerCode(
        db,
        pkgId,
        3,
        null
      )
    attribute = attribute.filter((e) => {
      return e.code === 0
    })[0]

    const { size, isSigned } = await validation.getIntegerAttributeSize(
      db,
      sid,
      attribute.type
    )
    //Test Constraints
    let minMax = await validation.getBoundsInteger(attribute, size, isSigned)
    expect(minMax.min == 0).toBeTruthy()
    expect(minMax.max === 0xffff).toBeTruthy()
  },
  timeout.medium()
)

test(
  'validate Attribute Test',
  async () => {
    let fakeEndpointAttribute = {
      defaultValue: '30'
    }

    let fakeAttribute = {
      type: 'int16u',
      min: '0x0010',
      max: '50'
    }

    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeTruthy()

    // Check for if attribute is out of bounds.
    fakeEndpointAttribute.defaultValue = '60'
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeFalsy()

    fakeEndpointAttribute.defaultValue = '5'
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeFalsy()

    //Check if attribute is actually a number
    fakeEndpointAttribute.defaultValue = 'xxxxxx'
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeFalsy()

    fakeAttribute = {
      type: 'FLOAT_SINGLE',
      min: '0.5',
      max: '2'
    }

    fakeEndpointAttribute = {
      defaultValue: '1.5'
    }
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeTruthy()
    //Check out of bounds.
    fakeEndpointAttribute = {
      defaultValue: '4.5'
    }
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeFalsy()
    fakeEndpointAttribute = {
      defaultValue: '.25'
    }
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeFalsy()

    //Check if attribute is actually a number
    fakeEndpointAttribute.defaultValue = 'xxxxxx'
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeFalsy()

    // Expect no issues with strings.
    fakeAttribute = {
      type: 'CHAR_STRING'
    }
    fakeEndpointAttribute = {
      defaultValue: '30adfadf'
    }
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttribute,
          fakeAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeTruthy()

    // check if handle signed numbers
    let fakeEndpointAttributeValid = {
      defaultValue: '549755813887'
    }
    let fakeEndpointAttributeInvalid = {
      defaultValue: '549755813885'
    }
    let fakeSignedAttribute = {
      type: 'int40s',
      min: '0x7FFFFFFFFE',
      max: '0x8000000000'
    }
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttributeValid,
          fakeSignedAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeTruthy()
    expect(
      (
        await validation.validateSpecificAttribute(
          fakeEndpointAttributeInvalid,
          fakeSignedAttribute,
          db,
          sid
        )
      ).defaultValue.length == 0
    ).toBeFalsy()
  },
  timeout.medium()
)

test(
  'validate endpoint test',
  () => {
    //Validate normal operation
    let endpoint = {
      endpointId: '1',
      networkId: '0'
    }
    expect(
      validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
    ).toBeTruthy()
    expect(
      validation.validateSpecificEndpoint(endpoint).networkId.length == 0
    ).toBeTruthy()

    //Validate not a number
    endpoint = {
      endpointId: 'blah',
      networkId: 'blah'
    }
    expect(
      validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
    ).toBeFalsy()
    expect(
      validation.validateSpecificEndpoint(endpoint).networkId.length == 0
    ).toBeFalsy()

    //Validate 0 not being valid Endpoint ID
    endpoint = {
      endpointId: '0',
      networkId: 'blah'
    }
    expect(
      validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
    ).toBeFalsy()

    //Validate out of bounds on endpointId
    endpoint = {
      endpointId: '0xFFFFFFFF',
      networkId: 'blah'
    }
    expect(
      validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
    ).toBeFalsy()
  },
  timeout.medium()
)

describe('Validate endpoint for duplicate endpointIds', () => {
  let endpointTypeIdOnOff
  let endpointTypeReference
  let eptId
  let pkgId
  beforeAll(async () => {
    let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
    pkgId = ctx.packageId

    sid = await testQuery.createSession(
      db,
      'USER',
      'SESSION',
      env.builtinSilabsZclMetafile(),
      env.builtinTemplateMetafile()
    )

    let rows = await queryDeviceType.selectAllDeviceTypes(db, pkgId)
    let haOnOffDeviceTypeArray = rows.filter(
      (data) => data.label === 'HA-onoff'
    )
    let haOnOffDeviceType = haOnOffDeviceTypeArray[0]
    let deviceTypeId = haOnOffDeviceType.id
    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromDeviceType(
        db,
        sid,
        deviceTypeId
      )
    let rowId = await queryConfig.insertEndpointType(
      db,
      sessionPartitionInfo[0],
      'testEndpointType',
      deviceTypeId,
      haOnOffDeviceType.code,
      0,
      true
    )
    endpointTypeIdOnOff = rowId
    let endpointType = await queryEndpointType.selectEndpointType(db, rowId)
    await queryEndpoint.insertEndpoint(
      db,
      sid,
      1,
      endpointType.endpointTypeId,
      1,
      23
    )
    eptId = await queryEndpoint.insertEndpoint(
      db,
      sid,
      1,
      endpointType.endpointTypeId,
      1,
      23
    )
  }, timeout.long())
  test(
    'Test endpoint for duplicates',
    () =>
      validation
        .validateEndpoint(db, eptId)
        .then((data) => validation.validateNoDuplicateEndpoints(db, eptId, sid))
        .then((hasNoDuplicates) => {
          expect(hasNoDuplicates).toBeFalsy()
        }),
    timeout.medium()
  )
})
