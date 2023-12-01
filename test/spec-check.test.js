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

// This file tests the spec check feature
const path = require('path')
const importJs = require('../src-electron/importexport/import')
const dbApi = require('../src-electron/db/db-api')
const env = require('../src-electron/util/env')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const generationEngine = require('../src-electron/generator/generation-engine')
const queryEndpointType = require('../src-electron/db/query-endpoint-type')
const testUtil = require('./test-util')
const testQuery = require('./test-query')
const util = require('../src-electron/util/util')
const queryConfig = require('../src-electron/db/query-config')
const queryZcl = require('../src-electron/db/query-zcl')
const queryPackage = require('../src-electron/db/query-package')
const restApi = require('../src-shared/rest-api.js')

let db
let specCheckAllClustersApp = path.join(
  __dirname,
  'resource/spec-check-all-clusters-app-matter.zap'
)

let templateContext
let templatePkgId

beforeAll(() => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('specCheck')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .then(() => zclLoader.loadZcl(db, env.builtinMatterZclMetafile()))
    .catch((err) => env.logError(`Error: ${err}`))
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Basic gen template parsing and generation for matter templates',
  async () => {
    let context = await generationEngine.loadTemplates(
      db,
      testUtil.testTemplate.matter3
    )
    templatePkgId = context.packageId
    expect(context.crc).not.toBeNull()
    expect(context.templateData).not.toBeNull()
    templateContext = context
  },
  testUtil.timeout.short()
)

test(
  'Check for Spec check failures in the zap file through the session notification table',
  async () => {
    await util.ensurePackagesAndPopulateSessionOptions(
      templateContext.db,
      templateContext.sessionId,
      {
        zcl: env.builtinMatterZclMetafile(),
        template: env.builtinTemplateMetafile(),
      },
      null,
      [templatePkgId]
    )
    let importResult = await importJs.importDataFromFile(
      db,
      specCheckAllClustersApp
    )

    let sid = importResult.sessionId

    let sessionNotifications = await testQuery.getAllSessionNotifications(
      db,
      sid
    )
    let sessionNotificationMessages = sessionNotifications.map(
      (sn) => sn.message
    )
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-rootdevice, cluster: Descriptor server needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor server needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-rootdevice, cluster: Descriptor, attribute: ServerList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: ServerList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-rootdevice, cluster: Descriptor, attribute: ClientList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: ClientList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: PartsList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: ServerList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 1, device type: MA-onofflight, cluster: Identify, attribute: IdentifyTime needs to be enabled'
      )
    ).toBeTruthy()

    let endpointTypes = await queryEndpointType.selectAllEndpointTypes(db, sid)
    let endpoint0 = endpointTypes.find(
      (ep) => ep.name === 'MA-rootdevice' && ep.deviceIdentifier.length === 2
    )
    let allClusters = await testQuery.getAllSessionClusters(db, sid)
    let descriptorCluster = allClusters.find((c) => c.code === 0x001d) // Finding the descriptor cluster by code

    // Insert the descriptor cluster and check for session notice warnings again
    await queryConfig.insertOrReplaceClusterState(
      db,
      endpoint0.endpointTypeId,
      descriptorCluster.id,
      'SERVER',
      true
    )

    sessionNotifications = await testQuery.getAllSessionNotifications(db, sid)
    sessionNotificationMessages = sessionNotifications.map((sn) => sn.message)

    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-rootdevice, cluster: Descriptor server needs to be enabled'
      )
    ).toBeFalsy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor server needs to be enabled'
      )
    ).toBeFalsy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: ServerList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: ClientList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 1, device type: MA-onofflight, cluster: Identify, attribute: IdentifyTime needs to be enabled'
      )
    ).toBeTruthy()

    // Get Descriptor cluster attributes and enable them. Check for warnings in the session notice table after
    let sessionPackages = await queryPackage.getSessionPackages(db, sid)
    let sessionPackageIds = sessionPackages.map((sp) => sp.packageRef)
    let descriptorClusterAttributes =
      await queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
        db,
        descriptorCluster.id,
        sessionPackageIds,
        'server'
      )
    let serviceListAttribute = descriptorClusterAttributes.find(
      (dca) => dca.name === 'ServerList'
    )
    let clientListAttribute = descriptorClusterAttributes.find(
      (dca) => dca.name === 'ClientList'
    )

    await queryConfig.insertOrUpdateAttributeState(
      db,
      endpoint0.endpointTypeId,
      serviceListAttribute.clusterRef,
      'server',
      serviceListAttribute.id,
      [
        {
          key: restApi.updateKey.attributeSelected,
          value: 1,
        },
      ],
      null,
      null,
      null
    )

    await queryConfig.insertOrUpdateAttributeState(
      db,
      endpoint0.endpointTypeId,
      clientListAttribute.clusterRef,
      'server',
      clientListAttribute.id,
      [
        {
          key: restApi.updateKey.attributeSelected,
          value: 1,
        },
      ],
      null,
      null,
      null
    )
    sessionNotifications = await testQuery.getAllSessionNotifications(db, sid)
    sessionNotificationMessages = sessionNotifications.map((sn) => sn.message)

    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: ServerList needs to be enabled'
      )
    ).toBeFalsy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, device type: MA-powersource, cluster: Descriptor, attribute: ClientList needs to be enabled'
      )
    ).toBeFalsy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 1, device type: MA-onofflight, cluster: Identify, attribute: IdentifyTime needs to be enabled'
      )
    ).toBeTruthy()

    // Disabling a cluster and attribute to check if the notification messages come back up
    await queryConfig.insertOrReplaceClusterState(
      db,
      endpoint0.endpointTypeId,
      descriptorCluster.id,
      'server',
      false
    )
    await queryConfig.insertOrUpdateAttributeState(
      db,
      endpoint0.endpointTypeId,
      clientListAttribute.clusterRef,
      'server',
      clientListAttribute.id,
      [
        {
          key: restApi.updateKey.attributeSelected,
          value: 0,
        },
      ],
      null,
      null,
      null
    )
    sessionNotifications = await testQuery.getAllSessionNotifications(db, sid)
    sessionNotificationMessages = sessionNotifications.map((sn) => sn.message)
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, cluster: Descriptor, attribute: ServerList needs to be enabled'
      )
    ).toBeFalsy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, cluster: Descriptor, attribute: ClientList needs to be enabled'
      )
    ).toBeTruthy()
    expect(
      sessionNotificationMessages.includes(
        '⚠ Check Spec Compliance on endpoint: 0, cluster: Descriptor server needs to be enabled'
      )
    ).toBeTruthy()
  },
  testUtil.timeout.medium()
)
