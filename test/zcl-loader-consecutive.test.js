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
const args = require('../src-electron/util/args.js')
const env = require('../src-electron/util/env.js')

test('that that parallel loading of zcl and dotdot is possible', async () => {
  let dotDotZclPropertiesFile = './zcl-builtin/dotdot/library.xml'
  let zclPropertiesFile = args.zclPropertiesFile

  let db = await dbApi.initRamDatabase()
  await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())

  let promises = []
  promises.push(zclLoader.loadZcl(db, zclPropertiesFile))
  promises.push(zclLoader.loadZcl(db, dotDotZclPropertiesFile))

  await Promise.all(promises)

  await dbApi.closeDatabase(db)
}, 10000)

test('test that consecutive loading of metafiles properly avoids duplication', () => {
  let dotDotZclPropertiesFile = './zcl-builtin/dotdot/library.xml'
  let db
  let jsonPackageId
  let dotdotPackageId
  return dbApi
    .initRamDatabase()
    .then((db) => dbApi.loadSchema(db, env.schemaFile(), env.zapVersion()))
    .then((d) => {
      db = d
    })
    .then(() => zclLoader.loadZcl(db, args.zclPropertiesFile))
    .then((ctx) => {
      jsonPackageId = ctx.packageId
    })
    .then(() => zclLoader.loadZcl(db, args.zclPropertiesFile))
    .then((ctx) => {
      expect(ctx.packageId).toEqual(jsonPackageId)
      return queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
    })
    .then((p) => expect(p.version).toEqual('ZCL Test Data'))
    .then(() => zclLoader.loadZcl(db, dotDotZclPropertiesFile))
    .then(() => zclLoader.loadZcl(db, dotDotZclPropertiesFile))
    .then((ctx) => {
      dotdotPackageId = ctx.packageId
      expect(dotdotPackageId).not.toEqual(jsonPackageId)
      return queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
    })
    .then((p) => expect(p.version).toEqual('1.0'))
    .then(() =>
      queryPackage.getPackagesByType(db, dbEnum.packageType.zclProperties)
    )
    .then((rows) => expect(rows.length).toEqual(2))
    .then(() => queryZcl.selectAllClusters(db, jsonPackageId))
    .then((x) => expect(x.length).toEqual(109))
    .then(() => queryZcl.selectAllClusterCommands(db, jsonPackageId))
    .then((x) => {
      expect(x.length).toBe(588)
      queryZcl
        .selectCommandById(db, x[0].id)
        .then((z) => expect(z.label).toBe(x[0].label))
    })
    .then(() => queryZcl.selectAllCommandArguments(db, jsonPackageId))
    .then((x) => expect(x.length).toEqual(1737))
    .then(() => queryZcl.selectAllDomains(db, jsonPackageId))
    .then((x) => {
      expect(x.length).toEqual(22)
      queryZcl
        .selectDomainById(db, x.id, jsonPackageId)
        .then((z) => expect(z.name).toBe(x.name))
    })
    .then(() => queryZcl.selectAllEnums(db, jsonPackageId))
    .then((x) => expect(x.length).toEqual(207))
    .then(() => queryZcl.selectAllAttributesBySide(db, 'server', jsonPackageId))
    .then((x) => expect(x.length).toBe(2962))
    .then(() => queryZcl.selectAllEnumItems(db, jsonPackageId))
    .then((x) => expect(x.length).toEqual(1549))
    .then(() => queryZcl.selectAllStructs(db, jsonPackageId))
    .then((x) => expect(x.length).toEqual(52))
    .then(() => queryZcl.selectAllBitmaps(db, jsonPackageId))
    .then(() => queryZcl.selectAllDeviceTypes(db, jsonPackageId))
    .then((x) => expect(x.length).toEqual(174))
    .then(() => queryZcl.selectAllAtomics(db, jsonPackageId))
    .then((x) => expect(x.length).toEqual(56))
    .then(() => queryZcl.selectAllClusters(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(41))
    .then(() => queryZcl.selectAllClusterCommands(db, dotdotPackageId))
    .then((x) => expect(x.length).toBe(215)) //seems low
    .then(() => queryZcl.selectAllCommandArguments(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(644))
    .then(() => queryZcl.selectAllDeviceTypes(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(108))
    .then(() => queryZcl.selectAllBitmaps(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(61)) //seems low
    .then(() => queryZcl.selectAllEnums(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(105)) //seems low
    .then(() =>
      queryZcl.selectAllAttributesBySide(db, 'server', dotdotPackageId)
    )
    .then((x) => expect(x.length).toBe(615)) //seems low
    .then(() => queryZcl.selectAllEnumItems(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(639))
    .then(() => queryZcl.selectAllStructs(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(20)) //seems low
    .then(() => queryZcl.selectAllAtomics(db, dotdotPackageId))
    .then((x) => expect(x.length).toEqual(56)) //This is the correct number of atomics from the ZCL8 ch. 2.6
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
        jsonPackageId,
        dbEnum.sessionOption.defaultResponsePolicy
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
}, 20000) // Give this test a while, since it's loading ZCL stuff more then 4 times.
