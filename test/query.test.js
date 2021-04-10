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
const queryLoader = require('../src-electron/db/query-loader.js')
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
const testUtil = require('./test-util.js')
const restApi = require('../src-shared/rest-api.js')
const queryImpexp = require('../src-electron/db/query-impexp.js')

/*
 * Created Date: Friday, March 13th 2020, 7:44:12 pm
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */

let db
let sid
let pkgId

beforeAll(() => {
  let file = env.sqliteTestFile('query')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
    })
}, 5000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})

test('Path CRC queries.', () => {
  let path = '/some/random/path'
  let crc = 42
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
    .then((filePath) => expect(filePath).toBe('/random/file/second/path'))
    .then(() => queryGeneric.selectFileLocation(db, 'errorTesting'))
    .then((filePath) => expect(filePath).toBe('')))

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
  let pkgId = null
  let rowid = null
  return queryPackage
    .insertPathCrc(db, 'test', 1)
    .then((rowid) => {
      pkgId = rowid
      return queryLoader.insertClusters(db, rowid, [
        {
          code: 0x1234,
          name: 'Test',
          description: 'Test cluster',
          define: 'TEST',
        },
      ])
    })
    .then((rowids) => queryZcl.selectAllClusters(db, pkgId))
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
    .then(() => queryZcl.selectAttributesByClusterId(db, rowid, pkgId))
    .then((rows) => {
      expect(rows.length).toBe(0)
    })
    .then(() => queryZcl.selectCommandsByClusterId(db, rowid, pkgId))
    .then((rows) => {
      expect(rows.length).toBe(0)
    })
})

test(
  'Now actually load the static data.',
  () => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile),
  5000
)

test('Now load the generation data.', () =>
  generationEngine.loadTemplates(db, testUtil.testZigbeeGenerationTemplates))

