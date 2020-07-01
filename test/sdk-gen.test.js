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

const path = require('path')
const fs = require('fs')

const dbApi = require('../src-electron/db/db-api.js')
const queryZcl = require('../src-electron/db/query-zcl.js')
const sdkGen = require('../src-electron/sdk-gen/sdk-gen.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const env = require('../src-electron/util/env.js')
const args = require('../src-electron/main-process/args.js')

describe('SDK gen tests', () => {
  var db
  beforeAll(() => {
    env.setDevelopmentEnv()
    var file = env.sqliteTestFile(4)

    return dbApi
      .initDatabase(file)
      .then((d) => dbApi.loadSchema(d, env.schemaFile(), env.zapVersion()))
      .then((d) => zclLoader.loadZcl(d, args.zclPropertiesFile))
      .then((ctx) => {
        db = ctx.db
        env.logInfo('DB initialized.')
      })
  }, 5000)

  afterAll(() => {
    var file = env.sqliteTestFile(4)
    return dbApi.closeDatabase(db).then(() => {
      if (fs.existsSync(file)) fs.unlinkSync(file)
    })
  })

  test('Cluster data existence', () => {
    return queryZcl.selectAllClusters(db).then((data) => {
      expect(data.length).toBeGreaterThan(10)
    })
  })

  test('SDK generation', () => {
    var dir = path.join(env.appDirectory(), 'sdk-gen')
    return sdkGen.runSdkGeneration(
      {
        db: db,
        generationDir: dir,
        templateDir: '',
        dontWrite: true,
      },
      {
        generateCommands: true,
        generateAttributes: true,
      }
    )
  }, 5000)
})
