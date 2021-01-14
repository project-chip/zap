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
const queryConfig = require('../src-electron/db/query-config.js')

let db
let testFile1 = path.join(__dirname, 'resource/save-file-1.zap')
let testFile2 = path.join(__dirname, 'resource/save-file-2.zap')
let testFileIsc = path.join(__dirname, 'resource/test-light.isc')

// Due to future plans to rework how we handle global attributes,
// we introduce this flag to bypass those attributes when testing import/export.
let bypassGlobalAttributes = false

beforeAll(() => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('importexport')
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

test('Basic gen template parsing and generation', async () => {
  let context = await generationEngine.loadTemplates(
    db,
    testUtil.testZigbeeGenerationTemplates
  )
  expect(context.crc).not.toBeNull()
  expect(context.templateData).not.toBeNull()
})

test('Test file 1 existence', async () => {
  let state = await importJs.readDataFromFile(testFile1)
  expect(state).not.toBe(null)
  expect(state.creator).toBe('zap')
  expect(state.package[0].type).toBe(dbEnum.packageType.zclProperties)
})

test('Test file 2 existence', async () => {
  let state = await importJs.readDataFromFile(testFile1)
  expect(state).not.toBe(null)
  expect(state.creator).toBe('zap')
  expect(state.package[0].type).toBe(dbEnum.packageType.zclProperties)
})

test('Test file 1 import', async () => {
  let sid = await importJs.importDataFromFile(db, testFile1)

  let x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE')
  expect(x).toBe(1)
  x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_CLUSTER')
  expect(x).toBe(11)
  x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_COMMAND')
  expect(x).toBe(7)
  x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_ATTRIBUTE')
  expect(x).toBe(21)

  let state = await exportJs.createStateFromDatabase(db, sid)
  let commandCount = 0
  let attributeCount = 0
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

  await querySession.deleteSession(db, sid)
})

test('Test file 2 import', async () => {
  let sid = await querySession.createBlankSession(db)
  await importJs.importDataFromFile(db, testFile2, sid)

  let x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE')
  expect(x).toBe(1)

  x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_CLUSTER')
  expect(x).toBe(19)

  x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_COMMAND')
  expect(x).toBe(24)

  x = await queryGeneric.selectCountFrom(db, 'ENDPOINT_TYPE_ATTRIBUTE')
  expect(x).toBe(28)

  let state = await exportJs.createStateFromDatabase(db, sid)
  let commandCount = 0
  let attributeCount = 0
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

test('Test ISC import', async () => {
  sid = await querySession.createBlankSession(db)
  await importJs.importDataFromFile(db, testFileIsc, sid)
  expect(sid).not.toBeUndefined()
  let endpointTypes = await queryConfig.getAllEndpointTypes(db, sid)
  expect(endpointTypes.length).toBe(4)
  expect(endpointTypes[0].name).toBe('Centralized')
  expect(endpointTypes[1].name).toBe('GreenPower')
  expect(endpointTypes[2].name).toBe('Primary')
  expect(endpointTypes[3].name).toBe('Touchlink')
}, 5000)

test('Read ISD data from file', async () => {
  let state = await importJs.readDataFromFile(testFileIsc)
  expect(Object.keys(state.endpointTypes).length).toBe(4)
  expect(Object.keys(state.endpoint).length).toBe(3)
  expect(state.endpoint[2].endpoint).toBe(242)
  expect(state).not.toHaveProperty('parseState')
  expect(state.clusterOverride.length).toBe(2)
  expect(state.attributeType.length).toBe(10)
})
