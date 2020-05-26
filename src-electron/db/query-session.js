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
  return dbAll(
    db,
    'SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION',
    []
  ).then((rows) => {
    if (rows == null) {
      reject()
    } else {
      var map = rows.map((row) => {
        return {
          sessionId: row.SESSION_ID,
          sessionKey: row.SESSION_KEY,
          creationTime: row.CREATION_TIME,
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
  return dbUpdate(db, 'UPDATE SESSION SET DIRTY = ? WHERE SESSION_ID = ?', [
    0,
    sessionId,
  ])
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
  return dbGet(db, 'SELECT DIRTY FROM SESSION WHERE SESSION_ID = ?', [
    sessionId,
  ]).then((row) => {
    if (row == null) {
      reject()
    } else {
      return row.DIRTY
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
  db.get(
    'SELECT DIRTY FROM SESSION WHERE SESSION_WINID = ?',
    [windowId],
    (err, row) => {
      if (err) {
        fn(false)
      } else {
        fn(row.DIRTY)
      }
    }
  )
}

/**
 * Resolves into a session id, obtained from window id.
 *
 * @export
 * @param {*} db
 * @param {*} windowId
 * @returns A promise that resolves into an object containing sessionId, sessionKey and creationTime.
 */
export function getSessionInfoFromWindowId(db, windowId) {
  return dbGet(
    db,
    'SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION WHERE SESSION_WINID = ?',
    [windowId]
  ).then((row) => {
    if (row == null) {
      reject()
    } else {
      return {
        sessionId: row.SESSION_ID,
        sessionKey: row.SESSION_KEY,
        creationTime: row.CREATION_TIME,
      }
    }
  })
}

/**
 * Returns a promise that will resolve into a sessionID created from a query.
 *
 * This method has essetially two different use cases:
 *   1.) When there is no sessionId yet (so sessionId argument is null), then this method is expected to either create a new session, or find a
 *       sessionId that is already associated with the given sessionKey.
 *
 *   2.) When a sessionId is passed, then the method simply updates the row with a given sessionId to contain sessionKey and windowId.
 *
 * In either case, the returned promise resolves with a sessionId.
 *
 * @export
 * @param {*} db
 * @param {*} sessionKey
 * @param {*} windowId
 * @parem {*} sessionId If sessionId exists already, then it's passed in. If it doesn't then this is null.
 * @returns promise that resolves into a session id.
 */
export function ensureZapSessionId(db, sessionKey, windowId, sessionId = null) {
  if (sessionId == null) {
    // There is no sessionId from before, so we check if there is one mapped to sessionKey already
    return dbGet(db, 'SELECT SESSION_ID FROM SESSION WHERE SESSION_KEY = ?', [
      sessionKey,
    ]).then((row) => {
      if (row == null) {
        return dbInsert(
          db,
          'INSERT INTO SESSION (SESSION_KEY, SESSION_WINID, CREATION_TIME) VALUES (?,?,?)',
          [sessionKey, windowId, Date.now()]
        )
      } else {
        return Promise.resolve(row.SESSION_ID)
      }
    })
  } else {
    // This is a case where we want to attach to a given sessionId.
    return dbUpdate(
      db,
      'UPDATE SESSION SET SESSION_WINID = ?, SESSION_KEY = ? WHERE SESSION_ID = ?',
      [windowId, sessionKey, sessionId]
    ).then(() => Promise.resolve(sessionId))
  }
}

/**
 * When loading in a file, we start with a blank session.
 *
 * @export
 * @param {*} db
 */
export function createBlankSession(db) {
  return dbInsert(
    db,
    'INSERT INTO SESSION (SESSION_KEY, SESSION_WINID, CREATION_TIME, DIRTY) VALUES (?,?,?,?)',
    ['', '', Date.now(), 0]
  )
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
  return dbRemove(db, 'DELETE FROM SESSION WHERE SESSION_ID = ?', [sessionId])
}
