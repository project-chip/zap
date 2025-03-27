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
const path = require('path')
const importJs = require('../src-electron/importexport/import')
const exportJs = require('../src-electron/importexport/export')
const dbEnum = require('../src-shared/db-enum')
const dbApi = require('../src-electron/db/db-api')
const env = require('../src-electron/util/env')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const generationEngine = require('../src-electron/generator/generation-engine')
const querySession = require('../src-electron/db/query-session')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const queryEndpointType = require('../src-electron/db/query-endpoint-type')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const util = require('../src-electron/util/util')

let db
let sleepyGenericZap = path.join(__dirname, 'resource/isc/sleepy-generic.zap')
let sleepyGenericIsc = path.join(__dirname, 'resource/isc/sleepy-generic.isc')
let testFile1 = path.join(__dirname, 'resource/save-file-1.zap')
let testFile2 = path.join(__dirname, 'resource/save-file-2.zap')
let matterSwitch = path.join(__dirname, 'resource/matter-switch.zap')
let testLightIsc = path.join(__dirname, 'resource/isc/test-light.isc')
let testDoorLockIsc = path.join(__dirname, 'resource/isc/ha-door-lock.isc')
let haLightIsc = path.join(__dirname, 'resource/isc/ha-light.isc')
let haCombinedInterfaceIsc = path.join(
  __dirname,
  'resource/isc/ha-combined-interface.isc'
)
let faultyZap = path.join(__dirname, 'resource/test-faulty.zap')
let provisionalCluster = path.join(
  __dirname,
  'resource/test-provisional-cluster.zap'
)
let nonConformElements = path.join(
  __dirname,
  'resource/non-conform-elements.zap'
)
let threeCustomXml = path.join(
  __dirname,
  'resource/custom-cluster/three_custom_xml.zap'
)
let multiProtocol = path.join(__dirname, 'resource/multi-protocol.zap')
let missingResponseCommands = path.join(
  __dirname,
  'resource/missing-response-commands.zap'
)

// Due to future plans to rework how we handle global attributes,
// we introduce this flag to bypass those attributes when testing import/export.
let bypassGlobalAttributes = false

let templateContext
let templatePkgId

beforeAll(() => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('importexport')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .then(() => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile()))
    .catch((err) => env.logError(`Error: ${err}`))
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation',
  async () => {
    let context = await generationEngine.loadTemplates(
      db,
      testUtil.testTemplate.zigbee
    )
    templatePkgId = context.packageId
    expect(context.crc).not.toBeNull()
    expect(context.templateData).not.toBeNull()
    templateContext = context
  },
  testUtil.timeout.short()
)

test(
  path.basename(testFile1) + ' - import',
  async () => {
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      templateContext.sessionId,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    let importResult = await importJs.importDataFromFile(db, testFile1)

    let sid = importResult.sessionId

    let x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE')
    expect(x).toBe(1)
    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_CLUSTER')
    expect(x).toBe(11)
    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_COMMAND')
    expect(x).toBe(8) // increased by one because reset to factory default is enabled for incoming and outgoing and has 2 entries instead of one with the schema change.
    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_ATTRIBUTE')
    expect(x).toBe(21)

    let state = await exportJs.createStateFromDatabase(db, sid)
    let commandCount = 0
    let attributeCount = 0
    expect(state.featureLevel).toBe(env.zapVersion().featureLevel)
    expect(state.endpointTypes.length).toBe(1)
    expect(state.endpointTypes[0].clusters.length).toBe(11)
    state.endpointTypes[0].clusters.forEach((c) => {
      commandCount += c.commands ? c.commands.length : 0
      attributeCount += c.attributes ? c.attributes.length : 0
    })
    expect(commandCount).toBe(8) // increased by one because reset to factory default is enabled for incoming and outgoing and has 2 entries instead of one with the schema change.
    // This flag exists for this test due to planned global attribute rework.
    expect(attributeCount).toBe(bypassGlobalAttributes ? 15 : 21)

    await querySession.deleteSession(db, sid)
  },
  testUtil.timeout.medium()
)

