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

/**
 *  Window module for ZAP UI
 *
 * @module JS API: Window module for ZAP UI
 */

const { BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const env = require('../util/env')
const menu = require('./menu.js')
const tray = require('./tray.js')
const browserApi = require('./browser-api.js')
const querystringUtil = require('querystring')
const httpServer = require('../server/http-server.js')

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
export function initializeElectronUi(port) {
  menu.initMenu(port)
  tray.initTray(port)
}

/**
 * Create a window if none present.
 *
 * @param {*} port
 */
export function windowCreateIfNotThere(port) {
  if (BrowserWindow.getAllWindows().length == 0) {
    windowCreate(port)
  }
}

/**
 * Get url string.
 * @param {*} uiMode
 * @param {*} standalone
 * @param {*} isNew
 * @param {*} filePath
 * @param {*} restPort
 * @returns String
 */
function createQueryString(
  uiMode,
  standalone,
  isNew,
  filePath,
  restPort,
  zapFileExtensions
) {
  const params = new Map()

  if (!arguments.length) {
    return ''
  }

  if (uiMode !== undefined) {
    params.set('uiMode', uiMode)
  }

  if (standalone !== undefined) {
    params.set('standalone', standalone)
  }

  if (isNew !== undefined) {
    params.set('newConfig', isNew)
  }
  if (filePath !== undefined) {
    params.set('filePath', filePath)
  }
  if (Array.isArray(zapFileExtensions) && zapFileExtensions.length > 0) {
    params.set('zapFileExtensions', zapFileExtensions)
  }

  // Electron/Development mode
  if (
    process.env.DEV &&
    process.env.MODE === 'electron' &&
    restPort !== undefined
  ) {
    params.set('restPort', restPort)
  }

  return '?' + querystringUtil.stringify(Object.fromEntries(params))
}

/**
 * Create a window, possibly with a given file path.
 *
 * @export
 * @param {*} port
 * @param {*} filePath
 * @param {*} [uiMode=null]
 * @returns BrowserWindow that got created
 */
export function windowCreate(port, args) {
  let webPreferences = {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: false,
    preload: path.resolve(__dirname, 'preload.js')
  }
  windowCounter++
  const isWin32 = process.platform === 'win32'
  // macOS: avoid titleBarStyle 'hidden' + titleBarOverlay here — on Electron 41+ that combo
  // can leave the page area blank. Windows keeps a custom caption via titleBarOverlay.
  let winOptions = {
    width: 1600,
    height: 800,
    x: 50 + windowCounter * 20,
    y: 50 + windowCounter * 20,
    resizable: true,
    center: true,
    icon: path.join(env.iconsDirectory(), 'zap_32x32.png'),
    title: args?.filePath == null ? menu.newConfiguration : args?.filePath,
    useContentSize: true,
    webPreferences: webPreferences,
    titleBarStyle: 'default'
  }
  if (isWin32) {
    winOptions.titleBarOverlay = {
      color: '#F4F4F4',
      symbolColor: '#67696D'
    }
  }
  let w = new BrowserWindow(winOptions)

  ipcMain.on('set-title-bar-overlay', (_event, value) => {
    if (isWin32 && typeof w.setTitleBarOverlay === 'function') {
      w.setTitleBarOverlay(value)
    }
  })

  let queryString = createQueryString(
    args?.uiMode,
    args?.standalone,
    args?.new,
    args?.filePath,
    httpServer.httpServerPort(),
    args?.zapFileExtensions
  )

  // @ts-ignore
  w.isDirty = false
  w.loadURL(`http://localhost:${port}/` + queryString)

  w.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      env.logError(
        `ZAP window failed to load (code ${errorCode}): ${errorDescription} — ${validatedURL}`
      )
    }
  )

  w.on('page-title-updated', (e) => {
    e.preventDefault()
  }) // EO page-title-updated

  w.on('close', (e) => {
    e.preventDefault()
    // @ts-ignore
    if (w.isDirty) {
      const result = dialog.showMessageBoxSync(w, {
        type: 'warning',
        title: 'Unsaved changes?',
        message:
          'Your changes will be lost if you do not save them into the file.',
        buttons: ['Quit Anyway', 'Cancel'],
        defaultId: 0,
        cancelId: 1
      })

      if (result === 0) w.destroy()
    } else {
      w.destroy()
    }
  }) // EO close

  // Electron 35+ passes a single event object with `.message`; older versions
  // pass (event, level, message, line, sourceId). Support both.
  w.webContents.on('console-message', (...cmArgs) => {
    const ev = cmArgs[0]
    const text =
      typeof ev?.message === 'string'
        ? ev.message
        : cmArgs.length >= 3 && typeof cmArgs[2] === 'string'
          ? cmArgs[2]
          : ''
    if (!browserApi.processRendererNotify(w, text)) {
      env.logBrowser(text)
    }
  })
  w.webContents.on('render-process-gone', (_event, details) => {
    env.logError(
      `Renderer process gone: reason=${details.reason} exitCode=${details.exitCode}`
    )
  })
  if (process.env.ZAP_DEVTOOLS === '1') {
    w.webContents.openDevTools({ mode: 'detach' })
  }
  w.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyUp' && input.key.toLowerCase() === 'alt') {
      menu.toggleMenu(port)
    }
  })
  return w
}
