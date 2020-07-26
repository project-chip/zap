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
const staticGenerator = require('../generator/static-generator.js')
const restApi = require('../../src-shared/rest-api.js')

/**
 *
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
function registerGenerationApi(db, app) {
  app.get('/preview/:name/:index', (request, response) => {
    staticGenerator.getGenerationProperties('').then((generationOptions) => {
      staticGenerator.getGeneratedCodeMap(generationOptions, db).then((map) => {
        if (map[request.params.name]) {
          map[request.params.name].then((result) => {
            if (request.params.index in result) {
              response.json({
                replyId: 'preview',
                result: result[request.params.index],
                size: Object.keys(result).length,
              })
            } else {
              response.json('No Generation Result for this file')
            }
          })
        } else {
          response.json('No Generation Result for this file')
        }
      })
    })
  })

  app.get('/preview/:name', (request, response) => {
    staticGenerator.getGenerationProperties('').then((generationOptions) => {
      staticGenerator.getGeneratedCodeMap(generationOptions, db).then((map) => {
        if (map[request.params.name]) {
          map[request.params.name].then((result) => {
            result.replyId = 'preview'
            return response.json(result)
          })
        } else {
          response.json('No Generation Result for this file')
        }
      })
    })
  })

  // Return generatedCodeMap in JSON
  // e.g. {
  //       "cluster-id" : "...",
  //       "enums" : "..."
  //      }
  app.get(restApi.uri.generate, (request, response) => {
    staticGenerator.getGenerationProperties('').then((generationOptions) => {
      staticGenerator.getGeneratedCodeMap(generationOptions, db).then((map) => {
        // making sure all generation promises are resolved before handling the get request
        Promise.all(Object.values(map)).then((values) => {
          let merged = Object.keys(map).reduce(
            (obj, key, index) => ({ ...obj, [key]: values[index] }),
            {}
          )
          merged.replyId = 'generate'
          response.json(merged)
        })
      })
    })
  })
}

exports.registerGenerationApi = registerGenerationApi
