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
 * @module IDE Integration API: Studio REST API.
 */

// dirty flag reporting interval
const axios = require('axios')
const env = require('../util/env')
const querySession = require('../db/query-session.js')
const queryNotification = require('../db/query-session-notification.js')
const wsServer = require('../server/ws-server.js')
const dbEnum = require('../../src-shared/db-enum.js')
const { StatusCodes } = require('http-status-codes')
const zclComponents = require('./zcl-components.js')
import WebSocket from 'ws'
import { projectName } from '../util/studio-util'

const StudioRestAPI = {
  GetProjectInfo: '/rest/clic/components/all/project/',
  AddComponent: '/rest/clic/component/add/project/',
  RemoveComponent: '/rest/clic/component/remove/project/',
  DependsComponent: '/rest/clic/component/depends/project/'
}

const StudioWsAPI = {
  WsServerNotification: '/ws/clic/server/notifications/project/'
}

const localhost = 'http://127.0.0.1:'
const wsLocalhost = 'ws://127.0.0.1:'

// a periodic heartbeat for checking in on Studio server to maintain WS connections
let heartbeatId = null
const heartbeatDelay = 6000
let studioHttpPort
let studioWsConnections = {}

/**
 * Get session key value for the given session.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise of a session key value.
 */
async function projectPath(db, sessionId) {
  return querySession.getSessionKeyValue(
    db,
    sessionId,
    dbEnum.sessionKey.ideProjectPath
  )
}

/**
 * Boolean deciding whether Studio integration logic should be enabled
 * @param {*} db
 * @param {*} sessionId
 * @returns Promise to studio project path
 */
async function integrationEnabled(db, sessionId) {
  let path = await querySession.getSessionKeyValue(
    db,
    sessionId,
    dbEnum.sessionKey.ideProjectPath
  )
  return typeof path !== 'undefined'
}

/**
 * Resolves into true if user has actively disabled the component toggling.
 * By default this row doesn't even exist in the DB, but if user toggles
 * the toggle to turn this off, then the "disableComponentToggling" will
 * be set so '1' in the database.
 *
 * @param {*} db
 * @param {*} sessionId
 * @returns promise that resolves into a true or false, depending on whether the component toggling has been disabled manually.
 */
async function isComponentTogglingDisabled(db, sessionId) {
  let disableComponentToggling = await querySession.getSessionKeyValue(
    db,
    sessionId,
    dbEnum.sessionKey.disableComponentToggling
  )
  // We may have an empty row or a 0 or a 1. Only 1 means that this is disabled.
  return disableComponentToggling === 1
}

/**
 * Studio REST API path helper/generator
 * @param api
 * @param path
 * @param queryParams
 * @returns URL for rest api.
 */
function restApiUrl(api, path, queryParams = {}) {
  let base = localhost + studioHttpPort + api + encodeURIComponent(path)
  let params = Object.entries(queryParams)
  if (params.length) {
    let queries = new URLSearchParams()
    params.forEach(([key, value]) => {
      queries.set(key, value)
    })

    return `${base}?${queries.toString()}`
  } else {
    return base
  }
}

/**
 * Studio WebSocket API path helper/generator
 * @param api
 * @param path
 * @param queryParams
 * @returns URL for WS
 */
function wsApiUrl(api, path) {
  return wsLocalhost + studioHttpPort + api + path
}

/**
 * Send HTTP GET request to Studio Jetty server for project information.
 * @param {} db
 * @param {*} sessionId
 * @returns - HTTP RESP with project info in JSON form
 */
async function getProjectInfo(db, sessionId) {
  let project = await projectPath(db, sessionId)
  let studioIntegration = await integrationEnabled(db, sessionId)
  let isUserDisabled = await isComponentTogglingDisabled(db, sessionId)
  if (project) {
    let name = projectName(project)
    if (studioIntegration && !isUserDisabled) {
      let path = restApiUrl(StudioRestAPI.GetProjectInfo, project)
      env.logDebug(`StudioUC(${name}): GET: ${path}`)
      return axios
        .get(path)
        .then((resp) => {
          env.logDebug(`StudioUC(${name}): RESP: ${resp.status}`)
          return resp
        })
        .catch((err) => {
          env.logWarning(`StudioUC(${name}): ERR: ${err.message}`)
          return { data: [] }
        })
    } else {
      if (!isUserDisabled)
        env.logWarning(`StudioUC(${name}): Studio integration is now enabled!`)
      return { data: [] }
    }
  } else {
    if (!isUserDisabled)
      env.logWarning(
        `StudioUC(): Invalid Studio project path specified via project info API!`
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
    let isUserDisabled = await isComponentTogglingDisabled(db, sessionId)
    if (!isUserDisabled) {
      env.logWarning(
        `StudioUC(): Failed to update component due to invalid Studio project path.`
      )
      queryNotification.setNotification(
        db,
        'WARNING',
        `StudioUC(): Failed to update component due to invalid Studio project path.`,
        sessionId,
        2,
        0
      )
    }
    return Promise.resolve({ componentIds: [], added: add })
  }

  // retrieve components to enable
  let promises = []
  if (clusterId) {
    let ids = await zclComponents.getComponentIdsByCluster(
      db,
      sessionId,
      clusterId,
      side
    )

    promises.push(...ids.map((x) => Promise.resolve(x)))
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
  let name = projectName(project)

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
        data: resp.data
      }
    })
  )
}

