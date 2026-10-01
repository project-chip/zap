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
 * Recent .zap file list stored in the ZAP state directory.
 *
 * @module JS API: recent files
 */

const fs = require('fs')
const path = require('path')
const env = require('./env')

const RECENT_FILES_NAME = 'recent-zap-files.json'

/**
 * Absolute path of the recent-files JSON in the state directory.
 * @returns {string}
 */
function recentFilesPath() {
  return path.join(env.appDirectory(), RECENT_FILES_NAME)
}

/**
 * How many days a file stays on the list.
 * @returns {number}
 */
function recentFileDays() {
  return env.getRecentFileDays()
}

/**
 * Read the raw list from disk.
 * @returns {Array} list of {path, lastUsed}
 */
function readAll() {
  try {
    let file = recentFilesPath()
    if (!fs.existsSync(file)) return []
    let data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch (err) {
    env.logWarning(`Failed to read recent files list: ${err.message}`)
    return []
  }
}

/**
 * Write the list to disk.
 * @param {Array} list list of {path, lastUsed}
 */
function writeAll(list) {
  try {
    fs.writeFileSync(recentFilesPath(), JSON.stringify(list, null, 2))
  } catch (err) {
    env.logWarning(`Failed to write recent files list: ${err.message}`)
  }
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
 * @param {string} filePath
 */
function recordRecentFile(filePath) {
  if (!isZapFile(filePath)) return
  let normalized = path.resolve(filePath)
  let now = Date.now()
  let list = readAll().filter((entry) => entry.path !== normalized)
  list.unshift({ path: normalized, lastUsed: now })
  writeAll(list)
}

/**
 * Recent files still on disk and within the configured window.
 * Stale or missing entries are dropped from disk.
 * @param {number} [maxAgeDays]
 * @returns {Array} list of {path, lastUsed}
 */
function getRecentFiles(maxAgeDays) {
  let days = maxAgeDays || recentFileDays()
  let cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  let list = readAll()
    .filter(
      (entry) =>
        entry &&
        typeof entry.path === 'string' &&
        typeof entry.lastUsed === 'number' &&
        entry.lastUsed >= cutoff &&
        fs.existsSync(entry.path)
    )
    .sort((a, b) => b.lastUsed - a.lastUsed)
  writeAll(list)
  return list
}

exports.recordRecentFile = recordRecentFile
exports.getRecentFiles = getRecentFiles
exports.recentFileDays = recentFileDays
exports.recentFilesPath = recentFilesPath
