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

/**
 * This file tests custom xml functionalities of ZAP for Matter.
 *
 * Tests are dependent on each other, please be cautious when changing or adding tests.
 */

const fs = require('fs')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const env = require('../src-electron/util/env')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const querySession = require('../src-electron/db/query-session')
const queryPackage = require('../src-electron/db/query-package')
const queryPackageNotification = require('../src-electron/db/query-package-notification')
const querySessionNotification = require('../src-electron/db/query-session-notification')
const queryDeviceType = require('../src-electron/db/query-device-type')
const queryConfig = require('../src-electron/db/query-config')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const queryZcl = require('../src-electron/db/query-zcl')
const queryAttribute = require('../src-electron/db/query-attribute')
const exportJs = require('../src-electron/importexport/export')
const util = require('../src-electron/util/util')
const restApi = require('../src-shared/rest-api.js')
const genEngine = require('../src-electron/generator/generation-engine')
const importJs = require('../src-electron/importexport/import')
let db
let sid
let mainPackageId
let clusterId
let attrId
let templateContext

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('custom-matter')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  mainPackageId = ctx.packageId
  let uuid = util.createUuid()
  sid = await testQuery.createSession(
    db,
    'USER',
    uuid,
    env.builtinMatterZclMetafile()
  )
  // loading templates
  templateContext = await genEngine.loadTemplates(
    db,
    testUtil.testTemplate.matter
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

let testClusterCode = 4294048800
let testExtensionCode = 6
let extendedClusterId
let numAttributes
let numCommands
let testPackageId

test(
  'Load matter custom xml',
  async () => {
    // check inital state
    x = await dbApi.dbAll(db, 'SELECT * FROM CLUSTER WHERE CODE = ?', [
      testClusterCode
    ])
    expect(x.length).toEqual(0)

    x = await dbApi.dbAll(db, 'SELECT * FROM CLUSTER WHERE CODE = ?', [
      testExtensionCode
    ])
    extendedClusterId = x[0].CLUSTER_ID

    x = await dbApi.dbAll(
      db,
      'SELECT * FROM ATTRIBUTE WHERE CLUSTER_REF = ?',
      extendedClusterId
    )
    numAttributes = x.length

    x = await dbApi.dbAll(
      db,
      'SELECT * FROM COMMAND WHERE CLUSTER_REF = ?',
      extendedClusterId
    )
    numCommands = x.length

    let result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testMatterCustomXml,
      sid
    )
    if (!result.succeeded) {
      console.log(`Test failure: ${result.err}`)
    }
    expect(result.succeeded).toBeTruthy()
    testPackageId = result.packageId

    // verify custom cluster and cluster extension are loaded correctly
    x = await dbApi.dbAll(db, 'SELECT * FROM CLUSTER WHERE CODE = ?', [
      testClusterCode
    ])
    expect(x.length).toEqual(1)

    clusterId = x[0].CLUSTER_ID

    x = await dbApi.dbAll(
      db,
      'SELECT * FROM ATTRIBUTE WHERE CLUSTER_REF = ?',
      clusterId
    )
    expect(x.length).toEqual(1)
    attrId = x[0].ATTRIBUTE_ID

    x = await dbApi.dbAll(
      db,
      'SELECT * FROM COMMAND WHERE CLUSTER_REF = ?',
      clusterId
    )
    expect(x.length).toEqual(3)

    x = await dbApi.dbAll(
      db,
      'SELECT * FROM ATTRIBUTE WHERE CLUSTER_REF = ?',
      extendedClusterId
    )
    expect(x.length).toEqual(numAttributes + 2)

    x = await dbApi.dbAll(
      db,
      'SELECT * FROM COMMAND WHERE CLUSTER_REF = ?',
      extendedClusterId
    )
    expect(x.length).toEqual(numCommands + 2)
  },
  testUtil.timeout.medium()
)

