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

const http = require('http-status-codes')
import { Notify } from 'quasar'

// Implements the pairing function here as a perfect hash.
// https://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
// We don't implement the inverse at this time.
// This function takes in 2 non-negative natural numbers, and returns a natural number
export function cantorPair(x, y) {
  return ((x + y) * (x + y + 1)) / 2 + y
}

export function asHex(value, padding) {
  if (value == null) return ''
  return '0x' + value.toString(16).padStart(padding, '0').toUpperCase()
}

/**
 * Setup MutationObserver for specific attribute on the ZAP front end
 * and invoke callback functions on the Window Object
 *
 * user case: front-end container (jxBrowser/Electron/etc) intending to 'watch' data inside front-end.
 *
 * @param {*} attributeName
 * @param {*} callback -
 *                      if type "string", it's used as a function name and will be invoked upon the Window Object
 *                      if type "function", it's invoked as a callback.
 */

export function observeAttribute(attributeName, callbackObj) {
  // HTML attribute names are not guaranteed to be case sensitive
  attributeName = attributeName.toLowerCase()
  let html = document.documentElement
  console.log('observing : ' + attributeName)

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === attributeName
      ) {
        let attributeValue = mutation.target.getAttribute(attributeName)
        if (typeof callbackObj === 'string') {
          window[callbackObj](attributeValue)
        } else if (typeof callbackObj === 'function') {
          callbackObj()
        }
      }
    })
  }).observe(html, {
    attributeFilter: [attributeName],
  })
}

/**
 * Update UI to reflect required components are NOT enabled!
 *
 * @param {*} actionSuccessful - true/false
 * @param {*} componentIds - list of strings
 */
export function notifyComponentStatus(componentIdStates, added) {
  let components = []
  let updated = false
  console.log(JSON.stringify(componentIdStates))
  if (componentIdStates.length) {
    let success = componentIdStates.filter(
      (x) => x.status == http.StatusCodes.OK
    )
    let failure = componentIdStates.filter(
      (x) => x.status != http.StatusCodes.OK
    )

    if (failure.length) {
      components = failure.map((x) => x.id)
      // updated stays false
    } else {
      components = success.map((x) => x.id)
      updated = true
    }

    if (Array.isArray(components) && components.length) {
      let color = updated ? 'positive' : 'negative'
      let verb = updated ? 'were' : "couldn't be"
      let action = added ? 'added' : 'removed'

      let msg = `<div><strong>The following components ${verb} ${action}.</strong></div>`
      msg += `<div><span style="text-transform: capitalize"><ul>`
      msg += components
        .map((id) => `<li>${id.replace(/_/g, ' ')}</li>`)
        .join(' ')
      msg += `</ul></span></div>`

      // notify ui
      Notify.create({
        message: msg,
        color,
        position: 'top',
        html: true,
      })
    }
  }
}

export function getSelectedComponent(ucComponentTreeResponse) {
  // computed selected Nodes
  let selected = []
  if (ucComponentTreeResponse) {
    ucComponentTreeResponse.filter(function f(e) {
      if (e.children) {
        e.children.filter(f, this)
      }

      if (e.isSelected) {
        this.push(e.id)
      }
    }, selected)
  }
  return selected
}
