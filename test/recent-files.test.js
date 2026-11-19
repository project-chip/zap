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

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const sqlite = require('sqlite3')
const env = require('../src-electron/util/env')
const dbApi = require('../src-electron/db/db-api')
const dbEnum = require('../src-shared/db-enum')
const recentFiles = require('../src-electron/util/recent-files')
const util = require('../src-electron/util/util')
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

test(
  'Schema reload stops when SETTING is missing and a backup exists',
  async () => {
    await recentFiles.setRecentFileDays(db, 9)
    await dbApi.closeDatabase(db)
    fs.copyFileSync(dbFile, dbFile + '~')
    let backupStat = fs.statSync(dbFile + '~')

    db = await dbApi.initDatabase(dbFile)
    await dbApi.dbUpdate(db, 'DROP TABLE SETTING', [])
    await dbApi.dbUpdate(db, 'UPDATE PACKAGE SET CRC = ? WHERE TYPE = ?', [
      'stale-crc',
      dbEnum.packageType.sqlSchema
    ])
    await expect(
      dbApi.loadSchema(db, env.schemaFile(), env.zapVersion(), dbFile)
    ).rejects.toThrow(/rebuild is interrupted/)

    let backupStatAfter = fs.statSync(dbFile + '~')
    expect(backupStatAfter.size).toBe(backupStat.size)
    expect(backupStatAfter.mtimeMs).toBe(backupStat.mtimeMs)
    let setting = await dbApi.dbGet(
      db,
      "SELECT NAME FROM sqlite_master WHERE TYPE = 'table' AND NAME = ?",
      ['SETTING']
    )
    expect(setting).toBeUndefined()
  },
  timeout.medium()
)

test(
  'Schema reload finishes when SETTING is missing',
  async () => {
    fs.rmSync(dbFile + '~', { force: true })
    await dbApi.dbUpdate(db, 'UPDATE PACKAGE SET CRC = ? WHERE TYPE = ?', [
      'stale-crc',
      dbEnum.packageType.sqlSchema
    ])
    db = await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion(), dbFile)
    expect(await recentFiles.recentFileDays(db)).toBe(21)
  },
  timeout.medium()
)

test(
  'Schema is not rebuilt when the same schema was recorded under another path',
  async () => {
    let file = env.sqliteTestFile('recent-files-shared-schema')
    let opened = await dbApi.initDatabaseAndLoadSchema(
      file,
      env.schemaFile(),
      env.zapVersion()
    )
    // The desktop app and zap-cli resolve zap-schema.sql to different paths
    // and record that path. The checksum is what the two have in common.
    await dbApi.dbUpdate(opened, 'UPDATE PACKAGE SET PATH = ? WHERE TYPE = ?', [
      '/Applications/ZAP.app/Contents/Resources/app.asar/db/zap-schema.sql',
      dbEnum.packageType.sqlSchema
    ])
    opened = await dbApi.loadSchema(
      opened,
      env.schemaFile(),
      env.zapVersion(),
      file
    )
    try {
      expect(fs.existsSync(file + '~')).toBe(false)
      expect(await recentFiles.recentFileDays(opened)).toBe(21)
    } finally {
      await dbApi.closeDatabase(opened)
    }
  },
  timeout.medium()
)

test(
  'Two processes starting on a fresh file build the schema once',
  async () => {
    let file = env.sqliteTestFile('recent-files-concurrent')
    let [first, second] = await Promise.all([
      dbApi.initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion()),
      dbApi.initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    ])
    try {
      expect(fs.existsSync(file + '~')).toBe(false)
      expect(await recentFiles.recentFileDays(first)).toBe(21)
      expect(await recentFiles.recentFileDays(second)).toBe(21)
    } finally {
      await dbApi.closeDatabase(first)
      await dbApi.closeDatabase(second)
    }
  },
  timeout.medium()
)

/**
 * Starts a separate node process that takes the lock and then kills itself
 * without releasing it, the way a crash would.
 * @param {string} lockFile
 * @param {number} holdMs
 * @returns {Promise<*>} the child process, once it holds the lock.
 */
