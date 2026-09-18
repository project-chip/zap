/**
 *
 *    Copyright (c) 2023 Silicon Labs
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
const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const queryPackage = require('../src-electron/db/query-package')
const queryConfig = require('../src-electron/db/query-config')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const querySession = require('../src-electron/db/query-session')
const queryDeviceType = require('../src-electron/db/query-device-type')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const studioRestApi = require('../src-electron/ide-integration/studio-rest-api')
const zclComponents = require('../src-electron/ide-integration/zcl-components')
const queryZcl = require('../src-electron/db/query-zcl')
const dbEnum = require('../src-shared/db-enum')
const util = require('../src-electron/util/util')

const testFile = path.join(__dirname, 'resource/test-meta.zap')
let db
let templateContext
let zclPackageId

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('ide-integration')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  let zclContext = await zclLoader.loadZcl(db, testUtil.testZclMetafile)
  zclPackageId = zclContext.packageId
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Load templates',
  async () => {
    templateContext = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.meta
    )
    expect(templateContext.crc).not.toBeNull()
    expect(templateContext.templateData).not.toBeNull()
    expect(templateContext.templateData.name).toEqual('Meta test templates')
    expect(templateContext.templateData.version).toEqual('meta-test')
    expect(templateContext.packageId).not.toBeNull()
  },
  testUtil.timeout.medium()
)

test(
  'Validate package loading',
  async () => {
    templateContext.packages = await queryPackage.getPackageByParent(
      templateContext.db,
      templateContext.packageId
    )
    expect(templateContext.packages.length).toBeGreaterThan(0)
  },
  testUtil.timeout.short()
)

test(
  `Ide integration`,
  async () => {
    let { sessionId, errors, warnings } = await importJs.importDataFromFile(
      db,
      testFile
    )
    expect(errors.length).toBe(0)
    expect(warnings.length).toBe(0)
    expect(sessionId).not.toBeNull()

    let x = await studioRestApi.integrationEnabled(db, sessionId)
    let y = await studioRestApi.isComponentTogglingDisabled(db, sessionId)
    expect(x).toBeFalsy()
    expect(y).toBeFalsy()

    let cluster = await queryZcl.selectClusterByCode(db, zclPackageId, 0xabcd)
    expect(cluster).not.toBeNull()
    let ids = await zclComponents.getComponentIdsByCluster(
      db,
      sessionId,
      cluster.id,
      ['server']
    )
    expect(ids.length).toBe(1)
    expect(ids[0]).toEqual('test-1-component')
  },
  testUtil.timeout.long()
)

test(
  'Multiple clusters can map to the same UC component',
  async () => {
    const extensionFile = path.join(
      __dirname,
      'resource/meta/cluster-components.json'
    )
    const original = fs.readFileSync(extensionFile, 'utf8')
    try {
      // Two clusters -> one component, mirroring the matter_resource_monitoring
      // multi-cluster mapping scenario. clusterCodes must match
      // cluster.label.toLowerCase() + '-' + role.
      fs.writeFileSync(
        extensionFile,
        JSON.stringify(
          [
            {
              clusterCode: 'test 1-server',
              value: ['shared-resource-component']
            },
            {
              clusterCode: 'test 2-server',
              value: ['shared-resource-component']
            }
          ],
          null,
          2
        ),
        'utf8'
      )

      let reloaded = await genEngine.loadTemplates(
        db,
        testUtil.testTemplate.meta
      )
      expect(reloaded.packageId).not.toEqual(templateContext.packageId)

      let { sessionId, errors, warnings } = await importJs.importDataFromFile(
        db,
        testFile
      )
      expect(errors.length).toBe(0)
      expect(warnings.length).toBe(0)

      // Import attaches the in-sync gen-templates package created by the
      // reload above, so lookup sees the edited mapping.
      let cluster1 = await queryZcl.selectClusterByCode(
        db,
        zclPackageId,
        0xabcd
      )
      let cluster2 = await queryZcl.selectClusterByCode(
        db,
        zclPackageId,
        0xabce
      )
      expect(cluster1).not.toBeNull()
      expect(cluster2).not.toBeNull()

      let ids1 = await zclComponents.getComponentIdsByCluster(
        db,
        sessionId,
        cluster1.id,
        ['server']
      )
      let ids2 = await zclComponents.getComponentIdsByCluster(
        db,
        sessionId,
        cluster2.id,
        ['server']
      )
      expect(ids1).toEqual(['shared-resource-component'])
      expect(ids2).toEqual(['shared-resource-component'])
      expect(reloaded.packageId).toBeDefined()

      // test-meta.zap has Test 2 server enabled. Disabling Test 1 must not
      // remove the shared component while Test 2 still requires it.
      let removableWhileTest2Enabled =
        await zclComponents.filterOutComponentsStillRequired(db, sessionId, [
          'shared-resource-component'
        ])
      expect(removableWhileTest2Enabled).toEqual([])

      // After disabling Test 2 server as well, the shared component is free
      // to remove.
      let endpoints = await queryEndpoint.selectAllEndpoints(db, sessionId)
      expect(endpoints.length).toBeGreaterThan(0)
      await queryConfig.insertOrReplaceClusterState(
        db,
        endpoints[0].endpointTypeRef,
        cluster2.id,
        'server',
        false
      )
      let removableWhenNoneEnabled =
        await zclComponents.filterOutComponentsStillRequired(db, sessionId, [
          'shared-resource-component'
        ])
      expect(removableWhenNoneEnabled).toEqual(['shared-resource-component'])
    } finally {
      fs.writeFileSync(extensionFile, original, 'utf8')
      // Restore an in-sync package for subsequent tests / cleanup.
      await genEngine.loadTemplates(db, testUtil.testTemplate.meta)
    }
  },
  testUtil.timeout.long()
)

test(
  'Multiprotocol sessions resolve cluster components by template category',
  async () => {
    let [zigbeeZclId, matterZclId] = await zclLoader.loadZclMetafiles(db, [
      env.builtinSilabsZclMetafile(),
      env.builtinMatterZclMetafile2()
    ])
    let zigbeeTemplates = await genEngine.loadTemplates(
      db,
      testUtil.testTemplate.zigbee2
    )
    let matterTemplates = await genEngine.loadTemplates(
      db,
      path.join(__dirname, 'resource/meta/matter-component-templates.json')
    )
    expect(zigbeeTemplates.packageId).not.toBeNull()
    expect(matterTemplates.packageId).not.toBeNull()

    let sessionId = await querySession.createBlankSession(db)
    await querySession.insertSessionPartitions(db, sessionId, 4)
    let partitions = await querySession.getAllSessionPartitionInfoForSession(
      db,
      sessionId
    )
    partitions.sort(
      (a, b) => a.sessionPartitionNumber - b.sessionPartitionNumber
    )
    expect(partitions.length).toBeGreaterThanOrEqual(4)
    // Zigbee templates first so pkgs[0] is zigbee; category matching must
    // still pick the Matter map for Matter clusters.
    await queryPackage.insertSessionPackage(
      db,
      partitions[0].sessionPartitionId,
      zigbeeZclId,
      true
    )
    await queryPackage.insertSessionPackage(
      db,
      partitions[1].sessionPartitionId,
      matterZclId,
      true
    )
    await queryPackage.insertSessionPackage(
      db,
      partitions[2].sessionPartitionId,
      zigbeeTemplates.packageId,
      true
    )
    await queryPackage.insertSessionPackage(
      db,
      partitions[3].sessionPartitionId,
      matterTemplates.packageId,
      true
    )

    let zigbeeColor = await queryZcl.selectClusterByCode(
      db,
      zigbeeZclId,
      0x0300
    )
    let matterColor = await queryZcl.selectClusterByCode(
      db,
      matterZclId,
      0x0300
    )
    let matterLevel = await queryZcl.selectClusterByCode(
      db,
      matterZclId,
      0x0008
    )
    expect(zigbeeColor).toBeDefined()
    expect(matterColor).toBeDefined()
    expect(matterLevel).toBeDefined()
    expect(zigbeeColor.id).not.toEqual(matterColor.id)

    let zigbeeIds = await zclComponents.getComponentIdsByCluster(
      db,
      sessionId,
      zigbeeColor.id,
      ['server']
    )
    let matterColorIds = await zclComponents.getComponentIdsByCluster(
      db,
      sessionId,
      matterColor.id,
      ['server']
    )
    let matterLevelIds = await zclComponents.getComponentIdsByCluster(
      db,
      sessionId,
      matterLevel.id,
      ['server']
    )
    expect(zigbeeIds).toEqual(['zigbee_color_control_server'])
    expect(matterColorIds).toEqual(['matter_color_control'])
    expect(matterLevelIds).toEqual(['matter_color_control'])

    let merged = await zclComponents.getMergedSessionPackageExtensions(
      db,
      sessionId,
      dbEnum.packageExtensionEntity.cluster
    )
    let componentExt = util.getClusterExtension(merged, 'component')
    expect(componentExt.length).toBe(1)
    let defaultValues = componentExt[0].defaults.map((d) => String(d.value))
    expect(
      defaultValues.some((v) => v.includes('zigbee_color_control_server'))
    ).toBeTruthy()
    expect(
      defaultValues.some((v) => v.includes('matter_color_control'))
    ).toBeTruthy()

    let zigbeeDevices = await queryDeviceType.selectAllDeviceTypes(
      db,
      zigbeeZclId
    )
    let matterDevices = await queryDeviceType.selectAllDeviceTypes(
      db,
      matterZclId
    )
    expect(zigbeeDevices.length).toBeGreaterThan(0)
    expect(matterDevices.length).toBeGreaterThan(0)

    let matterEndpointTypeId = await queryConfig.insertEndpointType(
      db,
      partitions[1],
      'Matter endpoint',
      matterDevices[0].id,
      matterDevices[0].code,
      0,
      true
    )
    let zigbeeEndpointTypeId = await queryConfig.insertEndpointType(
      db,
      partitions[0],
      'Zigbee endpoint',
      zigbeeDevices[0].id,
      zigbeeDevices[0].code,
      0,
      true
    )
    await queryEndpoint.insertEndpoint(
      db,
      sessionId,
      1,
      matterEndpointTypeId,
      0,
      null
    )
    await queryEndpoint.insertEndpoint(
      db,
      sessionId,
      2,
      zigbeeEndpointTypeId,
      0,
      null
    )

    await queryConfig.insertOrReplaceClusterState(
      db,
      matterEndpointTypeId,
      matterColor.id,
      'server',
      true
    )
    await queryConfig.insertOrReplaceClusterState(
      db,
      matterEndpointTypeId,
      matterLevel.id,
      'server',
      true
    )
    await queryConfig.insertOrReplaceClusterState(
      db,
      zigbeeEndpointTypeId,
      zigbeeColor.id,
      'server',
      true
    )

    expect(
      await zclComponents.filterOutComponentsStillRequired(db, sessionId, [
        'matter_color_control'
      ])
    ).toEqual([])

    await queryConfig.insertOrReplaceClusterState(
      db,
      matterEndpointTypeId,
      matterColor.id,
      'server',
      false
    )
    expect(
      await zclComponents.filterOutComponentsStillRequired(db, sessionId, [
        'matter_color_control'
      ])
    ).toEqual([])

    await queryConfig.insertOrReplaceClusterState(
      db,
      matterEndpointTypeId,
      matterLevel.id,
      'server',
      false
    )
    expect(
      await zclComponents.filterOutComponentsStillRequired(db, sessionId, [
        'matter_color_control'
      ])
    ).toEqual(['matter_color_control'])
  },
  testUtil.timeout.long()
)
