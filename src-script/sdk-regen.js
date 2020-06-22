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
 */

const fs = require('fs')
const dbApi = require('../src-electron/db/db-api.js')
const env = require('../src-electron/util/env.js')
const sdkGen = require('../src-electron/sdk-gen/sdk-gen.js')
const zclLoader = require('../src-electron/zcl/zcl-loader.js')
const { zclPropertiesFile } = require('../src-electron/main-process/args.js')

env.setDevelopmentEnv()
var file = env.sqliteTestFile(42)
var db

function usage() {
  console.log(`Usage: node ${process.argv[1]} <DIRECTORY>

  Arguments:
     <DIRECTORY> - specifies the directory where the files are going to be written into. If it does not exist, it gets created.
  `)
}

var targetDir = process.argv[2]
if (targetDir === undefined) {
  console.log('Error: requires a directory argument.')
  usage()
  process.exit(1)
}

console.log(`✍ Generating into ${targetDir}`)
dbApi
  .initDatabase(file)
  .then((d) => dbApi.loadSchema(d, env.schemaFile(), env.zapVersion()))
  .then((d) => zclLoader.loadZcl(d, zclPropertiesFile))
  .then((d) => {
    db = d
    return sdkGen.runSdkGeneration({
      db: db,
      generationDir: targetDir,
      dontWrite: false,
    })
  })
  .then(() => dbApi.closeDatabase(db))
  .then(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file)
  })
