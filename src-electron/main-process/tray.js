// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { Menu, Tray, nativeImage, app} from 'electron'
import { windowCreate } from './window.js'
import { logInfo, iconsDirectory, logError } from './env.js'
import path from 'path'
import fs from 'fs'

let tray

export function initTray(port) {
  logInfo('Initializing tray...')


  let trayIconPath =  path.join(iconsDirectory(), 'zap_32x32.png')
  let dockIconPath =  path.join(iconsDirectory(), 'zap_128x128.png')

  if ( !fs.existsSync(trayIconPath)) {
    logError(`Tray not created, icon does not exist: ${trayIconPath}`)
    return
  } else {
    logInfo(`Using tray icon: ${trayIconPath}`)
  }

  let trayIcon = nativeImage.createFromPath(trayIconPath)
  if ( trayIcon.isEmpty() ) {
    logError('Image got created, but it is empty')
  }
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'New ZCL configuration',
      type: 'normal',
      click: (item, window, event) => {
        windowCreate(port)
      }
    }, {
      label: 'Quit ZAP',
      role: 'quit'
    }
  ])

  // This covers the case of the mac dock
  if ( app.dock ) {
    app.dock.setIcon(dockIconPath)
    app.dock.setMenu(contextMenu)
  }
  

  tray.setToolTip('ZCL Advanced Platform')
  tray.setContextMenu(contextMenu)
  logInfo('Tray initialized.')
}
