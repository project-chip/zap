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

const dbApi = require('../src-electron/db/db-api')
const queryZcl = require('../src-electron/db/query-zcl')
const queryDeviceType = require('../src-electron/db/query-device-type')
const queryAttribute = require('../src-electron/db/query-attribute')
const queryCommand = require('../src-electron/db/query-command')
const queryEvent = require('../src-electron/db/query-event')
const queryLoader = require('../src-electron/db/query-loader')
const queryConfig = require('../src-electron/db/query-config')
const queryEndpointType = require('../src-electron/db/query-endpoint-type')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const queryPackage = require('../src-electron/db/query-package')
const querySession = require('../src-electron/db/query-session')
const querySessionZcl = require('../src-electron/db/query-session-zcl')

const env = require('../src-electron/util/env')
const util = require('../src-electron/util/util')
const zclUtil = require('../src-electron/util/zcl-util')

const zclLoader = require('../src-electron/zcl/zcl-loader')
const exportJs = require('../src-electron/importexport/export')
const dbEnum = require('../src-shared/db-enum')
const generationEngine = require('../src-electron/generator/generation-engine')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const restApi = require('../src-shared/rest-api')

/*
 * Created Date: Friday, March 13th 2020, 7:44:12 pm
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */

let db
let sid
let pkgId
let templatePkgId

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('query')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Dirty Flag Validation',
  async () => {
    let result = await querySession.getSessionDirtyFlag(db, sid)
    expect(result).toBeFalsy()
  },
  testUtil.timeout.short()
)

test(
  'Path CRC queries.',
  async () => {
    let path = '/some/random/path'
    let crc = 42
    await queryPackage.insertPathCrc(db, path, crc)
    let c = await queryPackage.getPathCrc(db, path)
    expect(c).toBe(crc)
  },
  testUtil.timeout.short()
)

test(
  'Replace query',
  async () => {
    let rowId = await dbApi.dbInsert(
      db,
      'REPLACE INTO SETTING (CATEGORY, KEY, VALUE) VALUES (?,?,?)',
      ['cat', 'key', 12]
    )
    expect(rowId).toBeGreaterThan(0)

    let result = await dbApi.dbGet(
      db,
      'SELECT VALUE FROM SETTING WHERE CATEGORY = ? AND KEY = ?',
      ['cat', 'key']
    )

    expect(result.VALUE).toBe('12')

    rowId = await dbApi.dbInsert(
      db,
      'REPLACE INTO SETTING (CATEGORY, KEY, VALUE) VALUES (?,?,?)',
      ['cat', 'key', 13]
    )

    expect(rowId).toBeGreaterThan(0)

    result = await dbApi.dbGet(
      db,
      'SELECT VALUE FROM SETTING WHERE CATEGORY = ? AND KEY = ?',
      ['cat', 'key']
    )

    expect(result.VALUE).toBe('13')
  },
  testUtil.timeout.short()
)

test(
  'Simple cluster addition.',
  async () => {
    let pkgId = null
    let rowid = await queryPackage.insertPathCrc(db, 'test', 1)

    pkgId = rowid
    await queryLoader.insertClusters(db, rowid, [
      {
        code: 0x1234,
        name: 'Test',
        description: 'Test cluster',
        define: 'TEST'
      }
    ])

    let rows = await queryZcl.selectAllClusters(db, pkgId)
    expect(rows.length).toBe(1)
    rowid = rows[0].id
    expect(rows[0].code).toBe(4660)
    expect(rows[0].label).toBe('Test')
    row = await queryZcl.selectClusterById(db, rowid)
    expect(row.code).toBe(4660)
    expect(row.label).toBe('Test')
    rows = await queryZcl.selectAttributesByClusterIdIncludingGlobal(
      db,
      rowid,
      pkgId
    )
    expect(rows.length).toBe(0)
    rows = await queryCommand.selectCommandsByClusterId(db, rowid, pkgId)
    expect(rows.length).toBe(0)
  },
  testUtil.timeout.short()
)

test(
  'Now actually load the static data.',
  () => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile()),
  testUtil.timeout.medium()
)

test(
  'Now load the generation data.',
  async () => {
    let x = await generationEngine.loadTemplates(
      db,
      testUtil.testTemplate.zigbee
    )
    templatePkgId = x.packageId
  },
  testUtil.timeout.medium()
)

