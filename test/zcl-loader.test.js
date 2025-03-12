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

const dbApi = require('../src-electron/db/db-api')
const dbEnum = require('../src-shared/db-enum')
const queryZcl = require('../src-electron/db/query-zcl')
const queryDeviceType = require('../src-electron/db/query-device-type')
const queryCommand = require('../src-electron/db/query-command')
const queryPackage = require('../src-electron/db/query-package')
const queryPackageNotification = require('../src-electron/db/query-package-notification')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const env = require('../src-electron/util/env')
const types = require('../src-electron/util/types')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const fs = require('fs')
const genEngine = require('../src-electron/generator/generation-engine')

beforeAll(async () => {
  env.setDevelopmentEnv()
})

test(
  'test opening and closing the database',
  async () => {
    let db = await dbApi.initRamDatabase()
    await dbApi.closeDatabase(db)
  },
  testUtil.timeout.medium()
)

test(
  'test database schema loading in memory',
  async () => {
    let db = await dbApi.initRamDatabase()
    await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
    await dbApi.closeDatabase(db)
  },
  testUtil.timeout.medium()
)

test(
  'test Silabs zcl data loading in memory',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())

      let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
      let packageId = ctx.packageId

      let packageNotif =
        await queryPackageNotification.getNotificationByPackageId(db, packageId)
      expect(
        packageNotif.some((notif) =>
          notif.message.includes('Duplicate command found')
        )
      ).toBeTruthy() // checks if the correct duplicate command error is thrown

      let p = await queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
      expect(p.version).toEqual(1)
      expect(p.description).toEqual('ZigbeePro test data')
      expect(p.category).toEqual('zigbee')
      let x = await queryPackage.getPackagesByType(
        db,
        dbEnum.packageType.zclProperties
      )

      expect(x.length).toEqual(1)

      x = await queryZcl.selectAllClusters(db, packageId)
      expect(x.length).toEqual(testUtil.totalClusterCount)
      x = await queryZcl.selectAllDomains(db, packageId)
      expect(x.length).toEqual(testUtil.totalDomainCount)
      x = await queryZcl.selectAllEnums(db, packageId)
      expect(x.length).toEqual(testUtil.totalEnumCount)
      x = await queryZcl.selectAllStructsWithItems(db, [packageId])
      expect(x.length).toEqual(54)
      x = await queryZcl.selectAllBitmaps(db, packageId)
      expect(x.length).toEqual(129)

      x = await queryZcl.selectAllStrings(db, packageId)
      x = x.map((item) => item.name)
      let strings = [
        'octet_string',
        'char_string',
        'long_octet_string',
        'long_char_string'
      ]
      expect(x.length).toEqual(4)
      strings.forEach((s) => {
        expect(x).toContain(s)
      })

      x = await queryDeviceType.selectAllDeviceTypes(db, packageId)
      expect(x.length).toEqual(175)
      x = await testQuery.selectCountFrom(db, 'COMMAND_ARG')
      expect(x).toEqual(testUtil.totalCommandArgsCount)
      x = await testQuery.selectCountFrom(db, 'COMMAND')
      expect(x).toEqual(testUtil.totalCommandCount)
      x = await testQuery.selectCountFrom(db, 'EVENT_FIELD')
      expect(x).toEqual(testUtil.totalEventFieldCount)
      x = await testQuery.selectCountFrom(db, 'EVENT')
      expect(x).toEqual(testUtil.totalEventCount)
      x = await testQuery.selectCountFrom(db, 'ENUM_ITEM')
      expect(x).toEqual(testUtil.totalEnumItemCount)
      x = await testQuery.selectCountFrom(db, 'ATTRIBUTE')
      expect(x).toEqual(testUtil.totalAttributeCount)
      x = await testQuery.selectCountFrom(db, 'BITMAP_FIELD')
      expect(x).toEqual(726)
      x = await testQuery.selectCountFrom(db, 'STRUCT_ITEM')
      expect(x).toEqual(165)
      x = await testQuery.selectCountFrom(db, 'GLOBAL_ATTRIBUTE_DEFAULT')
      expect(x).toEqual(126)
      x = await testQuery.selectCountFrom(db, 'SPEC')
      expect(x).toEqual(testUtil.totalSpecCount)
      x = await testQuery.selectCountFrom(db, 'TAG')
      expect(x).toEqual(1)

      x = await dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM CLUSTER WHERE MANUFACTURER_CODE NOT NULL',
        []
      )

      expect(x.length).toEqual(5)

      x = await dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM COMMAND WHERE MANUFACTURER_CODE NOT NULL',
        []
      )

      expect(x.length).toEqual(58)
      x = await dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM ATTRIBUTE WHERE MANUFACTURER_CODE NOT NULL',
        []
      )

      expect(x.length).toEqual(30)

      let rows = await dbApi.dbMultiSelect(
        db,
        'SELECT CLUSTER_ID FROM CLUSTER WHERE CODE = ?',
        [[0], [6]]
      )

      expect(rows.length).toBe(2)
      expect(rows[0]).not.toBeUndefined()
      expect(rows[1]).not.toBeUndefined()
      expect(rows[0].CLUSTER_ID).not.toBeUndefined()
      expect(rows[1].CLUSTER_ID).not.toBeUndefined()
      rows = await queryPackage.selectAllOptionsValues(
        db,
        packageId,
        dbEnum.sessionOption.defaultResponsePolicy
      )

      expect(rows.length).toBe(3)

      let commandTree = await queryCommand.selectCommandTree(db, [packageId])
      let found = false
      commandTree.forEach((c) => {
        if (c.clusterCode == 0 && c.code == 0) found = true
      })
      expect(found).toBeTruthy()

      x = await dbApi.dbAll(
        db,
        'SELECT DATA_TYPE.NAME AS NAME, BITMAP.BITMAP_ID, DATA_TYPE.PACKAGE_REF FROM BITMAP INNER JOIN DATA_TYPE ON BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID WHERE NAME IN (SELECT DATA_TYPE.NAME AS NAME FROM BITMAP INNER JOIN DATA_TYPE ON BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID GROUP BY NAME HAVING COUNT(*)>1)',
        []
      )

      x.forEach((c) => {
        env.logWarning(
          `Found Non Unique Bitmap in Silabs XML: ${c.NAME} ${c.TYPE} ${c.PACKAGE_REF}`
        )
      })

      let attributes = await queryZcl.selectAllAttributes(db, [packageId])
      expect(attributes.length).toBeGreaterThan(40)
      let ps = []
      attributes.forEach((a) => {
        ps.push(types.typeSizeAttribute(db, [packageId], a))
      })

      x = await dbApi.dbAll(
        db,
        'SELECT DATA_TYPE.NAME, ENUM.ENUM_ID, DATA_TYPE.PACKAGE_REF FROM ENUM INNER JOIN DATA_TYPE ON ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID WHERE NAME IN (SELECT DATA_TYPE.NAME FROM ENUM INNER JOIN DATA_TYPE ON ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID GROUP BY DATA_TYPE.NAME HAVING COUNT(*)>1)',
        []
      )

      x.forEach((c) => {
        env.logWarning(
          `Found Non Unique Enum in Silabs XML: ${c.NAME} ${c.TYPE} ${c.PACKAGE_REF}`
        )
      })
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)

