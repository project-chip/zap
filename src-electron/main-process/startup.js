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
const windowJs = require('../ui/window.js')
const httpServer = require('../server/http-server.js')
const ipcServer = require('../server/ipc-server.js')
const ipcClient = require('../client/ipc-client.js')
const generatorEngine = require('../generator/generation-engine.js')
const querySession = require('../db/query-session.js')
const util = require('../util/util.js')
const importJs = require('../importexport/import.js')
const exportJs = require('../importexport/export.js')
const uiJs = require('../ui/ui-util.js')
const watchdog = require('./watchdog.js')

// This file contains various startup modes.

let mainDatabase = null

/**
 * Start up application in a normal mode.
 *
 * @param {*} uiEnabled
 * @param {*} showUrl
 * @param {*} uiMode
 * @param {*} zapFiles An array of .zap files to open, can be empty.
 */
async function startNormal(argv, options) {
  let zapFiles = argv.zapFiles
  let showUrl = argv.showUrl
  let uiEnabled = !argv.noUi
  let db = await dbApi.initDatabaseAndLoadSchema(
    env.sqliteFile(),
    env.schemaFile(),
    env.zapVersion()
  )

  watchdog.start(argv.watchdogTimer, () => {
    if (app != null) {
      app.quit()
    } else {
      process.exit(0)
    }
  })
  mainDatabase = db

  return zclLoader
    .loadZcl(db, args.zclPropertiesFile)
    .then((ctx) =>
      generatorEngine.loadTemplates(ctx.db, argv.generationTemplate)
    )
    .then((ctx) => {
      if (ctx.error) {
        env.logWarning(ctx.error)
      }
      return ctx
    })
    .then((ctx) => {
      if (!argv.noServer)
        return httpServer
          .initHttpServer(ctx.db, argv.httpPort, argv.studioHttpPort)
          .then(() => {
            ipcServer.initServer(ctx.db, argv.httpPort)
          })
          .then(() => ctx)
      else return ctx
    })
    .then((ctx) => {
      if (uiEnabled) {
        windowJs.initializeElectronUi(ctx.db, httpServer.httpServerPort())
        if (zapFiles.length == 0) {
          return uiJs.openNewConfiguration(httpServer.httpServerPort(), options)
        } else {
          return util.executePromisesSequentially(zapFiles, (f) =>
            uiJs.openFileConfiguration(f, httpServer.httpServerPort())
          )
        }
      } else {
        if (showUrl && !argv.noServer) {
          // NOTE: this is parsed/used by Studio as the default landing page.
          console.log(
            `ZAP Server started at: http://localhost:${httpServer.httpServerPort()}`
          )
        }
      }
    })
    .then(() => {
      if (argv.noServer && app != null) app.quit()
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
  argv,
  options = {
    quit: true,
    noZapFileLog: false,
    logger: console.log,
  }
) {
  let files = argv.zapFiles
  let output = argv.output
  options.logger(`🤖 Conversion started`)
  options.logger(`    🔍 input files: ${files}`)
  options.logger(`    🔍 output pattern: ${output}`)

  let dbFile = env.sqliteFile('convert')
  let db = await dbApi.initDatabaseAndLoadSchema(
    dbFile,
    env.schemaFile(),
    env.zapVersion()
  )
  options.logger('    🐝 database and schema initialized')
  await zclLoader.loadZcl(db, args.zclPropertiesFile)
  options.logger(`    🐝 zcl package loaded: ${args.zclPropertiesFile}`)
  if (argv.generationTemplate != null) {
    await generatorEngine.loadTemplates(db, argv.generationTemplate)
    options.logger(`    🐝 templates loaded: ${argv.generationTemplate}`)
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
          options.logger(`    👈 read in: ${singlePath}`)
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
          options.logger(`    👉 write out: ${outputPath}`)
        })
    )
    .then(() => {
      options.logger('😎 Conversion done!')
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
async function startAnalyze(
  paths,
  options = {
    quit: true,
    cleanDb: true,
    logger: console.log,
  }
) {
  let dbFile = env.sqliteFile('analysis')
  options.logger(`🤖 Starting analysis: ${paths}`)
  if (options.cleanDb && fs.existsSync(dbFile)) {
    options.logger('    👉 remove old database file')
    fs.unlinkSync(dbFile)
  }
  let db
  return dbApi
    .initDatabaseAndLoadSchema(dbFile, env.schemaFile(), env.zapVersion())
    .then((d) => {
      db = d
      options.logger('    👉 database and schema initialized')
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
            options.logger(`🤖 File: ${singlePath}\n`)
            options.logger(report)
          })
      )
    })
    .then(() => {
      options.logger('😎 Analysis done!')
      if (options.quit && app != null) app.quit()
    })
}

