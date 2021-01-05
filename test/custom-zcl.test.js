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

const dbApi = require('../src-electron/db/db-api.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const args = require('../src-electron/util/args.js')
const env = require('../src-electron/util/env.js')
const testUtil = require('./test-util.js')
const querySession = require('../src-electron/db/query-session.js')
const util = require('../src-electron/util/util.js')
const libxmljs = require('libxmljs')

let db
let sid

beforeAll(() => {
  let file = env.sqliteTestFile('custom-validation')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo('DB initialized.')
    })
    .then(() => {
      return zclLoader.loadZcl(db, args.zclPropertiesFile)
    })
    .then(() => {
      return querySession.ensureZapSessionId(db, 'SESSION').then((id) => {
        sid = id
      })
    })
    .then(() => util.initializeSessionPackage(db, sid))
}, 5000)

test('Test custom xml', () => {
  return zclLoader
    .loadIndividualFile(db, testUtil.testCustomXml, sid)
    .then((result) => {
      expect(result.succeeded).toBeTruthy()
    })
}, 5000)

test('Test bad custom xml', () => {
  return zclLoader
    .loadIndividualFile(db, testUtil.badTestCustomXml, sid)
    .then((result) => {
      expect(result.succeeded).toBeFalsy()
    })
}, 5000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})
