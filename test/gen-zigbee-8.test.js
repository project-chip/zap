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

const templateCount = testUtil.testTemplate.zigbeeCount
const testFile = testUtil.zigbeeTestFile.customXml

let db

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee8')
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
  'Validate custom xml package already present in the zap file',
  async () => {
    // Import a zap file which already has a custom xml file reference
    let { sessionId, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile
    )
    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)

    // Generate code using templates
    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        generateOnly: [
          'zap-type.h',
          'zap-command-ver-2.h',
          'zap-command-structs.h',
          'zap-id.h'
        ],
        disableDeprecationWarnings: true
      }
    )
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
    expect(ids).toContain('#define ZCL_CUSTOM_CLUSTER_ID (0xFCA7)')

    // Check for duplicate cluster, attribute and command defines
    let commandCount = (ids.match(/#define ZCL_C15_COMMAND_ID \(0x03\)/g) || [])
      .length
    let attributeCount = (
      ids.match(/#define ZCL_A8_ATTRIBUTE_ID \(0x0301\)/g) || []
    ).length
    let clusterCount = (
      ids.match(/#define ZCL_CUSTOM_CLUSTER_ID \(0xFCA7\)/g) || []
    ).length
    expect(commandCount).toEqual(1)
    expect(attributeCount).toEqual(1)
    expect(clusterCount).toEqual(1)

    // Check for global attributes being present in custom clusters
    let splitIds = ids.split('#define ZCL_A8_ATTRIBUTE_ID (0x0301)')
    expect(
      splitIds[1]
        .trimStart()
        .startsWith('#define ZCL_CLUSTER_REVISION_SERVER_ATTRIBUTE_ID (0xFFFD)')
    ).toBeTruthy()

    // Test custom attributes coming from standard cluster extensions(identify cluster extension)
    expect(ids).toContain(
      '#define ZCL_SAMPLE_MFG_SPECIFIC_IDENTIFY_1_ATTRIBUTE_ID (0x0000)'
    )

    // Delete the custom xml packageId from the existing session and test generation again
    let allSessionPackages = await queryPackage.getSessionPackages(
      db,
      sessionId
    )
    let packageInfoPromises = allSessionPackages.map((pkg) =>
      queryPackage.getPackageByPackageId(db, pkg.packageRef)
    )
    let zclCustomXmlPackages = await Promise.all(packageInfoPromises).then(
      (sessionPackages) =>
        sessionPackages.filter((pkg) => pkg.type == 'zcl-xml-standalone')
    )
    let xmlPackageRemovalPromises = []
    for (let i = 0; i < zclCustomXmlPackages.length; i++) {
      let sessionPartitionInfo =
        await querySession.selectSessionPartitionInfoFromPackageId(
          db,
          sessionId,
          zclCustomXmlPackages[i].id
        )
      xmlPackageRemovalPromises.push(
        queryPackage.deleteSessionPackage(
          db,
          sessionPartitionInfo[0].sessionPartitionId,
          zclCustomXmlPackages[i].id
        )
      )
    }
    await Promise.all(xmlPackageRemovalPromises)

    allSessionPackages = await queryPackage.getSessionPackages(db, sessionId)

    // Generate again after removing a custom xml file
    genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        generateOnly: [
          'zap-type.h',
          'zap-command-ver-2.h',
          'zap-command-structs.h',
          'zap-id.h'
        ],
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
