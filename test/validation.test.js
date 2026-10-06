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
const queryPackageNotification = require('../src-electron/db/query-package-notification')
const validateAll = require('../src-electron/validation/validate-all')
const importJs = require('../src-electron/importexport/import.js')
const util = require('../src-electron/util/util.js')
const generatorEngine = require('../src-electron/generator/generation-engine.js')
const path = require('path')

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
    expect(validation.checkBoundsFloat(35.0, 25, 50.0)).toBeTruthy()
    expect(validation.checkBoundsFloat(351.0, 25, 50.0)).toBeFalsy()
    expect(validation.checkBoundsFloat(351.0, 355, 5650.0)).toBeFalsy()
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
      attribute.type,
      attribute.clusterRef
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

test('validate Attribute without min/max', async () => {
  //Invalid default value
  let fakeEndpointAttribute = { defaultValue: '300' }

  let fakeAttribute = { type: 'int8u' }

  let attributeValidation = await validation.validateSpecificAttribute(
    fakeEndpointAttribute,
    fakeAttribute,
    db,
    sid
  )

  expect(attributeValidation.defaultValue.length == 1).toBeTruthy()
  expect(
    attributeValidation.defaultValue[0].includes('Out of range')
  ).toBeTruthy()

  //Valid default value
  fakeEndpointAttribute.defaultValue = '30'
  attributeValidation = await validation.validateSpecificAttribute(
    fakeEndpointAttribute,
    fakeAttribute,
    db,
    sid
  )
  expect(attributeValidation.defaultValue.length == 0).toBeTruthy()

  //Invalid default value for enum16
  fakeEndpointAttribute.defaultValue = '66000'
  fakeAttribute.type = 'enum16'
  attributeValidation = await validation.validateSpecificAttribute(
    fakeEndpointAttribute,
    fakeAttribute,
    db,
    sid
  )
  expect(attributeValidation.defaultValue.length == 1).toBeTruthy()
  expect(
    attributeValidation.defaultValue[0].includes('Out of range')
  ).toBeTruthy()

  //Valid default value for enum16
  fakeEndpointAttribute.defaultValue = '65535'
  attributeValidation = await validation.validateSpecificAttribute(
    fakeEndpointAttribute,
    fakeAttribute,
    db,
    sid
  )
  expect(attributeValidation.defaultValue.length == 0).toBeTruthy()

  //Invalid default value for bitmap8
  fakeEndpointAttribute.defaultValue = '-2'
  fakeAttribute.type = 'bitmap8'
  attributeValidation = await validation.validateSpecificAttribute(
    fakeEndpointAttribute,
    fakeAttribute,
    db,
    sid
  )
  expect(attributeValidation.defaultValue.length == 1).toBeTruthy()
  expect(
    attributeValidation.defaultValue[0].includes('Out of range')
  ).toBeTruthy()

  //Valid default value for bitmap8
  fakeEndpointAttribute.defaultValue = '255'
  attributeValidation = await validation.validateSpecificAttribute(
    fakeEndpointAttribute,
    fakeAttribute,
    db,
    sid
  )
  expect(attributeValidation.defaultValue.length == 0).toBeTruthy()
})

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

test(
  'validateXmlAttributeDefault - integer out of range',
  async () => {
    // Check that notification was created
    let notifications =
      await queryPackageNotification.getNotificationByPackageId(db, pkgId)
    let xmlValidationNotifs = notifications.filter((n) =>
      n.message.includes(
        'XML validation issues for attribute "active power max phase b" (type: int16s, defaultvalue: 0xffff): Out of range (min: -32768, max: 32767)'
      )
    )
    expect(xmlValidationNotifs.length).toBeGreaterThan(0)
    expect(xmlValidationNotifs[0].type).toBe('WARNING')
  },
  timeout.medium()
)

