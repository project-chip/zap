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
const windowJs = require('../main-process/window.js')

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
async function openNewConfiguration(db, httpPort, options = {}) {
  windowJs.windowCreate(httpPort, options)
}

exports.showErrorMessage = showErrorMessage
exports.openFileConfiguration = openFileConfiguration
exports.openNewConfiguration = openNewConfiguration
