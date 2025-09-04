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
const testUtil = require('./test-util')
const env = require('../src-electron/util/env')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const dbApi = require('../src-electron/db/db-api')
const queryDeviceType = require('../src-electron/db/query-device-type')
const queryFeature = require('../src-electron/db/query-feature')
const querySession = require('../src-electron/db/query-session')
const queryConfig = require('../src-electron/db/query-config')
const queryZcl = require('../src-electron/db/query-zcl')
const util = require('../src-electron/util/util')
const conformEvaluator = require('../src-electron/validation/conformance-expression-evaluator')
const conformChecker = require('../src-electron/validation/conformance-checker')
const testQuery = require('./test-query')
const httpServer = require('../src-electron/server/http-server')
const restApi = require('../src-shared/rest-api')
const axios = require('axios')
const dbEnum = require('../src-shared/db-enum')

let db
let ctx
let pkgId
let sid
let eptId
let MA_dimmablelight
let deviceTypeName = 'MA-dimmablelight'
let axiosInstance = null
let clusters = null
let onOffCluster = null

beforeAll(async () => {
  const { port, baseUrl } = testUtil.testServer(__filename)
  env.setDevelopmentEnv()
  axiosInstance = axios.create({ baseURL: baseUrl })
  let file = env.sqliteTestFile('feature')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  // load Matter packages for testing features
  ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  pkgId = ctx.packageId
  await httpServer.initHttpServer(db, port)

  let userSession = await querySession.ensureZapUserAndSession(
    db,
    'USER',
    'SESSION'
  )
  sid = userSession.sessionId

  await util.ensurePackagesAndPopulateSessionOptions(
    db,
    sid,
    {
      zcl: env.builtinMatterZclMetafile(),
      template: testUtil.testTemplate.matter3,
      partitions: 2
    },
    null,
    pkgId
  )

  /** test with MA-dimmablelight device type, the only device type 
      associated with features in current xml file
      it should have 3 device type features */
  MA_dimmablelight = await queryDeviceType.selectDeviceTypeByCodeAndName(
    db,
    pkgId,
    257,
    deviceTypeName
  )
  let sessionPartitionInfo =
    await querySession.selectSessionPartitionInfoFromDeviceType(
      db,
      sid,
      MA_dimmablelight.id
    )
  eptId = await queryConfig.insertEndpointType(
    db,
    sessionPartitionInfo[0],
    'testEndpointType',
    MA_dimmablelight.id,
    MA_dimmablelight.code,
    0,
    true
  )

  clusters = await testQuery.getAllEndpointTypeClusterState(db, eptId)
  onOffCluster = clusters.find((cluster) => cluster.clusterName == 'On/Off')
}, testUtil.timeout.medium())

afterAll(
  () => httpServer.shutdownHttpServer().then(() => dbApi.closeDatabase(db)),
  testUtil.timeout.medium()
)

test(
  'Get device type features by device type ref',
  async () => {
    let deviceTypeFeatures = await queryFeature.getFeaturesByDeviceTypeRefs(
      db,
      [MA_dimmablelight.id],
      eptId
    )
    expect(deviceTypeFeatures.length).toBe(3)

    let expectedDeviceTypeFeatures = [
      {
        cluster: 'On/Off',
        name: 'Lighting',
        conformance: 'M'
      },
      {
        cluster: 'Level Control',
        name: 'OnOff',
        conformance: 'M'
      },
      {
        cluster: 'Level Control',
        name: 'Lighting',
        conformance: 'M'
      }
    ]

    deviceTypeFeatures.forEach((feature) => {
      expect(feature.deviceType == deviceTypeName)
      let expected = expectedDeviceTypeFeatures.find(
        (f) =>
          f.cluster == feature.cluster &&
          f.name == feature.name &&
          f.conformance == feature.conformance
      )
      expect(expected).toBeTruthy()
    })
  },
  testUtil.timeout.long()
)

