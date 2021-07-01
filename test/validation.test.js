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
const dbApi = require('../src-electron/db/db-api.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const validation = require('../src-electron/validation/validation.js')
const querySession = require('../src-electron/db/query-session.js')
const queryConfig = require('../src-electron/db/query-config.js')
const queryEndpoint = require('../src-electron/db/query-endpoint.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const env = require('../src-electron/util/env.js')
const util = require('../src-electron/util/util.js')
const types = require('../src-electron/util/types.js')
const { timeout } = require('./test-util.js')

let db
let sid
let pkgId

beforeAll(() => {
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
    let context = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile)
    pkgId = context.packageId
  },
  timeout.medium()
)

test(
  'isValidNumberString Functions',
  () => {
    // Integer
    expect(validation.isValidNumberString('0x0000')).toBeTruthy()
    expect(validation.isValidNumberString('0x0001')).toBeTruthy()
    expect(!validation.isValidNumberString('0x00asdfajaklsf;01')).toBeTruthy()
    // Float
    expect(validation.isValidFloat('5.6')).toBeTruthy()
    expect(validation.isValidFloat('5')).toBeTruthy()
    expect(!validation.isValidFloat('5.6....')).toBeTruthy()
    expect(validation.isValidFloat('.0001')).toBeTruthy()
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
  },
  timeout.medium()
)

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
  () =>
    queryZcl
      .selectAttributesByClusterCodeAndManufacturerCode(db, pkgId, 3, null)
      .then((attribute) => {
        attribute = attribute.filter((e) => {
          return e.code === 0
        })[0]

        //Test Constraints
        let minMax = validation.getBoundsInteger(attribute)
        expect(minMax.min == 0).toBeTruthy()
        expect(minMax.max === 0xffff).toBeTruthy()
      }),
  timeout.medium()
)

test(
  'validate Attribute Test',
  () => {
    let fakeEndpointAttribute = {
      defaultValue: '30',
    }

    let fakeAttribute = {
      type: 'UINT16',
      min: '0x0010',
      max: '50',
    }

    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeTruthy()
    // Check for if attribute is out of bounds.
    fakeEndpointAttribute.defaultValue = '60'
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeFalsy()
    fakeEndpointAttribute.defaultValue = '5'
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeFalsy()

    //Check if attribute is actually a number
    fakeEndpointAttribute.defaultValue = 'xxxxxx'
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeFalsy()

    fakeAttribute = {
      type: 'FLOAT_SINGLE',
      min: '0.5',
      max: '2',
    }

    fakeEndpointAttribute = {
      defaultValue: '1.5',
    }
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeTruthy()
    //Check out of bounds.
    fakeEndpointAttribute = {
      defaultValue: '4.5',
    }
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeFalsy()
    fakeEndpointAttribute = {
      defaultValue: '.25',
    }
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeFalsy()

    //Check if attribute is actually a number
    fakeEndpointAttribute.defaultValue = 'xxxxxx'
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeFalsy()

    // Expect no issues with strings.
    fakeAttribute = {
      type: 'CHAR_STRING',
    }
    fakeEndpointAttribute = {
      defaultValue: '30adfadf',
    }
    expect(
      validation.validateSpecificAttribute(fakeEndpointAttribute, fakeAttribute)
        .defaultValue.length == 0
    ).toBeTruthy()
  },
  timeout.medium()
)

test(
  'validate endpoint test',
  () => {
    //Validate normal operation
    let endpoint = {
      endpointId: '1',
      networkId: '0',
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
      networkId: 'blah',
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
      networkId: 'blah',
    }
    expect(
      validation.validateSpecificEndpoint(endpoint).endpointId.length == 0
    ).toBeFalsy()

    //Validate out of bounds on endpointId
    endpoint = {
      endpointId: '0xFFFFFFFF',
      networkId: 'blah',
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
    let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile)
    pkgId = ctx.packageId
    let userSession = await querySession.ensureZapUserAndSession(
      db,
      'USER',
      'SESSION'
    )
    await util.initializeSessionPackage(db, userSession.sessionId, {
      zcl: env.builtinSilabsZclMetafile,
      template: env.builtinTemplateMetafile,
    })

    sid = userSession.sessionId
    let rows = await queryZcl.selectAllDeviceTypes(db, pkgId)
    let haOnOffDeviceTypeArray = rows.filter(
      (data) => data.label === 'HA-onoff'
    )
    let haOnOffDeviceType = haOnOffDeviceTypeArray[0]
    let deviceTypeId = haOnOffDeviceType.id
    let rowId = await queryConfig.insertEndpointType(
      db,
      sid,
      'testEndpointType',
      deviceTypeId
    )
    endpointTypeIdOnOff = rowId
    let endpointType = await queryZcl.selectEndpointType(db, rowId)
    await queryEndpoint.insertEndpoint(
      db,
      sid,
      1,
      endpointType.endpointTypeId,
      1,
      23,
      43
    )
    eptId = await queryEndpoint.insertEndpoint(
      db,
      sid,
      1,
      endpointType.endpointTypeId,
      1,
      23,
      43
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
