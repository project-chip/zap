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

const axios = require('axios')
const restApi = require('../../src-shared/rest-api.js')
const dbApi = require('../db/db-api.js')
const env = require('../util/env.js')
const importJs = require('../importexport/import.js')
const path = require('path')
const http = require('http-status-codes')

function registerIdeIntegrationApi(db, app) {
  app.get(restApi.ide.open, (req, res) => {
    if (req.query.project) {
      let name = path.posix.basename(req.query.project)
      let zapFile = req.query.project

      env.logInfo(`StudioUC(${name}): Opening/Loading project`)
      importJs
        .importDataFromFile(env.mainDatabase(), zapFile)
        .then((sessionId) => {
          env.logInfo(`Loaded project(${name}), sessionId(${sessionId})`)
          res.send({ sessionId: sessionId })
        })
        .catch(function (err) {
          env.logInfo(`Failed to load project at ${zapFile}`)
        })
    } else {
      res.status(http.StatusCodes.BAD_REQUEST).send({
        error: 'Opening/Loading project: Missing "project" query string',
      })
    }
  })
}

exports.registerIdeIntegrationApi = registerIdeIntegrationApi