/**
 * Send HTTP Post to update UC component state in Studio
 * @param {*} project
 * @param {*} componentId
 * @param {*} add
 * @returns Http post resonse.
 */
function httpPostComponentUpdate(project, componentId, add) {
  let operation = add
    ? StudioRestAPI.AddComponent
    : StudioRestAPI.RemoveComponent
  let operationText = add ? 'add' : 'remove'
  let name = projectName(project)
  let path = restApiUrl(operation, project)
  env.logInfo(`StudioUC(${name}): POST: ${path}, ${componentId}`)
  return axios
    .post(path, {
      componentId: componentId
    })
    .then((res) => {
      // @ts-ignore
      res.componentId = componentId
      return res
    })
    .catch((err) => {
      let resp = err.response
      // This is the weirdest API in the world:
      //   if the component is added, but something else goes wrong, it actualy
      //   returns error, but puts componentAdded flag into the error response.
      //   Same with component removed.
      if (
        (add && resp?.data?.componentAdded) ||
        (!add && resp?.data?.componentRemoved)
      ) {
        // Pretend it was all good.
        resp.componentId = componentId
        return resp
      } else {
        // Actual fail.
        return {
          status: StatusCodes.NOT_FOUND,
          id: componentId,
          data: `StudioUC(${name}): Failed to ${operationText} component(${componentId})`
        }
      }
    })
}

/**
 * Handles WebSocket messages from Studio server
 * @param db
 * @param session
 * @param message
 */
async function wsMessageHandler(db, session, message) {
  let { sessionId } = session
  let name = projectName(await projectPath(db, sessionId))
  try {
    let resp = JSON.parse(message)
    if (resp.msgType == 'updateComponents') {
      env.logInfo(
        `StudioUC(${name}): Received WebSocket message: ${JSON.stringify(
          resp.delta
        )}`
      )
      sendSelectedUcComponents(db, session, JSON.parse(resp.tree))
    }
  } catch (error) {
    env.logError(
      `StudioUC(${name}): Failed to process WebSocket notification message.`
    )
  }
}

/**
 * Start the dirty flag reporting interval.
 *
 */
function initIdeIntegration(db, studioPort) {
  studioHttpPort = studioPort

  if (studioPort) {
    heartbeatId = setInterval(async () => {
      let sessions = await querySession.getAllSessions(db)
      for (const session of sessions) {
        await verifyWsConnection(db, session, wsMessageHandler)
      }
    }, heartbeatDelay)
  }
}

/**
 * Check WebSocket connections between backend and Studio jetty server.
 * If project is opened, verify connection is open.
 * If project is closed, close ws connection as well.
 *
 * @param db
 * @param sessionId
 */
async function verifyWsConnection(db, session, messageHandler) {
  try {
    let { sessionId } = session
    let path = await projectPath(db, sessionId)
    if (path) {
      if (await isProjectActive(path)) {
        await wsConnect(db, session, path, messageHandler)
      } else {
        wsDisconnect(db, session, path)
      }
    }
  } catch (error) {
    env.logInfo(error.toString())
  }
}

/**
 * Utility function for making websocket connection to Studio server
 * @param sessionId
 * @param path
 * @returns websocket
 */
async function wsConnect(db, session, path, handler) {
  let { sessionId } = session
  let ws = studioWsConnections[sessionId]
  if (ws && ws.readyState == WebSocket.OPEN) {
    return ws
  } else {
    ws?.terminate()

    let wsPath = wsApiUrl(StudioWsAPI.WsServerNotification, path)
    let name = projectName(path)
    ws = new WebSocket(wsPath)
    env.logInfo(`StudioUC(${name}): WS connecting to ${wsPath}`)

    ws.on('error', function () {
      studioWsConnections[sessionId] = null
      return null
    })

    ws.on('open', function () {
      studioWsConnections[sessionId] = ws
      env.logInfo(`StudioUC(${name}): WS connected.`)
      return ws
    })

    ws.on('message', function (data) {
      handler(db, session, data.toString())
    })
  }
}

