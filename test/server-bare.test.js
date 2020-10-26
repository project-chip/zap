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

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dbApi = require('../src-electron/db/db-api.js')
const dbEnum = require('../src-shared/db-enum.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const queryGeneric = require('../src-electron/db/query-generic.js')
const queryPackage = require('../src-electron/db/query-package.js')
const querySession = require('../src-electron/db/query-session.js')
const httpServer = require('../src-electron/server/http-server.js')
const env = require('../src-electron/util/env.js')
const exportJs = require('../src-electron/importexport/export.js')
const importJs = require('../src-electron/importexport/import.js')
const restApi = require('../src-shared/rest-api.js')
const testUtil = require('./test-util.js')

var db
const { port, baseUrl } = testUtil.testServer()
var packageId
var sessionId, secondSessionId
var sessionCookie = null
var axiosInstance = null

beforeAll(() => {
  env.setDevelopmentEnv()
  var file = env.sqliteTestFile('server')
  axiosInstance = axios.create({ baseURL: baseUrl })
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .catch((err) => env.logError(`Error: ${err}`))
}, 5000)

afterAll(() =>
  httpServer.shutdownHttpServer().then(() => dbApi.closeDatabase(db))
)

describe('Session specific tests', () => {
  test('make sure there is no session at the beginning', () =>
    queryGeneric.selectCountFrom(db, 'SESSION').then((cnt) => {
      expect(cnt).toBe(0)
    }))

  test('http server initialization', () => httpServer.initHttpServer(db, port))

  test('verify server port log (~/.zap/zap.url)', () => {
    expect(fs.existsSync(env.urlLogFile())).toBeTruthy()

    content = fs.readFileSync(env.urlLogFile(), 'utf8')
    expect(
      content.trim() === env.baseUrl() + httpServer.httpServerPort()
    ).toBeTruthy()
  })

  test('get index.html', () =>
    axiosInstance.get('/index.html').then((response) => {
      sessionCookie = response.headers['set-cookie'][0]
      axiosInstance.defaults.headers.Cookie = sessionCookie
      expect(
        response.data.includes(
          'Configuration tool for the Zigbee Cluster Library'
        )
      ).toBeTruthy()
    }))

  test('make sure there is 1 session after index.html', () =>
    queryGeneric.selectCountFrom(db, 'SESSION').then((cnt) => {
      expect(cnt).toBe(1)
    }))

  test('save session', () =>
    querySession.getAllSessions(db).then((results) => {
      sessionId = results[0].sessionId
      env.logInfo(`SESSION ID: ${sessionId}`)
    }))

  test('test that there is 0 clusters initially', () =>
    axiosInstance.get('/zcl/cluster/all').then((response) => {
      expect(response.data.data.length).toBe(0)
      expect(response.data.type).toBe('cluster')
    }))

  test('make sure there is still 1 session after previous call', () =>
    queryGeneric.selectCountFrom(db, 'SESSION').then((cnt) => {
      expect(cnt).toBe(1)
    }))

  test('add a package', () =>
    queryPackage
      .insertPathCrc(db, 'PATH', 32, dbEnum.packageType.zclProperties)
      .then((pkg) => {
        packageId = pkg
      })
      .then(() => queryPackage.insertSessionPackage(db, sessionId, packageId)))

  test('load 2 clusters', () =>
    queryZcl.insertClusters(db, packageId, [
      {
        code: 0x1111,
        name: 'One',
        description: 'Cluster one',
        define: 'ONE',
      },
      {
        code: 0x2222,
        name: 'Two',
        description: 'Cluster two',
        define: 'TWO',
      },
    ]))

  test('test that there are 2 clusters now', () =>
    axiosInstance.get('/zcl/cluster/all').then((response) => {
      expect(response.data.data.length).toBe(2)
      expect(response.data.type).toBe('cluster')
    }))

  test('make sure there is still 1 session after previous call', () =>
    queryGeneric.selectCountFrom(db, 'SESSION').then((cnt) => {
      expect(cnt).toBe(1)
    }))

  test('load domains', () =>
    queryZcl.insertDomains(db, packageId, [
      { name: 'one' },
      { name: 'two' },
      { name: 'three' },
      { name: 'four' },
    ]))

  test('test that there are domains', () =>
    axiosInstance.get('/zcl/domain/all').then((response) => {
      expect(response.data.data.length).toBe(4)
      expect(response.data.type).toBe('domain')
    }))

  // We save and then load, which creates a new session.
  test('save into a file and load from file', () => {
    var f = path.join(env.appDirectory(), 'test-output.json')
    if (fs.existsSync(f)) fs.unlinkSync(f)
    expect(fs.existsSync(f)).toBeFalsy()
    return exportJs
      .exportDataIntoFile(db, sessionId, f)
      .then(() => {
        expect(fs.existsSync(f)).toBeTruthy()
      })
      .then(() => importJs.importDataFromFile(db, f))
      .then((nextSessionId) => {
        secondSessionId = nextSessionId
        fs.unlinkSync(f)
        return Promise.resolve(1)
      })
  })

  // After a new file is loaded a new session will be created.
  // Therefore, at this point, there have to be EXACTLY 2 sessions.
  test('make sure there is now 2 sessions after previous call', () =>
    queryGeneric.selectCountFrom(db, 'SESSION').then((cnt) => {
      expect(cnt).toBe(2)
    }))

  test('delete the first session', () =>
    querySession
      .deleteSession(db, sessionId)
      .then(() => queryGeneric.selectCountFrom(db, 'SESSION'))
      .then((cnt) => {
        expect(cnt).toBe(1)
      }))

  test('delete the second session', () =>
    querySession
      .deleteSession(db, secondSessionId)
      .then(() => queryGeneric.selectCountFrom(db, 'SESSION'))
      .then((cnt) => {
        expect(cnt).toBe(0)
      }))
})

describe('Miscelaneous REST API tests', () => {
  test('test initial state', () =>
    axiosInstance.get(restApi.uri.initialState).then((response) => {
      expect(response.data).not.toBeNull()
      expect('endpoints' in response.data).toBeTruthy()
      expect('endpointTypes' in response.data).toBeTruthy()
      expect('sessionKeyValues' in response.data).toBeTruthy()
    }))
})

describe('Admin tests', () => {
  test('test sql admin interface', () =>
    axiosInstance
      .post('/sql', { sql: 'SELECT * FROM PACKAGE' })
      .then((response) => {
        expect(response).not.toBeNull()
        expect(response.data.result).not.toBeNull()
        expect(response.data.result.length).toBeGreaterThan(1)
      }))
})
