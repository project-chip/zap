// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { logInfo, iconsDirectory } from './env.js'
import { initMenu } from './menu.js'
import { initTray } from './tray.js'
import { session, BrowserWindow } from 'electron'
import path from 'path'

export function initializeElectronUi(port) {
  let w = windowCreate(port)
  initMenu(port)
  initTray(port)
}

export function windowCreateIfNotThere (port) {
  if (BrowserWindow.getAllWindows().length == 0) {
    windowCreate(port)
  }
}

let windowCounter = 0

// Create a new window from a given path.
export function windowCreate (port, filePath = null) {
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
  w.loadURL(`http://localhost:${port}/index.html?winId=${w.id}`)
  w.on('page-title-updated', (e) => {
    e.preventDefault()
  })
  return w
}