describe('Float validation', () => {
  test(
    'sync helpers (type range, extract, bounds, getBoundsFloat)',
    () => {
      const fltMax = 3.4028234663852886e38
      ;[
        [16, true, -65504],
        [16, false, 65504],
        [32, true, -fltMax],
        [32, false, fltMax],
        [64, true, -Number.MAX_VALUE],
        [64, false, Number.MAX_VALUE]
      ].forEach(([bits, isMin, exp]) =>
        expect(validation.getFloatTypeRange(bits, isMin)).toBeCloseTo(exp)
      )
      expect(validation.getFloatTypeRange(undefined, true)).toBe(
        -Number.MAX_VALUE
      )
      expect(validation.getFloatTypeRange(99, false)).toBe(Number.MAX_VALUE)

      expect(Number.isNaN(validation.extractFloatValue(null))).toBeTruthy()
      expect(
        Number.isNaN(validation.extractFloatValue('0x42C80000'))
      ).toBeTruthy()
      expect(validation.extractFloatValue('1.5')).toBe(1.5)

      expect(validation.checkBoundsFloat(0, NaN, NaN)).toBeTruthy()
      expect(validation.checkBoundsFloat(0, null, null)).toBeTruthy()
      expect(validation.checkBoundsFloat(NaN, 0, 10)).toBeFalsy()

      const b = validation.getBoundsFloat({ min: '0.5', max: '2.5' }, 32)
      expect(b.min).toBe(0.5)
      expect(b.max).toBe(2.5)
      const s = validation.getBoundsFloat({}, 32)
      expect(s.min).toBeCloseTo(-fltMax)
      expect(s.max).toBeCloseTo(fltMax)
      const h = validation.getBoundsFloat({}, 16)
      expect(h.min).toBeCloseTo(-65504)
      expect(h.max).toBeCloseTo(65504)
      const ns = validation.getBoundsFloat({})
      expect(ns.min).toBe(-Number.MAX_VALUE)
      expect(ns.max).toBe(Number.MAX_VALUE)
      const om = validation.getBoundsFloat({ min: '-1' }, 32)
      expect(om.min).toBe(-1)
      expect(om.max).toBeCloseTo(fltMax)
      const ox = validation.getBoundsFloat(
        { min: '0x00000000', max: '0x3F800000' },
        32
      )
      expect(ox.min).toBe(0)
      expect(ox.max).toBeCloseTo(1.0)
      const oxNs = validation.getBoundsFloat({
        min: '0x00000000',
        max: '0x3F800000'
      })
      expect(Number.isNaN(oxNs.min)).toBeTruthy()
      expect(Number.isNaN(oxNs.max)).toBeTruthy()
    },
    timeout.short()
  )

  test(
    'getFloatFromAttribute / isValidFloat (IEEE hex + rejections)',
    () => {
      const g = validation.getFloatFromAttribute
      const close = [
        ['0x3C00', 16, 1],
        ['0x4000', 16, 2],
        ['0xBC00', 16, -1],
        ['0xFBFF', 16, -65504],
        ['0x3F800000', 32, 1],
        ['0x40000000', 32, 2],
        ['0xBF800000', 32, -1],
        ['0x7F7FFFFF', 32, 3.4028234663852886e38],
        ['0x3FF0000000000000', 64, 1],
        ['0xBFF0000000000000', 64, -1]
      ]
      close.forEach(([hex, bits, exp]) => expect(g(hex, bits)).toBeCloseTo(exp))
      expect(g('0x0000', 16)).toBe(0)
      expect(g('0x00000000', 32)).toBe(0)
      expect(g('0x0000000000000000', 64)).toBe(0)
      expect(g('0x7C00', 16)).toBe(Infinity)
      expect(g('0xFC00', 16)).toBe(-Infinity)
      expect(Number.isNaN(g('0x7E00', 16))).toBeTruthy()
      expect(g('0x7FEFFFFFFFFFFFFF', 64)).toBe(Number.MAX_VALUE)
      expect(g('1.5', 32)).toBe(1.5)
      expect(g('0', undefined)).toBe(0)
      ;[
        ['0x3F800000', undefined],
        ['0x3F800000', 16],
        ['0x3FF0000000000000', 32],
        ['0x3C00', 24],
        ['0x12GH', 16],
        [null, 32]
      ].forEach(([h, b]) => expect(Number.isNaN(g(h, b))).toBeTruthy())

      expect(validation.isValidFloat('0x3F800000')).toBeFalsy()
      expect(validation.isValidFloat('0x3F800000', 32)).toBeTruthy()
      expect(validation.isValidFloat('0x3F800000', 16)).toBeFalsy()
      expect(validation.isValidFloat('0x000G', 32)).toBeFalsy()
    },
    timeout.short()
  )

  test(
    'getFloatAttributeSize and validateSpecificAttribute (float)',
    async () => {
      const sz = (t) => validation.getFloatAttributeSize(db, sid, t, null)
      expect((await sz('float_semi')).size).toBe(16)
      expect((await sz('float_single')).size).toBe(32)
      expect((await sz('float_double')).size).toBe(64)
      expect(
        (await sz('definitely_not_a_real_float_type')).size
      ).toBeUndefined()

      const run = async (dv, attr) =>
        (
          await validation.validateSpecificAttribute(
            { defaultValue: dv },
            attr,
            db,
            sid
          )
        ).defaultValue

      const cases = [
        ['1.5', { type: 'float_single', min: '0.5', max: '2.5' }, 'ok'],
        [
          '0.25',
          { type: 'float_single', min: '0.5', max: '2.5' },
          'Out of range'
        ],
        [
          '4.5',
          { type: 'float_single', min: '0.5', max: '2.5' },
          'Out of range'
        ],
        ['-1.0', { type: 'float_single', min: '-2.0', max: '2.0' }, 'ok'],
        [
          'not a number',
          { type: 'float_single', min: '0', max: '10' },
          'Invalid Float'
        ],
        [
          '1.2.3',
          { type: 'float_single', min: '0', max: '10' },
          'Invalid Float'
        ],
        [
          '0x3F8000GG',
          { type: 'float_single', min: '0', max: '10' },
          'Invalid Float'
        ],
        [
          '0x3F8000000000',
          { type: 'float_single', min: '0', max: '10' },
          'Invalid Float'
        ],
        ['1e40', { type: 'float_single' }, 'Out of range'],
        ['1e40', { type: 'float_double' }, 'ok'],
        ['70000', { type: 'float_semi' }, 'Out of range'],
        ['65504', { type: 'float_semi' }, 'ok'],
        [
          null,
          { type: 'float_single', isNullable: true, min: '0', max: '1' },
          'ok'
        ],
        ['0x3F800000', { type: 'float_single', min: '0', max: '2' }, 'ok'],
        [
          '0xC0000000',
          { type: 'float_single', min: '0', max: '2' },
          'Out of range'
        ],
        ['0x3C00', { type: 'float_semi', min: '0', max: '2' }, 'ok'],
        [
          '0x3FF0000000000000',
          { type: 'float_double', min: '0', max: '2' },
          'ok'
        ],
        [
          '0.5',
          { type: 'float_single', min: '0x00000000', max: '0x3F800000' },
          'ok'
        ],
        [
          '1.5',
          { type: 'float_single', min: '0x00000000', max: '0x3F800000' },
          'Out of range'
        ]
      ]
      for (const [dv, attr, want] of cases) {
        const issues = await run(dv, attr)
        if (want === 'ok') expect(issues.length).toBe(0)
        else expect(issues).toContain(want)
      }
    },
    timeout.medium()
  )
})

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
    // The schema's UNIQUE(ENDPOINT_TYPE_REF, ENDPOINT_IDENTIFIER) plus
    // INSERT OR REPLACE in queryEndpoint.insertEndpoint means the only way
    // to actually have two endpoints sharing an identifier is to put them
    // on different endpoint types, so create a second endpoint type here.
    let secondEndpointTypeRowId = await queryConfig.insertEndpointType(
      db,
      sessionPartitionInfo[0],
      'testEndpointTypeDup',
      deviceTypeId,
      haOnOffDeviceType.code,
      0,
      true
    )
    let secondEndpointType = await queryEndpointType.selectEndpointType(
      db,
      secondEndpointTypeRowId
    )
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
      secondEndpointType.endpointTypeId,
      1,
      23
    )
  }, timeout.long())
  test(
    'Test endpoint for duplicates',
    () =>
      validation
        .validateEndpoint(db, eptId)
        .then((data) => validation.validateNoDuplicateEndpoints(db, 1, sid))
        .then((hasNoDuplicates) => {
          expect(hasNoDuplicates).toBeFalsy()
        }),
    timeout.medium()
  )
})

