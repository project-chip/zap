/**
 *
 *    Copyright (c) 2024 Silicon Labs
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
const genEngine = require('../src-electron/generator/generation-engine')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const queryPackage = require('../src-electron/db/query-package')
const queryZcl = require('../src-electron/db/query-zcl')
const queryAccess = require('../src-electron/db/query-access')

let db
let zclContext

beforeAll(async () => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('newmatter')
  db = await dbApi.initDatabaseAndLoadSchema(
    file,
    env.schemaFile(),
    env.zapVersion(),
  )
}, testUtil.timeout.medium())

afterAll(() => dbApi.closeDatabase(db), testUtil.timeout.short())

test(
  'New Matter - zcl loading',
  async () => {
    zclContext = await zclLoader.loadZcl(db, env.builtinNewMatterZclMetafile())

    if (zclContext.newFileErrors.length > 0) {
      console.log('Unit test report from loading new Matter XML files:')
      for (let nfe of zclContext.newFileErrors) {
        console.log(`${nfe.file} => ${nfe.error}`)
      }
      console.log('Note the unit test does not fail because of this.')
    }

    const attributes = await queryZcl.selectAllAttributes(db, [
      zclContext.packageId,
    ])
    expect(attributes.length).toBeGreaterThanOrEqual(4)
  },
  testUtil.timeout.medium(),
)
