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
import fs from 'fs'
import { version } from '../package.json'
const dbApi = require('../src-electron/db/db-api.js')
import { zclPropertiesFile } from '../src-electron/main-process/args'
import {
  logInfo,
  schemaFile,
  sqliteTestFile,
  logError,
} from '../src-electron/util/env'
import { loadZcl } from '../src-electron/zcl/zcl-loader'
import { getPathCrc, insertPathCrc } from '../src-electron/db/query-package'
import {
  insertClusters,
  selectAllClusters,
  selectClusterById,
  selectAttributesByClusterId,
  selectCommandsByClusterId,
} from '../src-electron/db/query-zcl'
import {
  ensureZapSessionId,
  setSessionClean,
  getSessionInfoFromWindowId,
  getSessionDirtyFlag,
} from '../src-electron/db/query-session'
import {
  insertEndpointType,
  deleteEndpoint,
  deleteEndpointType,
  updateKeyValue,
  getSessionKeyValue,
  getAllEndpointTypes,
} from '../src-electron/db/query-config'
import * as QueryZcl from '../src-electron/db/query-zcl.js'
import * as QueryConfig from '../src-electron/db/query-config.js'
import {
  insertFileLocation,
  selectFileLocation,
} from '../src-electron/db/query-generic'
import { createStateFromDatabase } from '../src-electron/importexport/export'

/*
 * Created Date: Friday, March 13th 2020, 7:44:12 pm
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */

var db
var sid

beforeAll(() => {
  var file = sqliteTestFile(1)
  return dbApi
    .initDatabase(file)
    .then((d) => dbApi.loadSchema(d, schemaFile(), version))
    .then((d) => {
      db = d
      logInfo('DB initialized.')
    })
})