test(
  path.basename(testFile2) + ' - import',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, testFile2, { sessionId: sid })

    let x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE')
    expect(x).toBe(1)

    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_CLUSTER')
    expect(x).toBe(19)

    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_COMMAND')
    expect(x).toBe(27) // increased by 3 because Identify, IdentifyQuery and EzModeInvoke are enabled for incoming and outgoing and has 2 entries instead of one with the schema change.

    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_ATTRIBUTE')
    expect(x).toBe(28)

    let state = await exportJs.createStateFromDatabase(db, sid)
    let commandCount = 0
    let attributeCount = 0
    expect(state.endpointTypes.length).toBe(1)
    expect(state.endpointTypes[0].clusters.length).toBe(19)
    state.endpointTypes[0].clusters.forEach((c) => {
      commandCount += c.commands ? c.commands.length : 0
      attributeCount += c.attributes ? c.attributes.length : 0
    })
    expect(commandCount).toBe(27) // increased by 3 because Identify, IdentifyQuery and EzModeInvoke are enabled for incoming and outgoing and has 2 entries instead of one with the schema change.
    // This flag exists for this test due to planned global attribute rework.
    expect(attributeCount).toBe(bypassGlobalAttributes ? 16 : 28)
  },
  testUtil.timeout.medium()
)

test(
  path.basename(matterSwitch) + ' - import',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, matterSwitch, { sessionId: sid })

    let x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE')
    expect(x).toBe(2)
    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_CLUSTER')
    expect(x).toBe(27)
    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_COMMAND')
    expect(x).toBe(29)
    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_ATTRIBUTE')
    expect(x).toBe(66)
    x = await testQuery.selectCountFrom(db, 'ENDPOINT_TYPE_EVENT')
    expect(x).toBe(3)
  },
  testUtil.timeout.long()
)

test(
  path.basename(sleepyGenericZap) + ' - import',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, sleepyGenericZap, { sessionId: sid })
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sid)
    expect(endpoints.length).toBe(1)
  },
  testUtil.timeout.medium()
)

test(
  path.basename(sleepyGenericIsc) + ' - import',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, sleepyGenericIsc, { sessionId: sid })
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sid)
    let endpointTypes = await queryEndpointType.selectAllEndpointTypes(db, sid)
    expect(endpoints.length).toBe(1)
    expect(endpointTypes[0].deviceIdentifier[0]).toBe(1281)
  },
  testUtil.timeout.medium()
)

test(
  path.basename(testLightIsc) + ' - read state',
  async () => {
    let state = await importJs.readDataFromFile(
      testLightIsc,
      env.builtinSilabsZclMetafile()
    )
    expect(Object.keys(state.endpointTypes).length).toBe(4)
    expect(Object.keys(state.endpoint).length).toBe(3)
    expect(state.endpoint[2].endpoint).toBe(242)
    expect(state).not.toHaveProperty('parseState')
    expect(state.attributeType.length).toBe(6)
  },
  testUtil.timeout.medium()
)

test(
  path.basename(testLightIsc) + ' - import',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, testLightIsc, { sessionId: sid })
    expect(sid).not.toBeUndefined()
    let endpointTypes = await queryEndpointType.selectAllEndpointTypes(db, sid)
    expect(endpointTypes.length).toBe(3)
    expect(endpointTypes[0].name).toBe('Centralized')
    expect(endpointTypes[1].name).toBe('GreenPower')
    expect(endpointTypes[2].name).toBe('Touchlink')
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sid)
    expect(endpoints.length).toBe(3)
    let drp = await querySession.getSessionKeyValue(
      db,
      sid,
      dbEnum.sessionOption.defaultResponsePolicy
    )
    expect(drp).toBe('always')
  },
  testUtil.timeout.medium()
)

test(
  path.basename(testDoorLockIsc) + ' - import',
  async () => {
    sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, testDoorLockIsc, { sessionId: sid })
    expect(sid).not.toBeUndefined()
    let endpointTypes = await queryEndpointType.selectAllEndpointTypes(db, sid)
    expect(endpointTypes.length).toBe(1)
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sid)
    expect(endpoints.length).toBe(1)
    expect(endpointTypes[0].deviceIdentifier[0]).toBe(10)
    let clusterState = await testQuery.getAllEndpointTypeClusterState(
      db,
      endpointTypes[0].id
    )
    expect(clusterState.length).toBe(106) // Reduced by one because Key Establishment had 3 entries with one entry showing up as either side even though it had the client and server side entries {"endpointTypeClusterId":2176,"clusterName":"Key Establishment","clusterCode":2048,"side":"either","enabled":false}

    let drp = await querySession.getSessionKeyValue(
      db,
      sid,
      dbEnum.sessionOption.defaultResponsePolicy
    )
    expect(drp).toBe('conditional')
  },
  testUtil.timeout.medium()
)

