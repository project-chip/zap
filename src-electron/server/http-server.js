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
const util = require('../util/util.js')
const webSocket = require('./websocket.js')

const restApiModules = [
  '../rest/admin.js',
  '../rest/static-zcl.js',
  '../rest/generation.js',
  '../rest/ide-api-handler.js',
  '../rest/uc-component.js',
  '../rest/endpoint.js',
  '../rest/user-data.js',
]
var httpServer = null

/**
 * This function is used to register a rest module, which exports
 * get/post/etc. arrays.
 *
 * @param {*} filename
 * @param {*} db
 * @param {*} app
 */
function registerRestApi(filename, db, app) {
  var module = require(filename)

  if (module.post != null)
    module.post.forEach((singlePost) => {
      var uri = singlePost.uri
      var callback = singlePost.callback
      app.post(uri, callback(db))
    })

  if (module.put != null)
    module.put.forEach((singlePut) => {
      var uri = singlePut.uri
      var callback = singlePut.callback
      app.put(uri, callback(db))
    })

  if (module.patch != null)
    module.patch.forEach((singlePatch) => {
      var uri = singlePatch.uri
      var callback = singlePatch.callback
      app.patch(uri, callback(db))
    })

  if (module.get != null)
    module.get.forEach((singleGet) => {
      var uri = singleGet.uri
      var callback = singleGet.callback
      app.get(uri, callback(db))
    })

  if (module.delete != null)
    module.delete.forEach((singleDelete) => {
      var uri = singleDelete.uri
      var callback = singleDelete.callback
      app.delete(uri, callback(db))
    })
}

function registerAllRestModules(db, app) {
  restApiModules.forEach((module) => registerRestApi(module, db, app))
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
        var knownSessionId = null
        if ('sessionId' in req.query) knownSessionId = req.query.sessionId
        querySession
          .ensureZapSessionId(db, req.session.id, knownSessionId)
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

    // REST modules
    registerAllRestModules(db, app)

    // Static content
    env.logInfo(`HTTP static content location: ${env.httpStaticContent}`)
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

    webSocket.initializeWebSocket(httpServer)
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
