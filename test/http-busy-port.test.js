/**
 *
 *    Copyright (c) 2026 Silicon Labs
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

const net = require('net')
const dbApi = require('../src-electron/db/db-api')
const env = require('../src-electron/util/env')
const httpServer = require('../src-electron/server/http-server')
const { timeout } = require('./test-util')

let db
let occupier

beforeAll(async () => {
  env.setDevelopmentEnv()
  db = await dbApi.initDatabaseAndLoadSchema(
    env.sqliteTestFile('http-busy-port'),
    env.schemaFile(),
    env.zapVersion()
  )
}, timeout.medium())

afterAll(async () => {
  await httpServer.shutdownHttpServer()
  if (occupier != null) {
    await new Promise((resolve) => occupier.close(resolve))
  }
  await dbApi.closeDatabase(db)
}, timeout.short())

test(
  'Starting on a port another process holds reports it instead of waiting',
  async () => {
    occupier = net.createServer()
    await new Promise((resolve) => occupier.listen(0, resolve))
    let taken = occupier.address().port

    await expect(httpServer.initHttpServer(db, taken)).rejects.toThrow(
      /Another ZAP is already running/
    )
  },
  timeout.medium()
)
