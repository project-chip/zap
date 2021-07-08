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

const path = require('path')
const os = require('os')
const fs = require('fs')
const pino = require('pino')
const zapBaseUrl = 'http://localhost:'
const zapUrlLog = 'zap.url'

const builtinSilabsZclMetafile = path.join(
  __dirname,
  '../../zcl-builtin/silabs/zcl.json'
)

const builtinMatterZclMetafile = path.join(
  __dirname,
  '../../zcl-builtin/matter/zcl.json'
)

const builtinDotdotZclMetafile = path.join(
  __dirname,
  '../../zcl-builtin/dotdot/library.xml'
)

const builtinTemplateMetafile = null // No default.

let environmentVariable = {
  logLevel: {
    name: 'ZAP_LOGLEVEL',
    description: 'Sets the log level. If unset, then default is: warn.',
  },
  uniqueStateDir: {
    name: 'ZAP_TEMPSTATE',
    description:
      'If set to 1, then instead of .zap, a unique temporary state directory will be created.',
  },
  stateDir: {
    name: 'ZAP_DIR',
    description:
      'Sets a state directory. Can be overriden by --stateDirectory option. If unset, default is: ~/.zap',
  },
  skipPostGen: {
    name: 'ZAP_SKIP_POST_GENERATION',
    description:
      'If there is a defined post-generation action for zap, you can set this to variable to 1 to skip it.',
  },
  reuseZapInstance: {
    name: 'ZAP_REUSE_INSTANCE',
    descrpition:
      'If set to 1, default behavior of zap will be to reuse existing instance.',
  },
}

// builtin pino levels: trace=10, debug=20, info=30, warn=40
const pinoOptions = {
  name: 'zap',
  level: process.env[environmentVariable.logLevel.name] || 'info', // This sets the default log level. If you set this, to say `sql`, then you will get SQL queries.
  customLevels: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    ipc: 27,
    browser: 25,
    sql: 22,
    debug: 20,
    trace: 10,
    all: 1,
  },
}

// Basic environment tie-ins
let pino_logger = pino(pinoOptions)

let explicit_logger_set = false
let httpStaticContent = path.join(__dirname, '../../spa')
let versionObject = null
let applicationStateDirectory = null

function setDevelopmentEnv() {
  global.__statics = path.join('src', 'statics').replace(/\\/g, '\\\\')
  httpStaticContent = path.join(__dirname, '../../spa')
}

function setProductionEnv() {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\')
  httpStaticContent = path.join('.').replace(/\\/g, '\\\\')
}

function logInitStdout() {
  if (!explicit_logger_set) {
    pino_logger = pino(pinoOptions, pino.destination(1))
    explicit_logger_set = true
  }
}

function logInitLogFile() {
  if (!explicit_logger_set) {
    pino_logger = pino(
      pinoOptions,
      pino.destination(path.join(appDirectory(), 'zap.log'))
    )
    explicit_logger_set = true
  }
}

/**
 * Set the state directory. This method is intended to be called
 * only at the application startup, when CLI args are being parsed.
 * This method honors '~/' being the first characters in its argument.
 *
 * @param {*} path Absolute path. Typically '~/.zap'.
 */
function setAppDirectory(directoryPath) {
  let appDir
  if (directoryPath.startsWith('~/')) {
    appDir = path.join(os.homedir(), directoryPath.substring(2))
  } else {
    appDir = directoryPath
  }
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true }, (err) => {
      if (err) throw err
    })
  }
  applicationStateDirectory = appDir
}

/**
 * Returns an app directory. It creates it, if it doesn't exist
 *
 * @returns state directory, which is guaranteed to be already existing
 */
function appDirectory() {
  if (applicationStateDirectory == null) {
    let appDir = path.join(os.homedir(), '.zap')
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true }, (err) => {
        if (err) throw err
      })
    }
    applicationStateDirectory = appDir
    return appDir
  }
  return applicationStateDirectory
}

function iconsDirectory() {
  return path.join(__dirname, '../icons')
}

function schemaFile() {
  return path.join(__dirname, '../db/zap-schema.sql')
}

function sqliteFile(filename = 'zap') {
  return path.join(appDirectory(), `${filename}.sqlite`)
}

function sqliteTestFile(id, deleteExistingFile = true) {
  let dir = path.join(__dirname, '../../test/.zap')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  let fileName = path.join(dir, `test-${id}.sqlite`)
  if (deleteExistingFile && fs.existsSync(fileName)) fs.unlinkSync(fileName)
  return fileName
}
/**
 * Returns a version as a single on-line string.
 *
 */
function zapVersionAsString() {
  let vo = zapVersion()
  return `ver. ${vo.version}, featureLevel ${vo.featureLevel}, commit: ${vo.hash} from ${vo.date}`
}

/**
 * Returns the zap version.
 *
 * @returns zap version, which is an object that
 * contains 'version', 'featureLevel', 'hash', 'timestamp' and 'date'
 */
