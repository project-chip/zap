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
const queryPackage = require('../src-electron/db/query-package')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const querySession = require('../src-electron/db/query-session')

const templateCount = testUtil.testTemplate.zigbee2Count
const testFile = testUtil.zigbeeTestFile.fullTh

let db
let templateContext
let sessionId

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee9')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  return zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation',
  async () => {
    let context = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.zigbee2
    )
    expect(context.crc).not.toBeNull()
    expect(context.templateData).not.toBeNull()
    expect(context.templateData.name).toEqual('ZigbeePro 2023')
    expect(context.templateData.version).toEqual('zigbee-v23')
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
    expect(templateContext.packages.length).toBe(templateCount) // -1 for ignored one, one for helper and one for overridable
  },
  testUtil.timeout.short()
)

test(
  `Load the zap file: ${testFile}`,
  async () => {
    // Import a zap file which already has a custom xml file reference
    sessionId = await querySession.createBlankSession(db)
    let { sid, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile,
      { sessionId: sessionId }
    )
    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)
  },
  testUtil.timeout.long()
)

// We here generate each one separatelly in a separate test case.
test.each([
  'zap-cluster-command-parser.h',
  'zap-print.h',
  'zap-id.h',
  'zap-event.c',
  'zap-enabled-incoming-commands.h',
  'zap-event.h',
  'zap-config.h',
  'zap-type.h',
  'zap-tokens.h',
  'zap-cli.c',
  'zap-command.h',
  'zap-command-structs.h',
  'zap-cluster-command-parser.c'
])(
  'Generate %p',
  async (item) => {
    // Generate code using templates
    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        generateOnly: item,
        disableDeprecationWarnings: true
      }
    )

    expect(genResult.hasErrors).not.toBeTruthy()
  },
  testUtil.timeout.long()
)