test(
  path.basename(haLightIsc) + ' - import',
  async () => {
    sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, haLightIsc, { sessionId: sid })
    expect(sid).not.toBeUndefined()
    let endpointTypes = await queryEndpointType.selectAllEndpointTypes(db, sid)
    expect(endpointTypes.length).toBe(2)
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sid)
    expect(endpoints.length).toBe(2)
    expect(endpoints[0].networkId).toBe(0)
    expect(endpoints[1].networkId).toBe(0)
    let ps = []
    endpointTypes.forEach((ept) => {
      ps.push(testQuery.getEndpointTypeAttributes(db, ept.id))
    })
    let attributes = await Promise.all(ps)

    let attributeCounts = attributes.map((atArray) => atArray.length)
    expect(attributeCounts).toStrictEqual([28, 14])

    let reportableCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.includedReportable ? 1 : 0), 0)
    )
    expect(reportableCounts).toStrictEqual([2, 0])

    let boundedCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.bounded ? 1 : 0), 0)
    )
    expect(boundedCounts).toStrictEqual([13, 4])
    let singletonCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.singleton ? 1 : 0), 0)
    )
    expect(singletonCounts).toStrictEqual([8, 11])
  },
  testUtil.timeout.medium()
)

test(
  path.basename(haCombinedInterfaceIsc) + ' - import',
  async () => {
    sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, haCombinedInterfaceIsc, {
      sessionId: sid
    })
    expect(sid).not.toBeUndefined()
    let endpointTypes = await queryEndpointType.selectAllEndpointTypes(db, sid)
    expect(endpointTypes.length).toBe(1)
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sid)
    expect(endpoints.length).toBe(1)
    expect(endpoints[0].networkId).toBe(0)
    let ps = []
    endpointTypes.forEach((ept) => {
      ps.push(testQuery.getEndpointTypeAttributes(db, ept.id))
    })
    let attributes = await Promise.all(ps)

    let attributeCounts = attributes.map((atArray) => atArray.length)
    expect(attributeCounts).toStrictEqual([9])

    let reportableCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.includedReportable ? 1 : 0), 0)
    )
    expect(reportableCounts).toStrictEqual([0])

    let boundedCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.bounded ? 1 : 0), 0)
    )
    expect(boundedCounts).toStrictEqual([3])
    let singletonCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.singleton ? 1 : 0), 0)
    )
    expect(singletonCounts).toStrictEqual([5])

    let sessionDump = await util.sessionDump(db, sid)
    expect(sessionDump.usedPackages.length).toBe(1)
  },
  testUtil.timeout.medium()
)

test(
  path.basename(faultyZap) +
    ' - import faulty zap file and make sure warnings show up in session notification table',
  async () => {
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      templateContext.sessionId,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    let importResult = await importJs.importDataFromFile(db, faultyZap)
    let sid = importResult.sessionId
    let notificationMessages = await testQuery.getAllNotificationMessages(
      db,
      sid
    )
    expect(
      notificationMessages.includes(
        "Duplicate endpoint type attribute 'SceneCount' for Scenes cluster on endpoint 1. Remove duplicates in .zap configuration file and re-open .zap file or just save this .zap file to apply the changes."
      )
    ).toBeTruthy()
    expect(
      notificationMessages.includes(
        "Duplicate endpoint type command 'Identify' for Identify cluster on endpoint 1. Remove duplicates in .zap configuration file and re-open .zap file or just save this .zap file to apply the changes."
      )
    ).toBeTruthy()

    await querySession.deleteSession(db, sid)
  },
  testUtil.timeout.medium()
)

test(
  'Import a ZAP file with enabled provisional cluster and make sure warnings show up in the notification table',
  async () => {
    sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, provisionalCluster, {
      sessionId: sid
    })
    expect(sid).not.toBeUndefined()
    let notificationMessages = await testQuery.getAllNotificationMessages(
      db,
      sid
    )
    expect(
      notificationMessages.includes(
        'On endpoint 0, support for cluster: Scenes server is provisional.'
      )
    ).toBeTruthy()
  },
  testUtil.timeout.medium()
)