function zapVersion() {
  if (versionObject == null) {
    versionObject = {}
    try {
      let p = require('../../package.json')
      versionObject.version = p.version
    } catch (err) {
      logError('Could not retrieve version from package.json')
      versionObject.version = '0.0.0'
    }

    try {
      let p = require('../../apack.json')
      versionObject.featureLevel = p.featureLevel
    } catch (err) {
      logError('Could not retrieve featureLevel from apack.json')
      versionObject.featureLevel = 0
    }

    try {
      let ver = require('../../.version.json')
      versionObject.hash = ver.hash
      versionObject.timestamp = ver.timestamp
      versionObject.date = ver.date
    } catch {
      logError('Could not retrieve version from .version.json')
    }
  }
  return versionObject
}

function baseUrl() {
  return zapBaseUrl
}

/**
 * Base level common logger.
 *
 * @param {*} level
 * @param {*} msg
 * @param {*} err
 */
function log(level, msg, err = null) {
  let objectToLog = {
    msg: msg,
  }
  if (err != null) {
    objectToLog.err = err
    objectToLog.err.alert = '⛔'
  }
  pino_logger[level](objectToLog)
}

/**
 * Info level message.
 *
 * @param {*} msg
 * @param {*} err
 */
function logInfo(msg, err = null) {
  log('info', msg, err)
}

/**
 * Error level message.
 *
 * @param {*} msg
 * @param {*} err
 */
function logError(msg, err = null) {
  log('error', msg, err)
}

/**
 * Warning level message.
 *
 * @param {*} msg
 * @param {*} err
 */
function logWarning(msg, err = null) {
  log('warn', msg, err)
}

/**
 * Sql level message.
 *
 * @param {*} msg
 * @param {*} err
 */
function logSql(msg, err = null) {
  log('sql', msg, err)
}

/**
 * Browser level message.
 *
 * @param {*} msg
 * @param {*} err
 */
function logBrowser(msg, err = null) {
  log('browser', msg, err)
}

/**
 * IPC level message.
 *
 * @param {*} msg
 * @param {*} err
 */
function logIpc(msg, err = null) {
  log('ipc', msg, err)
}

/**
 * Debug level message.
 *
 * @param {*} msg
 * @param {*} err
 */
function logDebug(msg, err = null) {
  log('debug', msg, err)
}

// Returns true if major or minor component of versions is different.
function isMatchingVersion(versionsArray, providedVersion) {
  let ret = false
  let v2 = providedVersion.split('.')
  versionsArray.forEach((element) => {
    let v1 = element.split('.')
    if (v1.length != 3 || v2.length != 3) return

    if (v1[0] != 'x' && v1[0] != v2[0]) return
    if (v1[1] != 'x' && v1[1] != v2[1]) return
    if (v1[2] != 'x' && v1[2] != v2[2]) return

    ret = true
  })

  return ret
}

/**
 * Returns true if versions of node and electron are matching.
 * If versions are not matching, it  prints out a warhing
 * and returns false.
 *
 * @returns true or false, depending on match
 */
function versionsCheck() {
  let expectedNodeVersion = ['v14.x.x', 'v12.x.x']
  let expectedElectronVersion = ['12.0.x']
  let nodeVersion = process.version
  let electronVersion = process.versions.electron
  let ret = true
  if (!isMatchingVersion(expectedNodeVersion, nodeVersion)) {
    ret = false
    console.log(`Expected node versions: ${expectedNodeVersion}`)
    console.log(`Provided node version: ${nodeVersion}`)
    console.log(
      'WARNING: you are using different node version than recommended.'
    )
  }
  if (
    electronVersion != null &&
    !isMatchingVersion(expectedElectronVersion, electronVersion)
  ) {
    ret = false
    console.log(`Expected electron version: ${expectedElectronVersion}`)
    console.log(`Provided electron version: ${electronVersion}`)
    console.log(
      'WARNING: you are using different electron version that recommended.'
    )
  }
  return ret
}

exports.setDevelopmentEnv = setDevelopmentEnv
exports.setProductionEnv = setProductionEnv
exports.appDirectory = appDirectory
exports.iconsDirectory = iconsDirectory
exports.schemaFile = schemaFile
exports.sqliteFile = sqliteFile
exports.sqliteTestFile = sqliteTestFile
exports.logInitStdout = logInitStdout
exports.logInitLogFile = logInitLogFile
exports.logInfo = logInfo
exports.logError = logError
exports.logWarning = logWarning
exports.logSql = logSql
exports.logBrowser = logBrowser
exports.logIpc = logIpc
exports.logDebug = logDebug
exports.zapVersion = zapVersion
exports.zapVersionAsString = zapVersionAsString
exports.baseUrl = baseUrl
exports.versionsCheck = versionsCheck
exports.setAppDirectory = setAppDirectory
exports.httpStaticContent = httpStaticContent
exports.environmentVariable = environmentVariable
exports.builtinSilabsZclMetafile = builtinSilabsZclMetafile
exports.builtinMatterZclMetafile = builtinMatterZclMetafile
exports.builtinDotdotZclMetafile = builtinDotdotZclMetafile
exports.builtinTemplateMetafile = builtinTemplateMetafile
