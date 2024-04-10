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

const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const queryPackage = require('../src-electron/db/query-package')
const querySession = require('../src-electron/db/query-session')
const utilJs = require('../src-electron/util/util')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const path = require('path')

let db
const templateCount = testUtil.testTemplate.zigbeeCount
const testFile = testUtil.zigbeeTestFile.file1

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee3')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  return zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

let templateContext
let templatePkgId

test(
  'Basic gen template parsing and generation',
  async () => {
    let context = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.zigbee
    )
    templatePkgId = context.packageId
    expect(context.crc).not.toBeNull()
    expect(context.templateData).not.toBeNull()
    expect(context.templateData.name).toEqual('Test templates')
    expect(context.templateData.version).toEqual('test-v1')
    expect(context.templateData.templates.length).toEqual(templateCount)
    expect(context.packageId).not.toBeNull()
    templateContext = context
  },
  testUtil.timeout.medium()
)

test(
  'Validate package loading',
  async () => {
    templateContext.packages = await queryPackage.getPackageByParent(
      templateContext.db,
      templateContext.packageId
    )
    expect(templateContext.packages.length).toBe(templateCount - 1 + 3) // -1 for ignored one, two for helpers and one for overridable
  },
  testUtil.timeout.short()
)

test(
  'Create session',
  async () => {
    let sessionId = await querySession.createBlankSession(db)
    expect(sessionId).not.toBeNull()
    templateContext.sessionId = sessionId
  },
  testUtil.timeout.short()
)

test(
  'Initialize session packages',
  async () => {
    let packages = await utilJs.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      templateContext.sessionId,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile(),
      },
      null,
      [templatePkgId]
    )

    expect(packages.length).toBe(2)
  },
  testUtil.timeout.short()
)

test(
  `Zap file generation: ${path.relative(__dirname, testFile)}`,
  async () => {
    let sid = await querySession.createBlankSession(db)
    let loaderResult = await importJs.importDataFromFile(db, testFile, {
      sessionId: sid,
    })

    let genResult = await genEngine.generate(
      db,
      sid,
      loaderResult.templateIds[0],
      {},
      {
        disableDeprecationWarnings: true,
      }
    )
    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()

    let cfgVer2 = genResult.content['zap-config-version-2.h']
    // Test GENERATED_DEFAULTS
    expect(cfgVer2).toContain(
      '0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,  /* 0,DEFAULT value for cluster: Over the Air Bootloading, attribute: OTA Upgrade Server ID, side: client*/'
    )
    // Test GENERATED_ATTRIBUTE_COUNT
    expect(cfgVer2).toContain('#define GENERATED_ATTRIBUTE_COUNT 81')
    // Test GENERATED_ATTRIBUTES
    expect(cfgVer2).toContain(
      '{ 0x000F, ZCL_BITMAP8_ATTRIBUTE_TYPE, 1, (ATTRIBUTE_MASK_WRITABLE), { (uint8_t*)0x00  } }, /* 46 Cluster: Color Control, Attribute: color control options, Side: server*/'
    )
    // Test is_number_greater_than within GENERATED_ATTRIBUTES
    expect(cfgVer2).toContain(
      '{ 0x0000, ZCL_IEEE_ADDRESS_ATTRIBUTE_TYPE, 8, (ATTRIBUTE_MASK_CLIENT), { (uint8_t*)&(generatedDefaults[0]) } }, /* 35 Cluster: Over the Air Bootloading, Attribute: OTA Upgrade Server ID, Side: client*/'
    )
    // Test GENERATED_CLUSTER_COUNT
    expect(cfgVer2).toContain('#define GENERATED_CLUSTER_COUNT 18')
    // Test GENERATED_CLUSTERS
    expect(cfgVer2).toContain(
      '0x0019, (EmberAfAttributeMetadata*)&(generatedAttributes[35]), 4, 15, CLUSTER_MASK_CLIENT, NULL }, /* 15, Endpoint Id: 2, Cluster: Over the Air Bootloading, Side: client*/'
    )
    // Test GENERATED_ENDPOINT_TYPE_COUNT
    expect(cfgVer2).toContain('#define GENERATED_ENDPOINT_TYPE_COUNT (2)')
    // Test GENERATED_ENDPOINT_TYPES
    expect(cfgVer2).toContain(
      '{ ((EmberAfCluster*)&(generatedClusters[0])), 9, 50 },'
    )
    // Test ATTRIBUTE_LARGEST
    expect(cfgVer2).toContain('#define ATTRIBUTE_LARGEST (65)')
    // Test ATTRIBUTE_SINGLETONS_SIZE
    expect(cfgVer2).toContain('#define ATTRIBUTE_SINGLETONS_SIZE (191)')
    // Test ATTRIBUTE_MAX_SIZE
    expect(cfgVer2).toContain('#define ATTRIBUTE_MAX_SIZE (164)')
    // Test FIXED_ENDPOINT_COUNT
    expect(cfgVer2).toContain('#define FIXED_ENDPOINT_COUNT (2)')
    // Test EMBER_AF_GENERATED_COMMAND_COUNT
    expect(cfgVer2).toContain('#define EMBER_AF_GENERATED_COMMAND_COUNT  (88)')
    // Test GENERATED_COMMANDS
    expect(cfgVer2).toContain(
      '{ 0x0004, 0x01, COMMAND_MASK_OUTGOING_SERVER }, /* 7, Cluster: Groups, Command: ViewGroupResponse*/'
    )
  },
  testUtil.timeout.long()
)
