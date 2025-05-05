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

import { Dark } from 'quasar'
import { wsCategory } from '../../src-shared/db-enum.js'
const _ = require('lodash')

const observable = require('../util/observable.js')
const restApi = require('../../src-shared/rest-api.js')
const rendApi = require('../../src-shared/rend-api.js')
const storage = require('../util/storage.js')

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
export function renderer_api_info() {
  return {
    prefix: 'zap',
    description: 'Zap Renderer API',
    functions: rendApi.renderer_api_info
  }
}

/**
 * Save file.
 * @param {*} zap_file
 */
function fnSave(zap_file) {
  let data = {}
  if (zap_file != null) data.path = zap_file
  window
    .serverPost(`${restApi.ide.save}`, data)
    .catch((err) => console.log(err))
}

/**
 * Check if state of file is dirty based on unsaved changes.
 * @returns
 */
function fnIsDirty() {
  return window
    .serverGet(`${restApi.ide.isDirty}`)
    .then((res) => {
      return res?.data?.DIRTY
    })
    .catch((err) => console.log(err))
}

/**
 * Execute the renderer api based on id.
 * @param {*} id
 * @param  {...any} args
 * @returns ret
 */
export function renderer_api_execute(id, ...args) {
  let ret = null
  switch (id) {
    case rendApi.id.save:
      ret = fnSave.apply(null, args)
      break
    case rendApi.id.progressStart:
      observable.setObservableAttribute(
        rendApi.observable.progress_attribute,
        args[0]
      )
      break
    case rendApi.id.progressEnd:
      observable.setObservableAttribute(
        rendApi.observable.progress_attribute,
        ''
      )
      break
    case rendApi.id.reportFiles:
      observable.setObservableAttribute(
        rendApi.observable.reported_files,
        JSON.parse(args[0])
      )
      break
    case rendApi.id.debugNavBarOn:
      observable.setObservableAttribute(rendApi.observable.debugNavBar, true)
      break
    case rendApi.id.debugNavBarOff:
      observable.setObservableAttribute(rendApi.observable.debugNavBar, false)
      break
    case rendApi.id.setDarkTheme:
      {
        const useDarkTheme =
          typeof args[0] === 'string' ? args[0] === 'true' : !!args[0]
        if (_.isBoolean(useDarkTheme)) {
          Dark.set(useDarkTheme)
          storage.setItem(rendApi.storageKey.isDarkThemeActive, useDarkTheme)
          if (window.electronAPI) {
            // light theme value
            let titleBarOverlay = {
              color: '#F4F4F4',
              symbolColor: '#67696D'
            }
            if (useDarkTheme) {
              titleBarOverlay = {
                color: '#1B1B1B',
                symbolColor: '#67696D'
              }
            }
            window.electronAPI.setTitleBarOverlay(titleBarOverlay)
          }
          renderer_api_notify(rendApi.id.setDarkTheme, useDarkTheme)
        }
      }
      break

    case rendApi.id.isDirty:
      ret = fnIsDirty.apply(null)
      break
  }
  return ret
}

/**
 * Default implementation of the notification function simply
 * prints the notification to the console log. In case of electron
 * renderer container, this is all that's needed.
 *
 * In addition, this function also sends a postMessage to the parent, which
 * is a protocol used by at least one supported IDE.
 *
 * Any other IDE can implement this function and override the default from
 * outside of the browser context.
 *
 * @param {*} key
 * @param {*} value
 */
export function renderer_api_notify(key, value) {
  console.log(
    `${rendApi.jsonPrefix}${JSON.stringify({ key: key, value: value })}`
  )

  // Here we also send postMessage to the parent window if we're in a frame...
  // We also perform a conversion, since the postMessage() protocol of the IDE
  // is different than the base ZAP renderer API.
  let sentKey = key
  let sentValue = value

  // For some inexplicable reason, the IDE's dirty flag protocol is using
  // key "dirty" and value { isDirty: true/false } instead of the
  // key "dirtyFlag" and value true/false as it's done by zap internally.
  // So we transform the sent values....
  if (key == wsCategory.dirtyFlag) {
    sentKey = 'dirty'
    sentValue = {
      isDirty: value
    }
    // Dispatch to Vuex store with a boolean value
    this.$store.dispatch('zap/setSaveButtonVisible', value)
  }
  window?.parent?.postMessage(
    {
      eventId: sentKey,
      eventData: sentValue
    },
    '*'
  )
}
