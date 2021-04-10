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
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')
const queryPackage = require('../src-electron/db/query-package.js')
const querySession = require('../src-electron/db/query-session.js')
const queryEndpoint = require('../src-electron/db/query-endpoint.js')
const utilJs = require('../src-electron/util/util.js')
const types = require('../src-electron/util/types.js')
const bin = require('../src-electron/util/bin.js')

let db
const testFile = path.join(__dirname, 'resource/tokens-test.zap')
// let sessionId
let templateContext

beforeAll(() => {
  let file = env.sqliteTestFile('tokens')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
    })
    .then(() => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile))
}, 5000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})

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
        expect(context.packageId).not.toBeNull()
        templateContext = context
      }),
  3000
)

test('Test file import', () =>
  importJs.importDataFromFile(db, testFile).then((importResult) => {
    templateContext.sessionId = importResult.sessionId
    expect(importResult.sessionId).not.toBeNull()
  }))

test('Initialize session packages', () =>
  utilJs
    .initializeSessionPackage(templateContext.db, templateContext.sessionId)
    .then((sessionId) =>
      queryPackage.getSessionPackages(
        templateContext.db,
        templateContext.sessionId
      )
    ))

test(
  'Test tokens header generation',
  () =>
    genEngine
      .generate(
        db,
        templateContext.sessionId,
        templateContext.packageId,
        {},
        { disableDeprecationWarnings: true }
      )
      .then((genResult) => {
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()

        let header = genResult.content['zap-tokens.h']

        // Singletons
        expect(
          header.includes('#define CREATOR_STACK_VERSION_SINGLETON')
        ).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_STACK_VERSION_SINGLETON (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()
        expect(header.includes('#define CREATOR_STACK_VERSION_1')).toBeFalsy()
        expect(
          header.includes(
            '#define NVM3KEY_STACK_VERSION_1 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeFalsy()

        expect(
          header.includes('#define CREATOR_HW_VERSION_SINGLETON')
        ).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_HW_VERSION_SINGLETON (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()
        expect(header.includes('#define CREATOR_HW_VERSION_1')).toBeFalsy()
        expect(
          header.includes('#define NVM3KEY_HW_VERSION_1 (NVM3KEY_DOMAIN_ZIGBEE')
        ).toBeFalsy()

        // Non-singletons

        expect(
          header.includes('#define CREATOR_APPLICATION_VERSION_1')
        ).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_APPLICATION_VERSION_1 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()
        expect(
          header.includes('#define CREATOR_APPLICATION_VERSION_7')
        ).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_APPLICATION_VERSION_7 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()
        expect(
          header.includes('#define CREATOR_APPLICATION_VERSION_SINGLETON')
        ).toBeFalsy()
        expect(
          header.includes(
            '#define NVM3KEY_APPLICATION_VERSION_SINGLETON (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeFalsy()

        expect(header.includes('#define CREATOR_PRODUCT_CODE_1')).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_PRODUCT_CODE_1 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()
        expect(header.includes('#define CREATOR_PRODUCT_CODE_2')).toBeFalsy()
        expect(
          header.includes(
            '#define NVM3KEY_PRODUCT_CODE_2 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeFalsy()
        expect(header.includes('#define CREATOR_PRODUCT_CODE_7')).toBeFalsy()
        expect(
          header.includes(
            '#define NVM3KEY_PRODUCT_CODE_7 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeFalsy()

        expect(
          header.includes('#define CREATOR_COLOR_CONTROL_COLOR_MODE_1')
        ).toBeFalsy()
        expect(
          header.includes(
            '#define NVM3KEY_COLOR_CONTROL_COLOR_MODE_1 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeFalsy()
        expect(
          header.includes('#define CREATOR_COLOR_CONTROL_COLOR_MODE_2')
        ).toBeFalsy()
        expect(
          header.includes(
            '#define NVM3KEY_COLOR_CONTROL_COLOR_MODE_2 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeFalsy()
        expect(
          header.includes('#define CREATOR_COLOR_CONTROL_COLOR_MODE_7')
        ).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_COLOR_CONTROL_COLOR_MODE_7 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()

        expect(
          header.includes('#define CREATOR_LEVEL_CONTROL_REMAINING_TIME_7')
        ).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_LEVEL_CONTROL_REMAINING_TIME_7 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()
        expect(
          header.includes('#define CREATOR_COLOR_CONTROL_REMAINING_TIME_7')
        ).toBeTruthy()
        expect(
          header.includes(
            '#define NVM3KEY_COLOR_CONTROL_REMAINING_TIME_7 (NVM3KEY_DOMAIN_ZIGBEE'
          )
        ).toBeTruthy()
        expect(header.includes('#define CREATOR_REMAINING_TIME_')).toBeFalsy()

        // Check token IDs
        expect(header.includes('(NVM3KEY_DOMAIN_ZIGBEE | 0xB000)')).toBeTruthy()
        expect(header.includes('(NVM3KEY_DOMAIN_ZIGBEE | 0xB008)')).toBeTruthy()
        expect(header.includes('(NVM3KEY_DOMAIN_ZIGBEE | 0xB009)')).toBeFalsy()

        // DEFINETYPES

        expect(
          header.includes('typedef uint8_t tokType_stack_version;')
        ).toBeTruthy()
        expect(
          header.includes('typedef uint8_t tokType_hw_version;')
        ).toBeTruthy()
        expect(
          header.includes('typedef uint8_t tokType_product_code[16];')
        ).toBeTruthy()
        expect(
          header.includes(
            'typedef uint16_t tokType_level_control_remaining_time;'
          )
        ).toBeTruthy()
        expect(
          header.includes('uint16_t tokType_color_control_remaining_time;')
        ).toBeTruthy()
        expect(
          header.includes('typedef uint8_t tokType_reporting_status_client;')
        ).toBeTruthy()

        // DEFINETOKENS

        expect(
          header.includes(
            'DEFINE_BASIC_TOKEN(STACK_VERSION_SINGLETON, tokType_stack_version, 12)'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'DEFINE_BASIC_TOKEN(HW_VERSION_SINGLETON, tokType_hw_version, 13)'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'DEFINE_BASIC_TOKEN(APPLICATION_VERSION_1, tokType_application_version, 11)'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'DEFINE_BASIC_TOKEN(APPLICATION_VERSION_7, tokType_application_version, 11)'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            "DEFINE_BASIC_TOKEN(PRODUCT_CODE_1, tokType_product_code, { 3, 'A', 'B', 'C', 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,  })"
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'DEFINE_BASIC_TOKEN(LEVEL_CONTROL_REMAINING_TIME_7, tokType_level_control_remaining_time, 10)'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'DEFINE_BASIC_TOKEN(COLOR_CONTROL_REMAINING_TIME_7, tokType_color_control_remaining_time, 0xA1B2)'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'DEFINE_BASIC_TOKEN(COLOR_CONTROL_COLOR_MODE_7, tokType_color_control_color_mode, 1)'
          )
        ).toBeTruthy()

        // GENERATED_TOKEN_LOADER

        expect(
          header.includes(
            'halCommonGetToken((tokType_stack_version *)ptr, TOKEN_STACK_VERSION_SINGLETON);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'emberAfWriteServerAttribute(1, ZCL_BASIC_CLUSTER_ID, ZCL_STACK_VERSION_ATTRIBUTE_ID, (uint8_t*)ptr, ZCL_INT8U_ATTRIBUTE_TYPE);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonGetToken((tokType_hw_version *)ptr, TOKEN_HW_VERSION_SINGLETON);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'emberAfWriteServerAttribute(1, ZCL_BASIC_CLUSTER_ID, ZCL_HW_VERSION_ATTRIBUTE_ID, (uint8_t*)ptr, ZCL_INT8U_ATTRIBUTE_TYPE);'
          )
        ).toBeTruthy()

        expect(
          header.includes(
            'halCommonGetToken((tokType_stack_version *)ptr, TOKEN_STACK_VERSION_1);'
          )
        ).toBeFalsy()
        expect(
          header.includes(
            'halCommonGetToken((tokType_hw_version *)ptr, TOKEN_HW_VERSION_1);'
          )
        ).toBeFalsy()

        expect(
          header.includes(
            'if(1 == (endpoint) || (EMBER_BROADCAST_ENDPOINT == (endpoint) && epNetwork == curNetwork))'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'if(2 == (endpoint) || (EMBER_BROADCAST_ENDPOINT == (endpoint) && epNetwork == curNetwork))'
          )
        ).toBeFalsy()
        expect(
          header.includes(
            'if(7 == (endpoint) || (EMBER_BROADCAST_ENDPOINT == (endpoint) && epNetwork == curNetwork))'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonGetToken((tokType_application_version *)ptr, TOKEN_APPLICATION_VERSION_1);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonGetToken((tokType_application_version *)ptr, TOKEN_APPLICATION_VERSION_7);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonGetToken((tokType_reporting_status_client *)ptr, TOKEN_REPORTING_STATUS_CLIENT_7);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'emberAfWriteServerAttribute(1, ZCL_BASIC_CLUSTER_ID, ZCL_APPLICATION_VERSION_ATTRIBUTE_ID, (uint8_t*)ptr, ZCL_INT8U_ATTRIBUTE_TYPE);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'emberAfWriteClientAttribute(1, ZCL_THERMOSTAT_CLUSTER_ID, ZCL_REPORTING_STATUS_CLIENT_ATTRIBUTE_ID, (uint8_t*)ptr, ZCL_ENUM8_ATTRIBUTE_TYPE);'
          )
        ).toBeTruthy()

        // GENERATED_TOKEN_SAVER

        expect(header.includes('if ( 0x0000 == clusterId )')).toBeTruthy()
        expect(header.includes('if ( 0x0001 == clusterId )')).toBeFalsy()
        expect(
          header.includes(
            'if ( 0x0002 == metadata->attributeId && 0x0000 == emberAfGetMfgCode(metadata) && !emberAfAttributeIsClient(metadata) ) {'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonSetToken(TOKEN_STACK_VERSION_SINGLETON, data); }'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'if ( 0x0003 == metadata->attributeId && 0x0000 == emberAfGetMfgCode(metadata) && !emberAfAttributeIsClient(metadata) )'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonSetToken(TOKEN_HW_VERSION_SINGLETON, data); }'
          )
        ).toBeTruthy()
        expect(header.includes('if ( 0x0201 == clusterId )')).toBeTruthy()
        expect(
          header.includes(
            'if ( 0xFFFE == metadata->attributeId && 0x0000 == emberAfGetMfgCode(metadata) && emberAfAttributeIsClient(metadata) )'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonSetToken(TOKEN_REPORTING_STATUS_CLIENT_7, data);'
          )
        ).toBeTruthy()

        expect(header.includes('if ( 1 == endpoint )')).toBeTruthy()
        expect(header.includes('if ( 2 == endpoint )')).toBeFalsy()
        expect(header.includes('if ( 7 == endpoint )')).toBeTruthy()
        expect(
          header.includes(
            'if ( 0x0001 == metadata->attributeId && 0x0000 == emberAfGetMfgCode(metadata) && !emberAfAttributeIsClient(metadata) )'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonSetToken(TOKEN_APPLICATION_VERSION_1, data);'
          )
        ).toBeTruthy()
        expect(
          header.includes(
            'halCommonSetToken(TOKEN_APPLICATION_VERSION_7, data);'
          )
        ).toBeTruthy()
      }),
  12000
)
