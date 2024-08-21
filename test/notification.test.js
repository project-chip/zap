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

const fs = require('fs')
const path = require('path')
const testUtil = require('./test-util')
const env = require('../src-electron/util/env')
const util = require('../src-electron/util/util')
const dbApi = require('../src-electron/db/db-api')
const sessionNotification = require('../src-electron/db/query-session-notification')
const packageNotification = require('../src-electron/db/query-package-notification')
const querySession = require('../src-electron/db/query-session')
const queryPackage = require('../src-electron/db/query-package')
const zclLoader = require('../src-electron/zcl/zcl-loader')

let db = null

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('notification')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion()
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'Notification: set, get, delete session notification',
  async () => {
    let type = 'UPGRADE'
    let message =
      'ISC FILE UPGRADED TO ZAP FILE. PLEASE SAVE AS TO SAVE OFF NEWLY CREATED ZAP FILE.'
    let sessionId = await querySession.createBlankSession(db)
    let severity = 1
    let display = 1

    await sessionNotification.setNotification(
      db,
      type,
      message,
      sessionId,
      severity,
      display
    )

    let notifications = await sessionNotification.getNotification(db, sessionId)

    let id = 0

    // check if the returned notifications include the one we just set
    let isNotificationSet = false
    for (let i = 0; i < notifications.length; i++) {
      if (
        notifications[i].type === type &&
        notifications[i].message === message &&
        notifications[i].ref === sessionId &&
        notifications[i].severity === severity &&
        notifications[i].display === display
      ) {
        isNotificationSet = true
        id = notifications[i].id
        break
      }
    }
    expect(isNotificationSet).toBeTruthy()

    // delete the notification we just created
    await sessionNotification.deleteNotification(db, id)

    notifications = await sessionNotification.getNotification(db, sessionId)

    // check if the notification was successfully deleted
    let isNotificationDeleted = true
    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].id === id) {
        isNotificationDeleted = false
        break
      }
    }
    expect(isNotificationDeleted).toBeTruthy()
  },
  testUtil.timeout.long()
)

test('Notification: mark notification as seen and get unseen count', async () => {
  // set a new notification and get its id
  let type = 'UPGRADE'
  let message =
    'ISC FILE UPGRADED TO ZAP FILE. PLEASE SAVE AS TO SAVE OFF NEWLY CREATED ZAP FILE.'
  let sessionId = await querySession.createBlankSession(db)
  let severity = 1
  let display = 1

  await sessionNotification.setNotification(
    db,
    type,
    message,
    sessionId,
    severity,
    display
  )

  let notifications = await sessionNotification.getNotification(db, sessionId)
  expect(notifications.length > 0).toBeTruthy()
  let id = notifications[0].id
  let unseenIds = [id]

  // should have 1 unseen notification
  let unseenCount = await sessionNotification.getUnseenNotificationCount(
    db,
    sessionId
  )
  expect(unseenCount).toBe(1)

  // set the unseen notification to seen
  await sessionNotification.markNotificationsAsSeen(db, unseenIds)

  // should have 0 unseen now
  unseenCount = await sessionNotification.getUnseenNotificationCount(
    db,
    sessionId
  )
  expect(unseenCount).toBe(0)
})

test(
  'Notification: set, get, delete package notification',
  async () => {
    let type = 'UPGRADE'
    let message =
      'ISC FILE UPGRADED TO ZAP FILE. PLEASE SAVE AS TO SAVE OFF NEWLY CREATED ZAP FILE.'
    let severity = 1

    let sessionId = await querySession.createBlankSession(db)
    let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
    let packageId = ctx.packageId
    await util.ensurePackagesAndPopulateSessionOptions(
      db,
      sessionId,
      {
        zcl: env.builtinSilabsZclMetafile(),
        template: env.builtinTemplateMetafile()
      },
      packageId,
      null
    )
    let sessionPartitionInfo = await querySession.getSessionPartitionInfo(
      db,
      sessionId,
      2
    )
    await queryPackage.insertSessionPackage(
      db,
      sessionPartitionInfo[0].sessionPartitionId,
      packageId
    )

    await packageNotification.setNotification(
      db,
      type,
      message,
      packageId,
      severity
    )

    let notifications = await packageNotification.getNotificationBySessionId(
      db,
      sessionId
    )

    let id = 0

    // check if the returned notifications include the one we just set
    let isNotificationSet = false
    for (let i = 0; i < notifications.length; i++) {
      if (
        notifications[i].type === type &&
        notifications[i].message === message &&
        notifications[i].ref === packageId &&
        notifications[i].severity === severity
      ) {
        isNotificationSet = true
        id = notifications[i].id
        break
      }
    }
    expect(isNotificationSet).toBeTruthy()

    // delete the notification we just created
    await packageNotification.deleteNotification(db, id)

    notifications = await packageNotification.getNotificationByPackageId(
      db,
      packageId
    )

    // check if the notification was successfully deleted
    let isNotificationDeleted = true
    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].id === id) {
        isNotificationDeleted = false
        break
      }
    }
    expect(isNotificationDeleted).toBeTruthy()
  },
  testUtil.timeout.long()
)
