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

const rendApi = require('../../src-shared/rend-api.js')
const uiUtil = require('./ui-util.js')
const env = require('../util/env.js')

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

/**
 * Execute RendererApi commands
 * @param {*} browserWindow
 * @param {*} rendererApiCommand
 * @param  {...any} theArgs
 */

async function execRendererApi(browserWindow, rendererApiCommand, ...theArgs) {
  const info = await browserWindow.webContents.executeJavaScript(
    'window.global_renderer_api_info'
  )

  let apiFound = info.functions.filter((x) => x.id === rendererApiCommand)
  if (!apiFound.length) {
    env.logBrowser(
      `Unhandled renderer API function id invoked: ${rendererApiCommand}`
    )
  } else {
    // call javascript
    await browserWindow.webContents.executeJavaScript(
      `window.global_renderer_api_execute('${rendererApiCommand}', "${theArgs}")`
    )
  }
}

async function getFileLocation(browserWindow, storageKey) {
  return getStorageItem(browserWindow, storageKey)
}

async function saveFileLocation(browserWindow, storageKey, path) {
  execRendererApi(browserWindow, rendApi.id.setStorageItem, storageKey, path)
}

async function getStorageItem(browserWindow, key) {
  return browserWindow.webContents.executeJavaScript(
    `window.global_renderer_api_execute('${rendApi.id.getStorageItem}', '${key}')`
  )
}
// async function setStorageItem(browserWindow, key, value) {
//   return browserWindow.webContents.executeJavaScript(
//     `window.global_renderer_api_execute('${rendApi.id.setStorageItem}', '${key}', '${value}')`
//   )
// }

/**
 * This method takes a message and checks if it's a renderer API
 * notification call. If it is, it processe it and returns true.
 * If it's not it returns false.
 *
 * @param {*} message
 * @returns true if message was a notify message and was consumed.
 */
function processRendererNotify(browserWindow, message) {
  if (message.startsWith(rendApi.jsonPrefix)) {
    let obj = JSON.parse(message.slice(rendApi.jsonPrefix.length))
    switch (obj.key) {
      case rendApi.notifyKey.dirtyFlag:
        uiUtil.toggleDirtyFlag(browserWindow, obj.value)
        return true
      case rendApi.notifyKey.fileBrowse:
        uiUtil.openFileDialogAndReportResult(browserWindow, obj.value)
        return true
      default:
        env.logBrowser(`Unhandled renderer API key: ${obj.key}`)
        return false
    }
  }
  return false
}

/**
 * This method calls the reportFiles renderer API call.
 *
 * @param {*} browserWindow
 * @param {*} result
 */
async function reportFiles(browserWindow, result) {
  let resultJson = JSON.stringify(result)
  await browserWindow.webContents.executeJavaScript(
    `window.global_renderer_api_execute('${rendApi.id.reportFiles}', '${resultJson}')`
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
      if (cookies.length == 0)
        throw new Error('Could not find session key in a browser window')
      else return getUserKeyFromCookieValue(cookies[0].value)
    })
}

exports.getSessionUuidFromBrowserWindow = getSessionUuidFromBrowserWindow
exports.getRendererApiInformation = getRendererApiInformation
exports.getUserKeyFromBrowserWindow = getUserKeyFromBrowserWindow
exports.getUserKeyFromBrowserCookie = getUserKeyFromBrowserCookie
exports.getUserKeyFromCookieValue = getUserKeyFromCookieValue
exports.reportFiles = reportFiles
exports.processRendererNotify = processRendererNotify
exports.getFileLocation = getFileLocation
exports.saveFileLocation = saveFileLocation
exports.execRendererApi = execRendererApi
