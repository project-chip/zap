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

import { BrowserWindow } from 'electron'
import path from 'path'
import * as Env from '../util/env'

let window = null

/**
 * Call this function to create a new or show an existing preference window.
 *
 * @export
 * @param {*} port
 */
export function createOrShowWindow(port) {
  if (window == null) {
    createWindow(port)
  } else {
    window.show()
  }
}

function createWindow(port) {
  window = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    center: true,
    title: 'ZAP Preferences',
    icon: path.join(Env.iconsDirectory(), 'zap_32x32.png'),
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
    },
  })
  window.setMenu(null)
  window.loadURL(`http://localhost:${port}/#/preference`)
  window.on('close', (e) => {
    window = null
  })
  window.on('page-title-updated', (e) => {
    e.preventDefault()
  }) // EO page-title-updated
}
