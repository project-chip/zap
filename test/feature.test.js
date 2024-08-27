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
const testUtil = require('./test-util')
const env = require('../src-electron/util/env')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const dbApi = require('../src-electron/db/db-api')
const queryDeviceType = require('../src-electron/db/query-device-type')
const queryFeature = require('../src-electron/db/query-feature')

let db
let ctx
let pkgId

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('query')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  // load Matter packages for testing features
  ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  pkgId = ctx.packageId
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Test get device type features',
  async () => {
    /** test with MA-dimmablelight device type, the only device type 
        associated with features in current xml file
        it should have 3 device type features */
    let deviceTypeName = 'MA-dimmablelight'
    let MA_Dimmablelight = await queryDeviceType.selectDeviceTypeByCodeAndName(
      db,
      pkgId,
      257,
      deviceTypeName
    )
    let deviceTypeFeatures = await queryFeature.getFeaturesByDeviceTypeRefs(
      db,
      [MA_Dimmablelight.id]
    )

    let expectedDeviceTypeFeatures = [
      {
        cluster: 'On/Off',
        name: 'Lighting',
        conformance: 'M'
      },
      {
        cluster: 'Level Control',
        name: 'OnOff',
        conformance: 'M'
      },
      {
        cluster: 'Level Control',
        name: 'Lighting',
        conformance: 'M'
      }
    ]

    expect(deviceTypeFeatures.length).toBe(3)

    deviceTypeFeatures.forEach((feature) => {
      expect(feature.deviceType == deviceTypeName)
      let expected = expectedDeviceTypeFeatures.find(
        (f) =>
          f.cluster == feature.cluster &&
          f.name == feature.name &&
          f.conformance == feature.conformance
      )
      expect(expected).toBeTruthy()
    })
  },
  testUtil.timeout.short()
)
