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
const _ = require('lodash')

const dbApi = require('../db/db-api.js')
const dbEnum = require('../../src-shared/db-enum.js')
const env = require('../util/env')
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
const watchdog = require('./watchdog')

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
async function startNormal(
  argv,
  options = {
    quit: true,
    logger: console.log,
  }
) {
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
    .loadZcl(db, argv.zclProperties)
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
          .initHttpServer(ctx.db, argv.httpPort, argv.studioHttpPort, {
            zcl: argv.zclProperties,
            template: argv.generationTemplate,
            allowCors: argv.allowCors,
          })
          .then(() => {
            ipcServer.initServer(ctx.db, argv.httpPort)
          })
          .then(() => ctx)
      else return ctx
    })
    .then((ctx) => {
      let port = httpServer.httpServerPort()

      if (process.env.DEV && process.env.MODE === 'electron') {
        port = 8080
      }

      if (uiEnabled) {
        windowJs.initializeElectronUi(port)
        if (zapFiles.length == 0) {
          return uiJs.openNewConfiguration(port, {
            uiMode: argv.uiMode,
            embeddedMode: argv.embeddedMode,
          })
        } else {
          return util.executePromisesSequentially(zapFiles, (f) =>
            uiJs.openFileConfiguration(f, port)
          )
        }
      } else {
        if (showUrl && !argv.noServer) {
          // NOTE: this is parsed/used by Studio as the default landing page.
          logRemoteData(httpServer.httpServerStartupMessage())
        }
      }
    })
    .then(() => {
      if (argv.noServer && app != null && options.quit) app.quit()
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
function outputFile(inputFile, outputPattern, index = 0) {
  let output = outputPattern
  let hadDir = false

  if (output.startsWith('{dir}/')) {
    let dir = path.dirname(inputFile)
    output = path.join(dir, output.substring(6))
    hadDir = true
  }

  if (output.includes('{')) {
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
    output = output.replace('{index}', index)
    if (!hadDir) {
      if (!output.startsWith('/')) output = path.join(dir, output)
    }
  }
  return output
}

const BLANK_SESSION = '-- blank session --'
/**
 * This method gathers all the files to process.
 *
 * @param {*} filesArg array of files arguments
 * @param {*} options
 */
function gatherFiles(filesArg, options = { suffix: '.zap', doBlank: true }) {
  let list = []
  if (filesArg == null || filesArg.length == 0) {
    if (options.doBlank) list.push(BLANK_SESSION)
  } else {
    filesArg.forEach((f) => {
      let stat = fs.statSync(f)
      if (stat.isDirectory()) {
        let dirents = fs.readdirSync(f, { withFileTypes: true })
        dirents.forEach((element) => {
          if (
            element.name.endsWith(options.suffix.toLowerCase()) ||
            element.name.endsWith(options.suffix.toUpperCase())
          ) {
            list.push(path.join(f, element.name))
          }
        })
      } else {
        list.push(f)
      }
    })
  }
  return list
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
    logger: console.log,
  }
) {
  let files = argv.zapFiles
  let output = argv.output
  options.logger(`🤖 Conversion started
    🔍 input files: ${files}
    🔍 output pattern: ${output}`)

  let dbFile = env.sqliteFile('convert')
  let db = await dbApi.initDatabaseAndLoadSchema(
    dbFile,
    env.schemaFile(),
    env.zapVersion()
  )
  options.logger('    🐝 database and schema initialized')
  await zclLoader.loadZcl(db, argv.zclProperties)
  options.logger(`    🐝 zcl package loaded: ${argv.zclProperties}`)
  if (argv.generationTemplate != null) {
    await generatorEngine.loadTemplates(db, argv.generationTemplate)
    options.logger(`    🐝 templates loaded: ${argv.generationTemplate}`)
  }

  return util
    .executePromisesSequentially(files, (singlePath, index) =>
      importJs
        .importDataFromFile(db, singlePath, {
          defaultZclMetafile: argv.zclProperties,
          postImportScript: argv.postImportScript,
        })
        .then((importResult) => {
          return util
            .initializeSessionPackage(db, importResult.sessionId, {
              zcl: argv.zclProperties,
              template: argv.generationTemplate,
            })
            .then((pkgs) => importResult.sessionId)
        })
        .then((sessionId) => {
          options.logger(`    👈 read in: ${singlePath}`)
          let of = outputFile(singlePath, output, index)
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
                removeLog: argv.noZapFileLog,
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
  argv,
  options = {
    quit: true,
    cleanDb: true,
    logger: console.log,
  }
) {
  let paths = argv.zapFiles
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
      return zclLoader.loadZcl(db, argv.zclProperties)
    })
    .then((d) => {
      return util.executePromisesSequentially(paths, (singlePath) =>
        importJs
          .importDataFromFile(db, singlePath, {
            defaultZclMetafile: argv.zclProperties,
            postImportScript: argv.postImportScript,
          })
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
    .loadZcl(db, argv.zclProperties)
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
        .initHttpServer(ctx.db, argv.httpPort, argv.studioHttpPort, {
          zcl: argv.zclProperties,
          template: argv.generationTemplate,
          allowCors: argv.allowCors,
        })
        .then(() => {
          ipcServer.initServer(ctx.db, argv.httpPort)
        })
        .then(() => ctx)
    })
    .then((ctx) => {
      logRemoteData(httpServer.httpServerStartupMessage())
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
      return zclLoader.loadZcl(db, argv.zclProperties)
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

async function generateSingleFile(
  db,
  f,
  templatePackageId,
  outputPattern,
  index,
  options = {
    logger: console.log,
    zcl: env.builtinSilabsZclMetafile(),
    template: env.builtinTemplateMetafile(),
    postImportScript: null,
  }
) {
  let hrstart = process.hrtime.bigint()
  let sessionId
  let output
  if (f === BLANK_SESSION) {
    options.logger(`👉 using empty configuration`)
    sessionId = await querySession.createBlankSession(db)
    output = outputPattern
  } else {
    options.logger(`👉 using input file: ${f}`)
    let importResult = await importJs.importDataFromFile(db, f, {
      defaultZclMetafile: options.zcl,
      postImportScript: options.postImportScript,
    })
    sessionId = importResult.sessionId
    output = outputFile(f, outputPattern, index)
  }
  options.logger(`👉 using output destination: ${output}`)

  await util.initializeSessionPackage(db, sessionId, options)

  let nsDuration = process.hrtime.bigint() - hrstart
  options.logger(`🕐 File loading time: ${util.duration(nsDuration)}`)

  options.fileLoadTime = nsDuration
  let genResult = await generatorEngine.generateAndWriteFiles(
    db,
    sessionId,
    templatePackageId,
    output,
    options
  )

  if (genResult.hasErrors) throw new Error(`Generation failed: ${f}`)

  return genResult
}

/**
 * Performs headless regeneration for given parameters.
 *
 * @returns Nothing, triggers app.quit()
 */
async function startGeneration(
  argv,
  options = {
    quit: true,
    cleanDb: true,
    logger: console.log,
  }
) {
  let templateMetafile = argv.generationTemplate
  let zapFiles = argv.zapFiles
  let output = argv.output
  let zclProperties = argv.zclProperties
  let genResultFile = argv.genResultFile
  let skipPostGeneration = argv.skipPostGeneration

  let hrstart = process.hrtime.bigint()
  options.logger(
    `🤖 ZAP generation started: 
    🔍 input files: ${zapFiles}
    🔍 output pattern: ${output}
    🔍 using templates: ${templateMetafile}
    🔍 using zcl data: ${zclProperties}
    🔍 zap version: ${env.zapVersionAsString()}`
  )

  let dbFile = env.sqliteFile('generate')
  if (options.cleanDb && fs.existsSync(dbFile)) fs.unlinkSync(dbFile)
  let mainDb = await dbApi.initDatabaseAndLoadSchema(
    dbFile,
    env.schemaFile(),
    env.zapVersion()
  )

  let ctx = await zclLoader.loadZcl(mainDb, zclProperties)
  ctx = await generatorEngine.loadTemplates(ctx.db, templateMetafile)
  if (ctx.error) {
    throw ctx.error
  }

  let files = gatherFiles(zapFiles, { suffix: '.zap', doBlank: true })
  if (files.length == 0) {
    options.logger(`    👎 no zap files found in: ${zapFiles}`)
    throw `👎 no zap files found in: ${zapFiles}`
  }

  options.zcl = zclProperties
  options.template = templateMetafile
  options.backup = false
  options.genResultFile = genResultFile
  options.skipPostGeneration = skipPostGeneration
  options.postImportScript = argv.postImportScript

  let nsDuration = process.hrtime.bigint() - hrstart
  options.logger(`🕐 Setup time: ${util.duration(nsDuration)} `)

  await util.executePromisesSequentially(files, (f, index) =>
    generateSingleFile(mainDb, f, ctx.packageId, output, index, options)
  )

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
      mainDatabase = null
      env.logInfo('Database closed, shutting down.')
    } catch (err) {
      env.logError('Failed to close database.')
    }
  }
}

function logRemoteData(data) {
  if (data != null) {
    if (_.isString(data)) {
      console.log(data)
    } else {
      console.log('-- JSON START --')
      console.log(JSON.stringify(data))
      console.log('-- JSON END --')
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
      logRemoteData(data)
      app.quit()
    })

    ipcClient.on(ipcServer.eventType.over, (data) => {
      logRemoteData(data)
    })
  })
  if (argv._.includes('status') || argv._.includes('server')) {
    ipcClient.emit(ipcServer.eventType.serverStatus)
  } else if (argv._.includes('new')) {
    ipcClient.emit(ipcServer.eventType.new)
  } else if (argv._.includes('convert') && argv.zapFiles != null) {
    ipcClient.emit(ipcServer.eventType.convert, {
      output: argv.output,
      files: argv.zapFiles,
    })
  } else if (argv._.includes('stop')) {
    ipcClient.emit(ipcServer.eventType.stop)
  } else if (argv._.includes('generate') && argv.zapFiles != null) {
    let data = {
      zapFileArray: argv.zapFiles,
      outputPattern: argv.output,
      zcl: argv.zclProperties,
      template: argv.generationTemplate,
    }
    ipcClient.emit(ipcServer.eventType.generate, data)
  } else if (argv.zapFiles != null) {
    ipcClient.emit(ipcServer.eventType.open, argv.zapFiles)
  }
}

function quit() {
  // Empty function by default. Startup sequence is supposed
  // to declare this depending on whether this is node or electron.
}

/**
 * Default startup method.
 *
 * @param {*} isElectron
 */
async function startUpMainInstance(isElectron, argv) {
  if (isElectron) {
    exports.quit = () => {
      app.quit()
    }
  } else {
    exports.quit = () => {
      process.exit(0)
    }
  }

  if (argv.logToStdout) {
    env.logInitStdout()
  } else {
    env.logInitLogFile()
  }

  // For now delete the DB file. There is some weird constraint we run into.
  if (argv.clearDb != null) {
    clearDatabaseFile(env.sqliteFile())
  }

  if (argv._.includes('status')) {
    console.log('⛔ Server is not running.')
    logRemoteData({ zapServerStatus: 'missing' })
    process.exit(0)
  } else if (argv._.includes('selfCheck')) {
    return startSelfCheck(argv)
  } else if (argv._.includes('analyze')) {
    if (argv.zapFiles.length < 1)
      throw 'You need to specify at least one zap file.'
    return startAnalyze(argv)
  } else if (argv._.includes('server')) {
    return startServer(argv)
  } else if (argv._.includes('convert')) {
    if (argv.zapFiles.length < 1)
      throw 'You need to specify at least one zap file.'
    if (argv.output == null) throw 'You need to specify output file.'
    return startConvert(argv, {
      logger: console.log,
      quit: true,
    }).catch((code) => {
      console.log(code)
      process.exit(1)
    })
  } else if (argv._.includes('stop')) {
    console.log('No server running, nothing to stop.')
    process.exit(0)
  } else if (argv._.includes('generate')) {
    return startGeneration(argv).catch((code) => {
      console.log(code)
      process.exit(1)
    })
  } else {
    // If we run with node only, we force no UI as it won't work.
    if (!isElectron) argv.noUi = true
    return startNormal(argv, {})
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
exports.quit = quit
exports.generateSingleFile = generateSingleFile
