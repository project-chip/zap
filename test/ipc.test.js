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
 *
 *
 * @jest-environment node
 */

const ipcClient = require('../src-electron/client/ipc-client.js')
const ipcServer = require('../src-electron/server/ipc-server.js')

test('test no server', () => expect(ipcServer.isServerRunning()).toBeFalsy())
test('start server', () =>
  ipcServer.initServer().then(() => {
    expect(ipcServer.isServerRunning()).toBeTruthy()
  }))
test('test no client', () => expect(ipcClient.isClientConnected()).toBeFalsy())
test('connect first client', () =>
  ipcClient.initAndConnectClient().then(() => {
    expect(ipcClient.isClientConnected()).toBeTruthy()
  }))
test(
  'send message from client, wait a second',
  () =>
    ipcClient.emit(ipcServer.eventType.test, { a: 1, b: 2 }).then(
      () =>
        new Promise((resolve, reject) => {
          setTimeout(() => resolve(), 1000)
        })
    ),
  2000
)
test('disconnect client', () => ipcClient.disconnectClient())
test('shutdown server', () => {
  ipcServer.shutdownServerSync()
})
