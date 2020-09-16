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

const sq = require('sqlite3')
const dbApi = require('../src-electron/db/db-api.js')
const dbEnum = require('../src-shared/db-enum.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const queryPackage = require('../src-electron/db/query-package.js')
const queryGeneric = require('../src-electron/db/query-generic.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const args = require('../src-electron/util/args.js')
const env = require('../src-electron/util/env.js')
const { query } = require('express')

test('test opening and closing the database', () => {
  var db = new sq.Database(':memory:')
  return dbApi.closeDatabase(db)
})

test('test database schema loading in memory', () => {
  var db = new sq.Database(':memory:')
  return dbApi
    .loadSchema(db, env.schemaFile(), env.zapVersion())
    .then((db) => dbApi.closeDatabase(db))
})

test('test Silabs zcl data loading in memory', () => {
  var db = new sq.Database(':memory:')
  var packageId
  return dbApi
    .loadSchema(db, env.schemaFile(), env.zapVersion())
    .then((db) => zclLoader.loadZcl(db, args.zclPropertiesFile))
    .then((ctx) => {
      packageId = ctx.packageId
      return queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
    })
    .then((p) => expect(p.version).toEqual('ZCL Test Data'))
    .then(() =>
      queryPackage.getPackagesByType(db, dbEnum.packageType.zclProperties)
    )
    .then((rows) => expect(rows.length).toEqual(1))
    .then(() => queryZcl.selectAllClusters(db))
    .then((x) => expect(x.length).toEqual(109))
    .then(() => queryZcl.selectAllDomains(db))
    .then((x) => expect(x.length).toEqual(22))
    .then(() => queryZcl.selectAllEnums(db))
    .then((x) => expect(x.length).toEqual(207))
    .then(() => queryZcl.selectAllStructs(db))
    .then((x) => expect(x.length).toEqual(52))
    .then(() => queryZcl.selectAllBitmaps(db))
    .then((x) => expect(x.length).toEqual(120))
    .then(() => queryZcl.selectAllDeviceTypes(db))
    .then((x) => expect(x.length).toEqual(174))
    .then(() => queryGeneric.selectCountFrom(db, 'COMMAND_ARG'))
    .then((x) => expect(x).toEqual(1737))
    .then(() => queryGeneric.selectCountFrom(db, 'COMMAND'))
    .then((x) => expect(x).toEqual(611))
    .then(() => queryGeneric.selectCountFrom(db, 'ENUM_ITEM'))
    .then((x) => expect(x).toEqual(1552))
    .then(() => queryGeneric.selectCountFrom(db, 'ATTRIBUTE'))
    .then((x) => expect(x).toEqual(3438))
    .then(() => queryGeneric.selectCountFrom(db, 'BITMAP_FIELD'))
    .then((x) => expect(x).toEqual(721))
    .then(() => queryGeneric.selectCountFrom(db, 'STRUCT_ITEM'))
    .then((x) => expect(x).toEqual(159))
    .then(() =>
      dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM CLUSTER WHERE MANUFACTURER_CODE NOT NULL',
        []
      )
    )
    .then((x) => expect(x.length).toEqual(5))
    .then(() =>
      dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM COMMAND WHERE MANUFACTURER_CODE NOT NULL',
        []
      )
    )
    .then((x) => expect(x.length).toEqual(5))
    .then(() =>
      dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM ATTRIBUTE WHERE MANUFACTURER_CODE NOT NULL',
        []
      )
    )
    .then((x) => expect(x.length).toEqual(4))
    .then(() =>
      dbApi.dbMultiSelect(db, 'SELECT CLUSTER_ID FROM CLUSTER WHERE CODE = ?', [
        [0],
        [6],
      ])
    )
    .then((rows) => {
      expect(rows.length).toBe(2)
      expect(rows[0]).not.toBeUndefined()
      expect(rows[1]).not.toBeUndefined()
      expect(rows[0].CLUSTER_ID).not.toBeUndefined()
      expect(rows[1].CLUSTER_ID).not.toBeUndefined()
    })
    .then(() =>
      queryPackage.selectAllOptionsValues(
        db,
        packageId,
        'defaultResponsePolicy'
      )
    )
    .then((rows) => expect(rows.length).toBe(3))
    .then(() =>
      dbApi.dbAll(
        db,
        'SELECT NAME, TYPE, PACKAGE_REF FROM BITMAP WHERE NAME IN (SELECT NAME FROM BITMAP GROUP BY NAME HAVING COUNT(*)>1)',
        []
      )
    )
    .then((x) => {
      x.forEach((c) => {
        env.logWarning(
          `Found Non Unique Bitmap in Silabs XML: ${c.NAME} ${c.TYPE} ${c.PACKAGE_REF}`
        )
      })
    })

    .then(() =>
      dbApi.dbAll(
        db,
        'SELECT NAME, TYPE, PACKAGE_REF FROM ENUM WHERE NAME IN (SELECT NAME FROM ENUM GROUP BY NAME HAVING COUNT(*)>1)',
        []
      )
    )
    .then((x) => {
      x.forEach((c) => {
        env.logWarning(
          `Found Non Unique Enum in Silabs XML: ${c.NAME} ${c.TYPE} ${c.PACKAGE_REF}`
        )
      })
    })
    .finally(() => {
      dbApi.closeDatabase(db)
    })
}, 5000) // Give this test 5 secs to resolve

