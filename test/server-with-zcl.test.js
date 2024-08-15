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
const restApi = require('../src-shared/rest-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const testUtil = require('./test-util')
const path = require('path')
const util = require('../src-electron/util/util')
const { StatusCodes } = require('http-status-codes')
const testQuery = require('./test-query')

let db
let axiosInstance = null
let sessionUuid = util.createUuid()

beforeAll(async () => {
  const { port, baseUrl } = testUtil.testServer(__filename)
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('server-zcl')
  axiosInstance = axios.create({ baseURL: baseUrl })
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion(),
  )
  await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
  await httpServer.initHttpServer(db, port)
  await testQuery.createSession(
    db,
    'USER',
    sessionUuid,
    env.builtinSilabsZclMetafile(),
    env.builtinTemplateMetafile(),
  )
}, testUtil.timeout.long())

afterAll(
  () => httpServer.shutdownHttpServer().then(() => dbApi.closeDatabase(db)),
  testUtil.timeout.medium(),
)

test(
  'get index.html',
  () =>
    axiosInstance.get('/index.html').then((response) => {
      let sessionCookie = response.headers['set-cookie'][0]
      axiosInstance.defaults.headers.Cookie = sessionCookie
      expect(
        response.data.includes(
          'Configuration tool for the Zigbee Cluster Library',
        ),
      ).toBeTruthy()
    }),
  testUtil.timeout.long(),
)

describe('Miscelaneous REST API tests', () => {
  test(
    'test manufacturer codes',
    () =>
      axiosInstance
        .get(`${restApi.uri.option}/manufacturerCodes?sessionId=${sessionUuid}`)
        .then((response) => {
          expect(response.data.length).toBeGreaterThan(100)
        }),
    testUtil.timeout.long(),
  )

  test(
    'load a file',
    () =>
      axiosInstance
        .post(`${restApi.ide.open}?sessionId=${sessionUuid}`, {
          zapFilePath: testUtil.zigbeeTestFile.threeEp,
        })
        .then((response) => {
          expect(response.status).toBe(StatusCodes.OK)
        }),
    testUtil.timeout.long(),
  )

  test(
    'session key values existence test',
    () =>
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
        }),
    testUtil.timeout.long(),
  )

  test(
    'add session key value test',
    () =>
      axiosInstance
        .post(`${restApi.uri.saveSessionKeyValue}?sessionId=${sessionUuid}`, {
          key: 'testKey',
          value: 'testValue',
        })
        .then(() =>
          axiosInstance.get(
            `${restApi.uri.getAllSessionKeyValues}?sessionId=${sessionUuid}`,
          ),
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
        }),
    testUtil.timeout.long(),
  )

  test(
    'all clusters',
    () =>
      axiosInstance
        .get(`${restApi.uri.zclCluster}all?sessionId=${sessionUuid}`)
        .then((response) => {
          expect(response.data.clusterData.length).toBe(
            testUtil.totalClusterCount,
          )
        }),
    testUtil.timeout.long(),
  )

  test(
    'all device types',
    async () => {
      let response = await axiosInstance.get(
        `${restApi.uri.zclDeviceType}all?sessionId=${sessionUuid}`,
      )
      expect(response.data.length).toBe(175)

      // Now let's test ha onoff device
      let haOnOff = response.data.find((d) => d.label == 'HA-onoff')
      expect(haOnOff).not.toBeNull()

      let clusters = await axiosInstance.get(
        `${restApi.uri.deviceTypeClusters}${haOnOff.id}`,
      )
      expect(clusters.data.length).toBe(14)
      let attributes = await axiosInstance.get(
        `${restApi.uri.deviceTypeAttributes}${haOnOff.id}`,
      )
      expect(attributes.data.length).toBe(0)
      let commands = await axiosInstance.get(
        `${restApi.uri.deviceTypeCommands}${haOnOff.id}`,
      )
      expect(commands.data.length).toBe(0)

      let zllNcsr = response.data.find(
        (d) => d.label == 'ZLL-noncolorsceneremote',
      )
      expect(zllNcsr).not.toBeNull()

      clusters = await axiosInstance.get(
        `${restApi.uri.deviceTypeClusters}${zllNcsr.id}`,
      )
      expect(clusters.data.length).toBe(8)
      attributes = await axiosInstance.get(
        `${restApi.uri.deviceTypeAttributes}${zllNcsr.id}`,
      )
      expect(attributes.data.length).toBe(9)
      commands = await axiosInstance.get(
        `${restApi.uri.deviceTypeCommands}${zllNcsr.id}`,
      )
      expect(commands.data.length).toBe(32)
    },
    testUtil.timeout.long(),
  )

  test(
    'all domains',
    () =>
      axiosInstance
        .get(`${restApi.uri.zclDomain}all?sessionId=${sessionUuid}`)
        .then((response) => {
          expect(response.data.length).toBe(testUtil.totalDomainCount)
        }),
    testUtil.timeout.long(),
  )

  test(
    'all bitmaps',
    () =>
      axiosInstance
        .get(`${restApi.uri.zclBitmap}all?sessionId=${sessionUuid}`)
        .then((response) => {
          expect(response.data.length).toBe(129)
        }),
    testUtil.timeout.long(),
  )

  test(
    'all enums',
    () =>
      axiosInstance
        .get(`${restApi.uri.zclEnum}all?sessionId=${sessionUuid}`)
        .then((response) => {
          expect(response.data.length).toBe(testUtil.totalEnumCount)
        }),
    testUtil.timeout.short(),
  )

  test(
    'all structs',
    () =>
      axiosInstance
        .get(`${restApi.uri.zclStruct}all?sessionId=${sessionUuid}`)
        .then((response) => {
          expect(response.data.length).toBe(54)
        }),
    testUtil.timeout.short(),
  )
})
