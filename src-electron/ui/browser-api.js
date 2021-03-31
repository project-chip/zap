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

const restApi = require('../../src-shared/rest-api.js')
const {
  exportCommandsFromEndpointTypeCluster,
} = require('../db/query-impexp.js')

/**
 * @module JS API: renderer API related utilities
 */

/**
 * This method returns the global session UUID from the browser window that is set by the front-end.
 * @param {*} browserWindow
 * @returns session UUID
 */
async function getSessionUuidFromBrowserWindow(browserWindow) {
  let sessionUuid = await browserWindow.webContents.executeJavaScript(
    'window.sessionStorage.getItem("session_uuid")'
  )
  return sessionUuid
}

/**
 * Returns descriptive text about renderer api.
 *
 * @param {*} browserWindow
 * @returns description of renderer api
 */
async function getRendererApiInformation(browserWindow) {
  const info = await browserWindow.webContents.executeJavaScript(
    'window.global_renderer_api_info'
  )
  let msg = `
Prefix: ${info.prefix}
Description: ${info.description}
Functions:`
  info.functions.forEach((fn) => {
    msg = msg.concat(
      `\n  - ${fn.id}: ${fn.description} ${
        'type' in fn ? '[' + fn.type + ']' : ''
      }`
    )
  })
  return msg
}

async function executeLoad(browserWindow, path) {
  await browserWindow.webContents.executeJavaScript(
    `window.global_renderer_api_execute("open", "${path}")`
  )
}

async function executeSave(browserWindow, path) {
  if (path == null) {
    await browserWindow.webContents.executeJavaScript(
      `window.global_renderer_api_execute("save")`
    )
  } else {
    await browserWindow.webContents.executeJavaScript(
      `window.global_renderer_api_execute("save", "${path}")`
    )
  }
}

async function progressEnd(browserWindow) {
  await browserWindow.webContents.executeJavaScript(
    `window.global_renderer_api_execute('${restApi.rendererApiId.progressEnd}')`
  )
}

async function progressStart(browserWindow, message) {
  await browserWindow.webContents.executeJavaScript(
    `window.global_renderer_api_execute('${restApi.rendererApiId.progressStart}', '${message}')`
  )
}

async function reportFiles(browserWindow, filesArray) {
  await browserWindow.webContents.executeJavaScript(
    `window.global_renderer_api_execute('${
      restApi.rendererApiId.reportFiles
    }', '${JSON.stringify(filesArray)}')`
  )
}

/**
 * Returns cookie for user identification.
 *
 * @param {*} cookieValue
 * @returns cookie value used for user identification
 */
function getUserKeyFromCookieValue(cookieValue) {
  let ret = cookieValue
  if (ret == null) return null
  if (ret.startsWith('connect.sid=')) ret = ret.substring(12)
  if (ret.startsWith('s%3A')) ret = ret.substring(4)
  if (ret.includes('.')) ret = ret.split('.')[0]
  return ret
}

/**
 * Returns the session key
 * @param {*} browserCookie object
 */
function getUserKeyFromBrowserCookie(browserCookie) {
  let sid = browserCookie['connect.sid']
  if (sid) {
    return getUserKeyFromCookieValue(sid)
  } else {
    return null
  }
}

/**
 * Returns a promise that resolves into the session key.
 * @param {*} browserWindow
 */
function getUserKeyFromBrowserWindow(browserWindow) {
  return browserWindow.webContents.session.cookies
    .get({ name: 'connect.sid' })
    .then((cookies) => {
      if (cookies.length == 0) throw 'Could not find session key'
      else return getUserKeyFromCookieValue(cookies[0].value)
    })
}

exports.getSessionUuidFromBrowserWindow = getSessionUuidFromBrowserWindow
exports.getRendererApiInformation = getRendererApiInformation
exports.getUserKeyFromBrowserWindow = getUserKeyFromBrowserWindow
exports.getUserKeyFromBrowserCookie = getUserKeyFromBrowserCookie
exports.getUserKeyFromCookieValue = getUserKeyFromCookieValue
exports.executeLoad = executeLoad
exports.executeSave = executeSave
exports.progressEnd = progressEnd
exports.progressStart = progressStart
exports.reportFiles = reportFiles