afterAll(() => {
  var file = sqliteTestFile(1)
  return dbApi.closeDatabase(db).then(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
})

test('Path CRC queries.', () => {
  var path = '/some/random/path'
  var crc = 42
  return insertPathCrc(db, path, crc)
    .then((rowid) => getPathCrc(db, path))
    .then((c) => expect(c).toBe(crc))
})

test('File location queries.', () => {
  return insertFileLocation(db, '/random/file/path', 'cat')
    .then(() => selectFileLocation(db, 'cat'))
    .then((filePath) => expect(filePath).toBe('/random/file/path'))
    .then(() => insertFileLocation(db, '/random/file/second/path', 'cat'))
    .then(() => selectFileLocation(db, 'cat'))
    .then((filePath) => expect(filePath).toBe('/random/file/second/path'))
})

test('Replace query', () => {
  return dbApi
    .dbInsert(db, 'REPLACE INTO PACKAGE (PATH, CRC) VALUES (?,?)', [
      'thePath',
      12,
    ])
    .then((rowId) => expect(rowId).toBeGreaterThan(0))
    .then(() =>
      dbApi.dbGet(db, 'SELECT CRC FROM PACKAGE WHERE PATH = ?', ['thePath'])
    )
    .then((result) => expect(result.CRC).toBe(12))
    .then(() =>
      dbApi.dbInsert(db, 'REPLACE INTO PACKAGE (PATH, CRC) VALUES (?,?)', [
        'thePath',
        13,
      ])
    )
    .then((rowId) => expect(rowId).toBeGreaterThan(0))
    .then(() =>
      dbApi.dbGet(db, 'SELECT CRC FROM PACKAGE WHERE PATH = ?', ['thePath'])
    )
    .then((result) => expect(result.CRC).toBe(13))
})

test('Simple cluster addition.', () => {
  return insertPathCrc(db, 'test', 1)
    .then((rowid) =>
      insertClusters(db, rowid, [
        {
          code: '0x1234',
          name: 'Test',
          description: 'Test cluster',
          define: 'TEST',
        },
      ])
    )
    .then((rowids) => selectAllClusters(db))
    .then(
      (rows) =>
        new Promise((resolve, reject) => {
          expect(rows.length).toBe(1)
          let rowid = rows[0].id
          expect(rows[0].code).toBe('0x1234')
          expect(rows[0].label).toBe('Test')
          resolve(rowid)
        })
    )
    .then((rowid) => selectClusterById(db, rowid))
    .then(
      (row) =>
        new Promise((resolve, reject) => {
          expect(row.code).toBe('0x1234')
          expect(row.label).toBe('Test')
          resolve(row.id)
        })
    )
    .then((rowid) => {
      selectAttributesByClusterId(db, rowid)
        .then((rows) => {
          expect(rows.length).toBe(0)
        })
        .then(() => selectCommandsByClusterId(db, rowid))
        .then((rows) => {
          expect(rows.length).toBe(0)
        })
    })
})

test('Now actually load the static data.', () => {
  return loadZcl(db, zclPropertiesFile)
}, 5000)

describe('Session specific queries', () => {
  beforeAll(() => {
    return ensureZapSessionId(db, 'SESSION', 666).then((id) => {
      sid = id
    })
  })

  test('Test some attribute queries.', () => {
    return getSessionInfoFromWindowId(db, 666).then((data) => {
      expect(data.sessionId).toBe(sid)
    })
  })

  test('Random key value queries', () => {
    return updateKeyValue(db, sid, 'key1', 'value1')
      .then(() => getSessionKeyValue(db, sid, 'key1'))
      .then((value) => {
        expect(value).toBe('value1')
      })
      .then(() => updateKeyValue(db, sid, 'key1', 'value2'))
      .then(() => getSessionKeyValue(db, sid, 'key1'))
      .then((value) => {
        expect(value).toBe('value2')
      })
      .then(() => getSessionKeyValue(db, sid, 'nonexistent'))
      .then((value) => {
        expect(value).toBeUndefined()
      })
  })

  test('Make sure session is dirty', () => {
    var sid
    return getSessionInfoFromWindowId(db, 666)
      .then((data) => {
        sid = data.sessionId
        return getSessionDirtyFlag(db, sid)
      })
      .then((result) => {
        expect(result).toBeTruthy()
      })
      .then(() => setSessionClean(db, sid))
      .then(() => getSessionDirtyFlag(db, sid))
      .then((result) => {
        expect(result).toBeFalsy()
      })
  })

  test('Make sure triggers work', () => {
    var sid
    var endpointTypeId
    return getSessionInfoFromWindowId(db, 666)
      .then((data) => {
        sid = data.sessionId
        return getSessionDirtyFlag(db, sid)
      })
      .then((result) => {
        expect(result).toBeFalsy()
      })
      .then(() => insertEndpointType(db, sid, 'Test endpoint'))
      .then((id) => {
        endpointTypeId = id
        return getSessionDirtyFlag(db, sid)
      })
      .then((result) => {
        expect(result).toBeTruthy()
      })
      .then(() => getAllEndpointTypes(db, sid))
      .then((rows) => {
        expect(rows.length).toBe(1)
      })
      .then(() => setSessionClean(db, sid))
      .then(() => getSessionDirtyFlag(db, sid))
      .then((result) => {
        expect(result).toBeFalsy()
      })
      .then(() => deleteEndpointType(db, endpointTypeId))
      .then(() => getSessionDirtyFlag(db, sid))
      .then((result) => {
        expect(result).toBeTruthy()
      })
  }, 2000)

  test('Test key values', () => {
    var sid
    return getSessionInfoFromWindowId(db, 666)
      .then((data) => {
        sid = data.sessionId
        return updateKeyValue(db, sid, 'testKey', 'testValue')
      })
      .then(() => getSessionKeyValue(db, sid, 'testKey'))
      .then((value) => {
        expect(value).toBe('testValue')
      })
  })

  test('Test state creation', () => {
    var sid
    var endpointTypeId
    return getSessionInfoFromWindowId(db, 666)
      .then((data) => {
        sid = data.sessionId
        return insertEndpointType(db, sid, 'Test endpoint')
      })
      .then((id) => {
        endpointTypeId = id
      })
      .then(() => createStateFromDatabase(db, sid))
      .then((state) => {
        expect(state.creator).toBe('zap')
        expect(state.writeTime).toBeTruthy()
        expect(state.keyValuePairs.length).toBe(2)
        expect(state.keyValuePairs[0].key).toBe('key1')
        expect(state.keyValuePairs[0].value).toBe('value2')
        expect(state.keyValuePairs[1].key).toBe('testKey')
        expect(state.keyValuePairs[1].value).toBe('testValue')
        expect(state.endpointTypes.length).toBe(1)
        expect(state.endpointTypes[0].name).toBe('Test endpoint')
        expect(state.endpointTypes[0].clusters.length).toBe(0)
        expect(state.endpointTypes[0].attributes.length).toBe(0)
        expect(state.endpointTypes[0].commands.length).toBe(0)
      })
  })

  test('Empty delete', () => {
    return deleteEndpoint(db, 123).then((data) => {
      expect(data).toBe(0)
    })
  })
})
describe('Endpoint Type Config Queries', () => {
  beforeAll(() => {
    return ensureZapSessionId(db, 'SESSION', 666).then((id) => {
      sid = id
    })
  })
  var endpointTypeIdOnOff
  var haOnOffDeviceType, zllOnOffLightDevice

  test('Insert EndpointType and test various states', () => {
    return QueryZcl.selectAllDeviceTypes(db).then((rows) => {
      let haOnOffDeviceTypeArray = rows.filter(
        (data) => data.label === 'HA-onoff'
      )
      let zllOnOffLightDeviceTypeArray = rows.filter(
        (data) => data.label === 'ZLL-onofflight'
      )
      expect(haOnOffDeviceTypeArray.length > 0).toBeTruthy()
      expect(zllOnOffLightDeviceTypeArray.length > 0).toBeTruthy()
      haOnOffDeviceType = haOnOffDeviceTypeArray[0]
      zllOnOffLightDevice = zllOnOffLightDeviceTypeArray[0]
      expect(typeof haOnOffDeviceType).toBe('object')
      expect(typeof zllOnOffLightDevice).toBe('object')
      return Promise.resolve()
    })
  })

  test('Insert Endpoint Type', () => {
    return QueryConfig.insertEndpointType(
      db,
      sid,
      'testEndpointType',
      haOnOffDeviceType.id
    )
      .then((rowId) => {
        endpointTypeIdOnOff = rowId
        return QueryZcl.selectEndpointType(db, rowId)
      })
      .then((endpointType) => {
        expect(endpointType.deviceTypeRef).toBe(haOnOffDeviceType.id)
        expect(endpointType.name).toBe('testEndpointType')
      })
  })

  test('Test get all cluster states', () => {
    return QueryConfig.getAllEndpointTypeClusterState(db, endpointTypeIdOnOff)
      .then((clusters) => {
        expect(clusters.length).toBe(6)
        return Promise.resolve()
      })
      .then(() => {
        return QueryConfig.insertOrReplaceClusterState(
          db,
          endpointTypeIdOnOff,
          7,
          'CLIENT',
          true
        )
          .then((rowId) => {
            expect(typeof rowId).toBe('number')
          })
          .then(() => {
            return QueryConfig.getAllEndpointTypeClusterState(
              db,
              endpointTypeIdOnOff
            )
          })
          .then((clusters) => {
            expect(clusters.length).toBe(7)
            return Promise.resolve()
          })
      })
  })

  test('Test get all attribute states', () => {
    return QueryConfig.getEndpointTypeAttributes(db, endpointTypeIdOnOff).then(
      (attributes) => {
        expect(attributes.length).toBe(10)
      }
    )
  })

  test('Get all cluster commands', () => {
    return QueryConfig.getEndpointTypeCommands(db, endpointTypeIdOnOff).then(
      (commands) => {
        expect(commands.length).toBe(6)
      }
    )
  })

  test('Delete Endpoint Type', () => {
    return QueryConfig.deleteEndpointType(db, endpointTypeIdOnOff)
      .then(QueryConfig.deleteEndpointTypeData(db, endpointTypeIdOnOff))
      .then(QueryConfig.getAllEndpointTypeClusterState(db, endpointTypeIdOnOff))
      .then((clusters) => {
        expect(clusters.length).toBe(undefined)
        return Promise.resolve()
      })
  })
})
