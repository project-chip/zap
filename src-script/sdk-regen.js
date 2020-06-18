import path from 'path'
import fs from 'fs'
import {
  closeDatabase,
  initDatabase,
  loadSchema,
} from '../src-electron/db/db-api.js'
import {
  schemaFile,
  sqliteTestFile,
  appDirectory,
  setDevelopmentEnv,
} from '../src-electron/util/env.js'
import { runSdkGeneration } from '../src-electron/sdk-gen/sdk-gen.js'
import { loadZcl } from '../src-electron/zcl/zcl-loader.js'
import { zclPropertiesFile } from '../src-electron/main-process/args.js'

setDevelopmentEnv()
var file = sqliteTestFile(42)
var db

initDatabase(file)
  .then((d) => loadSchema(d, schemaFile(), '0.99.0'))
  .then((d) => loadZcl(d, zclPropertiesFile))
  .then((d) => {
    db = d
    return runSdkGeneration({
      db: db,
      generationDir: path.join(appDirectory(), 'sdk-gen'),
      templateDir: '',
      dontWrite: false,
    })
  })
  .then(() => closeDatabase(db))
  .then(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