describe('Session specific queries', () => {
  beforeAll(async () => {
    let userSession = await querySession.ensureZapUserAndSession(
      db,
      'USER',
      'SESSION'
    )
    sid = userSession.sessionId
    await util.ensurePackagesAndPopulateSessionOptions(
      db,
      sid,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: testUtil.testTemplate.zigbee
      },
      null,
      [templatePkgId]
    )
  }, testUtil.timeout.medium())

  test(
    'Test that package id for session is present.',
    () =>
      queryPackage
        .getSessionPackages(db, sid)
        .then((ids) => expect(ids.length).toBe(2)),
    testUtil.timeout.short()
  ) // One for zclpropertie and one for gen template

  test(
    'Test that Zigbee specific generator setting for session is present.',
    () =>
      queryPackage
        .getPackagesByType(db, dbEnum.packageType.genTemplatesJson)
        .then((packages) => {
          expect(packages.length).toBe(1)
          let pkgId = packages.shift().id

          queryPackage
            .selectAllOptionsValues(db, pkgId, 'generator')
            .then((generatorConfigurations) => {
              expect(generatorConfigurations.length).toBe(1)
              expect(generatorConfigurations[0].optionCode).toBe(
                'shareClusterStatesAcrossEndpoints'
              )
              expect(generatorConfigurations[0].optionLabel).toBe('true')
            })
        }),
    testUtil.timeout.short()
  )

  test(
    'Test that ZCL package id for session is present.',
    () =>
      queryPackage
        .getSessionZclPackages(db, sid)
        .then((packages) => expect(packages.length).toBe(1)),
    testUtil.timeout.short()
  ) // One for zclpropertie

  test(
    'Random key value queries',
    async () => {
      await querySession.updateSessionKeyValue(db, sid, 'key1', 'value1')
      let value = await querySession.getSessionKeyValue(db, sid, 'key1')
      expect(value).toBe('value1')
      await querySession.updateSessionKeyValue(db, sid, 'key1', 'value2')
      value = await querySession.getSessionKeyValue(db, sid, 'key1')
      expect(value).toBe('value2')
      value = await querySession.getSessionKeyValue(db, sid, 'nonexistent')
      expect(value).toBeUndefined()
    },
    testUtil.timeout.short()
  )

  test(
    'Make sure session is dirty',
    async () => {
      let result = await querySession.getSessionDirtyFlag(db, sid)
      expect(result).toBeTruthy()
      await querySession.setSessionClean(db, sid)
      result = await querySession.getSessionDirtyFlag(db, sid)
      expect(result).toBeFalsy()
    },
    testUtil.timeout.short()
  )

  test(
    'Make sure triggers work',
    async () => {
      let result = await querySession.getSessionDirtyFlag(db, sid)
      expect(result).toBeFalsy()
      let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
      pkgId = ctx.packageId
      let dts = await queryDeviceType.selectAllDeviceTypes(db, pkgId)
      let haOnOffDeviceTypeArray = dts.filter(
        (data) => data.label === 'HA-onoff'
      )
      let haOnOffDeviceType = haOnOffDeviceTypeArray[0]
      let deviceTypeId = haOnOffDeviceType.id
      let allSessionPartitions =
        await querySession.getAllSessionPartitionInfoForSession(db, sid)
      let endpointTypeId = await queryConfig.insertEndpointType(
        db,
        allSessionPartitions[0],
        'Test endpoint',
        deviceTypeId,
        haOnOffDeviceType.code,
        0,
        true
      )
      result = await querySession.getSessionDirtyFlag(db, sid)
      expect(result).toBeTruthy()
      let rows = await queryEndpointType.selectAllEndpointTypes(db, sid)
      expect(rows.length).toBe(1)
      await querySession.setSessionClean(db, sid)
      result = await querySession.getSessionDirtyFlag(db, sid)
      expect(result).toBeFalsy()
      await queryEndpointType.deleteEndpointType(db, endpointTypeId)
      result = await querySession.getSessionDirtyFlag(db, sid)
      expect(result).toBeTruthy()
    },
    testUtil.timeout.medium()
  )

  test(
    'Test key values',
    async () => {
      await querySession.updateSessionKeyValue(db, sid, 'testKey', 'testValue')
      let value = await querySession.getSessionKeyValue(db, sid, 'testKey')
      expect(value).toBe('testValue')
    },
    testUtil.timeout.short()
  )

  test(
    'Test state creation',
    async () => {
      let endpointTypeId
      let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
      pkgId = ctx.packageId
      let dts = await queryDeviceType.selectAllDeviceTypes(db, pkgId)
      let haOnOffDeviceTypeArray = dts.filter(
        (data) => data.label === 'HA-onoff'
      )
      let haOnOffDeviceType = haOnOffDeviceTypeArray[0]
      let deviceTypeId = haOnOffDeviceType.id
      let allSessionPartitions =
        await querySession.getAllSessionPartitionInfoForSession(db, sid)
      return queryConfig
        .insertEndpointType(
          db,
          allSessionPartitions[0],
          'Test endpoint',
          deviceTypeId,
          haOnOffDeviceType.code,
          0,
          true
        )
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
          expect(state.endpointTypes[0].clusters.length).toBe(4) // clusters exist for the endpoint type after inserting endpoint
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
          expect(state.package[zclIndex].version).toBe(1)
          expect(state.package[genIndex].type).toBe(
            dbEnum.packageType.genTemplatesJson
          )
          expect(state.package[genIndex].version).toBe('test-v1')
        })
    },
    testUtil.timeout.short()
  )

  test(
    'Empty delete',
    () =>
      queryEndpoint.deleteEndpoint(db, 123).then((data) => {
        expect(data).toBe(0)
      }),
    testUtil.timeout.short()
  )
})

