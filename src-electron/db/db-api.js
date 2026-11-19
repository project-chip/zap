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

/**
 * This module provides generic DB functions for performing SQL queries.
 *
 * @module JS API: low level database access
 */

const sqlite = require('sqlite3')
const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const env = require('../util/env')
const util = require('../util/util.js')
const asyncReporting = require('../util/async-reporting.js')
const sessionTimers = require('../main-process/session-timers.js')
const dbEnum = require('../../src-shared/db-enum.js')
const dbCache = require('./db-cache')
const dbMapping = require('./db-mapping.js')

// This is a SQLITE specific thing. With SQLITE databases,
// we can't have multiple transactions. So this mechanism
// here is handling this.
// If this code ever runs against a database engine that
// supports multiple transactions, this can all go away.
//
let inTransaction = false

/**
 * Begin Database transaction.
 * @param {*} db
 * @param {*} resolve
 * @param {*} reject
 */
function executeBeginTransaction(db, resolve, reject) {
  db.run('BEGIN TRANSACTION', [], function (err) {
    if (err) {
      env.logError('Failed to BEGIN TRANSACTION')
      reject(util.toErrorObject(err))
    } else {
      env.logSql('Executed BEGIN TRANSACTION')
      resolve()
    }
  })
}

/**
 * Delay database transaction.
 * @param {*} db
 * @param {*} resolve
 * @param {*} reject
 */
function delayBeginTransaction(db, resolve, reject) {
  let cnt = 0
  let interval = setInterval(() => {
    if (inTransaction) {
      cnt++
      if (cnt > 100) {
        reject(
          util.toErrorObject(
            'Waited for 10s for transaction to relinquish, but it did not.'
          )
        )
      }
    } else {
      clearInterval(interval)
      executeBeginTransaction(db, resolve, reject)
    }
  }, 100)
}

/**
 * Returns a promise to begin a transaction. The beginning of the
 * transaction will be delayed for up to 5 seconds, checking every
 * 1/10th of a second of previous transaction is already finished.
 *
 * After 5 seconds, the code gives up and rejects the promise.
 *
 * This is to allow simultaneous calls to this function, even though
 * SQLite does not allow for simultaneous transactions.
 *
 * So use transactions responsibly.
 *
 * @export
 * @param {*} db
 * @returns A promise that resolves without an argument and rejects with an error from BEGIN TRANSACTION query.
 */
async function dbBeginTransaction(db) {
  return new Promise((resolve, reject) => {
    if (inTransaction) {
      delayBeginTransaction(db, resolve, reject)
    } else {
      inTransaction = true
      executeBeginTransaction(db, resolve, reject)
    }
  })
}

/**
 * Returns a promise to execute a commit.
 *
 * @export
 * @param {*} db
 * @returns A promise that resolves without an argument or rejects with an error from COMMIT query.
 */
async function dbCommit(db) {
  return new Promise((resolve, reject) => {
    db.run('COMMIT', [], function (err) {
      if (err) {
        env.logError('Failed to COMMIT')
        reject(util.toErrorObject(err))
      } else {
        env.logSql('Executed COMMIT')
        inTransaction = false
        resolve()
      }
    })
  })
}

/**
 * Not an async function, simply returns a boolean value whether
 * there is a currently active transaction.
 *
 * @returns true if transaction is active, false if not.
 */
function isTransactionActive() {
  return inTransaction
}

/**
 * Returns a promise to execute a rollback of a transaction.
 *
 * @export
 * @param {*} db
 * @returns A promise that resolves without an argument or rejects with an error from ROLLBACK query.
 */
async function dbRollback(db) {
  return new Promise((resolve, reject) => {
    db.run('ROLLBACK', [], function (err) {
      if (err) {
        env.logError('Failed to ROLLBACK')
        reject(util.toErrorObject(err))
      } else {
        env.logSql('Executed ROLLBACK')
        inTransaction = false
        resolve()
      }
    })
  })
}

/**
 * Returns a promise to execute a DELETE FROM query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolve with the number of delete rows, or rejects with an error from query.
 */
async function dbRemove(db, query, args) {
  return new Promise((resolve, reject) => {
    db.run(query, args, function (err) {
      if (err) {
        env.logError(`Failed remove: ${query}: ${args}`)
        reject(util.toErrorObject(err))
      } else {
        env.logSql('Executed remove', query, args)
        resolve(this.changes)
      }
    })
  })
}

/**
 * Returns a promise to execute an update query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves with a number of changed rows, or rejects with an error from the query.
 */