function holdLockInChildThenCrash(lockFile, holdMs) {
  let script = `
    const sqlite = require('sqlite3')
    const db = new sqlite.Database(${JSON.stringify(lockFile)})
    db.run('BEGIN EXCLUSIVE', (err) => {
      if (err) { console.error(err.message); process.exit(2) }
      console.log('held')
      setTimeout(() => process.kill(process.pid, 'SIGKILL'), ${holdMs})
    })`
  let child = childProcess.spawn(process.execPath, ['-e', script], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'inherit']
  })
  return new Promise((resolve, reject) => {
    child.stdout.once('data', () => resolve(child))
    child.once('exit', (code) => reject(new Error(`child exited ${code}`)))
  })
}

test(
  'Startup waits for another process and continues when that process dies',
  async () => {
    let file = env.sqliteTestFile('recent-files-locked')
    await holdLockInChildThenCrash(file + '-lock', 1500)
    let settled = false
    let pending = dbApi
      .initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
      .then((d) => {
        settled = true
        return d
      })
    await util.waitFor(400)
    expect(settled).toBe(false)
    expect(fs.existsSync(file)).toBe(false)

    let opened = await pending
    try {
      expect(await recentFiles.recentFileDays(opened)).toBe(21)
    } finally {
      await dbApi.closeDatabase(opened)
    }
  },
  timeout.medium()
)

test(
  'Waiting for the lock gives up with an error that names the lock',
  async () => {
    let lockFile = env.sqliteTestFile('recent-files-timeout') + '-lock'
    let holder = new sqlite.Database(lockFile)
    await new Promise((resolve, reject) =>
      holder.run('BEGIN EXCLUSIVE', (err) => (err ? reject(err) : resolve()))
    )
    let ran = false
    try {
      await expect(
        dbApi.withDatabaseLock(
          lockFile,
          async () => {
            ran = true
          },
          300
        )
      ).rejects.toThrow(
        /Timed out after 0.3s waiting for .*recent-files-timeout/
      )
      expect(ran).toBe(false)
    } finally {
      await new Promise((resolve) => holder.close(resolve))
    }
    await dbApi.withDatabaseLock(lockFile, async () => {
      ran = true
    })
    expect(ran).toBe(true)
    expect(fs.existsSync(lockFile)).toBe(true)
  },
  timeout.medium()
)

test(
  'Startup stops on a damaged database and leaves the file as it was',
  async () => {
    let file = env.sqliteTestFile('recent-files-damaged')
    let built = await dbApi.initDatabaseAndLoadSchema(
      file,
      env.schemaFile(),
      env.zapVersion()
    )
    let root = await dbApi.dbGet(
      built,
      "SELECT rootpage AS ROOT FROM sqlite_master WHERE NAME = 'PACKAGE'",
      []
    )
    let pageSize = (await dbApi.dbGet(built, 'PRAGMA page_size', [])).page_size
    await dbApi.closeDatabase(built)
    let fd = fs.openSync(file, 'r+')
    fs.writeSync(
      fd,
      Buffer.alloc(pageSize, 0xff),
      0,
      pageSize,
      (root.ROOT - 1) * pageSize
    )
    fs.closeSync(fd)
    let before = fs.readFileSync(file)

    await expect(
      dbApi.initDatabaseAndLoadSchema(file, env.schemaFile(), env.zapVersion())
    ).rejects.toThrow(/The file is damaged/)
    expect(fs.readFileSync(file).equals(before)).toBe(true)
    expect(fs.existsSync(file + '~')).toBe(false)

    let text = env.sqliteTestFile('recent-files-not-a-database')
    fs.writeFileSync(text, 'not a database '.repeat(100))
    await expect(
      dbApi.initDatabaseAndLoadSchema(text, env.schemaFile(), env.zapVersion())
    ).rejects.toThrow(/The file is damaged/)
    expect(fs.readFileSync(text, 'utf8')).toBe('not a database '.repeat(100))
  },
  timeout.medium()
)
