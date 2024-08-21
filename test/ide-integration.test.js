/**
 *
 *    Copyright (c) 2023 Silicon Labs
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
const queryPackage = require('../src-electron/db/query-package')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const studioRestApi = require('../src-electron/ide-integration/studio-rest-api')
const zclComponents = require('../src-electron/ide-integration/zcl-components')
const queryZcl = require('../src-electron/db/query-zcl')

const testFile = path.join(__dirname, 'resource/test-meta.zap')
let db
let templateContext
let zclPackageId

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('ide-integration')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  let zclContext = await zclLoader.loadZcl(db, testUtil.testZclMetafile)
  zclPackageId = zclContext.packageId
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Load templates',
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
  'Validate package loading',
  async () => {
    templateContext.packages = await queryPackage.getPackageByParent(
      templateContext.db,
      templateContext.packageId
    )
    expect(templateContext.packages.length).toBeGreaterThan(0)
  },
  testUtil.timeout.short()
)

test(
  `Ide integration`,
  async () => {
    let { sessionId, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile
    )
    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)
    expect(sessionId).not.toBeNull()

    let x = await studioRestApi.integrationEnabled(db, sessionId)
    let y = await studioRestApi.isComponentTogglingDisabled(db, sessionId)
    expect(x).toBeFalsy()
    expect(y).toBeFalsy()

    let cluster = await queryZcl.selectClusterByCode(db, zclPackageId, 0xabcd)
    expect(cluster).not.toBeNull()
    let ids = await zclComponents.getComponentIdsByCluster(
      db,
      sessionId,
      cluster.id,
      ['server']
    )
    expect(ids.length).toBe(1)
    expect(ids[0]).toEqual('test-1-component')
  },
  testUtil.timeout.long()
)
