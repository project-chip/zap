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

const { app } = require('electron')
const fs = require('fs')
const path = require('path')

const dbApi = require('../db/db-api.js')
const sdkGen = require('../sdk-gen/sdk-gen.js')
const args = require('../util/args.js')
const env = require('../util/env.js')
const zclLoader = require('../zcl/zcl-loader.js')
const windowJs = require('./window.js')
const httpServer = require('../server/http-server.js')
const generatorEngine = require('../generator/generation-engine.js')
const querySession = require('../db/query-session.js')
const util = require('../util/util.js')
const importJs = require('../importexport/import.js')

// This file contains various startup modes.

/**
 * Start up application in a normal mode.
 *
 * @param {*} uiEnabled
 * @param {*} showUrl
 * @param {*} uiMode
 */
function startNormal(uiEnabled, showUrl, uiMode) {
  dbApi
    .initDatabase(env.sqliteFile())
    .then((db) => env.resolveMainDatabase(db))
    .then((db) => dbApi.loadSchema(db, env.schemaFile(), env.zapVersion()))
    .then((db) => zclLoader.loadZcl(db, args.zclPropertiesFile))
    .then((ctx) =>
      generatorEngine.loadTemplates(ctx.db, args.genTemplateJsonFile)
    )
    .then((ctx) => {
      if (!args.noServer)
        return httpServer.initHttpServer(
          ctx.db,
          args.httpPort,
          args.studioHttpPort
        )
      else return true
    })
    .then(() => {
      if (uiEnabled) {
        windowJs.initializeElectronUi(httpServer.httpServerPort(), {
          uiMode: uiMode,
        })
      } else {
        if (app.dock) {
          app.dock.hide()
        }
        if (showUrl && !args.noServer) {
          // NOTE: this is parsed/used by Studio as the default landing page.
          console.log(
            `url: http://localhost:${httpServer.httpServerPort()}/index.html`
          )
        }
      }
    })
    .then(() => {
      if (args.noServer) app.quit()
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Start up application in self-check mode.
 */
function startSelfCheck(options = { log: true, quit: true, cleanDb: true }) {
  env.logInitStdout()
  if (options.log) console.log('🤖 Starting self-check')
  var dbFile = env.sqliteFile('self-check')
  if (options.cleanDb && fs.existsSync(dbFile)) {
    if (options.log) console.log('    👉 remove old database file')
    fs.unlinkSync(dbFile)
  }
  return dbApi
    .initDatabase(dbFile)
    .then((db) => {
      if (options.log) console.log('    👉 new database initialized')
      return db
    })
    .then((db) => dbApi.loadSchema(db, env.schemaFile(), env.zapVersion()))
    .then((db) => {
      if (options.log) console.log('    👉 schema initialized')
      return zclLoader.loadZcl(db, args.zclPropertiesFile)
    })
    .then((ctx) => {
      if (options.log) console.log('    👉 zcl data loaded')
      return generatorEngine.loadTemplates(ctx.db, args.genTemplateJsonFile)
    })
    .then((ctx) => {
      if (options.log) console.log('    👉 generation templates loaded')
      if (options.log) console.log('😎 Self-check done!')
      if (options.quit) app.quit()
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Performs headless regeneration for given parameters.
 *
 * @param {*} output Directory where to write files.
 * @param {*} genTemplateJsonFile gen-teplate.json file to use for template loading.
 * @param {*} zclProperties zcl.properties file to use for ZCL properties.
 * @param {*} [zapFile=null] .zap file that contains application stater, or null if generating from clean state.
 * @returns Nothing, triggers app.quit()
 */
function startGeneration(
  output,
  genTemplateJsonFile,
  zclProperties,
  zapFile = null,
  options = {
    quit: true,
    cleanDb: true,
    log: true,
  }
) {
  if (options.log)
    console.log(
      `🤖 Generation information: 
    👉 into: ${output}
    👉 using templates: ${genTemplateJsonFile}
    👉 using zcl data: ${zclProperties}`
    )
  if (zapFile != null) {
    if (fs.existsSync(zapFile)) {
      var stat = fs.statSync(zapFile)
      if (stat.isDirectory()) {
        if (options.log) console.log(`    👉 using input directory: ${zapFile}`)
        var dirents = fs.readdirSync(zapFile, { withFileTypes: true })
        var usedFile = []
        dirents.forEach((element) => {
          if (element.name.endsWith('.zap') || element.name.endsWith('.ZAP')) {
            usedFile.push(path.join(zapFile, element.name))
          }
        })
        if (usedFile.length == 0) {
          if (options.log)
            console.log(`    👎 no zap files found in directory: ${zapFile}`)
          throw `👎 no zap files found in directory: ${zapFile}`
        } else if (usedFile.length > 1) {
          if (options.log)
            console.log(
              `    👎 multiple zap files found in directory, only one is allowed: ${zapFile}`
            )
          throw `👎 multiple zap files found in directory, only one is allowed: ${zapFile}`
        } else {
          zapFile = usedFile[0]
          if (options.log) console.log(`    👉 using input file: ${zapFile}`)
        }
      } else {
        if (options.log) console.log(`    👉 using input file: ${zapFile}`)
      }
    } else {
      if (options.log) console.log(`    👎 file not found: ${zapFile}`)
      throw `👎 file not found: ${zapFile}`
    }
  } else {
    if (options.log) console.log(`    👉 using empty configuration`)
  }
  var dbFile = env.sqliteFile('generate')
  if (options.cleanDb && fs.existsSync(dbFile)) fs.unlinkSync(dbFile)
  var packageId
  var mainDb
  return dbApi
    .initDatabase(dbFile)
    .then((db) => {
      mainDb = db
      return db
    })
    .then((db) => dbApi.loadSchema(db, env.schemaFile(), env.zapVersion()))
    .then((db) => zclLoader.loadZcl(db, zclProperties))
    .then((ctx) => generatorEngine.loadTemplates(ctx.db, genTemplateJsonFile))
    .then((ctx) => {
      packageId = ctx.packageId
      if (zapFile == null) {
        return querySession.createBlankSession(mainDb)
      } else {
        // we load the zap file.
        return importJs.importDataFromFile(mainDb, zapFile)
      }
    })
    .then((sessionId) => util.initializeSessionPackage(mainDb, sessionId))
    .then((sessionId) =>
      generatorEngine.generateAndWriteFiles(
        mainDb,
        sessionId,
        packageId,
        output,
        options.log
      )
    )
    .then(() => {
      if (options.quit) app.quit()
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Performs the headless SDK regen process.
 * (Deprecated. At this point, we're not really doing SDK regen.)
 *
 * @param {*} generationDir
 * @param {*} handlebarTemplateDir
 * @param {*} zclPropertiesFilePath
 * @returns Nothing, triggers the app.quit()
 */
function startSdkGeneration(
  generationDir,
  zclPropertiesFilePath,
  options = {
    quit: true,
    cleanDb: true,
  }
) {
  env.logInfo('Start SDK generation...')
  var dbFile = env.sqliteFile('sdk-regen')
  if (options.cleanDb && fs.existsSync(dbFile)) fs.unlinkSync(dbFile)
  return dbApi
    .initDatabase(dbFile)
    .then((db) => dbApi.loadSchema(db, env.schemaFile(), env.zapVersion()))
    .then((db) =>
      zclLoader.loadZcl(
        db,
        zclPropertiesFilePath ? zclPropertiesFilePath : args.zclPropertiesFile
      )
    )
    .then((ctx) =>
      sdkGen.runSdkGeneration({
        db: ctx.db,
        generationDir: generationDir,
      })
    )
    .then((res) => {
      if (options.quit) app.quit()
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Moves the main database file into a backup location.
 */
function clearDatabaseFile() {
  var path = env.sqliteFile()
  var pathBak = path + '~'
  if (fs.existsSync(path)) {
    if (fs.existsSync(pathBak)) {
      env.logWarning(`Deleting old backup file: ${pathBak}`)
      fs.unlinkSync(pathBak)
    }
    env.logWarning(
      `Database restart requested, moving file: ${path} to ${pathBak}`
    )
    fs.renameSync(path, pathBak)
  }
}

exports.startGeneration = startGeneration
exports.startNormal = startNormal
exports.startSdkGeneration = startSdkGeneration
exports.startSelfCheck = startSelfCheck
exports.clearDatabaseFile = clearDatabaseFile
