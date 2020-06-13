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

import path from 'path'
import fs from 'fs'
import { version } from '../package.json'
import {
  closeDatabase,
  initDatabase,
  loadSchema,
} from '../src-electron/db/db-api'
import {
  logInfo,
  schemaFile,
  sqliteTestFile,
  appDirectory,
  setDevelopmentEnv,
} from '../src-electron/util/env'
import { runSdkGeneration } from '../src-electron/sdk-gen/sdk-gen'
import { loadZcl } from '../src-electron/zcl/zcl-loader'
import { zclPropertiesFile } from '../src-electron/main-process/args'
import { selectAllClusters } from '../src-electron/db/query-zcl'

describe('SDK gen tests', () => {
  var db
  beforeAll(() => {
    setDevelopmentEnv()
    var file = sqliteTestFile(4)

    return initDatabase(file)
      .then((d) => loadSchema(d, schemaFile(), version))
      .then((d) => loadZcl(d, zclPropertiesFile))
      .then((d) => {
        db = d
        logInfo('DB initialized.')
      })
  }, 5000)

  afterAll(() => {
    var file = sqliteTestFile(4)
    return closeDatabase(db).then(() => {
      if (fs.existsSync(file)) fs.unlinkSync(file)
    })
  })

  test('Cluster data existence', () => {
    return selectAllClusters(db).then((data) => {
      expect(data.length).toBeGreaterThan(10)
    })
  })

  test('SDK generation', () => {
    return runSdkGeneration({
      db: db,
      generationDir: path.join(appDirectory(), 'sdk-gen'),
      templateDir: '',
      dontWrite: false,
    })
  }, 5000)
})
