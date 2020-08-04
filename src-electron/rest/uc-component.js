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
const restApi = require('../../src-shared/rest-api.js')
const args = require('../util/args.js')
const axios = require('axios')

const replyId = 'uc-tree'

const studioServerUrl = `http://localhost:` + args.studioPort
const op_tree = '/rest/clic/components/all/project/'
const op_add = '/rest/clic/component/add/project/'
const op_remove = '/rest/clic/component/remove/project/'

/**
 *
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
function registerUcComponentApi(db, app) {
  // app.get('/uc/info', (req, res) => {})

  app.get('/uc/tree', (req, res) => {
    axios
      .get(studioServerUrl + op_tree + req.query.studioProject)
      .then(function (response) {
        let r = {
          replyId: replyId,
          data: response.data,
        }
        res.send(r)
      })
      .catch(function (err) {
        res.send(err.response.data)
      })
  })

  app.get('/uc/add', (req, res) => {
    axios
      .post(studioServerUrl + op_add + req.query.studioProject, {
        componentId: req.query.componentId,
      })
      .then((r) => res.send(r.data))
      .catch(function (err) {
        res.send(err.response.data)
      })
  })

  app.get('/uc/remove', (req, res) => {
    axios
      .post(studioServerUrl + op_remove + req.query.studioProject, {
        componentId: req.query.componentId,
      })
      .then((r) => res.send(r.data))
      .catch(function (err) {
        res.send(err.response.data)
      })
  })
}

exports.registerUcComponentApi = registerUcComponentApi