test('test Dotdot zcl data loading in memory', () => {
  var db = new sq.Database(':memory:')
  var packageId
  dotDotZclPropertiesFile = './zcl-builtin/dotdot/library.xml'
  return (
    dbApi
      .loadSchema(db, env.schemaFile(), env.zapVersion())
      .then((db) => zclLoader.loadZcl(db, dotDotZclPropertiesFile))
      .then((ctx) => {
        packageId = ctx.packageId
        return queryPackage.getPackageByPackageId(ctx.db, packageId)
      })
      .then((p) => expect(p.version).toEqual('1.0'))
      .then(() =>
        queryPackage.getPackagesByType(db, dbEnum.packageType.zclProperties)
      )
      .then((rows) => expect(rows.length).toEqual(1))
      .then(() => queryZcl.selectAllClusters(db, packageId))
      .then((x) => expect(x.length).toEqual(41))
      .then(() => queryZcl.selectAllDeviceTypes(db, packageId))
      .then((x) => expect(x.length).toEqual(54))
      .then(() => queryGeneric.selectCountFrom(db, 'COMMAND_ARG'))
      .then((x) => expect(x).toEqual(644)) // seems low
      .then(() => queryGeneric.selectCountFrom(db, 'COMMAND'))
      .then((x) => expect(x).toEqual(238)) // seems low
      .then(() => queryGeneric.selectCountFrom(db, 'ATTRIBUTE'))
      .then((x) => expect(x).toEqual(628)) // seems low
      .then(() => queryZcl.selectAllAtomics(db, packageId))
      .then((x) => expect(x.length).toEqual(69)) //seems low
      .then(() => queryZcl.selectAllBitmaps(db, packageId))
      .then((x) => expect(x.length).toEqual(50)) //seems low
      .then(() => queryZcl.selectAllEnums(db, packageId))
      .then((x) => expect(x.length).toEqual(79)) //seems low
      .then(() => queryGeneric.selectCountFrom(db, 'ENUM_ITEM'))
      .then((x) => expect(x).toEqual(534))
      .then(() => queryZcl.selectAllStructs(db, packageId))
      .then((x) => expect(x.length).toEqual(20)) //seems low
      .then(() => queryGeneric.selectCountFrom(db, 'STRUCT_ITEM'))
      .then((x) => expect(x).toEqual(63))

      //Do some checking on the device type metadata
      .then(() => queryZcl.selectAllDeviceTypes(db, packageId))
      .then((x) => {
        x.forEach((d) => {
          queryZcl
            .selectDeviceTypeClustersByDeviceTypeRef(db, d.id)
            .then((dc) => {
              dc.forEach((dcr) => {
                if (!dcr.clusterRef) {
                  env.logInfo(
                    `for ${d.caption} failed to match dcr ${dcr.clusterName}`
                  )
                } else {
                  queryZcl
                    .selectDeviceTypeAttributesByDeviceTypeRef(
                      db,
                      dcr.deviceTypeRef
                    )
                    .then((dcas) => {
                      if (dcas.length > 0) {
                        dcas.forEach((dca) => {
                          if (!dca.attributeRef) {
                            env.logInfo(
                              `attributeRef for ${dca.attributeName} is NULL`
                            )
                          }
                        })
                      }
                    })
                }
              })
            })
        })
      })

      .then(() =>
        dbApi.dbAll(
          db,
          'SELECT NAME, TYPE, PACKAGE_REF FROM ENUM WHERE NAME IN (SELECT NAME FROM ENUM GROUP BY NAME HAVING COUNT(*)>1)',
          []
        )
      )
      .then((x) => {
        x.forEach((c) => {
          env.logWarning(
            `Found Non Unique Enum in Dotdot XML: ${c.NAME} ${c.TYPE} ${c.PACKAGE_REF}`
          )
        })
      })

      .finally(() => {
        dbApi.closeDatabase(db)
      })
  )
}, 5000) // Give this test 5 secs to resolve