test(
  'Evaluate customized conformance expression and operand extraction',
  () => {
    // cover elements with all upper and lower case and combinations
    const elementMap = {
      HS: true,
      Lt: true,
      oo: false,
      xY: false,
      Primary1X: true
    }
    let conformanceExpressions = [
      // 1. test basic conformance abbreviations
      { expression: 'M', expected: 'mandatory', operands: ['M'] },
      { expression: 'O', expected: 'optional', operands: ['O'] },
      { expression: 'P', expected: 'provisional', operands: ['P'] },
      { expression: 'D', expected: 'notSupported', operands: ['D'] },
      { expression: 'X', expected: 'notSupported', operands: ['X'] },

      // 2. test simple mandatory conformance expression
      { expression: 'HS', expected: 'mandatory', operands: ['HS'] },
      { expression: 'oo', expected: 'notSupported', operands: ['oo'] },
      { expression: 'HS & Lt', expected: 'mandatory', operands: ['HS', 'Lt'] },
      {
        expression: 'HS & oo',
        expected: 'notSupported',
        operands: ['HS', 'oo']
      },
      { expression: 'HS | oo', expected: 'mandatory', operands: ['HS', 'oo'] },
      {
        expression: 'HS & Lt & oo',
        expected: 'notSupported',
        operands: ['HS', 'Lt', 'oo']
      },
      {
        expression: 'HS | Lt | oo',
        expected: 'mandatory',
        operands: ['HS', 'Lt', 'oo']
      },
      {
        expression: 'HS & (Lt | oo)',
        expected: 'mandatory',
        operands: ['HS', 'Lt', 'oo']
      },
      {
        expression: 'HS & (oo | xY)',
        expected: 'notSupported',
        operands: ['HS', 'oo', 'xY']
      },
      {
        expression: '(HS & oo) | Lt',
        expected: 'mandatory',
        operands: ['HS', 'oo', 'Lt']
      },
      {
        expression: 'HS & (Lt | oo | xY)',
        expected: 'mandatory',
        operands: ['HS', 'Lt', 'oo', 'xY']
      },
      {
        expression: 'oo | (HS & Lt & xY)',
        expected: 'notSupported',
        operands: ['oo', 'HS', 'Lt', 'xY']
      },

      // 3. test NOT (!)
      { expression: '!HS', expected: 'notSupported', operands: ['HS'] },
      { expression: '!oo', expected: 'mandatory', operands: ['oo'] },
      {
        expression: '!HS & Lt',
        expected: 'notSupported',
        operands: ['HS', 'Lt']
      },
      { expression: 'HS & !oo', expected: 'mandatory', operands: ['HS', 'oo'] },
      {
        expression: '!(HS & Lt)',
        expected: 'notSupported',
        operands: ['HS', 'Lt']
      },
      {
        expression: '!(HS | oo)',
        expected: 'notSupported',
        operands: ['HS', 'oo']
      },
      {
        expression: '!(HS & oo)',
        expected: 'mandatory',
        operands: ['HS', 'oo']
      },

      // 4. test optional conformance expression with '[]'
      { expression: '[HS]', expected: 'optional', operands: ['HS'] },
      { expression: '[oo]', expected: 'notSupported', operands: ['oo'] },
      { expression: '[!HS]', expected: 'notSupported', operands: ['HS'] },
      { expression: '[!oo]', expected: 'optional', operands: ['oo'] },
      { expression: '[HS & Lt]', expected: 'optional', operands: ['HS', 'Lt'] },
      {
        expression: '[HS & oo]',
        expected: 'notSupported',
        operands: ['HS', 'oo']
      },
      { expression: '[HS | oo]', expected: 'optional', operands: ['HS', 'oo'] },
      {
        expression: '[!(HS & Lt)]',
        expected: 'notSupported',
        operands: ['HS', 'Lt']
      },
      {
        expression: '[!(HS | oo)]',
        expected: 'notSupported',
        operands: ['HS', 'oo']
      },
      {
        expression: '[!(HS & oo)]',
        expected: 'optional',
        operands: ['HS', 'oo']
      },

      // 5. test otherwise conformance expression
      { expression: 'P, O', expected: 'provisional', operands: ['P', 'O'] },
      { expression: 'P, M', expected: 'provisional', operands: ['P', 'M'] },
      { expression: 'P, HS', expected: 'provisional', operands: ['P', 'HS'] },
      { expression: 'P, [HS]', expected: 'provisional', operands: ['P', 'HS'] },
      { expression: 'HS, O', expected: 'mandatory', operands: ['HS', 'O'] },
      { expression: 'oo, O', expected: 'optional', operands: ['oo', 'O'] },
      { expression: 'oo, [HS]', expected: 'optional', operands: ['oo', 'HS'] },
      {
        expression: 'oo, [xY]',
        expected: 'notSupported',
        operands: ['oo', 'xY']
      },
      { expression: '[HS], D', expected: 'optional', operands: ['HS', 'D'] },
      {
        expression: '[oo], D',
        expected: 'notSupported',
        operands: ['oo', 'D']
      },
      {
        expression: 'HS, [Lt | oo | xY]',
        expected: 'mandatory',
        operands: ['HS', 'Lt', 'oo', 'xY']
      },
      {
        expression: 'oo, [Lt | oo | xY]',
        expected: 'optional',
        operands: ['oo', 'Lt', 'oo', 'xY']
      },
      {
        expression: 'oo, [xY | oo]',
        expected: 'notSupported',
        operands: ['oo', 'xY', 'oo']
      },
      {
        expression: 'HS & Lt, [oo]',
        expected: 'mandatory',
        operands: ['HS', 'Lt', 'oo']
      },
      {
        expression: 'HS & oo, [Lt]',
        expected: 'optional',
        operands: ['HS', 'oo', 'Lt']
      },
      {
        expression: 'HS & oo, [xY]',
        expected: 'notSupported',
        operands: ['HS', 'oo', 'xY']
      },
      {
        expression: 'HS | oo, [Lt & xY]',
        expected: 'mandatory',
        operands: ['HS', 'oo', 'Lt', 'xY']
      },
      {
        expression: 'oo | xY, [HS & Lt]',
        expected: 'optional',
        operands: ['oo', 'xY', 'HS', 'Lt']
      },
      {
        expression: 'xY | oo, [HS & xY]',
        expected: 'notSupported',
        operands: ['xY', 'oo', 'HS', 'xY']
      },

      // 6. test operands containing numbers
      {
        expression: 'Primary1X',
        expected: 'mandatory',
        operands: ['Primary1X']
      },
      {
        expression: 'Primary1X & HS',
        expected: 'mandatory',
        operands: ['Primary1X', 'HS']
      },
      {
        expression: 'Primary1X | oo',
        expected: 'mandatory',
        operands: ['Primary1X', 'oo']
      },

      // 7. test conformance with desc operands
      { expression: 'desc', expected: 'desc', operands: ['desc'] },
      { expression: 'HS & desc', expected: 'desc', operands: ['HS', 'desc'] },
      {
        expression: 'HS | (!xY && desc)',
        expected: 'desc',
        operands: ['HS', 'xY', 'desc']
      },
      { expression: 'P, desc', expected: 'desc', operands: ['P', 'desc'] }
    ]

    conformanceExpressions.forEach((expression) => {
      let result = conformEvaluator.evaluateConformanceExpression(
        expression.expression,
        elementMap
      )
      expect(result).toBe(expression.expected)

      let operands = conformEvaluator.getOperandsFromExpression(
        expression.expression
      )
      expect(operands).toEqual(expression.operands)
    })
  },
  testUtil.timeout.short()
)

