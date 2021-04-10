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
const path = require('path')
const util = require('../src-electron/util/util.js')
let db
let axiosInstance = null

beforeAll(() => {
  const { port, baseUrl } = testUtil.testServer(__filename)
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('server-zcl')
  axiosInstance = axios.create({ baseURL: baseUrl })
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .then(() => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile))
    .then(() => httpServer.initHttpServer(db, port))
    .catch((err) => env.logError(`Error: ${err}`))
}, 5000)

afterAll(() =>
  httpServer.shutdownHttpServer().then(() => dbApi.closeDatabase(db))
)

test('get index.html', () =>
  axiosInstance.get('/index.html').then((response) => {
    let sessionCookie = response.headers['set-cookie'][0]
    axiosInstance.defaults.headers.Cookie = sessionCookie
    console.log(sessionCookie)
    expect(
      response.data.includes(
        'Configuration tool for the Zigbee Cluster Library'
      )
    ).toBeTruthy()
  }))

describe('Miscelaneous REST API tests', () => {
  let sessionUuid = util.createUuid()
  test('test manufacturer codes', () =>
    axiosInstance
      .get(`${restApi.uri.option}/manufacturerCodes?sessionId=${sessionUuid}`)
      .then((response) => {
        expect(response.data.length).toBeGreaterThan(100)
      }))

  test('load a file', () =>
    axiosInstance
      .post(`${restApi.ide.open}?sessionId=${sessionUuid}`, {
        zapFilePath: path.join(__dirname, 'resource/three-endpoint-device.zap'),
      })
      .then((response) => {
        expect(response.status).toBe(restApi.httpCode.ok)
      }))

  test('session key values existence test', () =>
    axiosInstance
      .get(`${restApi.uri.getAllSessionKeyValues}?sessionId=${sessionUuid}`)
      .then((response) => {
        let data = response.data.reduce((accumulator, current) => {
          accumulator[current.key] = current.value
          return accumulator
        }, {})
        expect(data.commandDiscovery).toEqual('1')
        expect(data.defaultResponsePolicy).toEqual('always')
        expect(data.filePath).toContain('three-endpoint-device.zap')
        expect(data.manufacturerCodes).toEqual('0x1002')
      }))

  test('add session key value test', () =>
    axiosInstance
      .post(`${restApi.uri.saveSessionKeyValue}?sessionId=${sessionUuid}`, {
        key: 'testKey',
        value: 'testValue',
      })
      .then(() =>
        axiosInstance.get(
          `${restApi.uri.getAllSessionKeyValues}?sessionId=${sessionUuid}`
        )
      )
      .then((response) => {
        let data = response.data.reduce((accumulator, current) => {
          accumulator[current.key] = current.value
          return accumulator
        }, {})
        expect(data.commandDiscovery).toEqual('1')
        expect(data.defaultResponsePolicy).toEqual('always')
        expect(data.filePath).toContain('three-endpoint-device.zap')
        expect(data.manufacturerCodes).toEqual('0x1002')
        expect(data.testKey).toEqual('testValue')
      }))
})
