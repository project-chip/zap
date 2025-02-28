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
const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const queryAttribute = require('../src-electron/db/query-attribute')
const querySession = require('../src-electron/db/query-session')
const queryZcl = require('../src-electron/db/query-zcl')
const queryPackage = require('../src-electron/db/query-package')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const dbEnum = require('../src-shared/db-enum')

let db
let templateContext
let zclPackageId

const testFile = testUtil.matterTestFile.matterTest
const testMatterSwitch = testUtil.matterTestFile.switch
const templateCount = testUtil.testTemplate.matterCount

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('gen-matter-1')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  zclPackageId = ctx.packageId
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test('Validate loading', async () => {
  let c = await testQuery.selectCountFrom(db, 'TAG')
  expect(c).toBe(testUtil.totalMatterTags)
  c = await testQuery.selectCountFrom(db, 'GLOBAL_ATTRIBUTE_BIT')
  expect(c).toBe(testUtil.totalMatterGlobalAttributeBits)

  let attr = await queryAttribute.selectAttributeByCode(
    db,
    zclPackageId,
    null,
    0xfffc,
    null
  )
  expect(attr).not.toBe(null)

  let cluster = await queryZcl.selectClusterByCode(
    db,
    zclPackageId,
    0x0029,
    null
  )
  expect(cluster).not.toBe(null)
  expect(cluster.name).toBe('OTA Software Update Provider')
})

test('Validate loading of features as bitmap', async () => {
  /* See level-control-cluster.xml which has the following:
  <features>
      <feature bit="0" code="OO" name="OnOff" default="1" summary="Dependency with the On/Off cluster">
        <optionalConform/>
      </feature>
      <feature bit="1" code="LT" name="Lighting" default="0" summary="Behavior that supports lighting applications">
        <optionalConform/>
      </feature>
      <feature bit="2" code="FQ" name="Frequency" default="0" summary="Supports frequency attributes and behavior.
                                        The Pulse Width Modulation cluster was created
                                        for frequency control.">
        <provisionalConform/>
      </feature>
    </features>
  */
  let clusterInfo = await queryZcl.selectClusterByCode(db, zclPackageId, 0x0008)

  let dataType = await queryZcl.selectDataTypeByNameAndClusterId(
    db,
    'Feature',
    clusterInfo.id,
    [zclPackageId]
  )
  expect(dataType).not.toBeNull()
  expect(dataType.name).toEqual('Feature')
})

test(
  'Basic gen template parsing and generation',
  async () => {
    templateContext = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.matter
    )

    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.templateData).not.toBeNull()
    expect(templateContext.templateData.name).toEqual('Matter test template')
    expect(templateContext.templateData.version).toEqual('test-matter')
    expect(templateContext.templateData.templates.length).toEqual(templateCount)
    expect(templateContext.packageId).not.toBeNull()
  },
  testUtil.timeout.medium()
)

test(
  'Verify specific generator setting for session is present.',
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
              'disableUcComponentOnZclClusterUpdate'
            )
            expect(generatorConfigurations[0].optionLabel).toBe('true')
          })
      }),
  testUtil.timeout.short()
)

test(
  `Zap file generation: ${path.relative(__dirname, testFile)}`,
  async () => {
    let sessionId = await querySession.createBlankSession(db)

    await importJs.importDataFromFile(db, testFile, {
      sessionId: sessionId
    })

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )

    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()
    let sdkExt = genResult.content['sdk-ext.txt']
    expect(sdkExt).not.toBeNull()
    expect(
      sdkExt.includes(
        "// cluster: 0x0029 OTA Software Update Provider, text extension: ''"
      )
    ).toBeTruthy()

    let simpleTest = genResult.content['simple-test.h']
    expect(simpleTest).toContain(
      'Cluster Name : OnOff+Command Name : OnWithRecallGlobalScene'
    )
    expect(simpleTest).toContain('ExternalAddon : 72')
    expect(simpleTest).toContain('ExternalAddon : 784')
    expect(simpleTest).toContain('ExternalAddon : 249')
    expect(simpleTest).toContain('ExternalAddon : 60')
    expect(simpleTest).toContain(
      'ExternalAddon : This is example of test external addon helper.'
    )

    // Testing base types based on xml defining them
    expect(simpleTest).toContain('Base type for bitmap8 : int8u')
    expect(simpleTest).toContain('Base type for bitmap32 : int32u')
    expect(simpleTest).toContain('Base type for bitmap64 : int64u')
    expect(simpleTest).toContain('Base type for enum8 : int8u')
    expect(simpleTest).toContain('Base type for enum16 : int16u')
    expect(simpleTest).toContain('Base type for ipv6adr : long_octet_string')

    let deviceType = genResult.content['device-types.txt']
    expect(deviceType).toContain(
      '// device type: CHIP / 0x0105 => MA-colordimmerswitch // extension: '
    )
    expect(deviceType).toContain('>> Attribute: StartUpCurrentLevel [16384]')
    expect(deviceType).toContain('>> Command: MoveToLevelWithOnOff [4]')

    let events = genResult.content['events.out']
    expect(events).toContain('Field: PreviousState [ENUM]')
    expect(events).toContain('Field: OperationSource [ENUM]')
    expect(events).toContain('Field: SourceNode')

    let chipToolHelper = genResult.content['chip-tool-helpers.txt']
    expect(chipToolHelper).toContain('0,1// actual type: BOOLEAN')
    expect(chipToolHelper).toContain('0,UINT16_MAX// actual type: INT16U')
    expect(chipToolHelper).toContain(
      '0,UINT0_MAX// actual type: ThermostatScheduleTransition'
    )

    // Testing attribute qualities loading
    expect(
      sdkExt.includes(
        "// attribute: 0x0300 / 0x4001 => EnhancedColorMode, extensions: '', '', scene: true, isChangeOmitted: true, persistence: nonVolatile"
      )
    )

    // Testing isLargeMessage quality for commands
    expect(
      sdkExt.includes(
        "// command: 0x0300 / 0x00 => MoveToHue, test extension: '', isLargeMessage: true"
      )
    )
  },
  testUtil.timeout.long()
)

test(
  `Zap file generation: ${path.relative(__dirname, testMatterSwitch)}`,
  async () => {
    let sessionId = await querySession.createBlankSession(db)

    await importJs.importDataFromFile(db, testMatterSwitch, {
      sessionId: sessionId
    })

    let genResult = await genEngine.generate(
      db,
      sessionId,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )

    expect(genResult).not.toBeNull()
    expect(genResult.partial).toBeFalsy()
    expect(genResult.content).not.toBeNull()

    let endpoints = genResult.content['endpoints.out']
    expect(endpoints).toContain('>> device: MA-genericswitch [15]')
    expect(endpoints).toContain('> Switch [59] - server: 1')
    expect(endpoints).toContain('- InitialPress: 1')
    expect(endpoints).toContain('- ShortRelease: 1')
    expect(endpoints).toContain('- MultiPressOngoing: 1')
  },
  testUtil.timeout.long()
)