test(
  'Translate conformance expression to natural language text',
  () => {
    const conformanceExpressions = [
      { expression: '', translation: '' },
      { expression: 'M', translation: 'mandatory' },
      { expression: 'O', translation: 'optional' },
      { expression: 'P', translation: 'provisional' },
      { expression: 'D', translation: 'deprecated' },
      { expression: 'X', translation: 'disallowed' },
      {
        expression: 'desc',
        translation: dbEnum.conformanceVal.described
      },
      {
        expression: 'HS',
        translation: 'mandatory if HS is enabled, otherwise it is not supported'
      },
      {
        expression: '[HS]',
        translation: 'optional if HS is enabled, otherwise it is not supported'
      },
      {
        expression: 'HS & LT',
        translation:
          'mandatory if HS is enabled and LT is enabled, otherwise it is not supported'
      },
      {
        expression: 'HS | LT',
        translation:
          'mandatory if HS is enabled or LT is enabled, otherwise it is not supported'
      },
      {
        expression: '!HS',
        translation:
          'mandatory if HS is not enabled, otherwise it is not supported'
      },
      {
        expression: '[!HS]',
        translation:
          'optional if HS is not enabled, otherwise it is not supported'
      },
      {
        expression: 'HS & !LT',
        translation:
          'mandatory if HS is enabled and LT is not enabled, otherwise it is not supported'
      },
      {
        expression: 'HS | LT | OO',
        translation:
          'mandatory if HS is enabled or LT is enabled or OO is enabled, otherwise it is not supported'
      },
      {
        expression: '[HS & LT & OO]',
        translation:
          'optional if HS is enabled and LT is enabled and OO is enabled, otherwise it is not supported'
      },
      {
        expression: '(HS & LT) | OO',
        translation:
          'mandatory if ( HS is enabled and LT is enabled ) or OO is enabled, otherwise it is not supported'
      },
      {
        expression: 'HS | (LT & OO)',
        translation:
          'mandatory if HS is enabled or ( LT is enabled and OO is enabled ), otherwise it is not supported'
      },
      {
        expression: 'HS, O',
        translation: 'mandatory if HS is enabled, otherwise it is optional'
      },
      {
        expression: 'HS, [LT]',
        translation:
          'mandatory if HS is enabled, otherwise it is optional if LT is enabled, otherwise it is not supported'
      },
      {
        expression: 'HS & LT, [!OO]',
        translation:
          'mandatory if HS is enabled and LT is enabled, otherwise it is optional if OO is not enabled, otherwise it is not supported'
      },
      {
        expression: 'P, O',
        translation:
          'provisional for now. When not provisional in the future, it is optional'
      },
      {
        expression: 'P, HS',
        translation:
          'provisional for now. When not provisional in the future, it is mandatory if HS is enabled, otherwise it is not supported'
      },
      {
        expression: 'P, [HS & LT]',
        translation:
          'provisional for now. When not provisional in the future, it is optional if HS is enabled and LT is enabled, otherwise it is not supported'
      },
      {
        expression: 'desc, O',
        translation:
          dbEnum.conformanceVal.described + ', otherwise it is optional'
      },
      {
        expression: '[HS & LT], D',
        translation:
          'optional if HS is enabled and LT is enabled, otherwise it is deprecated'
      },
      {
        expression: 'HS & LT, [OO & XY], D',
        translation:
          'mandatory if HS is enabled and LT is enabled, otherwise it is optional if OO is enabled and XY is enabled, otherwise it is deprecated'
      },
      {
        expression: '[HoldTime & (PIR | (!PIR & !US & !PHY))], D',
        translation:
          'optional if HoldTime is enabled and ( PIR is enabled or ( PIR is not enabled and US is not enabled and PHY is not enabled ) ), otherwise it is deprecated'
      },
      {
        expression: 'Matter & (HS | LT | OO)',
        translation:
          'mandatory if Matter is enabled and ( HS is enabled or LT is enabled or OO is enabled ), otherwise it is not supported'
      },
      {
        expression: '[!(LT | DF)]',
        translation:
          'optional if not ( LT is enabled or DF is enabled ), otherwise it is not supported'
      }
    ]

    conformanceExpressions.forEach((expression) => {
      let result = conformEvaluator.translateConformanceExpression(
        expression.expression
      )
      expect(result).toBe(expression.translation)
    })
  },
  testUtil.timeout.short()
)

