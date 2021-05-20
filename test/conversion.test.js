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
const generationEngine = require('../src-electron/generator/generation-engine.js')
const querySession = require('../src-electron/db/query-session.js')
const testUtil = require('./test-util.js')
const queryConfig = require('../src-electron/db/query-config.js')
const queryPackage = require('../src-electron/db/query-package.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const util = require('../src-electron/util/util.js')

let timeout = testUtil.longTimeout
let haLightIsc = path.join(__dirname, 'resource/isc/ha-light.isc')
let haCombinedIsc = path.join(
  __dirname,
  'resource/isc/ha-combined-interface.isc'
)

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

test.skip(
  path.basename(haLightIsc) + ' - conversion',
  async () => {
    let sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, haLightIsc, { sessionId: sid })
    expect(sid).not.toBeUndefined()

    // validate packageId
    let pkgs = await queryPackage.getSessionPackagesByType(
      db,
      sid,
      dbEnum.packageType.zclProperties
    )
    expect(pkgs.length).toBe(1)
    expect(pkgs[0].version).toBe('ZCL Test Data')

    let dump = await util.sessionDump(db, sid)

    expect(dump.endpointTypes.length).toBe(2)
    expect(dump.endpoints.length).toBe(2)
    expect(dump.endpoints[0].networkId).toBe(0)
    expect(dump.endpoints[1].networkId).toBe(0)

    // Now make sure we have attributes ONLY from one package.
    expect(dump.usedPackages.length).toBe(1)

    let attributeCounts = dump.endpointTypes.map((ept) => ept.attributes.length)
    expect(attributeCounts).toStrictEqual([26, 11])

    let reportableCounts = dump.endpointTypes.map((ept) =>
      ept.attributes.reduce((ac, at) => ac + (at.includedReportable ? 1 : 0), 0)
    )
    expect(reportableCounts).toStrictEqual([2, 0])

    /*
    let atts = []
    for (ept of dump.endpointTypes) {
      for (at of ept.attributes) {
        if (at.isBound) {
          atts.push(at)
        }
      }
    }
    console.log(
      atts.reduce(
        (s, v) => s + `\n${v.id} =>${v.clusterId} / ${v.code}`,
        `Total number: ${atts.length}`
      )
    )
    */

    let boundedCounts = dump.endpointTypes.map((ept) =>
      ept.attributes.reduce((ac, at) => ac + (at.isBound ? 1 : 0), 0)
    )
    expect(boundedCounts).toStrictEqual([11, 2])

    let singletonCounts = dump.endpointTypes.map((ept) =>
      ept.attributes.reduce((ac, at) => ac + (at.isSingleton ? 1 : 0), 0)
    )
    expect(singletonCounts).toStrictEqual([7, 11])

    let serverAttributesCount = dump.attributes.reduce(
      (ac, at) => (ac += at.side == dbEnum.side.server ? 1 : 0),
      0
    )
    expect(serverAttributesCount).toBe(35)
    let clientAttributesCount = dump.attributes.reduce(
      (ac, at) => (ac += at.side == dbEnum.side.client ? 1 : 0),
      0
    )
    expect(clientAttributesCount).toBe(2)
  },
  timeout
)

test(
  path.basename(haCombinedIsc) + ' - conversion',
  async () => {
    sid = await querySession.createBlankSession(db)
    await importJs.importDataFromFile(db, haCombinedIsc, { sessionId: sid })
    expect(sid).not.toBeUndefined()

    // validate packageId
    let pkgs = await queryPackage.getSessionPackagesByType(
      db,
      sid,
      dbEnum.packageType.zclProperties
    )
    expect(pkgs.length).toBe(1)
    expect(pkgs[0].version).toBe('ZCL Test Data')

    let dump = await util.sessionDump(db, sid)

    expect(dump.endpointTypes.length).toBe(1)
    expect(dump.endpoints.length).toBe(1)
  },
  timeout
)