test(
  'Load second matter custom xml',
  async () => {
    // second xml adds 2 attributes and 2 commands to prevoiusly extended cluster
    let result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testMatterCustomXml2,
      sid
    )
    if (!result.succeeded) {
      console.log(`Test failure: ${result.err}`)
    }

    expect(result.succeeded).toBeTruthy()

    // check if they are added correctly
    x = await dbApi.dbAll(
      db,
      'SELECT * FROM ATTRIBUTE WHERE CLUSTER_REF = ?',
      extendedClusterId
    )
    expect(x.length).toEqual(numAttributes + 4)

    x = await dbApi.dbAll(
      db,
      'SELECT * FROM COMMAND WHERE CLUSTER_REF = ?',
      extendedClusterId
    )
    expect(x.length).toEqual(numCommands + 4)
  },
  testUtil.timeout.medium()
)

test(
  'Adding custom xml to a session that already has it',
  async () => {
    let sessionPackages = await queryPackage.getSessionPackages(db, sid)
    sessionPackagesCount = sessionPackages.length

    let result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testMatterCustomXml,
      sid
    )

    //validate that the package is not duplicated
    expect(result.packageId).toEqual(testPackageId)
    sessionPackages = await queryPackage.getSessionPackages(db, sid)
    expect(sessionPackages.length).toEqual(sessionPackagesCount)
  },
  testUtil.timeout.short()
)

test(
  'Deleting and re-adding custom xml should re-enable existing session package',
  async () => {
    /* deleting session package for custom xml (which essentially disables it) */
    sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sid,
        testPackageId
      )
    expect(sessionPartitionInfo.length).toBe(1)
    sessionPartitionId = sessionPartitionInfo[0].sessionPartitionId
    let result = await queryPackage.deleteSessionPackage(
      db,
      sessionPartitionId,
      testPackageId
    )
    expect(result).toBe(1)

    /* verify that the package is disabled */
    let sessionPackages = await queryPackage.getSessionPackages(db, sid) // get enabled session packages
    sessionPackages.forEach((sessionPkg) => {
      expect(sessionPkg.packageRef).not.toEqual(testPackageId)
    }) // since the custom xml package is disabled, it should not be in the list of enabled packages

    /* re-adding the custom xml package should re-enable it */
    result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testMatterCustomXml,
      sid
    )
    expect(result.succeeded).toBeTruthy()
    expect(result.packageId).toBe(testPackageId)

    sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sid,
        testPackageId,
        false // query disabled packages as well to check for duplicates
      )
    expect(sessionPartitionInfo.length).toBe(1) // should still be one entry
    expect(sessionPartitionInfo[0].sessionPartitionId).toBe(sessionPartitionId) // session partition id should be the same

    sessionPackages = await queryPackage.getSessionPackages(db, sid) // get enabled session packages
    expect(
      sessionPackages.some((sessionPkg) => {
        sessionPkg.packageRef == testPackageId
      })
    ).toBeTruthy // should contain testPackageId
  },
  testUtil.timeout.medium()
)

