/**
 *
 *    Copyright (c) 2022 Silicon Labs
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
 * This module provides the REST API to the session initialization
 *
 * @module REST API: initialization functions
 */
const queryPackage = require('../db/query-package.js')
const querySession = require('../db/query-session.js')
const dbEnum = require('../../src-shared/db-enum.js')
const restApi = require('../../src-shared/rest-api.js')
const util = require('../util/util.js')

/**
 * This function returns Properties, Templates and Dirty-Sessions
 * @param {*} db
 * @returns Properties, Templates and Dirty-Sessions.
 */
function packagesAndSessions(db) {
  return async (req, res) => {
    const zclProperties = await queryPackage.getPackagesByType(
      db,
      dbEnum.packageType.zclProperties
    )
    const zclGenTemplates = await queryPackage.getPackagesByType(
      db,
      dbEnum.packageType.genTemplatesJson
    )
    const sessions = await querySession.getDirtySessionsWithPackages(db)
    return res.send({
      zclGenTemplates,
      zclProperties,
      sessions,
    })
  }
}

function createSession(db) {
  return async (req, res) => {
    console.log(req.body)
    let { zclProperties, genTemplate } = req.body
    let sessionUuid = req.query[restApi.param.sessionId]
    let userKey = req.session.id
    console.log('2')

    if (sessionUuid == null || userKey == null) {
      console.log('placeholder')
    } else {
      let zapUserId = req.session.zapUserId
      let zapSessionId
      if (`zapSessionId` in req.session) {
        console.log('3')
        zapSessionId = req.session.zapSessionId[sessionUuid]
      } else {
        console.log('4')
        req.session.zapSessionId = {}
        zapSessionId = null
      }
      let tpk = zclProperties
      console.log(zclProperties)
      let pkgArray = null
      if (tpk) {
        pkgArray = tpk
      } else {
        pkgArray = []
      }

      querySession
        .ensureZapUserAndSession(db, userKey, sessionUuid, {
          sessionId: zapSessionId,
          userId: zapUserId,
        })
        .then((result) => {
          req.session.zapUserId = result.userId
          req.session.zapSessionId[sessionUuid] = result.sessionId
          req.zapSessionId = result.sessionId
          console.table(result)
          return result
        })
        .then((result) => {
          if (result.newSession) {
            console.table(genTemplate)
            //console.log(options)
            return util.ensurePackagesAndPopulateSessionOptions(
              db,
              result.sessionId,
              null,
              pkgArray,
              ['Users/paregan/zap/test/gen-template/zigbee/gen-templates.json']
            )
          }
        })
    }
    return res.send({
      message: 'Session created successfully',
    })
  }
}

/**
 * This function creates a new session with its packages according to selected Properties and Templates
 * @param {*} db
 * @param {*} options: object containing 'zcl' and 'template'
 * @returns A success message.
 */
function initializeSession(db) {
  return async (req, res) => {
    console.log(req.body.sessionId)
    await util.ensurePackagesAndPopulateSessionOptions(
      db,
      req.body.sessionId,
      {},
      req.body.zclProperties,
      req.body.genTemplate
    )
    return res.send({
      message: 'Session created successfully',
    })
  }
}

/**
 * This function reloads previous session by user selected session's id
 * @param {*} db
 * @returns A success message.
 */
function loadPreviousSessions(db) {
  return async (req, res) => {
    let sessionUuid = req.query[restApi.param.sessionId]
    let userKey = req.session.id
    let user = await querySession.ensureUser(db, userKey)
    await querySession.reloadSession(
      db,
      req.body.sessionId,
      user.userId,
      sessionUuid
    )
    return res.send({
      message: 'Session reloaded successfully',
    })
  }
}

/**
 * Init function from the App.vue
 * @param {*} db
 * @returns A success message.
 */
function init(db) {
  return async (req, res) => {
    return res.send({
      message: 'Session initialized',
    })
  }
}

exports.get = [
  {
    uri: restApi.uri.initialPackagesSessions,
    callback: packagesAndSessions,
  },
]

exports.post = [
  {
    uri: restApi.uri.reloadSession,
    callback: loadPreviousSessions,
  },
  {
    uri: restApi.uri.initializeSession,
    callback: initializeSession,
  },
  {
    uri: restApi.uri.createSession,
    callback: createSession,
  },
  {
    uri: restApi.uri.init,
    callback: init,
  },
]
