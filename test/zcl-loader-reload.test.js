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
const zclLoader = require('../src-electron/zcl/zcl-loader')
const env = require('../src-electron/util/env')
const types = require('../src-electron/util/types')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const fs = require('fs')

beforeAll(async () => {
  env.setDevelopmentEnv()
})

test(
  'test changing xml file reloads all zcl packages from top level to all its children',
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