test(
  'generating with custom xml',
  async () => {
    // inserting an endpoint and enabling custom cluster
    let onOffDevice = await queryDeviceType.selectDeviceTypeByCode(
      db,
      mainPackageId,
      0x0102
    )
    expect(onOffDevice).not.toBeNull()
    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromDeviceType(
        db,
        sid,
        onOffDevice.id
      )
    let eptTypeId = await queryConfig.insertEndpointType(
      db,
      sessionPartitionInfo[0],
      'EPT',
      onOffDevice.id,
      onOffDevice.code,
      0,
      true
    )
    expect(eptTypeId).not.toBeNull()

    let eptTypeClusterId = await queryConfig.insertOrReplaceClusterState(
      db,
      eptTypeId,
      clusterId,
      'server',
      1
    )
    expect(eptTypeClusterId).not.toBeNull()

    let eptAttrId = await queryConfig.insertOrUpdateAttributeState(
      db,
      eptTypeId,
      clusterId,
      'server',
      attrId,
      [
        {
          key: restApi.updateKey.attributeSelected,
          value: 1
        }
      ],
      null,
      null,
      null
    )
    expect(eptAttrId).not.toBeNull()

    // enabling on/off cluster and attribute coming from cluster extension
    let onOffCluster = await queryZcl.selectClusterByCode(db, mainPackageId, 6)
    expect(onOffCluster).not.toBeNull()
    let onOffClusterId = onOffCluster.id
    expect(onOffClusterId).not.toBeNull()

    eptTypeClusterId = await queryConfig.insertOrReplaceClusterState(
      db,
      eptTypeId,
      onOffClusterId,
      'server',
      1
    )
    expect(eptTypeClusterId).not.toBeNull()

    let onOffAttr = await queryAttribute.selectAttributeByCode(
      db,
      [mainPackageId, testPackageId],
      6,
      0xfff10000,
      null
    )
    expect(onOffAttr).not.toBeNull()
    let onOffAttrId = onOffAttr.id
    expect(onOffAttrId).not.toBeNull()

    eptAttrId = await queryConfig.insertOrUpdateAttributeState(
      db,
      eptTypeId,
      onOffClusterId,
      'server',
      onOffAttrId,
      [
        {
          key: restApi.updateKey.attributeSelected,
          value: 1
        }
      ],
      null,
      null,
      null
    )
    expect(eptAttrId).not.toBeNull()

    let eptId = await queryEndpoint.insertEndpoint(
      db,
      sid,
      1,
      eptTypeId,
      0,
      0x0102
    )
    expect(eptId).not.toBeNull()

    // generating
    let genResult = await genEngine.generate(
      db,
      sid,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )

    // Testing custom xml cluster extension data types
    // Testing cluster extension from an xml file in zcl.json
    // Note: When cluster extensions are added to standard xml files in zcl.json
    // then all content needs to come under <clusterExtensions> so that they are
    // postprocessed onece all the other data has been loaded.
    let simpleText = genResult.content['simple-test.h']
    expect(simpleText).not.toBeNull()
    expect(simpleText).toContain(
      'Struct name: AdditionalInfoStruct, Struct Item Name: SystemMode, Struct Item Type: SystemModeEnum'
    )
    expect(simpleText).toContain(
      'Command name: customCommandForAdditionalInfoStruct, Command Argument Name: arg1, Command Argument Type: AdditionalInfoStruct'
    )

    let sdkExt = genResult.content['sdk-ext.txt']
    expect(sdkExt).not.toBeNull()
    expect(sdkExt).toContain(
      "// cluster: 0xFFF1FC20 Sample Custom Cluster, text extension: ''"
    )
    expect(sdkExt).toContain(
      "// attribute: 0x0006 / 0xFFF10000 => Sample Mfg Specific Attribute 2, extensions: '', '', scene: false"
    )
    expect(sdkExt).toContain(
      "// attribute: 0x0006 / 0xFFF10001 => Sample Mfg Specific Attribute 4, extensions: '', '', scene: false"
    )
    expect(sdkExt).toContain(
      "// attribute: 0x0006 / 0xFFF20000 => Sample Mfg Specific Attribute 6, extensions: '', '', scene: false"
    )
    expect(sdkExt).toContain(
      "// attribute: 0x0006 / 0xFFF20001 => Sample Mfg Specific Attribute 8, extensions: '', '', scene: false"
    )
    expect(sdkExt).toContain(
      "// command: 0x0006 / 0xFFF100 => SampleMfgSpecificOnWithTransition2, test extension: ''"
    )
    expect(sdkExt).toContain(
      "// command: 0x0006 / 0xFFF101 => SampleMfgSpecificToggleWithTransition2, test extension: ''"
    )
    expect(sdkExt).toContain(
      "// command: 0x0006 / 0xFFF200 => SampleMfgSpecificOnWithTransition2, test extension: ''"
    )
    expect(sdkExt).toContain(
      "/ command: 0x0006 / 0xFFF201 => SampleMfgSpecificToggleWithTransition2, test extension: ''"
    )
    expect(sdkExt).toContain('transitionTime - int16u')
    expect(sdkExt).toContain('transitionTime - int16u - default_value=0x0003')
    // checking if baseType for command arguments derived from custom xml is accurate
    expect(sdkExt).toContain(
      'Sample Custom Cluster - AddArgumentsResponse\n    returnValue - int8u'
    )

    let endpointConfig = genResult.content['endpoint-config.c']
    expect(endpointConfig).not.toBeNull()
    expect(endpointConfig).toContain(
      ' /* Endpoint: 1, Cluster: Sample Custom Cluster (server) */ \\'
    )
    expect(endpointConfig).toContain(
      '{ (uint16_t)0x0, (uint16_t)0x0, (uint16_t)0xFFFF }, /* Sample Mfg Specific Attribute 2 */ \\'
    )

    let endpointOut = genResult.content['endpoints.out']
    expect(endpointOut).not.toBeNull()
    expect(endpointOut).toContain('- SampleMfgSpecificOnWithTransition2: /')

    // delete custom xml and generate again
    sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        sid,
        testPackageId
      )
    await queryPackage.deleteSessionPackage(
      db,
      sessionPartitionInfo[0].sessionPartitionId,
      testPackageId
    )

    // verify first custom xml is deleted
    genResult = await genEngine.generate(
      db,
      sid,
      templateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )

    sdkExt = genResult.content['sdk-ext.txt']
    expect(sdkExt).not.toBeNull()
    expect(sdkExt).not.toContain(
      "// cluster: 0xFFF1FC20 Sample Custom Cluster, text extension: ''"
    )
    expect(sdkExt).not.toContain(
      "// attribute: 0x0006 / 0xFFF10000 => Sample Mfg Specific Attribute 2, extensions: '', '', scene: false"
    )
    expect(sdkExt).not.toContain(
      "// attribute: 0x0006 / 0xFFF10001 => Sample Mfg Specific Attribute 4, extensions: '', '', scene: false"
    )

    endpointConfig = genResult.content['endpoint-config.c']
    expect(endpointConfig).not.toBeNull()
    expect(endpointConfig).not.toContain(
      ' /* Endpoint: 1, Cluster: Sample Custom Cluster (server) */ \\'
    )
    expect(endpointConfig).not.toContain(
      '{ (uint16_t)0x0, (uint16_t)0x0, (uint16_t)0xFFFF }, /* Sample Mfg Specific Attribute 2 */ \\'
    )

    // create state from database and session to verify contents of .zap file
    let state = await exportJs.createStateFromDatabase(db, sid)
    expect(state.endpointTypes.length).toBe(1)
    expect(state.endpointTypes[0].clusters.length).toBe(8)

    // Modify custom xml and reupload
    const originalData = fs.readFileSync(testUtil.testMatterCustomXml, 'utf8')

    try {
      const modifiedData = originalData.replace(
        '<name>Sample Custom Cluster</name>',
        '<name>Sample Custom Changed</name>'
      )
      fs.writeFileSync(testUtil.testMatterCustomXml, modifiedData, 'utf8')

      const result = await zclLoader.loadIndividualFile(
        db,
        testUtil.testMatterCustomXml,
        sid
      )
      expect(result.succeeded).toBeTruthy()

      // generate again
      genResult = await genEngine.generate(
        db,
        sid,
        templateContext.packageId,
        {},
        { disableDeprecationWarnings: true }
      )

      // verify custom xml is updated
      sdkExt = genResult.content['sdk-ext.txt']
      expect(sdkExt).not.toBeNull()

      endpointConfig = genResult.content['endpoint-config.c']
      expect(endpointConfig).not.toBeNull()

      expect(sdkExt).toContain(
        "// cluster: 0xFFF1FC20 Sample Custom Changed, text extension: ''"
      )

      expect(sdkExt).not.toContain(
        "// cluster: 0xFFF1FC20 Sample Custom Cluster, text extension: ''"
      )

      expect(endpointConfig).not.toContain(
        ' /* Endpoint: 1, Cluster: Sample Custom Cluster (server) */ \\'
      )

      // Verify that there are two instances of this package with only one in sync
      let customXmlPackages = await dbApi.dbAll(
        db,
        'SELECT * FROM PACKAGE WHERE PATH = ?',
        [testUtil.testMatterCustomXml]
      )
      expect(customXmlPackages.length).toEqual(2)
      expect(
        customXmlPackages[0].IS_IN_SYNC ^ customXmlPackages[1].IS_IN_SYNC
      ).toBeTruthy()
    } finally {
      // restore original custom xml
      fs.writeFileSync(testUtil.testMatterCustomXml, originalData, 'utf8')
    }
  },
  testUtil.timeout.long()
)