async function dbUpdate(db, query, args) {
  return new Promise((resolve, reject) => {
    db.run(query, args, function (err) {
      if (err) {
        env.logError(`Failed update: ${query}: ${args}`)
        reject(util.toErrorObject(err))
      } else {
        env.logSql('Executed update', query, args)
        resolve(this.changes)
      }
    })
  })
}

/**
 * Returns a promise to execute an insert query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves with the rowid from the inserted row, or rejects with an error from the query.
 */
async function dbInsert(db, query, args) {
  return new Promise((resolve, reject) => {
    db.run(query, args, function (err) {
      if (err) {
        env.logError(`Failed insert: ${query}: ${args} : ${err}`)
        reject(util.toErrorObject(err))
      } else {
        env.logSql('Executed insert', query, args)
        resolve(this.lastID)
      }
    })
  })
}

/**
 * Returns a promise to execute a query to perform a select that returns all rows that match a query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves with the rows that got retrieved from the database, or rejects with an error from the query.
 */
async function dbAll(db, query, args) {
  return new Promise((resolve, reject) => {
    db.all(query, args, (err, rows) => {
      if (err) {
        env.logError(`Failed all: ${query}: ${args} : ${err}`)
        reject(util.toErrorObject(err))
      } else {
        env.logSql('Executed all', query, args)
        resolve(rows)
      }
    })
  })
}

/**
 * Returns a promise to execute a query to perform a select that returns first row that matches a query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves with a single row that got retrieved from the database, or rejects with an error from the query.
 */
async function dbGet(db, query, args, reportError = true) {
  return new Promise((resolve, reject) => {
    db.get(query, args, (err, row) => {
      if (err) {
        if (reportError) env.logError(`Failed get: ${query}: ${args} : ${err}`)
        reject(util.toErrorObject(err))
      } else {
        env.logSql('Executed get', query, args)
        resolve(row)
      }
    })
  })
}

/**
 * Returns a promise to perform a prepared statement, using data from array for SQL parameters.
 * It resolves with an array of rows, containing the data, or rejects with an error.
 *
 * @param {*} db
 * @param {*} sql
 * @param {*} arrayOfArrays
 */
async function dbMultiSelect(db, sql, arrayOfArrays) {
  return new Promise((resolve, reject) => {
    env.logSql('Preparing select', sql, arrayOfArrays.length)
    let rows = []
    let statement = db.prepare(sql, function (err) {
      if (err) reject(util.toErrorObject(err))
      for (const singleArray of arrayOfArrays) {
        statement.get(singleArray, (err2, row) => {
          if (err2) {
            reject(util.toErrorObject(err2))
          } else {
            rows.push(row)
          }
        })
      }
      statement.finalize((err3) => {
        if (err3) {
          reject(util.toErrorObject(err3))
        } else {
          resolve(rows)
        }
      })
    })
  })
}

/**
 * Returns a promise to perfom a prepared statement, using data from array for SQL parameters.
 * It resolves with an array of rowids, or rejects with an error.
 *
 * @export
 * @param {*} db
 * @param {*} sql
 * @param {*} arrayOfArrays
 * @returns A promise that resolves with the array of rowids for the rows that got inserted, or rejects with an error from the query.
 */
async function dbMultiInsert(db, sql, arrayOfArrays) {
  return new Promise((resolve, reject) => {
    env.logSql('Preparing insert', sql, arrayOfArrays.length)
    let lastIds = []
    let statement = db.prepare(sql, function (err) {
      if (err) {
        let errMessage =
          'Error while preparing sql statement: ' + sql + ', ' + err
        reject(util.toErrorObject(err, errMessage))
      }
      for (const singleArray of arrayOfArrays) {
        statement.run(singleArray, (err2) => {
          if (err2) {
            let err2Message =
              'Error while running sql statement: ' +
              sql +
              ', values: ' +
              singleArray +
              ', ' +
              err2
            reject(util.toErrorObject(err2, err2Message))
          }
          lastIds.push(this.lastID)
        })
      }
      statement.finalize((err3) => {
        if (err3) {
          let err3Message =
            'Error while finalizing sql statement: ' + sql + ', ' + err3
          reject(util.toErrorObject(err3, err3Message))
        }
        resolve(lastIds)
      })
    })
  })
}

/**
 * Returns a promise that will resolve when the database in question is closed.
 * Rejects with an error if closing fails.
 *
 * @param {*} database
 * @returns A promise that resolves without an argument or rejects with error from the database closing.
 */
