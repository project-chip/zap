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
 * Load / mutate / save lifecycle for the `zap edit` command line. This is the
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
const zclLoader = require('../zcl/zcl-loader.js')
const generatorEngine = require('../generator/generation-engine.js')
const importJs = require('../importexport/import.js')
const exportJs = require('../importexport/export.js')
const querySession = require('../db/query-session.js')
const querySessionNotification = require('../db/query-session-notification.js')
const queryPackage = require('../db/query-package.js')
const queryPackageNotification = require('../db/query-package-notification.js')
const validateAll = require('../validation/validate-all.js')
const studio = require('../ide-integration/studio-rest-api.js')
const cliError = require('./cli-error.js')

const CliError = cliError.CliError

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

  let db = await dbApi.initDatabaseAndLoadSchema(
    env.sqliteFile('edit'),
    env.schemaFile(),
    env.zapVersion()
  )
  logger(env.formatEmojiMessage('🐝', 'database and schema initialized'))

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
        postImportScript: argv.postImportScript
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
  let differences = await customXmlDifferences(ctx)
  ctx.unresolvedCustomXml = differences.missing
  // What the importer put in place of what it could not load. Worked out once,
  // as the file was read, so that packages added during this run are not
  // mistaken for it.
  ctx.substitutedCustomXml = differences.unnamed
  return ctx
}

/**
 * Every package the session is currently carrying.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} the `{ pkg, sessionPackage }` pairs
 */
async function packages(ctx) {
  return queryPackage.getPackageSessionPackagePairBySessionId(
    ctx.db,
    ctx.sessionId
  )
}

/**
 * Compares two file paths as the file system sees them, so that a package
 * recorded relative to the working directory and the same file named relative
 * to the .zap are recognized as one.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean} whether both name the same file
 */
function samePath(a, b) {
  if (a == null || b == null) return false
  let settle = (p) => {
    let absolute = path.resolve(p)
    try {
      return fs.realpathSync(absolute)
    } catch (err) {
      return absolute
    }
  }
  return settle(a) === settle(b)
}

/**
 * The custom XML a .zap file names, as absolute paths.
 *
 * @param {string} zapFile
 * @returns {Array} `{ declared, path }` per custom XML entry
 */
function declaredCustomXml(zapFile) {
  if (zapFile == null) return []
  let declared
  try {
    declared = JSON.parse(fs.readFileSync(zapFile, 'utf8')).package
  } catch (err) {
    // Not JSON, so an ISC file being converted. It names no packages.
    return []
  }
  if (!Array.isArray(declared)) return []
  return declared
    .filter((p) => p.type === dbEnum.packageType.zclXmlStandalone)
    .map((p) => ({
      declared: p.path,
      path:
        'pathRelativity' in p
          ? util.createAbsolutePath(p.path, p.pathRelativity, zapFile)
          : p.path
    }))
}

/**
 * Where the custom XML of a session and the custom XML its file names differ.
 *
 * This has to be asked, because the importer answers a custom XML it cannot
 * load by quietly moving on: with nothing else of that type in the database
 * the package is dropped, and with something else of that type there it is
 * handed over in its place, which is worse. Either way the configuration in
 * hand is not the one the file describes, and saving writes that difference
 * back into the file.
 *
 * @param {*} ctx
 * @returns {Promise<*>} `{ missing, unnamed }`
 */
async function customXmlDifferences(ctx) {
  let declared = declaredCustomXml(ctx.zapFile)
  let loaded = (await packages(ctx))
    .map((p) => p.pkg)
    .filter((p) => p.type === dbEnum.packageType.zclXmlStandalone)

  return {
    missing: declared
      .filter((d) => !loaded.some((l) => samePath(l.path, d.path)))
      .map((d) => ({ ...d, exists: fs.existsSync(d.path) })),
    unnamed:
      ctx.zapFile == null
        ? []
        : loaded.filter((l) => !declared.some((d) => samePath(d.path, l.path)))
  }
}

