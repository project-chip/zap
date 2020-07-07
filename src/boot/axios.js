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

Vue.prototype.$serverGet = (url) => {
  console.log(`serverGet: ${url}`)
  axios
    .get('/get' + url)
    .then((response) => {
      console.log('get response:')
      console.log(response)
      eventEmitter.emit(
        response.data['replyId'],
        response.data['replyId'],
        response.data
      )
    })
    .catch((error) => console.log(error))
}

Vue.prototype.$serverPost = (url, data) => {
  console.log(`serverPost: ${url}, ${data}`)
  axios
    .post(url, data)
    .then((response) => {
      console.log('post response')
      console.log(response)
      eventEmitter.emit(
        response.data['replyId'],
        response.data['replyId'],
        response.data
      )
    })
    .catch((error) => console.log(error))
}

Vue.prototype.$serverOn = (channel, listener) => {
  eventEmitter.on(channel, listener)
}

Vue.prototype.$emitEvent = (channel) => {
  eventEmitter.emit(channel)
}

Vue.prototype.$serverGetWithType = (url, type) => {
  console.log(`serverGet: ${url}`)
  if (type === 'preview') {
    return axios.get(url)
  }
}