async function closeDatabase(database) {
  sessionTimers.deinitDatabaseSessionTimers(database)
  database._closed = true // Mark the database as closed
  asyncReporting.stopAsyncReporting()
  dbCache.clear()
  return new Promise((resolve, reject) => {
    env.logSql('About to close database.')
    database.close((err) => {
      if (err) return reject(util.toErrorObject(err))
      env.logSql('Database is closed.')
      resolve()
    })
  })
}

/**
 * Imediatelly closes the database.
 *
 * @param {*} database
 */
function closeDatabaseSync(database) {
  sessionTimers.deinitDatabaseSessionTimers(database)
  database._closed = true // Mark the database as closed
  asyncReporting.stopAsyncReporting()
  dbCache.clear()
  env.logSql('About to close database.')
  database.close((err) => {
    if (err) console.log(`Database close error: ${err}`)
    env.logSql('Database is closed.')
  })
}

/**
 * Create in-memory database.
 *
 *  @returns Promise that resolve with the Db.
 */
async function initRamDatabase() {
  dbCache.clear()
  return new Promise((resolve, reject) => {
    let db = new sqlite.Database(':memory:', (err) => {
      if (err) {
        reject(util.toErrorObject(err))
      } else {
        env.logSql(`Connected to the RAM database.`)
        resolve(db)
      }
    })
  })
}

/**
 * Returns a promise to initialize a database.
 *
 * @export
 * @param {*} sqlitePath
 * @returns A promise that resolves with the database object that got created, or rejects with an error if something went wrong.
 */
async function initDatabase(sqlitePath) {
  dbCache.clear()
  return new Promise((resolve, reject) => {
    let db = new sqlite.Database(sqlitePath, (err) => {
      if (err) {
        reject(util.toErrorObject(err))
      } else {
        env.logSql(`Connected to the database at: ${sqlitePath}`)
        resolve(db)
      }
    })
  })
}

/**
 * Returns a promise to insert or replace a setting into the database.
 *
 * @param {*} db
 * @param {*} version
 * @returns  A promise that resolves with a rowid of created setting row or rejects with error if something goes wrong.
 */
async function insertOrReplaceSetting(db, category, key, value) {
  return dbInsert(
    db,
    'INSERT OR REPLACE INTO SETTING ( CATEGORY, KEY, VALUE ) VALUES ( ?, ?, ? )',
    [category, key, value]
  )
}

/**
 * Updates SETTING table with values selected
 *
 * @param {*} db
 * @param {*} rows
 * @returns  A promise that resolves with the SETTING table being repopulated
 */
async function updateSetting(db, rows) {
  for (let i = 0; i < rows.length; i++) {
    await dbInsert(
      db,
      'INSERT OR REPLACE INTO SETTING ( CATEGORY, KEY, VALUE ) VALUES ( ?, ?, ? )',
      [rows[i].category, rows[i].key, rows[i].value]
    )
  }
}

/**
 * Returns a promise resolving the entire SETTING table
 *
 * @param {*} db
 * @returns  A promise resolving the entire SETTING table
 */
async function selectSettings(db) {
  // SETTING is created after PACKAGE. Under the lock taken by
  // initDatabaseAndLoadSchema, a missing table means an earlier reload was
  // abandoned, so there are no rows to copy. loadSchema refuses to continue
  // when a backup of the previous database is still present.
  if (!(await tableExists(db, 'SETTING'))) return []
  let rows = []
  rows = await dbAll(db, 'SELECT CATEGORY,KEY,VALUE FROM SETTING')
  return rows.map(dbMapping.map.settings)
}

/**
 * Returns a promise resolving the value of one setting, or null if it is not set.
 *
 * @param {*} db
 * @param {*} category
 * @param {*} key
 * @returns A promise that resolves with the setting value or null.
 */
async function selectSetting(db, category, key) {
  let row = await dbGet(
    db,
    'SELECT VALUE FROM SETTING WHERE CATEGORY = ? AND KEY = ?',
    [category, key]
  )
  return row == null ? null : row.VALUE
}

/**
 * Returns a promise resolving to true if a table exists in the database.
 *
 * @param {*} db
 * @param {*} tableName
 * @returns A promise that resolves with true or false.
 */
async function tableExists(db, tableName) {
  let row = await dbGet(
    db,
    "SELECT NAME FROM sqlite_master WHERE TYPE = 'table' AND NAME = ?",
    [tableName]
  )
  return row != null
}

