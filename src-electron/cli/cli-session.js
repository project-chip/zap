/**
 *
 *    Copyright (c) 2024 Silicon Labs
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

/**
 * Load / mutate / save lifecycle for the `zap` command line. This is the
 * headless counterpart of what the HTTP server does for the GUI: it puts a
 * .zap file into a session in the database, hands that session to the
 * operations, and writes the result back out.
 *
 * @module CLI API: session lifecycle
 */

const fs = require('fs')
const path = require('path')

const dbApi = require('../db/db-api.js')
const dbEnum = require('../../src-shared/db-enum.js')
const env = require('../util/env.js')
const util = require('../util/util.js')
const sessionContent = require('../util/session-content.js')
const zclLoader = require('../zcl/zcl-loader.js')
const generatorEngine = require('../generator/generation-engine.js')
const importJs = require('../importexport/import.js')
const exportJs = require('../importexport/export.js')
const querySession = require('../db/query-session.js')
const studio = require('../ide-integration/studio-rest-api.js')
const cliError = require('./cli-error.js')

const CliError = cliError.CliError

/** @type {*} reused under Jest to avoid reloading ZCL metadata every runCli */
let testDatabaseCache = null
/** @type {string|null} */
let testDatabaseCacheKey = null

/**
 * @returns {boolean}
 */
function useTestDatabaseCache() {
  return process.env.TEST === 'true'
}

/**
 * @param {*} argv
 * @returns {string}
 */
function testDatabaseCacheKeyFor(argv) {
  let zcl = argv.zclProperties
  let gen = argv.generationTemplate
  let zclKey = Array.isArray(zcl) ? zcl.join('\0') : String(zcl)
  let genKey =
    gen == null ? '' : Array.isArray(gen) ? gen.join('\0') : String(gen)
  return `${zclKey}\0${genKey}`
}

/**
 * @param {*} db
 * @param {*} argv
 * @param {Function} logger
 */
async function loadPackagesIntoDatabase(db, argv, logger) {
  await zclLoader.loadZclMetafiles(db, argv.zclProperties, {
    failOnLoadingError: !argv.noLoadingFailure
  })
  logger(
    env.formatEmojiMessage('🔧', `zcl package loaded: ${argv.zclProperties}`)
  )
  if (argv.generationTemplate != null) {
    let ctx = await generatorEngine.loadTemplates(db, argv.generationTemplate, {
      failOnLoadingError: !argv.noLoadingFailure
    })
    if (ctx.error && !argv.noLoadingFailure) {
      throw new Error(ctx.error)
    }
  }
}

/**
 * @param {*} argv
 * @param {Function} logger
 * @returns {Promise<*>}
 */
async function openDatabase(argv, logger) {
  if (!useTestDatabaseCache()) {
    let db = await dbApi.initDatabaseAndLoadSchema(
      env.sqliteFile('cli'),
      env.schemaFile(),
      env.zapVersion()
    )
    logger(env.formatEmojiMessage('🐝', 'database and schema initialized'))
    await loadPackagesIntoDatabase(db, argv, logger)
    return db
  }

  let key = testDatabaseCacheKeyFor(argv)
  if (testDatabaseCache != null && testDatabaseCacheKey === key) {
    return testDatabaseCache
  }
  if (testDatabaseCache != null) {
    await dbApi.closeDatabase(testDatabaseCache)
    testDatabaseCache = null
    testDatabaseCacheKey = null
  }
  let db = await dbApi.initRamDatabase()
  await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())
  await loadPackagesIntoDatabase(db, argv, logger)
  testDatabaseCache = db
  testDatabaseCacheKey = key
  return db
}

/**
 * Drops the in-memory database kept for unit tests.
 *
 * @returns {Promise<void>}
 */
async function resetTestDatabaseCache() {
  if (testDatabaseCache != null) {
    await dbApi.closeDatabase(testDatabaseCache)
    testDatabaseCache = null
    testDatabaseCacheKey = null
  }
}

/**
 * Opens a .zap file into a fresh session, or creates an empty configuration
 * when `zapFile` is null.
 *
 * @param {*} argv Parsed command line.
 * @param {*} options `logger` plus an optional `zapFile` override.
 * @returns {Promise<*>} the context handed to every operation
 */
