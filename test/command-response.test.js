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
const queryDeviceType = require('../src-electron/db/query-device-type')
const querySession = require('../src-electron/db/query-session')
const queryConfig = require('../src-electron/db/query-config')
const queryZcl = require('../src-electron/db/query-zcl')
const queryEndpoint = require('../src-electron/db/query-endpoint')
const queryCommand = require('../src-electron/db/query-command')

let db
let sid
let pkgId
let eptTypeId
let eptId

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('provisional-cluster')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
  // load Matter packages for testing command responses
  ctx = await zclLoader.loadZcl(db, env.builtinMatterZclMetafile())
  pkgId = ctx.packageId
  let uuid = util.createUuid()
  sid = await testQuery.createSession(
    db,
    'USER',
    uuid,
    env.builtinMatterZclMetafile()
  )

  // inserting endpoint type and endpoint on onOffLight device type
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

  eptId = await queryEndpoint.insertEndpoint(db, sid, 0, eptTypeId, null, null)
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'test triggers for adding and removing warnings for missing command responses',
  async () => {
    // get AddGroup command and its response from the Groups cluster, which are both enabled by default
    let groupsCluster = await queryZcl.selectClusterByCode(db, pkgId, 0x4)
    let groupClusterId = groupsCluster.id

    let commands = await queryCommand.selectCommandsByClusterId(
      db,
      groupClusterId,
      pkgId
    )
    let addGroupCommand = commands.find((command) => command.name == 'AddGroup')
    let addGroupResponse = commands.find(
      (command) => command.name == 'AddGroupResponse'
    )

    let missingResponseWarning =
      'On endpoint 0, cluster: Groups server, outgoing command: AddGroupResponse should be enabled as it is the response to the enabled incoming command: AddGroup.'

    // disable AddGroupResponse while AddGroup is enabled should trigger a warning
    await queryConfig.insertOrUpdateCommandState(
      db,
      eptTypeId,
      groupClusterId,
      addGroupResponse.source,
      addGroupResponse.id,
      0,
      false
    )
    let messages = await testQuery.getAllNotificationMessages(db, sid)
    expect(messages).toContain(missingResponseWarning)

    // disable AddGroup while AddGroupResponse is disabled should remove the warning
    await queryConfig.insertOrUpdateCommandState(
      db,
      eptTypeId,
      groupClusterId,
      addGroupCommand.source,
      addGroupCommand.id,
      0,
      true
    )
    messages = await testQuery.getAllNotificationMessages(db, sid)
    expect(messages).not.toContain(missingResponseWarning)

    // enable AddGroup while AddGroupResponse is disabled should trigger a warning
    await queryConfig.insertOrUpdateCommandState(
      db,
      eptTypeId,
      groupClusterId,
      addGroupCommand.source,
      addGroupCommand.id,
      1,
      true
    )
    messages = await testQuery.getAllNotificationMessages(db, sid)
    expect(messages).toContain(missingResponseWarning)

    // enable AddGroupResponse while AddGroup is enabled should remove the warning
    await queryConfig.insertOrUpdateCommandState(
      db,
      eptTypeId,
      groupClusterId,
      addGroupResponse.source,
      addGroupResponse.id,
      1,
      false
    )
    messages = await testQuery.getAllNotificationMessages(db, sid)
    expect(messages).not.toContain(missingResponseWarning)

    // disable AddGroupResponse while AddGroup is enabled should trigger a warning
    await queryConfig.insertOrUpdateCommandState(
      db,
      eptTypeId,
      groupClusterId,
      addGroupResponse.source,
      addGroupResponse.id,
      0,
      false
    )
    messages = await testQuery.getAllNotificationMessages(db, sid)
    expect(messages).toContain(missingResponseWarning)

    // delete the endpoint should remove the warning
    await queryEndpoint.deleteEndpoint(db, eptId)
    messages = await testQuery.getAllNotificationMessages(db, sid)
    expect(messages).not.toContain(missingResponseWarning)
  },
  testUtil.timeout.long()
)