test(
  'test changing xml file reloads all zcl packages',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())

      let ctx = await zclLoader.loadZcl(
        db,
        env.builtinSilabsZclSpecialMetafile()
      )
      let packageId = ctx.packageId

      // Test Reloading of the zcl packages when an xml file changes
      // (Simulating a gsdk upgrade from one branch to another which can change xml files)
      // Step 1: Modify one of the xml files
      let xmlFilePath = env.builtinSilabsSpecialZclGeneralSpecialXmlFile()
      let originalString =
        '<attribute side="server" code="0x0001" define="APPLICATION_VERSION" type="INT8U" min="0x00" max="0xFF" writable="false" default="0x00" optional="true">application version</attribute>'
      let editString =
        '<attribute side="server" code="0x0001" define="APPLICATION_VERSION" type="INT8U" min="0x00" max="0xFF" writable="false" default="0x01" optional="true">application version</attribute>'
      let generalXmlFileOriginalContent = fs.readFileSync(xmlFilePath, 'utf8')
      let generalXmlFileUpdatedContent = generalXmlFileOriginalContent.replace(
        originalString,
        editString
      )
      fs.writeFileSync(xmlFilePath, generalXmlFileUpdatedContent, 'utf8')

      // Step 2: This will cause the all zcl packages from top level to all its
      // children to be reloaded. Check for 2 top level packages with same path now.
      // Count packages belonging to each top level package to make sure all packages
      // are reloaded
      ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclSpecialMetafile())
      let newPackageId = ctx.packageId
      // Making sure the top level packages do not have the same packageId
      expect(packageId).not.toEqual(newPackageId)
      let oldPackages = await dbApi.dbAll(
        db,
        `SELECT * FROM PACKAGE WHERE PARENT_PACKAGE_REF = ${packageId}`
      )
      let newPackages = await dbApi.dbAll(
        db,
        `SELECT * FROM PACKAGE WHERE PARENT_PACKAGE_REF = ${newPackageId}`
      )
      // Making sure all packages are loaded again
      expect(oldPackages.length).toEqual(newPackages.length)

      let topLevelZclPackages = await dbApi.dbAll(
        db,
        `SELECT * FROM PACKAGE WHERE TYPE = '${dbEnum.packageType.zclProperties}' ORDER BY PACKAGE_ID`
      )
      expect(topLevelZclPackages[0].IS_IN_SYNC).toEqual(0)
      expect(topLevelZclPackages[1].IS_IN_SYNC).toEqual(1)

      // Step 3: Revert the xml file change in step 1.
      fs.writeFileSync(xmlFilePath, generalXmlFileOriginalContent, 'utf8')
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)

