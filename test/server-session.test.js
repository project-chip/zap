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
const dbApi = require('../src-electron/db/db-api')
const httpServer = require('../src-electron/server/http-server')
const env = require('../src-electron/util/env')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const testUtil = require('./test-util')
const restApi = require('../src-shared/rest-api')
const queryZcl = require('../src-electron/db/query-zcl')
const querySession = require('../src-electron/db/query-session')
const util = require('../src-electron/util/util')

let db
let axiosInstance = null
let sessionUuid = util.createUuid()

beforeAll(async () => {
  const { port, baseUrl } = testUtil.testServer(__filename)
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('server-session')
  axiosInstance = axios.create({ baseURL: baseUrl })
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
  await httpServer.initHttpServer(db, port)
}, testUtil.timeout.medium())

afterAll(
  () => httpServer.shutdownHttpServer().then(() => dbApi.closeDatabase(db)),
  testUtil.timeout.medium()
)

test(
  'get index.html',
  async () => {
    let response = await axiosInstance.get('/index.html')
    let sessionCookie = response.headers['set-cookie'][0]
    axiosInstance.defaults.headers.Cookie = sessionCookie
    expect(response.data).toContain(
      'Configuration tool for the Zigbee Cluster Library'
    )
  },
  testUtil.timeout.medium()
)

test.each([
  restApi.uri.getAllSessionKeyValues,
  restApi.uri.uiOptions,
  restApi.uri.packages,
  restApi.uri.initialState,
  restApi.uri.sessionNotification,
  restApi.uri.getAllPackages,
  restApi.ide.isDirty,
  restApi.uri.version,
  restApi.uri.cache
])(
  'Test GET: %p',
  async (uri) => {
    let response = await axiosInstance.get(uri)
    expect(response.data).not.toBeNull()
  },
  testUtil.timeout.medium()
)

test(
  'Delete one dirty session and then delete all remaining dirty sessions',
  async () => {
    let dirty1 = await querySession.createBlankSession(db)
    let dirty2 = await querySession.createBlankSession(db)
    await dbApi.dbUpdate(
      db,
      'UPDATE SESSION SET DIRTY = 1 WHERE SESSION_ID IN (?,?)',
      [dirty1, dirty2]
    )

    let missing = await axiosInstance
      .delete(restApi.uri.deleteSession)
      .catch((err) => err.response)
    expect(missing.status).toBe(400)

    let one = await axiosInstance.delete(restApi.uri.deleteSession, {
      params: { [restApi.param.sessionId]: dirty1 }
    })
    expect(one.data.message).toContain('deleted')
    expect(
      await querySession.getSessionFromSessionId(db, dirty1)
    ).toBeUndefined()

    let all = await axiosInstance.delete(restApi.uri.deleteAllDirtySessions)
    expect(all.data.count).toBeGreaterThanOrEqual(1)
    expect(
      await querySession.getSessionFromSessionId(db, dirty2)
    ).toBeUndefined()
  },
  testUtil.timeout.medium()
)

test(
  'Set recent file days and reject invalid values',
  async () => {
    let ok = await axiosInstance.post(restApi.uri.recentFileDays, { days: 5 })
    expect(ok.data.recentFileDays).toBe(5)
    expect(Array.isArray(ok.data.recentFiles)).toBe(true)

    let attempt = await axiosInstance.post(restApi.uri.sessionAttempt, {
      search: ''
    })
    expect(attempt.data.recentFileDays).toBe(5)

    let bad = await axiosInstance
      .post(restApi.uri.recentFileDays, { days: -1 })
      .catch((err) => err.response)
    expect(bad.status).toBe(400)
  },
  testUtil.timeout.medium()
)
