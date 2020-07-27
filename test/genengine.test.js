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

const genEngine = require('../src-electron/generator/generation-engine.js')
const args = require('../src-electron/main-process/args.js')
const env = require('../src-electron/util/env.js')
const dbApi = require('../src-electron/db/db-api.js')
const fs = require('fs')
const queryPackage = require('../src-electron/db/query-package.js')

var db

beforeAll(() => {
  var file = env.sqliteTestFile(54)
  return dbApi
    .initDatabase(file)
    .then((d) => dbApi.loadSchema(d, env.schemaFile(), env.zapVersion()))
    .then((d) => {
      db = d
      env.logInfo('DB initialized.')
    })
}, 5000)

afterAll(() => {
  var file = env.sqliteTestFile(54)
  return dbApi.closeDatabase(db).then(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
})

test('Basic gen template parsing', () =>
  genEngine
    .loadGenTemplate({ path: args.genTemplateJsonFile, db: db })
    .then((context) => {
      expect(context.crc).not.toBeNull()
      expect(context.templateData).not.toBeNull()
      expect(context.templateData.name).toEqual('Test templates')
      expect(context.templateData.version).toEqual('1.0')
      expect(context.templateData.templates.length).toBeGreaterThan(1)
      return context
    })
    .then((context) => genEngine.recordTemplatesPackage(context))
    .then((context) => {
      expect(context.packageId).not.toBeNull()
      return context
    })
    .then((context) =>
      queryPackage.getPackageByParent(context.db, context.packageId)
    )
    .then((packages) => {
      expect(packages.length).toBe(10)
    }))
