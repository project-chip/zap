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
const env = require('../util/env.js')
const util = require('../util/util.js')
const dbEnum = require('./db-enum.js')

/**
 * Returns a promise to begin a transaction
 *
 * @export
 * @param {*} db
 * @returns A promise that resolves without an argument and rejects with an error from BEGIN TRANSACTION query.
 */
function dbBeginTransaction(db) {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', [], function (err) {
      if (err) {
        env.logError('Failed to BEGIN TRANSACTION')
        reject(err)
      } else {
        env.logSql('Executed BEGIN TRANSACTION')
        resolve()
      }
    })
  })
}
exports.dbBeginTransaction = dbBeginTransaction

/**
 * Returns a promise to execute a commit.
 *
 * @export
 * @param {*} db
 * @returns A promise that resolves without an argument or rejects with an error from COMMIT query.
 */
function dbCommit(db) {
  return new Promise((resolve, reject) => {
    db.run('COMMIT', [], function (err) {
      if (err) {
        env.logError('Failed to COMMIT')
        reject(err)
      } else {
        env.logSql('Executed COMMIT')
        resolve()
      }
    })
  })
}
exports.dbCommit = dbCommit

/**
 * Returns a promise to execute a DELETE FROM query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolve with the number of delete rows, or rejects with an error from query.
 */
function dbRemove(db, query, args) {
  return new Promise((resolve, reject) => {
    db.run(query, args, function (err) {
      if (err) {
        env.logError(`Failed remove: ${query}: ${args}`)
        reject(err)
      } else {
        env.logSql(`Executed remove: ${query}: ${args}`)
        resolve(this.changes)
      }
    })
  })
}
exports.dbRemove = dbRemove

/**
 * Returns a promise to execute an update query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves without an argument, or rejects with an error from the query.
 */
function dbUpdate(db, query, args) {
  return new Promise((resolve, reject) => {
    db.run(query, args, function (err) {
      if (err) {
        env.logError(`Failed update: ${query}: ${args}`)
        reject(err)
      } else {
        env.logSql(`Executed update: ${query}: ${args}`)
        resolve()
      }
    })
  })
}
exports.dbUpdate = dbUpdate

/**
 * Returns a promise to execute an insert query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves with the rowid from the inserted row, or rejects with an error from the query.
 */
function dbInsert(db, query, args) {
  return new Promise((resolve, reject) => {
    db.run(query, args, function (err) {
      if (err) {
        env.logError(`Failed insert: ${query}: ${args} : ${err}`)
        reject(err)
      } else {
        env.logSql(
          `Executed insert: ${query}: ${args} => rowid: ${this.lastID}`
        )
        resolve(this.lastID)
      }
    })
  })
}
exports.dbInsert = dbInsert

/**
 * Returns a promise to execute a query to perform a select that returns all rows that match a query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves with the rows that got retrieved from the database, or rejects with an error from the query.
 */
function dbAll(db, query, args) {
  return new Promise((resolve, reject) => {
    db.all(query, args, (err, rows) => {
      if (err) {
        env.logSql(`Failed all: ${query}: ${args} : ${err}`)
        reject(err)
      } else {
        env.logSql(`Executed all: ${query}: ${args}`)
        resolve(rows)
      }
    })
  })
}
exports.dbAll = dbAll

/**
 * Returns a promise to execute a query to perform a select that returns first row that matches a query.
 *
 * @export
 * @param {*} db
 * @param {*} query
 * @param {*} args
 * @returns A promise that resolves with a single row that got retrieved from the database, or rejects with an error from the query.
 */
function dbGet(db, query, args) {
  return new Promise((resolve, reject) => {
    db.get(query, args, (err, row) => {
      if (err) {
        env.logError(`Failed get: ${query}: ${args} : ${err}`)
        reject(err)
      } else {
        env.logSql(`Executed get: ${query}: ${args}`)
        resolve(row)
      }
    })
  })
}
exports.dbGet = dbGet

/**
 * Returns a promise to perform a prepared statement, using data from array for SQL parameters.
 * It resolves with an array of rows, containing the data, or rejects with an error.
 *
 * @param {*} db
 * @param {*} sql
 * @param {*} arrayOfArrays
 */