test(
  'Check if an element has conformance with desc operands',
  () => {
    const elements = [
      { name: 'Element1', conformance: 'desc' },
      { name: 'Element2', conformance: 'P, desc' },
      { name: 'Element3', conformance: '[desc & XY]' },
      { name: 'Element4', conformance: 'desc, [HS]' },
      { name: 'Element5', conformance: 'desc | optional' },
      { name: 'Element6', conformance: 'notSupported' },
      { name: 'Element7', conformance: 'description' }
    ]

    let descOperands = conformEvaluator.filterRelatedDescElements(
      elements,
      'desc'
    )
    expect(descOperands).toEqual([
      { name: 'Element1', conformance: 'desc' },
      { name: 'Element2', conformance: 'P, desc' },
      { name: 'Element3', conformance: '[desc & XY]' },
      { name: 'Element4', conformance: 'desc, [HS]' },
      { name: 'Element5', conformance: 'desc | optional' }
    ])

    const featureCode = 'HS'
    let relatedDescOperands = conformEvaluator.filterRelatedDescElements(
      elements,
      featureCode
    )
    expect(relatedDescOperands).toEqual([
      { name: 'Element4', conformance: 'desc, [HS]' }
    ])
  },
  testUtil.timeout.short()
)

test(
  'Check elements with conformance needs to be updated and generate warnings',
  () => {
    /* simulate toggling features in Color Control cluster
       to test if elements with wrong conformance are checked and returned,
       and test if generated warnings are correct */
    // define part of elements in Color Control cluster
    let elements = {
      attributes: [
        { name: 'CurrentHue', conformance: 'HS', included: false },
        { name: 'DriftCompensation', conformance: 'O', included: false },
        { name: 'ColorMode', conformance: 'M', included: true },
        { name: 'EnhancedCurrentHue', conformance: 'EHUE', included: true },
        { name: 'ColorLoopActive', conformance: 'CL', included: true },
        { name: 'CurrentX', conformance: 'XY', included: true },
        { name: 'ColorTemperatureMireds', conformance: 'CT', included: true },
        {
          name: 'AttributeDependingOnUNKNOWN',
          conformance: 'UNKNOWN',
          included: false
        }
      ],
      commands: [
        { name: 'MoveToHue', conformance: 'HS', isEnabled: false },
        { name: 'EnhancedMoveToHue', conformance: 'EHUE', isEnabled: false },
        { name: 'ColorLoopSet', conformance: 'CL', isEnabled: false },
        { name: 'MoveColorTemperature', conformance: 'CT', isEnabled: true },
        { name: 'MoveToColor', conformance: 'XY', isEnabled: true },
        {
          name: 'CommandDependingOnUNKNOWN',
          conformance: 'UNKNOWN',
          isEnabled: false
        }
      ],
      events: [
        { name: 'event1', conformance: 'HS', included: false },
        { name: 'event2', conformance: 'O', included: false }
      ]
    }
    let featureMap = {
      HS: false,
      EHUE: false,
      CL: false,
      XY: true,
      CT: true,
      UNKNOWN: false
    }
    let deviceType = 'Matter Extended Color Light'
    let cluster = 'Color Control'
    let featureBit = 0
    let featureHS = {
      cluster: cluster,
      name: 'Hue/Saturation',
      code: 'HS',
      conformance: 'O',
      deviceTypes: [deviceType],
      bit: featureBit
    }
    let featureXY = {
      cluster: cluster,
      name: 'XY',
      code: 'XY',
      conformance: 'M',
      deviceTypes: [deviceType],
      bit: featureBit
    }
    let featureUnknown = {
      cluster: cluster,
      name: 'Unknown',
      code: 'UNKNOWN',
      conformance: 'Feature1 | Feature2',
      deviceTypes: [deviceType],
      bit: featureBit
    }
    let clusterFeatures = [featureHS, featureXY, featureUnknown]
    let endpointId = 1
    let result = {}
    let expectedWarning = ''
    let warningPrefix = `⚠ Check Feature Compliance on endpoint: ${endpointId}, cluster: ${cluster}, `
    let featureBitMessage = `(bit ${featureBit} in featureMap attribute)`

    // 1. test enable an optional feature
    featureMap['HS'] = 1
    result = conformChecker.checkElementConformance(
      elements,
      featureMap,
      featureHS,
      endpointId,
      clusterFeatures
    )
    // no warnings should be generated
    expect(result.displayWarning).toBeFalsy()
    expect(result.disableChange).toBeFalsy()
    expect(result.warningMessage).toBe('')
    // elements with conformance 'HS' should be enabled
    // and their values should be set to true
    expect(result.attributesToUpdate.length).toBe(1)
    expect(result.attributesToUpdate[0].name).toBe('CurrentHue')
    expect(result.attributesToUpdate[0].value).toBeTruthy()
    expect(result.commandsToUpdate.length).toBe(1)
    expect(result.commandsToUpdate[0].name).toBe('MoveToHue')
    expect(result.commandsToUpdate[0].value).toBeTruthy()
    expect(result.eventsToUpdate.length).toBe(1)
    expect(result.eventsToUpdate[0].name).toBe('event1')
    expect(result.eventsToUpdate[0].value).toBeTruthy()
    featureMap['HS'] = 0

    // 2. test disable a mandatory feature
    featureMap['XY'] = 0
    result = conformChecker.checkElementConformance(
      elements,
      featureMap,
      featureXY,
      endpointId,
      clusterFeatures
    )
    // should throw and display warning
    expectedWarning =
      warningPrefix +
      `feature: ${featureXY.name} (${featureXY.code}) ${featureBitMessage} should be enabled, ` +
      `as it is mandatory for device type: ${deviceType}.`
    expect(result.displayWarning).toBeTruthy()
    expect(result.disableChange).toBeFalsy()
    expect(result.warningMessage).toBe(expectedWarning)
    // attributes and commands with conformance 'XY' should be disabled
    // and their values should be set to false
    expect(result.attributesToUpdate.length).toBe(1)
    expect(result.attributesToUpdate[0].name).toBe('CurrentX')
    expect(result.attributesToUpdate[0].value).toBeFalsy()
    expect(result.commandsToUpdate.length).toBe(1)
    expect(result.commandsToUpdate[0].name).toBe('MoveToColor')
    expect(result.commandsToUpdate[0].value).toBeFalsy()
    expect(result.eventsToUpdate.length).toBe(0)
    featureMap['XY'] = 1

    // 3. test enable a feature with unknown conformance
    featureMap['UNKNOWN'] = 1
    result = conformChecker.checkElementConformance(
      elements,
      featureMap,
      featureUnknown,
      endpointId,
      clusterFeatures
    )
    expectedWarning =
      warningPrefix +
      `feature: ${featureUnknown.name} (${featureUnknown.code}) ${featureBitMessage} cannot be enabled ` +
      `as its conformance depends on the following operands with unknown values: Feature1, Feature2.`
    // should display warning and disable the change
    // no attributes commands, or events should be updated
    expect(result.displayWarning).toBeTruthy()
    expect(result.disableChange).toBeTruthy()
    expect(result.warningMessage[0]).toBe(expectedWarning)
    expect(result.attributesToUpdate.length).toBe(0)
    expect(result.commandsToUpdate.length).toBe(0)
    expect(result.eventsToUpdate.length).toBe(0)
    featureMap['UNKNOWN'] = 0

    // 4. test enable a feature with desc elements with conformance
    // containing desc and updated feature code, expect same warning flags as 3
    let descElement = {
      name: 'DescElement',
      conformance: 'HS & desc',
      included: false
    }
    elements.attributes.push(descElement)
    featureMap['HS'] = 1
    result = conformChecker.checkElementConformance(
      elements,
      featureMap,
      featureHS,
      endpointId,
      clusterFeatures
    )
    expectedWarning =
      warningPrefix +
      `feature: ${featureHS.name} (${featureHS.code}) ${featureBitMessage} ` +
      `cannot be enabled as attribute ${descElement.name} ` +
      `depend on the feature and their conformance are too complex for ZAP to process, or they include 'desc'.`
    expect(result.displayWarning).toBeTruthy()
    expect(result.disableChange).toBeTruthy()
    expect(result.warningMessage[0]).toBe(expectedWarning)
    expect(result.attributesToUpdate.length).toBe(0)
    expect(result.commandsToUpdate.length).toBe(0)
    expect(result.eventsToUpdate.length).toBe(0)
    featureMap['HS'] = 0

    // 5. test enable a feature with unknown conformance and relevant desc elements
    // should have 2 warnings
    elements.attributes.find((attr) => attr.name == 'DescElement').conformance =
      'desc, [UNKNOWN]'
    featureMap['UNKNOWN'] = 1
    result = conformChecker.checkElementConformance(
      elements,
      featureMap,
      featureUnknown,
      endpointId,
      clusterFeatures
    )
    expect(result.displayWarning).toBeTruthy()
    expect(result.disableChange).toBeTruthy()
    expect(result.warningMessage.length).toBe(2)
    expect(result.attributesToUpdate.length).toBe(0)
    expect(result.commandsToUpdate.length).toBe(0)
    expect(result.eventsToUpdate.length).toBe(0)
  },
  testUtil.timeout.short()
)

