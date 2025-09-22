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
const testFile = testUtil.zigbeeTestFile.gpCombo

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee4')
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
        template: env.builtinTemplateMetafile()
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
        disableDeprecationWarnings: true
      }
    )

    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()
    let cfg = genResult.content['zap-config.h']
    expect(cfg).toContain(
      '{ ZAP_REPORT_DIRECTION(REPORTED), 0x0002, 0x00000000, 0x00000000, ZAP_CLUSTER_MASK(SERVER), 0x0000, {{ 0, 65534, 0 }} }, /* ZCL version */'
    )
    expect(cfg).toContain(
      '{ ZAP_REPORT_DIRECTION(REPORTED), 0x0001, 0x00000300, 0x00000003, ZAP_CLUSTER_MASK(SERVER), 0x0000, {{ 0, 65534, 0 }} }, /* current x */'
    )

    let cfgVer2 = genResult.content['zap-config-version-2.h']

    // Test GENERATED_DEFAULTS big endian
    expect(cfgVer2).toContain(
      '0x0F, 0xAE, 0x2F, /* 0,DEFAULT value for cluster: Green Power, attribute: gps functionality, side: server */'
    )

    // Test GENERATED_DEFAULTS little endian
    expect(cfgVer2).toContain(
      '0x2F, 0xAE, 0x0F, /* 0,DEFAULT value for cluster: Green Power, attribute: gps functionality, side: server*/'
    )

    // Test GENERATED_DEFAULTS big endian for attribute of size > 8
    expect(cfgVer2).toContain(
      '0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0F, 0x0F, 0x0F, /* 6,DEFAULT value for cluster: Green Power, attribute: gp link key, side: server */'
    )

    // Test GENERATED_DEFAULTS for same attribute name but different side of cluster, compare it to above test
    expect(cfgVer2).toContain(
      '0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0F, 0x0F, 0x0F, /* 28,DEFAULT value for cluster: Green Power, attribute: gp link key, side: client */'
    )

    // Test GENERATED_DEFAULTS little endian for attribute of size > 8 is same as big endian. Bytes are not inverted
    expect(cfgVer2).not.toContain(
      `0x0F, 0x0F, 0x0F, 0x0D, 0x0C, 0x0B, 0x0A, 0x09, 0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01, /* 12,DEFAULT value for cluster: Green Power, attribute: gp link key, side: client*/`
    )

    // Testing GENERATED ATTRIBUTES to see that they are refering to the correct generation defaults
    expect(cfgVer2).toContain(
      `0x0022, ZCL_SECURITY_KEY_ATTRIBUTE_TYPE, 16, (ATTRIBUTE_MASK_WRITABLE| ATTRIBUTE_MASK_CLIENT), { (uint8_t*)&(generatedDefaults[28]) } }, /* 25 Cluster: Green Power, Attribute: gp link key, Side: client*/`
    )
    expect(cfgVer2).toContain(
      `0x0022, ZCL_SECURITY_KEY_ATTRIBUTE_TYPE, 16, (ATTRIBUTE_MASK_WRITABLE), { (uint8_t*)&(generatedDefaults[6]) } }, /* 37 Cluster: Green Power, Attribute: gp link key, Side: server*/`
    )

    // Test EMBER_AF_GENERATED_REPORTING_CONFIG_DEFAULTS to see that it generates reporting for singleton attributes correctly
    // This test makes sure the reporting default generates only once for a singleton attribute and not per endpoint.
    // In this case: Basic Server Cluster, ZCL version is enabled on enpoint 2 and 242
    expect(cfgVer2).toContain(`EMBER_AF_GENERATED_REPORTING_CONFIG_DEFAULTS`)
    expect(cfgVer2).toContain(
      `{ EMBER_ZCL_REPORTING_DIRECTION_REPORTED, 0x0002, 0x0000, 0x0000, CLUSTER_MASK_SERVER, 0x0000, 0, 65534, 0 }, /* Endpoint Id: 2, Cluster: Basic, Attribute: ZCL version */`
    )
    expect(cfgVer2).not.toContain(
      `{ EMBER_ZCL_REPORTING_DIRECTION_REPORTED, 0x0001, 0x0000, 0x0000, CLUSTER_MASK_SERVER, 0x0000, 0, 65534, 0 }, /* Endpoint Id: 1, Cluster: Basic, Attribute: ZCL version */`
    )
    expect(cfgVer2).not.toContain(
      `{ EMBER_ZCL_REPORTING_DIRECTION_REPORTED, 0x00F2, 0x0000, 0x0000, CLUSTER_MASK_SERVER, 0x0000, 0, 65534, 0 }, /* Endpoint Id: 242, Cluster: Basic, Attribute: ZCL version */`
    )

    // Testing zap cli helpers
    expect(genResult.content['zap-cli.c']).toContain(
      'static const sl_cli_command_entry_t zcl_identify_cluster_command_table[]'
    )

    expect(genResult.content['zap-cli.c']).toContain(
      'static const sl_cli_command_info_t cli_cmd_identify_group'
    )
    expect(genResult.content['zap-cli.c']).toContain(
      'SL_CLI_COMMAND_GROUP(zcl_identify_cluster_command_table, "ZCL identify cluster commands");'
    )
    expect(genResult.content['zap-cli.c']).toContain(
      '{ "identify", &cli_cmd_identify_group, false },'
    )
  },
  testUtil.timeout.long()
)
