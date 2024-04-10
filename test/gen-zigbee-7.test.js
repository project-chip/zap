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

let db
const templateCount = testUtil.testTemplate.zigbeeCount
const testFile = testUtil.zigbeeTestFile.mfgClusters

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('genzigbee7')
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
  'Basic gen template parsing and generation',
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
    expect(templateContext.packages.length).toBe(templateCount - 1 + 3) // -1 for ignored one, two for helpers and one for overridable
  },
  testUtil.timeout.short()
)

test(
  'Testing zap command parser generation for manufacturing specific clusters',
  async () => {
    let { sessionId, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile
    )
    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)

    // Load a custom xml file
    let result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testCustomXml2,
      sessionId
    )
    if (!result.succeeded) {
      console.log(result)
    }
    expect(result.succeeded).toBeTruthy()

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      {
        generateOnly: 'zap-command-parser-ver-4.c',
        disableDeprecationWarnings: true,
      }
    )

    let pv4 = genResult.content['zap-command-parser-ver-4.c']
    // Test Cluster command parsers for manufacturing specific clusters
    expect(pv4).toContain('case 0xFC57: //Manufacturing Specific cluster')
    expect(pv4).toContain('case 0x1217: // Cluster: SL Works With All Hubs')
    expect(pv4).toContain(
      'result = emberAfSlWorksWithAllHubsClusterClientCommandParse(cmd);'
    )
    expect(pv4).toContain('case 0xFC02: //Manufacturing Specific cluster')
    expect(pv4).toContain('case 0x1002: // Cluster: MFGLIB Cluster')
    expect(pv4).toContain(
      'result = emberAfMfglibClusterClusterServerCommandParse(cmd);'
    )
  },
  testUtil.timeout.long()
)
