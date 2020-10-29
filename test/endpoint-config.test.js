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

var db
const templateCount = 12
const genTimeout = 3000
const testFile = path.join(__dirname, 'resource/three-endpoint-device.zap')

beforeAll(() => {
  var file = env.sqliteTestFile('endpointconfig')
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

test(
  'Load ZCL stuff',
  () => zclLoader.loadZcl(db, args.zclPropertiesFile),
  5000
)

test(
  'Test file import and endpoint config generation',
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

        var epc = genResult.content['zap-config.h']
        expect(
          epc.includes(
            '#define FIXED_ENDPOINT_ARRAY { 0x0029, 0x002A, 0x002B }'
          )
        ).toBeTruthy()
        expect(epc.includes('#define FIXED_NETWORKS { 1, 1, 2 }')).toBeTruthy()
        expect(
          epc.includes('#define FIXED_PROFILE_IDS { 0x0107, 0x0104, 0x0104 }')
        ).toBeTruthy()
        expect(
          epc.includes('#define FIXED_ENDPOINT_TYPES { 0, 1, 2 }')
        ).toBeTruthy()
      }),
  genTimeout
)
