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

const path = require('path')
const genEngine = require('../src-electron/generator/generation-engine.js')
const env = require('../src-electron/util/env.js')
const dbApi = require('../src-electron/db/db-api.js')
const queryPackage = require('../src-electron/db/query-package.js')
const querySession = require('../src-electron/db/query-session.js')
const utilJs = require('../src-electron/util/util.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const helperZap = require('../src-electron/generator/helper-zap.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')

let db
const templateCount = testUtil.testTemplate.zigbeeCount
const testFile = path.join(__dirname, 'resource/generation-test-file-1.zap')
const testFile2 = path.join(__dirname, 'resource/three-endpoint-device.zap')
const testFile3 = path.join(__dirname, 'resource/zll-on-off-switch-test.zap')

beforeAll(async () => {
  let file = env.sqliteTestFile('genengine')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  return zclLoader.loadZcl(db, env.builtinSilabsZclMetafile)
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

let templateContext

test(
  'Basic gen template parsing and generation',
  () =>
    genEngine
      .loadTemplates(db, testUtil.testTemplate.zigbee)
      .then((context) => {
        expect(context.crc).not.toBeNull()
        expect(context.templateData).not.toBeNull()
        expect(context.templateData.name).toEqual('Test templates')
        expect(context.templateData.version).toEqual('test-v1')
        expect(context.templateData.templates.length).toEqual(templateCount)
        expect(context.packageId).not.toBeNull()
        templateContext = context
      }),
  testUtil.timeout.medium()
)

test(
  'Validate package loading',
  async () => {
    templateContext.packages = await queryPackage.getPackageByParent(
      templateContext.db,
      templateContext.packageId
    )
    expect(templateContext.packages.length).toBe(templateCount - 1 + 2) // -1 for ignored one, one for helper and one for overridable
  },
  testUtil.timeout.short()
)

test(
  'Create session',
  () =>
    querySession.createBlankSession(db).then((sessionId) => {
      expect(sessionId).not.toBeNull()
      templateContext.sessionId = sessionId
    }),
  testUtil.timeout.short()
)

test(
  'Initialize session packages',
  async () => {
    let packages = await utilJs.initializeSessionPackage(
      templateContext.db,
      templateContext.sessionId,
      {
        zcl: env.builtinSilabsZclMetafile,
        template: env.builtinTemplateMetafile,
      }
    )

    expect(packages.length).toBe(2)
  },
  testUtil.timeout.short()
)

test(
  'Validate basic generation',
  () =>
    genEngine
      .generate(
        templateContext.db,
        templateContext.sessionId,
        templateContext.packageId,
        {},
        { disableDeprecationWarnings: true }
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()
        let simpleTest = genResult.content['simple-test.out']
        expect(simpleTest.startsWith('Test template file.')).toBeTruthy()
        expect(simpleTest.includes('Strange type: bacnet_type_t')).toBeTruthy()
      }),
  testUtil.timeout.long()
)

test(
  'Validate more complex generation',
  () =>
    genEngine
      .generate(
        templateContext.db,
        templateContext.sessionId,
        templateContext.packageId,
        {},
        { disableDeprecationWarnings: true }
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()
        let simpleTest = genResult.content['simple-test.out']
        expect(simpleTest.startsWith('Test template file.')).toBeTruthy()
        expect(simpleTest.includes(helperZap.zap_header())).toBeTruthy()
        expect(
          simpleTest.includes(`SessionId: ${genResult.sessionId}`)
        ).toBeTruthy()
        expect(
          simpleTest.includes('Addon: This is example of test addon helper')
        ).toBeTruthy()

        let zclId = genResult.content['zcl-test.out']
        //expect(zclId).toEqual('random placeholder')
        expect(
          zclId.includes(
            `// ${testUtil.totalEnumCount - 1}/${
              testUtil.totalEnumCount
            }: label=>ZllStatus caption=>Enum of type ENUM8`
          )
        ).toBeTruthy()
        expect(
          zclId.includes(`Label count: ${testUtil.totalEnumCount}`)
        ).toBeTruthy()
        expect(
          zclId.includes(
            `// 129/${testUtil.totalEnumCount}: label=>MeteringBlockEnumerations caption=>Enum of type ENUM8`
          )
        ).toBeTruthy()
        expect(
          zclId.includes('// struct: ReadReportingConfigurationAttributeRecord')
        ).toBeTruthy()
        expect(zclId.includes('cluster: 0x0700 Price')).toBeTruthy()
        expect(zclId.includes('cmd: 0x0A GetUserStatusResponse')).toBeTruthy()
        expect(
          zclId.includes('att: 0x0002 gps communication mode')
        ).toBeTruthy()
        expect(
          zclId.includes('First item\n// struct: BlockThreshold')
        ).toBeTruthy()
        expect(
          zclId.includes('// struct: WwahClusterStatusToUseTC\nLast item')
        ).toBeTruthy()
        expect(zclId.includes('// event: 0x0001 HelloEvent')).toBeTruthy()
        expect(zclId.includes('-> field: 0x0002 arg2 INT32U')).toBeTruthy()

        let accumulator = genResult.content['accumulator.out']
        expect(accumulator.includes('Iteration: 19 out of 20')).toBeTruthy()
        expect(accumulator.includes('Cumulative size: 16 / 206')).toBeTruthy()
        expect(accumulator.includes('Cumulative size: 8 / 109')).toBeTruthy()
        expect(accumulator.includes('Cumulative size: 0 / 206')).toBeTruthy()

        let atomics = genResult.content['atomics.out']
        expect(atomics.includes('C type: bacnet_type_t')).toBeTruthy()
        // Now check for the override
        expect(
          atomics.includes('C type: security_key_type_override')
        ).toBeTruthy()

        let zapCommand = genResult.content['zap-command.h']
        expect(zapCommand).not.toBeNull()
        expect(
          zapCommand.includes(
            '#define emberAfFillCommandGlobalReadAttributesResponse(clusterId,'
          )
        ).toBeTruthy()

        let zapPrint = genResult.content['zap-print.h']
        expect(
          zapPrint.includes(
            '#define SILABS_PRINTCLUSTER_POWER_CONFIG_CLUSTER {ZCL_POWER_CONFIG_CLUSTER_ID, 0x0000, "Power Configuration" },'
          )
        ).toBeTruthy()

        let sdkExtension = genResult.content['sdk-extension.out']
        expect(
          sdkExtension.includes(
            "// cluster: 0x0000 Basic, text extension: 'Extension to basic cluster'"
          )
        ).toBeTruthy()
        expect(
          sdkExtension.includes(
            "// cluster: 0x0002 Device Temperature Configuration, text extension: 'Extension to temperature config cluster'"
          )
        ).toBeTruthy()
        expect(
          sdkExtension.includes(
            "// server cluster: 0x0001 Power Configuration, text extension: 'Extension to power cluster'"
          )
        ).toBeTruthy()
        expect(
          sdkExtension.includes(
            "// client cluster: 0x0001 Power Configuration, text extension: ''"
          )
        ).toBeTruthy()
        expect(
          sdkExtension.includes(
            "// attribute: 0x0000 / 0x0000 => ZCL version, extensions: '42', '99'"
          )
        ).toBeTruthy()
        expect(
          sdkExtension.includes(
            "// cluster: 0x0003 Identify, text extension: ''"
          )
        ).toBeTruthy()
        expect(
          sdkExtension.includes(
            "// command: 0x0000 / 0x00 => ResetToFactoryDefaults, test extension: '1'"
          )
        ).toBeTruthy()

        expect(
          sdkExtension.includes(
            "// device type: HA / 0x0006 => HA-remote // extension: 'path/to/remote.c'"
          )
        ).toBeTruthy()

        expect(
          sdkExtension.includes(
            'IMPLEMENTED_COMMANDS>ResetToFactoryDefaults,IdentifyQueryResponse,IdentifyQuery,EZModeInvoke,UpdateCommissionState,<END'
          )
        ).toBeTruthy()

        // Testing {{#if_is_struct}} helper
        expect(zclId.includes(`attributeIds is not struct`)).toBeTruthy()

        // Testing {{#zcl_struct_items_by_struct_name}} helper
        expect(
          zclId.includes(`configureReportingRecords::direction struct item`)
        ).toBeTruthy()

        expect(
          zclId.includes(`readAttributeStatusRecords is struct`)
        ).toBeTruthy()
      }),
  testUtil.timeout.long()
)

test(
  'Validate test file 1 generation',
  () =>
    genEngine
      .generate(
        templateContext.db,
        templateContext.sessionId,
        templateContext.packageId,
        {},
        { disableDeprecationWarnings: true }
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()

        let zapId = genResult.content['zap-id.h']
        //expect(zapId).toEqual('random placeholder')

        expect(zapId.includes('// Definitions for cluster: Basic')).toBeTruthy()
        expect(
          zapId.includes('#define ZCL_GET_PROFILE_RESPONSE_COMMAND_ID (0x00)')
        ).toBeTruthy()
        expect(
          zapId.includes(
            '// Client attributes for cluster: Fluoride Concentration Measurement'
          )
        ).toBeTruthy()
        expect(
          zapId.includes('#define ZCL_NUMBER_OF_RESETS_ATTRIBUTE_ID (0x0000)')
        ).toBeTruthy()

        let zapTypes = genResult.content['zap-type.h']
        expect(
          zapTypes.includes(
            'ZCL_INT16U_ATTRIBUTE_TYPE = 0x21, // Unsigned 16-bit integer'
          )
        ).toBeTruthy()
        expect(zapTypes.includes('uint32_t snapshotCause')).toBeTruthy()
        expect(zapTypes.includes('typedef uint8_t EphemeralData;')).toBeTruthy()

        let zapCli = genResult.content['zap-cli.c']
        expect(zapCli.includes('#include <stdlib.h>')).toBeTruthy()

        let zapCommandParser = genResult.content['zap-command-parser.c']
        expect(zapCommandParser).not.toBeNull()
        expect(
          zapCommandParser.includes(
            'EmberAfStatus emberAfClusterSpecificCommandParse(EmberAfClusterCommand * cmd)'
          )
        ).toBeTruthy()
      }),
  testUtil.timeout.long()
)

