// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides queries related to packages.
 * 
 * @module DB API: package-based queries.
 */
import { dbGet, dbInsert } from './db-api.js'

/**
 * Checks if the package with a given path exists and executes appropriate action.
 *
 * @export
 * @param {*} db
 * @param {*} path Path of a file to check.
 * @param {*} crcCallback This callback is executed if the row exists, with arguments (CRC, PACKAGE_ID)
 * @param {*} noneCallback This callback is executed if the row does not exist.
 */
export function forPathCrc(db, path, crcCallback, noneCallback) {
    dbGet(db, "SELECT PACKAGE_ID, PATH, CRC FROM PACKAGE WHERE PATH = ?", [path]).then(row => {
        if (row == null) {
            noneCallback()
        } else {
            crcCallback(row.CRC, row.PACKAGE_ID)
        }
    })
}

/**
 * Resolves with a CRC or null for a given path.
 *
 * @export
 * @param {*} db
 * @param {*} path
 * @returns Promise resolving with a CRC or null.
 */
export function getPathCrc(db, path) {
    return dbGet(db, "SELECT CRC FROM PACKAGE WHERE PATH = ?", [path]).then(row => new Promise((resolve, reject) => {
        if (row == null) {
            resolve(null)
        } else {
            resolve(row.CRC)
        }
    }))
}

/**
 * Inserts a given path CRC combination into the table.
 * 
 * @param {*} db 
 * @param {*} path Path of the file.
 * @param {*} crc CRC of the file.
 * @returns Promise of an insertion.
 */
export function insertPathCrc(db, path, crc) {
    return dbInsert(db, "INSERT INTO PACKAGE ( PATH, CRC ) VALUES (?, ?)", [path, crc])
}

/**
 * Updates a CRC in the table.
 *
 * @export
 * @param {*} db
 * @param {*} path
 * @param {*} crc
 * @returns Promise of an update.
 */
export function updatePathCrc(db, path, crc) {
    return dbInsert(db, "UPDATE PACKAGE SET CRC = ? WHERE PATH = ?", [path, crc])
}
