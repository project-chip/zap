// Copyright (c) 2019 Silicon Labs. All rights reserved.

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
    .post('/post' + url, data)
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
