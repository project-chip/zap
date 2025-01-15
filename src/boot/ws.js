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
import Events from 'events'
import dbEnum from '../../src-shared/db-enum.js'
import restApi from '../../src-shared/rest-api.js'
import rendApi from '../../src-shared/rend-api.js'
import { Notify } from 'quasar'
import * as Util from '../util/util.js'
import * as SessionId from '../util/session-id.js'

const tickInterval = 15000 // 15 seconds tick interval for server watchdog.

let eventEmitter = new Events.EventEmitter()
let restPort = Util.getServerRestPort()
let wsUrl = `ws://${window.location.hostname}:${
  restPort == null ? window.location.port : restPort
}?${restApi.param.sessionId}=${SessionId.sessionId(window)}`
const client = new WebSocket(wsUrl)

/**
 * Send object over the web socket.
 * @param {*} object
 */
function doSend(object) {
  client.send(JSON.stringify(object))
}

/**
 * Initialize the web socket
 */
function sendWebSocketInit() {
  sendWebSocketData(dbEnum.wsCategory.init, 'WebSocket initialized handshake.')
  setInterval(() => sendWebSocketData(dbEnum.wsCategory.tick), tickInterval)
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
  let obj = {
    category: category
  }
  if (payload != null) obj.payload = payload
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

/**
 * Process the received object over the web socket.
 * @param {*} obj
 */
function processReceivedObject(obj) {
  if (typeof obj == 'object' && 'category' in obj && 'payload' in obj) {
    eventEmitter.emit(obj.category, obj.payload)
  } else {
    eventEmitter.emit(dbEnum.wsCategory.generic, obj)
  }
}

client.onopen = () => sendWebSocketInit()
client.onmessage = (event) => {
  let receivedObject = JSON.parse(event.data)
  processReceivedObject(receivedObject)
}

onWebSocket(dbEnum.wsCategory.init, (data) =>
  console.log(`Init message received: ${data}`)
)

//commented unnecessary logs and listeners

// onWebSocket(dbEnum.wsCategory.tick, (data) =>
//   console.log(`Tick received: ${data}`)
// )

onWebSocket(dbEnum.wsCategory.dirtyFlag, (data) => {
  window[rendApi.GLOBAL_SYMBOL_NOTIFY](rendApi.notifyKey.dirtyFlag, data)
})

//commented unnecessary logs and listeners

// onWebSocket(dbEnum.wsCategory.validation, (data) => {
//   // console.log(`Validation recieved: ${data}`)
// })

onWebSocket(dbEnum.wsCategory.sessionCreationError, (data) => {
  let html = `<center>
  <strong>${data}</strong>
  <br>
  </center>`
  Notify.create({
    message: html,
    color: 'negative',
    position: 'top',
    html: true,
    timeout: 5000
  })

  console.log(`sessionCreationError: ${JSON.stringify(data)}`)
})

//commented unnecessary logs
onWebSocket(dbEnum.wsCategory.componentUpdateStatus, (obj) => {
  let { data, added } = obj
  // console.log(`componentUpdateStatus: ${JSON.stringify(obj)}`)
  Util.notifyComponentUpdateStatus(data, added)
})

// receive notification data
onWebSocket(dbEnum.wsCategory.notificationInfo, (data) => {
  let { display, message } = data
  if (display != 0) {
    let html = `<center>
      <strong>${message}</strong>
      <br>
      </center>`
    Notify.create({
      message: html,
      color: 'negative',
      position: 'top',
      html: true,
      timeout: 5000
    })
  }
})

//commented unnecessary logs and listeners

// onWebSocket(dbEnum.wsCategory.generic, (data) =>
//   console.log(`Generic message received: ${JSON.stringify(data)}`)
// )

export default ({ app }) => {
  app.config.globalProperties.$sendWebSocketData = sendWebSocketData
  app.config.globalProperties.$sendWebSocketMessage = sendWebSocketMessage
  app.config.globalProperties.$onWebSocket = onWebSocket
}
