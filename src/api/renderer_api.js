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

const ide = require('./ide-api-request.js')
const util = require('../util/util.js')

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
        id: 'saveAs',
        description: 'Save As file...',
      },
      {
        id: 'refresh',
        description: 'Refresh file...',
      },
      {
        id: 'rename',
        description: 'Rename file...',
      },
      {
        id: 'isDirty',
        type: 'init',
        description:
          "Observe 'isdirty' attribute, which reflects the DIRTY flag in ZAP backend. setDirty() is invoked as callback.",
      },

      // Misc operation that might not be supported.
      {
        id: 'move',
        description: 'Move file...',
      },
      {
        id: 'import',
        description: 'Import file...',
      },
      {
        id: 'export',
        description: 'Export file...',
      },
    ],
  }
}

function fnOpen(path) {
  id.open(path)
}

function fnSave(sessionId) {
  ide.save(sessionId)
}

function fnIsDirty() {
  util.observeAttribute('isdirty', 'setDirty')
}

function renderer_api_execute(id) {
  let ret = null
  switch (id) {
    case 'open':
      ret = fnOpen.apply(null, arguments.slice(1))
      break
    case 'save':
      ret = fnSave.apply(null, arguments.slice(1))
      break
    case 'isDirty':
      ret = fnIsDirty.apply(null, arguments.slice(1))
      break
  }
  return ret
}

function renderer_api() {
  return {
    prefix: 'zap',
    description: 'Zap Renderer API',
    functions: [
      {
        id: 'open',
        description: 'Open file...',
        function: fnOpen,
      },
      {
        id: 'save',
        description: 'Save file...',
        function: fnSave,
      },
      {
        id: 'saveAs',
        description: 'Save As file...',
        function: () => {},
      },
      {
        id: 'refresh',
        description: 'Refresh file...',
        function: () => {},
      },
      {
        id: 'rename',
        description: 'Rename file...',
        function: () => {},
      },
      {
        id: 'isDirty',
        type: 'init',
        description:
          "Observe 'isdirty' attribute, which reflects the DIRTY flag in ZAP backend. setDirty() is invoked as callback.",
        function: fnIsDirty,
      },

      // Misc operation that might not be supported.
      {
        id: 'move',
        description: 'Move file...',
        function: () => {},
      },
      {
        id: 'import',
        description: 'Import file...',
        function: () => {},
      },
      {
        id: 'export',
        description: 'Export file...',
        function: () => {},
      },
    ],
  }
}

exports.renderer_api = renderer_api
exports.renderer_api_info = renderer_api_info
exports.renderer_api_execute = renderer_api_execute
