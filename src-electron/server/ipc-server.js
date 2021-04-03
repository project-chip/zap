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
/**
 * IPC initialization.
 *
 * @parem {*} isServer 'true' if this is a server, 'false' for client.
 * @param {*} options
 */
function init(
  isServer,
  options = {
    port: 9073,
  }
) {
  ipc.config.networkPort = options.port
  ipc.config.socketRoot = env.appDirectory()
  ipc.config.appspace = 'zap'
  ipc.config.id = 'main'

  if (isServer) {
    ipc.serve()
    ipc.server.start()
    ipc.server.on('start', () => {
      env.logIpc('Started the IPC server.')
    })
    ipc.server.on('error', (err) => {
      env.logIpc('IPC error', err)
    })
  } else {
    ipc.connectTo('main', () => {
      env.logIpc('Started the IPC server.')
    })
  }
}

function shutdown(iServer) {
  if (isServer) {
    ipc.server.stop()
  } else {
    ipc.disconnect('main')
  }
}

exports.init = init
exports.shutdown = shutdown