describe('validateAll', () => {
  let vdb
  beforeAll(async () => {
    let file = env.sqliteTestFile('validate-all')
    vdb = await dbApi.initDatabaseAndLoadSchema(
      file,
      env.schemaFile(),
      env.zapVersion()
    )
    await zclLoader.loadZcl(vdb, env.builtinMatterZclMetafile())
    let ctx = await generatorEngine.loadTemplates(
      vdb,
      env.builtinTemplateMetafile(),
      {
        failOnLoadingError: true
      }
    )
    if (ctx.error) {
      throw ctx.error
    }
  }, timeout.long())
  afterAll(() => dbApi.closeDatabase(vdb), timeout.short())

  test(
    'full session validation report for matter-test.zap',
    async () => {
      const zapPath = path.join(__dirname, 'resource/matter-test.zap')
      const importResult = await importJs.importDataFromFile(vdb, zapPath, {
        defaultZclMetafile: env.builtinMatterZclMetafile(),
        packageMatch: 'fuzzy'
      })
      await util.ensurePackagesAndPopulateSessionOptions(
        vdb,
        importResult.sessionId,
        {
          zcl: env.builtinMatterZclMetafile(),
          template: env.builtinTemplateMetafile()
        }
      )
      const report = await validateAll.validateAll(vdb, importResult.sessionId)
      expect(report.summary).toBeDefined()
      expect(typeof report.summary.errors).toBe('number')
      expect(typeof report.summary.warnings).toBe('number')
      expect(report.summary.endpoints).toBeGreaterThan(0)
      expect(report.summary.attributes).toBeGreaterThan(0)
      expect(Array.isArray(report.endpoints)).toBe(true)
      expect(Array.isArray(report.attributes)).toBe(true)
      expect(Array.isArray(report.conformance)).toBe(true)
    },
    timeout.long()
  )
})

