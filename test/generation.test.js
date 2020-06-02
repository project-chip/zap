/**
 * @jest-environment node
 */

/*
 * Created Date: Wednesday, March 18th 2020, 10:08 am
 * Author: Bharat Dandu
 *
 * Copyright (c) 2020 Silicon Labs
 */

import axios from 'axios'
import fs from 'fs-extra'
import { version } from '../package.json'
import {
  closeDatabase,
  initDatabase,
  loadSchema,
} from '../src-electron/db/db-api'
import { zclPropertiesFile } from '../src-electron/main-process/args'
import {
  logError,
  logInfo,
  schemaFile,
  setDevelopmentEnv,
  sqliteTestFile,
  setMainDatabase,
} from '../src-electron/util/env'
import {
  initHttpServer,
  shutdownHttpServer,
} from '../src-electron/server/http-server'
import { loadZcl } from '../src-electron/zcl/zcl-loader'
import { selectCountFrom } from '../src-electron/db/query-generic'
import {
  setHandlebarTemplateDirForCli,
  generateCodeViaCli,
} from '../src-electron/main-process/menu'

var db
const port = 9074
const baseUrl = `http://localhost:${port}`
var packageId
var sessionId
var file = sqliteTestFile(3)

beforeAll(() => {
  setDevelopmentEnv()
  file = sqliteTestFile(3)
  return initDatabase(file)
    .then((d) => loadSchema(d, schemaFile(), version))
    .then((d) => {
      db = d
      logInfo(`Test database initialized: ${file}.`)
    })
    .catch((err) => logError(`Error: ${err}`))
})

afterAll(() => {
  return shutdownHttpServer()
    .then(() => closeDatabase(db))
    .then(() => {
      var file = sqliteTestFile(3)
      logInfo(`Removing test database: ${file}`)
      if (fs.existsSync(file)) fs.unlinkSync(file)
    })
})

describe('Session specific tests', () => {
  test('make sure there is no session at the beginning', () => {
    return selectCountFrom(db, 'SESSION').then((cnt) => {
      expect(cnt).toBe(0)
    })
  })

  test('Now actually load the static data.', () => {
    return loadZcl(db, zclPropertiesFile)
  }, 6000)

  test('http server initialization', () => {
    return initHttpServer(db, port)
  })

  test('Test command line generation using api used for command line generation', () => {
    return initDatabase(file)
      .then((db) => attachToDb(db))
      .then((db) => loadSchema(db, schemaFile(), version))
      .then((db) => loadZcl(db, zclPropertiesFile))
      .then((db) => setHandlebarTemplateDirForCli('./test/gen-template/'))
      .then((handlebarTemplateDir) => generateCodeViaCli('./generation-test/'))
      .then((res) => {
        return new Promise((resolve, reject) => {
          let i = 0
          for (i = 0; i < res.length; i++) {
            expect(res[i]).toBeDefined()
          }
          let size = Object.keys(res).length
          resolve(size)
        })
      })
      .then((size) => {
        return new Promise((resolve, reject) => {
          expect(size).toBe(8)
          resolve(size)
        })
      })
      .then(() => fs.remove('./generation-test'))
      .catch((error) => console.log(error))
  }, 2000)

  function attachToDb(db) {
    return new Promise((resolve, reject) => {
      setMainDatabase(db)
      resolve(db)
    })
  }

  test('test that there is generation data in the enums.h file', () => {
    return axios.get(`${baseUrl}/preview/enums`).then((response) => {
      expect(response.data).toMatch(
        /EMBER_ZCL_11073_CONNECT_REQUEST_CONNECT_CONTROL_PREEMPTIBLE = 0x01/
      )
      expect(response.data).toMatch(
        /\#define EMBER_AF_ALARM_MASK_GENERAL_HW_FAULT \(0x1\)/
      )
    })
  }, 2000)

  test('test that there is generation data in the cluster-id.h file', () => {
    return axios.get(`${baseUrl}/preview/cluster-id`).then((response) => {
      expect(response.data).toMatch(/\#define ZCL_BASIC_CLUSTER_ID 0x0000/)
    })
  })

  test('test that there is generation data in the print-cluster.h file', () => {
    return axios.get(`${baseUrl}/preview/print-cluster`).then((response) => {
      expect(response.data).toMatch(
        /\#if defined(ZCL_USING_BASIC_CLUSTER_SERVER) || defined(ZCL_USING_BASIC_CLUSTER_CLIENT)/
      )
    })
  })

  test('test that there is generation data in the af-structs.h file', () => {
    return axios.get(`${baseUrl}/preview/af-structs`).then((response) => {
      expect(response.data).toMatch(/typedef struct _IasAceZoneStatusResult {/)
      expect(response.data).toMatch(/            uint8_t zoneId;/)
    })
  })

  test('test that there is generation data in the att-storage.h file', () => {
    return axios.get(`${baseUrl}/preview/att-storage`).then((response) => {
      expect(response.data).toMatch(/\#define ATTRIBUTE_MASK_WRITABLE \(0x01\)/)
    })
  })

  test('test that there is generation data in the debug-printing-zcl.h file', () => {
    return axios
      .get(`${baseUrl}/preview/debug-printing-zcl`)
      .then((response) => {
        expect(response.data).toMatch(
          /\#if defined\(EMBER_AF_PRINT_ENABLE\) && defined\(EMBER_AF_PRINT_BASIC_CLUSTER\)/
        )
        expect(response.data).toMatch(
          /    \#define emberAfBasicClusterPrint\(...\) emberAfPrint\(EMBER_AF_PRINT_BASIC_CLUSTER, __VA_ARGS__\)/
        )
      })
  })

  test('test that there is generation data in the callback-zcl.h file', () => {
    return axios.get(`${baseUrl}/preview/callback-zcl`).then((response) => {
      expect(response.data).toMatch(
        /void emberAfBasicClusterClientAttributeChangedCallback\(uint8_t endpoint,/
      )
      expect(response.data).toMatch(
        /                                                       EmberAfAttributeId attributeId\);/
      )
      expect(response.data).toMatch(
        /void emberAfIdentifyClusterIdentifyQueryResponseCallback\(/
      )
      expect(response.data).toMatch(/                uint16_t timeout/)
    })
  })

  test('test that there is generation data in the client-command-macro.h file', () => {
    return axios
      .get(`${baseUrl}/preview/client-command-macro`)
      .then((response) => {
        expect(response.data).toMatch(
          /      \#define emberAfFillCommandIso7816ProtocolTunnelClusterServerToClientTransferApdu\(/
        )
        expect(response.data).toMatch(/        apdu\) \\/)
        expect(response.data).toMatch(
          /emberAfFillExternalBuffer\(\(ZCL_CLUSTER_SPECIFIC_COMMAND \\/
        )
        expect(response.data).toMatch(
          /                    ZCL_ISO7816_PROTOCOL_TUNNEL_CLUSTER_ID, \\/
        )
        expect(response.data).toMatch(
          /                    ZCL_TRANSFER_APDU_COMMAND_ID, \\/
        )
        expect(response.data).toMatch(/                    "s", \\/)
        expect(response.data).toMatch(
          /                                    apdu\);/
        )
      })
  })

  test('No generation test', () => {
    return axios.get(`${baseUrl}/preview/no-file`).then((response) => {
      expect(response.data).toMatch(/No Generation Result for this file/)
    })
  })
})
