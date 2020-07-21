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
const env = require('../util/env.js')
const querySession = require('../db/query-session.js')
const menu = require('./menu.js')
const tray = require('./tray.js')

function initializeElectronUi(port) {
  let w = windowCreate(port)
  menu.initMenu(port)
  tray.initTray(port)
}

function windowCreateIfNotThere(port) {
  if (BrowserWindow.getAllWindows().length == 0) {
    windowCreate(port)
  }
}

let windowCounter = 0

function createQueryString(winId, sessionId = null, uiMode = null) {
  var queryString = `?winId=${winId}`
  if (sessionId) queryString += `&sessionId=${sessionId}`
  if (uiMode) queryString += `&uiMode=${uiMode}`
  return queryString
}

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
function windowCreate(port, filePath = null, sessionId = null, uiMode = null) {
  let newSession = session.fromPartition(`zap-${windowCounter++}`)
  let w = new BrowserWindow({
    width: 1600,
    height: 800,
    resizable: true,
    center: true,
    icon: path.join(env.iconsDirectory(), 'zap_32x32.png'),
    title: filePath == null ? 'New Configuration' : filePath,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      session: newSession,
    },
  })

  let queryString = createQueryString(w.id, sessionId, uiMode)

  w.loadURL(`http://localhost:${port}/index.html` + queryString)

  w.on('page-title-updated', (e) => {
    e.preventDefault()
  }) // EO page-title-updated

  w.on('close', (e) => {
    e.preventDefault()
    querySession.getWindowDirtyFlagWithCallback(
      env.mainDatabase(),
      w.id,
      (dirty) => {
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
      }
    )
  }) // EO close

  return w
}
// exports
exports.initializeElectronUi = initializeElectronUi
exports.windowCreateIfNotThere = windowCreateIfNotThere
exports.windowCreate = windowCreate
exports.createQueryString = createQueryString
