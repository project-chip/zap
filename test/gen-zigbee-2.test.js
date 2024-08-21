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
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const path = require('path')

let db
const templateCount = testUtil.testTemplate.zigbeeCount
const testFile = testUtil.zigbeeTestFile.threeEp

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee2')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  return zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

let templateContext

test(
  'Basic gen template parsing and generation',
  async () => {
    let context = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.zigbee
    )
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
  `Zap file generation: ${path.relative(__dirname, testFile)}`,
  async () => {
    let { sessionId, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile
    )
    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        generateOnly: 'sdk-extension.out',
        disableDeprecationWarnings: true
      }
    )

    expect(genResult.hasErrors).toBeFalsy()
    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()
    let sdkExtension = genResult.content['sdk-extension.out']
    expect(sdkExtension).not.toBeNull()
    expect(
      sdkExtension.includes(
        'IMPLEMENTED_COMMANDS2>IdentifyQueryResponse,IdentifyQuery,<END2'
      )
    ).toBeTruthy()
  },
  testUtil.timeout.long()
)

test(
  `Validate custom xml package loading: ${path.relative(__dirname, testFile)}`,
  async () => {
    // Import a zap file
    let { sessionId, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile
    )
    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)

    // Load a custom xml file
    let result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testCustomXml2,
      sessionId
    )
    expect(result.succeeded).toBeTruthy()

    // Add the packageId from above into the session
    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sessionId,
        result.packageId
      )
    await queryPackage.insertSessionPackage(
      db,
      sessionPartitionInfo[0].sessionPartitionId,
      result.packageId,
      false
    )

    // Generate code using templates
    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        generateOnly: [
          'sdk-extension.out',
          'zap-type.h',
          'zap-command-ver-2.h',
          'zap-command-structs.h',
          'zap-id.h'
        ],
        disableDeprecationWarnings: true
      }
    )

    expect(genResult.hasErrors).toBeFalsy()
    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()

    // Check that the sdk extension got generated
    let sdkExtension = genResult.content['sdk-extension.out']
    expect(sdkExtension).not.toBeNull()
    expect(
      sdkExtension.includes(
        'IMPLEMENTED_COMMANDS2>IdentifyQueryResponse,IdentifyQuery,<END2'
      )
    ).toBeTruthy()

    // Check if the types are generated correctly
    // Test custom enum generation
    let types = genResult.content['zap-type.h']
    expect(types).toContain('EMBER_ZCL_CUSTOM_STATUS_A = 0,')
    expect(types).toContain('EmberAfCustomStatus;')
    // Test custom struct generation
    expect(types).toContain('typedef struct _CustomStruct')
    expect(types).toContain('uint32_t S1;')
    expect(types).toContain('EmberAfCustomType2 S2;')
    expect(types).toContain('EmberAfCustomLevel S3;')
    expect(types).toContain('EmberAfCustomArea S4;')

    // Test custom outgoing commands are generated correctly
    let commands = genResult.content['zap-command-ver-2.h']
    expect(commands).toContain('#define emberAfFillCommandCustomClusterC1')
    expect(commands).toContain('ZCL_C1_COMMAND_ID')
    expect(commands).toContain('#define emberAfFillCommandCustomClusterC13')
    expect(commands).toContain('ZCL_C13_COMMAND_ID')

    // Test custom command coming from standard cluster extensions(identify cluster extension)
    expect(commands).toContain(
      '#define emberAfFillCommandIdentifyClusterSampleMfgSpecificIdentifyCommand1'
    )

    // Test command structs genereted
    let structs = genResult.content['zap-command-structs.h']
    expect(structs).toContain(
      'typedef struct __zcl_custom_cluster_cluster_c14_command'
    )
    expect(structs).toContain('sl_zcl_custom_cluster_cluster_c5_command_t;')

    // Test Custom attributes and command ids
    let ids = genResult.content['zap-id.h']
    expect(ids).toContain('#define ZCL_C15_COMMAND_ID (0x03)')
    expect(ids).toContain('#define ZCL_A8_ATTRIBUTE_ID (0x0301)')
    expect(ids).toContain('#define ZCL_C11_COMMAND_ID (0x0A)')

    // Test custom attributes coming from standard cluster extensions(identify cluster extension)
    expect(ids).toContain(
      '#define ZCL_SAMPLE_MFG_SPECIFIC_IDENTIFY_1_ATTRIBUTE_ID (0x0000)'
    )

    // Delete the custom xml packageId from the existing session and test generation again
    sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sessionId,
        result.packageId
      )
    await queryPackage.deleteSessionPackage(
      db,
      sessionPartitionInfo[0].sessionPartitionId,
      result.packageId
    )

    // Generate again after removing a custom xml file
    genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        generateOnly: ['zap-id.h', 'zap-command-ver-2.h'],
        disableDeprecationWarnings: true
      }
    )
    ids = genResult.content['zap-id.h']
    commands = genResult.content['zap-command-ver-2.h']

    // Test custom attributes removal coming from standard cluster extensions(identify cluster extension)
    expect(ids).not.toContain(
      '#define ZCL_SAMPLE_MFG_SPECIFIC_IDENTIFY_1_ATTRIBUTE_ID (0x0000)'
    )

    // Test custom command removal coming from standard cluster extensions(identify cluster extension)
    expect(commands).not.toContain(
      '#define emberAfFillCommandIdentifyClusterSampleMfgSpecificIdentifyCommand1'
    )
  },
  testUtil.timeout.long() * 2
)
