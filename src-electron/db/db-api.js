// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides generic DB functions for performing SQL queries.
 * 
 * @module JS API: low level database access
 */

import { logError, logInfo } from '../main-process/env.js'

var sq = require('sqlite3')
var fs = require('fs')

/**
 * Returns a promise to begin a transaction
 *
 * @export
 * @param {*} db
 * @returns A promise that resolves without an argument and rejects with an error from BEGIN TRANSACTION query.
 */
export function dbBeginTransaction(db) {
    return new Promise((resolve, reject) => {
        db.run("BEGIN TRANSACTION", [], function (err) {
            if (err) {
                logError('Failed to BEGIN TRANSACTION')
                reject(err)
            } else {
                logInfo('Executed BEGIN TRANSACTION')
                resolve()
            }
        })
    })
}
/**
 * Returns a promise to execute a commit.
 *
 * @export
 * @param {*} db
 * @returns A promise that resolves without an argument or rejects with an error from COMMIT query.
 */
export function dbCommit(db) {
    return new Promise((resolve, reject) => {
        db.run("COMMIT", [], function (err) {
            if (err) {
                logError('Failed to COMMIT')
                reject(err)
            } else {
                logInfo('Executed COMMIT')
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
export function dbRemove(db, query, args) {
    return new Promise((resolve,reject) => {
        db.run(query, args, function (err) {
            if (err) {
                logError(`Failed remove: ${query}: ${args}`)
                reject(err)
            } else {
                logInfo(`Executed remove: ${query}: ${args}`)
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
 * @returns A promise that resolves without an argument, or rejects with an error from the query.
 */
export function dbUpdate(db, query, args) {
    return new Promise((resolve, reject) => {
        db.run(query, args, function (err) {
            if (err) {
                logError(`Failed update: ${query}: ${args}`)
                reject(err)
            } else {
                logInfo(`Executed update: ${query}: ${args}`)
                resolve()
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
export function dbInsert(db, query, args, enabledLogging = true) {
    return new Promise((resolve, reject) => {
        db.run(query, args, function (err) {
            if (err) {
                if ( enabledLogging)
                    logError(`Failed insert: ${query}: ${args}`)
                reject(err)
            } else {
                if ( enabledLogging)
                    logInfo(`Executed insert: ${query}: ${args} => rowid: ${this.lastID}`)
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
export function dbAll(db, query, args) {
    return new Promise((resolve, reject) => {
        db.all(query, args, (err, rows) => {
            if (err) {
                logInfo(`Failed all: ${query}: ${args}`)
                reject(err)
            } else {
                logInfo(`Executed all: ${query}: ${args}`)
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
export function dbGet(db, query, args) {
    return new Promise((resolve, reject) => {
        db.get(query, args, (err, row) => {
            if (err) {
                logError(`Failed get: ${query}: ${args}`)
                reject(err)
            } else {
                logInfo(`Executed get: ${query}: ${args}`)
                resolve(row)
            }
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
export function dbMultiInsert(db, sql, arrayOfArrays) {
    return new Promise((resolve, reject) => {
        logInfo(`Preparing statement: ${sql} to insert ${arrayOfArrays.length} records.`)
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


/**
 * Returns a promise that will resolve when the database in question is closed.
 * Rejects with an error if closing fails.
 *
 * @export
 * @param {*} database
 * @returns A promise that resolves without an argument or rejects with error from the database closing.
 */
export function closeDatabase(database) {
    return new Promise((resolve, reject) => {
        database.close((err) => {
            if (err) return reject(err)
            resolve()
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
export function initDatabase(sqlitePath) {
    return new Promise((resolve, reject) => {

        logInfo('Temporarily, we are forcibly deleting the sqlite file every time we start up the app. This goes away after a while, obviously.')
        if (fs.existsSync(sqlitePath)) {
            fs.unlinkSync(sqlitePath)
        }
        var db = new sq.Database(sqlitePath,
            (err) => {
                if (err) {
                    return reject(err)
                } else {
                    logInfo(`Connected to the database at: ${sqlitePath}`)
                    resolve(db)
                }
            }
        )
    })
}
/**
 * Returns a promise to insert or replace a version of the application into the database.
 *
 * @param {*} db
 * @param {*} version
 * @returns  A promise that resolves with a rowid of created setting row or rejects with error if something goes wrong.
 */
function insertOrReplaceVersion(db, version) {
    return dbInsert(db, "INSERT OR REPLACE INTO SETTING ( CATEGORY, KEY, VALUE ) VALUES ( 'APP', 'VERSION', ?)", version)
}

/**
 * Returns a promise to load schema into a blank database, and inserts a version to the settings table.j
 *
 * @export
 * @param {*} db
 * @param {*} schema
 * @param {*} appVersion
 * @returns A promise that resolves with the same db that got passed in, or rejects with an error.
 */
export function loadSchema(db, schema, appVersion) {
    return new Promise((resolve, reject) => {
        fs.readFile(schema, 'utf8', (err, data) => {
            if (err) return reject(err)
            db.serialize(() => {
                logInfo('Populate schema.')
                db.exec(data, (err) => {
                    if (err) {
                        logError('Failed to populate schema')
                        logError(err)
                    }
                    resolve(db)
                })
            })
        });
    })
    .then(db => insertOrReplaceVersion(db, appVersion))
    .then(rowid => Promise.resolve(db))
}