/**
 * Close web socket connection with Studio.
 *
 * @param {*} db
 * @param {*} session
 * @param {*} path
 */
async function wsDisconnect(db, session, path) {
  let { sessionId } = session
  if (studioWsConnections[sessionId]) {
    env.logInfo(`StudioUC(${projectName(path)}): WS disconnected.`)
    studioWsConnections[sessionId]?.close()
    studioWsConnections[sessionId] = null
  }
}

/**
 * Check if a specific Studio project (.slcp) file has been opened or not.
 *
 * Context: To get proper WebSocket notification for change in project states,
 *          that specific project needs to be opened already. Otherwise, no notification
 *          will happen.
 *
 *          DependsComponent API used as a quick way to check if the project is opened or not
 *          If project is open/valid, the API will respond with "Component not found in project"
 *          Otherwise, "Project does not exists"
 *
 * @param path
 */
async function isProjectActive(path) {
  if (!path) {
    return false
  }

  let url = restApiUrl(StudioRestAPI.DependsComponent, path)
  return axios
    .get(url)
    .then((resp) => {
      return true
    })
    .catch((err) => {
      let { response } = err
      if (response.status == StatusCodes.BAD_REQUEST && response.data) {
        return !response.data.includes('Project does not exists')
      }

      return false
    })
}

/**
 * Clears up the reporting interval.
 */
function deinitIdeIntegration() {
  if (heartbeatId) clearInterval(heartbeatId)
  Object.entries(studioWsConnections).forEach(([sessionId, connection]) => {
    connection?.terminate()
  })
}

/**
 * Send selected UC components across the web socket.
 *
 * @param {*} db
 * @param {*} session
 * @param {*} ucComponentStates
 */
async function sendSelectedUcComponents(db, session, ucComponentStates) {
  let socket = wsServer.clientSocket(session.sessionKey)
  let studioIntegration = await integrationEnabled(db, session.sessionId)
  let isUserDisabled = await isComponentTogglingDisabled(db, session.sessionId)
  if (socket && studioIntegration && !isUserDisabled) {
    wsServer.sendWebSocketMessage(socket, {
      category: dbEnum.wsCategory.updateSelectedUcComponents,
      payload: ucComponentStates
    })
  }
}

/**
 * Notify front-end that current session failed to load.
 * @param {} err
 */
function sendSessionCreationErrorStatus(db, err, sessionId) {
  // TODO: delegate type declaration to actual function
  querySession.getAllSessions(db).then((sessions) =>
    sessions.forEach((session) => {
      if (session.sessionId == sessionId) {
        let socket = wsServer.clientSocket(session.sessionKey)
        if (socket) {
          wsServer.sendWebSocketMessage(socket, {
            category: dbEnum.wsCategory.sessionCreationError,
            payload: err
          })
        }
      }
    })
  )
}

/**
 * Notify front-end that current session failed to load.
 * @param {*} err
 */
async function sendComponentUpdateStatus(db, sessionId, data) {
  try {
    let sessions = await querySession.getAllSessions(db)
    let session = sessions.find((s) => s.sessionId == sessionId)
    if (session) {
      let socket = wsServer.clientSocket(session.sessionKey)
      if (socket) {
        wsServer.sendWebSocketMessage(socket, {
          category: dbEnum.wsCategory.componentUpdateStatus,
          payload: data
        })
      }
    } else {
      throw new Error(`Unable to find session with id ${sessionId}`)
    }
  } catch (error) {
    console.error('Error sending component update status:', error)
  }
}

exports.getProjectInfo = getProjectInfo
exports.updateComponentByComponentIds = updateComponentByComponentIds
exports.updateComponentByClusterIdAndComponentId =
  updateComponentByClusterIdAndComponentId
exports.projectName = projectName
exports.integrationEnabled = integrationEnabled
exports.initIdeIntegration = initIdeIntegration
exports.deinitIdeIntegration = deinitIdeIntegration
exports.sendSessionCreationErrorStatus = sendSessionCreationErrorStatus
exports.sendComponentUpdateStatus = sendComponentUpdateStatus
exports.isComponentTogglingDisabled = isComponentTogglingDisabled
