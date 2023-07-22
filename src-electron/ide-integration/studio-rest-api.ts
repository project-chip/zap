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
const UC_COMPONENT_STATE_REPORTING_INTERVAL_ID = 6000
import axios, { AxiosPromise, AxiosResponse } from 'axios'
import * as env from '../util/env'
import * as dbTypes from '../../src-shared/types/db-types'
import * as querySession from '../db/query-session.js'
const wsServer = require('../server/ws-server.js')
const dbEnum = require('../../src-shared/db-enum.js')
import * as ucTypes from '../../src-shared/types/uc-component-types'
import * as dbMappingTypes from '../types/db-mapping-types'
import * as http from 'http-status-codes'
import zcl from './zcl.js'

const localhost = 'http://localhost:'
const op_tree = '/rest/clic/components/all/project/'
const op_add = '/rest/clic/component/add/project/'
const op_remove = '/rest/clic/component/remove/project/'

let ucComponentStateReportId: NodeJS.Timeout
let studioHttpPort: number

async function sessionProjectId(db: dbTypes.DbType, sessionId: number) {
  return querySession.getSessionKeyValue(
    db,
    sessionId,
    dbEnum.sessionKey.ideProjectId
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
    dbEnum.sessionKey.ideProjectId
  )
  return typeof path !== 'undefined'
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
  status?: http.StatusCodes
}> {
  let ideProjectId = await sessionProjectId(db, sessionId)
  if (ideProjectId) {
    let path = localhost + studioHttpPort + op_tree + ideProjectId
    env.logDebug(`StudioUC(${ideProjectId}): GET: ${path}`)
    return axios
      .get(path)
      .then((resp) => {
        env.logDebug(`StudioUC(${ideProjectId}): RESP: ${resp.status}`)
        return resp
      })
      .catch((err) => {
        env.logError(`StudioUC(${ideProjectId}): ERR: ${err}`)
        return { data: [] }
      })
  } else {
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
  let ideProjectId = await sessionProjectId(db, sessionId)

  if (Object.keys(componentIds).length) {
    promises = componentIds.map((componentId) =>
      httpPostComponentUpdate(ideProjectId, componentId, add)
    )
  }

  return Promise.all(promises).then((responses) =>
    responses.map((resp, index) => {
      return {
        id: componentIds[index],
        status: resp.status,
        data: resp.data,
      }
    })
  )
}

async function httpPostComponentUpdate(
  ideProjectId: string,
  componentId: string,
  add: boolean
) {
  let operation = add ? op_add : op_remove
  let operationText = add ? 'add' : 'remove'
  return axios
    .post(localhost + studioHttpPort + operation + ideProjectId, {
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
          status: http.StatusCodes.NOT_FOUND,
          id: componentId,
          data: `StudioUC(${ideProjectId}): Failed to ${operationText} component(${componentId})`,
        }
      }
    })
}

/**
 * Start the dirty flag reporting interval.
 *
 */
function initIdeIntegration(db: dbTypes.DbType, idePort: number) {
  studioHttpPort = idePort

  if (idePort) {
    ucComponentStateReportId = setInterval(() => {
      sendUcComponentStateReport(db)
    }, UC_COMPONENT_STATE_REPORTING_INTERVAL_ID)
  }
}

/**
 * Clears up the reporting interval.
 */
function deinitIdeIntegration() {
  if (ucComponentStateReportId) clearInterval(ucComponentStateReportId)
}

async function sendUcComponentStateReport(db: dbTypes.DbType) {
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

/**
 * Notify front-end that current session failed to load.
 * @param {} err
 */
async function sendSessionCreationErrorStatus(
  db: dbTypes.DbType,
  err: string,
  sessionId: number
) {
  // TODO: delegate type declaration to actual function
  return querySession
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
async function sendComponentUpdateStatus(
  db: dbTypes.DbType,
  sessionId: number,
  data: any
) {
  return querySession
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
exports.updateComponentByClusterIdAndComponentId =
  updateComponentByClusterIdAndComponentId
exports.initIdeIntegration = initIdeIntegration
exports.deinitIdeIntegration = deinitIdeIntegration
exports.sendSessionCreationErrorStatus = sendSessionCreationErrorStatus
exports.sendComponentUpdateStatus = sendComponentUpdateStatus
