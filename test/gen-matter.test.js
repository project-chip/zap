/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
let templateContext

const testFile = path.join(__dirname, 'resource/chip/chip_test.zap')
const templateCount = testUtil.testTemplate.matterCount

beforeAll(async () => {
  let file = env.sqliteTestFile('gen-matter')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  return zclLoader.loadZcl(db, env.builtinMatterZclMetafile)
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation',
  () =>
    genEngine
      .loadTemplates(db, testUtil.testTemplate.matter)
      .then((context) => {
        expect(context.crc).not.toBeNull()
        expect(context.templateData).not.toBeNull()
        expect(context.templateData.name).toEqual('Matter test template')
        expect(context.templateData.version).toEqual('test-matter')
        expect(context.templateData.templates.length).toEqual(templateCount)
        expect(context.packageId).not.toBeNull()
        templateContext = context
      }),
  testUtil.timeout.medium()
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

test('Load a file', async () => {
  await importJs.importDataFromFile(db, testFile, {
    sessionId: templateContext.sessionId,
  })
})

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
        let simpleTest = genResult.content['chip_test.h']
        expect(
          simpleTest.includes(
            'Cluster Name : Groups+Command Name : RemoveAllGroups'
          )
        ).toBeTruthy()
      }),
  testUtil.timeout.long()
)
