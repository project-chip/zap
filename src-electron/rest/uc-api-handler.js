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
 * This module provides the REST API to the generation.
 *
 * @module REST API: generation functions
 */

const env = require('../util/env.js')
const studio = require('../ide-integration/studio-rest-api.js')
const restApi = require('../../src-shared/rest-api.js')
const querySession = require('../db/query-session.js')

function httpGetComponentTree(db) {
  return (req, res) => {
    studio
      .getProjectInfo(db, req.zapSessionId)
      .then((r) => res.send(r.data))
      .catch((err) => handleError(err, res))
  }
}

function httpPostComponentUpdateHandler(db, request, response, add) {
  let { clusterId, side, componentIds } = request.body

  studio
    .updateComponentByClusterIdAndComponentId(
      db,
      request.zapSessionId,
      componentIds,
      clusterId,
      add,
      side
    )
    .then((res) => {
      // invoke reportComponentStatus() ws notification
      response.send(res)
      studio.sendComponentUpdateStatus(db, request.zapSessionId, {
        data: res,
        added: add,
      })
    })
    .finally((err) => {
      // invoke reportComponentStatus() ws notification
      response.send(err)
    })
}

/**
 *  Enable components by 'componentId' or corresponding components specified, via 'defaults', by 'clusterId' / 'roles'
 *
 * @param {*} db
 */
function httpPostComponentAdd(db) {
  return (request, response) =>
    httpPostComponentUpdateHandler(db, request, response, true)
}

function httpPostComponentRemove(db) {
  return (request, response) =>
    httpPostComponentUpdateHandler(db, request, response, false)
}

function handleError(err, res) {
  if (err.response) {
    res.send(err.response.data)
  } else {
    res.send(err.message)
  }
}

exports.get = [
  {
    uri: restApi.uc.componentTree,
    callback: httpGetComponentTree,
  },
]

exports.post = [
  {
    uri: restApi.uc.componentAdd,
    callback: httpPostComponentAdd,
  },
  {
    uri: restApi.uc.componentRemove,
    callback: httpPostComponentRemove,
  },
]
