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

/*
 * Created Date: Friday, March 13th 2020, 7:44:12 pm
 * Author: Timotej Ecimovic
 *
 * Copyright (c) 2020 Silicon Labs
 */

var db
var sid

beforeAll(() => {
  var file = sqliteTestFile(4)
  return initDatabase(file)
    .then((d) => loadSchema(d, schemaFile(), version))
    .then((d) => loadZcl(d, zclPropertiesFile))
    .then((d) => {
      db = d
      logInfo('DB initialized.')
    })
})

afterAll(() => {
  var file = sqliteTestFile(4)
  return closeDatabase(db).then(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
})

test('SDK generation', () => {
  return runSdkGeneration({
    db: db,
    generationDir: path.join(appDirectory(), 'sdk-gen'),
    templateDir: '',
    dontWrite: true,
  })
})
