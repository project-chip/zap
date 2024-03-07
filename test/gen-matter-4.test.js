/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const querySession = require('../src-electron/db/query-session')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const queryEndpoint = require('../src-electron/db/query-endpoint.js')
const queryEndpointType = require('../src-electron/db/query-endpoint-type.js')
const queryConfig = require('../src-electron/db/query-config')
const queryDeviceType = require('../src-electron/db/query-device-type')
const util = require('../src-electron/util/util')

let db
let templateContext
let zclPackageId

const testFile = testUtil.matterTestFile.allClusters
const testFile2 = testUtil.matterTestFile.allClustersFileFormat2
const multipleDeviceTypePerEndpointTestFile =
  testUtil.matterTestFile.multipleDeviceTypesPerEndpoint
const templateCount = testUtil.testTemplate.matter3Count

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('gen-matter-4')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  zclPackageId = ctx.packageId
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation',
  async () => {
    templateContext = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.matter3
    )

    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.templateData).not.toBeNull()
    expect(templateContext.templateData.name).toEqual('Matter 3 test templates')
    expect(templateContext.templateData.version).toEqual('matter-3')
    expect(templateContext.templateData.templates.length).toEqual(templateCount)
    expect(templateContext.packageId).not.toBeNull()
  },
  testUtil.timeout.medium()
)

test(
  `Zap file generation: ${path.relative(__dirname, testFile)}`,
  async () => {
    let sessionId = await querySession.createBlankSession(db)

    await importJs.importDataFromFile(db, testFile, {
      sessionId: sessionId,
    })

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )
    expect(genResult.hasErrors).toEqual(false)

    // Note: A lot of these tests here are for sake of backwards
    // compatibility. Latest ZAP must be able to generate content for
    // the old SDKs, so if you changed something that generates
    // endpoint_config differently, please be very very careful and
    // make sure you can answer positively the following question:
    //   after my changes, will zap still be able to generate content
    //   that works with an older SDK.
    //
    let ept = genResult.content['endpoint_config.h']
    expect(ept).toContain(`{ \\
      /* Endpoint: 65534, Cluster: Network Commissioning (server) */ \\
      .clusterId = 0x00000031, \\
      .attributes = ZAP_ATTRIBUTE_INDEX(729), \\
      .attributeCount = 10, \\
      .clusterSize = 0, \\
      .mask = ZAP_CLUSTER_MASK(SERVER), \\
      .functions = NULL, \\
      .acceptedCommandList = ZAP_GENERATED_COMMANDS_INDEX( 244 ), \\
      .generatedCommandList = ZAP_GENERATED_COMMANDS_INDEX( 251 ), \\
    },\\`)

    expect(ept).toContain(`#define GENERATED_ENDPOINT_TYPES { \\
  { ZAP_CLUSTER_INDEX(0), 29, 367 }, \\
  { ZAP_CLUSTER_INDEX(29), 46, 3516 }, \\
  { ZAP_CLUSTER_INDEX(75), 5, 105 }, \\
  { ZAP_CLUSTER_INDEX(80), 1, 0 }, \\
}`)
    expect(ept).toContain(
      `{ 0x00000005, ZAP_TYPE(ENUM8), 1, ZAP_ATTRIBUTE_MASK(EXTERNAL_STORAGE) | ZAP_ATTRIBUTE_MASK(NULLABLE), ZAP_EMPTY_DEFAULT() }, /* LastNetworkingStatus */`
    )
    expect(ept).toContain(
      '{ (uint16_t)0xFF, (uint16_t)0x64, (uint16_t)0xFFFF }, /* BallastFactorAdjustment */'
    )
    expect(ept).toContain(`6, 'C', 'o', 'f', 'f', 'e', 'e', \\`)
    expect(ept).toContain(
      '{ (uint16_t)-0x64, (uint16_t)-0x96, (uint16_t)0xC8 }'
    )
    expect(ept).toContain('#define GENERATED_MIN_MAX_DEFAULT_COUNT 51')
    expect(ept).toContain('#define GENERATED_ATTRIBUTE_COUNT 739')
    expect(ept).toContain(`/* EventList (index=8) */ \\
  0x00000000, /* HardwareFaultChange */ \\
  0x00000001, /* RadioFaultChange */ \\
  0x00000002, /* NetworkFaultChange */ \\
  0x00000003, /* BootReason */ \\
  `)
    expect(ept)
      .toContain(`const EmberAfGenericClusterFunction chipFuncArrayFanControlServer[] = {\\
  (EmberAfGenericClusterFunction) MatterFanControlClusterServerAttributeChangedCallback,\\
  (EmberAfGenericClusterFunction) MatterFanControlClusterServerPreAttributeChangedCallback,\\
};`)
    expect(ept).toContain(`/*   AcceptedCommandList (index=240) */ \\
  0x00000000 /* Off */, \\
  0x00000001 /* On */, \\
  0x00000002 /* Toggle */, \\
  chip::kInvalidCommandId /* end of list */,`)
    expect(ept).toContain('#define GENERATED_CLUSTER_COUNT 81')
    expect(ept).toContain('#define ZAP_FIXED_ENDPOINT_DATA_VERSION_COUNT 79')
    expect(ept).toContain('#define ATTRIBUTE_SINGLETONS_SIZE (37)')
    expect(ept).toContain('#define ATTRIBUTE_MAX_SIZE (3988)')
    expect(ept).toContain('#define FIXED_ENDPOINT_COUNT (4)')
    expect(ept).toContain(
      '#define FIXED_ENDPOINT_ARRAY { 0x0000, 0x0001, 0x0002, 0xFFFE }'
    )
    expect(ept).toContain(
      '#define FIXED_PROFILE_IDS { 0x0103, 0x0103, 0x0103, 0x0103 }'
    )
    expect(ept).toContain(
      '#define FIXED_PARENT_IDS { kInvalidEndpointId, 0, 1, kInvalidEndpointId }'
    )
    expect(ept).toContain(
      '#define FIXED_DEVICE_TYPES {{0x00000016,1},{0x00000100,1},{0x00000100,1},{0x0000F002,1}}'
    )
    expect(ept).toContain(
      '#define FIXED_DEVICE_TYPES_WITH_ENDPOINT {{0x00000016,1,0},{0x00000100,1,1},{0x00000100,1,2},{0x0000F002,1,65534}}'
    )
    expect(ept).toContain('#define FIXED_DEVICE_TYPE_OFFSETS { 0,1,2,3}')
    expect(ept).toContain('#define FIXED_DEVICE_TYPE_LENGTHS { 1,1,1,1}')
    expect(ept).toContain('#define FIXED_ENDPOINT_TYPES { 0, 1, 2, 3 }')
    expect(ept).toContain('#define FIXED_NETWORKS { 0, 0, 0, 0 }')

    // Some odd ordering
    expect(ept).toContain(`{ \\
      /* Endpoint: 0, Cluster: Basic Information (server) */ \\
      .mask = ZAP_CLUSTER_MASK(SERVER), \\
      .attributeCount = 22, \\
      .clusterId = 0x00000028, \\
    },\\`)
  },
  testUtil.timeout.long()
)