test(
  'Test API for getting FeatureMap attribute value',
  async () => {
    // get relevant data from the On/Off cluster and pass it to the API
    let attributes =
      await queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
        db,
        onOffCluster.clusterId,
        [pkgId],
        onOffCluster.side
      )
    let featureMapAttribute = attributes.find(
      (attribute) =>
        attribute.name == dbEnum.featureMapAttribute.name &&
        attribute.code == dbEnum.featureMapAttribute.code
    )

    let resp = await axiosInstance.get(restApi.uri.featureMapAttribute, {
      params: {
        attributeId: featureMapAttribute.id,
        clusterId: onOffCluster.clusterId,
        endpointTypeId: eptId
      }
    })
    let featureMapValue = parseInt(resp.data.defaultValue)

    /* The featureMap value should be 1 because, in the Dimmable Light device type, On/Off cluster,
       only the Lighting (LT) feature on bit 0 is enabled by default. */
    expect(featureMapValue).toBe(1)
  },
  testUtil.timeout.long()
)

test(
  'Test function to get endpoint type cluster ID from feature data or by querying the database',
  async () => {
    // if featureData has no clusterRef, it should query DB with the given clusterRef parameter
    // and return endpoint type cluster ID of the On/Off cluster
    let featureData = null
    let endpointTypeClusterId =
      await conformChecker.getEndpointTypeClusterIdFromFeatureData(
        db,
        featureData,
        eptId,
        onOffCluster.clusterId
      )
    expect(endpointTypeClusterId).toBe(onOffCluster.endpointTypeClusterId)

    let levelControlCluster = clusters.find(
      (cluster) => cluster.clusterName == 'Level Control'
    )
    featureData = { clusterRef: levelControlCluster.clusterId }

    // if featureData has clusterRef, it should take precedence over the clusterRef parameter
    // and the DB query should return endpoint type cluster ID of the Level Control cluster
    endpointTypeClusterId =
      await conformChecker.getEndpointTypeClusterIdFromFeatureData(
        db,
        featureData,
        eptId,
        onOffCluster.clusterId
      )
    expect(endpointTypeClusterId).toBe(
      levelControlCluster.endpointTypeClusterId
    )
  },
  testUtil.timeout.medium()
)

