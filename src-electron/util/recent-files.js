/**
 *
 *    Copyright (c) 2026 Silicon Labs
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
 * Recent .zap file list, stored in the RECENT_FILE table of the ZAP database.
 *
 * The number of days a file stays on the list comes from the SETTING table
 * when it was chosen on the config page, otherwise from the
 * `--recentFileDays` option or its default.
 *
 * @module JS API: recent files
 */

const fs = require('fs')
const path = require('path')
const env = require('./env')
const dbApi = require('../db/db-api.js')
const dbEnum = require('../../src-shared/db-enum.js')
const queryRecentFile = require('../db/query-recent-file.js')

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Parse a days value. Returns null unless it is a positive integer.
 * @param {*} days
 * @returns {number|null}
 */
function parseDays(days) {
  let parsed = parseInt(days, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * How many days a file stays on the list.
 * @param {*} db
 * @returns {Promise<number>}
 */
async function recentFileDays(db) {
  let stored = await dbApi.selectSetting(
    db,
    dbEnum.settingCategory.recentFile,
    dbEnum.settingKey.recentFileDays
  )
  return parseDays(stored) ?? env.getRecentFileDays()
}

/**
 * Store how many days a file stays on the list.
 * @param {*} db
 * @param {*} days
 * @returns {Promise<number|null>} the stored value, or null if days was invalid
 */
async function setRecentFileDays(db, days) {
  let parsed = parseDays(days)
  if (parsed == null) return null
  await dbApi.insertOrReplaceSetting(
    db,
    dbEnum.settingCategory.recentFile,
    dbEnum.settingKey.recentFileDays,
    String(parsed)
  )
  return parsed
}

/**
 * True if the path looks like a .zap file.
 * @param {string} filePath
 * @returns {boolean}
 */
function isZapFile(filePath) {
  return typeof filePath === 'string' && filePath.toLowerCase().endsWith('.zap')
}

/**
 * Record that a .zap file was opened or saved.
 * Failures are logged and do not interrupt the open or save.
 * @param {*} db
 * @param {string} filePath
 */
async function recordRecentFile(db, filePath) {
  if (!isZapFile(filePath)) return
  try {
    await queryRecentFile.insertOrReplaceRecentFile(
      db,
      path.resolve(filePath),
      Date.now()
    )
  } catch (err) {
    env.logWarning(`Failed to record recent file: ${err.message}`)
  }
}

/**
 * Recent files still on disk and within the configured window.
 * Stale or missing entries are removed from the database.
 * @param {*} db
 * @param {number} [maxAgeDays] overrides the configured window
 * @returns {Promise<Array>} objects containing 'path' and 'lastUsed', newest first
 */
async function getRecentFiles(db, maxAgeDays) {
  try {
    let days = parseDays(maxAgeDays) ?? (await recentFileDays(db))
    let cutoff = Date.now() - days * MS_PER_DAY
    await queryRecentFile.deleteRecentFilesBefore(db, cutoff)
    let rows = await queryRecentFile.selectRecentFiles(db, cutoff)
    let present = []
    for (const row of rows) {
      if (fs.existsSync(row.path)) {
        present.push(row)
      } else {
        await queryRecentFile.deleteRecentFile(db, row.path)
      }
    }
    return present
  } catch (err) {
    env.logWarning(`Failed to read recent files: ${err.message}`)
    return []
  }
}

exports.recordRecentFile = recordRecentFile
exports.getRecentFiles = getRecentFiles
exports.recentFileDays = recentFileDays
exports.setRecentFileDays = setRecentFileDays
