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
 * @module JS API: generator logic
 */

const fs = require('fs')
const path = require('path')
const util = require('../util/util.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../db/db-enum.js')
const env = require('../util/env.js')

/**
 * Given a path, it will read generation template object into memory.
 *
 * @param {*} context.path
 * @returns context.templates, context.crc
 */
function loadGenTemplate(context) {
  return new Promise((resolve, reject) => {
    fs.readFile(context.path, (err, data) => {
      if (err) reject(err)
      context.data = data
      resolve(context)
    })
  })
    .then((context) => util.calculateCrc(context))
    .then((context) => {
      context.templateData = JSON.parse(context.data)
      return context
    })
}

/**
 * Given a loading context, it records the package into the packages table and adds the packageId field into the resolved context.
 *
 * @param {*} context
 * @returns promise that resolves with the same context passed in, except packageId added to it
 */
function recordTemplatesPackage(context) {
  return queryPackage
    .registerTopLevelPackage(
      context.db,
      context.path,
      context.crc,
      dbEnum.packageType.genTemplatesJson,
      context.templateData.version
    )
    .then((packageId) => {
      context.packageId = packageId
      return context
    })
    .then((context) => {
      var promises = []
      env.logInfo(`Loading ${context.templateData.templates.length} templates.`)
      context.templateData.templates.forEach((template) => {
        var templatePath = path.join(path.dirname(context.path), template.path)
        promises.push(
          queryPackage.insertPathCrc(
            context.db,
            templatePath,
            null,
            dbEnum.packageType.genSingleTemplate,
            context.packageId
          )
        )
      })
      return Promise.all(promises)
    })
    .then(() => context)
}

function loadTemplates(db, genTemplatesJson) {
  var context = {
    db: db,
    path: genTemplatesJson,
  }
  env.logInfo(`Loading generation templates from: ${genTemplatesJson}`)
  return loadGenTemplate(context).then((context) =>
    recordTemplatesPackage(context)
  )
}

exports.loadTemplates = loadTemplates
exports.loadGenTemplate = loadGenTemplate
exports.recordTemplatesPackage = recordTemplatesPackage
