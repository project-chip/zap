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

import axios from 'axios'
import restApi from '../../src-shared/rest-api.js'
import * as Util from '../util/util.js'
import * as SessionId from '../util/session-id.js'

let zapUpdateExceptions = (payload, statusCode, message) => {}

// You can set this to false to not log all the roundtrips
const log = false

// Handle session initialization
SessionId.initializeSessionIdInBrowser(window)

/**
 * URL rewriter that can come handy in development mode.
 *
 * @param {*} url
 * @returns
 */
function fillUrl(url) {
  let restPort = Util.getServerRestPort()
  if (restPort != null) {
    return `http://localhost:${restPort}${url}`
  } else {
    return url
  }
}

/**
 * Returns Success or Failure.
 * @param {*} code
 * @returns succes or failure
 */
function isHttpCodeSuccess(code) {
  return code >= 200 && code < 300
}
/**
 * Internal function that processes response from the server for any request.
 *
 * @param {*} method
 * @param {*} url
 * @param {*} response
 * @returns response, for chaining.
 */
function processResponse(method, url, response) {
  if (log) console.log(`${method} ← : ${url}, ${response.status}`)
  if (log) console.log(response)
  if (!isHttpCodeSuccess(response.status)) {
    throw response
  }
  return response
}

/**
 * This method creates a config as it should be sent to the server.
 * If passed config is null, then a new config object will be created.
 * If it's not, then a config object param list will be populated.
 *
 * @param {*} config
 * @returns config
 */
function fillConfig(config) {
  let sessionId = SessionId.sessionId(window)
  if (config == null) {
    config = { params: {} }
    config.params[restApi.param.sessionId] = sessionId
    return config
  } else {
    if (!('params' in config)) {
      config.params = {}
    }
    config.params[restApi.param.sessionId] = sessionId
    return config
  }
}

/**
 * Issues a GET to the server and returns a promise that resolves into a response.
 * GET is idempotent and does not change the state on the server.
 *
 * @param {*} url
 * @param {*} config
 * @returns Promise that resolves into a response.
 */
function serverGet(url, config = null) {
  if (log) console.log(`GET → : ${url}, ${config}`)
  return axios['get'](fillUrl(url), fillConfig(config))
    .then((response) => processResponse('GET', url, response))
    .catch((error) => console.log(error))
}

/**
 * Issues a DELETE to the server and returns a promise that resolves into a response.
 *
 * @param {*} url
 * @returns Promise that resolves into a response.
 */
function serverDelete(url, config = null) {
  if (log) console.log(`DELETE → : ${url}, ${config}`)
  return axios['delete'](fillUrl(url), fillConfig(config))
    .then((response) => processResponse('DELETE', url, response))
    .catch((error) => console.log(error))
}

/**
 * Issues a POST to the server and returns a promise that resolves into a response.
 *
 * Remember: POST is not idempotent. POST should not be used to update
 * a resource or create a resource.
 *
 * Think of POST as a way to "post a message to the posting board".
 *
 * @param {*} url
 * @param {*} data
 * @returns Promise that resolves into a response.
 */
function serverPost(url, data, config = null) {
  if (log) console.log(`POST → : ${url}, ${data}`)
  return axios['post'](fillUrl(url), data, fillConfig(config))
    .then((response) => processResponse('POST', url, response))
    .catch((error) => {
      zapUpdateExceptions(
        data,
        error.response.status,
        error.response.data.message
      )
    })
}

/**
 * Issues a PUT to the server and returns a promise that resolves into a response.
 *
 * Remember: PUT is a way to update a resource or create a new resource
 * at a given URI. It is idempotent, so consecutive PUTs with same data
 * do not cause consecutive entries.
 *
 * @param {*} url
 * @param {*} data
 * @returns Promise that resolves into a response.
 */
function serverPut(url, data, config = null) {
  if (log) console.log(`PUT → : ${url}, ${data}`)
  return axios['put'](fillUrl(url), data, fillConfig(config))
    .then((response) => processResponse('PUT', url, response))
    .catch((error) => console.log(error))
}

/**
 * Issues a PATCH to the server and returns a promise that resolves into a response.
 *
 * @param {*} url
 * @returns Promise that resolves into a response.
 */
function serverPatch(url, data, config = null) {
  if (log) console.log(`PATCH → : ${url}, ${data}`)
  return axios['patch'](fillUrl(url), data, fillConfig(config))
    .then((response) => processResponse('PATCH', url, response))
    .catch((error) => console.log(error))
}

window.serverGet = serverGet
window.serverPost = serverPost
window.serverPut = serverPut
window.serverPatch = serverPatch
window.serverDelete = serverDelete

export default ({ app, store }) => {
  zapUpdateExceptions = (payload, statusCode, message) => {
    store.dispatch('zap/updateExceptions', {
      url,
      method: 'post',
      payload,
      statusCode,
      message
    })
  }

  // Now tie these functions to vue instance
  app.config.globalProperties.$serverGet = serverGet
  app.config.globalProperties.$serverPost = serverPost
  app.config.globalProperties.$serverPut = serverPut
  app.config.globalProperties.$serverPatch = serverPatch
  app.config.globalProperties.$serverDelete = serverDelete
}

export const axiosRequests = {
  $serverGet: serverGet,
  $serverPost: serverPost,
  $serverPut: serverPut,
  $serverPatch: serverPatch,
  $serverDelete: serverDelete
}
