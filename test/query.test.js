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
const args = require('../src-electron/util/args.js')
const queryConfig = require('../src-electron/db/query-config.js')
const env = require('../src-electron/util/env.js')
const util = require('../src-electron/util/util.js')
const queryGeneric = require('../src-electron/db/query-generic.js')
const queryPackage = require('../src-electron/db/query-package.js')
const querySession = require('../src-electron/db/query-session.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const exportJs = require('../src-electron/importexport/export.js')
const dbEnum = require('../src-shared/db-enum.js')
const generationEngine = require('../src-electron/generator/generation-engine.js')

/*
 * Created Date: Friday, March 13th 2020, 7:44:12 pm
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */

var db
var sid

beforeAll(() => {
  var file = env.sqliteTestFile('query')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo('DB initialized.')
    })
}, 5000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})

test('Path CRC queries.', () => {
  var path = '/some/random/path'
  var crc = 42
  return queryPackage
    .insertPathCrc(db, path, crc)
    .then((rowid) => queryPackage.getPathCrc(db, path))
    .then((c) => expect(c).toBe(crc))
})

test('File location queries.', () =>
  queryGeneric
    .insertFileLocation(db, '/random/file/path', 'cat')
    .then(() => queryGeneric.selectFileLocation(db, 'cat'))
    .then((filePath) => expect(filePath).toBe('/random/file/path'))
    .then(() =>
      queryGeneric.insertFileLocation(db, '/random/file/second/path', 'cat')
    )
    .then(() => queryGeneric.selectFileLocation(db, 'cat'))
    .then((filePath) => expect(filePath).toBe('/random/file/second/path')))

test('Replace query', () =>
  dbApi
    .dbInsert(
      db,
      'REPLACE INTO SETTING (CATEGORY, KEY, VALUE) VALUES (?,?,?)',
      ['cat', 'key', 12]
    )
    .then((rowId) => expect(rowId).toBeGreaterThan(0))
    .then(() =>
      dbApi.dbGet(
        db,
        'SELECT VALUE FROM SETTING WHERE CATEGORY = ? AND KEY = ?',
        ['cat', 'key']
      )
    )
    .then((result) => expect(result.VALUE).toBe('12'))
    .then(() =>
      dbApi.dbInsert(
        db,
        'REPLACE INTO SETTING (CATEGORY, KEY, VALUE) VALUES (?,?,?)',
        ['cat', 'key', 13]
      )
    )
    .then((rowId) => expect(rowId).toBeGreaterThan(0))
    .then(() =>
      dbApi.dbGet(
        db,
        'SELECT VALUE FROM SETTING WHERE CATEGORY = ? AND KEY = ?',
        ['cat', 'key']
      )
    )
    .then((result) => expect(result.VALUE).toBe('13')))

test('Simple cluster addition.', () => {
  let rowid = null
  return queryPackage
    .insertPathCrc(db, 'test', 1)
    .then((rowid) =>
      queryZcl.insertClusters(db, rowid, [
        {
          code: 0x1234,
          name: 'Test',
          description: 'Test cluster',
          define: 'TEST',
        },
      ])
    )
    .then((rowids) => queryZcl.selectAllClusters(db))
    .then((rows) => {
      expect(rows.length).toBe(1)
      rowid = rows[0].id
      expect(rows[0].code).toBe(4660), expect(rows[0].label).toBe('Test')
      return rowid
    })
    .then((rowid) => queryZcl.selectClusterById(db, rowid))
    .then((row) => {
      expect(row.code).toBe(4660)
      expect(row.label).toBe('Test')
      return row.id
    })
    .then(() => queryZcl.selectAttributesByClusterId(db, rowid))
    .then((rows) => {
      expect(rows.length).toBe(0)
    })
    .then(() => queryZcl.selectCommandsByClusterId(db, rowid))
    .then((rows) => {
      expect(rows.length).toBe(0)
    })
})

test(
  'Now actually load the static data.',
  () => zclLoader.loadZcl(db, args.zclPropertiesFile),
  5000
)

