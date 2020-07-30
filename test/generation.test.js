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
const fsExtra = require('fs-extra')
const axios = require('axios')
const dbApi = require('../src-electron/db/db-api.js')
const queryGeneric = require('../src-electron/db/query-generic.js')
const env = require('../src-electron/util/env.js')
const menuJs = require('../src-electron/main-process/menu.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const args = require('../src-electron/main-process/args.js')
const httpServer = require('../src-electron/server/http-server.js')

var db
const port = 9074
const baseUrl = `http://localhost:${port}`
var packageId
var sessionId
const timeout = 5000

beforeAll(() => {
  env.setDevelopmentEnv()
  var file = env.sqliteTestFile('generation')
  return dbApi
    .initDatabase(file)
    .then((d) => dbApi.loadSchema(d, env.schemaFile(), env.zapVersion()))
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .catch((err) => env.logError(`Error: ${err}`))
}, 5000)

afterAll(() => {
  return httpServer
    .shutdownHttpServer()
    .then(() => dbApi.closeDatabase(db))
    .then(() => {
      var file = env.sqliteTestFile('generation')
      env.logInfo(`Removing test database: ${file}`)
      if (fs.existsSync(file)) fs.unlinkSync(file)
    })
})

describe('Session specific tests', () => {
  test('make sure there is no session at the beginning', () => {
    return queryGeneric.selectCountFrom(db, 'SESSION').then((cnt) => {
      expect(cnt).toBe(0)
    })
  })

  test(
    'Now actually load the static data.',
    () => zclLoader.loadZcl(db, args.zclPropertiesFile),
    timeout
  )

  test('http server initialization', () => {
    return httpServer.initHttpServer(db, port)
  })

  test(
    'test that there is generation data in the enums.h preview file. Index 1',
    () => {
      return axios.get(`${baseUrl}/preview/enums/1`).then((response) => {
        expect(response.data['result']).toMatch(
          /EMBER_ZCL_11073_CONNECT_REQUEST_CONNECT_CONTROL_PREEMPTIBLE = 0x01/
        )
      })
    },
    timeout
  )

  test(
    'test that there is generation data in the enums.h preview file. Index 2',
    () => {
      return axios.get(`${baseUrl}/preview/enums/2`).then((response) => {
        expect(response.data['result']).toMatch(
          /\#define EMBER_AF_ALARM_MASK_GENERAL_HW_FAULT \(0x1\)/
        )
      })
    },
    timeout
  )

  test(
    'test that there is generation data in the cluster-id.h file',
    () => {
      return axios.get(`${baseUrl}/preview/cluster-id/1`).then((response) => {
        expect(response.data['result']).toMatch(
          /\#define ZCL_BASIC_CLUSTER_ID 0x0000/
        )
      })
    },
    timeout
  )

  test(
    'test that there is generation data in the print-cluster.h file',
    () => {
      return axios
        .get(`${baseUrl}/preview/print-cluster/1`)
        .then((response) => {
          expect(response.data['result']).toMatch(
            /\#if defined(ZCL_USING_BASIC_CLUSTER_SERVER) || defined(ZCL_USING_BASIC_CLUSTER_CLIENT)/
          )
        })
    },
    timeout
  )

  test(
    'test that there is generation data in the af-structs.h file',
    () => {
      return axios.get(`${baseUrl}/preview/af-structs/1`).then((response) => {
        expect(response.data['result']).toMatch(
          /typedef struct _IasAceZoneStatusResult {/
        )
        expect(response.data['result']).toMatch(/            uint8_t zoneId;/)
      })
    },
    timeout
  )

  test(
    'test that there is generation data in the att-storage.h file',
    () => {
      return axios.get(`${baseUrl}/preview/att-storage/1`).then((response) => {
        expect(response.data['result']).toMatch(
          /\#define ATTRIBUTE_MASK_WRITABLE \(0x01\)/
        )
      })
    },
    timeout
  )

  test(
    'test that there is generation data in the debug-printing-zcl.h file',
    () => {
      return axios
        .get(`${baseUrl}/preview/debug-printing-zcl/1`)
        .then((response) => {
          expect(response.data['result']).toMatch(
            /\#if defined\(EMBER_AF_PRINT_ENABLE\) && defined\(EMBER_AF_PRINT_BASIC_CLUSTER\)/
          )
          expect(response.data['result']).toMatch(
            /    \#define emberAfBasicClusterPrint\(...\) emberAfPrint\(EMBER_AF_PRINT_BASIC_CLUSTER, __VA_ARGS__\)/
          )
        })
    },
    timeout
  )

  test(
    'test that there is generation data in the callback-zcl.h file',
    () => {
      return axios.get(`${baseUrl}/preview/callback-zcl/1`).then((response) => {
        expect(response.data['result']).toMatch(
          /void emberAfBasicClusterClientAttributeChangedCallback\(uint8_t endpoint,/
        )
        expect(response.data['result']).toMatch(
          /                                                       EmberAfAttributeId attributeId\);/
        )
        expect(response.data['result']).toMatch(
          /void emberAfIdentifyClusterIdentifyQueryResponseCallback\(/
        )
        expect(response.data['result']).toMatch(
          /                uint16_t timeout/
        )
      })
    },
    timeout
  )

  test(
    'test that there is generation data in the client-command-macro.h file, index 4',
    () => {
      return axios
        .get(`${baseUrl}/preview/client-command-macro/4`)
        .then((response) => {
          expect(response.data['result']).toMatch(
            /      \#define emberAfFillCommandIso7816ProtocolTunnelClusterServerToClientTransferApdu\(/
          )
          expect(response.data['result']).toMatch(/        apdu\) \\/)
          expect(response.data['result']).toMatch(
            /emberAfFillExternalBuffer\(\(ZCL_CLUSTER_SPECIFIC_COMMAND \\/
          )
          expect(response.data['result']).toMatch(
            /                    ZCL_ISO7816_PROTOCOL_TUNNEL_CLUSTER_ID, \\/
          )
          expect(response.data['result']).toMatch(
            /                    ZCL_TRANSFER_APDU_COMMAND_ID, \\/
          )
          expect(response.data['result']).toMatch(/                    "s", \\/)
          expect(response.data['result']).toMatch(
            /                                    apdu\);/
          )
        })
    },
    timeout
  )

  test(
    'No generation test, incorrect file name',
    () => {
      return axios.get(`${baseUrl}/preview/no-file`).then((response) => {
        expect(response.data).toMatch(/No Generation Result for this file/)
      })
    },
    timeout
  )

  test(
    'No generation test, incorrect file name and incorrect index',
    () => {
      return axios.get(`${baseUrl}/preview/no-file/1`).then((response) => {
        expect(response.data).toMatch(/No Generation Result for this file/)
      })
    },
    timeout
  )

  test(
    'No generation test, with wrong index correct file name',
    () => {
      return axios.get(`${baseUrl}/preview/cluster-id/2`).then((response) => {
        expect(response.data).toMatch(/No Generation Result for this file/)
      })
    },
    timeout
  )
})