async function open(argv, options = {}) {
  let logger = options.logger || (() => {})
  let zapFile = options.zapFile !== undefined ? options.zapFile : argv.zapFile

  if (zapFile != null && !fs.existsSync(zapFile)) {
    throw new CliError(`No such file: ${zapFile}`)
  }

  let db = await openDatabase(argv, logger)

  let sessionId
  if (zapFile == null) {
    sessionId = await querySession.createBlankSession(db)
    logger(env.formatEmojiMessage('🔧', 'starting from an empty configuration'))
  } else {
    let importResult
    try {
      importResult = await importJs.importDataFromFile(db, zapFile, {
        defaultZclMetafile: argv.zclProperties,
        defaultTemplateFile: argv.generationTemplate,
        packageMatch: argv.packageMatch,
        postImportScript: argv.postImportScript,
        // CLI edits load the file as-is; SDK upgrade scripts belong on `zap upgrade`.
        upgradeRuleScripts: []
      })
    } catch (err) {
      // The importer assumes it was handed something already known to be a
      // configuration, so anything else surfaces as a parse error or a stray
      // type error. Neither says what the caller got wrong.
      throw new CliError(`${zapFile} could not be read as a configuration`, [
        `  ${err.message || err}`,
        `Expected a .zap file, or an ISC file to convert from.`
      ])
    }
    sessionId = importResult.sessionId
    if (importResult.errors != null && importResult.errors.length > 0) {
      throw new CliError(
        `Failed to read ${zapFile}`,
        importResult.errors.map((e) => `  ${e}`)
      )
    }
    logger(env.formatEmojiMessage('👈', `read in: ${zapFile}`))
  }

  await util.ensurePackagesAndPopulateSessionOptions(db, sessionId, {
    zcl: argv.zclProperties,
    template: argv.generationTemplate
  })

  // Studio's UC component integration keys off a project path on the session,
  // exactly as it does when the interface opens a file. Without both the port
  // and the path there is nothing to talk to, and edits stay local to the file.
  let studioIntegration = false
  if (argv.studioHttpPort != null && argv.ideProjectPath != null) {
    studio.initIdeIntegration(db, argv.studioHttpPort)
    await querySession.updateSessionKeyValue(
      db,
      sessionId,
      dbEnum.sessionKey.ideProjectPath,
      argv.ideProjectPath
    )
    studioIntegration = await studio.integrationEnabled(db, sessionId)
    // Asking for the integration and silently not getting it is the worst
    // outcome: the edit saves, the components are never installed, and the
    // project looks configured. Refuse instead.
    let problem = await studio.integrationProblem(argv.ideProjectPath)
    if (problem != null) {
      throw new CliError(`Studio integration was requested, but ${problem}`, [
        `Studio must be running with this project for --studioHttpPort to work.`,
        `Drop both options to edit the file without installing UC components.`
      ])
    }
    logger(
      env.formatEmojiMessage(
        '🔧',
        `Studio integration: ${argv.ideProjectPath} via port ${argv.studioHttpPort}`
      )
    )
  }

  let ctx = {
    db: db,
    sessionId: sessionId,
    zapFile: zapFile,
    category: argv.category || null,
    studioIntegration: studioIntegration,
    logger: logger,
    argv: argv
  }
  let differences = await sessionContent.customXmlDifferences(ctx)
  ctx.unresolvedCustomXml = differences.missing
  // What the importer put in place of what it could not load. Worked out once,
  // as the file was read, so that packages added during this run are not
  // mistaken for it.
  ctx.substitutedCustomXml = differences.unnamed
  return ctx
}

/**
 * Writes the session back out to a .zap file.
 *
 * Two things are worth knowing about the export underneath. It always leaves a
 * `~` copy of whatever the file held before, so there is nothing to opt into.
 * And it takes the save file format from the environment rather than from its
 * options, which is why `--saveFileFormat` is applied while the arguments are
 * parsed and not passed along here.
 *
 * @param {*} ctx
 * @param {string} outputPath
 * @param {*} options
 * @returns {Promise<string>} the path that was written
 */
async function save(ctx, outputPath, options = {}) {
  let parent = path.dirname(outputPath)
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true })
  }
  await querySession.updateSessionKeyValue(
    ctx.db,
    ctx.sessionId,
    dbEnum.sessionKey.filePath,
    outputPath
  )
  return exportJs.exportDataIntoFile(ctx.db, ctx.sessionId, outputPath, {
    removeLog: options.noZapFileLog === true
  })
}

/**
 * Releases the database.
 *
 * @param {*} ctx
 * @returns {Promise} promise of a closed database
 */
async function close(ctx) {
  // The integration keeps a heartbeat timer alive, which would hold the
  // process open long after the edit is done.
  studio.deinitIdeIntegration()
  if (ctx != null && ctx.db != null) {
    if (useTestDatabaseCache() && ctx.db === testDatabaseCache) {
      await querySession.deleteSession(ctx.db, ctx.sessionId)
      return
    }
    return dbApi.closeDatabase(ctx.db)
  }
}

exports.open = open
exports.resetTestDatabaseCache = resetTestDatabaseCache
exports.save = save
exports.close = close
exports.notifications = sessionContent.notifications
exports.packageNotifications = sessionContent.packageNotifications
exports.validate = sessionContent.validate
exports.packages = sessionContent.packages
exports.samePath = sessionContent.samePath
exports.addCustomXml = sessionContent.addCustomXml
exports.removeCustomXml = sessionContent.removeCustomXml
