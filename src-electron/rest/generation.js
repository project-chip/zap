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

import { logError, logInfo } from '../util/env'
import {
  mapDatabase,
  resolveTemplateDirectory,
  compileTemplate,
  infoFromDb,
  groupInfoIntoDbRow,
  resolveHelper,
  generateDataToPreview,
  getGenerationProperties,
} from '../generator/static-generator.js'

/**
 *
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
export function registerGenerationApi(db, app) {
  app.get('/preview/:name', (request, response) => {
    getGenerationProperties('').then(
      (generationOptions) =>
        new Promise((resolve, reject) => {
          // A map to handle to get request
          const generatedCodeMap = {}

          // The template file which provides meta data information on generation
          var currentGenerationOptions = generationOptions['generation-options']

          // Going through each of the generation options and performing generation
          let generationOptionIndex = 0
          for (
            generationOptionIndex = 0;
            generationOptionIndex < currentGenerationOptions.length;
            generationOptionIndex++
          ) {
            let i = 0
            let templateArray = new Set()
            let dbRowTypeArray = new Set()
            let groupInfoToDb =
              currentGenerationOptions[generationOptionIndex][
                'group-info-into-db-row-type'
              ]
            let helperApis =
              currentGenerationOptions[generationOptionIndex]['helper-api-name']
            let handlebarTemplatePerDataRow =
              currentGenerationOptions[generationOptionIndex][
                'handlebar-templates-per-data-row'
              ]

            //creating generatedCodeMap keys which will be the same as request.params.name
            let filename =
              currentGenerationOptions[generationOptionIndex]['filename']
            let extensionIndex = filename.lastIndexOf('.')
            if (extensionIndex > 0) {
              filename = filename.substr(0, extensionIndex)
            }

            for (i = 0; i < handlebarTemplatePerDataRow.length; i++) {
              templateArray.add(handlebarTemplatePerDataRow[i]['hTemplateFile'])
              dbRowTypeArray.add(handlebarTemplatePerDataRow[i]['dbRowType'])
            }

            for (i = 0; i < groupInfoToDb.length; i++) {
              let dbType = groupInfoToDb[i].dbType
              if (!dbRowTypeArray.has(dbType)) {
                dbRowTypeArray.add(dbType)
              }
            }
            generatedCodeMap[filename] = mapDatabase(db)
              .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
              .then((templates) => compileTemplate(templates, templateArray))
              .then((databaseRows) => infoFromDb(databaseRows, dbRowTypeArray))
              .then((databaseRowsWithMoreInfo) =>
                groupInfoIntoDbRow(databaseRowsWithMoreInfo, groupInfoToDb)
              )
              .then((helperResolution) =>
                resolveHelper(helperResolution, helperApis)
              )
              .then((resultToFile) =>
                generateDataToPreview(resultToFile, handlebarTemplatePerDataRow)
              )
              .catch((err) => logError(err))
          }

          // Making sure all generation promises are resolved before handling the get request
          Promise.all(Object.values(generatedCodeMap))
            .then((messages) => {
              if (generatedCodeMap[request.params.name]) {
                generatedCodeMap[request.params.name].then((result) =>
                  response.json(result)
                )
              } else {
                response.json('No Generation Result for this file')
              }
            })
            .catch((err) => console.log(err))
        })
    )
  })
}