test(
  'test changing the zcl extension file in a top level templates json file and make sure it is re-loaded again',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
      let context = await genEngine.loadTemplates(
        db,
        testUtil.testTemplate.zigbee2
      )
      let existingPackageId = context.packageId

      // Reload package
      context = await genEngine.loadTemplates(db, testUtil.testTemplate.zigbee2)
      expect(existingPackageId).toEqual(context.packageId)
      let existingPackageDetails = await queryPackage.getPackageByPackageId(
        db,
        existingPackageId
      )
      expect(existingPackageDetails.isInSync).toEqual(1)

      // Update the cluster-to-component.json extension file
      let extensionFile =
        testUtil.testTemplate.zclExtensionClusterToComponentFile
      let originalString = '"clusterCode": "zll commissioning-server"'
      let editString = '"clusterCode": "zll commissioningEdit-server"'
      let generalExtensionFileOriginalContent = fs.readFileSync(
        extensionFile,
        'utf8'
      )
      let generalExtensionFileUpdatedContent =
        generalExtensionFileOriginalContent.replace(originalString, editString)
      fs.writeFileSync(
        extensionFile,
        generalExtensionFileUpdatedContent,
        'utf8'
      )

      // Reload the templates json package after an extension file change above
      context = await genEngine.loadTemplates(db, testUtil.testTemplate.zigbee2)
      expect(existingPackageId).not.toEqual(context.packageId)
      existingPackageDetails = await queryPackage.getPackageByPackageId(
        db,
        existingPackageId
      )
      // The old package should no longer be in sync
      expect(existingPackageDetails.isInSync).toEqual(0)

      let newPackageDetails = await queryPackage.getPackageByPackageId(
        db,
        context.packageId
      )
      // The new package should now be in sync
      expect(newPackageDetails.isInSync).toEqual(1)

      // Revert the zcl extension json file change which was done to run this test.
      fs.writeFileSync(
        extensionFile,
        generalExtensionFileOriginalContent,
        'utf8'
      )
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)

