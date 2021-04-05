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
 * This module provides the APIs to Silabs Simplicity Studio's Jetty server.
 *
 */

// dirty flag reporting interval
const DIRTY_FLAG_REPORT_INTERVAL_MS = 1000
const UC_COMPONENT_STATE_REPORTING_INTERVAL_ID = 6000
const axios = require('axios')
const args = require('../util/args.js')
const env = require('../util/env.js')
const querySession = require('../db/query-session.js')
const wsServer = require('../server/ws-server.js')
const dbEnum = require('../../src-shared/db-enum.js')
const http = require('http-status-codes')
const zcl = require('./zcl.js')

const localhost = 'http://localhost:'
const op_tree = '/rest/clic/components/all/project/'
const op_add = '/rest/clic/component/add/project/'
const op_remove = '/rest/clic/component/remove/project/'

let dirtyFlagStatusId = null
let ucComponentStateReportId = null

function projectPath(db, sessionId) {
  return querySession.getSessionKeyValue(
    db,
    sessionId,
    dbEnum.sessionKey.studioProjectPath
  )
}

/**
 * Boolean deciding whether Studio integration logic should be enabled
 * @param {*} db
 * @param {*} sessionId
 * @returns - Promise to studio project path
 */
function integrationEnabled(db, sessionId) {
  return querySession
    .getSessionKeyValue(db, sessionId, dbEnum.sessionKey.studioProjectPath)
    .then((path) => typeof path !== 'undefined')
}

/**
 *  Extract project name from the Studio project path
 * @param {} db
 * @param {*} sessionId
 * @returns '' if retrival failed
 */
function projectName(studioProjectPath) {
  const prefix = '_2F'
  if (studioProjectPath && studioProjectPath.includes(prefix)) {
    return projectPath.substr(
      studioProjectPath.lastIndexOf(prefix) + prefix.length
    )
  } else {
    return ''
  }
}

/**
 * Send HTTP GET request to Studio Jetty server for project information.
 * @param {} db
 * @param {*} sessionId
 * @returns - HTTP RESP with project info in JSON form
 */
async function getProjectInfo(db, sessionId) {
  let studioProjectPath = await projectPath(db, sessionId)
  if (studioProjectPath) {
    let name = await projectName(studioProjectPath)
    let path = localhost + args.studioHttpPort + op_tree + studioProjectPath
    env.logInfo(`StudioUC(${name}): GET: ${path}`)
    return axios
      .get(path)
      .then((resp) => {
        env.logInfo(`StudioUC(${name}): RESP: ${resp.status}`)
        return resp
      })
      .catch((err) => {
        env.logError(`StudioUC(${name}): ERR: ${err}`)
        return { data: [] }
      })
  } else {
    env.logError(
      `StudioUC(): Invalid Studio path project. Failed to retrieve project info.`
    )
    return { data: [] }
  }
}

/**
 *  Send HTTP Post to update UC component state in Studio
 * @param {*} project
 * @param {*} componentIds
 * @param {*} add
 * @param {*} db
 * @param {*} sessionId
 * @param {*} side
 * @return {*} - [{id, status, data }]
 *                id - string,
 *                status - boolean. true if HTTP REQ status code is OK,
 *                data - HTTP response data field
 */
async function updateComponentByClusterIdAndComponentId(
  db,
  sessionId,
  componentIds,
  clusterId,
  add,
  side
) {
  if (!integrationEnabled(db, sessionId)) {
    env.logInfo(
      `StudioUC(): Failed to update component due to invalid Studio project path.`
    )
    return Promise.resolve({ componentIds: [], added: add })
  }

  // retrieve components to enable
  let promises = []
  if (clusterId) {
    let ids = zcl
      .getComponentIdsByCluster(db, sessionId, clusterId, side)
      .then((response) => Promise.resolve(response.componentIds))
    promises.push(ids)
  }

  // enabling components via Studio
  return (
    Promise.all(promises)
      .then((ids) => ids.flat())
      .then((ids) => ids.concat(componentIds))
      // enabling components via Studio jetty server.
      .then((ids) => updateComponentByComponentIds(db, sessionId, ids, add))
      .catch((err) => {
        env.logInfo(err)
        return err
      })
  )
}

/**
 *  Send HTTP Post to update UC component state in Studio
 * @param {*} project - local Studio project path
 * @param {*} componentIds - a list of component Ids
 * @param {*} add - true if adding component, false if removing.
 * @return {*} - [{id, status, data }]
 *                id - string,
 *                status - boolean. true if HTTP REQ status code is OK,
 *                data - HTTP response data field
 */
