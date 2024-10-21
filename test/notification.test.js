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

async function getNotificationByMessage(db, sessionId, message) {
  let notifications = await sessionNotification.getNotification(db, sessionId)
  return notifications.filter((notis) => notis.message == message)
}

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

test(
  'Notification: set or delete session notification by message',
  async () => {
    let testMessage = 'This is a test notification message.'
    let anotherMessage = 'This is another test notification message.'
    let sessionId = await querySession.createBlankSession(db)

    // should return false since the message does not exist
    let response =
      await sessionNotification.searchNotificationByMessageAndDelete(
        db,
        sessionId,
        testMessage
      )
    expect(response).toBeFalsy()

    // insert a notification with different message
    await sessionNotification.setNotification(
      db,
      'WARNING',
      anotherMessage,
      sessionId,
      2,
      0
    )

    // should return false since the message does not exist
    response = await sessionNotification.searchNotificationByMessageAndDelete(
      db,
      sessionId,
      testMessage
    )
    expect(response).toBeFalsy()

    // should insert a new notification with the test message
    response = await sessionNotification.setWarningIfMessageNotExists(
      db,
      sessionId,
      testMessage
    )
    expect(response).toBeTruthy()
    let notisWithTestMessage = await getNotificationByMessage(
      db,
      sessionId,
      testMessage
    )
    expect(notisWithTestMessage.length).toBe(1)

    // insert the same notification twice should not create duplicates
    response = await sessionNotification.setWarningIfMessageNotExists(
      db,
      sessionId,
      testMessage
    )
    expect(response).toBeFalsy()
    notisWithTestMessage = await getNotificationByMessage(
      db,
      sessionId,
      testMessage
    )
    expect(notisWithTestMessage.length).toBe(1)

    // delete the notification with the test message
    // should return true and no notification with the test message should exist
    response = await sessionNotification.searchNotificationByMessageAndDelete(
      db,
      sessionId,
      testMessage
    )
    expect(response).toBeTruthy()
    notisWithTestMessage = await getNotificationByMessage(
      db,
      sessionId,
      testMessage
    )
    expect(notisWithTestMessage.length).toBe(0)
  },
  testUtil.timeout.long()
)

test(
  'Notification: set notification on feature change result',
  async () => {
    let sessionId = await querySession.createBlankSession(db)
    let warningMessage = `This is a message to disply front end warnings
                          after a feature change`
    let disableMessage = `This is a message to disable front end changes
                          after a feature change`
    let notisWithWarningMessage
    let notisWithDisableMessage

    let warningResult = {
      warningMessage: warningMessage,
      disableChange: false,
      displayWarning: true
    }
    let deleteWarningResult = {
      warningMessage: warningMessage,
      disableChange: false,
      displayWarning: false
    }
    let disableResult = {
      warningMessage: disableMessage,
      disableChange: true,
      displayWarning: false
    }

    // should insert a new notification with the warning message
    await sessionNotification.setNotificationOnFeatureChange(
      db,
      sessionId,
      warningResult
    )
    notisWithWarningMessage = await getNotificationByMessage(
      db,
      sessionId,
      warningMessage
    )
    expect(notisWithWarningMessage.length).toBe(1)

    // should delete the notification with the warning message just inserted
    await sessionNotification.setNotificationOnFeatureChange(
      db,
      sessionId,
      deleteWarningResult
    )
    notisWithWarningMessage = await getNotificationByMessage(
      db,
      sessionId,
      warningMessage
    )
    expect(notisWithWarningMessage.length).toBe(0)

    // should insert a new notification with the disable message
    await sessionNotification.setNotificationOnFeatureChange(
      db,
      sessionId,
      disableResult
    )
    notisWithDisableMessage = await getNotificationByMessage(
      db,
      sessionId,
      disableMessage
    )
    expect(notisWithDisableMessage.length).toBe(1)

    // should not insert a new notification with duplicate disable message
    await sessionNotification.setNotificationOnFeatureChange(
      db,
      sessionId,
      disableResult
    )
    notisWithDisableMessage = await getNotificationByMessage(
      db,
      sessionId,
      disableMessage
    )
    expect(notisWithDisableMessage.length).toBe(1)
  },
  testUtil.timeout.long()
)