test(
  'Add bad custom xml',
  async () => {
    // adding bad custom xml with type contradiction should throw warning
    let result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testBadMatterCustomXml,
      sid
    )
    expect(result.succeeded).toBeTruthy()

    let packageNotif =
      await queryPackageNotification.getNotificationByPackageId(
        db,
        result.packageId
      )
    expect(
      packageNotif.some((notif) => notif.message.includes('type contradiction'))
    ).toBeTruthy() // checks if the correct type contradiction warning is thrown

    expect(
      packageNotif.some((notif) =>
        notif.message.includes('Duplicate attribute found')
      )
    ).toBeTruthy() // checks if the correct duplicate attribute error is thrown

    expect(
      packageNotif.some((notif) =>
        notif.message.includes('Duplicate command found')
      )
    ).toBeTruthy() // checks if the correct duplicate command error is thrown

    let sessionNotif = await querySessionNotification.getNotification(db, sid)
    expect(
      sessionNotif.some(
        (notif) =>
          notif.type === 'ERROR' &&
          notif.message.includes('Undefined Data Type') &&
          notif.message.includes('Attribute Sample Mfg Specific Attribute') &&
          notif.message.includes('matter-bad-custom.xml')
      )
    ).toBeTruthy()
    expect(
      sessionNotif.some(
        (notif) =>
          notif.type === 'ERROR' &&
          notif.message.includes('Undefined Data Type') &&
          notif.message.includes('arg1') &&
          notif.message.includes('matter-bad-custom.xml')
      )
    ).toBeTruthy()
  },
  testUtil.timeout.short()
)

