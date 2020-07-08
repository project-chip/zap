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

Vue.prototype.$axios = axios({ withCredentials: true })
var eventEmitter = new events.EventEmitter()

// serverGet method issues a GET to a given URL,
// then emits the response onto the event emitter.
// The resolve promise with the response is returned
// for possible chaining.
Vue.prototype.$serverGet = (url) => {
  console.log(`serverGet: ${url}`)
  return axios
    .get(url)
    .then((response) => {
      console.log('get response:')
      console.log(response)
      eventEmitter.emit(
        response.data['replyId'],
        response.data['replyId'],
        response.data
      )
      return response
    })
    .catch((error) => console.log(error))
}

// serverGet method issues a POST to a given URL,
// then emits the response onto the event emitter.
// The resolve promise with the response is returned
// for possible chaining.
Vue.prototype.$serverPost = (url, data) => {
  console.log(`serverPost: ${url}, ${data}`)
  return axios
    .post(url, data)
    .then((response) => {
      console.log('post response')
      console.log(response)
      eventEmitter.emit(
        response.data['replyId'],
        response.data['replyId'],
        response.data
      )
      return response
    })
    .catch((error) => console.log(error))
}

// serverOn allows a listener to be registered
// to a data transfer on a given channel
Vue.prototype.$serverOn = (channel, listener) => {
  eventEmitter.on(channel, listener)
}

// Emits empty event on a channel.
Vue.prototype.$emitEvent = (channel) => {
  eventEmitter.emit(channel)
}
