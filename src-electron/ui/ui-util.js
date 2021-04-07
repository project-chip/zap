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
const { dialog } = require('electron')
const windowJs = require('./window.js')
const browserApi = require('./browser-api.js')
const { result } = require('lodash')

/**
 * Simple dialog to show error messages from electron renderer scope.
 *
 * @param {*} title
 * @param {*} err
 */
function showErrorMessage(title, err) {
  let msg
  if (err instanceof Error) {
    msg = err.toString() + '\n\nStack trace:\n' + err.stack
  } else {
    msg = err
  }
  dialog.showErrorBox(title, msg)
}

/**
 * Process a single file, parsing it in as JSON and then possibly opening
 * a new window if all is good.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} httpPort Server port for the URL that will be constructed.
 */
function openFileConfiguration(filePath, httpPort) {
  windowJs.windowCreate(httpPort, {
    filePath: filePath,
  })
}

/**
 * Creates a new window with a blank configuration.
 *
 * @param {*} httpPort
 * @param {*} options: uiMode, embeddedMode
 */
async function openNewConfiguration(httpPort, options = {}) {
  windowJs.windowCreate(httpPort, options)
}

/**
 * Toggles the dirty flag.
 *
 * @param {*} browserWindow window to affect
 * @param {*} dirty true if this windows is now dirty, false if otherwise
 */
function toggleDirtyFlag(browserWindow, dirty) {
  let title = browserWindow.getTitle()
  browserWindow.isDirty = dirty
  if (title.startsWith('* ') && !dirty) {
    browserWindow.setTitle(title.slice(2))
  } else if (!title.startsWith('*') && dirty) {
    browserWindow.setTitle('* ' + title)
  }
}

/**
 * This function should be invoked as a result of the fileBrowse
 * notification via the renderer API. It pops the open dialog and
 * reports result back through the API.
 *
 * @param {*} browserWindow
 * @param {*} options 'key', 'title', 'mode', 'defaultPath'
 */
function openFileDialogAndReportResult(browserWindow, options) {
  if (options.mode === 'file') {
    options.properties = ['openFile']
  } else if (options.mode == 'directory') {
    options.properties = ['openDirectory']
  }
  dialog.showOpenDialog(browserWindow, options).then((result) => {
    if (!result.canceled) {
      let output = {
        context: options.context,
        filePaths: result.filePaths,
      }
      browserApi.reportFiles(browserWindow, output)
    }
  })
}

exports.showErrorMessage = showErrorMessage
exports.openFileConfiguration = openFileConfiguration
exports.openNewConfiguration = openNewConfiguration
exports.toggleDirtyFlag = toggleDirtyFlag
exports.openFileDialogAndReportResult = openFileDialogAndReportResult
