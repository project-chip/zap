/**
 *
 *    Copyright (c) 2023 Project CHIP Authors
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
const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const querySession = require('../src-electron/db/query-session')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')

let db
let templateContext
let zclPackageId

const testFile = testUtil.matterTestFile.apiMaturityTest
const templateCount = testUtil.testTemplate.matterApiMaturityCount

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('gen-matter-api-maturity')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  zclPackageId = ctx.packageId
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation',
  async () => {
    templateContext = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.matterApiMaturity
    )

    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.templateData).not.toBeNull()
    expect(templateContext.templateData.name).toEqual('CHIP Tests templates')
    expect(templateContext.templateData.version).toEqual(
      'matter-matter-api-maturity'
    )
    expect(templateContext.templateData.templates.length).toEqual(templateCount)
    expect(templateContext.packageId).not.toBeNull()
  },
  testUtil.timeout.medium()
)

test(
  `Zap file generation: ${path.relative(__dirname, testFile)}`,
  async () => {
    let sessionId = await querySession.createBlankSession(db)

    await importJs.importDataFromFile(db, testFile, {
      sessionId: sessionId,
    })

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )
    expect(genResult.hasErrors).toEqual(false)

    // Content-based test to validate what we find expected things
    let ept = genResult.content['codegen_test.txt']

    // general clusters without maturity tags
    expect(ept).toContain('client cluster Test1 = 43981 {')
    expect(ept).toContain('server cluster Test2 = 43982 {')

    // Expect that the maturity test cluster is tagged as internal
    expect(ept).toContain('client cluster ApiMaturityTest = 4386 (internal) {')
    expect(ept).toContain('server cluster ApiMaturityTest = 4386 (internal) {')

    // attribute tagging
    expect(ept).toContain('optional int8u attribute stableAttribute = 0;')
    expect(ept).toContain(
      'optional int8u attribute provisionalAttribute = 1 (provisional);'
    )
  },
  testUtil.timeout.long()
)
