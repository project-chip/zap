// Copyright (c) 2020 Silicon Labs. All rights reserved.

/** 
 * This module provides session related queries.
 * 
 * @module DB API: session related queries.
 */
import { dbAll, dbGet, dbInsert, dbRemove, dbUpdate } from './db-api.js'

/**
 * Returns a promise that resolves into an array of objects containing 'sessionId', 'sessionKey' and 'creationTime'.
 *
 * @export
 * @param {*} db
 * @returns A promise of executing a query.
 */
export function getAllSessions(db) {
    return dbAll(db, "SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION", [])
        .then(rows => {
            if (rows == null) {
                reject()
            } else {
                var map = rows.map(row => {
                    return {
                        sessionId: row.SESSION_ID,
                        sessionKey: row.SESSION_KEY,
                        creationTime: row.CREATION_TIME
                    }
                })
                return Promise.resolve(map)
            }
        })
}

/**
 * Sets the session dirty flag to false.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves with the number of rows updated.
 */
export function setSessionClean(db, sessionId) {
    return dbUpdate(db, "UPDATE SESSION SET DIRTY = ? WHERE SESSION_ID = ?", [0, sessionId])
}
/**
 * Resolves with true or false, depending whether this session is dirty.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves into true or false, reflecting session dirty state.
 */
export function getSessionDirtyFlag(db, sessionId) {
    return dbGet(db, "SELECT DIRTY FROM SESSION WHERE SESSION_ID = ?", [sessionId])
        .then(row => {
            if ( row == null ) {
                reject()
            } else {
                return Promise.resolve(row.DIRTY)
            }
        })
}

/**
 * Executes the query for the dirty flag with a callback, not a promise.
 *
 * @export
 * @param {*} db
 * @param {*} windowId
 * @param {*} fn
 */
export function getWindowDirtyFlagWithCallback(db, windowId, fn) {
    db.get("SELECT DIRTY FROM SESSION WHERE SESSION_WINID = ?", [windowId], (err, row) => {
        if (err) {
            fn(false)
        } else {
            fn(row.DIRTY)
        }
    })
}

/**
 * Resolves into a session id, obtained from window id.
 *
 * @export
 * @param {*} db
 * @param {*} windowId
 * @returns A promise that resolves into an object containing sessionId, sessionKey and creationTime.
 */
export function getSessionIdFromWindowdId(db, windowId) {
    return dbGet(db, "SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION WHERE SESSION_WINID = ?", [windowId])
        .then(row => {
            if (row == null) {
                reject()
            } else {
                return Promise.resolve({
                    sessionId: row.SESSION_ID,
                    sessionKey: row.SESSION_KEY,
                    creationTime: row.CREATION_TIME
                })
            }
        })
}

/**
 * Returns a promise that will resolve into a sessionID created from a query.
 *
 * @export
 * @param {*} db
 * @param {*} sessionKey
 * @param {*} windowId
 * @returns promise that resolves into a session id.
 */
export function ensureZapSessionId(db, sessionKey, windowId) {
    return dbGet(db, "SELECT SESSION_ID FROM SESSION WHERE SESSION_KEY = ?", [sessionKey])
        .then(row => {
            if (row == null) {
                return dbInsert(db, "INSERT INTO SESSION (SESSION_KEY, SESSION_WINID, CREATION_TIME) VALUES (?,?,?)", [sessionKey, windowId, Date.now()])
            } else {
                return Promise.resolve(row.SESSION_ID)
            }
        })
}

/**
 * Promises to delete a session from the database, including all the rows that have the session as a foreign key.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise of a removal of session.
 */
export function deleteSession(db, sessionId) {
    return dbRemove(db, "DELETE FROM SESSION WHERE SESSION_ID = ?", [sessionId])
}