test(
  `Zap file generation: ${path.relative(__dirname, testFile2)}`,
  async () => {
    let sessionId = await querySession.createBlankSession(db)

    await importJs.importDataFromFile(db, testFile2, {
      sessionId: sessionId,
    })

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )
    expect(genResult.hasErrors).toEqual(false)

    // Note: A lot of these tests here are for sake of backwards
    // compatibility. Latest ZAP must be able to generate content for
    // the old SDKs, so if you changed something that generates
    // endpoint_config differently, please be very very careful and
    // make sure you can answer positively the following question:
    //   after my changes, will zap still be able to generate content
    //   that works with an older SDK.
    //
    let ept = genResult.content['endpoint_config.h']
    expect(ept).toContain(`{ \\
      /* Endpoint: 65534, Cluster: Network Commissioning (server) */ \\
      .clusterId = 0x00000031, \\
      .attributes = ZAP_ATTRIBUTE_INDEX(729), \\
      .attributeCount = 10, \\
      .clusterSize = 0, \\
      .mask = ZAP_CLUSTER_MASK(SERVER), \\
      .functions = NULL, \\
      .acceptedCommandList = ZAP_GENERATED_COMMANDS_INDEX( 244 ), \\
      .generatedCommandList = ZAP_GENERATED_COMMANDS_INDEX( 251 ), \\
    },\\`)

    expect(ept).toContain(`#define GENERATED_ENDPOINT_TYPES { \\
  { ZAP_CLUSTER_INDEX(0), 29, 367 }, \\
  { ZAP_CLUSTER_INDEX(29), 46, 3516 }, \\
  { ZAP_CLUSTER_INDEX(75), 5, 105 }, \\
  { ZAP_CLUSTER_INDEX(80), 1, 0 }, \\
}`)
    expect(ept).toContain(
      `{ 0x00000005, ZAP_TYPE(ENUM8), 1, ZAP_ATTRIBUTE_MASK(EXTERNAL_STORAGE) | ZAP_ATTRIBUTE_MASK(NULLABLE), ZAP_EMPTY_DEFAULT() }, /* LastNetworkingStatus */`
    )
    expect(ept).toContain(
      '{ (uint16_t)0xFF, (uint16_t)0x64, (uint16_t)0xFFFF }, /* BallastFactorAdjustment */'
    )
    expect(ept).toContain(`6, 'C', 'o', 'f', 'f', 'e', 'e', \\`)
    expect(ept).toContain(
      '{ (uint16_t)-0x64, (uint16_t)-0x96, (uint16_t)0xC8 }'
    )
    expect(ept).toContain('#define GENERATED_MIN_MAX_DEFAULT_COUNT 51')
    expect(ept).toContain('#define GENERATED_ATTRIBUTE_COUNT 739')
    expect(ept).toContain(`/* EventList (index=8) */ \\
  0x00000000, /* HardwareFaultChange */ \\
  0x00000001, /* RadioFaultChange */ \\
  0x00000002, /* NetworkFaultChange */ \\
  0x00000003, /* BootReason */ \\
  `)
    expect(ept)
      .toContain(`const EmberAfGenericClusterFunction chipFuncArrayFanControlServer[] = {\\
  (EmberAfGenericClusterFunction) MatterFanControlClusterServerAttributeChangedCallback,\\
  (EmberAfGenericClusterFunction) MatterFanControlClusterServerPreAttributeChangedCallback,\\
};`)
    expect(ept).toContain(`/*   AcceptedCommandList (index=240) */ \\
  0x00000000 /* Off */, \\
  0x00000001 /* On */, \\
  0x00000002 /* Toggle */, \\
  chip::kInvalidCommandId /* end of list */,`)
    expect(ept).toContain('#define GENERATED_CLUSTER_COUNT 81')
    expect(ept).toContain('#define ZAP_FIXED_ENDPOINT_DATA_VERSION_COUNT 79')
    expect(ept).toContain('#define ATTRIBUTE_SINGLETONS_SIZE (37)')
    expect(ept).toContain('#define ATTRIBUTE_MAX_SIZE (3988)')
    expect(ept).toContain('#define FIXED_ENDPOINT_COUNT (4)')
    expect(ept).toContain(
      '#define FIXED_ENDPOINT_ARRAY { 0x0000, 0x0001, 0x0002, 0xFFFE }'
    )
    expect(ept).toContain(
      '#define FIXED_PROFILE_IDS { 0x0103, 0x0103, 0x0103, 0x0103 }'
    )
    expect(ept).toContain(
      '#define FIXED_PARENT_IDS { kInvalidEndpointId, kInvalidEndpointId, kInvalidEndpointId, kInvalidEndpointId }'
    )
    expect(ept).toContain(
      '#define FIXED_DEVICE_TYPES {{0x00000016,1},{0x00000100,1},{0x00000100,1},{0x0000F002,1}}'
    )
    expect(ept).toContain(
      '#define FIXED_DEVICE_TYPES_WITH_ENDPOINT {{0x00000016,1,0},{0x00000100,1,1},{0x00000100,1,2},{0x0000F002,1,65534}}'
    )
    expect(ept).toContain('#define FIXED_DEVICE_TYPE_OFFSETS { 0,1,2,3}')
    expect(ept).toContain('#define FIXED_DEVICE_TYPE_LENGTHS { 1,1,1,1}')
    expect(ept).toContain('#define FIXED_ENDPOINT_TYPES { 0, 1, 2, 3 }')
    expect(ept).toContain('#define FIXED_NETWORKS { 0, 0, 0, 0 }')

    // Some odd ordering
    expect(ept).toContain(`{ \\
      /* Endpoint: 0, Cluster: Basic Information (server) */ \\
      .mask = ZAP_CLUSTER_MASK(SERVER), \\
      .attributeCount = 22, \\
      .clusterId = 0x00000028, \\
    },\\`)
  },
  testUtil.timeout.long()
)

