// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { logInfo, iconsDirectory, mainDatabase, logError } from './env.js'
import { initMenu } from './menu.js'
import { initTray } from './tray.js'
import { session, BrowserWindow, dialog } from 'electron'
import path from 'path'
import { getSessionDirtyFlag, getSessionIdFromWindowdId, getWindowDirtyFlagWithCallback } from '../db/query-session.js'
import { showErrorMessage } from './ui.js'

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
  logInfo(__dirname)
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
      session: newSession
    }
  })
  if (sessionId == null)
    w.loadURL(`http://localhost:${port}/index.html?winId=${w.id}`)
  else
    w.loadURL(`http://localhost:${port}/index.html?winId=${w.id}&sessionId=${sessionId}`)
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
          message: 'Your changes will be lost if you do not save them into the file.',
          buttons: [
            'Quit Anyway',
            'Cancel',
          ],
          defaultId: 0,
          cancelId: 1
        });

        if (result === 0) w.destroy();
      } else {
        w.destroy()
      }
    })
  }) // EO close

  return w
}
