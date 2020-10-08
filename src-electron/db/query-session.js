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
 * This module provides session related queries.
 *
 * @module DB API: session related queries.
 */
const dbApi = require('./db-api.js')

/**
 * Returns a promise that resolves into an array of objects containing 'sessionId', 'sessionKey' and 'creationTime'.
 *
 * @export
 * @param {*} db
 * @returns A promise of executing a query.
 */
function getAllSessions(db) {
  return dbApi
    .dbAll(db, 'SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION', [])
    .then((rows) => {
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
function setSessionClean(db, sessionId) {
  return dbApi.dbUpdate(
    db,
    'UPDATE SESSION SET DIRTY = ? WHERE SESSION_ID = ?',
    [0, sessionId]
  )
}
/**
 * Resolves with true or false, depending whether this session is dirty.
 *
 * @export
 * @param {*} db
 * @param {*} sessionId
 * @returns A promise that resolves into true or false, reflecting session dirty state.
 */
function getSessionDirtyFlag(db, sessionId) {
  return dbApi
    .dbGet(db, 'SELECT DIRTY FROM SESSION WHERE SESSION_ID = ?', [sessionId])
    .then((row) => {
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
function getWindowDirtyFlagWithCallback(db, windowId, fn) {
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
function getSessionInfoFromSessionKey(db, sessionKey) {
  return dbApi
    .dbGet(
      db,
      'SELECT SESSION_ID, SESSION_KEY, CREATION_TIME FROM SESSION WHERE SESSION_KEY = ?',
      [sessionKey]
    )
    .then((row) => {
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
 * @param {*} sessionId If sessionId exists already, then it's passed in. If it doesn't then this is null.
 * @returns promise that resolves into a session id.
 */
function ensureZapSessionId(db, sessionKey, windowId, sessionId = null) {
  if (sessionId == null) {
    // There is no sessionId from before, so we check if there is one mapped to sessionKey already
    return dbApi
      .dbGet(db, 'SELECT SESSION_ID FROM SESSION WHERE SESSION_KEY = ?', [
        sessionKey,
      ])
      .then((row) => {
        if (row == null) {
          return dbApi.dbInsert(
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
    return dbApi
      .dbUpdate(
        db,
        'UPDATE SESSION SET SESSION_WINID = ?, SESSION_KEY = ? WHERE SESSION_ID = ?',
        [windowId, sessionKey, sessionId]
      )
      .then(() => Promise.resolve(sessionId))
  }
}

/**
 * When loading in a file, we start with a blank session.
 *
 * @export
 * @param {*} db
 */
function createBlankSession(db) {
  return dbApi.dbInsert(
    db,
    'INSERT INTO SESSION (SESSION_KEY, SESSION_WINID, CREATION_TIME, DIRTY) VALUES (?,?,?,?)',
    [`${Math.random()}`, '', Date.now(), 0]
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
function deleteSession(db, sessionId) {
  return dbApi.dbRemove(db, 'DELETE FROM SESSION WHERE SESSION_ID = ?', [
    sessionId,
  ])
}

// exports
exports.getAllSessions = getAllSessions
exports.setSessionClean = setSessionClean
exports.getSessionDirtyFlag = getSessionDirtyFlag
exports.getWindowDirtyFlagWithCallback = getWindowDirtyFlagWithCallback
exports.getSessionInfoFromSessionKey = getSessionInfoFromSessionKey
exports.ensureZapSessionId = ensureZapSessionId
exports.createBlankSession = createBlankSession
exports.deleteSession = deleteSession
