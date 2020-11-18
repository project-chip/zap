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
const fsPromise = fs.promises
const path = require('path')
const util = require('../util/util.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')
const env = require('../util/env.js')
const templateEngine = require('./template-engine.js')
const dbApi = require('../db/db-api.js')

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
    .then((ctx) => util.calculateCrc(ctx))
    .then((ctx) => {
      context.templateData = JSON.parse(context.data)
      return ctx
    })
    .then((ctx) => {
      var requiredFeatureLevel = 0
      if ('requiredFeatureLevel' in context.templateData) {
        requiredFeatureLevel = context.templateData.requiredFeatureLevel
      }
      var status = util.matchFeatureLevel(requiredFeatureLevel)
      if (status.match) {
        return ctx
      } else {
        throw status.message
      }
    })
}

function recordPackageIfNonexistent(db, path, parentId, packageType, version) {
  return queryPackage
    .getPackageByPathAndParent(db, path, parentId)
    .then((pkg) => {
      if (pkg == null) {
        // doesn't exist
        return queryPackage.insertPathCrc(
          db,
          path,
          null,
          packageType,
          parentId,
          version
        )
      } else {
        // Already exists
        return pkg.id
      }
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

      // Add templates queries to the list of promises
      context.templateData.templates.forEach((template) => {
        var templatePath = path.resolve(
          path.join(path.dirname(context.path), template.path)
        )
        promises.push(
          recordPackageIfNonexistent(
            context.db,
            templatePath,
            context.packageId,
            dbEnum.packageType.genSingleTemplate,
            template.output
          )
        )
      })

      // Add options to the list of promises
      if (context.templateData.options != null) {
        for (const category in context.templateData.options) {
          var data = context.templateData.options[category]

          if (typeof data === 'string' || data instanceof String) {
            // Data is a string, so we will treat it as a relative path to the JSON file.
            var externalPath = path.resolve(
              path.join(path.dirname(context.path), data)
            )
            var promise = fsPromise
              .readFile(externalPath, 'utf8')
              .then((content) => JSON.parse(content))
              .then((data) => {
                var codeLabelArray = []
                for (const code in data) {
                  codeLabelArray.push({ code: code, label: data[code] })
                }
                return codeLabelArray
              })
              .then((codeLabels) =>
                queryPackage.insertOptionsKeyValues(
                  context.db,
                  context.packageId,
                  category,
                  codeLabels
                )
              )
            promises.push(promise)
          } else {
            // Treat this data as an object.
            var codeLabelArray = []
            for (const code in data) {
              codeLabelArray.push({ code: code, label: data[code] })
            }
            promises.push(
              queryPackage.insertOptionsKeyValues(
                context.db,
                context.packageId,
                category,
                codeLabelArray
              )
            )
          }
        }
      }

      // Deal with helpers
      if (context.templateData.helpers != null) {
        context.templateData.helpers.forEach((helper) => {
          var helperPath = path.join(path.dirname(context.path), helper)
          promises.push(
            recordPackageIfNonexistent(
              context.db,
              helperPath,
              context.packageId,
              dbEnum.packageType.genHelper,
              null
            )
          )
        })
      }

      // Deal with overrides
      if (context.templateData.override != null) {
        var overridePath = path.join(
          path.dirname(context.path),
          context.templateData.override
        )
        promises.push(
          recordPackageIfNonexistent(
            context.db,
            overridePath,
            context.packageId,
            dbEnum.packageType.genOverride,
            null
          )
        )
      }
      // Deal with partials
      if (context.templateData.partials != null) {
        context.templateData.partials.forEach((partial) => {
          var partialPath = path.join(path.dirname(context.path), partial.path)
          promises.push(
            queryPackage.insertPathCrc(
              context.db,
              partialPath,
              null,
              dbEnum.packageType.genPartial,
              context.packageId,
              partial.name
            )
          )
        })
      }

      // Deal with zcl extensions
      if (context.templateData.zcl != null) {
        var zclExtension = context.templateData.zcl
        promises.push(
          loadZclExtensions(context.db, context.packageId, zclExtension)
        )
      }
      return Promise.all(promises)
    })
    .then(() => context)
}

