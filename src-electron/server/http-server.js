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
 * This module provides the HTTP server functionality.
 *
 * @module JS API: http server
 */

import bodyParser from 'body-parser'
import express from 'express'
import session from 'express-session'
import path from 'path'
import { ensureZapSessionId } from '../db/query-session.js'
import * as Env from '../util/env.js'
import { registerAdminApi } from '../rest/admin.js'
import { registerGenerationApi } from '../rest/generation.js'
import { registerStaticZclApi } from '../rest/static-zcl.js'
import { registerSessionApi } from '../rest/user-data.js'

var httpServer = null

export const httpCode = {
  ok: 200,
  badRequest: 400,
  notFound: 404,
}

/**
 * Promises to initialize the http server on a given port
 * using a given database.
 *
 * @export
 * @param {*} db Database object to use.
 * @param {*} port Port for the HTTP server.
 * @returns A promise that resolves with an express app.
 */
export function initHttpServer(db, port) {
  return new Promise((resolve, reject) => {
    const app = express()
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    app.use(
      session({
        secret: 'Zap@Watt@SiliconLabs',
        resave: true,
        saveUninitialized: true,
      })
    )

    // this is a generic logging stuff
    app.use((req, res, next) => {
      if (req.session.zapSessionId) {
        next()
      } else {
        let windowId = null
        let sessionId = null
        if ('winId' in req.query) windowId = req.query.winId
        if ('sessionId' in req.query) sessionId = req.query.sessionId

        ensureZapSessionId(db, req.session.id, windowId, sessionId)
          .then((sessionId) => {
            req.session.zapSessionId = sessionId
            next()
          })
          .catch((err) => {
            Env.logError('Could not create session: ' + err.message)
          })
      }
    })

    // Simple get for an entity, id can be all or specific id
    registerStaticZclApi(db, app)
    registerSessionApi(db, app)
    registerGenerationApi(db, app)
    registerAdminApi(db, app)

    var staticDir = path.join(__dirname, __indexDirOffset)

    app.use(express.static(staticDir))

    httpServer = app.listen(port, () => {
      Env.logInfo(`HTTP server created on port: ${port}`)
      resolve(app)
    })
  })
}
/**
 * Promises to shut down the http server.
 *
 * @export
 * @returns Promise that resolves when server is shut down.
 */
export function shutdownHttpServer() {
  return new Promise((resolve, reject) => {
    if (httpServer != null) {
      httpServer.close(() => {
        Env.logInfo('HTTP server shut down.')
        httpServer = null
        resolve(null)
      })
    }
    resolve(null)
  })
}