test('test Dotdot and Silabs zcl data loading in memory', () => {
  var db = new sq.Database(':memory:')
  var packageIdSilabs
  var packageIdDotdot
  var dotDotZclPropertiesFile = './zcl-builtin/dotdot/library.xml'
  return (
    dbApi
      .loadSchema(db, env.schemaFile(), env.zapVersion())

      //Load the Silabs ZCL XML into the DB
      .then((db) => zclLoader.loadZcl(db, args.zclPropertiesFile)) //default silabs
      .then((ctx) => {
        packageIdSilabs = ctx.packageId
        return queryPackage.getPackageByPackageId(ctx.db, packageIdSilabs)
      })
      .then((p) => expect(p.version).toEqual('ZCL Test Data'))
      .then(() =>
        queryPackage.getPackagesByType(db, dbEnum.packageType.zclProperties)
      )
      .then((rows) => expect(rows.length).toEqual(1))

      //Load the Dotdot ZCL XML into the DB
      .then(() => zclLoader.loadZcl(db, dotDotZclPropertiesFile)) //default silabs
      .then((ctx) => {
        packageIdDotdot = ctx.packageId
        return queryPackage.getPackageByPackageId(ctx.db, packageIdDotdot)
      })
      .then((p) => expect(p.version).toEqual('1.0'))
      .then(() =>
        queryPackage.getPackagesByType(db, dbEnum.packageType.zclProperties)
      )
      .then((rows) => expect(rows.length).toEqual(2))

      //Run some queries on the DB
      .then(() =>
        dbApi.dbAll(
          db,
          'SELECT NAME, CODE, PACKAGE_REF FROM CLUSTER WHERE CODE IN (SELECT CODE FROM CLUSTER GROUP BY CODE HAVING COUNT(CODE)=1)',
          []
        )
      )
      .then((x) => {
        //env.logWarning(`FOUND ${x.length} UNIQUE ENTRIES`)
        x.forEach((c) => {
          env.logInfo(
            `Found Unique Cluster: ${c.CODE} ${c.NAME} ${c.PACKAGE_REF}`
          )
        })
      })

      .then(() =>
        dbApi.dbAll(
          db,
          'SELECT NAME, ATOMIC_IDENTIFIER, PACKAGE_REF FROM ATOMIC WHERE ATOMIC_IDENTIFIER IN (SELECT ATOMIC_IDENTIFIER FROM ATOMIC GROUP BY ATOMIC_IDENTIFIER HAVING COUNT(ATOMIC_IDENTIFIER)=1)',
          []
        )
      )
      .then((x) => {
        x.forEach((c) => {
          env.logInfo(
            `Found Unique Atomic: ${c.ATOMIC_IDENTIFIER} ${c.NAME} ${c.PACKAGE_REF}`
          )
        })
      })

      .then(() =>
        dbApi.dbAll(
          db,
          'SELECT NAME, TYPE, PACKAGE_REF FROM BITMAP WHERE NAME IN (SELECT NAME FROM BITMAP GROUP BY NAME HAVING COUNT(NAME)=1)',
          []
        )
      )
      .then((x) => {
        x.forEach((c) => {
          env.logInfo(
            `Found Unique Bitmap: ${c.NAME} ${c.TYPE} ${c.PACKAGE_REF}`
          )
        })
      })

      .finally(() => {
        dbApi.closeDatabase(db)
      })
  )
}, 5000) // Give this test 5 secs to resolve
