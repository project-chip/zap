// Copyright (c) 2020 Silicon Labs. All rights reserved.

/**
 * This module provides generic queries.
 *
 * @module DB API: generic queries against the database.
 */
import { dbGet, dbInsert } from './db-api.js'

/**
 * Simple query that returns number of rows in a given table.
 *
 * @export
 * @param {*} db
 * @param {*} table
 * @returns a promise that resolves into the count of the rows in the table.
 */
export function selectCountFrom(db, table) {
  return dbGet(db, `SELECT COUNT(*) FROM ${table}`).then((x) => x['COUNT(*)'])
}

/**
 * Writes the saved location of the file.
 *
 * @export
 * @param {*} db
 * @param {*} filePath
 * @param {*} category
 */
export function insertFileLocation(db, filePath, category) {
  return dbInsert(
    db,
    'INSERT OR REPLACE INTO FILE_LOCATION (CATEGORY, FILE_PATH, ACCESS_TIME) VALUES (?,?,?)',
    [category, filePath, Date.now()]
  )
}

/**
 * Retrieves the saved location from a file
 *
 * @export
 * @param {*} db
 * @param {*} category
 */
export function selectFileLocation(db, category) {
  return dbGet(db, 'SELECT FILE_PATH FROM FILE_LOCATION WHERE CATEGORY = ?', [
    category,
  ]).then((row) => {
    if (row == null) {
      return ''
    } else {
      return row.FILE_PATH
    }
  })
}