test(
  'Test file 1 generation',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, testFile, { sessionId: sid })

    return genEngine
      .generate(
        db,
        sid,
        templateContext.packageId,
        {},
        {
          disableDeprecationWarnings: true,
        }
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()

        let zapCli = genResult.content['zap-cli.c']
        expect(zapCli.includes('#include <stdlib.h>')).toBeTruthy()
        //expect(zapCli.includes('void sli_zigbee_cli_zcl_identify_id_command(sl_cli_command_arg_t *arguments);')).toBeTruthy()
        //expect(zapCli.includes('SL_CLI_COMMAND(sli_zigbee_cli_zcl_identify_id_command,')).toBeTruthy()
        //expect(zapCli.includes('{ "id", &cli_cmd_zcl_identify_cluster_identify, false },')).toBeTruthy()
        //expect(zapCli.includes('SL_CLI_COMMAND_GROUP(zcl_identify_cluster_command_table, "ZCL identify cluster commands");')).toBeTruthy()
        expect(
          zapCli.includes('{ "identify", &cli_cmd_identify_group, false },')
        ).toBeTruthy()
        // Test GENERATED_DEFAULTS
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,  /* 0,DEFAULT value for cluster: Over the Air Bootloading, attribute: OTA Upgrade Server ID, side: client*/'
          )
        ).toBeTruthy()
        // Test GENERATED_ATTRIBUTE_COUNT
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define GENERATED_ATTRIBUTE_COUNT 81'
          )
        ).toBeTruthy()
        // Test GENERATED_ATTRIBUTES
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '{ 0x000F, ZCL_BITMAP8_ATTRIBUTE_TYPE, 1, (ATTRIBUTE_MASK_WRITABLE), { (uint8_t*)0x00  } }, /* 16 Cluster: Color Control, Attribute: color control options, Side: server*/'
          )
        ).toBeTruthy()
        // Test is_number_greater_than within GENERATED_ATTRIBUTES
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '{ 0x0000, ZCL_IEEE_ADDRESS_ATTRIBUTE_TYPE, 8, (ATTRIBUTE_MASK_CLIENT), { (uint8_t*)&(generatedDefaults[0]) } }, /* 70 Cluster: Over the Air Bootloading, Attribute: OTA Upgrade Server ID, Side: client*/'
          )
        ).toBeTruthy()
        // Test GENERATED_CLUSTER_COUNT
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define GENERATED_CLUSTER_COUNT 18'
          )
        ).toBeTruthy()
        // Test GENERATED_CLUSTERS
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '0x0019, (EmberAfAttributeMetadata*)&(generatedAttributes[70]), 4, 15, CLUSTER_MASK_CLIENT, NULL }, /* 15, Endpoint Id: 2, Cluster: Over the Air Bootloading, Side: client*/'
          )
        ).toBeTruthy()
        // Test GENERATED_ENDPOINT_TYPE_COUNT
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define GENERATED_ENDPOINT_TYPE_COUNT (2)'
          )
        ).toBeTruthy()
        // Test GENERATED_ENDPOINT_TYPES
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '{ ((EmberAfCluster*)&(generatedClusters[0])), 9, 241 },'
          )
        ).toBeTruthy()
        // Test ATTRIBUTE_LARGEST
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define ATTRIBUTE_LARGEST (65)'
          )
        ).toBeTruthy()
        // Test ATTRIBUTE_SINGLETONS_SIZE
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define ATTRIBUTE_SINGLETONS_SIZE (191)'
          )
        ).toBeTruthy()
        // Test ATTRIBUTE_MAX_SIZE
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define ATTRIBUTE_MAX_SIZE (546)'
          )
        ).toBeTruthy()
        // Test FIXED_ENDPOINT_COUNT
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define FIXED_ENDPOINT_COUNT (2)'
          )
        ).toBeTruthy()
        // Test EMBER_AF_GENERATED_COMMAND_COUNT
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '#define EMBER_AF_GENERATED_COMMAND_COUNT  (88)'
          )
        ).toBeTruthy()
        // Test GENERATED_COMMANDS
        expect(
          genResult.content['zap-config-version-2.h'].includes(
            '{ 0x0004, 0x01, COMMAND_MASK_OUTGOING_SERVER }, /* 28, Cluster: Groups, Command: ViewGroupResponse*/'
          )
        ).toBeTruthy()
      })
  },
  testUtil.timeout.long()
)