test(
  `Zap multiple device type per endpoint file generation: ${path.relative(
    __dirname,
    multipleDeviceTypePerEndpointTestFile
  )}`,
  async () => {
    let sessionId = await querySession.createBlankSession(db)

    await importJs.importDataFromFile(
      db,
      multipleDeviceTypePerEndpointTestFile,
      {
        sessionId: sessionId,
      }
    )

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )
    expect(genResult.hasErrors).toEqual(false)

    let ept = genResult.content['endpoint_config.h']

    expect(ept).toContain(
      '#define FIXED_DEVICE_TYPES {{0x00000016,1},{0x00000101,2},{0x00000100,1},{0x00000101,1},{0x00000100,1},{0x0000F002,1}}'
    )
    expect(ept).toContain(
      '#define FIXED_DEVICE_TYPES_WITH_ENDPOINT {{0x00000016,1,0},{0x00000101,2,1},{0x00000100,1,1},{0x00000101,1,2},{0x00000100,1,2},{0x0000F002,1,65534}}'
    )
    expect(ept).toContain('#define FIXED_DEVICE_TYPE_OFFSETS { 0,1,3,5}')
    expect(ept).toContain('#define FIXED_DEVICE_TYPE_LENGTHS { 1,2,2,1}')
    expect(ept).toContain('#define FIXED_ENDPOINT_TYPES { 0, 1, 2, 3 }')

    // Test user_device_types helper within user_endpoints
    expect(ept).toContain('Endpoint 0, DeviceId: 22, DeviceVersion: 1')
    expect(ept).toContain('Endpoint 1, DeviceId: 256, DeviceVersion: 1')
    expect(ept).toContain('Endpoint 1, DeviceId: 257, DeviceVersion: 2')
    expect(ept).toContain('Endpoint 2, DeviceId: 256, DeviceVersion: 1')
    expect(ept).toContain('Endpoint 2, DeviceId: 257, DeviceVersion: 1')
    expect(ept).toContain('Endpoint 65534, DeviceId: 61442, DeviceVersion: 1')
  },
  testUtil.timeout.long()
)

