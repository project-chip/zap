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
module.exports.packagesAndSessions = (db) => {
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

/**
  * This function creates a new session with its packages according to selected Properties and Templates
  * @param {*} db
  * @param {*} options: object containing 'zcl' and 'template'
  * @returns A success message.
  */
module.exports.initializeSession = (db, options) => {
  return async (req, res) => {
    let sessionUuid = req.query[restApi.param.sessionId]
    let userKey = req.session.id
    let user = await querySession.ensureUser(db, userKey)
    let sessionId = await querySession.ensureBlankSession(db, sessionUuid)
    await querySession.linkSessionToUser(db, sessionId, user.userId)
    await util.initializeSessionPackage(
      db,
      sessionId,
      options,
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
module.exports.loadPreviousSessions = (db) => {
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
