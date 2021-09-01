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
const env = require('../src-electron/util/env.ts')
const dbApi = require('../src-electron/db/db-api.js')
const queryPackage = require('../src-electron/db/query-package.js')
const queryAttribute = require('../src-electron/db/query-attribute.js')
const querySession = require('../src-electron/db/query-session.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const utilJs = require('../src-electron/util/util.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const helperZap = require('../src-electron/generator/helper-zap.js')
const importJs = require('../src-electron/importexport/import.js')
const testUtil = require('./test-util.js')
const testQuery = require('./test-query.js')

let db
let templateContext
let zclPackageId

const testFile = path.join(__dirname, 'resource/matter-test.zap')
const templateCount = testUtil.testTemplate.matterCount

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('gen-matter')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  zclPackageId = ctx.packageId
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test('Validate loading', async () => {
  let c = await testQuery.selectCountFrom(db, 'TAG')
  expect(c).toBe(6)
  c = await testQuery.selectCountFrom(db, 'GLOBAL_ATTRIBUTE_BIT')
  expect(c).toBe(12) // 6 feature bits per each client/server of 1 cluster

  let attr = await queryAttribute.selectAttributeByCode(
    db,
    zclPackageId,
    null,
    0xfffc,
    null
  )
  expect(attr).not.toBe(null)

  let cluster = await queryZcl.selectClusterByCode(
    db,
    zclPackageId,
    0x9999,
    null
  )
  expect(cluster).not.toBe(null)

  let defs = await queryAttribute.selectGlobalAttributeDefaults(
    db,
    cluster.id,
    attr.id
  )
  expect(defs).not.toBeNull()
  expect(defs.defaultValue).toBe('0x0055')
  expect(defs.featureBits.length).toBe(6)
  expect(defs.featureBits[0].bit).toBe(0)
  expect(defs.featureBits[1].bit).toBe(1)
  expect(defs.featureBits[2].bit).toBe(2)
  expect(defs.featureBits[3].bit).toBe(3)
  expect(defs.featureBits[4].bit).toBe(4)
  expect(defs.featureBits[5].bit).toBe(6)
})

test(
  'Basic gen template parsing and generation',
  async () => {
    templateContext = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.matter
    )

    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.templateData).not.toBeNull()
    expect(templateContext.templateData.name).toEqual('Matter test template')
    expect(templateContext.templateData.version).toEqual('test-matter')
    expect(templateContext.templateData.templates.length).toEqual(templateCount)
    expect(templateContext.packageId).not.toBeNull()
  },
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

test(
  'Initialize session packages',
  async () => {
    let packages = await utilJs.initializeSessionPackage(
      templateContext.db,
      templateContext.sessionId,
      {
        zcl: env.builtinMatterZclMetafile(),
        template: testUtil.testTemplate.matter,
      }
    )

    expect(packages.length).toBe(2)
  },
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
        let sdkExt = genResult.content['sdk-ext.txt']
        expect(sdkExt).not.toBeNull()
        expect(
          sdkExt.includes(
            "// event: 0x9999 / 0x0001 => HelloEvent, extensions: 'defHello'"
          )
        ).toBeTruthy()

        let simpleTest = genResult.content['simple-test.h']
        expect(simpleTest).toContain(
          'Cluster Name : Groups+Command Name : RemoveAllGroups'
        )

        let featureMap = genResult.content['feature-map.h']
        expect(featureMap).not.toBeNull()
        expect(featureMap).toContain(
          `Cluster: Network Provisioning
- default value: 0x0055
- feature bits for the feature map attribute:
    0: Bit 0 is assigned to tag F0 => value = 1
    1: Bit 1 is assigned to tag C0 => value = 0
    2: Bit 2 is assigned to tag F1 => value = 0
    3: Bit 3 is assigned to tag C1 => value = 0
    4: Bit 4 is assigned to tag F2 => value = 1
    5: Bit 6 is assigned to tag F3 => value = 0`
        )
      }),
  testUtil.timeout.long()
)