test(
  `Zap testing miscellaneouos type specific helpers: ${path.relative(
    __dirname,
    testFile
  )}`,
  async () => {
    let sessionId = await querySession.createBlankSession(db)

    await importJs.importDataFromFile(db, testFile, {
      sessionId: sessionId,
    })

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )
    expect(genResult.hasErrors).toEqual(false)

    // Note: A lot of these tests here are for sake of backwards
    // compatibility. Latest ZAP must be able to generate content for
    // the old SDKs, so if you changed something that generates
    // endpoint_config differently, please be very very careful and
    // make sure you can answer positively the following question:
    //   will after my changes, zap still be able to generate content
    //   that will work with an older SDK.
    //
    let ept = genResult.content['miscellaneous_helper_tests.out']

    // Testing if_unsupported_attribute_callback helper
    expect(ept).toContain(
      'attribute callback for OnOff of boolean type is supported in java'
    )
    expect(ept).toContain(
      'attribute callback for GlobalSceneControl of boolean type is supported in java'
    )
    expect(ept).toContain(
      'attribute callback for GeneratedCommandList of command_id type is supported in java'
    )

    // Testing if_basic_attribute helper
    expect(ept).toContain(
      'attribute OnTime of int16u type is basic type in java'
    )
    expect(ept).toContain(
      'attribute EventList of event_id type is not basic type in java'
    )
    expect(ept).toContain(
      'attribute StartUpOnOff of OnOffStartUpOnOff type is not basic type in java'
    )

    // Testing as_underlying_java_zcl_type helper
    expect(ept).toContain(
      'Underlying Java type for attribute OnOff of boolean type: Boolean'
    )
    expect(ept).toContain(
      'Underlying Java type for attribute OnTime of int16u type: Integer'
    )
    expect(ept).toContain(
      'Underlying Java type for attribute GeneratedCommandList of command_id type: Long'
    )

    // Testing as_underlying_python_zcl_type helper
    expect(ept).toContain(
      'Underlying Python type for attribute OnOff of boolean type: bool'
    )
    expect(ept).toContain(
      'Underlying Python type for attribute OnTime of int16u type: int'
    )
    expect(ept).toContain(
      'Underlying Python type for attribute GeneratedCommandList of command_id type: int'
    )

    // Testing if_is_data_type_signed and as_zcl_data_type_size
    expect(ept).toContain(
      'attribute OnOff of type boolean is unsigned. The size of this attribute is: 8 bits'
    )
    expect(ept).toContain(
      'attribute OnTime of type int16u is unsigned. The size of this attribute is: 16 bits'
    )
    expect(ept).toContain(
      'attribute StartUpOnOff of type OnOffStartUpOnOff is unsigned. The size of this attribute is: 8 bits'
    )
    expect(ept).toContain(
      'attribute GeneratedCommandList of type command_id is unsigned. The size of this attribute is: 32 bits'
    )

    // Testing cluster specific structs
    expect(ept).toContain(
      'TargetStruct item 0 from Access Control cluster: Cluster'
    )
    expect(ept).toContain(
      'TargetStruct item 1 from Access Control cluster: Endpoint'
    )
    expect(ept).toContain(
      'TargetStruct item 2 from Access Control cluster: DeviceType'
    )
    expect(ept).toContain('TargetStruct item 0 from Binding cluster: Node')
    expect(ept).toContain('TargetStruct item 1 from Binding cluster: Group')
    expect(ept).toContain('TargetStruct item 2 from Binding cluster: Endpoint')
    expect(ept).toContain('TargetStruct item 3 from Binding cluster: Cluster')
    expect(ept).toContain(
      'TargetStruct item 4 from Binding cluster: FabricIndex'
    )
  },
  testUtil.timeout.long()
)