describe('Endpoint Type Config Queries', () => {
  beforeAll(
    () =>
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
        }),
    testUtil.timeout.medium()
  )

  let endpointTypeIdOnOff
  let levelControlCluster
  let haOnOffDeviceType, zllOnOffLightDevice

  test(
    'Insert EndpointType and test various states',
    () =>
      queryDeviceType.selectAllDeviceTypes(db, pkgId).then((rows) => {
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
      }),
    testUtil.timeout.medium()
  )
  test(
    'Insert Endpoint Type',
    () =>
      querySession
        .selectSessionPartitionInfoFromDeviceType(db, sid, haOnOffDeviceType.id)
        .then((sessionPartitionInfo) =>
          queryConfig.insertEndpointType(
            db,
            sessionPartitionInfo[0],
            'testEndpointType',
            haOnOffDeviceType.id,
            43,
            22,
            true
          )
        )
        .then((rowId) => {
          endpointTypeIdOnOff = rowId
          return queryEndpointType.selectEndpointType(db, rowId)
        })
        .then((endpointType) => {
          expect(endpointType.deviceTypeRef).toBe(haOnOffDeviceType.id)
          expect(endpointType.name).toBe('testEndpointType')
          expect(endpointType.deviceTypes[0]).toBe(haOnOffDeviceType.id)
          expect(endpointType.deviceVersions[0]).toBe(22)
          expect(endpointType.deviceIdentifiers[0]).toBe(43)
        }),
    testUtil.timeout.medium()
  )

  test(
    'Test get all cluster states',
    () =>
      testQuery
        .getAllEndpointTypeClusterState(db, endpointTypeIdOnOff)
        .then((clusters) => {
          expect(clusters.length).toBe(4)
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
          testQuery.getAllEndpointTypeClusterState(db, endpointTypeIdOnOff)
        )
        .then((clusters) => {
          expect(clusters.length).toBe(5)
        }),
    testUtil.timeout.medium()
  )

  test(
    'Test get all attribute states',
    () =>
      testQuery
        .getEndpointTypeAttributes(db, endpointTypeIdOnOff)
        .then((attributes) => {
          expect(attributes.length).toBe(7)
        }),
    testUtil.timeout.medium()
  )

  test(
    'Get all cluster commands',
    () =>
      testQuery
        .getEndpointTypeCommands(db, endpointTypeIdOnOff)
        .then((commands) => {
          expect(commands.length).toBe(6)
        }),
    testUtil.timeout.medium()
  )
  test(
    'Test Enpoint ID related query',
    async () => {
      let clusterRef = 0
      let attributeRef = 0
      let attributeDefaultValue = 0
      let x = await queryZcl.selectEndpointTypeClustersByEndpointTypeId(
        db,
        endpointTypeIdOnOff
      )
      expect(x.length).toBe(5)
      x.forEach((element) => {
        if (element.side == 'server' && clusterRef == 0) {
          clusterRef = element.clusterRef
        }
      })
      expect(clusterRef == 0).toBeFalsy()

      x = await queryZcl.selectEndpointTypeAttributesByEndpointId(
        db,
        endpointTypeIdOnOff
      )

      expect(x.length).toBe(7)
      x.forEach((element) => {
        if (element.clusterRef == clusterRef && attributeRef == 0) {
          attributeRef = element.attributeRef
          attributeDefaultValue = element.defaultValue
        }
      })
      expect(attributeRef == 0).toBeFalsy()
      x = await queryZcl.selectEndpointTypeAttribute(
        db,
        endpointTypeIdOnOff,
        attributeRef,
        clusterRef
      )

      expect(x.defaultValue).toBe(attributeDefaultValue)

      x = await queryZcl.selectEndpointTypeCommandsByEndpointId(
        db,
        endpointTypeIdOnOff
      )

      expect(x.length).toBe(6)
    },
    testUtil.timeout.medium()
  )
  test(
    'Get all cluster names',
    () => {
      let expectedNames = ['Basic', 'Identify', 'Level Control', 'On/off']
      return queryEndpointType
        .selectEndpointTypeIds(db, sid)
        .then((endpointTypes) =>
          queryEndpointType
            .selectAllClustersNamesFromEndpointTypes(db, endpointTypes)
            .then((names) => {
              expect(names.length).toBe(4)
              names.forEach((element) => {
                expect(expectedNames.includes(element.name)).toBeTruthy()
              })
            })
        )
    },
    testUtil.timeout.medium()
  )

  test(
    'Set additional attributes and commands when cluster state is inserted',
    () => {
      return queryConfig
        .insertOrReplaceClusterState(
          db,
          endpointTypeIdOnOff,
          levelControlCluster.id,
          'CLIENT',
          true
        )
        .then(() =>
          queryConfig.insertClusterDefaults(db, endpointTypeIdOnOff, pkgId, {
            clusterRef: levelControlCluster.id,
            side: 'CLIENT'
          })
        )
        .then(() =>
          testQuery
            .getEndpointTypeAttributes(db, endpointTypeIdOnOff)
            .then((attributes) => {
              expect(attributes.length).toBe(7)
            })
        )
    },
    testUtil.timeout.medium()
  )

  test(
    'Get endpoint type attributes and commands by endpoint type cluster id',
    async () => {
      let expectedNumbers = {
        Identify: {
          server: { attributes: 2, commands: 6 },
          client: { attributes: 2, commands: 6 }
        },
        Basic: { server: { attributes: 18, commands: 1 } },
        'On/off': { client: { attributes: 9, commands: 11 } }
      }
      let deviceTypeClusters =
        await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
          db,
          haOnOffDeviceType.id
        )
      testQuery
        .getAllEndpointTypeClusterState(db, endpointTypeIdOnOff)
        .then((clusters) => {
          clusters.forEach((cluster) => {
            let endpointTypeClusterId = cluster.endpointTypeClusterId
            let clusterName = cluster.clusterName
            let side = cluster.side
            let deviceTypeCluster = deviceTypeClusters.find(
              (c) => c.clusterName == clusterName
            )
            if (deviceTypeCluster) {
              queryAttribute
                .selectAttributesByEndpointTypeClusterId(
                  db,
                  endpointTypeClusterId
                )
                .then((attributes) => {
                  expect(attributes.length).toBe(
                    expectedNumbers[clusterName][side].attributes
                  )
                })
              queryCommand
                .selectCommandsByEndpointTypeClusterId(
                  db,
                  endpointTypeClusterId
                )
                .then((commands) => {
                  expect(commands.length).toBe(
                    expectedNumbers[clusterName][side].commands
                  )
                })
            }
          })
        })
    },
    testUtil.timeout.medium()
  )

  test('Test the function to select server side endpoint type cluster ID by endpoint type ID And cluster reference', async () => {
    let clusters = await testQuery.getAllEndpointTypeClusterState(
      db,
      endpointTypeIdOnOff
    )
    let levelControlCluster = clusters.find(
      (cluster) =>
        cluster.clusterName == 'Level Control' && cluster.side == 'server'
    )
    expect(levelControlCluster).toBeDefined()
    let endpointTypeClusterId =
      await queryZcl.selectEndpointTypeClusterIdByEndpointTypeIdAndClusterRefAndSide(
        db,
        endpointTypeIdOnOff,
        levelControlCluster.clusterId,
        dbEnum.clusterSide.server
      )
    // The endpointTypeClusterId queried by the function should match the cluster's endpointTypeClusterId
    expect(endpointTypeClusterId).toBe(
      levelControlCluster.endpointTypeClusterId
    )
  })

  test(
    'Insert Endpoint Test',
    () =>
      queryEndpoint
        .insertEndpoint(db, sid, 4, endpointTypeIdOnOff, 9, 260)
        .then((rowId) => {
          return queryEndpoint.selectEndpoint(db, rowId)
        })
        .then((endpoint) => {
          expect(endpoint.endpointId).toBe(4)
          expect(endpoint.profileId).toBe(260)
          expect(endpoint.networkId).toBe(9)
          expect(endpoint.endpointTypeRef).toBe(endpointTypeIdOnOff)
        }),
    testUtil.timeout.medium()
  )

  test(
    'Test session report',
    () =>
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
      }),
    testUtil.timeout.medium()
  )

  test('Test session clusters', async () => {
    let clusters = await querySessionZcl.selectAllSessionClusters(db, sid)
    expect(clusters.length).toBeGreaterThan(10)
    let c = await querySessionZcl.selectSessionClusterByCode(db, sid, 2305)
    expect(c.label).toBe('Data Sharing')
  })

  test(
    'Delete Endpoint Type',
    () =>
      queryEndpointType
        .deleteEndpointType(db, endpointTypeIdOnOff)
        .then(testQuery.getAllEndpointTypeClusterState(db, endpointTypeIdOnOff))
        .then((clusters) => {
          expect(clusters.length).toBe(undefined)
          return Promise.resolve()
        }),
    testUtil.timeout.medium()
  )

  test(
    'Test inserting and retrieving options',
    () => {
      let pkgId = null
      return queryPackage
        .insertPathCrc(db, 'junk', 123)
        .then((p) => {
          pkgId = p
          return queryPackage.insertOptionsKeyValues(db, pkgId, 'test', [
            '1',
            '2',
            '3'
          ])
        })
        .then(() => queryPackage.selectAllOptionsValues(db, pkgId, 'test'))
        .then((data) => {
          expect(data.length).toBe(3)
        })
    },
    testUtil.timeout.medium()
  )
})

