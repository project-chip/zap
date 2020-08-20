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
const env = require('../util/env.js')
const querySession = require('../db/query-session.js')
const admin = require('../rest/admin.js')
const generation = require('../rest/generation.js')
const staticZcl = require('../rest/static-zcl.js')
const userData = require('../rest/user-data.js')
const uc_integration = require('../rest/uc-component.js')
const util = require('../util/util.js')

var httpServer = null

/**
 * Promises to initialize the http server on a given port
 * using a given database.
 *
 * @export
 * @param {*} db Database object to use.
 * @param {*} port Port for the HTTP server.
 * @returns A promise that resolves with an express app.
 */
function initHttpServer(db, port, studioPort) {
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

        querySession
          .ensureZapSessionId(db, req.session.id, windowId, sessionId)
          .then((sessionId) => util.initializeSessionPackage(db, sessionId))
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
    staticZcl.registerStaticZclApi(db, app)
    userData.registerSessionApi(db, app)
    generation.registerGenerationApi(db, app)
    admin.registerAdminApi(db, app)
    uc_integration.registerUcComponentApi(db, app)

    app.use(express.static(env.httpStaticContent))

    httpServer = app.listen(port, () => {
      env.logHttpServerUrl(httpServerPort(), studioPort)
      resolve(app)
    })

    process.on('uncaughtException', function (err) {
      env.logInfo(`HTTP server port ` + port + ` is busy.`)
      if (err.errno === 'EADDRINUSE') {
        httpServer = app.listen(0, () => {
          env.logHttpServerUrl(httpServerPort(), studioPort)
          resolve(app)
        })
      } else {
        env.logError(err)
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
function shutdownHttpServer() {
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
function httpServerPort() {
  if (httpServer) {
    return httpServer.address().port
  } else {
    return 0
  }
}
// exports
exports.initHttpServer = initHttpServer
exports.shutdownHttpServer = shutdownHttpServer
exports.httpServerPort = httpServerPort
