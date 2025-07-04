/**
 *
 *    Copyright (c) 2025 Silicon Labs
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

/**
 * This file tests device types through custom XML files.
 *
 * Tests are dependent on each other, please be cautious when changing or adding tests.
 */

const fs = require('fs')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const env = require('../src-electron/util/env')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const querySession = require('../src-electron/db/query-session')
const queryPackage = require('../src-electron/db/query-package')
const queryPackageNotification = require('../src-electron/db/query-package-notification')
const querySessionNotification = require('../src-electron/db/query-session-notification')
const queryDeviceType = require('../src-electron/db/query-device-type')
const queryConfig = require('../src-electron/db/query-config')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const queryZcl = require('../src-electron/db/query-zcl')
const queryAttribute = require('../src-electron/db/query-attribute')
const exportJs = require('../src-electron/importexport/export')
const util = require('../src-electron/util/util')
const restApi = require('../src-shared/rest-api.js')
const genEngine = require('../src-electron/generator/generation-engine')
const importJs = require('../src-electron/importexport/import')
const {
  loadIndividualSilabsFile
} = require('../src-electron/zcl/zcl-loader-silabs.js')
let db
let sid
let mainPackageId
let customDeviceType
let templateContext

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('custom-xml-device-type')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
  mainPackageId = ctx.packageId
  let uuid = util.createUuid()
  sid = await testQuery.createSession(
    db,
    'USER',
    uuid,
    env.builtinSilabsZclMetafile()
  )
  // loading templates
  templateContext = await genEngine.loadTemplates(
    db,
    testUtil.testTemplate.zigbee
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test('Load custom xml with Device Type', async () => {
  // load first custom xml (device type being loaded refers to cluster from this file)
  let result = await zclLoader.loadIndividualFile(
    db,
    testUtil.testCustomXml2,
    sid
  )
  expect(result.succeeded).toBe(true)

  // load custom xml with device type
  result = await zclLoader.loadIndividualFile(
    db,
    testUtil.testCustomXmlDeviceType,
    sid
  )

  // Check if device type is loaded into the database
  customDeviceType = await queryDeviceType.selectDeviceTypeByCodeAndName(
    db,
    result.packageId,
    0x0001,
    'DUT-Client'
  )
  expect(customDeviceType).not.toBeNull()
  expect(customDeviceType.name).toBe('DUT-Client')

  // Check if device type clusters are correctly populated
  let deviceTypeClusters =
    await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
      db,
      customDeviceType.id
    )
  expect(deviceTypeClusters.length).toBe(4)

  // Ensure each deviceTypeCluster has a non-null clusterRef
  deviceTypeClusters.forEach((cluster) => {
    expect(cluster.clusterRef).not.toBeNull()
  })

  let customDeviceTypeCluster = deviceTypeClusters.find(
    (cluster) => cluster.clusterName === 'Custom Cluster'
  )
  expect(customDeviceTypeCluster).not.toBeNull()

  let deviceTypeAttributes =
    await queryDeviceType.selectDeviceTypeCommandsByDeviceTypeRef(
      db,
      customDeviceType.id
    )

  expect(deviceTypeAttributes.length).toBe(2)
})

