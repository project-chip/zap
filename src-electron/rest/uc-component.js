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
const studio = require('../ide-integration/studio-integration.js')
const zcl = require('../ide-integration/zcl.js')
const restApi = require('../../src-shared/rest-api.js')

function httpGetComponentTree(db) {
  return (req, res) => {
    let name = studio.projectName(req.query.studioProject)
    if (name) {
      env.logInfo(`StudioUC(${name}): Get project info`)
      studio
        .getProjectInfo(req.query.studioProject)
        .then((r) => {
          env.logInfo(`StudioUC(${name}): RESP: ${r.status}`)
          res.send(r.data)
        })
        .catch((err) => {
          env.logInfo(`StudioUC(${name}): ERR: ${err}`)
          handleError(err, res)
        })
    } else {
      env.logInfo(
        `StudioUC(${name}): Get project info: missing "studioProject=" query string`
      )
      res.send([])
    }
  }
}

function httpPostComponentUpdateHandler(db, request, response, add) {
  let { studioProject, clusterId, side } = request.body
  let { componentIds } = request.body
  let studioProjectName = studio.projectName(studioProject)
  let act = add ? 'Enabling' : 'Disabling'
  let acted = add ? 'Added' : 'Removed'

  if (typeof studioProject === 'undefined') {
    return response.send({ componentIds: [], added: add })
  }

  // retrieve components to enable
  let promises = []
  if (clusterId) {
    let ids = zcl
      .getComponentIdsByCluster(
        db,
        request.session.zapSessionId,
        clusterId,
        side
      )
      .then((response) => Promise.resolve(response.id))
    promises.push(ids)
  }

  // enabling components via Studio
  Promise.all(promises)
    .then((ids) => ids.flatMap((x) => x))
    .then((ids) => ids.concat(componentIds))
    // enabling components via Studio jetty server.
    .then((ids) => studio.updateComponent(studioProject, ids, add))
    // gather results and reply
    .then((states) => response.send(states))
    .catch((err) => {
      let msg = ''
      if (componentIds) {
        msg = `StudioUC(${studioProjectName}): Failed to update component(${err.componentIds})`
      } else {
        msg = `StudioUC(${studioProjectName}): Failed to update components for cluster(${clusterId})`
      }

      env.logInfo(msg)
      env.logInfo(err)
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
