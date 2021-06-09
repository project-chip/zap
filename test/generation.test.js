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

const axios = require('axios')
const dbApi = require('../src-electron/db/db-api.js')
const queryPackage = require('../src-electron/db/query-package.js')
const dbEnum = require('../src-shared/db-enum.js')
const env = require('../src-electron/util/env.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const httpServer = require('../src-electron/server/http-server.js')
const generationEngine = require('../src-electron/generator/generation-engine.js')
const testUtil = require('./test-util.js')
const testQuery = require('./test-query.js')
const util = require('../src-electron/util/util.js')

let db
const { port, baseUrl } = testUtil.testServer(__filename)
let uuid = util.createUuid()

beforeAll(() => {
  env.setDevelopmentEnv()
  let file = env.sqliteTestFile('generation')
  return dbApi
    .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      env.logInfo(`Test database initialized: ${file}.`)
    })
    .catch((err) => env.logError(`Error: ${err}`))
}, testUtil.timeout.medium())

afterAll(() => {
  return httpServer.shutdownHttpServer().then(() => dbApi.closeDatabase(db))
}, testUtil.timeout.medium())

describe('Session specific tests', () => {
  test(
    'make sure there is no session at the beginning',
    () => {
      return testQuery.selectCountFrom(db, 'SESSION').then((cnt) => {
        expect(cnt).toBe(0)
      })
    },
    testUtil.timeout.short()
  )

  test(
    'Now actually load the static data.',
    () => zclLoader.loadZcl(db, env.builtinSilabsZclMetafile),
    testUtil.timeout.medium()
  )

  test(
    'And load the templates.',
    () => {
      let packageId
      return generationEngine
        .loadTemplates(db, testUtil.testTemplate.zigbee)
        .then((context) => {
          packageId = context.packageId
          expect(packageId).not.toBe(null)
          expect(db).not.toBe(null)
        })
        .then(() =>
          queryPackage.selectPackageExtension(
            db,
            packageId,
            dbEnum.packageExtensionEntity.cluster
          )
        )
        .then((extensions) => {
          expect(extensions.length).toBe(2)
          expect(extensions[0].entity).toBe(
            dbEnum.packageExtensionEntity.cluster
          )
          expect(extensions[0].property).toBe('testClusterExtension')
          expect(extensions[0].type).toBe('text')
          expect(extensions[0].configurability).toBe('hidden')
          expect(extensions[0].label).toBe('Test cluster extension')
          expect(extensions[0].globalDefault).toBe(null)
          expect(extensions[0].defaults.length).toBe(3)
          expect(extensions[1].label).toBe(
            'Test cluster extension with external defaults values'
          )
          expect(extensions[1].globalDefault).toBe(null)
          expect(extensions[1].defaults.length).toBe(2)
          expect(extensions[1].defaults[0].value).toBe(
            'Extension value loaded via external default JSON file.'
          )
        })
        .then(() =>
          queryPackage.selectPackageExtension(
            db,
            packageId,
            dbEnum.packageExtensionEntity.command
          )
        )
        .then((extensions) => {
          expect(extensions.length).toBe(2)
          let tcIndex = 1
          let icIndex = 0
          expect(extensions[tcIndex].entity).toBe(
            dbEnum.packageExtensionEntity.command
          )
          expect(extensions[tcIndex].property).toBe('testCommandExtension')
          expect(extensions[tcIndex].type).toBe('boolean')
          expect(extensions[tcIndex].configurability).toBe('hidden')
          expect(extensions[tcIndex].label).toBe('Test command extension')
          expect(extensions[tcIndex].globalDefault).toBe('0')
          expect(extensions[tcIndex].defaults.length).toBe(1)
        })
        .then(() =>
          queryPackage.selectPackageExtension(
            db,
            packageId,
            dbEnum.packageExtensionEntity.attribute
          )
        )
        .then((extensions) => {
          expect(extensions.length).toBe(2)
          expect(extensions[0].entity).toBe(
            dbEnum.packageExtensionEntity.attribute
          )
          expect(extensions[0].property).toBe('testAttributeExtension1')
          expect(extensions[1].property).toBe('testAttributeExtension2')
          expect(extensions[0].type).toBe('integer')
          expect(extensions[0].configurability).toBe('hidden')
          expect(extensions[0].label).toBe('Test attribute extension 1')
          expect(extensions[1].label).toBe('Test attribute extension 2')
          expect(extensions[0].globalDefault).toBe('0')
          expect(extensions[1].globalDefault).toBe('1')
          expect(extensions[0].defaults.length).toBe(2)
          expect(extensions[1].defaults.length).toBe(1)
          expect(extensions[0].defaults[0].value).toBe('42')
          expect(extensions[0].defaults[0].parentCode).toBe(0)
          expect(extensions[0].defaults[0].entityCode).toBe(0)
          expect(extensions[0].defaults[1].entityCode).toBe(1)
        })
    },
    testUtil.timeout.medium()
  )

  test(
    'http server initialization',
    () => {
      return httpServer.initHttpServer(db, port)
    },
    testUtil.timeout.medium()
  )

  let templateCount = 0
  test(
    'test retrieval of all preview template files',
    () => {
      return axios
        .get(`${baseUrl}/preview/?sessionId=${uuid}`)
        .then((response) => {
          templateCount = response.data['length']
          for (let i = 0; i < response.data['length']; i++) {
            expect(response.data[i]['version']).toBeDefined()
          }
        })
    },
    testUtil.timeout.short()
  )

  test(
    'test that zcl extension is loaded and exists',
    () => {
      return axios
        .get(
          `${baseUrl}/zclExtension/cluster/testClusterExtension1?sessionId=${uuid}`
        )
        .then((response) => {
          expect(response.data.entity).toBe('cluster')
          expect(response.data.property).toBe('testClusterExtension1')
          expect(response.data.label).toBe(
            'Test cluster extension with external defaults values'
          )
          expect(response.data.defaults[0].entityCode).toBe('0x0003')
          expect(response.data.defaults[0].value).toBe(
            'Extension value loaded via external default JSON file.'
          )
          expect(response.data.defaults[1].entityCode).toBe(
            'clusterCode mixed with strings'
          )
        })
    },
    testUtil.timeout.medium()
  )

  test(
    'Load a second set of templates.',
    () => generationEngine.loadTemplates(db, testUtil.testTemplate.chip),
    testUtil.timeout.medium()
  )

  // Make sure all templates are loaded
  test(
    'Make sure second set of templates are loaded.',
    () =>
      queryPackage
        .getPackagesByType(db, dbEnum.packageType.genSingleTemplate)
        .then((pkgs) => {
          expect(templateCount).toBeLessThan(pkgs.length)
        }),
    testUtil.timeout.medium()
  )

  test(
    'test retrieval of all preview template files make sure they are session aware',
    () => {
      return axios
        .get(`${baseUrl}/preview/?sessionId=${uuid}`)
        .then((response) => {
          expect(templateCount).toEqual(response.data['length'])
        })
    },
    testUtil.timeout.short()
  )

  test(
    'test that there is generation data in the simple-test.out preview file. Index 1',
    () => {
      return axios
        .get(`${baseUrl}/preview/simple-test.out/1?sessionId=${uuid}`)
        .then((response) => {
          expect(response.data['result']).toMatch('Test template file.')
        })
    },
    testUtil.timeout.short()
  )

  test(
    'No generation test, incorrect file name',
    () => {
      return axios
        .get(`${baseUrl}/preview/no-file?sessionId=${uuid}`)
        .then((response) => {
          expect(response.data['result']).toBeUndefined()
        })
    },
    testUtil.timeout.short()
  )

  test(
    'No generation test, incorrect file name and incorrect index',
    () => {
      return axios
        .get(`${baseUrl}/preview/no-file/1?sessionId=${uuid}`)
        .then((response) => {
          expect(response.data['result']).toBeUndefined()
        })
    },
    testUtil.timeout.short()
  )
})
