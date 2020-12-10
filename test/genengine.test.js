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
const args = require('../src-electron/util/args.js')
const env = require('../src-electron/util/env.js')
const dbApi = require('../src-electron/db/db-api.js')
const queryPackage = require('../src-electron/db/query-package.js')
const querySession = require('../src-electron/db/query-session.js')
const utilJs = require('../src-electron/util/util.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const helperZap = require('../src-electron/generator/helper-zap.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')

var db
const templateCount = 13
const genTimeout = 8000
const testFile = path.join(__dirname, 'resource/generation-test-file-1.zap')

beforeAll(() => {
  var file = env.sqliteTestFile('genengine')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo('DB initialized.')
    })
}, 5000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})

var templateContext

test(
  'Basic gen template parsing and generation',
  () =>
    genEngine
      .loadTemplates(db, testUtil.testZigbeeGenerationTemplates)
      .then((context) => {
        expect(context.crc).not.toBeNull()
        expect(context.templateData).not.toBeNull()
        expect(context.templateData.name).toEqual('Test templates')
        expect(context.templateData.version).toEqual('test-v1')
        expect(context.templateData.templates.length).toEqual(templateCount)
        expect(context.packageId).not.toBeNull()
        templateContext = context
      }),
  3000
)

test('Validate package loading', () =>
  queryPackage
    .getPackageByParent(templateContext.db, templateContext.packageId)
    .then((packages) => {
      templateContext.packages = packages
      return templateContext
    })
    .then((context) => {
      expect(context.packages.length).toBe(templateCount + 2) // One for helper and one for overridable
    }))

test('Create session', () =>
  querySession.createBlankSession(db).then((sessionId) => {
    expect(sessionId).not.toBeNull()
    templateContext.sessionId = sessionId
  }))

test(
  'Load ZCL stuff',
  () => zclLoader.loadZcl(db, args.zclPropertiesFile),
  5000
)

test('Initialize session packages', () =>
  utilJs
    .initializeSessionPackage(templateContext.db, templateContext.sessionId)
    .then((sessionId) =>
      queryPackage.getSessionPackages(templateContext.db, sessionId)
    )
    .then((packages) => {
      expect(packages.length).toBe(2)
    }))

test(
  'Validate basic generation',
  () =>
    genEngine
      .generate(
        templateContext.db,
        templateContext.sessionId,
        templateContext.packageId
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()
        var simpleTest = genResult.content['simple-test.out']
        expect(simpleTest.startsWith('Test template file.')).toBeTruthy()
        expect(simpleTest.includes('Strange type: bacnet_type_t')).toBeTruthy()
      }),
  genTimeout
)