/**
 * Starts zap in a server mode.
 *
 * @param {*} options
 * @returns promise of a startup
 */
async function startServer(argv, options = {}) {
  let db = await dbApi.initDatabaseAndLoadSchema(
    env.sqliteFile(),
    env.schemaFile(),
    env.zapVersion()
  )

  watchdog.start(argv.watchdogTimer, () => {
    if (app != null) {
      app.quit()
    } else {
      process.exit(0)
    }
  })
  mainDatabase = db

  return zclLoader
    .loadZcl(db, args.zclPropertiesFile)
    .then((ctx) =>
      generatorEngine.loadTemplates(ctx.db, argv.generationTemplate)
    )
    .then((ctx) => {
      if (ctx.error) {
        env.logWarning(ctx.error)
      }
      return ctx
    })
    .then((ctx) => {
      return httpServer
        .initHttpServer(ctx.db, argv.httpPort, argv.studioHttpPort)
        .then(() => {
          ipcServer.initServer(ctx.db, argv.httpPort)
        })
        .then(() => ctx)
    })
    .then((ctx) => {
      console.log(
        `ZAP Server started at: http://localhost:${httpServer.httpServerPort()}`
      )
    })
    .catch((err) => {
      env.logError(err)
      throw err
    })
}

/**
 * Start up applicationa in self-check mode.
 */