describe('user-data.js REST API handlers', () => {
  it(
    'httpPostDuplicateEndpointType, httpGetEndpointIds, etc)',
    async () => {
      let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
      pkgId = ctx.packageId
      let dts = await queryDeviceType.selectAllDeviceTypes(db, pkgId)
      let haOnOffDeviceTypeArray = dts.filter(
        (data) => data.label === 'HA-onoff'
      )
      let haOnOffDeviceType = haOnOffDeviceTypeArray[0]
      let deviceTypeId = haOnOffDeviceType.id
      let allSessionPartitions =
        await querySession.getAllSessionPartitionInfoForSession(db, sid)
      let endpointTypeId = await queryConfig.insertEndpointType(
        db,
        allSessionPartitions[0],
        'Test endpoint',
        deviceTypeId,
        haOnOffDeviceType.code,
        0,
        true
      )
      let endpointTypes = await queryEndpointType.selectAllEndpointTypes(
        db,
        sid
      )
      let endpointTypesLength1 = endpointTypes.length
      const req = { body: { endpointTypeId: endpointTypeId } }
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const handler =
        require('../src-electron/rest/user-data').httpPostDuplicateEndpointType(
          db
        )
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.anything() })
      )
      // check that the new endpoint type exists in the DB
      endpointTypes = await queryEndpointType.selectAllEndpointTypes(db, sid)
      expect(endpointTypesLength1 + 1).toEqual(endpointTypes.length)

      // --- httpGetEndpointIds logic moved here ---
      let endpointId = await queryEndpoint.insertEndpoint(
        db,
        sid,
        99,
        endpointTypeId,
        0,
        0
      )
      const reqEp = { zapSessionId: sid }
      const resEp = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const handlerEp = require('../src-electron/rest/user-data')
        .get.find((e) => e.uri === restApi.uri.endpointIds)
        .callback(db)
      await handlerEp(reqEp, resEp)
      expect(resEp.status).toHaveBeenCalledWith(200)
      expect(resEp.json).toHaveBeenCalledWith(expect.arrayContaining([99]))

      // --- httpPostAttributeUpdate logic ---
      // Insert cluster for endpoint type
      let clusters = await queryZcl.selectAllClusters(db, pkgId)
      let cluster = clusters.find((c) => c.code === 6) // On/Off cluster
      await queryConfig.insertOrReplaceClusterState(
        db,
        endpointTypeId,
        cluster.id,
        'server',
        true
      )
      // Insert attribute for cluster
      let attributes =
        await queryZcl.selectAttributesByClusterIdIncludingGlobal(
          db,
          cluster.id,
          pkgId
        )
      let attribute = attributes[0]
      // Prepare request with real IDs
      const reqAttr = {
        zapSessionId: sid,
        body: {
          action: 'update',
          endpointTypeIdList: [endpointTypeId],
          selectedEndpoint: endpointId,
          id: attribute.id,
          value: 1,
          listType: restApi.updateKey.attributeSelected,
          clusterRef: cluster.id,
          attributeSide: 'server'
        }
      }
      const resAttr = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const handlerAttr = require('../src-electron/rest/user-data')
        .post.find((e) => e.uri === restApi.uri.attributeUpdate)
        .callback(db)
      await handlerAttr(reqAttr, resAttr)
      expect(resAttr.status).toHaveBeenCalledWith(200)
      expect(resAttr.json).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update', id: attribute.id })
      )

      // Insert a command for the cluster
      let commands = await queryCommand.selectCommandsByClusterId(
        db,
        cluster.id,
        pkgId
      )
      let command = commands[0]

      // httpPostCommandUpdate
      const reqCmd = {
        zapSessionId: sid,
        body: {
          action: 'update',
          endpointTypeIdList: [endpointTypeId],
          id: command.id,
          value: 1,
          listType: 'selectedIn',
          clusterRef: cluster.id,
          commandSide: 'server'
        }
      }
      const resCmd = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const handlerCmd = require('../src-electron/rest/user-data')
        .post.find((e) => e.uri === restApi.uri.commandUpdate)
        .callback(db)
      await handlerCmd(reqCmd, resCmd)
      expect(resCmd.status).toHaveBeenCalledWith(200)
      expect(resCmd.json).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update', id: command.id })
      )

      // Insert an event for the cluster
      let events = await queryEvent.selectEventsByClusterId(
        db,
        cluster.id,
        pkgId
      )
      let event = events[0]

      // httpPostEventUpdate
      const reqEvent = {
        zapSessionId: sid,
        body: {
          action: 'update',
          endpointTypeId: endpointTypeId,
          id: 1,
          value: 1,
          listType: 'selected',
          clusterRef: cluster.id,
          eventSide: 'server'
        }
      }
      const resEvent = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const handlerEvent = require('../src-electron/rest/user-data')
        .post.find((e) => e.uri === restApi.uri.eventUpdate)
        .callback(db)
      await handlerEvent(reqEvent, resEvent)
      expect(resEvent.status).toHaveBeenCalledWith(200)
      expect(resEvent.json).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update', id: 1 })
      )

      // httpPostDuplicateEndpoint
      const reqDupEp = {
        body: { id: endpointId, endpointIdentifier: 102, endpointTypeId }
      }
      const resDupEp = { status: jest.fn().mockReturnThis(), json: jest.fn() }
      const handlerDupEp = require('../src-electron/rest/user-data')
        .post.find((e) => e.uri === restApi.uri.duplicateEndpoint)
        .callback(db)
      await handlerDupEp(reqDupEp, resDupEp)
      expect(resDupEp.status).toHaveBeenCalledWith(200)
      expect(resDupEp.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.anything() })
      )
    },
    testUtil.timeout.long()
  )

  it('httpGetSessionKeyValues returns session key values', async () => {
    await querySession.updateSessionKeyValue(db, sid, 'foo', 'bar')
    const req = { zapSessionId: sid }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .get.find((e) => e.uri === restApi.uri.getAllSessionKeyValues)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ key: 'foo', value: 'bar' })
      ])
    )
  })

  it('httpGetDeviceTypeFeatures returns device type features', async () => {
    const req = { query: { deviceTypeRefs: [1], endpointTypeRef: 1 } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .get.find((e) => e.uri === restApi.uri.deviceTypeFeatures)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalled()
  })

  it('httpPostSaveSessionKeyValue saves and returns key/value', async () => {
    const req = { zapSessionId: sid, body: { key: 'baz', value: 'qux' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .post.find((e) => e.uri === restApi.uri.saveSessionKeyValue)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'baz', value: 'qux' })
    )
  })

  it('httpPostCluster inserts or updates cluster state', async () => {
    let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
    pkgId = ctx.packageId
    let dts = await queryDeviceType.selectAllDeviceTypes(db, pkgId)
    let haOnOffDeviceType = dts.find((data) => data.label === 'HA-onoff')
    let allSessionPartitions =
      await querySession.getAllSessionPartitionInfoForSession(db, sid)
    let endpointTypeId = await queryConfig.insertEndpointType(
      db,
      allSessionPartitions[0],
      'Test endpoint',
      haOnOffDeviceType.id,
      haOnOffDeviceType.code,
      0,
      true
    )
    const req = {
      zapSessionId: sid,
      body: { id: 6, side: 'server', flag: true, endpointTypeId }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    }
    const handler = require('../src-electron/rest/user-data')
      .post.find((e) => e.uri === restApi.uri.cluster)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        endpointTypeId,
        id: 6,
        side: 'server',
        flag: true
      })
    )
  })

  it('httpGetInitialState returns initial state', async () => {
    const req = { zapSessionId: sid }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .get.find((e) => e.uri === restApi.uri.initialState)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        endpointTypes: expect.anything(),
        endpoints: expect.anything(),
        sessionKeyValues: expect.anything()
      })
    )
  })

  it('httpGetOption returns options', async () => {
    const req = { zapSessionId: sid, params: { category: 'generator' } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .get.find((e) => e.uri === `${restApi.uri.option}/:category`)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalled()
  })

  it('httpGetUiOptions returns UI options', async () => {
    const req = { zapSessionId: sid }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .get.find((e) => e.uri === restApi.uri.uiOptions)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalled()
  })

  it('httpGetPackages returns project packages', async () => {
    const req = { zapSessionId: sid }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .get.find((e) => e.uri === restApi.uri.packages)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalled()
  })

  it('httpGetAllPackages returns all packages', async () => {
    const req = {}
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .get.find((e) => e.uri === restApi.uri.getAllPackages)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ packages: expect.anything() })
    )
  })

  it('httpPatchUpdateBitOfFeatureMapAttribute updates feature map attribute', async () => {
    const req = { body: { featureMapAttributeId: 1, newValue: 1 } }
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
    const handler = require('../src-electron/rest/user-data')
      .patch.find((e) => e.uri === restApi.uri.updateBitOfFeatureMapAttribute)
      .callback(db)
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ successful: expect.any(Boolean) })
    )
  })
})

