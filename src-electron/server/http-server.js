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

const bodyParser = require('body-parser')
const express = require('express')
const session = require('express-session')
const path = require('path')
const env = require('../util/env.js')
const { ensureZapSessionId } = require('../db/query-session.js')

const { registerAdminApi } = require('../rest/admin.js')
const { registerGenerationApi } = require('../rest/generation.js')
const { registerStaticZclApi } = require('../rest/static-zcl.js')
const { registerSessionApi } = require('../rest/user-data.js')

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
            env.logError('Could not create session: ' + err.message)
            env.logError(err)
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
      env.logInfo(`HTTP server created on port: ` + httpServerPort())
      resolve(app)
    })

    process.on('uncaughtException', function (err) {
      env.logInfo(`HTTP server port ` + port + ` is busy.`)
      if (err.errno === 'EADDRINUSE') {
        httpServer = app.listen(0, () => {
          env.logInfo(`HTTP server created on port: ` + httpServerPort())
          resolve(app)
        })
      } else {
        Env.logError(err)
      }
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
        env.logInfo('HTTP server shut down.')
        httpServer = null
        resolve(null)
      })
    }
    resolve(null)
  })
}

/**
 * Port http server is listening on.
 *
 * @export
 * @returns port
 */
export function httpServerPort() {
  if (httpServer) {
    return httpServer.address().port
  } else {
    return 0
  }
}