/**
 * Returns a promise resolving the entire RECENT_FILE table.
 * Resolves with an empty array when the table does not exist yet,
 * which is the case for databases created before the table was added.
 *
 * @param {*} db
 * @returns A promise resolving the entire RECENT_FILE table
 */
async function selectRecentFiles(db) {
  if (!(await tableExists(db, 'RECENT_FILE'))) return []
  let rows = await dbAll(db, 'SELECT PATH, LAST_USED FROM RECENT_FILE')
  return rows.map(dbMapping.map.recentFile)
}

/**
 * Inserts rows into the RECENT_FILE table.
 *
 * @param {*} db
 * @param {*} rows array of objects containing 'path' and 'lastUsed'
 * @returns A promise that resolves when the rows are inserted.
 */
async function insertRecentFiles(db, rows) {
  if (rows.length == 0) return
  return dbMultiInsert(
    db,
    'INSERT OR REPLACE INTO RECENT_FILE ( PATH, LAST_USED ) VALUES ( ?, ? )',
    rows.map((row) => [row.path, row.lastUsed])
  )
}

/**
 * Checks the state of schema.
 *
 * The decision uses the checksum, not the schema file's path. The desktop
 * app and zap-cli resolve that file to different paths, so a path comparison
 * makes the second one rebuild a database the first one is still using.
 *
 * @param {*} db
 * @param {*} filePath kept for callers; the path is not part of the decision
 * @param {*} crc checksum of the schema file contents
 * @returns object containing "mustLoad" and "hasSchema" elements.
 */
async function determineIfSchemaShouldLoad(db, filePath, crc) {
  let result = {
    mustLoad: true,
    hasSchema: false
  }
  try {
    let row = await dbGet(
      db,
      'SELECT CRC FROM PACKAGE WHERE TYPE = ? AND CRC = ?',
      [dbEnum.packageType.sqlSchema, crc],
      false
    )
    result.mustLoad = row == null
    result.hasSchema = true
    return result
  } catch (err) {
    // Only a file without PACKAGE is blank. Running the schema over a file
    // that failed for another reason, such as damage, stops partway through
    // and leaves it in a state no later start can load.
    if (!isMissingTableError(err)) throw err
    result.mustLoad = true
    result.hasSchema = false
  }
  return result
}

/**
 * Tells whether an error means a queried table does not exist.
 *
 * @param {*} err
 * @returns {boolean}
 */
function isMissingTableError(err) {
  return (
    err != null &&
    err.code === 'SQLITE_ERROR' &&
    /no such table/.test(String(err.message))
  )
}

/**
 * Tells whether an error means SQLite cannot read the file as a database.
 *
 * @param {*} err
 * @returns {boolean}
 */
function isDamagedDatabaseError(err) {
  return (
    err != null &&
    (err.code === 'SQLITE_CORRUPT' || err.code === 'SQLITE_NOTADB')
  )
}

/**
 * Reports a problem that stops the database from loading, then throws it.
 * The message goes to the log and stderr, and to a dialog when a ZAP window
 * is being opened.
 *
 * @param {string} title
 * @param {string} message
 */
function stopDatabaseLoad(title, message) {
  env.logError(message)
  env.printToStderr(message)
  // The packaged executable also runs headless commands, so the Electron
  // version is not enough to decide. A dialog there would wait for a
  // click and hold unattended generation. Stderr already has the error.
  if (env.isInteractiveUi()) {
    require('electron').dialog.showErrorBox(title, message)
  }
  throw new Error(message)
}

/**
 * Update the CRC of the sql schema file.
 * @param {*} db
 * @param {*} filePath
 * @param {*} crc
 * @returns promise of insert transaction.
 */
async function updateCurrentSchemaCrc(db, filePath, crc) {
  return dbInsert(
    db,
    'INSERT OR REPLACE INTO PACKAGE (PATH, CRC, TYPE) VALUES ( ?, ?, ? )',
    [filePath, crc, dbEnum.packageType.sqlSchema]
  )
}

/**
 * Load SQL Schema
 * @param {*} db
 * @param {*} schemaContent
 * @returns Promise of loaded schema
 */
async function performSchemaLoad(db, schemaContent) {
  return new Promise((resolve, reject) => {
    env.logSql('Loading schema.')
    db.serialize(() => {
      db.exec(schemaContent, (err) => {
        if (err) {
          env.logError('Failed to populate schema')
          env.logError(err)
          reject(util.toErrorObject(err))
        }
        resolve()
      })
    })
  })
}

