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

const genEngine = require('../src-electron/generator/generation-engine.js')
const args = require('../src-electron/main-process/args.js')
const env = require('../src-electron/util/env.js')
const dbApi = require('../src-electron/db/db-api.js')
const fs = require('fs')
const queryPackage = require('../src-electron/db/query-package.js')
const querySession = require('../src-electron/db/query-session.js')
const utilJs = require('../src-electron/util/util.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const dbEnum = require('../src-electron/db/db-enum.js')
const helperZap = require('../src-electron/generator/helper-zap.js')

var db
const templateCount = 3

beforeAll(() => {
  var file = env.sqliteTestFile('genengine')
  return dbApi
    .initDatabase(file)
    .then((d) => dbApi.loadSchema(d, env.schemaFile(), env.zapVersion()))
    .then((d) => {
      db = d
      env.logInfo('DB initialized.')
    })
}, 5000)

afterAll(() => {
  var file = env.sqliteTestFile('genengine')
  return dbApi.closeDatabase(db).then(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
})

var templateContext

test('Basic gen template parsing and generation', () =>
  genEngine.loadTemplates(db, args.genTemplateJsonFile).then((context) => {
    expect(context.crc).not.toBeNull()
    expect(context.templateData).not.toBeNull()
    expect(context.templateData.name).toEqual('Test templates')
    expect(context.templateData.version).toEqual('test-v1')
    expect(context.templateData.templates.length).toEqual(templateCount)
    expect(context.packageId).not.toBeNull()
    templateContext = context
  }))

test('Validate package loading', () =>
  queryPackage
    .getPackageByParent(templateContext.db, templateContext.packageId)
    .then((packages) => {
      templateContext.packages = packages
      return templateContext
    })
    .then((context) => {
      expect(context.packages.length).toBe(templateCount)
    }))

test('Create session', () =>
  querySession.createBlankSession(db).then((sessionId) => {
    expect(sessionId).not.toBeNull()
    templateContext.sessionId = sessionId
  }))

test(
  'Load ZCL stuff',
  () => zclLoader.loadZcl(db, args.zclPropertiesFile),
  5000
)

test('Initialize session packages', () =>
  utilJs
    .initializeSessionPackage(templateContext.db, templateContext.sessionId)
    .then((sessionId) =>
      queryPackage.getSessionPackages(templateContext.db, sessionId)
    )
    .then((packages) => {
      expect(packages.length).toBe(2)
    }))

test('Validate basic generation', () =>
  genEngine
    .generate(
      templateContext.db,
      templateContext.sessionId,
      templateContext.packageId
    )
    .then((genResult) => {
      expect(genResult).not.toBeNull()
      expect(genResult.partial).toBeFalsy()
      expect(genResult.content).not.toBeNull()
      var simpleTest = genResult.content['simple-test.out']
      expect(simpleTest.startsWith('Test template file.')).toBeTruthy()
    }))

test('Validate basic generation one more time', () =>
  genEngine
    .generate(
      templateContext.db,
      templateContext.sessionId,
      templateContext.packageId
    )
    .then((genResult) => {
      expect(genResult).not.toBeNull()
      expect(genResult.partial).toBeFalsy()
      expect(genResult.content).not.toBeNull()
      var simpleTest = genResult.content['simple-test.out']
      expect(simpleTest.startsWith('Test template file.')).toBeTruthy()
      expect(simpleTest.includes(helperZap.zap_header()))

      var zclId = genResult.content['zap-id.h']
      expect(zclId.startsWith(helperZap.zap_header()))

      var zclId = genResult.content['zap-type.h']
      expect(zclId.startsWith(helperZap.zap_header()))
    }))
