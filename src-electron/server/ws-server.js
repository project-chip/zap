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

/**
 * This module provides the HTTP server functionality.
 *
 * @module JS API: websocket server
 */
const ws = require('ws')
const events = require('events')

const env = require('../util/env.js')
const dbEnum = require('../../src-shared/db-enum.js')

var eventEmitter = new events.EventEmitter()

// Set this to false to disable ticking
var doTicks = false

/**
 * Initialize a websocket, and register listeners to the
 * websocket connection and the message receipt.
 *
 * @param {*} httpServer
 */
function initializeWebSocket(httpServer) {
  var wsServer = new ws.Server({ noServer: true })
  wsServer.on('connection', (socket, request) => {
    socket.on('message', (message) => {
      // When we receive a message we emit it via the event emitter.
      var obj = JSON.parse(message)
      if ('category' in obj && 'payload' in obj) {
        eventEmitter.emit(obj.category, socket, obj.payload)
      } else {
        eventEmitter.emit(dbEnum.wsCategory.generic, socket, obj)
      }
    })

    if (doTicks) {
      socket.tickCounter = 0
      setInterval(() => sendTick(socket), 2000)
    }
  })

  httpServer.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (socket) => {
      wsServer.emit('connection', socket, request)
    })
  })

  onWebSocket(dbEnum.wsCategory.init, (socket, data) => {
    env.logInfo(`Init message received: ${data}. Responding.`)
    sendWebSocketData(
      socket,
      dbEnum.wsCategory.init,
      'WebSocket initialized handshake response.'
    )
  })
}

function sendTick(socket) {
  sendWebSocketData(socket, dbEnum.wsCategory.tick, socket.tickCounter++)
}

/**
 * Bottom-most function that sends an object over a socket.
 *
 * @param {*} socket
 * @param {*} object
 */
function doSend(socket, object) {
  socket.send(JSON.stringify(object))
}

/**
 * Send websocket payload with a given category.
 *
 * @param {*} category
 * @param {*} payload
 */
function sendWebSocketData(socket, category, payload) {
  var obj = {
    category: category,
    payload: payload,
  }
  doSend(socket, obj)
}

/**
 * This can be used to send unstructured websocket message.
 * On the receiving end, the event will contain category
 * 'generic'.
 *
 * @param {*} msg
 */
function sendWebSocketMessage(socket, msg) {
  doSend(socket, msg)
}

/**
 * If you wish to register to a specific category of websocket
 * messages, you can use this function. Listener will be executed with
 * a given socket and data object.
 *
 * @param {*} category category of message.
 * @param {*} listener function that receives socket, data.
 */
function onWebSocket(category, listener) {
  eventEmitter.on(category, listener)
}

exports.initializeWebSocket = initializeWebSocket
exports.sendWebSocketMessage = sendWebSocketMessage
exports.sendWebSocketData = sendWebSocketData