/**
 * Returns a promise to load schema into a blank database, and inserts a version to the settings table.
 *
 * When the schema checksum changed and the database already has a schema,
 * the old database file is moved aside and a new one is created. Rows of the
 * SETTING and RECENT_FILE tables are read from the old database before it is
 * closed and written into the new one, so they survive the reload.
 *
 * If that reload stopped after PACKAGE was created and before SETTING, and
 * the previous database is still beside this file, reloading stops. Continuing
 * would replace that previous database.
 *
 * @export
 * @param {*} db
 * @param {*} schemaPath
 * @param {*} zapVersion
 * @returns A promise that resolves with the same db that got passed in, or rejects with an error.
 */
async function loadSchema(db, schemaPath, zapVersion, sqliteFile = null) {
  let schemaFileContent = await fsp.readFile(schemaPath, 'utf8')
  let settingRows = []
  let recentFileRows = []
  let context = {
    filePath: schemaPath,
    data: schemaFileContent,
    crc: util.checksum(schemaFileContent)
  }
  let schemaStatus
  try {
    schemaStatus = await determineIfSchemaShouldLoad(
      db,
      context.filePath,
      context.crc
    )
  } catch (err) {
    if (sqliteFile == null || !isDamagedDatabaseError(err)) throw err
    stopDatabaseLoad(
      'ZAP database is damaged',
      `ZAP cannot read ${sqliteFile}: ${err.message}. The file is damaged. This happens when the file is moved or rebuilt while another ZAP process still has it open, for example a ZAP window and zap-cli from different versions running at the same time, or when ZAP is stopped while it writes the file. The file holds loaded ZCL data, saved settings and recent files. Your .zap files are kept elsewhere and are safe. Close every ZAP window and zap-cli, move ${sqliteFile} aside (also ${sqliteFile}-journal if it exists), and start again. ZAP builds a new file, which starts without saved settings and recent files.`
    )
  }
  if (schemaStatus.mustLoad && schemaStatus.hasSchema) {
    let backupFile = sqliteFile == null ? null : sqliteFile + '~'
    if (
      !(await tableExists(db, 'SETTING')) &&
      backupFile != null &&
      fs.existsSync(backupFile)
    ) {
      stopDatabaseLoad(
        'ZAP database was not reloaded',
        `ZAP stopped reloading ${sqliteFile}. That file has no SETTING table, and the previous database is still at ${backupFile}. A schema reload moves the good database aside and builds a new one. This file was left unfinished, which happens when that rebuild is interrupted. The usual cause is the ZAP window and zap-cli using this file at the same time. Continuing would delete the previous database, including saved settings and recent files. Close any other ZAP window, rename ${backupFile} over ${sqliteFile}, and start again.`
      )
    }
    settingRows = await selectSettings(db)
    recentFileRows = await selectRecentFiles(db)
    await closeDatabase(db)
    if (sqliteFile != null) util.createBackupFile(sqliteFile)
  }
  if (schemaStatus.mustLoad && schemaStatus.hasSchema) {
    if (sqliteFile == null) {
      db = await initRamDatabase()
    } else {
      db = await initDatabase(sqliteFile)
    }
  }
  if (schemaStatus.mustLoad) {
    await performSchemaLoad(db, context.data)
    await updateCurrentSchemaCrc(db, context.filePath, context.crc)
    await updateSetting(db, settingRows)
    await insertRecentFiles(db, recentFileRows)
  }

  await insertOrReplaceSetting(
    db,
    dbEnum.settingCategory.app,
    dbEnum.settingKey.version,
    zapVersion.version
  )
  if ('hash' in zapVersion) {
    await insertOrReplaceSetting(
      db,
      dbEnum.settingCategory.app,
      dbEnum.settingKey.hash,
      zapVersion.hash
    )
  }
  if ('date' in zapVersion) {
    await insertOrReplaceSetting(
      db,
      dbEnum.settingCategory.app,
      dbEnum.settingKey.date,
      zapVersion.date
    )
  }
  return db
}

/**
 * Opens the connection that holds a lock. It is kept apart from initDatabase
 * and closeDatabase, which reset caches and reporting for the whole process.
 *
 * @param {string} lockFile
 * @returns {Promise<*>} the connection.
 */
function openLockDatabase(lockFile) {
  return new Promise((resolve, reject) => {
    let db = new sqlite.Database(lockFile, (err) =>
      err ? reject(util.toErrorObject(err)) : resolve(db)
    )
  })
}