describe('Session specific queries', () => {
  beforeAll(() =>
    querySession
      .ensureZapUserAndSession(db, 'USER', 'SESSION')
      .then((userSession) => {
        sid = userSession.sessionId
        return util.initializeSessionPackage(db, sid, {
          zcl: env.builtinSilabsZclMetafile,
          template: env.builtinTemplateMetafile,
        })
      })
  )

  test('Test that package id for session is present.', () =>
    queryPackage
      .getSessionPackages(db, sid)
      .then((ids) => expect(ids.length).toBe(2))) // One for zclpropertie and one for gen template

  test('Test that ZCL package id for session is preset.', () =>
    queryPackage
      .getSessionZclPackages(db, sid)
      .then((packages) => expect(packages.length).toBe(1))) // One for zclpropertie

  test('Random key value queries', async () => {
    await querySession.updateSessionKeyValue(db, sid, 'key1', 'value1')
    let value = await querySession.getSessionKeyValue(db, sid, 'key1')
    expect(value).toBe('value1')
    await querySession.updateSessionKeyValue(db, sid, 'key1', 'value2')
    value = await querySession.getSessionKeyValue(db, sid, 'key1')
    expect(value).toBe('value2')
    value = await querySession.getSessionKeyValue(db, sid, 'nonexistent')
    expect(value).toBeUndefined()
  })

  test('Make sure session is dirty', async () => {
    let result = await querySession.getSessionDirtyFlag(db, sid)
    expect(result).toBeTruthy()
    await querySession.setSessionClean(db, sid)
    result = await querySession.getSessionDirtyFlag(db, sid)
    expect(result).toBeFalsy()
  })

  test('Make sure triggers work', () => {
    let endpointTypeId
    return querySession
      .getSessionDirtyFlag(db, sid)
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
    return querySession
      .updateSessionKeyValue(db, sid, 'testKey', 'testValue')
      .then(() => querySession.getSessionKeyValue(db, sid, 'testKey'))
      .then((value) => {
        expect(value).toBe('testValue')
      })
  })

  test('Test state creation', () => {
    let endpointTypeId
    return queryConfig
      .insertEndpointType(db, sid, 'Test endpoint')
      .then((id) => {
        endpointTypeId = id
      })
      .then(() => exportJs.createStateFromDatabase(db, sid))
      .then((state) => {
        expect(state.creator).toBe('zap')
        expect(state.keyValuePairs.length).toBe(5)
        expect(state.keyValuePairs[0].key).toBe('commandDiscovery')
        expect(state.keyValuePairs[0].value).toBe('1')
        expect(state.keyValuePairs[1].key).toBe(
          dbEnum.sessionOption.defaultResponsePolicy
        )
        expect(state.keyValuePairs[1].value).toBe('always')
        expect(state.keyValuePairs[2].key).toBe('key1')
        expect(state.keyValuePairs[2].value).toBe('value2')
        expect(state.keyValuePairs[4].key).toBe('testKey')
        expect(state.keyValuePairs[4].value).toBe('testValue')
        expect(state.endpointTypes.length).toBe(1)
        expect(state.endpointTypes[0].name).toBe('Test endpoint')
        expect(state.endpointTypes[0].clusters.length).toBe(0)
        expect(state.package.length).toBe(2)
        let zclIndex
        let genIndex
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
    querySession
      .ensureZapUserAndSession(db, 'USER', 'SESSION', { sessionId: sid })
      .then((userSession) => {
        sid = userSession.sessionId
      })
      .then(() =>
        queryPackage.getSessionPackagesByType(
          db,
          sid,
          dbEnum.packageType.zclProperties
        )
      )
      .then((packages) => {
        pkgId = packages[0].id
      })
  )
  let endpointTypeIdOnOff
  let levelControlCluster
  let haOnOffDeviceType, zllOnOffLightDevice

  test('Insert EndpointType and test various states', () =>
    queryZcl.selectAllDeviceTypes(db, pkgId).then((rows) => {
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
        .then(() => queryZcl.selectAllClusters(db, pkgId))
        .then((allClusters) => {
          levelControlCluster = allClusters.find((a) => {
            return a.code == 8
          })
          return queryConfig.insertOrReplaceClusterState(
            db,
            endpointTypeIdOnOff,
            levelControlCluster.id,
            'CLIENT',
            true
          )
        })
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
  test('Test Enpoint ID related query', () => {
    let clusterRef = 0
    let attributeRef = 0
    let attributeDefaultValue = 0
    return queryZcl
      .selectEndpointTypeClustersByEndpointTypeId(db, endpointTypeIdOnOff)
      .then((x) => {
        expect(x.length).toBe(7)
        x.forEach((element) => {
          if (element.side == 'server' && clusterRef == 0) {
            clusterRef = element.clusterRef
          }
        })
        expect(clusterRef == 0).toBeFalsy()
      })
      .then(() =>
        queryZcl.selectEndpointTypeAttributesByEndpointId(
          db,
          endpointTypeIdOnOff
        )
      )
      .then((x) => {
        expect(x.length).toBe(10)
        x.forEach((element) => {
          if (element.clusterRef == clusterRef && attributeRef == 0) {
            attributeRef = element.attributeRef
            attributeDefaultValue = element.defaultValue
          }
        })
        expect(attributeRef == 0).toBeFalsy()
      })
      .then(() =>
        queryZcl.selectEndpointTypeAttribute(
          db,
          endpointTypeIdOnOff,
          attributeRef,
          clusterRef
        )
      )
      .then((x) => expect(x.defaultValue).toBe(attributeDefaultValue))
      .then(() =>
        queryZcl.selectEndpointTypeCommandsByEndpointId(db, endpointTypeIdOnOff)
      )
      .then((x) => expect(x.length).toBe(6))
  })
  test('Get all cluster names', () => {
    let expectedNames = ['Basic', 'Identify', 'Level Control', 'On/off']
    return queryImpexp.exportEndPointTypeIds(db, sid).then((endpointTypes) =>
      queryZcl
        .exportAllClustersNamesFromEndpointTypes(db, endpointTypes)
        .then((names) => {
          expect(names.length).toBe(4)
          names.forEach((element) => {
            expect(expectedNames.includes(element.name)).toBeTruthy()
          })
        })
    )
  })

  test('Set additional attributes and commands when cluster state is inserted', () => {
    return queryConfig
      .insertOrReplaceClusterState(
        db,
        endpointTypeIdOnOff,
        levelControlCluster.id,
        'CLIENT',
        true
      )
      .then(() =>
        queryConfig.insertClusterDefaults(db, endpointTypeIdOnOff, {
          clusterRef: levelControlCluster.id,
          side: 'CLIENT',
        })
      )
      .then(() =>
        queryConfig
          .getEndpointTypeAttributes(db, endpointTypeIdOnOff)
          .then((attributes) => {
            expect(attributes.length).toBe(13)
          })
      )
  })

  test('Insert Endpoint Test', () =>
    queryConfig
      .insertEndpoint(db, sid, 4, endpointTypeIdOnOff, 9)
      .then((rowId) => {
        return queryConfig.selectEndpoint(db, rowId)
      })
      .then((endpoint) => {
        expect(endpoint.endpointId).toBe(4)
        expect(endpoint.profileId).toBe(260)
        expect(endpoint.networkId).toBe(9)
        expect(endpoint.endpointTypeRef).toBe(endpointTypeIdOnOff)
      }))

  test('Test session report', () =>
    util.sessionReport(db, sid).then((report) => {
      expect(report.includes('Endpoint: Test endpoint')).toBeTruthy()
      expect(report.includes('0x0000: cluster: Basic (server)')).toBeTruthy()
      expect(
        report.includes('0x0000: attribute: ZCL version [int8u]')
      ).toBeTruthy()
      expect(
        report.includes('0x0007: attribute: power source [enum8]')
      ).toBeTruthy()
      expect(report.includes('0x0006: cluster: On/off (client)')).toBeTruthy()
      expect(report.includes('0x0030: cluster: On/off')).toBeFalsy()
      expect(report.includes('0x00: command: MoveToLevel')).toBeTruthy()
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
    let pkgId = null
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

test('Test Rest Key to DB Column Test', () => {
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.endpointId)
  ).toEqual('ENDPOINT_IDENTIFIER')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.endpointType)
  ).toEqual('ENDPOINT_TYPE_REF')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.networkId)
  ).toEqual('NETWORK_IDENTIFIER')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.deviceTypeRef)
  ).toEqual('DEVICE_TYPE_REF')
  expect(queryConfig.convertRestKeyToDbColumn(restApi.updateKey.name)).toEqual(
    'NAME'
  )
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeSelected)
  ).toEqual('INCLUDED')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeSingleton)
  ).toEqual('SINGLETON')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeBounded)
  ).toEqual('BOUNDED')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeDefault)
  ).toEqual('DEFAULT_VALUE')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeReporting)
  ).toEqual('INCLUDED_REPORTABLE')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeReportMin)
  ).toEqual('MIN_INTERVAL')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeReportMax)
  ).toEqual('MAX_INTERVAL')
  expect(
    queryConfig.convertRestKeyToDbColumn(
      restApi.updateKey.attributeReportChange
    )
  ).toEqual('REPORTABLE_CHANGE')
  expect(
    queryConfig.convertRestKeyToDbColumn(restApi.updateKey.attributeStorage)
  ).toEqual('STORAGE_OPTION')
})

test('Test determineType', () => {
  return queryZcl
    .determineType(db, 'patate', pkgId)
    .then((type) => expect(type).toEqual(dbEnum.zclType.unknown))
    .then(() => queryZcl.determineType(db, 'Status', pkgId))
    .then((type) => expect(type).toEqual(dbEnum.zclType.enum))
    .then(() => queryZcl.determineType(db, 'Protocol', pkgId))
    .then((type) => expect(type).toEqual(dbEnum.zclType.struct))
    .then(() => queryZcl.determineType(db, 'CO2TrailingDigit', pkgId))
    .then((type) => expect(type).toEqual(dbEnum.zclType.bitmap))
    .then(() => queryZcl.determineType(db, 'int8u', pkgId))
    .then((type) => expect(type).toEqual(dbEnum.zclType.atomic))
})
