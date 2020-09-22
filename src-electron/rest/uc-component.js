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
const axios = require('axios')
const studio = require('./studio-integration.js')
const replyId = 'uc-tree'
const http = require('http-status-codes')
const restApi = require('../../src-shared/rest-api.js')

/**
 * Register server side REST API for front-end to interact with Studio components.
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
function registerUcComponentApi(db, app) {
  app.get(restApi.uc.componentTree, (req, res) => {
    let name = studio.projectName(req.query.studioProject)
    if (name) {
      env.logInfo(`StudioUC(${name}): Get project info`)
      studio
        .getProjectInfo(req.query.studioProject)
        .then(function (response) {
          env.logInfo(`StudioUC(${name}): RESP: ${response.status}`)
          let r = {
            replyId: restApi.uc.componentTreeReply,
            data: response.data,
          }
          res.send(r)
        })
        .catch(function (err) {
          env.logInfo(`StudioUC(${name}): ERR: ${err}`)
          handleError(err, res)
        })
    } else {
      env.logInfo(
        `StudioUC(${name}): Get project info: missing "studioProject=" query string`
      )
    }
  })

  app.get(restApi.uc.componentAdd, (req, res) => {
    let name = studio.projectName(req.query.studioProject)
    env.logInfo(
      `StudioUC(${name}): Enabling component "${req.query.componentId}"`
    )
    studio
      .addComponent(req.query.studioProject, req.query.componentId)
      .then((r) => {
        if (r.status == http.StatusCodes.OK) {
          env.logInfo(
            `StudioUC(${name}): Component "${req.query.componentId}" removed.`
          )
        }
        return res.send(r.data)
      })
      .catch((err) => handleError(err, res))
  })

  app.get(restApi.uc.componentRemove, (req, res) => {
    let name = studio.projectName(req.query.studioProject)
    env.logInfo(
      `StudioUC(${name}): Disabling component "${req.query.componentId}"`
    )
    studio
      .removeComponent(req.query.studioProject, req.query.componentId)
      .then((r) => {
        if (r.status == http.StatusCodes.OK) {
          env.logInfo(
            `StudioUC(${name}): Component "${req.query.componentId}" removed.`
          )
        }
        return res.send(r.data)
      })
      .catch((err) => handleError(err, res))
  })
}

function handleError(err, res) {
  if (err.response) {
    res.send(err.response.data)
  } else {
    res.send(err.message)
  }
}

exports.registerUcComponentApi = registerUcComponentApi
