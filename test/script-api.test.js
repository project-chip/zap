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
const dbApi = require('../src-electron/db/db-api.js')
const env = require('../src-electron/util/env.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const querySession = require('../src-electron/db/query-session.js')
const testUtil = require('./test-util.js')
const queryEndpoint = require('../src-electron/db/query-endpoint.js')

let testFile = path.join(__dirname, 'resource/three-endpoint-device.zap')

beforeAll(() => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('script-api')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .then(() => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile))
    .catch((err) => env.logError(`Error: ${err}`))
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  path.basename(testFile) + ' - import',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, testFile, {
      sessionId: sid,
      postImportScript: path.join(__dirname, 'resource/test-script-2.js'),
    })
    let endpoints = await queryEndpoint.selectAllEndpoints(db, sid)
    expect(endpoints.length).toBe(2)
    expect(endpoints[0].endpointIdentifier).toBe(42)
  },
  testUtil.timeout.medium()
)
