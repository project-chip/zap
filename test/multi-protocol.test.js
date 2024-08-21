/**
 *
 *    Copyright (c) 2024 Silicon Labs
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

//
const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const querySessionNotice = require('../src-electron/db/query-session-notification')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')

const zigbeeTemplateCount = testUtil.testTemplate.zigbee2Count
const matterTemplateCount = testUtil.testTemplate.matter2Count
const multiProtocolTestFile = testUtil.zigbeeTestFile.multiProtocol

let db
let templateContext

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genMultiProtocol')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  // Loading both matter and zigbee zcl files for multi-protocol use case
  return zclLoader.loadZclMetafiles(db, [
    env.builtinSilabsZclMetafile(),
    env.builtinMatterZclMetafile2()
  ])
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Multi-protocol gen template parsing and generation',
  async () => {
    // loading the gen template files of zigbee and matter
    let context = await genEngine.loadTemplates(db, [
      testUtil.testTemplate.zigbee2,
      testUtil.testTemplate.matter2
    ])
    expect(context.crc).not.toBeNull()
    expect(context.templateData).not.toBeNull()
    expect(context.templateData.length).toEqual(2)
    expect(context.templateData[0].name).toEqual('ZigbeePro 2023')
    expect(context.templateData[0].version).toEqual('zigbee-v23')
    expect(context.templateData[1].name).toEqual('CHIP Tests templates')
    expect(context.templateData[1].version).toEqual('chip-v1')
    expect(context.templateData[0].templates.length).toEqual(
      zigbeeTemplateCount
    )
    expect(context.templateData[1].templates.length).toEqual(
      matterTemplateCount
    )
    expect(context.packageIds).not.toBeNull()
    expect(context.packageIds.length).toEqual(2)
    expect(context.packageId).not.toBeNull()
    templateContext = context
  },
  testUtil.timeout.medium()
)

test(
  `Load multi-protocol zap file and generate: ${multiProtocolTestFile}`,
  async () => {
    let importRes = await importJs.importDataFromFile(
      db,
      multiProtocolTestFile,
      { sessionId: null }
    )
    expect(importRes.errors.length).toBe(0)
    expect(importRes.warnings.length).toBe(0)

    let genResultZigbee = await genEngine.generate(
      db,
      importRes.sessionId,
      importRes.templateIds[0],
      {},
      {
        generateOnly: ['zap-config-version-3.h', 'zap-event.h'],
        disableDeprecationWarnings: true
      }
    )
    let genResultMatter = await genEngine.generate(
      db,
      importRes.sessionId,
      importRes.templateIds[1],
      {},
      {
        generateOnly: 'endpoint-config.c',
        disableDeprecationWarnings: true
      }
    )
    expect(genResultZigbee.hasErrors).toBeFalsy()
    expect(genResultMatter.hasErrors).toBeFalsy()

    let matterEndpointConfigGen = genResultMatter.content['endpoint-config.c']
    let zigbeeEndpointConfigGen =
      genResultZigbee.content['zap-config-version-3.h']

    // Positive tests endpoint config
    expect(matterEndpointConfigGen).toContain(
      '/* Endpoint: 0, Cluster: Basic Information (server) */'
    )
    expect(matterEndpointConfigGen).toContain(
      '/* Endpoint: 0, Cluster: Descriptor (server) */'
    )
    expect(zigbeeEndpointConfigGen).toContain(
      '#define EMBER_AF_BASIC_CLUSTER_SERVER_ENDPOINT_COUNT (1)'
    )
    expect(zigbeeEndpointConfigGen).toContain(
      '#define EMBER_AF_ZLL_COMMISSIONING_CLUSTER_SERVER_ENDPOINT_COUNT (1)'
    )

    // Negative Tests endpoint config
    expect(matterEndpointConfigGen).not.toContain(
      '/* Endpoint: 1, Cluster: Basic (server)'
    )
    expect(matterEndpointConfigGen).not.toContain(
      '/* Endpoint: 1, Cluster: ZLL Commissioning (server) */'
    )
    expect(zigbeeEndpointConfigGen).not.toContain(
      '#define EMBER_AF_DESCRIPTOR_CLUSTER_SERVER_ENDPOINT_COUNT (1)'
    )

    // Global attribute test
    expect(zigbeeEndpointConfigGen).toContain(
      '{ 0xFFFD, ZCL_INT16U_ATTRIBUTE_TYPE, 2, (ATTRIBUTE_MASK_SINGLETON), { (uint8_t*)3  } }, /* 13 Cluster: Basic, Attribute: cluster revision, Side: server*/'
    )
    expect(matterEndpointConfigGen).toContain(
      '{ 0x0000FFFC, ZAP_TYPE(BITMAP32), 4, 0, ZAP_SIMPLE_DEFAULT(0) }, /* FeatureMap */'
    )
    expect(matterEndpointConfigGen).toContain(
      '{ 0x0000FFFD, ZAP_TYPE(INT16U), 2, ZAP_ATTRIBUTE_MASK(EXTERNAL_STORAGE), ZAP_EMPTY_DEFAULT() }, /* ClusterRevision */'
    )

    // Test Multi-protocol attribute mapping generation
    expect(zigbeeEndpointConfigGen).toContain(
      '#define GENERATED_MULTI_PROTOCOL_ATTRIBUTE_MAPPING'
    )
    expect(zigbeeEndpointConfigGen).toContain('{ 6, 0, 6, 0, 0, 0, 0, 0 },')
    expect(zigbeeEndpointConfigGen).toContain('{ 8, 0, 8, 0, 0, 0, 0, 0 },')
    expect(zigbeeEndpointConfigGen).toContain('{ 8, 0, 8, 0, 1, 0, 1, 0 },')

    // Notifications test when opening multi-protocol zap file
    let sessionNotifications = await querySessionNotice.getNotification(
      db,
      importRes.sessionId
    )
    let sessionNotificationMessages = sessionNotifications.map(
      (sn) => sn.message
    )

    // Tests for the feature Map attribute compliance based on device type cluster features
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Device Type Compliance on endpoint: 1, device type: MA-onofflight, cluster: On/Off server needs bit 0 enabled in the Feature Map attribute'
      )
    ).toBeTruthy()

    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Device Type Compliance on endpoint: 1, device type: MA-dimmablelight, cluster: Level Control server needs bit 0 enabled in the Feature Map attribute'
      )
    ).toBeTruthy()

    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Device Type Compliance on endpoint: 1, device type: MA-dimmablelight, cluster: Level Control server needs bit 1 enabled in the Feature Map attribute'
      )
    ).toBeTruthy()

    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Device Type Compliance on endpoint: 1, device type: MA-dimmablelight, cluster: On/Off server needs bit 0 enabled in the Feature Map attribute'
      )
    ).toBeTruthy()

    // Just one notification regarding multiple top level zcl propertoes and 4
    // notifications regarding feature map attribute not set correctly
    expect(sessionNotifications.length).toEqual(5)

    // Test Accumulators in templates
    let zigbeeEndpointEvents = genResultZigbee.content['zap-event.h']
    expect(zigbeeEndpointEvents).toContain(
      '#define SL_ZIGBEE_AF_GENERATED_UC_EVENT_CONTEXT_COUNT 1'
    )
  },
  testUtil.timeout.long()
)
