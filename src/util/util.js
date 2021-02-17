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
        console.log('MutationObserver: ' + attributeValue)

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
