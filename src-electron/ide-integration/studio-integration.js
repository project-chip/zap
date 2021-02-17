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
const axios = require('axios')
const args = require('../util/args.js')
const env = require('../util/env.js')
const querySession = require('../db/query-session.js')
const wsServer = require('../server/ws-server.js')
const dbEnum = require('../../src-shared/db-enum.js')

const localhost = 'http://localhost:'
const op_tree = '/rest/clic/components/all/project/'
const op_add = '/rest/clic/component/add/project/'
const op_remove = '/rest/clic/component/remove/project/'

function getProjectInfo(project) {
  let name = projectName(project)
  let path = localhost + args.studioHttpPort + op_tree + project
  env.logInfo(`StudioUC(${name}): GET: ${path}`)
  return axios.get(path)
}

function addComponent(project, componentId) {
  return component(project, componentId, op_add)
}

function removeComponent(project, componentId) {
  return component(project, componentId, op_remove)
}

function component(project, componentId, operation) {
  return axios.post(localhost + args.studioHttpPort + operation + project, {
    componentId: componentId,
  })
}

function projectName(studioProject) {
  if (studioProject) {
    return studioProject.substr(studioProject.lastIndexOf('_2F') + 3)
  } else {
    return ''
  }
}

function initializeReporting() {
  setInterval(() => {
    sendDirtyFlagStatus()
  }, DIRTY_FLAG_REPORT_INTERVAL_MS)
}

function sendDirtyFlagStatus() {
  // 'sessionId', 'sessionKey' and 'creationTime'.
  querySession.getAllSessions(env.mainDatabase()).then((sessions) =>
    sessions.forEach((session) => {
      let socket = wsServer.clientSocket(session.sessionKey)
      if (socket) {
        querySession
          .getSessionDirtyFlag(env.mainDatabase(), session.sessionId)
          .then((flag) => {
            wsServer.sendWebSocketMessage(socket, {
              category: dbEnum.wsCategory.dirtyFlag,
              payload: !!flag,
            })
          })
      }
    })
  )
}

exports.getProjectInfo = getProjectInfo
exports.addComponent = addComponent
exports.removeComponent = removeComponent
exports.projectName = projectName
exports.initializeReporting = initializeReporting