function dbMultiSelect(db, sql, arrayOfArrays) {
  return new Promise((resolve, reject) => {
    env.logSql(
      `Preparing statement: ${sql} to select ${arrayOfArrays.length} rows.`
    )
    var rows = []
    var statement = db.prepare(sql, function (err) {
      if (err) reject(err)
      for (const singleArray of arrayOfArrays) {
        statement.get(singleArray, (err, row) => {
          if (err) {
            reject(err)
          } else {
            rows.push(row)
          }
        })
      }
      statement.finalize((err) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  })
}
exports.dbMultiSelect = dbMultiSelect

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
function dbMultiInsert(db, sql, arrayOfArrays) {
  return new Promise((resolve, reject) => {
    env.logSql(
      `Preparing statement: ${sql} to insert ${arrayOfArrays.length} records.`
    )
    var lastIds = []
    var statement = db.prepare(sql, function (err) {
      if (err) reject(err)
      for (const singleArray of arrayOfArrays) {
        statement.run(singleArray, (err) => {
          if (err) reject(err)
          lastIds.push(this.lastID)
        })
      }
      statement.finalize((err) => {
        if (err) reject(err)
        resolve(lastIds)
      })
    })
  })
}
exports.dbMultiInsert = dbMultiInsert

/**
 * Returns a promise that will resolve when the database in question is closed.
 * Rejects with an error if closing fails.
 *
 * @export
 * @param {*} database
 * @returns A promise that resolves without an argument or rejects with error from the database closing.
 */
function closeDatabase(database) {
  return new Promise((resolve, reject) => {
    env.logSql('About to close database.')
    database.close((err) => {
      if (err) return reject(err)
      env.logSql('Database is closed.')
      resolve()
    })
  })
}
exports.closeDatabase = closeDatabase

/**
 * Returns a promise to initialize a database.
 *
 * @export
 * @param {*} sqlitePath
 * @returns A promise that resolves with the database object that got created, or rejects with an error if something went wrong.
 */
function initDatabase(sqlitePath) {
  return new Promise((resolve, reject) => {
    var db = new sqlite.Database(sqlitePath, (err) => {
      if (err) {
        return reject(err)
      } else {
        env.logSql(`Connected to the database at: ${sqlitePath}`)
        resolve(db)
      }
    })
  })
}
exports.initDatabase = initDatabase

/**
 * Returns a promise to insert or replace a setting into the database.
 *
 * @param {*} db
 * @param {*} version
 * @returns  A promise that resolves with a rowid of created setting row or rejects with error if something goes wrong.
 */
function insertOrReplaceSetting(db, category, key, value) {
  return dbInsert(
    db,
    'INSERT OR REPLACE INTO SETTING ( CATEGORY, KEY, VALUE ) VALUES ( ?, ?, ? )',
    [category, key, value]
  )
}

function determineIfSchemaShouldLoad(db, context) {
  return new Promise((resolve, reject) => {
    return dbGet(db, 'SELECT CRC FROM PACKAGE WHERE PATH = ?', [
      context.filePath,
    ])
      .then((row) => {
        if (row == null) {
          context.mustLoad = true
        } else {
          context.mustLoad = row.CRC != context.crc
        }
        resolve(context)
      })
      .catch((err) => {
        // Fall through, do nothing
        context.mustLoad = true
        resolve(context)
      })
  })
}

function updateCurrentSchemaCrc(db, context) {
  return new Promise((resolve, reject) => {
    dbInsert(
      db,
      'INSERT OR REPLACE INTO PACKAGE (PATH, CRC, TYPE) VALUES ( ?, ?, ? )',
      [context.filePath, context.crc, dbEnum.packageType.sqlSchema]
    ).then(() => {
      resolve(context)
    })
  })
}

/**
 * Returns a promise to load schema into a blank database, and inserts a version to the settings table.j
 *
 * @export
 * @param {*} db
 * @param {*} schemaPath
 * @param {*} appVersion
 * @returns A promise that resolves with the same db that got passed in, or rejects with an error.
 */
function loadSchema(db, schemaPath, appVersion) {
  return new Promise((resolve, reject) => {
    fs.readFile(schemaPath, 'utf8', (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
    .then((data) => util.calculateCrc({ filePath: schemaPath, data: data }))
    .then((context) => determineIfSchemaShouldLoad(db, context))
    .then(
      (context) =>
        new Promise((resolve, reject) => {
          if (context.mustLoad) {
            env.logSql('Schema load: must be done.')
            db.serialize(() => {
              db.exec(context.data, (err) => {
                if (err) {
                  env.logError('Failed to populate schema')
                  env.logError(err)
                  reject(err)
                }
                resolve(context)
              })
            })
          } else {
            env.logSql('Schema load: skipped.')
            resolve(context)
          }
        })
    )
    .then((context) => updateCurrentSchemaCrc(db, context))
    .then((context) => insertOrReplaceSetting(db, 'APP', 'VERSION', appVersion))
    .then((rowid) => Promise.resolve(db))
}
exports.loadSchema = loadSchema
