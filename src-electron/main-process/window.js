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
 */

const { session, BrowserWindow, dialog } = require('electron')
const path = require('path')

const {
  logInfo,
  iconsDirectory,
  mainDatabase,
  logError,
} = require('../util/env.js')

import { initMenu } from './menu.js'
import { initTray } from './tray.js'
import { getWindowDirtyFlagWithCallback } from '../db/query-session.js'

export function initializeElectronUi(port) {
  let w = windowCreate(port)
  initMenu(port)
  initTray(port)
}

export function windowCreateIfNotThere(port) {
  if (BrowserWindow.getAllWindows().length == 0) {
    windowCreate(port)
  }
}

let windowCounter = 0

/**
 * Create a window, possibly with a given file path and with a desire to attach to a given sessionId
 *
 * Win id will be passed on in the URL, and if sessionId is present, so will it.
 *
 * @export
 * @param {*} port
 * @param {*} [filePath=null]
 * @param {*} [sessionId=null]
 * @returns BrowserWindow that got created
 */
export function windowCreate(port, filePath = null, sessionId = null) {
  let newSession = session.fromPartition(`zap-${windowCounter++}`)
  let w = new BrowserWindow({
    width: 1600,
    height: 800,
    resizable: true,
    center: true,
    icon: path.join(iconsDirectory(), 'zap_32x32.png'),
    title: filePath == null ? 'New Configuration' : filePath,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      session: newSession,
    },
  })
  if (sessionId == null)
    w.loadURL(`http://localhost:${port}/index.html?winId=${w.id}`)
  else
    w.loadURL(
      `http://localhost:${port}/index.html?winId=${w.id}&sessionId=${sessionId}`
    )
  w.on('page-title-updated', (e) => {
    e.preventDefault()
  }) // EO page-title-updated

  w.on('close', (e) => {
    e.preventDefault()
    getWindowDirtyFlagWithCallback(mainDatabase(), w.id, (dirty) => {
      if (dirty) {
        const result = dialog.showMessageBoxSync(w, {
          type: 'warning',
          title: 'Unsaved changes?',
          message:
            'Your changes will be lost if you do not save them into the file.',
          buttons: ['Quit Anyway', 'Cancel'],
          defaultId: 0,
          cancelId: 1,
        })

        if (result === 0) w.destroy()
      } else {
        w.destroy()
      }
    })
  }) // EO close

  return w
}