/**
 * Returns a promise that will load the zcl extensions.
 *
 * @param {*} zclExt
 * @returns Promise of loading the zcl extensions.
 */
function loadZclExtensions(db, packageId, zclExt) {
  var promises = []
  for (const entity in zclExt) {
    var entityExtension = zclExt[entity]
    var propertyArray = []
    var defaultArrayOfArrays = []
    for (const property in entityExtension) {
      var prop = entityExtension[property]
      propertyArray.push({
        property: property,
        type: prop.type,
        configurability: prop.configurability,
        label: prop.label,
        globalDefault: prop.globalDefault,
      })
      if ('defaults' in prop) {
        defaultArrayOfArrays.push(
          prop.defaults.map((x) => {
            switch (entity) {
              case dbEnum.packageExtensionEntity.cluster:
                return {
                  entityCode: x.clusterCode,
                  parentCode: null,
                  value: x.value,
                }
              case dbEnum.packageExtensionEntity.command:
                return {
                  entityCode: x.commandCode,
                  parentCode: x.clusterCode,
                  value: x.value,
                }
              case dbEnum.packageExtensionEntity.attribute:
                return {
                  entityCode: x.attributeCode,
                  parentCode: x.clusterCode,
                  value: x.value,
                }
              case dbEnum.packageExtensionEntity.deviceType:
                return {
                  entityCode: x.device,
                  parentCode: null,
                  value: x.value,
                }
              default:
                // We don't know how to process defaults otherwise
                return null
            }
          })
        )
      } else {
        defaultArrayOfArrays.push(null)
      }
    }
    promises.push(
      queryPackage.insertPackageExtension(
        db,
        packageId,
        entity,
        propertyArray,
        defaultArrayOfArrays
      )
    )
  }
  return Promise.all(promises)
}

/**
 * Main API function to load templates from a gen-template.json file.
 *
 * @param {*} db Database
 * @param {*} genTemplatesJson Path to the JSON file
 * @returns the loading context, contains: db, path, crc, packageId and templateData, or error
 */
function loadTemplates(db, genTemplatesJson) {
  var context = {
    db: db,
  }
  if (genTemplatesJson == null) {
    context.error = 'No templates file specified.'
    return Promise.resolve(context)
  }

  var file = path.resolve(genTemplatesJson)
  if (!fs.existsSync(file)) {
    context.error = `Can't locate templates file: ${file}`
    return Promise.resolve(context)
  }

  context.path = file
  return dbApi
    .dbBeginTransaction(db)
    .then(() => fsPromise.access(context.path, fs.constants.R_OK))
    .then(() => {
      env.logInfo(`Loading generation templates from: ${context.path}`)
      return loadGenTemplate(context)
    })
    .then((ctx) => recordTemplatesPackage(ctx))
    .catch((err) => {
      env.logInfo(`Can not read templates from: ${context.path}`)
      throw err
    })
    .finally(() => {
      dbApi.dbCommit(db)
    })
}

/**
 * Generates all the templates inside a toplevel package.
 *
 * @param {*} genResult
 * @param {*} genTemplateJsonPkg Package that points to genTemplate.json file
 * @param {*} generateOnly if NULL then generate all templates, else only generate template whose out file name matches this.
 * @returns Promise that resolves with genResult, that contains all the generated templates, keyed by their 'output'
 */
