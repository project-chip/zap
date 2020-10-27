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

const axios = require('axios')
const dbApi = require('../src-electron/db/db-api.js')
const httpServer = require('../src-electron/server/http-server.js')
const env = require('../src-electron/util/env.js')
const restApi = require('../src-shared/rest-api.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const args = require('../src-electron/util/args.js')
const testUtil = require('./test-util.js')

var db
var axiosInstance = null

beforeAll(() => {
  const { port, baseUrl } = testUtil.testServer(__filename)
  env.setDevelopmentEnv()
  var file = env.sqliteTestFile('server-zcl')
  axiosInstance = axios.create({ baseURL: baseUrl })
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .then(() => zclLoader.loadZcl(db, args.zclPropertiesFile))
    .then(() => httpServer.initHttpServer(db, port))
    .catch((err) => env.logError(`Error: ${err}`))
}, 5000)

afterAll(() =>
  httpServer.shutdownHttpServer().then(() => dbApi.closeDatabase(db))
)

test('get index.html', () =>
  axiosInstance.get('/index.html').then((response) => {
    var sessionCookie = response.headers['set-cookie'][0]
    axiosInstance.defaults.headers.Cookie = sessionCookie
    expect(
      response.data.includes(
        'Configuration tool for the Zigbee Cluster Library'
      )
    ).toBeTruthy()
  }))

describe('Miscelaneous REST API tests', () => {
  test('test manufacturer codes', () =>
    axiosInstance
      .get(`${restApi.uri.option}/manufacturerCodes`)
      .then((response) => {
        expect(response.data.length).toBeGreaterThan(100)
      }))
})