test(
  'Test Rest Key to DB Column Test',
  () => {
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
      queryConfig.convertRestKeyToDbColumn(restApi.updateKey.profileId)
    ).toEqual('PROFILE')
    expect(
      queryConfig.convertRestKeyToDbColumn(restApi.updateKey.deviceTypeRef)
    ).toEqual('DEVICE_TYPE_REF')
    expect(
      queryConfig.convertRestKeyToDbColumn(restApi.updateKey.name)
    ).toEqual('NAME')
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
  },
  testUtil.timeout.medium()
)

test(
  'Test determineType',
  async () => {
    let type

    type = await zclUtil.determineType(db, 'patate', pkgId)
    expect(type.type).toEqual(dbEnum.zclType.unknown)
    type = await zclUtil.determineType(db, 'Status', pkgId)
    expect(type.type).toEqual(dbEnum.zclType.enum)
    type = await zclUtil.determineType(db, 'Protocol', pkgId)
    expect(type.type).toEqual(dbEnum.zclType.struct)
    type = await zclUtil.determineType(db, 'CO2TrailingDigit', pkgId)
    expect(type.type).toEqual(dbEnum.zclType.bitmap)
    type = await zclUtil.determineType(db, 'int8u', pkgId)
    expect(type.type).toEqual(dbEnum.zclType.atomic)
  },
  testUtil.timeout.medium()
)