describe('validateSpecificEndpoint Matter root-node handling', () => {
  test(
    'flags endpoint 0 in a non-Matter (Zigbee) session',
    () => {
      const issues = validation.validateSpecificEndpoint(
        { endpointId: '0', networkId: '0' },
        { isMatter: false }
      )
      expect(issues.endpointId).toContain('0 is not a valid endpointId')
    },
    timeout.short()
  )

  test(
    'allows endpoint 0 in a Matter session (Root Node)',
    () => {
      const issues = validation.validateSpecificEndpoint(
        { endpointId: '0', networkId: '0' },
        { isMatter: true }
      )
      expect(issues.endpointId).not.toContain('0 is not a valid endpointId')
    },
    timeout.short()
  )

  test(
    'still flags out-of-range endpoint ids in Matter sessions',
    () => {
      const issues = validation.validateSpecificEndpoint(
        { endpointId: '0xFFFFFF', networkId: '0' },
        { isMatter: true }
      )
      expect(issues.endpointId).toContain('EndpointId is out of valid range')
    },
    timeout.short()
  )
})

describe('validate-all null pre-check', () => {
  let nvdb
  let nsid
  beforeAll(async () => {
    let file = env.sqliteTestFile('validate-all-null')
    nvdb = await dbApi.initDatabaseAndLoadSchema(
      file,
      env.schemaFile(),
      env.zapVersion()
    )
    await zclLoader.loadZcl(nvdb, env.builtinSilabsZclMetafile())
    nsid = await testQuery.createSession(
      nvdb,
      'USER',
      'NULL_EP_SESSION',
      env.builtinSilabsZclMetafile(),
      env.builtinTemplateMetafile()
    )
    await dbApi.dbInsert(
      nvdb,
      'INSERT INTO ENDPOINT (SESSION_REF, ENDPOINT_TYPE_REF, ENDPOINT_IDENTIFIER, NETWORK_IDENTIFIER) VALUES (?, NULL, NULL, NULL)',
      [nsid]
    )
  }, timeout.long())
  afterAll(() => dbApi.closeDatabase(nvdb), timeout.short())

  test(
    'validateAll flags endpoints with a missing identifier',
    async () => {
      const report = await validateAll.validateAll(nvdb, nsid, {
        conformance: false
      })
      expect(report.endpoints.length).toBeGreaterThan(0)
      const allEndpointIssues = report.endpoints.flatMap(
        (e) => e.issues.endpointId
      )
      expect(allEndpointIssues).toContain('EndpointId is missing')
    },
    timeout.medium()
  )
})
