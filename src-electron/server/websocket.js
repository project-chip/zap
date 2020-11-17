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
const env = require('../util/env.js')

var wsServer = null
var wsSocket = null

function initializeWebSocket(httpServer) {
  wsServer = new ws.Server({ noServer: true })
  wsServer.on('connection', (socket) => {
    wsSocket = socket
    socket.on('message', (message) => {
      exports.lastMessageReceived = message
      socket.send(`Echo ${message}`)
    })
  })

  httpServer.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (socket) => {
      wsServer.emit('connection', socket, request)
    })
  })
}

function sendWebSocketMessage(msg) {
  if (wsSocket != null) {
    wsSocket.send(msg)
  } else {
    env.logError('Websocket not initialized, message not sent.')
  }
}

exports.initializeWebSocket = initializeWebSocket
exports.sendWebSocketMessage = sendWebSocketMessage
exports.lastMessageReceived = null