test(
  'test Dotdot zcl data loading in memory',
  async () => {
    let unmatched = []
    let nullAttribute = []
    let nonUniqueEnum = []
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
      let ctx = await zclLoader.loadZcl(db, env.builtinDotdotZclMetafile())
      let packageId = ctx.packageId
      let p = await queryPackage.getPackageByPackageId(ctx.db, packageId)
      expect(p.version).toEqual(1)

      let x = await queryPackage.getPackagesByType(
        db,
        dbEnum.packageType.zclProperties
      )
      expect(x.length).toEqual(1)

      x = await queryZcl.selectAllClusters(db, packageId)
      expect(x.length).toEqual(41)
      x = await queryDeviceType.selectAllDeviceTypes(db, packageId)
      expect(x.length).toEqual(108)
      x = await testQuery.selectCountFrom(db, 'COMMAND_ARG')
      expect(x).toEqual(644)
      x = await testQuery.selectCountFrom(db, 'COMMAND')
      expect(x).toEqual(238)
      x = await testQuery.selectCountFrom(db, 'ATTRIBUTE')
      expect(x).toEqual(630)
      x = await queryZcl.selectAllAtomics(db, packageId)
      expect(x.length).toEqual(56)

      x = await queryZcl.selectAllStrings(db, packageId)
      x = x.map((item) => item.name)
      let strings = ['octstr', 'string', 'octstr16', 'string16']
      expect(x.length).toEqual(5) // 5th string is a subatomic type
      strings.forEach((s) => {
        expect(x).toContain(s)
      })

      x = await queryZcl.selectAllBitmaps(db, packageId)
      expect(x.length).toEqual(69)
      x = await queryZcl.selectAllEnums(db, packageId)
      expect(x.length).toEqual(testUtil.totalDotDotEnums)
      x = await testQuery.selectCountFrom(db, 'ENUM_ITEM')
      expect(x).toEqual(testUtil.totalDotDotEnumItems)
      x = await queryZcl.selectAllStructsWithItemCount(db, [packageId])
      expect(x.length).toEqual(20)
      x = await testQuery.selectCountFrom(db, 'STRUCT_ITEM')
      expect(x).toEqual(63)

      //Do some checking on the device type metadata
      x = await queryDeviceType.selectAllDeviceTypes(db, packageId)

      x.forEach((d) => {
        queryDeviceType
          .selectDeviceTypeClustersByDeviceTypeRef(db, d.id)
          .then((dc) => {
            dc.forEach((dcr) => {
              if (!dcr.clusterRef) {
                unmatched.push(
                  `for ${d.caption} failed to match dcr ${dcr.clusterName}`
                )
              } else {
                queryDeviceType
                  .selectDeviceTypeAttributesByDeviceTypeRef(
                    db,
                    dcr.deviceTypeRef
                  )
                  .then((dcas) => {
                    if (dcas.length > 0) {
                      dcas.forEach((dca) => {
                        if (!dca.attributeRef) {
                          nullAttribute.push(
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

      x = await dbApi.dbAll(
        db,
        'SELECT DATA_TYPE.NAME, ENUM.ENUM_ID, DATA_TYPE.PACKAGE_REF FROM ENUM INNER JOIN DATA_TYPE ON ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID WHERE NAME IN (SELECT DATA_TYPE.NAME FROM ENUM INNER JOIN DATA_TYPE ON ENUM.ENUM_ID = DATA_TYPE.DATA_TYPE_ID GROUP BY DATA_TYPE.NAME HAVING COUNT(*)>1)',
        []
      )

      x.forEach((c) => {
        nonUniqueEnum.push(
          `Found Non Unique Enum in Dotdot XML: ${c.NAME} ${c.TYPE} ${c.PACKAGE_REF}`
        )
      })

      expect(nonUniqueEnum.length).toBe(0)
      expect(unmatched.length).toBeGreaterThan(0)
      expect(nullAttribute.length).toEqual(0)
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)

test(
  'test Dotdot and Silabs zcl data loading in memory',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
      let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
      let packageIdSilabs = ctx.packageId

      let p = await queryPackage.getPackageByPackageId(ctx.db, packageIdSilabs)
      expect(p.version).toEqual(1)

      let rows = await queryPackage.getPackagesByType(
        db,
        dbEnum.packageType.zclProperties
      )
      expect(rows.length).toEqual(1)

      ctx = await zclLoader.loadZcl(db, env.builtinDotdotZclMetafile())
      let packageIdDotdot = ctx.packageId

      p = await queryPackage.getPackageByPackageId(ctx.db, packageIdDotdot)
      expect(p.version).toEqual(1)
      rows = await queryPackage.getPackagesByType(
        db,
        dbEnum.packageType.zclProperties
      )
      expect(rows.length).toEqual(2)

      let x = await dbApi.dbAll(
        db,
        'SELECT NAME, CODE, PACKAGE_REF FROM CLUSTER WHERE CODE IN (SELECT CODE FROM CLUSTER GROUP BY CODE HAVING COUNT(CODE)=1)',
        []
      )
      expect(x.length).toBeGreaterThan(0)

      x = await dbApi.dbAll(
        db,
        'SELECT NAME, ATOMIC_IDENTIFIER, PACKAGE_REF FROM ATOMIC WHERE ATOMIC_IDENTIFIER IN (SELECT ATOMIC_IDENTIFIER FROM ATOMIC GROUP BY ATOMIC_IDENTIFIER HAVING COUNT(ATOMIC_IDENTIFIER)=1)',
        []
      )
      expect(x.length).toBeGreaterThan(0)
      x = await dbApi.dbAll(
        db,
        'SELECT DATA_TYPE.NAME AS NAME, BITMAP.BITMAP_ID, DATA_TYPE.PACKAGE_REF FROM BITMAP INNER JOIN DATA_TYPE ON BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID WHERE NAME IN (SELECT DATA_TYPE.NAME AS NAME FROM BITMAP INNER JOIN DATA_TYPE ON BITMAP.BITMAP_ID = DATA_TYPE.DATA_TYPE_ID GROUP BY NAME HAVING COUNT(NAME)=1)',
        []
      )
      expect(x.length).toBeGreaterThan(0)
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)

test(
  'test Matter zcl data loading in memory',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
      let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
      let packageId = ctx.packageId
      let p = await queryPackage.getPackageByPackageId(ctx.db, packageId)
      expect(p.version).toEqual(1)

      let x = await queryPackage.getPackagesByType(
        db,
        dbEnum.packageType.zclProperties
      )
      expect(x.length).toEqual(1)

      x = await queryZcl.selectAllClusters(db, packageId)
      expect(x.length).toEqual(testUtil.totalMatterClusters)
      x = await queryDeviceType.selectAllDeviceTypes(db, packageId)
      expect(x.length).toEqual(testUtil.totalMatterDeviceTypes)
      x = await testQuery.selectCountFrom(db, 'COMMAND_ARG')
      expect(x).toEqual(testUtil.totalMatterCommandArgs)
      x = await testQuery.selectCountFrom(db, 'COMMAND')
      expect(x).toEqual(testUtil.totalMatterCommands)
      x = await testQuery.selectCountFrom(db, 'ATTRIBUTE')
      expect(x).toEqual(testUtil.totalMatterAttributes)
      x = await testQuery.selectCountFrom(db, 'TAG')
      expect(x).toEqual(testUtil.totalMatterTags)
      x = await testQuery.selectCountFrom(db, 'EVENT')
      expect(x).toEqual(testUtil.totalMatterEvents)
      x = await testQuery.selectCountFrom(db, 'EVENT_FIELD')
      expect(x).toEqual(testUtil.totalMatterEventFields)
      x = await testQuery.selectCountFrom(db, 'GLOBAL_ATTRIBUTE_BIT')
      expect(x).toBe(testUtil.totalMatterGlobalAttributeBits)
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)

test(
  'test Matter list-typed attribute loading in memory',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
      let ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
      let packageId = ctx.packageId

      let zclCluster = await queryZcl.selectClusterByCode(db, packageId, 0x001f)

      /* Verify that the ACL attribute, defined using the list type format `array="true" type="X"` in XML,
        is correctly parsed and stored in the database as an array of AccessControlEntryStruct. */
      let attributes = await dbApi.dbAll(
        db,
        "SELECT * FROM ATTRIBUTE WHERE CLUSTER_REF = ? AND CODE = 0x0000 AND NAME = 'ACL'",
        [zclCluster.id]
      )
      expect(attributes.length).toBe(1)
      let aclAttribute = attributes[0]
      expect(aclAttribute.TYPE).toBe('array')
      expect(aclAttribute.ARRAY_TYPE).toBe('AccessControlEntryStruct')

      // verify that the ACL attribute data retrieved from the database is an array of AccessControlEntryStruct after mapping
      let aclAttributeMapped = await queryZcl.selectAttributeById(
        db,
        aclAttribute.ATTRIBUTE_ID
      )
      expect(aclAttributeMapped).not.toBe(null)
      expect(aclAttributeMapped.name).toBe('ACL')
      expect(aclAttributeMapped.entryType).toBe('AccessControlEntryStruct')
      expect(aclAttributeMapped.isArray).toBe(1)
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)
