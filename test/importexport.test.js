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
const fs = require('fs')
const importJs = require('../src-electron/importexport/import.js')
const exportJs = require('../src-electron/importexport/export.js')
const dbEnum = require('../src-shared/db-enum.js')
const dbApi = require('../src-electron/db/db-api.js')
const env = require('../src-electron/util/env.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const args = require('../src-electron/util/args.js')
const queryGeneric = require('../src-electron/db/query-generic.js')
const generationEngine = require('../src-electron/generator/generation-engine.js')
const querySession = require('../src-electron/db/query-session.js')
const testUtil = require('./test-util.js')

var db
var testFile1 = path.join(__dirname, 'resource/save-file-1.zap')
var testFile2 = path.join(__dirname, 'resource/save-file-2.zap')
// Due to future plans to rework how we handle global attributes,
// we introduce this flag to bypass those attributes when testing import/export.
let bypassGlobalAttributes = true

beforeAll(() => {
  env.setDevelopmentEnv()
  var file = env.sqliteTestFile('importexport')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .catch((err) => env.logError(`Error: ${err}`))
}, 5000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})

test(
  'Load the static data.',
  () => zclLoader.loadZcl(db, args.zclPropertiesFile),
  5000
)

test('Basic gen template parsing and generation', () =>
  generationEngine
    .loadTemplates(db, testUtil.testZigbeeGenerationTemplates)
    .then((context) => {
      expect(context.crc).not.toBeNull()
      expect(context.templateData).not.toBeNull()
    }))

test('Test file 1 existence', () => {
  return importJs.readDataFromFile(testFile1).then((state) => {
    expect(state).not.toBe(null)
    expect(state.creator).toBe('zap')
    expect(state.package[0].type).toBe(dbEnum.packageType.zclProperties)
  })
})

test('Test file 2 existence', () => {
  return importJs.readDataFromFile(testFile1).then((state) => {
    expect(state).not.toBe(null)
    expect(state.creator).toBe('zap')
    expect(state.package[0].type).toBe(dbEnum.packageType.zclProperties)
  })
})

test('Test file 1 import', () => {
  var sid
  return importJs
    .importDataFromFile(db, testFile1)
    .then((sessionId) => (sid = sessionId))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE'))
    .then((x) => expect(x).toBe(1))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_CLUSTER'))
    .then((x) => expect(x).toBe(11))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_COMMAND'))
    .then((x) => expect(x).toBe(7))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_ATTRIBUTE'))
    .then((x) => expect(x).toBe(21))
    .then(() => exportJs.createStateFromDatabase(db, sid))
    .then((state) => {
      var commandCount = 0
      var attributeCount = 0
      expect(state.featureLevel).toBe(env.zapVersion().featureLevel)
      expect(state.endpointTypes.length).toBe(1)
      expect(state.endpointTypes[0].clusters.length).toBe(11)
      state.endpointTypes[0].clusters.forEach((c) => {
        commandCount += c.commands.length
        attributeCount += c.attributes.length
      })
      expect(commandCount).toBe(7)
      // This flag exists for this test due to planned global attribute rework.
      expect(attributeCount).toBe(bypassGlobalAttributes ? 15 : 21)
    })
    .then(() => {
      // Clear the session
      querySession.deleteSession(db, sid)
    })
})

test('Test file 2 import', () => {
  var sid
  return querySession
    .createBlankSession(db)
    .then((sessionId) => importJs.importDataFromFile(db, testFile2, sessionId))
    .then((sessionId) => (sid = sessionId))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE'))
    .then((x) => expect(x).toBe(1))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_CLUSTER'))
    .then((x) => expect(x).toBe(19))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_COMMAND'))
    .then((x) => expect(x).toBe(24))
    .then(() => queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_ATTRIBUTE'))
    .then((x) => expect(x).toBe(28))
    .then(() => exportJs.createStateFromDatabase(db, sid))
    .then((state) => {
      var commandCount = 0
      var attributeCount = 0
      expect(state.endpointTypes.length).toBe(1)
      expect(state.endpointTypes[0].clusters.length).toBe(19)
      state.endpointTypes[0].clusters.forEach((c) => {
        commandCount += c.commands.length
        attributeCount += c.attributes.length
      })
      expect(commandCount).toBe(24)
      // This flag exists for this test due to planned global attribute rework.
      expect(attributeCount).toBe(bypassGlobalAttributes ? 16 : 28)
    })
})