function generateAllTemplates(
  genResult,
  genTemplateJsonPkg,
  generateOnly = null
) {
  return queryPackage
    .getPackageByParent(genResult.db, genTemplateJsonPkg.id)
    .then((packages) => {
      var generationTemplates = []
      var helperPromises = []
      var partialPromises = []
      var overridePath = null

      // First extract overridePath if one exists, as we need to
      // pass it to the generation.
      packages.forEach((singlePkg) => {
        if (singlePkg.type == dbEnum.packageType.genOverride) {
          overridePath = singlePkg.path
        }
      })

      // Next load the partials
      packages.forEach((singlePkg) => {
        if (singlePkg.type == dbEnum.packageType.genPartial) {
          partialPromises.push(
            templateEngine.loadPartial(singlePkg.version, singlePkg.path)
          )
        }
      })

      // Next load the helpers
      packages.forEach((singlePkg) => {
        if (singlePkg.type == dbEnum.packageType.genHelper) {
          helperPromises.push(templateEngine.loadHelper(singlePkg.path))
        }
      })

      // Next prepare the templates
      packages.forEach((singlePkg) => {
        if (singlePkg.type == dbEnum.packageType.genSingleTemplate) {
          if (generateOnly == null || generateOnly == singlePkg.version) {
            generationTemplates.push(singlePkg)
          }
        }
      })

      // And finally go over the actual templates.
      return Promise.all(helperPromises).then(() =>
        Promise.all(partialPromises).then(() => {
          return Promise.all(
            generationTemplates.map((pkg) =>
              generateSingleTemplate(
                genResult,
                pkg,
                genTemplateJsonPkg.id,
                overridePath
              )
            )
          )
        })
      )
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
 * @param {*} singleTemplatePkg Single template package.
 * @returns promise that resolves with the genResult, with newly generated content added.
 */
function generateSingleTemplate(
  genResult,
  singleTemplatePkg,
  genTemplateJsonPackageId,
  overridePath
) {
  return templateEngine
    .produceContent(
      genResult.db,
      genResult.sessionId,
      singleTemplatePkg,
      genTemplateJsonPackageId,
      overridePath
    )
    .then((data) => {
      genResult.content[singleTemplatePkg.version] = data
      genResult.partial = true
      return genResult
    })
}

/**
 * Main API function to generate stuff.
 *
 * @param {*} db Database
 * @param {*} packageId packageId Template package id. It can be either single template or gen template json.
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
    } else {
      throw `Invalid package type: ${pkg.type}`
    }
  })
}

/**
 * Promise to write out a file, optionally creating a backup.
 *
 * @param {*} fileName
 * @param {*} content
 * @param {*} doBackup
 * @returns promise of a written file.
 */
function writeFileWithBackup(fileName, content, doBackup) {
  if (doBackup && fs.existsSync(fileName)) {
    var backupName = fileName.concat('~')
    fsPromise
      .rename(fileName, backupName)
      .then(() => fsPromise.writeFile(fileName, content))
  } else {
    return fsPromise.writeFile(fileName, content)
  }
}

/**
 * Returns a promise that resolves into a content that should be written out to gen result file.
 *
 * @param {*} genResult
 */
function generateGenerationContent(genResult) {
  var out = {
    writeTime: new Date().toString(),
    featureLevel: env.zapVersion().featureLevel,
    creator: 'zap',
    content: [],
  }
  for (const f in genResult.content) {
    out.content.push(f)
  }
  return Promise.resolve(JSON.stringify(out))
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
function generateAndWriteFiles(
  db,
  sessionId,
  packageId,
  outputDirectory,
  options = {
    log: false,
    backup: false,
    genResultFile: false,
  }
) {
  return generate(db, sessionId, packageId).then((genResult) => {
    if (!fs.existsSync(outputDirectory)) {
      if (options.log) {
        console.log(`✅ Creating directory: ${outputDirectory}`)
      }
      fs.mkdirSync(outputDirectory, { recursive: true })
    }
    if (options.log) console.log('🤖 Generating files:')
    var promises = []
    for (const f in genResult.content) {
      var content = genResult.content[f]
      var fileName = path.join(outputDirectory, f)
      if (options.log) console.log(`    ✍  ${fileName}`)
      env.logInfo(`Preparing to write file: ${fileName}`)
      promises.push(writeFileWithBackup(fileName, content, options.backup))
    }
    promises.push(
      generateGenerationContent(genResult).then((generatedContent) => {
        if (options.genResultFile) {
          return writeFileWithBackup(
            path.join(outputDirectory, 'genResult.json'),
            generatedContent,
            options.backup
          )
        } else {
          return
        }
      })
    )

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
exports.generateAndWriteFiles = generateAndWriteFiles
exports.generateSingleFileForPreview = generateSingleFileForPreview
exports.contentIndexer = contentIndexer
exports.generate = generate
