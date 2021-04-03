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

const ipc = require('node-ipc')
const env = require('../util/env.js')
const ipcServer = require('../server/ipc-server.js')
const util = require('../util/util.js')

const clientIpc = new ipc.IPC()
clientIpc.clientUuid = util.createUuid()
clientIpc.clientConnected = false

function log(msg) {
  env.logIpc(`Ipc client: ${msg}`)
}

/**
 * Initializes and connects a client.
 *
 * @returns a promise which resolves when client connects
 */
function initAndConnectClient() {
  clientIpc.config.logger = log
  clientIpc.config.id = 'main'

  return new Promise((resolve, reject) => {
    clientIpc.connectTo(clientIpc.clientUuid, ipcServer.socketPath(), () => {
      env.logIpc('Started the IPC client.')
      clientIpc.clientConnected = true
      let socket = clientIpc.of[clientIpc.clientUuid]
      socket.on('disconnect', () => {
        env.logIpc('Client disconnected.')
        clientIpc.clientConnected = false
      })
      socket.on(ipcServer.eventType.test, (data) => {
        env.logIpc(`Client received a test message: ${data}`)
      })
      resolve()
    })
  })
}

/**
 * Returns true if client is connected.
 *
 * @returns true if client is connected
 */
function isClientConnected() {
  return clientIpc.clientConnected === true
}

/**
 * Disconnects a client asynchronously.
 */
function disconnectClient() {
  env.logIpc('Disconnecting the IPC client.')
  clientIpc.disconnect(clientIpc.clientUuid)
}

/**
 * Sends a message to server.
 *
 * @param {*} key
 * @param {*} object
 */
async function emit(key, object) {
  clientIpc.of[clientIpc.clientUuid].emit(key, object)
}

exports.initAndConnectClient = initAndConnectClient
exports.isClientConnected = isClientConnected
exports.disconnectClient = disconnectClient
exports.emit = emit
