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
const querySession = require('../src-electron/db/query-session.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')
const queryEndpoint = require('../src-electron/db/query-endpoint.js')
const queryEndpointType = require('../src-electron/db/query-endpoint-type.js')
const queryConfig = require('../src-electron/db/query-config.js')
const queryDeviceType = require('../src-electron/db/query-device-type.js')
const util = require('../src-electron/util/util.js')

let db
let templateContext
let zclPackageId

const testFile = testUtil.matterTestFile.allClusters
const testFile2 = testUtil.matterTestFile.allClustersFileFormat2
const multipleDeviceTypePerEndpointTestFile =
  testUtil.matterTestFile.multipleDeviceTypesPerEndpoint
const templateCount = testUtil.testTemplate.matter4Count

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('gen-matter-5')
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
      testUtil.testTemplate.matter4
    )

    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.templateData).not.toBeNull()
    expect(templateContext.templateData.name).toEqual('Matter 4 test templates')
    expect(templateContext.templateData.version).toEqual('matter-4')
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

    let content = genResult.content['cluster-objects.out']
    expect(content.length).toBeGreaterThan(2000)
  },
  testUtil.timeout.long()
)
