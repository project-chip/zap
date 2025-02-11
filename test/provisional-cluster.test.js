/**
 *
 *    Copyright (c) 2024 Silicon Labs
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
const env = require('../src-electron/util/env')
const testUtil = require('./test-util')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const util = require('../src-electron/util/util')
const testQuery = require('./test-query')
const queryLoader = require('../src-electron/db/query-loader')
const queryDeviceType = require('../src-electron/db/query-device-type')
const querySession = require('../src-electron/db/query-session')
const queryConfig = require('../src-electron/db/query-config')
const queryZcl = require('../src-electron/db/query-zcl')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const querySessionNotification = require('../src-electron/db/query-session-notification')

let db
let sid
let pkgId
let eptTypeId
let clusterId

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('provisional-cluster')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  // load Matter packages for testing provisional clusters
  ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  pkgId = ctx.packageId
  let uuid = util.createUuid()
  sid = await testQuery.createSession(
    db,
    'USER',
    uuid,
    env.builtinMatterZclMetafile()
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Initialize a provisional cluster and test triggers for enabling an endpoint',
  async () => {
    // insert a cluster with provisional apiMaturity
    let provisionalClusterCode = 0x1111
    await queryLoader.insertClusters(db, pkgId, [
      {
        code: provisionalClusterCode,
        name: 'Provisional',
        description: 'A provisional cluster',
        define: 'PROVISIONAL',
        apiMaturity: 'provisional'
      }
    ])

    let cluster = await queryZcl.selectClusterByCode(
      db,
      pkgId,
      provisionalClusterCode,
      null
    )
    expect(cluster).not.toBeNull()

    clusterId = cluster.id

    // inserting endpoint type and endpoint
    let onOffLightDevice = await queryDeviceType.selectDeviceTypeByCode(
      db,
      pkgId,
      0x0100
    )
    expect(onOffLightDevice).not.toBeNull()

    let sessionPartitionInfo =
      await querySession.selectSessionPartitionInfoFromDeviceType(
        db,
        sid,
        onOffLightDevice.id
      )
    eptTypeId = await queryConfig.insertEndpointType(
      db,
      sessionPartitionInfo[0],
      'EPT',
      onOffLightDevice.id,
      onOffLightDevice.code,
      0,
      true
    )
    expect(eptTypeId).not.toBeNull()

    /* insert an endpoint should trigger a warning for the provisional cluster Scenes enabled
       according to requirement of On/Off Light Device Type */
    await queryEndpoint.insertEndpoint(db, sid, 0, eptTypeId, null, null)
    let notifications = await querySessionNotification.getNotification(db, sid)
    expect(notifications.length).toBe(1)
    expect(notifications[0].message).toBe(
      'On endpoint 0, support for cluster: Scenes server is provisional.'
    )
  },
  testUtil.timeout.long()
)

test(
  'Test triggers for enabling or disabling a provisional cluster',
  async () => {
    let clientWarning =
      'On endpoint 0, support for cluster: Provisional client is provisional.'
    let serverWarning =
      'On endpoint 0, support for cluster: Provisional server is provisional.'
    let listContainsClientWarning = (notifications) => {
      return notifications.some((n) => n.message == clientWarning)
    }
    let listContainsServerWarning = (notifications) => {
      return notifications.some((n) => n.message == serverWarning)
    }

    // insert a disabled provisional client cluster should not trigger a warning
    await queryConfig.insertOrReplaceClusterState(
      db,
      eptTypeId,
      clusterId,
      'client',
      false
    )
    let notifications = await querySessionNotification.getNotification(db, sid)
    expect(listContainsClientWarning(notifications)).toBe(false)
    expect(listContainsServerWarning(notifications)).toBe(false)

    // test update trigger on enable a cluster
    // update provisional client cluster to enabled should trigger a warning
    await queryConfig.insertOrReplaceClusterState(
      db,
      eptTypeId,
      clusterId,
      'client',
      true
    )
    notifications = await querySessionNotification.getNotification(db, sid)
    expect(listContainsClientWarning(notifications)).toBe(true)
    expect(listContainsServerWarning(notifications)).toBe(false)

    // test insert trigger
    // insert an enabled provisional server cluster should trigger a warning
    // 3 notifications should be present: Scenes server, Provisional client, Provisional server
    await queryConfig.insertOrReplaceClusterState(
      db,
      eptTypeId,
      clusterId,
      'server',
      true
    )
    notifications = await querySessionNotification.getNotification(db, sid)
    expect(notifications.length).toBe(3)
    expect(listContainsClientWarning(notifications)).toBe(true)
    expect(listContainsServerWarning(notifications)).toBe(true)

    // test update trigger on disable a cluster
    // disable the provisional server cluster should remove the server warning
    await queryConfig.insertOrReplaceClusterState(
      db,
      eptTypeId,
      clusterId,
      'server',
      false
    )
    notifications = await querySessionNotification.getNotification(db, sid)
    expect(listContainsClientWarning(notifications)).toBe(true)
    expect(listContainsServerWarning(notifications)).toBe(false)

    // disable the provisional client cluster should remove the client warning
    await queryConfig.insertOrReplaceClusterState(
      db,
      eptTypeId,
      clusterId,
      'client',
      false
    )
    notifications = await querySessionNotification.getNotification(db, sid)
    expect(listContainsClientWarning(notifications)).toBe(false)
    expect(listContainsServerWarning(notifications)).toBe(false)
  },
  testUtil.timeout.medium()
)
