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
import Events from 'events'
import dbEnum from '../../src-shared/db-enum.js'

var eventEmitter = new Events.EventEmitter()

const client = new WebSocket(
  `ws://${window.location.hostname}:${window.location.port}/`
)

function doSend(object) {
  client.send(JSON.stringify(object))
}

function sendWebSocketInit() {
  sendWebSocketData(dbEnum.wsCategory.init, 'WebSocket initialized handshake.')
}

/**
 * Send websocket payload with a given category.
 *
 * @param {*} category
 * @param {*} payload
 */
function sendWebSocketData(category, payload) {
  if (client == null) {
    console.log('Websocket not initialized, message not sent.')
    return
  }
  var obj = {
    category: category,
    payload: payload,
  }
  doSend(obj)
}

/**
 * This can be used to send unstructured websocket message.
 * On the receiving end, the event will contain category
 * 'generic'.
 *
 * @param {*} msg
 */
function sendWebSocketMessage(msg) {
  if (client == null) {
    console.log('Websocket not initialized, message not sent.')
    return
  }
  doSend(msg)
}

/**
 * If you wish to register to a specific category of websocket
 * messages, you can use this function. Listener will be executed with
 * a given data object.
 *
 * @param {*} category
 * @param {*} listener
 */
function onWebSocket(category, listener) {
  eventEmitter.on(category, listener)
}

function processReceivedObject(obj) {
  if ('category' in obj && 'payload' in obj) {
    eventEmitter.emit(obj.category, obj.payload)
  } else {
    eventEmitter.emit(dbEnum.wsCategory.generic, obj)
  }
}

client.onopen = () => sendWebSocketInit()
client.onmessage = (event) => {
  var receivedObject = JSON.parse(event.data)
  processReceivedObject(receivedObject)
}

onWebSocket(dbEnum.wsCategory.init, (data) =>
  console.log(`Init message received: ${data}`)
)

onWebSocket(dbEnum.wsCategory.tick, (data) =>
  console.log(`Tick received: ${data}`)
)

Vue.prototype.$sendWebSocketData = sendWebSocketData
Vue.prototype.$sendWebSocketMessage = sendWebSocketMessage
Vue.prototype.$onWebSocket = onWebSocket