test(
  `Zap file generation for multiple zcl device types per endpoint: ${path.relative(
    __dirname,
    testFile
  )}`,
  async () => {
    // Creating a session with matter specific session packages
    let userSession = await querySession.ensureZapUserAndSession(
      db,
      'USER',
      'SESSION'
    )
    let sid = userSession.sessionId
    await util.ensurePackagesAndPopulateSessionOptions(
      db,
      sid,
      {
        zcl: env.builtinMatterZclMetafile(),
        template: testUtil.testTemplate.matter3,
      },
      null,
      [templateContext.packageId]
    )

    // Extract device types for insertion into an endpoint
    let allDeviceTypes = await queryDeviceType.selectAllDeviceTypes(
      db,
      zclPackageId
    )
    let matterLightDevices = allDeviceTypes.filter(
      (data) =>
        data.label === 'MA-onofflight' || data.label === 'MA-dimmablelight'
    )
    let matterLightDeviceRefs = matterLightDevices.map((dt) => dt.id)
    let matterLightDeviceIds = matterLightDevices.map((dt) => dt.code)

    // insert the device types above into an endpoint type
    await queryConfig.insertEndpointType(
      db,
      sid,
      'testEndpointType',
      matterLightDeviceRefs,
      matterLightDeviceIds,
      [1, 2] //device type version
    )

    // Getting the endpoint cluster information and making sure clusters from both
    // device types are added.
    let epts = await queryEndpointType.selectAllEndpointTypes(db, sid)
    expect(epts[0].deviceTypeRef.length).toEqual(2)
    let clusters = await queryEndpoint.selectEndpointClusters(db, epts[0].id)
    let clusterNames = clusters.map((cl) => cl.name)
    expect(clusterNames.length).toEqual(6)
    expect(clusterNames.includes('Identify')).toEqual(true)
    expect(clusterNames.includes('Groups')).toEqual(true)
    expect(clusterNames.includes('Scenes')).toEqual(true)
    expect(clusterNames.includes('On/Off')).toEqual(true)
    expect(clusterNames.includes('Descriptor')).toEqual(true)

    // Cluster coming from just MA-dimmablelight and not MA-onofflight
    expect(clusterNames.includes('Level Control')).toEqual(true)

    // Edit the endpoint type and add another device type and test the update
    let additionalMatterLightDevice = allDeviceTypes.filter(
      (data) => data.label === 'MA-colortemperaturelight'
    )

    let matterLightDevicesExtended = matterLightDeviceRefs.concat(
      additionalMatterLightDevice.map((dt) => dt.id)
    )
    let matterLightDeviceIdsExtended = matterLightDeviceIds.concat(
      additionalMatterLightDevice.map((dt) => dt.code)
    )
    let changesArray = [
      { key: 'deviceTypeRef', value: matterLightDevicesExtended },
      { key: 'deviceVersion', value: [1, 1, 1] },
      { key: 'deviceId', value: matterLightDeviceIdsExtended },
    ]
    await queryConfig.updateEndpointType(db, sid, epts[0].id, changesArray)

    epts = await queryEndpointType.selectAllEndpointTypes(db, sid)
    expect(epts[0].deviceTypeRef.length).toEqual(3)
    clusters = await queryEndpoint.selectEndpointClusters(db, epts[0].id)
    clusterNames = clusters.map((cl) => cl.name)
    expect(clusterNames.length).toEqual(7)
    // Cluster coming from just MA-colortemperaturelight
    expect(clusterNames.includes('Color Control')).toEqual(true)
  },
  testUtil.timeout.long()
)
