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
const dbEnum = require('../../src-shared/db-enum.js')
const args = require('../util/args.js')
const env = require('../util/env.js')
const zclLoader = require('../zcl/zcl-loader.js')
const windowJs = require('./window.js')
const httpServer = require('../server/http-server.js')
const ipcServer = require('../server/ipc-server.js')
const ipcClient = require('../client/ipc-client.js')
const generatorEngine = require('../generator/generation-engine.js')
const querySession = require('../db/query-session.js')
const util = require('../util/util.js')
const importJs = require('../importexport/import.js')
const exportJs = require('../importexport/export.js')
const uiJs = require('../ui/ui-util.js')

// This file contains various startup modes.

/**
 * Start up application in a normal mode.
 *
 * @param {*} uiEnabled
 * @param {*} showUrl
 * @param {*} uiMode
 * @param {*} zapFiles An array of .zap files to open, can be empty.
 */
async function startNormal(uiEnabled, showUrl, zapFiles, options) {
  return dbApi
    .initDatabaseAndLoadSchema(
      env.sqliteFile(),
      env.schemaFile(),
      env.zapVersion()
    )
    .then((db) => env.resolveMainDatabase(db))
    .then((db) => zclLoader.loadZcl(db, args.zclPropertiesFile))
    .then((ctx) =>
      generatorEngine.loadTemplates(ctx.db, args.genTemplateJsonFile)
    )
    .then((ctx) => {
      if (ctx.error) {
        env.logWarning(ctx.error)
      }
      return ctx
    })
    .then((ctx) => {
      if (!args.noServer)
        return httpServer
          .initHttpServer(ctx.db, args.httpPort, args.studioHttpPort)
          .then(() => {
            ipcServer.initServer()
          })
      else return true
    })
    .then(() => {
      if (uiEnabled) {
        windowJs.initializeElectronUi(httpServer.httpServerPort())
        if (zapFiles.length == 0) {
          return uiJs.openNewConfiguration(
            env.mainDatabase(),
            httpServer.httpServerPort(),
            options
          )
        } else {
          return util.executePromisesSequentially(zapFiles, (f) =>
            uiJs.openFileConfiguration(f, httpServer.httpServerPort())
          )
        }
      } else {
        if (showUrl && !args.noServer) {
          // NOTE: this is parsed/used by Studio as the default landing page.
          console.log(
            `ZAP Server started at: http://localhost:${httpServer.httpServerPort()}`
          )
        }
      }
    })
    .then(() => {
      if (args.noServer && app != null) app.quit()
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Returns the output file out of input file and a pattern
 *
 * @param {*} inputFile
 * @param {*} outputPattern
 * @returns the path to the output file.
 */
function outputFile(inputFile, outputPattern) {
  let output = outputPattern
  if (output.startsWith('{dir}/')) {
    let dir = path.dirname(inputFile)
    output = path.join(dir, output.substring(6))
  } else if (output.includes('{')) {
    let dir = path.dirname(inputFile)
    let name = path.basename(inputFile)
    let basename
    let i = name.indexOf('.')
    if (i == -1) {
      basename = name
    } else {
      basename = name.substring(0, i)
    }
    output = output.replace('{name}', name)
    output = output.replace('{basename}', basename)
    output = path.join(dir, output)
  }
  return output
}

/**
 * Perform file conversion.
 *
 * @param {*} files
 * @param {*} output
 */
async function startConvert(
  files,
  output,
  options = { log: true, quit: true, noZapFileLog: false }
) {
  if (options.log) console.log(`🤖 Conversion started`)
  if (options.log) console.log(`    🔍 input files: ${files}`)
  if (options.log) console.log(`    🔍 output pattern: ${output}`)

  let dbFile = env.sqliteFile('convert')
  let db = await dbApi.initDatabaseAndLoadSchema(
    dbFile,
    env.schemaFile(),
    env.zapVersion()
  )
  if (options.log) console.log('    🐝 database and schema initialized')
  await zclLoader.loadZcl(db, args.zclPropertiesFile)
  if (options.log)
    console.log(`    🐝 zcl package loaded: ${args.zclPropertiesFile}`)
  if (args.genTemplateJsonFile != null) {
    await generatorEngine.loadTemplates(db, args.genTemplateJsonFile)
    if (options.log)
      console.log(`    🐝 templates loaded: ${args.genTemplateJsonFile}`)
  }

  return util
    .executePromisesSequentially(files, (singlePath) =>
      importJs
        .importDataFromFile(db, singlePath)
        .then((importResult) => {
          return util
            .initializeSessionPackage(db, importResult.sessionId)
            .then((pkgs) => importResult.sessionId)
        })
        .then((sessionId) => {
          if (options.log) console.log(`    👈 read in: ${singlePath}`)
          let of = outputFile(singlePath, output)
          let parent = path.dirname(of)
          if (!fs.existsSync(parent)) {
            fs.mkdirSync(parent, { recursive: true })
          }
          // Now we need to write the sessionKey for the file path
          return querySession
            .updateSessionKeyValue(
              db,
              sessionId,
              dbEnum.sessionKey.filePath,
              of
            )
            .then(() =>
              exportJs.exportDataIntoFile(db, sessionId, of, {
                removeLog: options.noZapFileLog,
              })
            )
        })
        .then((outputPath) => {
          if (options.log) console.log(`    👉 write out: ${outputPath}`)
        })
    )
    .then(() => {
      if (options.log) console.log('😎 Conversion done!')
      if (options.quit && app != null) {
        app.quit()
      }
    })
}

/**
 * Perform file analysis.
 *
 * @param {*} paths List of paths to analyze
 * @param {boolean} [options={ log: true, quit: true }]
 */
function startAnalyze(
  paths,
  options = { log: true, quit: true, cleanDb: true }
) {
  let dbFile = env.sqliteFile('analysis')
  if (options.log) console.log(`🤖 Starting analysis: ${paths}`)
  if (options.cleanDb && fs.existsSync(dbFile)) {
    if (options.log) console.log('    👉 remove old database file')
    fs.unlinkSync(dbFile)
  }
  let db
  return dbApi
    .initDatabaseAndLoadSchema(dbFile, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      if (options.log) console.log('    👉 database and schema initialized')
      return zclLoader.loadZcl(db, args.zclPropertiesFile)
    })
    .then((d) => {
      return util.executePromisesSequentially(paths, (singlePath) =>
        importJs
          .importDataFromFile(db, singlePath)
          .then((importResult) =>
            util.sessionReport(db, importResult.sessionId)
          )
          .then((report) => {
            if (options.log) console.log(`🤖 File: ${singlePath}\n`)
            if (options.log) console.log(report)
          })
      )
    })
    .then(() => {
      if (options.log) console.log('😎 Analysis done!')
      if (options.quit && app != null) app.quit()
    })
}

/**
 * Start up applicationa in self-check mode.
 */
function startSelfCheck(options = { log: true, quit: true, cleanDb: true }) {
  env.logInitStdout()
  if (options.log) console.log('🤖 Starting self-check')
  let dbFile = env.sqliteFile('self-check')
  if (options.cleanDb && fs.existsSync(dbFile)) {
    if (options.log) console.log('    👉 remove old database file')
    fs.unlinkSync(dbFile)
  }
  return dbApi
    .initDatabaseAndLoadSchema(dbFile, env.schemaFile(), env.zapVersion())
    .then((db) => env.resolveMainDatabase(db))
    .then((db) => {
      if (options.log) console.log('    👉 database and schema initialized')
      return zclLoader.loadZcl(db, args.zclPropertiesFile)
    })
    .then((ctx) => {
      if (options.log) console.log('    👉 zcl data loaded')
      return generatorEngine.loadTemplates(ctx.db, args.genTemplateJsonFile)
    })
    .then(async (ctx) => {
      if (options.log) {
        if (ctx.error) {
          console.log(`    ⚠️  ${ctx.error}`)
        } else {
          console.log('    👉 generation templates loaded')
        }
      }

      // This is a hack to prevent too quick shutdown that causes core dumps.
      dbApi.closeDatabaseSync(env.mainDatabase())
      env.resolveMainDatabase(null)
      if (options.log) console.log('    👉 database closed')
      await util.waitFor(2000)
      if (options.log) console.log('😎 Self-check done!')
      if (options.quit && app != null) {
        app.quit()
      }
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
async function startGeneration(
  output,
  genTemplateJsonFile,
  zclProperties,
  zapFiles = [],
  options = {
    quit: true,
    cleanDb: true,
    log: true,
  }
) {
  if (options.log)
    console.log(
      `🤖 ZAP generation information: 
    👉 into: ${output}
    👉 using templates: ${genTemplateJsonFile}
    👉 using zcl data: ${zclProperties}`
    )
  let zapFile = null
  if (zapFiles != null && zapFiles.length > 0) {
    zapFile = zapFiles[0]
    if (zapFiles.length > 1 && options.log)
      console.log(`    ⚠️  Multiple files passed. Using only first one.`)
  }
  if (zapFile != null) {
    if (fs.existsSync(zapFile)) {
      let stat = fs.statSync(zapFile)
      if (stat.isDirectory()) {
        if (options.log) console.log(`    👉 using input directory: ${zapFile}`)
        let dirents = fs.readdirSync(zapFile, { withFileTypes: true })
        let usedFile = []
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
  if (options.log)
    console.log(`    👉 zap version: ${env.zapVersionAsString()}`)
  let dbFile = env.sqliteFile('generate')
  if (options.cleanDb && fs.existsSync(dbFile)) fs.unlinkSync(dbFile)
  let mainDb = await dbApi.initDatabaseAndLoadSchema(
    dbFile,
    env.schemaFile(),
    env.zapVersion()
  )
  let ctx = await zclLoader.loadZcl(mainDb, zclProperties)
  ctx = await generatorEngine.loadTemplates(ctx.db, genTemplateJsonFile)
  if (ctx.error) {
    throw ctx.error
  }
  let packageId = ctx.packageId

  let sessionId
  if (zapFile == null) {
    sessionId = await querySession.createBlankSession(mainDb)
  } else {
    let importResult = await importJs.importDataFromFile(mainDb, zapFile)
    sessionId = importResult.sessionId
  }

  await util.initializeSessionPackage(mainDb, sessionId)

  let genResult = await generatorEngine.generateAndWriteFiles(
    mainDb,
    sessionId,
    packageId,
    output,
    {
      logger: options.log ? console.log : (msg) => {},
      backup: false,
      genResultFile: args.genResultFile,
      skipPostGeneration: args.skipPostGeneration,
    }
  )

  if (genResult.hasErrors) throw 'Generation failed.'
  if (options.quit && app != null) app.quit()
}
/**
 * Move database file out of the way into the backup location.
 *
 * @param {*} path
 */
function clearDatabaseFile(dbPath) {
  util.createBackupFile(dbPath)
}

/**
 * Shuts down any servers that might be running.
 */
function shutdown() {
  env.logInfo('Shutting down HTTP and IPC servers...')
  ipcServer.shutdownServerSync()
  httpServer.shutdownHttpServerSync()
}

/**
 * Startup method for the secondary instance.
 *
 * @param {*} argv
 */
function startUpSecondaryInstance(argv) {
  console.log('🧐 Existing instance of zap will service this request.')
  ipcClient.initAndConnectClient().then(() => {
    ipcClient.on(ipcServer.eventType.overAndOut, (data) => {
      env.logInfo('Received overAndOut response from the server.')
      console.log(data)
      app.quit()
    })
  })
  ipcClient.emit(ipcServer.eventType.version)
}

/**
 * Default startup method.
 *
 * @param {*} isElectron
 */
function startUpMainInstance(isElectron, argv) {
  if (argv.logToStdout) {
    env.logInitStdout()
  } else {
    env.logInitLogFile()
  }

  // For now delete the DB file. There is some weird constraint we run into.
  if (argv.clearDb != null) {
    clearDatabaseFile(env.sqliteFile())
  }

  if (argv._.includes('selfCheck')) {
    return startSelfCheck()
  } else if (argv._.includes('analyze')) {
    if (argv.zapFiles.length < 1)
      throw 'You need to specify at least one zap file.'
    return startAnalyze(argv.zapFiles)
  } else if (argv._.includes('convert')) {
    if (argv.zapFiles.length < 1)
      throw 'You need to specify at least one zap file.'
    if (argv.output == null) throw 'You need to specify output file.'
    return startConvert(argv.zapFiles, argv.output, {
      log: true,
      quit: true,
      noZapFileLog: argv.noZapFileLog,
    }).catch((code) => {
      console.log(code)
      process.exit(1)
    })
  } else if (argv._.includes('generate')) {
    return startGeneration(
      argv.output,
      argv.generationTemplate,
      argv.zclProperties,
      argv.zapFiles
    ).catch((code) => {
      console.log(code)
      process.exit(1)
    })
  } else {
    if (isElectron) {
      return startNormal(!argv.noUi, argv.showUrl, argv.zapFiles, {
        uiMode: argv.uiMode,
        embeddedMode: argv.embeddedMode,
      })
    } else {
      return startNormal(false, argv.showUrl, [], {})
    }
  }
}

exports.startGeneration = startGeneration
exports.startNormal = startNormal
exports.startSelfCheck = startSelfCheck
exports.clearDatabaseFile = clearDatabaseFile
exports.startConvert = startConvert
exports.startAnalyze = startAnalyze
exports.startUpMainInstance = startUpMainInstance
exports.startUpSecondaryInstance = startUpSecondaryInstance
exports.shutdown = shutdown
