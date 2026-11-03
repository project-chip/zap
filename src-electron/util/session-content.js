/**
 * Shared reads and package mutations for an already-open configuration
 * session. Loading a file into a session and saving that session are handled by
 * the interface lifecycle; these helpers operate on the session itself.
 *
 * @module Configuration API: session content
 */

const fs = require('fs')
const path = require('path')

const dbEnum = require('../../src-shared/db-enum.js')
const util = require('./util.js')
const zclLoader = require('../zcl/zcl-loader.js')
const queryPackage = require('../db/query-package.js')
const querySession = require('../db/query-session.js')
const querySessionNotification = require('../db/query-session-notification.js')
const queryPackageNotification = require('../db/query-package-notification.js')
const validateAll = require('../validation/validate-all.js')

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
 * Compares two file paths as the file system sees them.
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
 * Loads a custom XML file into the session.
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
  delete ctx.zclPackageCache
  ctx.unresolvedCustomXml = (await customXmlDifferences(ctx)).missing
  return outcome
}

/**
 * Detaches a package from the session.
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
 * Runs validation for the active configuration.
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
 * Turns database notification rows into interface-neutral records.
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
 * Notifications raised for a configuration session.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} notification records
 */
async function notifications(ctx) {
  return describeNotifications(
    'configuration',
    await querySessionNotification.getNotification(ctx.db, ctx.sessionId)
  )
}

/**
 * Notifications raised for packages attached to a configuration.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} notification records
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

exports.packages = packages
exports.samePath = samePath
exports.declaredCustomXml = declaredCustomXml
exports.customXmlDifferences = customXmlDifferences
exports.addCustomXml = addCustomXml
exports.removeCustomXml = removeCustomXml
exports.validate = validate
exports.notifications = notifications
exports.packageNotifications = packageNotifications