test(
  'Test function to get a text summary of enabled/disabled state for element operands in a conformance expression',
  () => {
    let featureMap = { feature1: true, feature2: false }
    let elementMap = {
      ...featureMap,
      attribute1: true,
      attribute2: false,
      command1: true,
      command2: false
    }

    let conformanceExpression = 'feature1 & !feature2, (attribute1 | !command2)'

    let result = conformChecker.getStateOfOperands(
      conformanceExpression,
      elementMap,
      featureMap
    )
    expect(result).toBe(
      'feature: feature1 is enabled, feature: feature2 is disabled, element: attribute1 is enabled, element: command2 is disabled'
    )
  },
  testUtil.timeout.short()
)

test(
  'Test function to check features need to be updated or have conformance changes due to the updated feature',
  () => {
    // simulate enabling feature A
    let updatedFeatureCode = 'A'
    let elementMap = {
      A: true,
      B: false,
      C: true,
      D: false,
      E: false,
      F: false,
      G: false,
      H: false
    }
    let clusterFeatures = [
      { code: 'A', conformance: 'O' },
      { code: 'B', conformance: 'A' },
      { code: 'C', conformance: 'A, O' },
      { code: 'D', conformance: 'A & B' },
      { code: 'E', conformance: 'A | B' },
      { code: 'F', conformance: '[A & C]' },
      // Conformance of G and H are unrelated to A,
      // so they should not appear in returned values
      { code: 'G', conformance: 'B' },
      { code: 'H', conformance: 'O' }
    ]

    let { updatedFeatures, changedConformFeatures } =
      conformEvaluator.checkFeaturesToUpdate(
        updatedFeatureCode,
        clusterFeatures,
        elementMap
      )
    // B and E becomes mandatory but are not enabled, so they should be updated
    expect(updatedFeatures).toEqual({ B: true, E: true })
    // Conformance of B, C, and E changed from notSupported to mandatory
    // Conformance of F changed from notSupported to optional
    // C becomes mandatory but it is already enabled, so it should not be updated
    // F becomes optional so no update is needed
    expect(changedConformFeatures).toEqual([
      { code: 'B', conformance: 'A' },
      { code: 'C', conformance: 'A, O' },
      { code: 'E', conformance: 'A | B' },
      { code: 'F', conformance: '[A & C]' }
    ])
  },
  testUtil.timeout.short()
)
