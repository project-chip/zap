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
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const queryPackage = require('../src-electron/db/query-package')
const querySession = require('../src-electron/db/query-session')

let db
const testFile = testUtil.matterTestFile.allClusters
let sessionId
let templateContext
let zclContext

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('parent-endpoint')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion(),
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation',
  async () => {
    templateContext = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.matter,
    )
    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.packageId).not.toBeNull()
  },
  testUtil.timeout.medium(),
)
test(
  'Load ZCL stuff',
  async () => {
    zclContext = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
  },
  testUtil.timeout.medium(),
)
test(
  'Test file import',
  async () => {
    let importResult = await importJs.importDataFromFile(db, testFile)
    sessionId = importResult.sessionId
    expect(sessionId).not.toBeNull()
    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sessionId,
        zclContext.packageId,
      )
    await queryPackage.insertSessionPackage(
      db,
      sessionPartitionInfo[0].sessionPartitionId,
      zclContext.packageId,
    )
  },
  testUtil.timeout.medium(),
)
test(
  'Test endpoint config queries',
  async () => {
    let epts = await queryEndpoint.selectAllEndpoints(db, sessionId)
    expect(epts.length).toBe(4)
    expect(epts[1].parentEndpointIdentifier).toBe(0)
    expect(epts[2].parentEndpointIdentifier).toBe(1)
  },
  testUtil.timeout.long(),
)
