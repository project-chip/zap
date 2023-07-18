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
const fs = require('fs')
const fsp = fs.promises

/**
 * This function returns Properties, Templates and Dirty-Sessions
 * @param {*} db
 * @returns Properties, Templates and Dirty-Sessions.
 */
function sessionAttempt(db) {
  return async (req, res) => {
    if (req.body.search?.includes('filePath=%2F')) {
      let filePath = req.body.search.split('filePath=')
      filePath = filePath[1].replaceAll('%2F', '//').trim()
      if (filePath.includes('.zap')) {
        let data = await fsp.readFile(filePath)
        let obj = JSON.parse(data)
        let category = obj.package[0].category
        let open = true
        const zclProperties = await queryPackage.getPackagesByCategoryAndType(
          db,
          dbEnum.packageType.zclProperties,
          category
        )
        const zclGenTemplates = await queryPackage.getPackagesByCategoryAndType(
          db,
          dbEnum.packageType.genTemplatesJson,
          category
        )
        const sessions = await querySession.getDirtySessionsWithPackages(db)
        return res.send({
          zclGenTemplates,
          zclProperties,
          sessions,
          filePath,
          open,
        })
      } else {
        let open = true
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
          open,
        })
      }
    } else {
      let open = false
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
        open,
      })
    }
  }
}

function sessionCreate(db) {
  return async (req, res) => {
    let { zclProperties, genTemplate } = req.body
    let sessionUuid = req.query[restApi.param.sessionId]
    let userKey = req.session.id

    if (sessionUuid == null || userKey == null) {
      return
    } else {
      let zapUserId = req.session.zapUserId
      let zapSessionId
      if (`zapSessionId` in req.session) {
        zapSessionId = req.session.zapSessionId[sessionUuid]
      } else {
        req.session.zapSessionId = {}
        zapSessionId = null
      }
      let tpk = zclProperties
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
          return result
        })
        .then((result) => {
          return util.ensurePackagesAndPopulateSessionOptions(
            db,
            result.sessionId,
            null,
            pkgArray,
            genTemplate
          )
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
    uri: restApi.uri.sessionCreate,
    callback: sessionCreate,
  },
  {
    uri: restApi.uri.init,
    callback: init,
  },
  {
    uri: restApi.uri.sessionAttempt,
    callback: sessionAttempt,
  },
]
