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
import axios, { AxiosResponse } from 'axios'
import * as env from '../util/env'
import * as dbTypes from '../../src-shared/types/db-types'
import * as querySession from '../db/query-session.js'
const queryNotification = require('../db/query-session-notification.js')
const wsServer = require('../server/ws-server.js')
const dbEnum = require('../../src-shared/db-enum.js')
import * as ucTypes from '../../src-shared/types/uc-component-types'
import * as dbMappingTypes from '../types/db-mapping-types'
import { StatusCodes } from 'http-status-codes'
import zcl from './zcl.js'
import WebSocket from 'ws'

const UC_COMPONENT_STATE_REPORTING_INTERVAL = 6000
const localhost = 'http://127.0.0.1:'
const wsLocalhost = 'ws://127.0.0.1:'

enum StudioRestAPI {
  GetProjectInfo = '/rest/clic/components/all/project/',
  AddComponent = '/rest/clic/component/add/project/',
  RemoveComponent = '/rest/clic/component/remove/project/',
  DependsComponent = '/rest/clic/component/depends/project/',
}

enum StudioWsAPI {
  WsServerNotification = '/ws/clic/server/notifications/project/',
}

type StudioProjectPath = string
type StudioQueryParams = { [key: string]: string }
type StudioWsMessage = (message: string) => void
type StudioWsConnection = { [key: number]: WebSocket | null }

let ucComponentStateReportId: NodeJS.Timeout
let studioHttpPort: number
let studioWsConnections: StudioWsConnection = {}

async function projectPath(
  db: dbTypes.DbType,
  sessionId: number
): Promise<StudioProjectPath> {
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
 * @returns - Promise to studio project path
 */
async function integrationEnabled(db: dbTypes.DbType, sessionId: number) {
  let path: string = await querySession.getSessionKeyValue(
    db,
    sessionId,
    dbEnum.sessionKey.ideProjectPath
  )
  return typeof path !== 'undefined'
}

/**
 *  Extract project name from the Studio project path
 * @param {} db
 * @param {*} sessionId
 * @returns '' if retrival failed
 */
function projectName(studioProjectPath: StudioProjectPath) {
  const prefix = '_2F'
  const prefixIndex = studioProjectPath?.lastIndexOf(prefix)
  if (studioProjectPath && prefixIndex) {
    return studioProjectPath.substring(prefixIndex + prefix.length)
  } else {
    return ''
  }
}

/**
 * Studio REST API path helper/generator
 * @param api
 * @param path
 * @param queryParams
 * @returns
 */
function restApiUrl(
  api: StudioRestAPI,
  path: StudioProjectPath,
  queryParams: StudioQueryParams = {}
) {
  let base = localhost + studioHttpPort + api + path
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
 * @returns
 */
function wsApiUrl(api: StudioWsAPI, path: StudioProjectPath) {
  return wsLocalhost + studioHttpPort + api + path
}

/**
 * Send HTTP GET request to Studio Jetty server for project information.
 * @param {} db
 * @param {*} sessionId
 * @returns - HTTP RESP with project info in JSON form
 */
async function getProjectInfo(
  db: dbTypes.DbType,
  sessionId: number
): Promise<{
  data: string[]
  status?: StatusCodes
}> {
  let project = await projectPath(db, sessionId)
  let studioIntegration = await integrationEnabled(db, sessionId)

  if (project) {
    let name = projectName(project)
    if (studioIntegration) {
      let path = restApiUrl(StudioRestAPI.GetProjectInfo, project)
      env.logInfo(`StudioUC(${name}): GET: ${path}`)
      return axios
        .get(path)
        .then((resp) => {
          env.logInfo(`StudioUC(${name}): RESP: ${resp.status}`)
          return resp
        })
        .catch((err) => {
          env.logInfo(`StudioUC(${name}): ERR: ${err.message}`)
          return { data: [] }
        })
    } else {
      env.logInfo(`StudioUC(${name}): Studio integration is not enabled!`)
      return { data: [] }
    }
  } else {
    env.logInfo(
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
  db: dbTypes.DbType,
  sessionId: number,
  componentIds: string[],
  clusterId: number,
  add: boolean,
  side: string
) {
  if (!integrationEnabled(db, sessionId)) {
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
    return Promise.resolve({ componentIds: [], added: add })
  }

  // retrieve components to enable
  let promises = []
  if (clusterId) {
    let ids = zcl
      .getComponentIdsByCluster(db, sessionId, clusterId, side)
      .then((response: ucTypes.UcComponentIds) =>
        Promise.resolve(response.componentIds)
      )
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
async function updateComponentByComponentIds(
  db: dbTypes.DbType,
  sessionId: number,
  componentIds: string[],
  add: boolean
) {
  componentIds = componentIds.filter((x) => x)
  let promises: Promise<
    AxiosResponse | ucTypes.UcComponentUpdateResponseWrapper
  >[] = []
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
        data: resp.data,
      }
    })
  )
}

function httpPostComponentUpdate(
  project: string,
  componentId: string,
  add: boolean
) {
  let operation = add
    ? StudioRestAPI.AddComponent
    : StudioRestAPI.RemoveComponent
  let operationText = add ? 'add' : 'remove'
  let name = projectName(project)
  let path = restApiUrl(operation, project)
  env.logInfo(`StudioUC(${name}): POST: ${path}, ${componentId}`)
  return axios
    .post(path, {
      componentId: componentId,
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
          data: `StudioUC(${name}): Failed to ${operationText} component(${componentId})`,
        }
      }
    })
}

