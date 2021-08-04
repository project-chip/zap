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
import * as env from '../src-electron/util/env'
const dbApi = require('../src-electron/db/db-api.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')
const queryPackage = require('../src-electron/db/query-package.js')

let db
const testFile = path.join(__dirname, 'resource/test-meta.zap')
let sessionId
let templateContext
let zclContext

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('testmeta')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Meta test - template loading',
  async () => {
    templateContext = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.meta
    )
    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.templateData).not.toBeNull()
    expect(templateContext.templateData.name).toEqual('Meta test templates')
    expect(templateContext.templateData.version).toEqual('meta-test')
    expect(templateContext.packageId).not.toBeNull()
  },
  testUtil.timeout.medium()
)

test(
  'Meta test - zcl loading',
  async () => {
    zclContext = await zclLoader.loadZcl(db, testUtil.testZclMetafile)
  },
  testUtil.timeout.medium()
)

test(
  'Meta test - file import',
  async () => {
    let importResult = await importJs.importDataFromFile(db, testFile)
    sessionId = importResult.sessionId
    expect(sessionId).not.toBeNull()
    await queryPackage.insertSessionPackage(db, sessionId, zclContext.packageId)
  },
  testUtil.timeout.medium()
)

test(
  'Meta test - generation',
  async () => {
    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        disableDeprecationWarnings: true,
      }
    )

    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()

    let epc = genResult.content['test1.out']
    expect(epc).not.toBeNull()
  },
  testUtil.timeout.medium()
)