test(
  'Import a ZAP file with elements that do not conform to a device type feature and make sure element conformance warnings show up in the notification table',
  async () => {
    sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, nonConformElements, {
      sessionId: sid
    })
    expect(sid).not.toBeUndefined()
    let notificationMessages = await testQuery.getAllNotificationMessages(
      db,
      sid
    )

    // Two attributes and one command conform to the enabled device type feature 'LT' but are disabled.
    // Their element conformance warnings should be added to the notification table.
    expect(
      notificationMessages.includes(
        '⚠ Check Feature Compliance on endpoint: 1, cluster: On/Off, command: OffWithEffect has mandatory conformance to LT and should be enabled when feature: LT is enabled.'
      )
    ).toBeTruthy()
    expect(
      notificationMessages.includes(
        '⚠ Check Feature Compliance on endpoint: 1, cluster: On/Off, attribute: OnTime has mandatory conformance to LT and should be enabled when feature: LT is enabled.'
      )
    ).toBeTruthy()
    expect(
      notificationMessages.includes(
        '⚠ Check Feature Compliance on endpoint: 1, cluster: On/Off, attribute: GlobalSceneControl has mandatory conformance to LT and should be enabled when feature: LT is enabled.'
      )
    ).toBeTruthy()

    // disabled mandatory device type feature OnOff should trigger a notification
    expect(
      notificationMessages.includes(
        '⚠ Check Feature Compliance on endpoint: 1, cluster: Level Control, feature: OnOff (bit 0 in featureMap attribute) should be enabled, as it is mandatory for device type: Matter Dimmable Light'
      )
    ).toBeTruthy()
  },
  testUtil.timeout.medium()
)

test(
  'Import a ZAP file with three custom xml packages and export again, make sure order of package remains the same after export',
  async () => {
    sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, threeCustomXml, {
      sessionId: sid
    })
    let state = await exportJs.createStateFromDatabase(db, sid)

    expect(state.package[0].path).toBe('../../../zcl-builtin/matter/zcl.json')
    expect(state.package[1].path).toBe(
      '../../gen-template/matter/gen-test.json'
    )
    expect(state.package[2].path).toBe('matter-custom.xml')
    expect(state.package[3].path).toBe('matter-custom2.xml')
    expect(state.package[4].path).toBe('matter-custom3.xml')
  },
  testUtil.timeout.medium()
)

test(
  'Import a ZAP multi-protocol file, ensure order of packages in .zap file remains the same after export',
  async () => {
    sid = await querySession.createBlankSession(db)
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      null,
      [templatePkgId]
    )
    await importJs.importDataFromFile(db, multiProtocol, {
      sessionId: sid
    })
    let state = await exportJs.createStateFromDatabase(db, sid)

    expect(state.package[0].path).toBe(
      '../../zcl-builtin/matter/zcl-with-test-extensions.json'
    )
    expect(state.package[1].path).toBe('../../zcl-builtin/silabs/zcl.json')
    expect(state.package[2].path).toBe('../gen-template/matter/gen-test.json')
    expect(state.package[3].path).toBe(
      '../gen-template/zigbee/gen-templates.json'
    )
  },
  testUtil.timeout.medium()
)

test('Import a ZAP file with enabled commands missing response commands and verify warnings are added to the notification table', async () => {
  sid = await querySession.createBlankSession(db)
  await util.ensurePackagesAndPopulateSessionOptions(
    templateContext.db,
    sid,
    {
      zcl: env.builtinSilabsZclMetafile(),
      template: env.builtinTemplateMetafile()
    },
    null,
    [templatePkgId]
  )
  await importJs.importDataFromFile(db, missingResponseCommands, {
    sessionId: sid
  })
  expect(sid).not.toBeUndefined()
  let notificationMessages = await testQuery.getAllNotificationMessages(db, sid)

  // 3 commands are missing response commands and should trigger warnings
  expect(
    notificationMessages.includes(
      'On endpoint 0, cluster: General Commissioning server, outgoing command: ArmFailSafeResponse should be enabled as it is the response to the enabled incoming command: ArmFailSafe.'
    )
  )
  // test if 2 commands missing the same response command both trigger warnings
  expect(
    notificationMessages.includes(
      'On endpoint 0, cluster: Network Commissioning server, outgoing command: NetworkConfigResponse should be enabled as it is the response to the enabled incoming command: AddOrUpdateWiFiNetwork.'
    )
  )
  expect(
    notificationMessages.includes(
      'On endpoint 0, cluster: Network Commissioning server, outgoing command: NetworkConfigResponse should be enabled as it is the response to the enabled incoming command: AddOrUpdateThreadNetwork.'
    )
  )
})
