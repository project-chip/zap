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
const browserApi = require('./browser-api.js')
const querystringUtil = require('querystring')
const httpServer = require('../server/http-server.js')
const rendApi = require('../../src-shared/rend-api.js')

let windowCounter = 0

/**
 * Electron UI initialization.
 *
 * Note: You might be tempted to pass `db` to this function. Don't.
 * That was done before and it's just a lazy way to cut through the
 * layers between UI and back-end. Should not be done. Any information
 * UI needs from the database should be retrieved via renderer API.
 *
 * @param {*} port
 */
function initializeElectronUi(port) {
  menu.initMenu(port)
  tray.initTray(port)
}

function windowCreateIfNotThere(port) {
  if (BrowserWindow.getAllWindows().length == 0) {
    windowCreate(port)
  }
}

function createQueryString(uiMode, restPort) {
  let params = {}

  if (!arguments.length) {
    return ''
  }

  if (uiMode) {
    params.uiMode = uiMode
  }

  // Electron/Development mode
  if (process.env.DEV && process.env.MODE === 'electron' && restPort) {
    params.restPort = restPort
  }

  return '?' + querystringUtil.stringify(params)
}

/**
 * Create a window, possibly with a given file path.
 *
 * @export
 * @param {*} port
 * @param {*} [filePath=null]
 * @param {*} [uiMode=null]
 * @returns BrowserWindow that got created
 */
function windowCreate(port, args = {}) {
  let webPreferences = {
    nodeIntegration: false,
    worldSafeExecuteJavaScript: true,
  }
  windowCounter++
  let w = new BrowserWindow({
    width: 1600,
    height: 800,
    x: 50 + windowCounter * 20,
    y: 50 + windowCounter * 20,
    resizable: true,
    center: true,
    icon: path.join(env.iconsDirectory(), 'zap_32x32.png'),
    title: args.filePath == null ? menu.newConfiguration : args.filePath,
    useContentSize: true,
    webPreferences: webPreferences,
  })

  let queryString = createQueryString(args.uiMode, httpServer.httpServerPort())

  w.isDirty = false
  w.loadURL(`http://localhost:${port}/` + queryString).then(async () => {
    if (args.filePath != null) {
      // browserApi.executeLoad(w, args.filePath)
      browserApi.execRendererApi(w, rendApi.id.open, args.filePath)
    }

    if (args.debugNavBar) {
      browserApi.debugNavBarOn(w)
    } else {
      browserApi.debugNavBarOff(w)
    }
  })

  w.on('page-title-updated', (e) => {
    e.preventDefault()
  }) // EO page-title-updated

  w.on('close', (e) => {
    e.preventDefault()
    if (w.isDirty) {
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
  }) // EO close

  w.webContents.on(
    'console-message',
    (event, level, message, line, sourceId) => {
      if (!browserApi.processRendererNotify(w, message)) {
        env.logBrowser(message)
      }
    }
  )
  return w
}
// exports
exports.initializeElectronUi = initializeElectronUi
exports.windowCreateIfNotThere = windowCreateIfNotThere
exports.windowCreate = windowCreate
exports.createQueryString = createQueryString