test('Generation with custom xml with Device Type', async () => {
  let sessionPartitionInfo =
    await querySession.selectSessionPartitionInfoFromDeviceType(
      db,
      sid,
      customDeviceType.id
    )

  // Inserting endpoint type with custom xml device type
  let eptTypeId = await queryConfig.insertEndpointType(
    db,
    sessionPartitionInfo[0],
    'EPT',
    customDeviceType.id,
    customDeviceType.code,
    0,
    true
  )
  expect(eptTypeId).not.toBeNull()

  eptId = await queryEndpoint.insertEndpoint(db, sid, 1, eptTypeId, 0, 0)

  let genResult = await genEngine.generate(
    db,
    sid,
    templateContext.packageId,
    {},
    {
      generateOnly: [
        'sdk-extension.out',
        'zap-config.h',
        'zap-config-version-2.h'
      ],
      disableDeprecationWarnings: true
    }
  )
  expect(genResult.hasErrors).toBeFalsy()

  // Check if the generated files contain the expected content
  let sdkExt = genResult.content['sdk-extension.out']
  expect(sdkExt).toContain(
    "// device type: CUSTOM_DUT / 0x0001 => DUT-Client // extension: ''"
  )
  expect(sdkExt).toContain(
    "// device type: CUSTOM_DUT / 0x0002 => DUT-Server // extension: ''"
  )

  let zapConfig = genResult.content['zap-config.h']
  expect(zapConfig).toContain(
    '{ 0x00000000, ZAP_ATTRIBUTE_INDEX(0), 0, 0, ZAP_CLUSTER_MASK(CLIENT), NULL }, /* Endpoint: 1, Cluster: Basic (client) */ \\'
  )
  expect(zapConfig).toContain(
    '{ 0x00000006, ZAP_ATTRIBUTE_INDEX(0), 0, 0, ZAP_CLUSTER_MASK(CLIENT), NULL }, /* Endpoint: 1, Cluster: On/off (client) */ \\'
  )
  expect(zapConfig).toContain(
    '{ 0x10E0FCA7, ZAP_ATTRIBUTE_INDEX(0), 0, 0, ZAP_CLUSTER_MASK(CLIENT), NULL }, /* Endpoint: 1, Cluster: Custom Cluster (client) */ \\'
  )
  expect(zapConfig).toContain(
    '{ 0xABCDFFCD, ZAP_ATTRIBUTE_INDEX(0), 0, 0, ZAP_CLUSTER_MASK(CLIENT), NULL }, /* Endpoint: 1, Cluster: Test Cluster - Device Type (client) */ \\'
  )

  let zapConfigVer2 = genResult.content['zap-config-version-2.h']
  expect(zapConfigVer2).toContain(
    '{ 0x0302, ZCL_INT8U_ATTRIBUTE_TYPE, 1, (ATTRIBUTE_MASK_READABLE| ATTRIBUTE_MASK_MANUFACTURER_SPECIFIC| ATTRIBUTE_MASK_CLIENT), { (uint8_t*)0  } }, /* 2 Cluster: Custom Cluster, Attribute: A9, Side: client*/ \\'
  )
  expect(zapConfigVer2).toContain(
    '{ 0x0006, 0x02, COMMAND_MASK_OUTGOING_CLIENT }, /* 2, Cluster: On/off, Command: Toggle*/ \\'
  )
  expect(zapConfigVer2).toContain(
    '{ 0xFFCD, 0x00, COMMAND_MASK_OUTGOING_CLIENT | COMMAND_MASK_MANUFACTURER_SPECIFIC }, /* 15, Cluster: Test Cluster - Device Type, Command: CommandOne*/ \\'
  )
})

test('Load same custom xml with different zcl file', async () => {
  await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  let uuid = util.createUuid()
  let newSid = await testQuery.createSession(
    db,
    'USER',
    uuid,
    env.builtinMatterZclMetafile()
  )

  // load custom xml with device type
  result = await zclLoader.loadIndividualFile(
    db,
    testUtil.testCustomXmlDeviceType,
    newSid
  )
  expect(result.succeeded).toBe(true)

  // Check if new device type cluster is correctly added
  // There should be a new device type cluster for on/off with clusterRef from the matter zcl file
  let deviceTypeClusters =
    await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
      db,
      customDeviceType.id
    )
  expect(deviceTypeClusters.length).toBe(5)

  // Check if correct errors are thrown for unlinked clusters
  let sessionNotif = await querySessionNotification.getNotification(db, newSid)
  expect(
    sessionNotif.some(
      (notif) =>
        notif.type === 'ERROR' &&
        notif.message.includes(
          'Cluster "Basic" in device type DUT-Client is not found in the current session'
        ) &&
        notif.message.includes('custom-device-type.xml')
    )
  ).toBeTruthy()
})

test(`Load .zap file with custom xml with Device Type`, async () => {
  let newSid = await querySession.createBlankSession(db)

  // importing a zap file that has an endpoint with custom xml device type
  let importResult = await importJs.importDataFromFile(
    db,
    testUtil.testMatterCustomZap2,
    {
      sessionId: newSid
    }
  )

  expect(importResult.templateIds.length).toBe(1)

  let genResult = await genEngine.generate(
    db,
    newSid,
    importResult.templateIds[0],
    {},
    {
      generateOnly: ['endpoint-config.c', 'endpoints.out'],
      disableDeprecationWarnings: true
    }
  )
  expect(genResult.hasErrors).toBeFalsy()

  // Check if the generated files contain the expected content
  let endpoints = genResult.content['endpoints.out']
  expect(endpoints).toContain('  >> device: DUT-Server [2]')

  let endpointConfig = genResult.content['endpoint-config.c']
  expect(endpointConfig).toContain(
    '{ 0x00000000, ZAP_TYPE(BOOLEAN), 1, ZAP_ATTRIBUTE_MASK(READABLE), ZAP_SIMPLE_DEFAULT(0) }, /* OnOff */  \\'
  )
  expect(endpointConfig).toContain(
    '/* Endpoint: 1, Cluster: Test Cluster - Device Type (server) */ \\'
  )
})
