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
const testFile = testUtil.zigbeeTestFile.mfgSpecific

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee5')
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
    await importJs.importDataFromFile(db, testFile, { sessionId: sid })

    let genResult = await genEngine.generate(
      db,
      sid,
      templateContext.packageId,
      {},
      {
        generateOnly: 'zap-config-version-3.h',
        disableDeprecationWarnings: true,
      }
    )

    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()
    let cfgVer3 = genResult.content['zap-config-version-3.h']

    // Test GENERATED_ATTRIBUTES for the same attribute name but different attribute code
    expect(cfgVer3).toContain(
      '{ 0x0000, ZCL_INT16U_ATTRIBUTE_TYPE, 2, (ATTRIBUTE_MASK_WRITABLE| ATTRIBUTE_MASK_MANUFACTURER_SPECIFIC), { (uint8_t*)0x0000  } }, /* 51 Cluster: Sample Mfg Specific Cluster 2, Attribute: ember sample attribute 2, Side: server*/'
    )

    expect(cfgVer3).toContain(
      '{ 0x0001, ZCL_INT16U_ATTRIBUTE_TYPE, 2, (ATTRIBUTE_MASK_WRITABLE| ATTRIBUTE_MASK_MANUFACTURER_SPECIFIC), { (uint8_t*)0x0000  } }, /* 52 Cluster: Sample Mfg Specific Cluster 2, Attribute: ember sample attribute 2, Side: server*/'
    )

    // Test GENERATED_CLUSTERS for attribute index and size on endpoint 1 and endpoint 2
    expect(cfgVer3).toContain(
      '{ 0xFC00, (EmberAfAttributeMetadata*)&(generatedAttributes[43]), 2, 3, CLUSTER_MASK_CLIENT, NULL }, /* 9, Endpoint Id: 1, Cluster: Sample Mfg Specific Cluster, Side: client*/'
    )

    expect(cfgVer3).toContain(
      '{ 0xFC00, (EmberAfAttributeMetadata*)&(generatedAttributes[45]), 4, 5, CLUSTER_MASK_SERVER, NULL }, /* 10, Endpoint Id: 1, Cluster: Sample Mfg Specific Cluster, Side: server*/'
    )

    expect(cfgVer3).toContain(
      '{ 0xFC00, (EmberAfAttributeMetadata*)&(generatedAttributes[43]), 2, 3, CLUSTER_MASK_CLIENT, NULL }, /* 15, Endpoint Id: 2, Cluster: Sample Mfg Specific Cluster, Side: client*/'
    )

    expect(cfgVer3).toContain(
      '{ 0xFC00, (EmberAfAttributeMetadata*)&(generatedAttributes[49]), 2, 3, CLUSTER_MASK_CLIENT, NULL }, /* 16, Endpoint Id: 2, Cluster: Sample Mfg Specific Cluster 2, Side: client*/'
    )

    expect(cfgVer3).toContain(
      '{ 0xFC00, (EmberAfAttributeMetadata*)&(generatedAttributes[45]), 4, 5, CLUSTER_MASK_SERVER, NULL }, /* 17, Endpoint Id: 2, Cluster: Sample Mfg Specific Cluster, Side: server*/'
    )

    expect(cfgVer3).toContain(
      '{ 0xFC00, (EmberAfAttributeMetadata*)&(generatedAttributes[51]), 3, 5, CLUSTER_MASK_SERVER, NULL } /* 18, Endpoint Id: 2, Cluster: Sample Mfg Specific Cluster 2, Side: server*/'
    )

    // Test GENERATED_COMMANDS and its mask
    expect(cfgVer3).toContain(
      '{ 0xFC00, 0x00, COMMAND_MASK_INCOMING_SERVER | COMMAND_MASK_OUTGOING_CLIENT | COMMAND_MASK_MANUFACTURER_SPECIFIC }, /* 69, Cluster: Sample Mfg Specific Cluster, Command: CommandOne*/'
    )

    expect(cfgVer3).toContain(
      '{ 0xFC00, 0x00, COMMAND_MASK_INCOMING_SERVER | COMMAND_MASK_OUTGOING_CLIENT | COMMAND_MASK_MANUFACTURER_SPECIFIC }, /* 70, Cluster: Sample Mfg Specific Cluster 2, Command: CommandTwo*/'
    )

    // Test GENERATED_COMMAND_MANUFACTURER_CODES
    expect(cfgVer3).toContain('{ 69, 0x1002 },')

    expect(cfgVer3).toContain('{ 70, 0x1049 },')

    // Test GENERATED_CLUSTER_MANUFACTURER_CODES
    expect(cfgVer3).toContain('{ 9, 0x1002 },')
    expect(cfgVer3).toContain('{ 10, 0x1002 },')
    expect(cfgVer3).toContain('{ 15, 0x1002 },')
    expect(cfgVer3).toContain('{ 16, 0x1049 },')
    expect(cfgVer3).toContain('{ 17, 0x1002 },')
    expect(cfgVer3).toContain('{ 18, 0x1049 },')

    // Test GENERATED_ATTRIBUTE_MANUFACTURER_CODES, global attributes do not show up here
    expect(cfgVer3).toContain('{ 45, 0x1002 },')
    expect(cfgVer3).toContain('{ 46, 0x1002 },')
    expect(cfgVer3).toContain('{ 51, 0x1049 },')
    expect(cfgVer3).toContain('{ 52, 0x1049 },')

    // Making sure that the multi-protocol config is not generated for zigbee only generation
    expect(cfgVer3).not.toContain(
      '#define GENERATED_MULTI_PROTOCOL_ATTRIBUTE_MAPPING'
    )
    expect(cfgVer3).not.toContain('{ 6, 0, 6, 0, 0, 0, 0, 0 },')
    expect(cfgVer3).not.toContain('{ 8, 0, 8, 0, 0, 0, 0, 0 },')
    expect(cfgVer3).not.toContain('{ 8, 0, 8, 0, 1, 0, 1, 0 },')
  },
  testUtil.timeout.long()
)
