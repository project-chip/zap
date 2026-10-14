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
 *
 *
 * @jest-environment node
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const dbEnum = require('../src-shared/db-enum')
const recentFiles = require('../src-electron/util/recent-files')
const { timeout } = require('./test-util')

let db
let dbFile
let tmpDir
let previousDays

beforeAll(async () => {
  env.setDevelopmentEnv()
  previousDays = env.getRecentFileDays()
  env.setRecentFileDays(21)
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zap-recent-'))
  dbFile = env.sqliteTestFile('recent-files')
  db = await dbApi.initDatabaseAndLoadSchema(
    dbFile,
    env.schemaFile(),
    env.zapVersion()
  )
}, timeout.medium())

afterAll(async () => {
  env.setRecentFileDays(previousDays)
  await dbApi.closeDatabase(db)
  fs.rmSync(tmpDir, { recursive: true, force: true })
}, timeout.short())

/**
 * Create an empty .zap file in the temp directory.
 * @param {string} name
 * @returns {string} absolute path
 */
function makeZap(name) {
  let p = path.join(tmpDir, name)
  fs.writeFileSync(p, '{}')
  return path.resolve(p)
}

test(
  'Records .zap files and ignores other extensions',
  async () => {
    let zapPath = makeZap('sample.zap')
    let otherPath = path.join(tmpDir, 'notes.txt')
    fs.writeFileSync(otherPath, 'nope')

    await recentFiles.recordRecentFile(db, otherPath)
    await recentFiles.recordRecentFile(db, zapPath)

    let list = await recentFiles.getRecentFiles(db)
    expect(list).toHaveLength(1)
    expect(list[0].path).toBe(zapPath)
    expect(list[0].lastUsed).toBeGreaterThan(0)
  },
  timeout.short()
)

test(
  'Drops files older than the configured window',
  async () => {
    let oldPath = makeZap('old.zap')
    await recentFiles.recordRecentFile(db, oldPath)
    await dbApi.dbUpdate(
      db,
      'UPDATE RECENT_FILE SET LAST_USED = ? WHERE PATH = ?',
      [Date.now() - 30 * 24 * 60 * 60 * 1000, oldPath]
    )

    let list = await recentFiles.getRecentFiles(db)
    expect(list.find((e) => e.path === oldPath)).toBeUndefined()

    let row = await dbApi.dbGet(
      db,
      'SELECT PATH FROM RECENT_FILE WHERE PATH = ?',
      [oldPath]
    )
    expect(row).toBeUndefined()
  },
  timeout.short()
)

test(
  'Drops files that no longer exist',
  async () => {
    let gone = makeZap('gone.zap')
    await recentFiles.recordRecentFile(db, gone)
    fs.unlinkSync(gone)

    let list = await recentFiles.getRecentFiles(db)
    expect(list.find((e) => e.path === gone)).toBeUndefined()
  },
  timeout.short()
)

test(
  'Days setting is stored in the database and falls back to the CLI default',
  async () => {
    expect(await recentFiles.recentFileDays(db)).toBe(21)
    expect(await recentFiles.setRecentFileDays(db, 'nope')).toBeNull()
    expect(await recentFiles.setRecentFileDays(db, 0)).toBeNull()
    expect(await recentFiles.setRecentFileDays(db, '7')).toBe(7)
    expect(await recentFiles.recentFileDays(db)).toBe(7)

    let recent = makeZap('recent.zap')
    let stale = makeZap('stale.zap')
    await recentFiles.recordRecentFile(db, recent)
    await recentFiles.recordRecentFile(db, stale)
    await dbApi.dbUpdate(
      db,
      'UPDATE RECENT_FILE SET LAST_USED = ? WHERE PATH = ?',
      [Date.now() - 10 * 24 * 60 * 60 * 1000, stale]
    )
    let list = await recentFiles.getRecentFiles(db)
    expect(list.map((e) => e.path)).toContain(recent)
    expect(list.map((e) => e.path)).not.toContain(stale)
  },
  timeout.short()
)

test(
  'Recent files and the days setting survive a schema reload',
  async () => {
    let kept = makeZap('kept.zap')
    await recentFiles.recordRecentFile(db, kept)
    await recentFiles.setRecentFileDays(db, 9)

    // Pretend the schema file changed so loadSchema rebuilds the database.
    await dbApi.dbUpdate(db, 'UPDATE PACKAGE SET CRC = ? WHERE TYPE = ?', [
      'stale-crc',
      dbEnum.packageType.sqlSchema
    ])
    db = await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion(), dbFile)

    expect(fs.existsSync(dbFile + '~')).toBe(true)
    let list = await recentFiles.getRecentFiles(db)
    expect(list.map((e) => e.path)).toContain(kept)
    expect(await recentFiles.recentFileDays(db)).toBe(9)
  },
  timeout.medium()
)
