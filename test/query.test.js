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
const dbApi = require('../src-electron/db/db-api.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const { zclPropertiesFile } = require('../src-electron/main-process/args.js')
const queryConfig = require('../src-electron/db/query-config.js')
const {
  logInfo,
  schemaFile,
  sqliteTestFile,
  zapVersion,
} = require('../src-electron/util/env.js')
const {
  insertFileLocation,
  selectFileLocation,
} = require('../src-electron/db/query-generic.js')
const {
  getPathCrc,
  insertPathCrc,
} = require('../src-electron/db/query-package.js')
const {
  ensureZapSessionId,
  setSessionClean,
  getSessionInfoFromWindowId,
  getSessionDirtyFlag,
} = require('../src-electron/db/query-session.js')
const { loadZcl } = require('../src-electron/zcl/zcl-loader.js')

const {
  createStateFromDatabase,
} = require('../src-electron/importexport/export.js')

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
    .then((d) => dbApi.loadSchema(d, schemaFile(), zapVersion()))
    .then((d) => {
      db = d
      logInfo('DB initialized.')
    })
}, 5000)

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
      queryZcl.insertClusters(db, rowid, [
        {
          code: '0x1234',
          name: 'Test',
          description: 'Test cluster',
          define: 'TEST',
        },
      ])
    )
    .then((rowids) => queryZcl.selectAllClusters(db))
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
    .then((rowid) => queryZcl.selectClusterById(db, rowid))
    .then(
      (row) =>
        new Promise((resolve, reject) => {
          expect(row.code).toBe('0x1234')
          expect(row.label).toBe('Test')
          resolve(row.id)
        })
    )
    .then((rowid) => {
      queryZcl
        .selectAttributesByClusterId(db, rowid)
        .then((rows) => {
          expect(rows.length).toBe(0)
        })
        .then(() => queryZcl.selectCommandsByClusterId(db, rowid))
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
    return queryConfig
      .updateKeyValue(db, sid, 'key1', 'value1')
      .then(() => queryConfig.getSessionKeyValue(db, sid, 'key1'))
      .then((value) => {
        expect(value).toBe('value1')
      })
      .then(() => queryConfig.updateKeyValue(db, sid, 'key1', 'value2'))
      .then(() => queryConfig.getSessionKeyValue(db, sid, 'key1'))
      .then((value) => {
        expect(value).toBe('value2')
      })
      .then(() => queryConfig.getSessionKeyValue(db, sid, 'nonexistent'))
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
      .then(() => queryConfig.insertEndpointType(db, sid, 'Test endpoint'))
      .then((id) => {
        endpointTypeId = id
        return getSessionDirtyFlag(db, sid)
      })
      .then((result) => {
        expect(result).toBeTruthy()
      })
      .then(() => queryConfig.getAllEndpointTypes(db, sid))
      .then((rows) => {
        expect(rows.length).toBe(1)
      })
      .then(() => setSessionClean(db, sid))
      .then(() => getSessionDirtyFlag(db, sid))
      .then((result) => {
        expect(result).toBeFalsy()
      })
      .then(() => queryConfig.deleteEndpointType(db, endpointTypeId))
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
        return queryConfig.updateKeyValue(db, sid, 'testKey', 'testValue')
      })
      .then(() => queryConfig.getSessionKeyValue(db, sid, 'testKey'))
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
        return queryConfig.insertEndpointType(db, sid, 'Test endpoint')
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
    return queryConfig.deleteEndpoint(db, 123).then((data) => {
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
    return queryZcl.selectAllDeviceTypes(db).then((rows) => {
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
    return queryConfig
      .insertEndpointType(db, sid, 'testEndpointType', haOnOffDeviceType.id)
      .then((rowId) => {
        endpointTypeIdOnOff = rowId
        return queryZcl.selectEndpointType(db, rowId)
      })
      .then((endpointType) => {
        expect(endpointType.deviceTypeRef).toBe(haOnOffDeviceType.id)
        expect(endpointType.name).toBe('testEndpointType')
      })
  })

  test('Test get all cluster states', () => {
    return queryConfig
      .getAllEndpointTypeClusterState(db, endpointTypeIdOnOff)
      .then((clusters) => {
        expect(clusters.length).toBe(6)
        return Promise.resolve()
      })
      .then(() => {
        return queryConfig
          .insertOrReplaceClusterState(
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
            return queryConfig.getAllEndpointTypeClusterState(
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
    return queryConfig
      .getEndpointTypeAttributes(db, endpointTypeIdOnOff)
      .then((attributes) => {
        expect(attributes.length).toBe(10)
      })
  })

  test('Get all cluster commands', () => {
    return queryConfig
      .getEndpointTypeCommands(db, endpointTypeIdOnOff)
      .then((commands) => {
        expect(commands.length).toBe(6)
      })
  })

  test('Insert Endpoint Test', () => {
    return queryConfig
      .insertEndpoint(db, sid, 4, endpointTypeIdOnOff, 9)
      .then((rowId) => {
        return queryConfig.selectEndpoint(db, rowId)
      })
      .then((endpoint) => {
        expect(endpoint.endpointId).toBe(4)
        expect(endpoint.profileId).toBe('0x0104')
        expect(endpoint.networkId).toBe(9)
        expect(endpoint.endpointTypeRef).toBe(endpointTypeIdOnOff)
      })
  })

  test('Delete Endpoint Type', () => {
    return queryConfig
      .deleteEndpointType(db, endpointTypeIdOnOff)
      .then(queryConfig.getAllEndpointTypeClusterState(db, endpointTypeIdOnOff))
      .then((clusters) => {
        expect(clusters.length).toBe(undefined)
        return Promise.resolve()
      })
  })
})
