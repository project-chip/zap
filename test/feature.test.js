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

let db
let ctx
let pkgId
let sid
let eptId
let MA_dimmablelight
let deviceTypeName = 'MA-dimmablelight'
let axiosInstance = null

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
  'Evaluate customized conformance expression',
  () => {
    // cover elements with all upper and lower case and combinations
    const elementMap = { HS: 1, Lt: 1, oo: 0, xY: 0, Primary1X: 1 }
    let conformanceExpressions = [
      // 1. test basic conformance abbreviations
      { expression: 'M', expected: 'mandatory' },
      { expression: 'O', expected: 'optional' },
      { expression: 'P', expected: 'provisional' },
      { expression: 'D', expected: 'notSupported' },
      { expression: 'X', expected: 'notSupported' },

      // 2. test simple mandatory conformance expression
      { expression: 'HS', expected: 'mandatory' },
      { expression: 'oo', expected: 'notSupported' },
      { expression: 'HS & Lt', expected: 'mandatory' },
      { expression: 'HS & oo', expected: 'notSupported' },
      { expression: 'HS | oo', expected: 'mandatory' },
      { expression: 'HS & Lt & oo', expected: 'notSupported' },
      { expression: 'HS | Lt | oo', expected: 'mandatory' },
      { expression: 'HS & (Lt | oo)', expected: 'mandatory' },
      { expression: 'HS & (oo | xY)', expected: 'notSupported' },
      { expression: '(HS & oo) | Lt', expected: 'mandatory' },
      { expression: 'HS & (Lt | oo | xY)', expected: 'mandatory' },
      { expression: 'oo | (HS & Lt & xY)', expected: 'notSupported' },

      // 3. test NOT (!)
      { expression: '!HS', expected: 'notSupported' },
      { expression: '!oo', expected: 'mandatory' },
      { expression: '!HS & Lt', expected: 'notSupported' },
      { expression: 'HS & !oo', expected: 'mandatory' },
      { expression: '!(HS & Lt)', expected: 'notSupported' },
      { expression: '!(HS | oo)', expected: 'notSupported' },
      { expression: '!(HS & oo)', expected: 'mandatory' },

      // 4. test optional conformance expression with '[]'
      { expression: '[HS]', expected: 'optional' },
      { expression: '[oo]', expected: 'notSupported' },
      { expression: '[!HS]', expected: 'notSupported' },
      { expression: '[!oo]', expected: 'optional' },
      { expression: '[HS & Lt]', expected: 'optional' },
      { expression: '[HS & oo]', expected: 'notSupported' },
      { expression: '[HS | oo]', expected: 'optional' },
      { expression: '[!(HS & Lt)]', expected: 'notSupported' },
      { expression: '[!(HS | oo)]', expected: 'notSupported' },
      { expression: '[!(HS & oo)]', expected: 'optional' },

      // 5. test otherwise conformance expression
      { expression: 'P, O', expected: 'provisional' },
      { expression: 'P, M', expected: 'provisional' },
      { expression: 'P, HS', expected: 'provisional' },
      { expression: 'P, [HS]', expected: 'provisional' },
      { expression: 'HS, O', expected: 'mandatory' },
      { expression: 'oo, O', expected: 'optional' },
      { expression: 'oo, [HS]', expected: 'optional' },
      { expression: 'oo, [xY]', expected: 'notSupported' },
      { expression: '[HS], D', expected: 'optional' },
      { expression: '[oo], D', expected: 'notSupported' },
      { expression: 'HS, [Lt | oo | xY]', expected: 'mandatory' },
      { expression: 'oo, [Lt | oo | xY]', expected: 'optional' },
      { expression: 'oo, [xY | oo]', expected: 'notSupported' },
      { expression: 'HS & Lt, [oo]', expected: 'mandatory' },
      { expression: 'HS & oo, [Lt]', expected: 'optional' },
      { expression: 'HS & oo, [xY]', expected: 'notSupported' },
      { expression: 'HS | oo, [Lt & xY]', expected: 'mandatory' },
      { expression: 'oo | xY, [HS & Lt]', expected: 'optional' },
      { expression: 'xY | oo, [HS & xY]', expected: 'notSupported' },

      // 6. test terms containing numbers
      { expression: 'Primary1X', expected: 'mandatory' },
      { expression: 'Primary1X & HS', expected: 'mandatory' },
      { expression: 'Primary1X | oo', expected: 'mandatory' },

      // 7. test conformance with desc terms
      { expression: 'desc', expected: 'desc' },
      { expression: 'HS & desc', expected: 'desc' },
      { expression: 'HS | (!xY && desc)', expected: 'desc' },
      { expression: 'P, desc', expected: 'desc' }
    ]

    conformanceExpressions.forEach((expression) => {
      let result = conformEvaluator.evaluateConformanceExpression(
        expression.expression,
        elementMap
      )
      expect(result).toBe(expression.expected)
    })
  },
  testUtil.timeout.short()
)