test(
  'Add 2 custom files with code collisions',
  async () => {
    // creating a new session with new uuid
    let uuid = util.createUuid()
    conflictSid = await testQuery.createSession(
      db,
      'USER',
      uuid,
      env.builtinMatterZclMetafile()
    )

    let result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testMatterCustomXml,
      conflictSid
    )
    expect(result.succeeded).toBeTruthy()

    result = await zclLoader.loadIndividualFile(
      db,
      testUtil.testMatterConflict,
      conflictSid
    )
    expect(result.succeeded).toBeTruthy()
    let conflictPackageId = result.packageId

    let sessionNotif = await querySessionNotification.getNotification(
      db,
      conflictSid
    )
    expect(
      sessionNotif.some(
        (notif) =>
          notif.type === 'ERROR' &&
          notif.message.includes('Cluster code conflict') &&
          notif.message.includes('matter-custom.xml') &&
          notif.message.includes('matter-conflict.xml')
      )
    ).toBeTruthy()
    expect(
      sessionNotif.some(
        (notif) =>
          notif.type === 'ERROR' &&
          notif.message.includes('Command code conflict') &&
          notif.message.includes('matter-custom.xml') &&
          notif.message.includes('matter-conflict.xml')
      )
    ).toBeTruthy()
    expect(
      sessionNotif.some(
        (notif) =>
          notif.type === 'ERROR' &&
          notif.message.includes('Attribute code conflict') &&
          notif.message.includes('matter-custom.xml') &&
          notif.message.includes('matter-conflict.xml')
      )
    ).toBeTruthy()

    // delete the conflicting package and verify that the notifications are removed
    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromPackageId(
        db,
        conflictSid,
        conflictPackageId
      )
    await queryPackage.deleteSessionPackage(
      db,
      sessionPartitionInfo[0].sessionPartitionId,
      conflictPackageId
    )

    sessionNotif = await querySessionNotification.getNotification(
      db,
      conflictSid
    )
    expect(sessionNotif.length).toEqual(0)
  },
  testUtil.timeout.medium()
)

