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

const fsPromise = require('fs').promises
const path = require('path')
const util = require('../util/util.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../db/db-enum.js')
const env = require('../util/env.js')
const templateEngine = require('./template-engine.js')

/**
 * Given a path, it will read generation template object into memory.
 *
 * @param {*} context.path
 * @returns context.templates, context.crc
 */
function loadGenTemplate(context) {
  return fsPromise
    .readFile(context.path, 'utf8')
    .then((data) => {
      context.data = data
      return context
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
        var templatePath = path.resolve(
          path.join(path.dirname(context.path), template.path)
        )
        promises.push(
          queryPackage
            .getPackageByPathAndParent(
              context.db,
              templatePath,
              context.packageId
            )
            .then((pkg) => {
              if (pkg == null) {
                // doesn't exist
                return queryPackage.insertPathCrc(
                  context.db,
                  templatePath,
                  null,
                  dbEnum.packageType.genSingleTemplate,
                  context.packageId,
                  template.output
                )
              } else {
                // Already exists
                return 1
              }
            })
        )
      })
      return Promise.all(promises)
    })
    .then(() => context)
}

/**
 * Main API function to load templates from a gen-template.json file.
 *
 * @param {*} db Database
 * @param {*} genTemplatesJson Path to the JSON file
 * @returns the loading context, contains: db, path, crc, packageId and templateData
 */
function loadTemplates(db, genTemplatesJson) {
  var context = {
    db: db,
    path: path.resolve(genTemplatesJson),
  }
  env.logInfo(`Loading generation templates from: ${genTemplatesJson}`)
  return loadGenTemplate(context).then((context) =>
    recordTemplatesPackage(context)
  )
}

/**
 * Generates all the templates inside a toplevel package.
 *
 * @param {*} genResult
 * @param {*} pkg
 * @param {*} generateOnly if NULL then generate all templates, else only generate template whose out file name matches this.
 * @returns Promise that resolves with genResult, that contains all the generated templates, keyed by their 'output'
 */
function generateAllTemplates(genResult, pkg, generateOnly = null) {
  return queryPackage
    .getPackageByParent(genResult.db, pkg.id)
    .then((packages) => {
      var promises = []
      packages.forEach((singlePkg) => {
        if (generateOnly == null)
          promises.push(generateSingleTemplate(genResult, singlePkg))
        else if (generateOnly == singlePkg.version)
          promises.push(generateSingleTemplate(genResult, singlePkg))
      })
      return Promise.all(promises)
    })
    .then(() => {
      genResult.partial = false
      return genResult
    })
}

/**
 * Function that generates a single package and adds it to the generation result.
 *
 * @param {*} genResult
 * @param {*} pkg
 * @returns promise that resolves with the genResult, with newly generated content added.
 */
function generateSingleTemplate(genResult, pkg) {
  return templateEngine
    .produceContent(genResult.db, genResult.sessionId, pkg)
    .then((data) => {
      genResult.content[pkg.version] = data
      genResult.partial = true
      return genResult
    })
}

/**
 * Main API function to generate stuff.
 *
 * @param {*} db Database
 * @param {*} packageId packageId
 * @returns Promise that resolves into a generation result.
 */
function generate(db, sessionId, packageId, generateOnly = null) {
  return queryPackage.getPackageByPackageId(db, packageId).then((pkg) => {
    if (pkg == null) throw `Invalid packageId: ${packageId}`
    var genResult = {
      db: db,
      sessionId: sessionId,
      content: {},
    }
    if (pkg.type === dbEnum.packageType.genTemplatesJson) {
      return generateAllTemplates(genResult, pkg, generateOnly)
    } else if (pkg.type === dbEnum.packageType.genSingleTemplate) {
      return generateSingleTemplate(genResult, pkg)
    } else {
      throw `Invalid package type: ${pkg.type}`
    }
  })
}

/**
 * Generate files and write them into the given directory.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} packageId
 * @param {*} outputDirectory
 * @returns a promise which will resolve when all the files are written.
 */
function generateAndWriteFiles(db, sessionId, packageId, outputDirectory) {
  generate(db, sessionId, packageId).then((genResult) => {
    var promises = []
    for (const f in genResult.content) {
      var content = genResult.content[f]
      var fileName = path.join(outputDirectory, f)
      env.logInfo(`Preparing to write file: ${fileName}`)
      promises.push(fsPromise.writeFile(fileName, content))
    }
    return Promise.all(promises)
  })
}

/**
 * This function takes a string, and resolves a preview object out of it.
 *
 * @param {*} content String to form into preview.
 */
function contentIndexer(content, linesPerIndex = 2000) {
  var index = 0
  var indexedResult = {}
  var code = content.split(/\n/)
  var loc = code.length

  if (content == null || content.length == 0) {
    return Promise.resolve(indexedResult)
  }

  // Indexing the generation result for faster preview pane generation
  for (let i = 0; i < loc; i++) {
    if (i % linesPerIndex === 0) {
      index++
      indexedResult[index] = ''
    }
    indexedResult[index] = indexedResult[index].concat(code[i]).concat('\n')
  }
  return Promise.resolve(indexedResult)
}

/**
 * Generates a single file and feeds it back for preview.
 *
 * @param {*} db
 * @param {*} sessionId
 * @param {*} fileName
 * @returns promise that resolves into a preview object.
 */
function generateSingleFileForPreview(db, sessionId, outFileName) {
  return queryPackage
    .getSessionPackagesByType(
      db,
      sessionId,
      dbEnum.packageType.genTemplatesJson
    )
    .then((pkgs) => {
      var promises = []
      pkgs.forEach((pkg) => {
        promises.push(generate(db, sessionId, pkg.id, outFileName))
      })
      return Promise.all(promises)
    })
    .then((genResultArrays) => {
      var content = ''
      genResultArrays.forEach((gr) => {
        if (outFileName in gr.content) {
          content = gr.content[outFileName]
        }
      })
      return content
    })
    .then((content) => contentIndexer(content))
}

exports.loadTemplates = loadTemplates
exports.loadGenTemplate = loadGenTemplate
exports.recordTemplatesPackage = recordTemplatesPackage
exports.generate = generate
exports.generateAndWriteFiles = generateAndWriteFiles
exports.generateSingleFileForPreview = generateSingleFileForPreview
exports.contentIndexer = contentIndexer