test(
  'Validate more complex generation',
  () =>
    genEngine
      .generate(
        templateContext.db,
        templateContext.sessionId,
        templateContext.packageId
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()
        var simpleTest = genResult.content['simple-test.out']
        expect(simpleTest.startsWith('Test template file.')).toBeTruthy()
        expect(simpleTest.includes(helperZap.zap_header())).toBeTruthy()
        expect(
          simpleTest.includes(`SessionId: ${genResult.sessionId}`)
        ).toBeTruthy()
        expect(
          simpleTest.includes('Addon: This is example of test addon helper')
        ).toBeTruthy()

        var zclId = genResult.content['zcl-test.out']
        //expect(zclId).toEqual('random placeholder')
        expect(
          zclId.includes(
            '// 206/207: label=>ZllStatus caption=>Enum of type ENUM8'
          )
        ).toBeTruthy()
        expect(zclId.includes('Label count: 207')).toBeTruthy()
        expect(
          zclId.includes(
            '// 128/207: label=>MeteringBlockEnumerations caption=>Enum of type ENUM8'
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

        var accumulator = genResult.content['accumulator.out']
        expect(accumulator.includes('Iteration: 19 out of 20')).toBeTruthy()
        expect(accumulator.includes('Cumulative size: 16 / 206')).toBeTruthy()
        expect(accumulator.includes('Cumulative size: 8 / 109')).toBeTruthy()
        expect(accumulator.includes('Cumulative size: 0 / 206')).toBeTruthy()

        var atomics = genResult.content['atomics.out']
        expect(atomics.includes('C type: bacnet_type_t')).toBeTruthy()
        // Now check for the override
        expect(
          atomics.includes('C type: security_key_type_override')
        ).toBeTruthy()

        var zapCommand = genResult.content['zap-command.h']
        expect(zapCommand).not.toBeNull()
        expect(
          zapCommand.includes(
            '#define emberAfFillCommandGlobalReadAttributesResponse(clusterId,'
          )
        ).toBeTruthy()

        var zapPrint = genResult.content['zap-print.h']
        expect(
          zapPrint.includes(
            '#define SILABS_PRINTCLUSTER_POWER_CONFIG_CLUSTER {ZCL_POWER_CONFIG_CLUSTER_ID, 0x0000, "Power Configuration" },'
          )
        ).toBeTruthy()

        var sdkExtension = genResult.content['sdk-extension.out']
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
      }),
  genTimeout
)

test(
  'Validate specific file generation',
  () =>
    genEngine
      .generate(
        templateContext.db,
        templateContext.sessionId,
        templateContext.packageId
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()

        var zapId = genResult.content['zap-id.h']
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

        var zapTypes = genResult.content['zap-type.h']
        expect(
          zapTypes.includes(
            'ZCL_INT16U_ATTRIBUTE_TYPE = 0x21, // Unsigned 16-bit integer'
          )
        ).toBeTruthy()
        expect(zapTypes.includes('uint32_t snapshotCause')).toBeTruthy()

        var zapCli = genResult.content['zap-cli.c']
        expect(zapCli.includes('#include <stdlib.h>')).toBeTruthy()

        var zapCommandParser = genResult.content['zap-command-parser.c']
        expect(zapCommandParser).not.toBeNull()
        expect(
          zapCommandParser.includes(
            'EmberAfStatus emberAfClusterSpecificCommandParse(EmberAfClusterCommand * cmd)'
          )
        ).toBeTruthy()
      }),
  genTimeout
)

test(
  'Test file import and generation',
  () =>
    importJs
      .importDataFromFile(db, testFile)
      .then((sessionId) =>
        genEngine.generate(db, sessionId, templateContext.packageId)
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()

        var zapCli = genResult.content['zap-cli.c']
        expect(zapCli.includes('#include <stdlib.h>')).toBeTruthy()
        //expect(zapCli.includes('void zclIdentifyIdCommand(sl_cli_command_arg_t *arguments);')).toBeTruthy()
        //expect(zapCli.includes('SL_CLI_COMMAND(zclIdentifyIdCommand,')).toBeTruthy()
        //expect(zapCli.includes('{ "id", &cli_cmd_zcl_identify_client_cluster_identify, false },')).toBeTruthy()
        //expect(zapCli.includes('SL_CLI_COMMAND_GROUP(zcl_identify_client_cluster_command_table, "ZCL identify client cluster commands");')).toBeTruthy()
        //expect(zapCli.includes('{ "identify", &cli_cmd_identify_client_group, false },')).toBeTruthy()
      }),
  genTimeout
)

test('Test content indexer - simple', () =>
  genEngine.contentIndexer('Short example').then((preview) => {
    expect(preview['1']).toBe('Short example\n')
  }))

test('Test content indexer - line by line', () =>
  genEngine
    .contentIndexer('Short example\nwith three\nlines of text', 1)
    .then((preview) => {
      expect(preview['1']).toBe('Short example\n')
      expect(preview['2']).toBe('with three\n')
      expect(preview['3']).toBe('lines of text\n')
    }))

test('Test content indexer - blocks', () => {
  var content = ''
  var i = 0
  for (i = 0; i < 1000; i++) {
    content = content.concat(`line ${i}\n`)
  }
  return genEngine.contentIndexer(content, 50).then((preview) => {
    expect(preview['1'].startsWith('line 0')).toBeTruthy()
    expect(preview['2'].startsWith('line 50')).toBeTruthy()
    expect(preview['3'].startsWith('line 100')).toBeTruthy()
    expect(preview['20'].startsWith('line 950')).toBeTruthy()
  })
})
