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
const dbApi = require('../src-electron/db/db-api')
const notification = require('../src-electron/db/query-notification.js')
const querySession = require('../src-electron/db/query-session.js')

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
  'Notification: set, get, delete notification',
  async () => {
    let type = 'UPGRADE'
    let message = 'ISC FILE UPGRADED TO ZAP FILE. PLEASE SAVE AS TO SAVE OFF NEWLY CREATED ZAP FILE.'
    let sessionId = await querySession.createBlankSession(db)
    let severity = 1
    let display = 1

    await notification.setNotification(
      db,
      type,
      message,
      sessionId,
      severity,
      display
    )

    let notifications = await notification.getNotification(db, sessionId)

    let order = 0

    // check if the returned notifications include the one we just set
    let isNotificationSet = false;
    for(let i = 0; i < notifications.length; i++) {
        if (notifications[i].type === type && 
            notifications[i].message === message && 
            notifications[i].ref === sessionId && 
            notifications[i].severity === severity && 
            notifications[i].display === display)
          {
            isNotificationSet = true;
            order = notifications[i].order
            break;
          }
    }
    expect(isNotificationSet).toBeTruthy()


    // delete the notification we just created
    await notification.deleteNotification(db, order)

    notifications = await notification.getNotification(db, sessionId)

    // check if the notification was successfully deleted
    let isNotificationDeleted = true;
    for(let i = 0; i < notifications.length; i++) {
        if (notifications[i].type === type && 
            notifications[i].message === message && 
            notifications[i].ref === sessionId && 
            notifications[i].severity === severity && 
            notifications[i].display === display)
          {
            isNotificationDeleted = false;
            break;
          }
    }
    expect(isNotificationDeleted).toBeTruthy()
  },
  testUtil.timeout.long()
)