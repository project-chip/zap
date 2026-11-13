/**
 *
 *    Copyright (c) 2021 Silicon Labs
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
 * This module provides the APIs for initializing timers specifically
 * for sessions.
 *
 */

/**
 * This module provides the APIs for initializing timers specifically
 * for sessions.
 *
 * @module Timer API: initializes times.
 */

let ASYNC_DEFAULT_TIMER_INTERVAL_MS = 6000

// Session ids are only unique within a database.
const databaseTimers = new Map()

/**
 * Start session specific validation, replacing any previous timers.
 */
function initSessionTimers(db, session, sessionTimersSetupArray) {
  deinitSessionTimers(session, db)
  if (sessionTimersSetupArray.length === 0) return
  if (!databaseTimers.has(db)) databaseTimers.set(db, new Map())
  databaseTimers.get(db).set(
    session.sessionId,
    sessionTimersSetupArray.map((setup) =>
      setInterval(
        setup.func,
        setup.timerInterval || ASYNC_DEFAULT_TIMER_INTERVAL_MS
      )
    )
  )
}

/**
 * Stop validation timers for a session. If no database is supplied, stop
 * matching sessions in all databases for compatibility with existing callers.
 */
function deinitSessionTimers(session, db) {
  for (const [database, sessions] of databaseTimers) {
    if (db != null && database !== db) continue
    const timers = sessions.get(session.sessionId)
    if (timers) timers.forEach(clearInterval)
    sessions.delete(session.sessionId)
    if (sessions.size === 0) databaseTimers.delete(database)
  }
}

/**
 * Stop all session validation before closing their database.
 */
function deinitDatabaseSessionTimers(db) {
  const sessions = databaseTimers.get(db)
  if (!sessions) return
  for (const timers of sessions.values()) timers.forEach(clearInterval)
  databaseTimers.delete(db)
}

exports.initSessionTimers = initSessionTimers
exports.deinitSessionTimers = deinitSessionTimers
exports.deinitDatabaseSessionTimers = deinitDatabaseSessionTimers
