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
const queryConfig = require('../src-electron/db/query-config')

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
    expect(zigbeeEndpointConfigGen).toContain(
      '{ 6, 0, 6, 0, 0, 0, 16, 0, 0, 16 },'
    )
    expect(zigbeeEndpointConfigGen).toContain(
      '{ 8, 0, 8, 0, 0, 0, 32, 0, 0, 32 },'
    )
    expect(zigbeeEndpointConfigGen).toContain(
      '{ 8, 0, 8, 0, 1, 0, 33, 1, 0, 33 },'
    )
    expect(zigbeeEndpointConfigGen).toContain(
      '{ 6, 0, 6, 0, 16387, 0, 48, 16387, 0, 48 },'
    )

    // Notifications test when opening multi-protocol zap file
    let sessionNotifications = await querySessionNotice.getNotification(
      db,
      importRes.sessionId
    )
    let sessionNotificationMessages = sessionNotifications.map(
      (sn) => sn.message
    )

    // Tests for device type feature conformance
    expect(
      sessionNotificationMessages.includes(
        'On endpoint 1, cluster: Level Control, feature: Lighting should be enabled, as it is mandatory for device type: Matter Dimmable Light'
      )
    ).toBeTruthy()

    expect(
      sessionNotificationMessages.includes(
        'On endpoint 1, cluster: Level Control, feature: OnOff should be enabled, as it is mandatory for device type: Matter Dimmable Light'
      )
    ).toBeTruthy()

    expect(
      sessionNotificationMessages.includes(
        'On endpoint 1, cluster: On/Off, feature: Lighting should be enabled, as it is mandatory for device type: Matter Dimmable Light'
      )
    ).toBeTruthy()

    // Tests for provisional cluster warnings
    expect(
      sessionNotificationMessages.includes(
        'On endpoint 1, support for cluster: Scenes server is provisional.'
      )
    ).toBeTruthy()

    // Tests for the attributes and commands that do not conform to the device type feature LT
    let nonConformElements = [
      { name: 'StartUpOnOff', type: 'attribute' },
      { name: 'OffWaitTime', type: 'attribute' },
      { name: 'OnTime', type: 'attribute' },
      { name: 'GlobalSceneControl', type: 'attribute' },
      { name: 'OffWithEffect', type: 'command' },
      { name: 'OnWithRecallGlobalScene', type: 'command' },
      { name: 'OnWithTimedOff', type: 'command' }
    ]

    for (const element of nonConformElements) {
      expect(
        sessionNotificationMessages.includes(
          `On endpoint 1, cluster: On/Off, ${element.type}: ${element.name} has mandatory conformance to LT and should be disabled when feature: LT is disabled.`
        )
      ).toBeTruthy()
    }

    // one notification regarding multiple top level zcl propertoes
    // 3 notifications regarding device type feature conformance
    // one notification regarding the enabled provisional cluster
    // 7 notifications regarding non-conformed elements
    expect(sessionNotifications.length).toEqual(12)

    // Test Accumulators in templates
    let zigbeeEndpointEvents = genResultZigbee.content['zap-event.h']
    expect(zigbeeEndpointEvents).toContain(
      '#define SL_ZIGBEE_AF_GENERATED_UC_EVENT_CONTEXT_COUNT 1'
    )
  },
  testUtil.timeout.long()
)

// Test to check that the default values of corresponding attributes is updated on one endpoint
// Make sure the above does not affect other endpoints.
// Make sure other attribute's values are not affected as well.
// Test both sides matter to zigbee and zigbee to matter
test(
  `Test Endpoint Type Attribute default value syncing between 2 protocols ${multiProtocolTestFile}`,
  async () => {
    let importRes = await importJs.importDataFromFile(
      db,
      multiProtocolTestFile,
      { sessionId: null }
    )

    // Get all session attributes
    let allEndpointTypeAttributes =
      await queryConfig.selectAllSessionAttributes(db, importRes.sessionId)
    let zigbeeEndpointTypeAttribute = ''
    let matterEndpointTypeAttribute = ''

    // Get all on/off endpoint type attribute values for zigbee and matter
    for (const eta of allEndpointTypeAttributes) {
      if (eta.name.toLowerCase() == 'on/off') {
        zigbeeEndpointTypeAttribute = eta
      }
      if (eta.name.toLowerCase() == 'onoff') {
        matterEndpointTypeAttribute = eta
      }
    }

    // Check both of them are the same
    expect(parseInt(zigbeeEndpointTypeAttribute.defaultValue)).toEqual(0)
    expect(parseInt(zigbeeEndpointTypeAttribute.defaultValue)).toEqual(
      parseInt(matterEndpointTypeAttribute.defaultValue)
    )

    // Change zigbee ETA and check for the change in the corresponding Matter ETA.
    await queryConfig.updateEndpointTypeAttribute(
      db,
      zigbeeEndpointTypeAttribute.endpointTypeAttributeId,
      [['defaultValue', 1]]
    )
    let allEndpointTypeAttributesAfterChange =
      await queryConfig.selectAllSessionAttributes(db, importRes.sessionId)
    for (const eta of allEndpointTypeAttributesAfterChange) {
      if (eta.name.toLowerCase() == 'on/off') {
        zigbeeEndpointTypeAttribute = eta
      }
      if (eta.name.toLowerCase() == 'onoff') {
        matterEndpointTypeAttribute = eta
      }
    }
    expect(parseInt(zigbeeEndpointTypeAttribute.defaultValue)).toEqual(1)
    expect(parseInt(zigbeeEndpointTypeAttribute.defaultValue)).toEqual(
      parseInt(matterEndpointTypeAttribute.defaultValue)
    )

    // Negative test: Check that none of the other Endpoint Type Attribute values are not changed. Only the ones intended i.e. on/off
    for (let i = 0; i < allEndpointTypeAttributes.length; i++) {
      if (
        allEndpointTypeAttributes[i].name.toLowerCase() != 'on/off' &&
        allEndpointTypeAttributes[i].name.toLowerCase() != 'onoff'
      ) {
        expect(allEndpointTypeAttributes[i].defaultValue).toEqual(
          allEndpointTypeAttributesAfterChange[i].defaultValue
        )
      }
    }

    // Also test change of matter ETA and check for the change in the corresponding Zigbee ETA.
    await queryConfig.updateEndpointTypeAttribute(
      db,
      matterEndpointTypeAttribute.endpointTypeAttributeId,
      [['defaultValue', 0]]
    )
    allEndpointTypeAttributesAfterChange =
      await queryConfig.selectAllSessionAttributes(db, importRes.sessionId)
    for (const eta of allEndpointTypeAttributesAfterChange) {
      if (eta.name.toLowerCase() == 'on/off') {
        zigbeeEndpointTypeAttribute = eta
      }
      if (eta.name.toLowerCase() == 'onoff') {
        matterEndpointTypeAttribute = eta
      }
    }
    expect(parseInt(matterEndpointTypeAttribute.defaultValue)).toEqual(0)
    expect(parseInt(matterEndpointTypeAttribute.defaultValue)).toEqual(
      parseInt(zigbeeEndpointTypeAttribute.defaultValue)
    )
  },
  testUtil.timeout.long()
)