test('Now load the generation data.', () =>
  generationEngine.loadTemplates(db, args.genTemplateJsonFile))

describe('Session specific queries', () => {
  beforeAll(() =>
    querySession
      .ensureZapSessionId(db, 'SESSION', 666)
      .then((id) => util.initializeSessionPackage(db, id))
      .then((id) => {
        sid = id
      })
  )

  test('Test that package id for session is preset.', () =>
    queryPackage
      .getSessionPackageIds(db, sid)
      .then((ids) => expect(ids.length).toBe(2))) // One for zclpropertie and one for gen template

  test('Test some attribute queries.', () =>
    querySession.getSessionInfoFromSessionKey(db, 'SESSION').then((data) => {
      expect(data.sessionId).toBe(sid)
    }))

  test('Random key value queries', () =>
    queryConfig
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
      }))

  test('Make sure session is dirty', () => {
    var sid
    return querySession
      .getSessionInfoFromSessionKey(db, 'SESSION')
      .then((data) => {
        sid = data.sessionId
        return querySession.getSessionDirtyFlag(db, sid)
      })
      .then((result) => {
        expect(result).toBeTruthy()
      })
      .then(() => querySession.setSessionClean(db, sid))
      .then(() => querySession.getSessionDirtyFlag(db, sid))
      .then((result) => {
        expect(result).toBeFalsy()
      })
  })

  test('Make sure triggers work', () => {
    var sid
    var endpointTypeId
    return querySession
      .getSessionInfoFromSessionKey(db, 'SESSION')
      .then((data) => {
        sid = data.sessionId
        return querySession.getSessionDirtyFlag(db, sid)
      })
      .then((result) => {
        expect(result).toBeFalsy()
      })
      .then(() => queryConfig.insertEndpointType(db, sid, 'Test endpoint'))
      .then((id) => {
        endpointTypeId = id
        return querySession.getSessionDirtyFlag(db, sid)
      })
      .then((result) => {
        expect(result).toBeTruthy()
      })
      .then(() => queryConfig.getAllEndpointTypes(db, sid))
      .then((rows) => {
        expect(rows.length).toBe(1)
      })
      .then(() => querySession.setSessionClean(db, sid))
      .then(() => querySession.getSessionDirtyFlag(db, sid))
      .then((result) => {
        expect(result).toBeFalsy()
      })
      .then(() => queryConfig.deleteEndpointType(db, endpointTypeId))
      .then(() => querySession.getSessionDirtyFlag(db, sid))
      .then((result) => {
        expect(result).toBeTruthy()
      })
  }, 2000)

  test('Test key values', () => {
    var sid
    return querySession
      .getSessionInfoFromSessionKey(db, 'SESSION')
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
    return querySession
      .getSessionInfoFromSessionKey(db, 'SESSION')
      .then((data) => {
        sid = data.sessionId
        return queryConfig.insertEndpointType(db, sid, 'Test endpoint')
      })
      .then((id) => {
        endpointTypeId = id
      })
      .then(() => exportJs.createStateFromDatabase(db, sid))
      .then((state) => {
        expect(state.creator).toBe('zap')
        expect(state.writeTime).toBeTruthy()
        expect(state.keyValuePairs.length).toBe(5)
        expect(state.keyValuePairs[0].key).toBe('commandDiscovery')
        expect(state.keyValuePairs[0].value).toBe('1')
        expect(state.keyValuePairs[1].key).toBe('defaultResponsePolicy')
        expect(state.keyValuePairs[1].value).toBe('always')
        expect(state.keyValuePairs[2].key).toBe('key1')
        expect(state.keyValuePairs[2].value).toBe('value2')
        expect(state.keyValuePairs[4].key).toBe('testKey')
        expect(state.keyValuePairs[4].value).toBe('testValue')
        expect(state.endpointTypes.length).toBe(1)
        expect(state.endpointTypes[0].name).toBe('Test endpoint')
        expect(state.endpointTypes[0].clusters.length).toBe(0)
        expect(state.package.length).toBe(2)
        var zclIndex
        var genIndex
        if (state.package[0].type === dbEnum.packageType.zclProperties) {
          zclIndex = 0
          genIndex = 1
        } else {
          zclIndex = 1
          genIndex = 0
        }
        expect(state.package[zclIndex].type).toBe(
          dbEnum.packageType.zclProperties
        )
        expect(state.package[zclIndex].version).toBe('ZCL Test Data')
        expect(state.package[genIndex].type).toBe(
          dbEnum.packageType.genTemplatesJson
        )
        expect(state.package[genIndex].version).toBe('test-v1')
      })
  })

  test('Empty delete', () =>
    queryConfig.deleteEndpoint(db, 123).then((data) => {
      expect(data).toBe(0)
    }))
})