async function startSelfCheck(
  argv,
  options = {
    quit: true,
    cleanDb: true,
    logger: console.log,
  }
) {
  env.logInitStdout()
  options.logger('🤖 Starting self-check')
  let dbFile = env.sqliteFile('self-check')
  if (options.cleanDb && fs.existsSync(dbFile)) {
    options.logger('    👉 remove old database file')
    fs.unlinkSync(dbFile)
  }
  let mainDb
  return dbApi
    .initDatabaseAndLoadSchema(dbFile, env.schemaFile(), env.zapVersion())
    .then((db) => {
      mainDb = db
      options.logger('    👉 database and schema initialized')
      return zclLoader.loadZcl(db, args.zclPropertiesFile)
    })
    .then((ctx) => {
      options.logger('    👉 zcl data loaded')
      return generatorEngine.loadTemplates(ctx.db, argv.generationTemplate)
    })
    .then(async (ctx) => {
      if (ctx.error) {
        options.logger(`    ⚠️  ${ctx.error}`)
      } else {
        options.logger('    👉 generation templates loaded')
      }

      // This is a hack to prevent too quick shutdown that causes core dumps.
      dbApi.closeDatabaseSync(mainDb)
      options.logger('    👉 database closed')
      await util.waitFor(2000)
      options.logger('😎 Self-check done!')
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
  argv,
  output,
  genTemplateJsonFile,
  zclProperties,
  zapFiles = [],
  options = {
    quit: true,
    cleanDb: true,
    logger: console.log,
  }
) {
  options.logger(
    `🤖 ZAP generation information: 
    👉 into: ${output}
    👉 using templates: ${genTemplateJsonFile}
    👉 using zcl data: ${zclProperties}`
  )
  let zapFile = null
  if (zapFiles != null && zapFiles.length > 0) {
    zapFile = zapFiles[0]
    if (zapFiles.length > 1)
      options.logger(`    ⚠️  Multiple files passed. Using only first one.`)
  }
  if (zapFile != null) {
    if (fs.existsSync(zapFile)) {
      let stat = fs.statSync(zapFile)
      if (stat.isDirectory()) {
        options.logger(`    👉 using input directory: ${zapFile}`)
        let dirents = fs.readdirSync(zapFile, { withFileTypes: true })
        let usedFile = []
        dirents.forEach((element) => {
          if (element.name.endsWith('.zap') || element.name.endsWith('.ZAP')) {
            usedFile.push(path.join(zapFile, element.name))
          }
        })
        if (usedFile.length == 0) {
          options.logger(`    👎 no zap files found in directory: ${zapFile}`)
          throw `👎 no zap files found in directory: ${zapFile}`
        } else if (usedFile.length > 1) {
          options.logger(
            `    👎 multiple zap files found in directory, only one is allowed: ${zapFile}`
          )
          throw `👎 multiple zap files found in directory, only one is allowed: ${zapFile}`
        } else {
          zapFile = usedFile[0]
          options.logger(`    👉 using input file: ${zapFile}`)
        }
      } else {
        options.logger(`    👉 using input file: ${zapFile}`)
      }
    } else {
      options.logger(`    👎 file not found: ${zapFile}`)
      throw `👎 file not found: ${zapFile}`
    }
  } else {
    options.logger(`    👉 using empty configuration`)
  }
  options.logger(`    👉 zap version: ${env.zapVersionAsString()}`)
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
      logger: options.logger,
      backup: false,
      genResultFile: argv.genResultFile,
      skipPostGeneration: argv.skipPostGeneration,
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

  if (mainDatabase != null) {
    // Use a sync call, because you can't have promises in the 'quit' event.
    try {
      dbApi.closeDatabaseSync(mainDatabase)
      env.logInfo('Database closed, shutting down.')
    } catch (err) {
      env.logError('Failed to close database.')
    }
  }
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
      console.log(data)
      app.quit()
    })

    ipcClient.on(ipcServer.eventType.over, (data) => {
      console.log(data)
    })
  })
  if (argv._.includes('status')) {
    ipcClient.emit(ipcServer.eventType.version)
  } else if (argv._.includes('new')) {
    ipcClient.emit(ipcServer.eventType.new)
  } else if (argv._.includes('convert') && argv.zapFiles != null) {
    ipcClient.emit(ipcServer.eventType.convert, {
      output: argv.output,
      files: argv.zapFiles,
    })
  } else if (argv._.includes('generate') && argv.zapFiles != null) {
    ipcClient.emit(ipcServer.eventType.generate, argv.zapFiles)
  } else if (argv.zapFiles != null) {
    ipcClient.emit(ipcServer.eventType.open, argv.zapFiles)
  }
}

/**
 * Default startup method.
 *
 * @param {*} isElectron
 */
async function startUpMainInstance(isElectron, argv) {
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
    return startSelfCheck(argv)
  } else if (argv._.includes('analyze')) {
    if (argv.zapFiles.length < 1)
      throw 'You need to specify at least one zap file.'
    return startAnalyze(argv.zapFiles)
  } else if (argv._.includes('server')) {
    return startServer(argv)
  } else if (argv._.includes('convert')) {
    if (argv.zapFiles.length < 1)
      throw 'You need to specify at least one zap file.'
    if (argv.output == null) throw 'You need to specify output file.'
    return startConvert(argv, {
      logger: console.log,
      quit: true,
      noZapFileLog: argv.noZapFileLog,
    }).catch((code) => {
      console.log(code)
      process.exit(1)
    })
  } else if (argv._.includes('generate')) {
    return startGeneration(
      argv,
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
      return startNormal(argv, {
        uiMode: argv.uiMode,
        embeddedMode: argv.embeddedMode,
      })
    } else {
      return startNormal(argv, false, argv.showUrl, [], {})
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
