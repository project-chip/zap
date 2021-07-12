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
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')
const queryPackage = require('../src-electron/db/query-package.js')

let db
const testFile = path.join(__dirname, 'resource/three-endpoint-device.zap')
let sessionId
let templateContext
let zclContext

beforeAll(async () => {
  let file = env.sqliteTestFile('dotdotgen')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation',
  () =>
    genEngine
      .loadTemplates(db, testUtil.testTemplate.dotdot)
      .then((context) => {
        expect(context.crc).not.toBeNull()
        expect(context.templateData).not.toBeNull()
        expect(context.templateData.name).toEqual('Dotdot templates')
        expect(context.templateData.version).toEqual('test-dotdot-v1')
        expect(context.templateData.templates.length).toEqual(
          testUtil.testTemplate.dotdotCount
        )
        expect(context.packageId).not.toBeNull()
        templateContext = context
      }),
  testUtil.timeout.medium()
)

test(
  'Load DotDot ZCL stuff',
  () =>
    zclLoader.loadZcl(db, env.builtinDotdotZclMetafile).then((context) => {
      zclContext = context
    }),
  testUtil.timeout.medium()
)

test(
  'File import and zcl package insertion',
  async () => {
    let importResult = await importJs.importDataFromFile(db, testFile)
    sessionId = importResult.sessionId
    expect(sessionId).not.toBeNull()
    await queryPackage.insertSessionPackage(db, sessionId, zclContext.packageId)
  },
  testUtil.timeout.medium()
)

test(
  'Test dotdot generation',
  () =>
    genEngine
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
        expect(genResult).not.toBeNull()
        expect(genResult.partial).toBeFalsy()
        expect(genResult.content).not.toBeNull()

        let epc = genResult.content['test1.h']
        expect(epc).not.toBeNull()
        expect(
          epc.includes(
            'EmberAfDrlkOperMode OperatingModeDuringHoliday // command type'
          )
        ).toBeTruthy()
        expect(
          epc.includes('EmberAfDrlkOperMode OperatingMode; // attribute type')
        ).toBeTruthy()

        mqtt = genResult.content['mqtt.cpp']
        expect(mqtt).not.toBeNull()
        expect(mqtt.includes('Bitmap_DaysMask = "DrlkDaysMask"')).toBeTruthy()
        expect(mqtt.includes('Bitmap_RelayStatus = "map8"')).toBeTruthy()
        expect(mqtt.includes('Enum_StatusCode = "zclStatus"')).toBeTruthy()
        expect(mqtt.includes('Enum_AlarmCode = "enum8"')).toBeTruthy()

        types = genResult.content['dotdot-type.h']
        expect(types).not.toBeNull()
        expect(
          types.includes('// Bitmap: LevelOptions, type: map8')
        ).toBeTruthy()
      }),
  testUtil.timeout.long()
)
