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

let db
let templateContext
let zclPackageId

const testFile = testUtil.matterTestFile.allClusters
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
    //   will after my changes, zap still be able to generate content
    //   that will work with an older SDK.
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
  { ZAP_CLUSTER_INDEX(0), 29, 377 }, \\
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
    expect(ept).toContain('#define ATTRIBUTE_MAX_SIZE (3998)')
    expect(ept).toContain('#define FIXED_ENDPOINT_COUNT (4)')
    expect(ept).toContain(
      '#define FIXED_ENDPOINT_ARRAY { 0x0000, 0x0001, 0x0002, 0xFFFE }'
    )
    expect(ept).toContain(
      '#define FIXED_PROFILE_IDS { 0x0103, 0x0103, 0x0103, 0x0103 }'
    )
    expect(ept).toContain(
      '#define FIXED_DEVICE_TYPES {{0x0016,1},{0x0100,1},{0x0100,1},{0xF002,1}}'
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