test(
  'loading zap file with custom xml that does not exist',
  async () => {
    // creating a new session with a new uuid
    let newSid = await testQuery.createSession(
      db,
      'USER',
      'SESSION3',
      env.builtinMatterZclMetafile()
    )

    // importing a zap file with custom xml that does not exist
    let importResult = await importJs.importDataFromFile(
      db,
      testUtil.testMatterMissingCustomZap,
      {
        sessionId: newSid
      }
    )

    let allNotif = await querySessionNotification.getNotification(db, newSid)

    // veryfing correct error is thrown
    expect(allNotif.some((notif) => notif.type === 'ERROR')).toBeTruthy()

    expect(
      allNotif.some((notif) =>
        notif.message.includes('Error reading xml file:')
      )
    ).toBeTruthy()
  },
  testUtil.timeout.short()
)

test(
  'loading zap file with custom xml and generating',
  async () => {
    // creating a new database to test for edge case where custom xml path is valid but hasn't been loaded into the db yet
    let newDb = await dbApi.initRamDatabase()
    await dbApi.loadSchema(newDb, env.schemaFile(), env.zapVersion())
    let newTemplateContext = await genEngine.loadTemplates(
      newDb,
      testUtil.testTemplate.matter
    )

    // creating a new session
    let newSid = await querySession.createBlankSession(newDb)

    // importing a zap file with custom xml
    let importResult = await importJs.importDataFromFile(
      newDb,
      testUtil.testMatterCustomZap,
      {
        sessionId: newSid
      }
    )

    // generating
    let genResult = await genEngine.generate(
      newDb,
      newSid,
      newTemplateContext.packageId,
      {},
      { disableDeprecationWarnings: true }
    )

    // verifying generated content
    let sdkExt = genResult.content['sdk-ext.txt']
    expect(sdkExt).not.toBeNull()
    expect(sdkExt).toContain(
      "// cluster: 0xFFF1FC20 Sample Custom Cluster, text extension: ''"
    )
    expect(sdkExt).toContain(
      "// attribute: 0x0006 / 0xFFF10000 => Sample Mfg Specific Attribute 2, extensions: '', '', scene: false"
    )
    expect(sdkExt).toContain(
      "// attribute: 0x0006 / 0xFFF10001 => Sample Mfg Specific Attribute 4, extensions: '', '', scene: false"
    )
    expect(sdkExt).toContain(
      "// command: 0x0006 / 0xFFF100 => SampleMfgSpecificOnWithTransition2, test extension: ''"
    )
    expect(sdkExt).toContain(
      "// command: 0x0006 / 0xFFF101 => SampleMfgSpecificToggleWithTransition2, test extension: ''"
    )

    let endpointConfig = genResult.content['endpoint-config.c']
    expect(sdkExt).not.toBeNull()
    expect(endpointConfig).toContain(
      ' /* Endpoint: 1, Cluster: Sample Custom Cluster (server) */ \\'
    )
  },
  testUtil.timeout.medium()
)
