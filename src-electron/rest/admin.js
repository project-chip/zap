// Copyright (c) 2020 Silicon Labs. All rights reserved.

import { dbAll } from '../db/db-api.js'
/**
 * This module provides the REST API to the admin functions.
 *
 * @module REST API: admin functions
 */

/**
 * API: /post/sql
 * Request JSON:
 * <pre>
 *   {
 *     sql: SQL Query
 *   }
 * </pre>
 *
 * Response JSON:
 * <pre>
 *   {
 *     result: Array of rows.
 *   }
 * </pre>
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
export function registerAdminApi(db, app) {
  app.post('/post/sql', (request, response) => {
    var sql = request.body.sql
    if (sql) {
      var replyObject = { replyId: 'sql-result' }
      dbAll(db, sql, [])
        .then((rows) => {
          replyObject.result = rows
          response.json(replyObject)
        })
        .catch((err) => {
          replyObject.result = [`ERROR: ${err.name}, ${err.message}`]
          response.json(replyObject)
        })
    }
  })
}
