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

import path from 'path'
import os from 'os'
import fs from 'fs'
import pino from 'pino'

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

export function setDevelopmentEnv() {
  global.__statics = path.join('src', 'statics').replace(/\\/g, '\\\\')
  global.__indexDirOffset = path.join('../../dist/spa')
}

export function setProductionEnv() {
  global.__statics = path.join(__dirname, 'statics').replace(/\\/g, '\\\\')
  global.__indexDirOffset = path.join('.').replace(/\\/g, '\\\\')
}

export function setMainDatabase(db) {
  dbInstance = db
}

export function mainDatabase() {
  return dbInstance
}

// Returns an app directory. It creates it, if it doesn't exist
export function appDirectory() {
  var appDir = path.join(os.homedir(), '.silabs', 'zap')

  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true }, (err) => {
      if (err) throw err
    })
  }
  return appDir
}

export function iconsDirectory() {
  return path.join(__dirname, '../icons')
}

export function schemaFile() {
  var p = path.join(__dirname, '../db/zap-schema.sql')
  if (!fs.existsSync(p)) p = path.join(__dirname, '../zap-schema.sql')
  if (!fs.existsSync(p))
    throw new Error('Could not locate zap-schema.sql file.')
  return p
}

export function sqliteFile() {
  return path.join(appDirectory(), 'zap.sqlite')
}

export function sqliteTestFile(id) {
  return path.join(appDirectory(), `test-${id}.sqlite`)
}

export function logInitStdout() {
  if (!explicit_logger_set) {
    pino_logger = pino()
    explicit_logger_set = true
  }
}

export function logInitLogFile() {
  if (!explicit_logger_set) {
    pino_logger = pino(pino.destination(path.join(appDirectory(), 'zap.log')))
    explicit_logger_set = true
  }
}

// Use this function to log info-level messages
export function logInfo(msg) {
  return pino_logger.info(msg)
}

// Use this function to log error-level messages
export function logError(msg) {
  return pino_logger.error(msg)
}

// Use this function to log warning-level messages
export function logWarning(msg) {
  return pino_logger.warn(msg)
}

// Use this function to log SQL messages.
export function logSql(msg) {
  return pino_logger.debug(msg)
}
