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

const dbApi = require('../db/db-api.js')
const restApi = require('../../src-shared/rest-api.js')

/**
 * This module provides the REST API to the admin functions.
 *
 * @module REST API: admin functions
 */

/**
 * API: /sql
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
 * @returns callback for the express uri registration
 */
function httpPostSql(db) {
  return (request, response) => {
    let sql = request.body.sql
    if (sql) {
      dbApi
        .dbAll(db, sql, [])
        .then((rows) => {
          response.json({ result: rows })
        })
        .catch((err) => {
          response.json({ error: err })
        })
    }
  }
}

exports.post = [
  {
    uri: restApi.uri.sql,
    callback: httpPostSql,
  },
]
