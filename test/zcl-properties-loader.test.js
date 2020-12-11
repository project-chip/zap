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

const dbApi = require('../src-electron/db/db-api.js')
const dbEnum = require('../src-shared/db-enum.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const queryPackage = require('../src-electron/db/query-package.js')
const queryGeneric = require('../src-electron/db/query-generic.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const env = require('../src-electron/util/env.js')
const path = require('path')

const zclPropertiesFile = path.join(
  __dirname,
  '../zcl-builtin/silabs/zcl-test.properties'
)

test('test Silabs zcl data loading in memory', () => {
  var db
  var packageId
  return dbApi
    .initRamDatabase()
    .then((db) => dbApi.loadSchema(db, env.schemaFile(), env.zapVersion()))
    .then((d) => {
      db = d
      return db
    })
    .then((db) => zclLoader.loadZcl(db, zclPropertiesFile))
    .then((ctx) => {
      packageId = ctx.packageId
      return queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
    })
    .then((p) => expect(p.version).toEqual('ZCL Test Data'))
    .then(() =>
      queryPackage.getPackagesByType(db, dbEnum.packageType.zclProperties)
    )
    .then((rows) => expect(rows.length).toEqual(1))
    .then(() => queryZcl.selectAllClusters(db, packageId))
    .then((x) => expect(x.length).toEqual(106))
    .then(() => queryZcl.selectAllDomains(db, packageId))
    .then((x) => expect(x.length).toEqual(20))
    .then(() => queryZcl.selectAllEnums(db, packageId))
    .then((x) => expect(x.length).toEqual(205))
    .then(() => queryZcl.selectAllStructs(db, packageId))
    .then((x) => expect(x.length).toEqual(50))
    .then(() => queryZcl.selectAllBitmaps(db, packageId))
    .then((x) => expect(x.length).toEqual(120))
    .then(() => queryZcl.selectAllDeviceTypes(db, packageId))
    .then((x) => expect(x.length).toEqual(152))
    .then(() => queryGeneric.selectCountFrom(db, 'COMMAND_ARG'))
    .then((x) => expect(x).toEqual(1668))
    .then(() => queryGeneric.selectCountFrom(db, 'COMMAND'))
    .then((x) => expect(x).toEqual(560))
    .then(() => queryGeneric.selectCountFrom(db, 'ENUM_ITEM'))
    .then((x) => expect(x).toEqual(1534))
    .then(() => queryGeneric.selectCountFrom(db, 'ATTRIBUTE'))
    .then((x) => expect(x).toEqual(3416))
    .then(() => queryGeneric.selectCountFrom(db, 'BITMAP_FIELD'))
    .then((x) => expect(x).toEqual(721))
    .then(() => queryGeneric.selectCountFrom(db, 'STRUCT_ITEM'))
    .then((x) => expect(x).toEqual(154))
    .then(() =>
      dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM CLUSTER WHERE MANUFACTURER_CODE NOT NULL',
        []
      )
    )
    .then((x) => expect(x.length).toEqual(2))
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
    .finally(() => {
      dbApi.closeDatabase(db)
    })
}, 5000) // Give this test 5 secs to resolve
