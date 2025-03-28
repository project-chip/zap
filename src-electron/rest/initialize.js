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
 * @param {*} db - The database connection object
 * @returns An async function that handles HTTP requests
 */
function sessionAttempt(db) {
  return async (req, res) => {
    let search = req.body.search

    const query = new URLSearchParams(search)
    let filePath = query.get('filePath')
    let filePathExtension = query.get('zapFileExtensions')
    if (filePath) {
      if (filePath.includes('.zap')) {
        let data = await fsp.readFile(filePath)
        let obj = JSON.parse(data)
        let category = []
        let zapFilePackages = obj.package
        zapFilePackages.forEach((pkg) => {
          let pkgCategory = "'" + pkg.category + "'"
          if (!category.includes(pkgCategory)) {
            category.push(pkgCategory)
          }
        })
        if (category.length > 0) {
          let open = true
          const zclProperties = await queryPackage.getPackagesByCategoryAndType(
            db,
            dbEnum.packageType.zclProperties,
            category
          )
          const zclGenTemplates =
            await queryPackage.getPackagesByCategoryAndType(
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
            zapFilePackages,
            open,
            filePathExtension
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
            open
          })
        }
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
          open
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
        open
      })
    }
  }
}

/**
 * This function creates a new session.
 * @param {*} db - The database connection object
 * @returns An async function that handles HTTP requests. The function extracts session parameters from the request,
 * ensures the user and session exist in the database, and populates the session options with the provided packages.
 */
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
      let partitionsLength =
        (zclProperties && zclProperties.length ? zclProperties.length : 0) +
        (genTemplate && genTemplate.length ? genTemplate.length : 0)
      await querySession
        .ensureZapUserAndSession(db, userKey, sessionUuid, {
          sessionId: zapSessionId,
          userId: zapUserId,
          partitions: partitionsLength
        })
        .then((result) => {
          req.session.zapUserId = result.userId
          req.session.zapSessionId[sessionUuid] = result.sessionId
          req.zapSessionId = result.sessionId
          req.zapSessionPartitions = result.partitions
          return result
        })
        .then((result) => {
          return util.ensurePackagesAndPopulateSessionOptions(
            db,
            result.sessionId,
            { partitions: result.partitions },
            pkgArray,
            genTemplate
          )
        })
    }
    return res.send({
      message: 'Session created successfully'
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
      message: 'Session created successfully'
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
      message: 'Session reloaded successfully'
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
      message: 'Session initialized'
    })
  }
}

exports.post = [
  {
    uri: restApi.uri.reloadSession,
    callback: loadPreviousSessions
  },
  {
    uri: restApi.uri.initializeSession,
    callback: initializeSession
  },
  {
    uri: restApi.uri.sessionCreate,
    callback: sessionCreate
  },
  {
    uri: restApi.uri.init,
    callback: init
  },
  {
    uri: restApi.uri.sessionAttempt,
    callback: sessionAttempt
  }
]
