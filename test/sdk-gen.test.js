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

const dbApi = require('../src-electron/db/db-api.js')
const { selectAllClusters } = require('../src-electron/db/query-zcl.js')
const { runSdkGeneration } = require('../src-electron/sdk-gen/sdk-gen.js')
const { loadZcl } = require('../src-electron/zcl/zcl-loader.js')

const path = require('path')
const fs = require('fs')

import { version } from '../package.json'
import {
  logInfo,
  schemaFile,
  sqliteTestFile,
  appDirectory,
  setDevelopmentEnv,
} from '../src-electron/util/env'
import { zclPropertiesFile } from '../src-electron/main-process/args'

describe('SDK gen tests', () => {
  var db
  beforeAll(() => {
    setDevelopmentEnv()
    var file = sqliteTestFile(4)

    return dbApi
      .initDatabase(file)
      .then((d) => dbApi.loadSchema(d, schemaFile(), version))
      .then((d) => loadZcl(d, zclPropertiesFile))
      .then((d) => {
        db = d
        logInfo('DB initialized.')
      })
  }, 5000)

  afterAll(() => {
    var file = sqliteTestFile(4)
    return dbApi.closeDatabase(db).then(() => {
      if (fs.existsSync(file)) fs.unlinkSync(file)
    })
  })

  test('Cluster data existence', () => {
    return selectAllClusters(db).then((data) => {
      expect(data.length).toBeGreaterThan(10)
    })
  })

  test('SDK generation', () => {
    var dir = path.join(appDirectory(), 'sdk-gen')
    return runSdkGeneration({
      db: db,
      generationDir: dir,
      templateDir: '',
      dontWrite: true,
    })
  }, 5000)
})