/**
 * Start the dirty flag reporting interval.
 *
 */
function initIdeIntegration(db: dbTypes.DbType, studioPort: number) {
  studioHttpPort = studioPort

  if (studioPort) {
    ucComponentStateReportId = setInterval(async () => {
      let sessions = await querySession.getAllSessions(db)
      for (const session of sessions) {
        let name = projectName(await projectPath(db, session))
        await verifyWsConnection(
          db,
          session.sessionId,
          function handler(message) {
            try {
              let resp = JSON.parse(message)
              if (resp.msgType == 'updateComponents') {
                env.logInfo(
                  `StudioUC${name}: Received WebSocket message: ${resp.delta}`
                )
                let tree = JSON.parse(resp.tree)
                sendUcComponentStateReport(db, session, tree)
              }
            } catch (error) {
              env.logError(
                `StudioUC${name}: Failed to process WebSocket notification message.`
              )
            }
          }
        )
      }
    }, UC_COMPONENT_STATE_REPORTING_INTERVAL)
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
async function verifyWsConnection(
  db: dbTypes.DbType,
  sessionId: number,
  messageHandler: StudioWsMessage
) {
  try {
    let path = await projectPath(db, sessionId)
    if (path && (await isProjectActive(path))) {
      await wsConnect(sessionId, path, messageHandler)
    } else {
      let name = projectName(path)
      wsDisconnect(sessionId, name)
    }
  } catch (error: any) {
    env.logInfo(error.toString())
  }
}

/**
 * Utility function for making websocket connection to Studio server
 * @param sessionId
 * @param path
 * @returns
 */
async function wsConnect(
  sessionId: number,
  path: StudioProjectPath,
  handler: StudioWsMessage
) {
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
      handler(data.toString())
    })
  }
}

async function wsDisconnect(sessionId: number, name: string) {
  env.logInfo(`StudioUC(${name}): WS disconnected.`)
  studioWsConnections[sessionId]?.close()
  studioWsConnections[sessionId] = null
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
async function isProjectActive(path: StudioProjectPath): Promise<boolean> {
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
  if (ucComponentStateReportId) clearInterval(ucComponentStateReportId)
}

async function sendUcComponentStateReport(
  db: dbTypes.DbType,
  session: any,
  ucComponentStates: string
) {
  let socket = wsServer.clientSocket(session.sessionKey)
  let studioIntegration = await integrationEnabled(db, session.sessionId)
  if (socket && studioIntegration) {
    wsServer.sendWebSocketMessage(socket, {
      category: dbEnum.wsCategory.ucComponentStateReport,
      payload: ucComponentStates,
    })
  }
}

/**
 * Notify front-end that current session failed to load.
 * @param {} err
 */
function sendSessionCreationErrorStatus(
  db: dbTypes.DbType,
  err: string,
  sessionId: number
) {
  // TODO: delegate type declaration to actual function
  querySession
    .getAllSessions(db)
    .then((sessions: dbMappingTypes.SessionType[]) =>
      sessions.forEach((session) => {
        if (session.sessionId == sessionId) {
          let socket = wsServer.clientSocket(session.sessionKey)
          if (socket) {
            wsServer.sendWebSocketMessage(socket, {
              category: dbEnum.wsCategory.sessionCreationError,
              payload: err,
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
function sendComponentUpdateStatus(
  db: dbTypes.DbType,
  sessionId: number,
  data: any
) {
  querySession
    .getAllSessions(db)
    .then((sessions: dbMappingTypes.SessionType[]) =>
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
exports.updateComponentByClusterIdAndComponentId =
  updateComponentByClusterIdAndComponentId
exports.projectName = projectName
exports.integrationEnabled = integrationEnabled
exports.initIdeIntegration = initIdeIntegration
exports.deinitIdeIntegration = deinitIdeIntegration
exports.sendSessionCreationErrorStatus = sendSessionCreationErrorStatus
exports.sendComponentUpdateStatus = sendComponentUpdateStatus
