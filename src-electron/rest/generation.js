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

const generationEngine = require('../generator/generation-engine.js')
const queryPackage = require('../db/query-package.js')

/**
 *
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
function registerGenerationApi(db, app) {
  app.get('/preview/:name/:index', (request, response) => {
    var sessionId = request.session.zapSessionId
    generationEngine
      .generateSingleFileForPreview(db, sessionId, request.params.name)
      .then((previewObject) => {
        if (request.params.index in previewObject) {
          return response.json({
            replyId: 'preview',
            result: previewObject[request.params.index],
            size: Object.keys(previewObject).length,
          })
        } else {
          return response.json({
            replyId: 'preview',
          })
        }
      })
  })

  app.get('/preview/:name', (request, response) => {
    var sessionId = request.session.zapSessionId
    generationEngine
      .generateSingleFileForPreview(db, sessionId, request.params.name)
      .then((previewObject) => {
        previewObject.replyId = 'preview'
        return response.json(previewObject)
      })
  })

  app.get('/preview/', (request, response) => {
    var sessionId = request.session.zapSessionId
    queryPackage.getSessionGenTemplates(db, sessionId).then((previewObject) => {
      previewObject.replyId = 'preview-gentemplates'
      return response.json(previewObject)
    })
  })
}

exports.registerGenerationApi = registerGenerationApi
