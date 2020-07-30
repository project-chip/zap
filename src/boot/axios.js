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

import Vue from 'vue'
import axios from 'axios'
import events from 'events'

import restApi from '../../src-shared/rest-api.js'

Vue.prototype.$axios = axios({ withCredentials: true })
var eventEmitter = new events.EventEmitter()

// You can set this to false to not log all the roundtrips
const log = true

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
  if (!restApi.httpCode.isSuccess(response.status)) {
    throw response
  }
  eventEmitter.emit(
    response.data['replyId'],
    response.data['replyId'],
    response.data
  )
  return response
}

/**
 * Issues a GET to the server and returns a promise that resolves into a response.
 *
 * @param {*} url
 * @param {*} config
 * @returns Promise that resolves into a response.
 */
function serverGet(url, config = null) {
  if (log) console.log(`GET → : ${url}, ${config}`)
  return axios['get'](url, config)
    .then((response) => processResponse('GET', url, response))
    .catch((error) => console.log(error))
}

/**
 * Issues a POST to the server and returns a promise that resolves into a response.
 *
 * @param {*} url
 * @param {*} data
 * @returns Promise that resolves into a response.
 */
function serverPost(url, data) {
  if (log) console.log(`POST → : ${url}, ${data}`)
  return axios['post'](url, data)
    .then((response) => processResponse('POST', url, response))
    .catch((error) => console.log(error))
}

/**
 * Issues a PUT to the server and returns a promise that resolves into a response.
 *
 * @param {*} url
 * @param {*} data
 * @returns Promise that resolves into a response.
 */
function serverPut(url, data) {
  if (log) console.log(`PUT → : ${url}, ${data}`)
  return axios['put'](url, data)
    .then((response) => processResponse('PUT', url, response))
    .catch((error) => console.log(error))
}

/**
 * Issues a DELETE to the server and returns a promise that resolves into a response.
 *
 * @param {*} url
 * @returns Promise that resolves into a response.
 */
function serverDelete(url) {
  if (log) console.log(`DELETE → : ${url}`)
  return axios['delete'](url)
    .then((response) => processResponse('DELETE', url, response))
    .catch((error) => console.log(error))
}

/**
 * Registers a listener to the given event.
 *
 * @param {*} channel
 * @param {*} listener
 */
function serverOn(channel, listener) {
  eventEmitter.on(channel, listener)
}

// Now tie these functions to vue instance
Vue.prototype.$serverGet = serverGet
Vue.prototype.$serverPost = serverPost
Vue.prototype.$serverPut = serverPut
Vue.prototype.$serverDelete = serverDelete
Vue.prototype.$serverOn = serverOn
