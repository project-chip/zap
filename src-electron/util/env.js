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
const { version } = require('../../package.json')

// Basic environment tie-ins
var pino_logger = pino({
  nameL: 'zap',
  level: process.env.ZAP_LOGLEVEL || 'warn', // This sets the default log level. If you set this, to say `sql`, then you will get SQL queries.
  customLevels: {
    sql: 25,
    all: 1,
  },
})

var explicit_logger_set = false
var dbInstance
var httpStaticContent = path.join(__dirname, '../../dist/spa')

function setDevelopmentEnv() {
  global.__statics = path.join('src', 'statics').replace(/\\/g, '\\\\')
  httpStaticContent = path.join(__dirname, '../../dist/spa')
}

function setProductionEnv() {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\')
  httpStaticContent = path.join('.').replace(/\\/g, '\\\\')
}

function setMainDatabase(db) {
  dbInstance = db
}

function mainDatabase() {
  return dbInstance
}

// Returns an app directory. It creates it, if it doesn't exist
function appDirectory() {
  var appDir = path.join(os.homedir(), '.zap')

  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true }, (err) => {
      if (err) throw err
    })
  }
  return appDir
}

function iconsDirectory() {
  return path.join(__dirname, '../icons')
}

function schemaFile() {
  var p = path.join(__dirname, '../db/zap-schema.sql')
  if (!fs.existsSync(p)) p = path.join(__dirname, '../zap-schema.sql')
  if (!fs.existsSync(p))
    throw new Error('Could not locate zap-schema.sql file.')
  return p
}

function sqliteFile() {
  return path.join(appDirectory(), 'zap.sqlite')
}

function sqliteTestFile(id) {
  return path.join(appDirectory(), `test-${id}.sqlite`)
}

function zapVersion() {
  return version
}

function logInitStdout() {
  if (!explicit_logger_set) {
    pino_logger = pino()
    explicit_logger_set = true
  }
}

function logInitLogFile() {
  if (!explicit_logger_set) {
    pino_logger = pino(pino.destination(path.join(appDirectory(), 'zap.log')))
    explicit_logger_set = true
  }
}

// Use this function to log info-level messages
function logInfo(msg) {
  return pino_logger.info(msg)
}

// Use this function to log error-level messages
function logError(msg) {
  return pino_logger.error(msg)
}

// Use this function to log warning-level messages
function logWarning(msg) {
  return pino_logger.warn(msg)
}

// Use this function to log SQL messages.
function logSql(msg) {
  return pino_logger.debug(msg)
}

exports.setDevelopmentEnv = setDevelopmentEnv
exports.setProductionEnv = setProductionEnv
exports.setMainDatabase = setMainDatabase
exports.mainDatabase = mainDatabase
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
exports.httpStaticContent = httpStaticContent
exports.zapVersion = zapVersion