async function updateComponentByComponentIds(db, sessionId, componentIds, add) {
  componentIds = componentIds.filter((x) => x)
  let promises = []
  let project = await projectPath(db, sessionId)
  let name = await projectName(project)

  if (Object.keys(componentIds).length) {
    promises = componentIds.map((componentId) =>
      httpPostComponentUpdate(project, componentId, add)
    )
  }

  return Promise.all(promises).then((responses) =>
    responses.map((resp, index) => {
      return {
        projectName: name,
        id: componentIds[index],
        status: resp.status,
        data: resp.data,
      }
    })
  )
}

function httpPostComponentUpdate(project, componentId, add) {
  let operation = add ? op_add : op_remove
  let operationText = add ? 'add' : 'remove'
  return axios
    .post(localhost + args.studioHttpPort + operation + project, {
      componentId: componentId,
    })
    .then((res) => {
      res.componentId = componentId
      return Promise.resolve(res)
    })
    .catch((err) => {
      return Promise.resolve({
        status: http.StatusCodes.NOT_FOUND,
        id: componentId,
        data: `StudioUC(${projectName(
          project
        )}): Failed to ${operationText} component(${componentId})`,
      })
    })
}

/**
 * Start the dirty flag reporting interval.
 *
 */
function initIdeIntegration(db) {
  dirtyFlagStatusId = setInterval(() => {
    sendDirtyFlagStatus(db)
  }, DIRTY_FLAG_REPORT_INTERVAL_MS)

  ucComponentStateReportId = setInterval(() => {
    sendUcComponentStateReport(db)
  }, UC_COMPONENT_STATE_REPORTING_INTERVAL_ID)
}

/**
 * Clears up the reporting interval.
 */
function deinit() {
  if (dirtyFlagStatusId != null) clearInterval(dirtyFlagStatusId)
  if (ucComponentStateReportId != null) clearInterval(ucComponentStateReportId)
}

async function sendUcComponentStateReport(db) {
  let sessions = await querySession.getAllSessions(db)
  for (const session of sessions) {
    let socket = wsServer.clientSocket(session.sessionKey)
    let studioIntegration = await integrationEnabled(db, session.sessionId)
    if (socket && studioIntegration) {
      getProjectInfo(db, session.sessionId).then((resp) => {
        if (resp.status == http.StatusCodes.OK)
          wsServer.sendWebSocketMessage(socket, {
            category: dbEnum.wsCategory.ucComponentStateReport,
            payload: resp.data,
          })
      })
    }
  }
}

function sendDirtyFlagStatus(db) {
  querySession.getAllSessions(db).then((sessions) => {
    sessions.forEach((session) => {
      let socket = wsServer.clientSocket(session.sessionKey)
      if (socket) {
        querySession.getSessionDirtyFlag(db, session.sessionId).then((flag) => {
          wsServer.sendWebSocketMessage(socket, {
            category: dbEnum.wsCategory.dirtyFlag,
            payload: !!flag,
          })
        })
      }
    })
  })
}

/**
 * Notify front-end that current session failed to load.
 * @param {} err
 */
function sendSessionCreationErrorStatus(db, err) {
  querySession.getAllSessions(db).then((sessions) =>
    sessions.forEach((session) => {
      let socket = wsServer.clientSocket(session.sessionKey)
      if (socket) {
        wsServer.sendWebSocketMessage(socket, {
          category: dbEnum.wsCategory.sessionCreationError,
          payload: err,
        })
      }
    })
  )
}

/**
 * Notify front-end that current session failed to load.
 * @param {*} err
 */
function sendComponentUpdateStatus(db, sessionId, data) {
  querySession.getAllSessions(db).then((sessions) =>
    sessions.forEach((session) => {
      if (session.sessionId == sessionId) {
        let socket = wsServer.clientSocket(session.sessionKey)
        if (socket) {
          wsServer.sendWebSocketMessage(socket, {
            category: dbEnum.wsCategory.componentUpdateStatus,
            payload: data,
          })
        }
      }
    })
  )
}

exports.getProjectInfo = getProjectInfo
exports.updateComponentByComponentIds = updateComponentByComponentIds
exports.updateComponentByClusterIdAndComponentId = updateComponentByClusterIdAndComponentId
exports.projectName = projectName
exports.integrationEnabled = integrationEnabled
exports.initIdeIntegration = initIdeIntegration
exports.deinit = deinit
exports.sendSessionCreationErrorStatus = sendSessionCreationErrorStatus
exports.sendComponentUpdateStatus = sendComponentUpdateStatus
