/**
 *
 *    Copyright (c) 2025 Silicon Labs
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

import { v4 as uuidv4 } from 'uuid'
import { parse as querystringParse } from 'querystring'

// Session handling constants
const SESSION_KEY = 'session_uuid'
const APP_ID_KEY = 'stsApplicationId'
const DEFAULT_APP_ID = 'defaultAppId'

/**
 * Loads a session map from the session storage.
 * Session map is a string=>string key/value map,
 * which contains "appId" as a key, and the generated UUID as a value.
 * If appId is not present (as in standalone), then a default value
 * is used.
 *
 * @param {*} window
 * @returns
 */
function loadSessionMap(window) {
  let json = window.sessionStorage.getItem(SESSION_KEY)
  if (json == null) {
    // Nothing there, let's just create an empty map.
    return new Map()
  } else {
    // Found it, so we deserialize it.
    const parsedArray = JSON.parse(json)
    return new Map(parsedArray)
  }
}

/**
 * Saves a session map into the session storage.
 * @param {*} window
 * @param {*} map
 */
function saveSessionMap(window, map) {
  const mapArray = Array.from(map)
  const json = JSON.stringify(mapArray)
  window.sessionStorage.setItem(SESSION_KEY, json)
}

/**
 * Determine application id. If there is actually an stsApplicationId passed
 * in, then what we get is that. Otherwise, it uses
 *
 * @param {*} window
 * @returns
 */
function retrieveApplicationId(window) {
  // Check if it has already been put on the dom.
  if (window.zapAppId) {
    return window.zapAppId
  }

  // If it's not there, get it from the seach query....
  let search = window.location.search
  if (search[0] === '?') {
    search = search.substring(1)
  }
  let query = querystringParse(search)

  let appId
  if (query[APP_ID_KEY]) {
    appId = query[APP_ID_KEY]
  } else {
    appId = DEFAULT_APP_ID
  }

  // Store it onto the window object for quicker access.
  window.zapAppId = appId

  return appId
}

/**
 * Returns the session id after it's been created. This method WILL NOT
 * create one if it hasn't been created yet. Only the
 * initializeSessionIdInBrowser method will create a new session id.
 * @param {*} window
 * @returns
 */
export function sessionId(window) {
  let appId = retrieveApplicationId(window)
  let sessionMap = loadSessionMap(window)
  return sessionMap.get(appId)
}

/**
 * This is the entry point for the boot file to handle the session object.
 * It mainly needs to figure out if it needs to create a new UUID or not.
 * @param {*} window
 */
export function initializeSessionIdInBrowser(window) {
  let sessionMap = loadSessionMap(window)
  let appId = retrieveApplicationId(window)

  // Get the session object, that is keyed by the appId
  let sessionUuid = sessionMap.get(appId)
  if (sessionUuid == null) {
    // This is a whole new appId. Let's create a session object for it.
    sessionMap.set(appId, uuidv4())
    saveSessionMap(window, sessionMap)
  }
}