test(
  'Check if an element has conformance with desc terms',
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

    let descTerms = conformChecker.filterRelatedDescElements(elements, 'desc')
    expect(descTerms).toEqual([
      { name: 'Element1', conformance: 'desc' },
      { name: 'Element2', conformance: 'P, desc' },
      { name: 'Element3', conformance: '[desc & XY]' },
      { name: 'Element4', conformance: 'desc, [HS]' },
      { name: 'Element5', conformance: 'desc | optional' }
    ])

    const featureCode = 'HS'
    let relatedDescTerms = conformChecker.filterRelatedDescElements(
      elements,
      featureCode
    )
    expect(relatedDescTerms).toEqual([
      { name: 'Element4', conformance: 'desc, [HS]' }
    ])
  },
  testUtil.timeout.short()
)

test(
  'Check elements with conformance needs to be updated and generate warnings',
  () => {
    /* simulate toggling device type features in Color Control cluster
       to test if elements with wrong conformance are checked and returned,
       and test if generated warnings are correct */
    // define part of elements in Color Control cluster
    let elements = {
      attributes: [
        { name: 'CurrentHue', conformance: 'HS', included: 0 },
        { name: 'DriftCompensation', conformance: 'O', included: 0 },
        { name: 'ColorMode', conformance: 'M', included: 1 },
        { name: 'EnhancedCurrentHue', conformance: 'EHUE', included: 1 },
        { name: 'ColorLoopActive', conformance: 'CL', included: 1 },
        { name: 'CurrentX', conformance: 'XY', included: 1 },
        { name: 'ColorTemperatureMireds', conformance: 'CT', included: 1 },
        {
          name: 'AttributeDependingOnUNKNOWN',
          conformance: 'UNKNOWN',
          included: 0
        }
      ],
      commands: [
        { name: 'MoveToHue', conformance: 'HS', isEnabled: 0 },
        { name: 'EnhancedMoveToHue', conformance: 'EHUE', isEnabled: 0 },
        { name: 'ColorLoopSet', conformance: 'CL', isEnabled: 0 },
        { name: 'MoveColorTemperature', conformance: 'CT', isEnabled: 1 },
        { name: 'MoveToColor', conformance: 'XY', isEnabled: 1 },
        {
          name: 'CommandDependingOnUNKNOWN',
          conformance: 'UNKNOWN',
          isEnabled: 0
        }
      ],
      events: [
        { name: 'event1', conformance: 'HS', included: 0 },
        { name: 'event2', conformance: 'O', included: 0 }
      ]
    }
    let featureMap = { HS: 0, EHUE: 0, CL: 0, XY: 1, CT: 1, UNKNOWN: 0 }
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
      endpointId
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
      endpointId
    )
    // should throw and display warning
    expectedWarning =
      warningPrefix +
      `feature: ${featureXY.name} ${featureBitMessage} should be enabled, ` +
      `as it is mandatory for device type: ${deviceType}`
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
      endpointId
    )
    expectedWarning =
      warningPrefix +
      `feature: ${featureUnknown.name} ${featureBitMessage} cannot be enabled ` +
      `as its conformance depends on non device type features ` +
      `Feature1, Feature2 with unknown values`
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
      included: 0
    }
    elements.attributes.push(descElement)
    featureMap['HS'] = 1
    result = conformChecker.checkElementConformance(
      elements,
      featureMap,
      featureHS,
      endpointId
    )
    expectedWarning =
      warningPrefix +
      `feature: ${featureHS.name} ${featureBitMessage} ` +
      `cannot be enabled as attribute ${descElement.name} ` +
      `depend on the feature and their conformance are too complex to parse.`
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
      endpointId
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
    let clusters = await testQuery.getAllEndpointTypeClusterState(db, eptId)
    let onOffCluster = clusters.find(
      (cluster) => cluster.clusterName == 'On/Off'
    )
    let attributes =
      await queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
        db,
        onOffCluster.clusterId,
        [pkgId],
        onOffCluster.side
      )
    let featureMapAttribute = attributes.find(
      (attribute) => attribute.name == 'FeatureMap' && attribute.code == 65532
    )

    let resp = await axiosInstance.get(restApi.uri.featureMapValue, {
      params: {
        attributeId: featureMapAttribute.id,
        clusterId: onOffCluster.clusterId,
        endpointTypeId: eptId
      }
    })
    let featureMapValue = resp.data

    /* The featureMap value should be 1 because, in the Dimmable Light device type, On/Off cluster,
       only the Lighting (LT) feature on bit 0 is enabled by default. */
    expect(featureMapValue).toBe(1)
  },
  testUtil.timeout.long()
)
