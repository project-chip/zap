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

const util = require('../util/util.js')
const restApi = require('../../src-shared/rest-api.js')

// This file provide glue logic to enable function calls & HTML attribute data change listener logic
// between front-end containers (jxBrowser, Electron, etc) and the node.js
//
// If a callback applies (e.g. when a function returns a value),
// the javascript code will invoke the Java function name "${id}Callback"
// e.g. for function "open", "openCallback" is invoked.

/**
 * Each declared 'function' entry offers such features:
 * - ability to invoke front-end functions within container via function 'id' with callback.
 * - ability to observe specific HTML target (a DOM Node) for data change.
 *
 * Per entry, 'type' is 'observer', it is dedicated as a data cahgne listener. The
 * e.g. The 'open' function is invoked by the container when opening a new configuration.
 * The front-end is informed and proceed to init UI elements.
 */
function renderer_api_info() {
  return {
    prefix: 'zap',
    description: 'Zap Renderer API',
    functions: [
      {
        id: 'open',
        description: 'Open file...',
      },
      {
        id: 'save',
        description: 'Save file...',
      },
      {
        id: 'isDirty',
        type: 'init',
        description:
          "Observe 'isdirty' attribute, which reflects the DIRTY flag in ZAP backend. setDirty() is invoked as callback.",
      },
    ],
  }
}

function fnOpen(zap_file) {
  // Make a request for a user with a given ID
  if (zap_file) {
    let config = { params: {} }
    config.params[restApi.param.path] = zap_file
    window
      .axios_server_get(`${restApi.ide.open}`, config)
      .then((res) => window.openCallback(res))
      .catch((err) => window.openCallback(err))
  }
}

function fnSave(sessionId) {
  window
    .axios_server_get(`${restApi.ide.save}`)
    .then((res) => window.saveCallback(res))
    .then((err) => window.saveCallback(err))
}

function fnIsDirty() {
  util.observeAttribute('isdirty', 'setDirty')
}

function renderer_api_execute(id, ...args) {
  let ret = null
  switch (id) {
    case 'open':
      ret = fnOpen.apply(null, args)
      break
    case 'save':
      ret = fnSave.apply(null, args)
      break
    case 'isDirty':
      ret = fnIsDirty.apply(null, args)
      break
  }
  return ret
}

exports.renderer_api_info = renderer_api_info
exports.renderer_api_execute = renderer_api_execute
