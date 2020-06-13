/**
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
} from '../src-electron/util/env'
import { runSdkGeneration } from '../src-electron/sdk-gen/sdk-gen'
import { loadZcl } from '../src-electron/zcl/zcl-loader'
import { zclPropertiesFile } from '../src-electron/main-process/args'
import { selectAllClusters } from '../src-electron/db/query-zcl'

describe('SDK gen tests', () => {
  var db
  beforeAll(() =>
    initDatabase(sqliteTestFile(4))
      .then((d) => loadSchema(d, schemaFile(), version))
      .then((d) => loadZcl(d, zclPropertiesFile))
      .then((d) => {
        db = d
        logInfo('DB initialized.')
      })
  )

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
