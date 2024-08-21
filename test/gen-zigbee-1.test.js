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
const helperZap = require('../src-electron/generator/helper-zap')
const testUtil = require('./test-util')

let db
const templateCount = testUtil.testTemplate.zigbeeCount

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee1')
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
  'Validate base generation',
  async () => {
    let genResult = await genEngine.generate(
      templateContext.db,
      templateContext.sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )

    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()
    let simpleTest = genResult.content['simple-test.out']
    expect(simpleTest.startsWith('Test template file.')).toBeTruthy()
    expect(simpleTest).toContain('Strange type: bacnet_type_t')
    expect(simpleTest).toContain(helperZap.zap_header())
    expect(simpleTest).toContain(`SessionId: ${genResult.sessionId}`)
    expect(simpleTest).toContain('Addon: This is example of test addon helper')
    expect(simpleTest).toContain(
      'External Addon: This is example of test external addon helper'
    )

    let zclId = genResult.content['zcl-test.out']
    // In windows, if the generated string has multiple lines (with \n inside), it will include a trailing space at the end of each line
    // so we need to remove the trailing space if it exists to clean up the string
    zclId = zclId
      .split('\n')
      .map((s) => s.trim())
      .join('\n')
    //expect(zclId).toEqual('random placeholder')
    expect(zclId).toContain(
      `// ${testUtil.totalNonAtomicEnumCount - 1}/${
        testUtil.totalNonAtomicEnumCount
      }: label=>ZllStatus caption=>Enum of size 1 byte`
    )
    expect(zclId).toContain(`Label count: ${testUtil.totalNonAtomicEnumCount}`)
    expect(zclId).toContain(
      `// 129/${testUtil.totalNonAtomicEnumCount}: label=>MeteringBlockEnumerations caption=>Enum of size 1 byte`
    )
    expect(zclId).toContain(
      '// struct: ReadReportingConfigurationAttributeRecord'
    )
    expect(zclId).toContain('cluster: 0x0700 Price')
    expect(zclId).toContain('cmd: 0x0A GetUserStatusResponse')
    expect(zclId).toContain('att: 0x0002 gps communication mode')
    expect(zclId).toContain('First item\n// struct: BlockThreshold')
    expect(zclId).toContain('// struct: WwahClusterStatusToUseTC\nLast item')
    expect(zclId).toContain('// event: 0x0001 HelloEvent')
    expect(zclId).toContain('-> field: 0x0002 arg2 INT32U')

    let accumulator = genResult.content['accumulator.out']
    expect(accumulator).toContain('Iteration: 19 out of 20')
    expect(accumulator).toContain('Cumulative size: 16 / 206')
    expect(accumulator).toContain('Cumulative size: 8 / 109')
    expect(accumulator).toContain('Cumulative size: 0 / 206')

    let atomics = genResult.content['atomics.out']
    expect(atomics).toContain('C type: bacnet_type_t')
    // Now check for the override
    //expect(atomics).toContain('C type: security_key_type_override')

    let zapCommand = genResult.content['zap-command.h']
    expect(zapCommand).not.toBeNull()
    expect(zapCommand).toContain(
      '#define emberAfFillCommandGlobalReadAttributesResponse(clusterId,'
    )

    let zapPrint = genResult.content['zap-print.h']
    expect(zapPrint).toContain(
      '#define SILABS_PRINTCLUSTER_POWER_CONFIG_CLUSTER {ZCL_POWER_CONFIG_CLUSTER_ID, 0x0000, "Power Configuration" },'
    )

    let sdkExtension = genResult.content['sdk-extension.out']
    expect(sdkExtension).toContain(
      "// cluster: 0x0000 Basic, text extension: 'Extension to basic cluster'"
    )
    expect(sdkExtension).toContain(
      "// cluster: 0x0002 Device Temperature Configuration, text extension: 'Extension to temperature config cluster'"
    )
    expect(sdkExtension).toContain(
      "// server cluster: 0x0001 Power Configuration, text extension: 'Extension to power cluster'"
    )
    expect(sdkExtension).toContain(
      "// client cluster: 0x0001 Power Configuration, text extension: ''"
    )
    expect(sdkExtension).toContain(
      "// attribute: 0x0000 / 0x0000 => ZCL version, extensions: '42', '99'"
    )
    expect(sdkExtension).toContain(
      "attribute: 0x0015 / 0x0015 => network key sequence number, extensions: '0', '1', [int8u:666]"
    )
    expect(sdkExtension).toContain(
      "// cluster: 0x0003 Identify, text extension: ''"
    )
    expect(sdkExtension).toContain(
      "// command: 0x0000 / 0x00 => ResetToFactoryDefaults, test extension: '1'"
    )
    expect(sdkExtension).toContain(
      "// device type: HA / 0x0006 => HA-remote // extension: 'path/to/remote.c'"
    )
    expect(sdkExtension).toContain(
      'IMPLEMENTED_COMMANDS>ResetToFactoryDefaults,IdentifyQueryResponse,IdentifyQuery,EZModeInvoke,UpdateCommissionState,<END'
    )
    // Testing {{#if_is_struct}} helper
    expect(zclId).toContain(`attributeIds is not struct`)
    // Testing {{#if_command_discovery_enabled}} helper
    expect(zclId).toContain(`#define EMBER_AF_SUPPORT_COMMAND_DISCOVERY`)
    // Testing {{#zcl_struct_items_by_struct_name}} helper
    expect(zclId).toContain(`configureReportingRecords::direction struct item`)
    expect(zclId).toContain(`readAttributeStatusRecords is struct`)

    let zapId = genResult.content['zap-id.h']
    //expect(zapId).toEqual('random placeholder')

    expect(zapId).toContain('// Definitions for cluster: Basic')
    expect(zapId).toContain(
      '#define ZCL_GET_PROFILE_RESPONSE_COMMAND_ID (0x00)'
    )
    // Testing {{#zcl_commands_source_client}} helper
    expect(zapId).toContain(
      '#define ZCL_IDENTIFY_C_TO_S_IDENTIFY_QUERY_COMMAND_ID (0x01)'
    )
    // Testing {{#zcl_commands_source_server}} helper
    expect(zapId).toContain(
      '#define ZCL_IDENTIFY_S_TO_C_IDENTIFY_QUERY_RESPONSE_COMMAND_ID (0x00)'
    )
    expect(zapId).toContain(
      '// Client attributes for cluster: Fluoride Concentration Measurement'
    )
    expect(zapId).toContain(
      '#define ZCL_NUMBER_OF_RESETS_ATTRIBUTE_ID (0x0000)'
    )
    let zapTypes = genResult.content['zap-type.h']
    expect(zapTypes).toContain(
      'ZCL_INT16U_ATTRIBUTE_TYPE = 0x21, // Unsigned 16-bit integer'
    )
    expect(zapTypes).toContain('uint32_t snapshotCause')
    expect(zapTypes).toContain('typedef uint8_t EphemeralData;')

    let zapCommandParser = genResult.content['zap-command-parser.c']
    expect(zapCommandParser).not.toBeNull()
    expect(zapCommandParser).toContain(
      'EmberAfStatus emberAfClusterSpecificCommandParse(EmberAfClusterCommand * cmd)'
    )
  },
  testUtil.timeout.long()
)