test(
  'Testing zap command parser generation',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, testFile3, { sessionId: sid })

    return genEngine
      .generate(
        db,
        sid,
        templateContext.packageId,
        {},
        {
          disableDeprecationWarnings: true,
        }
      )
      .then((genResult) => {
        // Test Cluster command parsers that should be defined
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfGroupsClusterClientCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfGroupsClusterServerCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfIdentifyClusterClientCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfIdentifyClusterServerCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfLevelControlClusterServerCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfOnOffClusterServerCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfScenesClusterServerCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'EmberAfStatus emberAfZllCommissioningClusterClientCommandParse(EmberAfClusterCommand * cmd);'
          )
        ).toBeTruthy()

        // Test Command callback
        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'wasHandled = emberAfIdentifyClusterIdentifyCallback(identifyTime);'
          )
        ).toBeTruthy()

        expect(
          genResult.content['zap-command-parser-ver-3.c'].includes(
            'wasHandled = emberAfLevelControlClusterMoveToLevelWithOnOffCallback(level, transitionTime);'
          )
        ).toBeTruthy()
      })
  },
  testUtil.timeout.long()
)

test(
  'Test file 2 generation',
  async () => {
    let { sessionId, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile2
    )

    await utilJs.initializeSessionPackage(db, sessionId, {
      zcl: env.builtinSilabsZclMetafile,
      template: env.builtinTemplateMetafile,
    })

    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)
    return genEngine
      .generate(
        db,
        sessionId,
        templateContext.packageId,
        {},
        {
          disableDeprecationWarnings: true,
        }
      )
      .then((genResult) => {
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
      })
  },
  testUtil.timeout.long()
)