/**
 * Closes a connection opened by openLockDatabase.
 *
 * @param {*} db
 * @returns {Promise<void>}
 */
function closeLockDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(util.toErrorObject(err)) : resolve()))
  })
}

/**
 * Runs one statement on a lock connection.
 *
 * @param {*} db
 * @param {string} sql
 * @returns {Promise<void>}
 */
function runOnLockDatabase(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, [], (err) =>
      err ? reject(util.toErrorObject(err)) : resolve()
    )
  })
}

/**
 * Runs an async function while this process holds an exclusive lock on
 * lockFile, so that processes sharing a database take turns.
 *
 * The lock is an exclusive SQLite transaction on a separate, empty database
 * file. The operating system holds it for the connection, so it is released
 * when the owner closes it or exits for any reason, including a crash. No
 * process ever deletes the lock file, so one owner cannot remove another's
 * lock. Waiters block in SQLite's busy handler until the lock is free or
 * timeoutMs passes.
 *
 * @param {string} lockFile
 * @param {Function} fn async function to run under the lock.
 * @param {number} timeoutMs how long to wait for another owner.
 * @returns {Promise<*>} whatever fn resolves to.
 */
async function withDatabaseLock(lockFile, fn, timeoutMs = 120000) {
  fs.mkdirSync(path.dirname(lockFile), { recursive: true })
  let lockDb = await openLockDatabase(lockFile)
  try {
    lockDb.configure('busyTimeout', timeoutMs)
    await runOnLockDatabase(lockDb, 'BEGIN EXCLUSIVE')
  } catch (err) {
    await closeLockDatabase(lockDb)
    if (err.code === 'SQLITE_BUSY') {
      throw new Error(
        `Timed out after ${timeoutMs / 1000}s waiting for ${lockFile}. Another ZAP process is using this state directory. Close it and try again.`
      )
    }
    throw err
  }
  try {
    return await fn()
  } finally {
    try {
      await runOnLockDatabase(lockDb, 'ROLLBACK')
    } finally {
      await closeLockDatabase(lockDb)
    }
  }
}

/**
 * Init database and load the schema.
 *
 * Opening the file, checking its schema and rebuilding it happen under a lock
 * beside the database. A second process starting at the same time waits for
 * the first to finish building, then finds a complete schema and reuses it.
 * Without the lock it could see PACKAGE before SETTING exist and move the file
 * while the first process is still writing to it.
 *
 * @param {*} sqliteFile
 * @param {*} schemaFile
 * @param {*} zapVersion
 * @returns Promise that resolves into the database object.
 */
async function initDatabaseAndLoadSchema(sqliteFile, schemaFile, zapVersion) {
  return withDatabaseLock(sqliteFile + '-lock', async () => {
    let db = await initDatabase(sqliteFile)
    return loadSchema(db, schemaFile, zapVersion, sqliteFile)
  })
}

/**
 * Returns the data that should be stored into the DB column, from the passed JS boolean.
 *
 * @param {*} value
 * @returns Value to be stored into the database.
 */
function toDbBool(value) {
  return value ? 1 : 0
}

/**
 * Returns a true or false JS boolean from the value that was read in the database.
 *
 * @param {*} value
 * @return value to be used in JS after reading value from database.
 */
function fromDbBool(value) {
  return value == 1
}

/**
 *
 * @param {*} value
 * @returns Given value in the form of string
 */
function toInClause(value) {
  return value ? value.toString() : value
}

exports.dbBeginTransaction = dbBeginTransaction
exports.dbCommit = dbCommit
exports.isTransactionActive = isTransactionActive
exports.dbRollback = dbRollback
exports.dbRemove = dbRemove
exports.dbUpdate = dbUpdate
exports.dbInsert = dbInsert
exports.dbAll = dbAll
exports.dbGet = dbGet
exports.dbMultiSelect = dbMultiSelect
exports.dbMultiInsert = dbMultiInsert
exports.closeDatabase = closeDatabase
exports.closeDatabaseSync = closeDatabaseSync
exports.initRamDatabase = initRamDatabase
exports.initDatabase = initDatabase
exports.loadSchema = loadSchema
exports.initDatabaseAndLoadSchema = initDatabaseAndLoadSchema
exports.withDatabaseLock = withDatabaseLock
exports.insertOrReplaceSetting = insertOrReplaceSetting
exports.selectSetting = selectSetting
exports.toDbBool = toDbBool
exports.fromDbBool = fromDbBool
exports.toInClause = toInClause
