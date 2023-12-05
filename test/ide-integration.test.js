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
const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const queryPackage = require('../src-electron/db/query-package')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const studioRestApi = require('../src-electron/ide-integration/studio-rest-api')
const zclComponents = require('../src-electron/ide-integration/zcl-components')

let db
const templateCount = testUtil.testTemplate.zigbeeCount
const testFile = testUtil.zigbeeTestFile.threeEp

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('ide-integration')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  return zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

let templateContext

test(
  'Load templates',
  async () => {
    let context = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.zigbee
    )
    expect(context.crc).not.toBeNull()
    expect(context.templateData).not.toBeNull()
    expect(context.templateData.name).toEqual('Test templates')
    expect(context.templateData.version).toEqual('test-v1')
    expect(context.templateData.templates.length).toEqual(templateCount)
    expect(context.packageId).not.toBeNull()
    templateContext = context
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
    expect(templateContext.packages.length).toBe(templateCount - 1 + 2) // -1 for ignored one, one for helper and one for overridable
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

    let res = await zclComponents.getComponentIdsByCluster(
      db,
      sessionId,
      1,
      'client'
    )
    expect(res.componentIds.length).toBe(0)
  },
  testUtil.timeout.long()
)
