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
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const env = require('../src-electron/util/env.js')
const testUtil = require('./test-util.js')

test(
  'that that parallel loading of zcl and dotdot is possible',
  async () => {
    let db = await dbApi.initRamDatabase()
    await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())

    let promises = []
    promises.push(zclLoader.loadZcl(db, env.builtinSilabsZclMetafile))
    promises.push(zclLoader.loadZcl(db, env.builtinDotdotZclMetafile))

    await Promise.all(promises)

    await dbApi.closeDatabase(db)
  },
  testUtil.timeout.long()
)

test(
  'test that consecutive loading of metafiles properly avoids duplication',
  () => {
    let db
    let jsonPackageId
    let dotdotPackageId
    return dbApi
      .initRamDatabase()
      .then((db) => dbApi.loadSchema(db, env.schemaFile(), env.zapVersion()))
      .then((d) => {
        db = d
      })
      .then(() => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile))
      .then((ctx) => {
        jsonPackageId = ctx.packageId
      })
      .then(() => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile))
      .then((ctx) => {
        expect(ctx.packageId).toEqual(jsonPackageId)
        return queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
      })
      .then((p) => expect(p.version).toEqual('ZCL Test Data'))
      .then(() => zclLoader.loadZcl(db, env.builtinDotdotZclMetafile))
      .then(() => zclLoader.loadZcl(db, env.builtinDotdotZclMetafile))
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
      .then((x) => expect(x.length).toEqual(testUtil.totalClusterCount))
      .then(() => queryZcl.selectAllClusterCommands(db, jsonPackageId))
      .then((x) => {
        let unmatchedRequestCount = 0
        let responsesCount = 0
        let totalCount = 0
        for (cmd of x) {
          totalCount++
          if (cmd.responseRef != null) {
            responsesCount++
          }
          if (cmd.name.endsWith('Request') && cmd.responseRef == null) {
            unmatchedRequestCount++
          }
        }
        expect(totalCount).toBeGreaterThan(0)
        // This is how many commands are linked to their responses
        expect(responsesCount).toBe(120)
        // This seems to be the unmatched number in our XML files.
        expect(unmatchedRequestCount).toBe(12)
        expect(x.length).toBe(testUtil.totalClusterCommandCount)
        queryZcl
          .selectCommandById(db, x[0].id)
          .then((z) => expect(z.label).toBe(x[0].label))
      })
      .then(() => queryZcl.selectAllCommandArguments(db, jsonPackageId))
      .then((x) => expect(x.length).toEqual(testUtil.totalCommandArgsCount))
      .then(() => queryZcl.selectAllDomains(db, jsonPackageId))
      .then((x) => {
        expect(x.length).toEqual(testUtil.totalDomainCount)
        queryZcl
          .selectDomainById(db, x.id)
          .then((z) => expect(z.name).toBe(x.name))
      })
      .then(() => queryZcl.selectAllEnums(db, jsonPackageId))
      .then((x) => expect(x.length).toEqual(testUtil.totalEnumCount))
      .then(() =>
        queryZcl.selectAllAttributesBySide(db, 'server', jsonPackageId)
      )
      .then((x) => expect(x.length).toBe(testUtil.totalServerAttributeCount))
      .then(() => queryZcl.selectAllEnumItems(db, jsonPackageId))
      .then((x) => expect(x.length).toEqual(testUtil.totalEnumItemCount))
      .then(() => queryZcl.selectAllStructs(db, jsonPackageId))
      .then((x) => expect(x.length).toEqual(54))
      .then(() => queryZcl.selectAllBitmaps(db, jsonPackageId))
      .then(() => queryZcl.selectAllDeviceTypes(db, jsonPackageId))
      .then((x) => expect(x.length).toEqual(175))
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
      .then((x) => expect(x.length).toEqual(3))
      .then(() =>
        dbApi.dbAll(
          db,
          'SELECT MANUFACTURER_CODE FROM COMMAND WHERE MANUFACTURER_CODE NOT NULL',
          []
        )
      )
      .then((x) => expect(x.length).toEqual(51))
      .then(() =>
        dbApi.dbAll(
          db,
          'SELECT MANUFACTURER_CODE FROM ATTRIBUTE WHERE MANUFACTURER_CODE NOT NULL',
          []
        )
      )
      .then((x) => expect(x.length).toEqual(22))
      .then(() =>
        dbApi.dbMultiSelect(
          db,
          'SELECT CLUSTER_ID FROM CLUSTER WHERE CODE = ?',
          [[0], [6]]
        )
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
      .then(() =>
        dbApi.dbAll(
          db,
          'SELECT NAME, TYPE, PACKAGE_REF FROM ENUM WHERE NAME IN (SELECT NAME FROM ENUM GROUP BY NAME HAVING COUNT(*)>1)',
          []
        )
      )
      .finally(() => {
        dbApi.closeDatabase(db)
      })
  },
  testUtil.timeout.long()
)