/**
 * Loads a custom XML file into the session, which is what the Extensions page
 * does when a file is chosen there.
 *
 * The load is the same call the REST layer makes, so the package is parsed,
 * post-processed and attached to a session partition exactly as it would be
 * for the GUI, and it is written into the .zap file when the session is saved.
 *
 * @param {*} ctx
 * @param {string} filePath
 * @returns {Promise<*>} `{ succeeded, packageId, err }`
 */
async function addCustomXml(ctx, filePath) {
  let outcome = await zclLoader.loadIndividualFile(
    ctx.db,
    filePath,
    ctx.sessionId
  )
  // Lookups are answered from a cached package list, which this has just
  // invalidated.
  delete ctx.zclPackageCache
  ctx.unresolvedCustomXml = (await customXmlDifferences(ctx)).missing
  return outcome
}

/**
 * Detaches a package from the session, which is what the Delete button on the
 * Extensions page does.
 *
 * The row is disabled rather than deleted, and database triggers then drop the
 * endpoint configuration that referred to the clusters it defined, so this is
 * the same demolition the GUI performs.
 *
 * @param {*} ctx
 * @param {number} packageId
 * @returns {Promise<boolean>} whether a session package was detached
 */
async function removeCustomXml(ctx, packageId) {
  let partitions = await querySession.selectSessionPartitionInfoFromPackageId(
    ctx.db,
    ctx.sessionId,
    packageId
  )
  let removed = 0
  for (let partition of partitions) {
    removed += await queryPackage.deleteSessionPackage(
      ctx.db,
      partition.sessionPartitionId,
      packageId
    )
  }
  delete ctx.zclPackageCache
  ctx.unresolvedCustomXml = (await customXmlDifferences(ctx)).missing
  return removed > 0
}

/**
 * Runs the same validation that `zap validate` and the GUI run.
 *
 * @param {*} ctx
 * @returns {Promise<*>} validation report
 */
async function validate(ctx) {
  return validateAll.validateAll(ctx.db, ctx.sessionId, {
    persistConformanceNotifications: false
  })
}

/**
 * Turns database notification rows into what the CLI reports.
 *
 * @param {string} scope
 * @param {Array} rows
 * @returns {Array} array of `{ scope, type, severity, message }`
 */
function describeNotifications(scope, rows) {
  return rows.map((row) => ({
    scope: scope,
    type: row.type,
    severity: row.severity,
    message: row.message
  }))
}

/**
 * Everything ZAP has to say about this configuration that it did not raise as
 * an error: the notifications behind the count the user interface shows in its
 * toolbar.
 *
 * They are written as the configuration is read in and as it is edited, partly
 * by the importer and partly by database triggers watching for things like a
 * provisional cluster being switched on, and they are the only record of some
 * of it.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} array of `{ scope, type, severity, message }`
 */
async function notifications(ctx) {
  return describeNotifications(
    'configuration',
    await querySessionNotification.getNotification(ctx.db, ctx.sessionId)
  )
}

/**
 * What ZAP has to say about the data model rather than about any configuration
 * built on it, such as a cluster definition whose XML contradicts itself. These
 * outlive the session, which is why the user interface keeps them apart, on the
 * packages themselves.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} array of `{ scope, type, severity, message }`
 */
async function packageNotifications(ctx) {
  return describeNotifications(
    'data model',
    await queryPackageNotification.getNotificationBySessionId(
      ctx.db,
      ctx.sessionId
    )
  )
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
    return dbApi.closeDatabase(ctx.db)
  }
}

exports.open = open
exports.save = save
exports.close = close
exports.notifications = notifications
exports.packageNotifications = packageNotifications
exports.validate = validate
exports.packages = packages
exports.samePath = samePath
exports.addCustomXml = addCustomXml
exports.removeCustomXml = removeCustomXml
