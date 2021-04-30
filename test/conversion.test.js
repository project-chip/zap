/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
const path = require('path')
const fs = require('fs')
const importJs = require('../src-electron/importexport/import.js')
const exportJs = require('../src-electron/importexport/export.js')
const dbEnum = require('../src-shared/db-enum.js')
const dbApi = require('../src-electron/db/db-api.js')
const env = require('../src-electron/util/env.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const queryGeneric = require('../src-electron/db/query-generic.js')
const generationEngine = require('../src-electron/generator/generation-engine.js')
const querySession = require('../src-electron/db/query-session.js')
const testUtil = require('./test-util.js')
const queryConfig = require('../src-electron/db/query-config.js')
const queryPackage = require('../src-electron/db/query-package.js')
let haLightIsc = path.join(__dirname, 'resource/isc/ha-light.isc')

beforeAll(() => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('conversion')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .then(() => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile))
    .then(() => zclLoader.loadZcl(db, env.builtinDotdotZclMetafile))
    .catch((err) => env.logError(`Error: ${err}`))
}, 10000)

afterAll(() => {
  return dbApi.closeDatabase(db)
})

test(
  path.basename(haLightIsc) + ' - conversion',
  async () => {
    sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, haLightIsc, sid)
    expect(sid).not.toBeUndefined()

    // validate packageId
    let pkgs = await queryPackage.getSessionPackagesByType(
      db,
      sid,
      dbEnum.packageType.zclProperties
    )
    expect(pkgs.length).toBe(1)
    expect(pkgs[0].version).toBe('ZCL Test Data')

    let endpointTypes = await queryConfig.getAllEndpointTypes(db, sid)
    expect(endpointTypes.length).toBe(3)
    let endpoints = await queryConfig.getAllEndpoints(db, sid)
    expect(endpoints.length).toBe(2)
    expect(endpoints[0].networkId).toBe(0)
    expect(endpoints[1].networkId).toBe(0)
    let ps = []
    endpointTypes.forEach((ept) => {
      ps.push(queryConfig.getEndpointTypeAttributes(db, ept.id))
    })
    let attributes = await Promise.all(ps)

    /*
    let attributeCounts = attributes.map((atArray) => atArray.length)
    expect(attributeCounts).toStrictEqual([28, 39, 16])

    let reportableCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.includedReportable ? 1 : 0), 0)
    )
    expect(reportableCounts).toStrictEqual([1, 2, 0])

    let boundedCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.bounded ? 1 : 0), 0)
    )
    expect(boundedCounts).toStrictEqual([10, 11, 2])
    let singletonCounts = attributes.map((atArray) =>
      atArray.reduce((ac, at) => ac + (at.singleton ? 1 : 0), 0)
    )
    expect(singletonCounts).toStrictEqual([9, 9, 13])
    */
  },
  8000
)