describe('Endpoint Type Config Queries', () => {
  beforeAll(() =>
    querySession.ensureZapSessionId(db, 'SESSION', 666).then((id) => {
      sid = id
    })
  )
  var endpointTypeIdOnOff
  var haOnOffDeviceType, zllOnOffLightDevice

  test('Insert EndpointType and test various states', () =>
    queryZcl.selectAllDeviceTypes(db).then((rows) => {
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
    }))
  test('Insert Endpoint Type', () =>
    queryConfig
      .insertEndpointType(db, sid, 'testEndpointType', haOnOffDeviceType.id)
      .then((rowId) => {
        endpointTypeIdOnOff = rowId
        return queryZcl.selectEndpointType(db, rowId)
      })
      .then((endpointType) => {
        expect(endpointType.deviceTypeRef).toBe(haOnOffDeviceType.id)
        expect(endpointType.name).toBe('testEndpointType')
      }))

  test(
    'Test get all cluster states',
    () =>
      queryConfig
        .getAllEndpointTypeClusterState(db, endpointTypeIdOnOff)
        .then((clusters) => {
          expect(clusters.length).toBe(6)
        })
        .then(() =>
          queryConfig.insertOrReplaceClusterState(
            db,
            endpointTypeIdOnOff,
            7,
            'CLIENT',
            true
          )
        )
        .then((rowId) => {
          expect(typeof rowId).toBe('number')
        })
        .then(() =>
          queryConfig.getAllEndpointTypeClusterState(db, endpointTypeIdOnOff)
        )
        .then((clusters) => {
          expect(clusters.length).toBe(7)
        }),
    3000
  )

  test('Test get all attribute states', () =>
    queryConfig
      .getEndpointTypeAttributes(db, endpointTypeIdOnOff)
      .then((attributes) => {
        expect(attributes.length).toBe(10)
      }))

  test('Get all cluster commands', () =>
    queryConfig
      .getEndpointTypeCommands(db, endpointTypeIdOnOff)
      .then((commands) => {
        expect(commands.length).toBe(6)
      }))

  test('Insert Endpoint Test', () =>
    queryConfig
      .insertEndpoint(db, sid, 4, endpointTypeIdOnOff, 9)
      .then((rowId) => {
        return queryConfig.selectEndpoint(db, rowId)
      })
      .then((endpoint) => {
        expect(endpoint.endpointId).toBe(4)
        expect(endpoint.profileId).toBe('0x0104')
        expect(endpoint.networkId).toBe(9)
        expect(endpoint.endpointTypeRef).toBe(endpointTypeIdOnOff)
      }))

  test('Delete Endpoint Type', () =>
    queryConfig
      .deleteEndpointType(db, endpointTypeIdOnOff)
      .then(queryConfig.getAllEndpointTypeClusterState(db, endpointTypeIdOnOff))
      .then((clusters) => {
        expect(clusters.length).toBe(undefined)
        return Promise.resolve()
      }))

  test('Test inserting and retrieving options', () => {
    var pkgId = null
    return queryPackage
      .insertPathCrc(db, 'junk', 123)
      .then((p) => {
        pkgId = p
        return queryPackage.insertOptionsKeyValues(db, pkgId, 'test', [
          '1',
          '2',
          '3',
        ])
      })
      .then(() => queryPackage.selectAllOptionsValues(db, pkgId, 'test'))
      .then((data) => {
        expect(data.length).toBe(3)
      })
  })
})