test.skip(
  'Test file import and command parser generation, version 2',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, testFile, { sessionId: sid })

    return genEngine
      .generate(db, sid, templateContext.packageId)
      .then((genResult) => {
        if (genResult.hasErrors) {
          // Ok, there is the error with this file.
        } else {
          expect(genResult).not.toBeNull()
          expect(genResult.partial).toBeFalsy()
          expect(genResult.content).not.toBeNull()
          let zapCommandParser = genResult.content['zap-command-parser-2.c']
          expect(
            zapCommandParser.includes('#include "zap-command-parser.h"')
          ).toBeTruthy()
          expect(
            zapCommandParser.includes(
              'EmberAfStatus emberAfIdentifyClusterServerCommandParse(EmberAfClusterCommand * cmd);'
            )
          ).toBeTruthy()
          expect(
            zapCommandParser.includes('case ZCL_IDENTIFY_CLUSTER_ID:')
          ).toBeTruthy()
          expect(
            zapCommandParser.includes(
              'wasHandled = emberAfIdentifyClusterIdentifyCallback(identifyTime);'
            )
          ).toBeTruthy()
        }
      })
  },
  testUtil.timeout.long()
)

test(
  'Test content indexer - simple',
  async () => {
    let preview = await genEngine.contentIndexer('Short example')
    expect(preview['1']).toBe('Short example\n')
  },
  testUtil.timeout.short()
)

test(
  'Test content indexer - line by line',
  async () => {
    let preview = await genEngine.contentIndexer(
      'Short example\nwith three\nlines of text',
      1
    )
    expect(preview['1']).toBe('Short example\n')
    expect(preview['2']).toBe('with three\n')
    expect(preview['3']).toBe('lines of text\n')
  },
  testUtil.timeout.short()
)

test(
  'Test content indexer - blocks',
  async () => {
    let content = ''
    let i = 0
    for (i = 0; i < 1000; i++) {
      content = content.concat(`line ${i}\n`)
    }
    let preview = await genEngine.contentIndexer(content, 50)
    expect(preview['1'].startsWith('line 0')).toBeTruthy()
    expect(preview['2'].startsWith('line 50')).toBeTruthy()
    expect(preview['3'].startsWith('line 100')).toBeTruthy()
    expect(preview['20'].startsWith('line 950')).toBeTruthy()
  },
  testUtil.timeout.short()
)
