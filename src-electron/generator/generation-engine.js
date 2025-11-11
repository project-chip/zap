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

const _ = require('lodash')
const fs = require('fs')
const fsPromise = fs.promises
const path = require('path')
const util = require('../util/util.js')
const queryPackage = require('../db/query-package.js')
const querySession = require('../db/query-session')
const dbEnum = require('../../src-shared/db-enum.js')
const env = require('../util/env')
const templateEngine = require('./template-engine.js')
const dbApi = require('../db/db-api.js')
const dbCache = require('../db/db-cache.js')
const queryNotification = require('../db/query-package-notification.js')

/**
 * Finds and reads JSON files referenced in a nested object.
 *
 * @param {Object} obj - The object to search for JSON file references.
 * @param {string} basePath - The base directory to resolve relative paths.
 * @returns {Promise<string>} - A promise that resolves to the concatenated content of all JSON files.
 */
async function findAndReadJsonFiles(obj, basePath) {
  let additionalJsonContent = ''
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].endsWith('.json')) {
      // If the value is a JSON file reference, read its content
      let jsonFilePath = path.resolve(path.join(basePath, obj[key]))
      if (fs.existsSync(jsonFilePath)) {
        additionalJsonContent += await fsPromise.readFile(jsonFilePath, 'utf8')
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // If the value is an object, recursively search for JSON file references
      additionalJsonContent += await findAndReadJsonFiles(obj[key], basePath)
    }
  }
  return additionalJsonContent
}

/**
 * Given a path, it will read generation template object into memory.
 *
 * @param {*} templatePath
 * @returns Object that contains: data, crc, templateData
 */
async function loadGenTemplateFromFile(templatePath) {
  let ret = {}
  ret.data = await fsPromise.readFile(templatePath, 'utf8')
  ret.templateData = JSON.parse(ret.data)
  // Find the json files within the gen template json files and add them to the
  // crc as well.
  let allJsonContentInTemplatePath = await findAndReadJsonFiles(
    ret.templateData,
    path.dirname(templatePath)
  )
  let checksumData = ret.data + allJsonContentInTemplatePath
  ret.crc = util.checksum(checksumData)
  let requiredFeatureLevel = 0
  if ('requiredFeatureLevel' in ret.templateData) {
    requiredFeatureLevel = ret.templateData.requiredFeatureLevel
  }
  let status = util.matchFeatureLevel(requiredFeatureLevel, templatePath)
  if (status.match) {
    return ret
  } else {
    throw status.message
  }
}

/**
 * Inserts the package details when they do not exist.
 *
 * @param {*} db
 * @param {*} packagePath
 * @param {*} parentId
 * @param {*} packageType
 * @param {*} version
 * @param {*} category
 * @param {*} description
 * @returns Promise of package insertion
 */
async function recordPackageIfNonexistent(
  db,
  packagePath,
  parentId,
  packageType,
  version,
  category,
  description
) {
  let pkg = await queryPackage.getPackageByPathAndParent(
    db,
    packagePath,
    parentId
  )

  if (pkg == null) {
    // doesn't exist
    return queryPackage.insertPathCrc(
      db,
      packagePath,
      null,
      packageType,
      parentId,
      version,
      category,
      description
    )
  } else {
    // Already exists
    return pkg.id
  }
}

/**
 * Insert the template options from the json meta data file.
 *
 * @param {*} db
 * @param {*} packageId
 * @param {*} category
 * @param {*} externalPath
 * @returns Promise of inserted template options
 */
async function loadTemplateOptionsFromJsonFile(
  db,
  packageId,
  category,
  externalPath
) {
  let content = await fsPromise.readFile(externalPath, 'utf8')
  let jsonData = JSON.parse(content)
  let codeLabels = []
  for (const code of Object.keys(jsonData)) {
    codeLabels.push({ code: code, label: jsonData[code] })
  }

  return queryPackage.insertOptionsKeyValues(
    db,
    packageId,
    category,
    codeLabels
  )
}

/**
 * Given a loading context and whether the package is in sync, it records the
 * package into the packages table and adds the packageId field into the resolved context.
 *
 * @param {*} context
 * @param {*} isTopLevelPackageInSync
 * @returns promise that resolves with the same context passed in, except packageId added to it
 */
async function recordTemplatesPackage(context, isTopLevelPackageInSync) {
  let topLevel = await queryPackage.registerTopLevelPackage(
    context.db,
    context.path,
    context.crc,
    dbEnum.packageType.genTemplatesJson,
    context.templateData.version,
    context.templateData.category,
    context.templateData.description,
    isTopLevelPackageInSync
  )
  context.packageId = topLevel.id
  if (topLevel.existedPreviously) return context

  let promises = []
  let allTemplates = context.templateData.templates

  env.logDebug(`Loading ${allTemplates.length} templates.`)
  allTemplates.forEach((template) => {
    let templatePath = path.resolve(
      path.join(path.dirname(context.path), template.path)
    )
    if (!template.ignore) {
      promises.push(
        recordPackageIfNonexistent(
          context.db,
          templatePath,
          context.packageId,
          dbEnum.packageType.genSingleTemplate,
          0,
          template.output,
          template.name
        ).then((id) => {
          // We loaded the individual file, now we add options
          if (template.iterator) {
            return queryPackage.insertOptionsKeyValues(
              context.db,
              id,
              dbEnum.packageOptionCategory.outputOptions,
              [
                {
                  code: 'iterator',
                  label: template.iterator
                }
              ]
            )
          }
        })
      )
    }
  })

  // Add options to the list of promises
  if (context.templateData.options != null) {
    for (const category of Object.keys(context.templateData.options)) {
      let data = context.templateData.options[category]

      if (_.isString(data)) {
        // Data is a string, so we will treat it as a relative path to the JSON file.
        let externalPath = path.resolve(
          path.join(path.dirname(context.path), data)
        )
        promises.push(
          loadTemplateOptionsFromJsonFile(
            context.db,
            context.packageId,
            category,
            externalPath
          )
        )
      } else {
        // Treat this data as an object.
        let codeLabelArray = []
        for (const code of Object.keys(data)) {
          codeLabelArray.push({
            code: code,
            label: data[code]
          })
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

  // Deal with categories
  let helperCategories = []
  if (context.templateData.categories != null) {
    context.templateData.categories.forEach((cat) => {
      helperCategories.push({
        code: cat,
        label: ''
      })
    })
  }
  if (helperCategories.length > 0) {
    promises.push(
      queryPackage.insertOptionsKeyValues(
        context.db,
        context.packageId,
        dbEnum.packageOptionCategory.helperCategories,
        helperCategories
      )
    )
  }

  // Deal with helpers
  let helperAliases = []
  if (context.templateData.helpers != null) {
    context.templateData.helpers.forEach((helper) => {
      let pkg = templateEngine.findHelperPackageByAlias(helper)

      if (pkg != null) {
        // The helper listed is an alias to a built-in helper
        // Put it in the array to write into DB later.
        helperAliases.push({
          code: helper,
          label: ''
        })
      } else {
        // We don't have an alias by that name, so we assume it's a path.
        let helperPath = path.join(path.dirname(context.path), helper)
        promises.push(
          recordPackageIfNonexistent(
            context.db,
            helperPath,
            context.packageId,
            dbEnum.packageType.genHelper,
            null,
            null,
            null
          )
        )
      }
    })
  }
  if (helperAliases.length > 0) {
    promises.push(
      queryPackage.insertOptionsKeyValues(
        context.db,
        context.packageId,
        dbEnum.packageOptionCategory.helperAliases,
        helperAliases
      )
    )
  }

  // Deal with resource references
  let resources = []
  if (context.templateData.resources != null) {
    for (let key of Object.keys(context.templateData.resources)) {
      let resourcePath = path.join(
        path.dirname(context.path),
        context.templateData.resources[key]
      )
      if (!fs.existsSync(resourcePath))
        throw new Error(`Resource not found: ${resourcePath}`)
      resources.push({
        code: key,
        label: resourcePath
      })
    }
  }
  if (resources.length > 0) {
    promises.push(
      queryPackage.insertOptionsKeyValues(
        context.db,
        context.packageId,
        dbEnum.packageOptionCategory.resources,
        resources
      )
    )
  }

  // Deal with overrides
  if (context.templateData.override != null) {
    let overridePath = path.join(
      path.dirname(context.path),
      context.templateData.override
    )
    promises.push(
      recordPackageIfNonexistent(
        context.db,
        overridePath,
        context.packageId,
        dbEnum.packageType.genOverride,
        null,
        null,
        null
      )
    )
  }
  // Deal with partials
  if (context.templateData.partials != null) {
    context.templateData.partials.forEach((partial) => {
      let partialPath = path.join(path.dirname(context.path), partial.path)
      promises.push(
        queryPackage.insertPathCrc(
          context.db,
          partialPath,
          null,
          dbEnum.packageType.genPartial,
          context.packageId,
          0,
          partial.name,
          ''
        )
      )
    })
  }

  // Deal with zcl extensions
  if (context.templateData.zcl != null) {
    let zclExtension = context.templateData.zcl
    promises.push(
      loadZclExtensions(
        context.db,
        context.packageId,
        zclExtension,
        context.path
      )
    )
  }
  await Promise.all(promises)
  return context
}

/**
 * This method takes extension data in JSON, and converts it into
 * an object that contains:
 *    entityCode, entityQualifier, parentCode, manufacturerCode and value
 * @param {*} entityType
 * @param {*} entity
 * @returns object that can be used for database injection
 */
function decodePackageExtensionEntity(entityType, entity) {
  switch (entityType) {
    case dbEnum.packageExtensionEntity.cluster:
      return {
        entityCode: entity.clusterCode,
        entityQualifier: entity.role,
        manufacturerCode: null,
        parentCode: null,
        value: entity.value
      }
    case dbEnum.packageExtensionEntity.command:
      return {
        entityCode: parseInt(entity.commandCode),
        entityQualifier: entity.source,
        manufacturerCode: null,
        parentCode: parseInt(entity.clusterCode),
        value: entity.value
      }
    case dbEnum.packageExtensionEntity.event:
      return {
        entityCode: parseInt(entity.eventCode),
        manufacturerCode: null,
        parentCode: parseInt(entity.clusterCode),
        value: entity.value
      }
    case dbEnum.packageExtensionEntity.attribute:
      return {
        entityCode: parseInt(entity.attributeCode),
        entityQualifier: null,
        manufacturerCode: null,
        parentCode: parseInt(entity.clusterCode),
        value: entity.value
      }
    case dbEnum.packageExtensionEntity.deviceType:
      return {
        entityCode: entity.device,
        entityQualifier: null,
        manufacturerCode: null,
        parentCode: null,
        value: entity.value
      }
    case dbEnum.packageExtensionEntity.attributeType:
      return {
        entityCode: null,
        entityQualifier: entity.type,
        manufacturerCode: null,
        parentCode: null,
        value: entity.value
      }
    default:
      // We don't know how to process defaults otherwise
      return null
  }
}

/**
 * Returns a promise that will load the zcl extensions.
 *
 * @param {*} zclExt
 * @returns Promise of loading the zcl extensions.
 */
async function loadZclExtensions(db, packageId, zclExt, defaultsPath) {
  let promises = []
  for (const entity of Object.keys(zclExt)) {
    let entityExtension = zclExt[entity]
    let propertyArray = []
    let defaultArrayOfArrays = []
    for (const property of Object.keys(entityExtension)) {
      let prop = entityExtension[property]
      propertyArray.push({
        property: property,
        type: prop.type,
        configurability: prop.configurability,
        label: prop.label,
        globalDefault: prop.globalDefault
      })
      if ('defaults' in prop) {
        if (
          typeof prop.defaults === 'string' ||
          prop.defaults instanceof String
        ) {
          // Data is a string, so we will treat it as a relative path to the JSON file.
          let externalPath = path.resolve(
            path.join(path.dirname(defaultsPath), prop.defaults)
          )
          let data = await fsPromise
            .readFile(externalPath, 'utf8')
            .then((content) => JSON.parse(content))
            .catch((err) => {
              env.logWarning(
                `Invalid file! Failed to load defaults from: ${prop.defaults}`
              )
              queryNotification.setNotification(
                db,
                'WARNING',
                `Invalid file! Failed to load defaults from: ${prop.defaults}`,
                packageId,
                2
              )
            })

          if (data) {
            if (!Array.isArray(data)) {
              env.logWarning(
                `Invalid file format! Failed to load defaults from: ${prop.defaults}`
              )
              queryNotification.setNotification(
                db,
                'WARNING',
                `Invalid file format! Failed to load defaults from: ${prop.defaults}`,
                packageId,
                2
              )
            } else {
              defaultArrayOfArrays.push(
                data.map((x) => decodePackageExtensionEntity(entity, x))
              )
            }
          }
        } else {
          defaultArrayOfArrays.push(
            prop.defaults.map((x) => decodePackageExtensionEntity(entity, x))
          )
        }
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
 * Api that loads an array of template JSON files or a single file if
 * you just pass in one String.
 *
 * @param {*} db
 * @param {*} genTemplatesJsonArray
 */
async function loadTemplates(
  db,
  genTemplatesJsonArray,
  options = {
    failOnLoadingError: true
  }
) {
  if (Array.isArray(genTemplatesJsonArray)) {
    let globalCtx = {
      packageIds: [],
      packageId: null,
      templateData: []
    }
    if (genTemplatesJsonArray != null && genTemplatesJsonArray.length > 0) {
      for (let jsonFile of genTemplatesJsonArray) {
        if (jsonFile == null || jsonFile == '') continue
        let ctx = await loadGenTemplatesJsonFile(db, jsonFile)
        if (ctx.error) {
          if (options.failOnLoadingError) globalCtx.error = ctx.error
        } else {
          if (globalCtx.packageId == null) {
            globalCtx.packageId = ctx.packageId
          }
          globalCtx.templateData.push(ctx.templateData)
          globalCtx.packageIds.push(ctx.packageId)
        }
      }
    }
    return globalCtx
  } else if (genTemplatesJsonArray != null) {
    let ctx = await loadGenTemplatesJsonFile(db, genTemplatesJsonArray)
    ctx.packageIds = [ctx.packageId]
    return ctx
  } else {
    // We didn't load anything, we don't return anything.
    return {
      nop: true
    }
  }
}

/**
 * Main API async function to load templates from a gen-template.json file.
 *
 * @param {*} db Database
 * @param {*} genTemplatesJson Path to the JSON file or an array of paths to JSON file
 * @returns the loading context, contains: db, path, crc, packageId and templateData, or error
 */
async function loadGenTemplatesJsonFile(db, genTemplatesJson) {
  let context = {
    db: db
  }
  if (genTemplatesJson == null) {
    context.error = 'No templates file specified.'
    env.logWarning(context.error)
    return Promise.resolve(context)
  }
  let isTransactionAlreadyExisting = dbApi.isTransactionActive()

  let file = path.resolve(genTemplatesJson)
  if (!fs.existsSync(file)) {
    context.error = `Can't locate templates file: ${file}`
    env.logWarning(context.error)
    return context
  }
  context.path = file
  if (!isTransactionAlreadyExisting) await dbApi.dbBeginTransaction(db)
  try {
    Object.assign(context, await loadGenTemplateFromFile(file))
    let isTopLevelPackageInSync = true
    // Check if that package already exist with the same crc
    let existingPackage = await queryPackage.getPackageByPathAndType(
      db,
      file,
      dbEnum.packageType.genTemplatesJson
    )
    if (existingPackage && existingPackage.crc !== context.crc) {
      // Package crc has changed so turning the old package out of sync(IN_SYNC=0)
      await queryPackage.updatePackageIsInSync(db, existingPackage.id, 0)
      isTopLevelPackageInSync = false
    }
    context = await recordTemplatesPackage(context, isTopLevelPackageInSync)
    return context
  } catch (err) {
    env.logInfo(`Can not read templates from: ${file}`)
    throw err
  } finally {
    if (!isTransactionAlreadyExisting) await dbApi.dbCommit(db)
  }
}

/**
 * Get the package information from the given package ID.
 *
 * @param {*} db
 * @param {*} genTemplatesPkgId
 * @returns package information
 */
async function retrievePackageMetaInfo(db, genTemplatesPkgId) {
  let metaInfo = {
    aliases: [],
    categories: [],
    resources: {}
  }

  let aliases = await queryPackage.selectAllOptionsValues(
    db,
    genTemplatesPkgId,
    dbEnum.packageOptionCategory.helperAliases
  )
  for (let a of aliases) {
    metaInfo.aliases.push(a.optionCode)
  }

  let categories = await queryPackage.selectAllOptionsValues(
    db,
    genTemplatesPkgId,
    dbEnum.packageOptionCategory.helperCategories
  )
  for (let c of categories) {
    metaInfo.categories.push(c.optionCode)
  }

  let resources = await queryPackage.selectAllOptionsValues(
    db,
    genTemplatesPkgId,
    dbEnum.packageOptionCategory.resources
  )
  for (let c of resources) {
    metaInfo.resources[c.optionCode] = c.optionLabel
  }

  return metaInfo
}

/**
 * Generates all the templates inside a toplevel package.
 *
 * @param {*} genResult
 * @param {*} genTemplateJsonPkg Package that points to genTemplate.json file
 * @param {*} generateOnly if NULL then generate all templates, else only generate template whose out file name matches this.
 * @returns Promise that resolves with genResult, that contains all the generated templates, keyed by their 'output'
 */
async function generateAllTemplates(
  genResult,
  genTemplateJsonPkg,
  options = {
    generateOnly: null,
    disableDeprecationWarnings: false,
    generateSequentially: false
  }
) {
  let packages = await queryPackage.getPackageByParent(
    genResult.db,
    genTemplateJsonPkg.id
  )
  let generationTemplates = []
  let overridePath = null

  let hb = templateEngine.hbInstance()
  let context = {
    db: genResult.db,
    sessionId: genResult.sessionId,
    hb: hb
  }

  for (let pkg of packages) {
    let outputOptions = await queryPackage.selectAllOptionsValues(
      genResult.db,
      pkg.id,
      dbEnum.packageOptionCategory.outputOptions
    )
    outputOptions.forEach((opt) => {
      if (opt.optionCode == 'iterator') {
        pkg.iterator = opt.optionLabel
      }
    })
  }

  // First extract overridePath if one exists, as we need to
  // pass it to the generation.
  packages.forEach((singlePkg) => {
    if (singlePkg.type == dbEnum.packageType.genOverride) {
      overridePath = singlePkg.path
    }
  })

  // Next load the partials
  const partialPackages = packages.filter(
    (pkg) => pkg.type === dbEnum.packageType.genPartial
  )
  const partialDataArray = await Promise.all(
    partialPackages.map((pkg) => fsPromise.readFile(pkg.path, 'utf8'))
  )
  partialDataArray.forEach((data, index) => {
    const singlePkg = partialPackages[index]
    templateEngine.loadPartial(hb, singlePkg.category, data)
  })

  // Let's collect the required list of helpers.
  let metaInfo = await retrievePackageMetaInfo(
    genResult.db,
    genTemplateJsonPkg.id
  )

  // Initialize helpers package. This is based on the specific
  // list that was calculated above in the `metaInfo`
  templateEngine.initializeBuiltInHelpersForPackage(hb, metaInfo)

  // Next load the addon helpers which were not yet initialized earlier.
  packages.forEach((singlePkg) => {
    if (singlePkg.type == dbEnum.packageType.genHelper) {
      templateEngine.loadHelper(hb, singlePkg.path, context)
    }
  })

  // Next prepare the templates
  packages.forEach((singlePkg) => {
    if (singlePkg.type == dbEnum.packageType.genSingleTemplate) {
      if (options.generateOnly == null) {
        generationTemplates.push(singlePkg)
      } else if (
        Array.isArray(options.generateOnly) &&
        options.generateOnly.includes(singlePkg.category)
      ) {
        // If generateOnly is an array that contains the name
        generationTemplates.push(singlePkg)
      } else if (options.generateOnly == singlePkg.category) {
        // If the generate Only contains the name, then we include it
        generationTemplates.push(singlePkg)
      }
    }
  })

  if (options.generateSequentially) {
    await util.executePromisesSequentially(generationTemplates, (t) =>
      generateSingleTemplate(hb, metaInfo, genResult, t, genTemplateJsonPkg, {
        overridePath: overridePath,
        disableDeprecationWarnings: options.disableDeprecationWarnings
      })
    )
  } else {
    let templates = generationTemplates.map((pkg) =>
      generateSingleTemplate(hb, metaInfo, genResult, pkg, genTemplateJsonPkg, {
        overridePath: overridePath,
        disableDeprecationWarnings: options.disableDeprecationWarnings
      })
    )
    await Promise.all(templates)
  }

  if (genResult.hasErrors) {
    for (const [key, value] of Object.entries(genResult.errors)) {
      console.error(`${key}: ${value}`)
    }
  }
  genResult.partial = false
  return genResult
}

/**
 * Function that generates a single package and adds it to the generation result.
 *
 * @param {*} genResult
 * @param {*} singleTemplatePkg Single template package.
 * @returns promise that resolves with the genResult, with newly generated content added.
 */
async function generateSingleTemplate(
  hb,
  metaInfo,
  genResult,
  singleTemplatePkg,
  genTemplateJsonPackage,
  options = {
    overridePath: null,
    disableDeprecationWarnings: false
  }
) {
  let genStart = process.hrtime.bigint()
  //console.log(`Start generating from template: ${singleTemplatePkg?.path}`)
  env.logInfo(`Start generating from template: ${singleTemplatePkg?.path}`)
  let genFunction
  if (singleTemplatePkg.iterator != null) {
    genFunction = templateEngine.produceIterativeContent
  } else {
    genFunction = templateEngine.produceContent
  }
  try {
    let resultArray = await genFunction(
      hb,
      metaInfo,
      genResult.db,
      genResult.sessionId,
      singleTemplatePkg,
      genTemplateJsonPackage,
      options
    )
    for (let result of resultArray) {
      if (!result.content) {
        console.error(`No content generated for ${result.key}`)
      }
      genResult.content[result.key] = result.content
      genResult.stats[result.key] = result.stats
    }
    genResult.partial = true
    let nsDuration = process.hrtime.bigint() - genStart
    //console.log(`Finish generating from template: ${singleTemplatePkg?.path}: ${util.duration(nsDuration)}`)
    env.logInfo(
      `Finish generating from template: ${
        singleTemplatePkg?.path
      }: ${util.duration(nsDuration)}`
    )
    return genResult
  } catch (err) {
    genResult.errors[singleTemplatePkg.category] = err
    genResult.hasErrors = true
  }
}

/**
 * Main API async function to generate stuff.
 *
 * @param {*} db Database
 * @param {*} sessionId
 * @param {*} templatePackageId packageId Template package id. It can be either single template or gen template json.
 * @returns Promise that resolves into a generation result.
 * @param {*} templateGeneratorOptions
 * @param {*} options
 * @returns Promise that resolves into a generation result.
 */
async function generate(
  db,
  sessionId,
  templatePackageId,
  templateGeneratorOptions = {},
  options = {
    generateOnly: null,
    disableDeprecationWarnings: false
  }
) {
  let pkg = await queryPackage.getPackageByPackageId(db, templatePackageId)
  if (pkg == null) throw new Error(`Invalid packageId: ${templatePackageId}`)
  let genResult = {
    db: db,
    sessionId: sessionId,
    content: {},
    stats: {},
    errors: {},
    hasErrors: false,
    generatorOptions: templateGeneratorOptions,
    templatePath: path.dirname(pkg.path)
  }
  if (pkg.type === dbEnum.packageType.genTemplatesJson) {
    return generateAllTemplates(genResult, pkg, options)
  } else {
    throw new Error(`Invalid package type: ${pkg.type}`)
  }
}

/**
 * Promise to write out a file, optionally creating a backup.
 *
 * @param {*} fileName
 * @param {*} content
 * @param {*} doBackup
 * @returns promise of a written file.
 */
async function writeFileWithBackup(fileName, content, doBackup) {
  if (doBackup && fs.existsSync(fileName)) {
    let backupName = fileName.concat('~')
    await fsPromise.rename(fileName, backupName)
    return fsPromise.writeFile(fileName, content)
  } else {
    // we need to ensure that directories exist.
    await fsPromise.mkdir(path.dirname(fileName), { recursive: true })
    return fsPromise.writeFile(fileName, content)
  }
}

/**
 * Returns a promise that resolves into a content that should be written out to gen result file.
 *
 * @param {*} genResult
 */
async function generateGenerationContent(genResult, timing = {}) {
  let out = {
    writeTime: new Date().toString(),
    featureLevel: env.zapVersion().featureLevel,
    creator: 'zap',
    content: [],
    timing: timing,
    stats: {}
  }
  for (const f of Object.keys(genResult.content).sort((a, b) =>
    a.localeCompare(b)
  )) {
    out.content.push(f)
  }
  return Promise.resolve(JSON.stringify(out, null, 2))
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
async function generateAndWriteFiles(
  db,
  sessionId,
  templatePackageId,
  outputDirectory,
  options = {
    logger: (msg) => {
      // Empty logger is the default.
    },
    backup: false,
    genResultFile: false,
    skipPostGeneration: false,
    appendGenerationSubdirectory: false,
    generationLog: null
  }
) {
  // in case user customization has invalidated the cache
  dbCache.clear()

  let timing = {}
  if (options.fileLoadTime) {
    timing.fileLoad = {
      nsDuration: Number(options.fileLoadTime),
      readableDuration: util.duration(options.fileLoadTime)
    }
  }
  let hrstart = process.hrtime.bigint()
  let genOptions = await queryPackage.selectAllOptionsValues(
    db,
    templatePackageId,
    dbEnum.packageOptionCategory.generator
  )

  // Reduce the long array from query into a single object
  let templateGeneratorOptions = genOptions.reduce((acc, current) => {
    acc[current.optionCode] = current.optionLabel
    return acc
  }, {})

  let genResult = await generate(
    db,
    sessionId,
    templatePackageId,
    templateGeneratorOptions
  )

  // The path we append, assuming you specify the --appendGenerationSubdirectory, and a
  // appendDirectory generator option is present in the genTemplates.json file
  let appendedPath = null
  if (
    templateGeneratorOptions.appendDirectory != null &&
    options.appendGenerationSubdirectory
  ) {
    appendedPath = templateGeneratorOptions.appendDirectory
  }

  if (appendedPath != null) {
    outputDirectory = path.join(outputDirectory, appendedPath)
  }

  if (!fs.existsSync(outputDirectory)) {
    options.logger(
      env.formatEmojiMessage('✅', `Creating directory: ${outputDirectory}`)
    )
    fs.mkdirSync(outputDirectory, { recursive: true })
  }

  options.logger(env.formatEmojiMessage('🤖', 'Generating files:'))
  let promises = []
  for (const f of Object.keys(genResult.content)) {
    let content = genResult.content[f]
    let fileName = path.join(outputDirectory, f)
    options.logger(env.formatEmojiMessage('✍', fileName))
    env.logDebug(`Preparing to write file: ${fileName}`)
    promises.push(writeFileWithBackup(fileName, content, options.backup))
  }
  if (genResult.hasErrors) {
    options.logger(env.formatEmojiMessage('⚠️', 'Errors:'))
    for (const f of Object.keys(genResult.errors)) {
      let err = genResult.errors[f]
      let fileName = path.join(outputDirectory, f)
      options.logger(
        `${env.formatEmojiMessage('👎', `${fileName}:`)} ${env.formatEmojiMessage('⛔', err)}\nStack trace:\n`
      )
      options.logger(err)
    }
  }
  let nsDuration = process.hrtime.bigint() - hrstart
  options.logger(
    env.formatEmojiMessage(
      '🕐',
      `Generation time: ${util.duration(nsDuration)} `
    )
  )
  timing.generation = {
    nsDuration: Number(nsDuration),
    readableDuration: util.duration(nsDuration)
  }
  promises.push(
    generateGenerationContent(genResult, timing).then((generatedContent) => {
      if (options.genResultFile) {
        let resultPath = path.join(outputDirectory, 'genResult.json')
        options.logger(env.formatEmojiMessage('✍', `Result: ${resultPath}`))
        return writeFileWithBackup(resultPath, generatedContent, options.backup)
      } else {
        return
      }
    })
  )

  if (options.generationLog) {
    let pkg = await queryPackage.getPackageByPackageId(db, templatePackageId)
    let filePath = await querySession.getSessionKeyValue(
      db,
      sessionId,
      dbEnum.sessionKey.filePath
    )
    let zclPkg = await queryPackage.getSessionPackagesByType(
      db,
      sessionId,
      dbEnum.packageType.zclProperties
    )
    promises.push(
      createGenerationLog(options.generationLog, {
        zapFile: filePath,
        output: outputDirectory,
        templatePath: pkg.path,
        zclPath: zclPkg.path
      })
    )
  }

  await Promise.all(promises)

  if (options.skipPostGeneration) {
    return genResult
  } else {
    return postProcessGeneratedFiles(outputDirectory, genResult, options.logger)
  }
}

/**
 * Create a generation log.
 *
 * @param {*} logFile
 * @param {*} genData
 */
async function createGenerationLog(logFile, genData) {
  try {
    let jsonData
    if (fs.existsSync(logFile)) {
      let data = await fsPromise.readFile(logFile)
      jsonData = JSON.parse(data)
    } else {
      jsonData = []
    }
    jsonData.push(genData)
    await fsPromise.writeFile(logFile, JSON.stringify(jsonData, null, 2))
  } catch (err) {
    console.log(err)
    console.log(`Could not write log: ${logFile}`)
  }
}

/**
 * Executes post processing actions as defined by the gen-templates.json
 *
 * @param {*} outputDirectory
 * @param {*} genResult
 * @returns promise of a dealt-with post processing actions
 */
async function postProcessGeneratedFiles(
  outputDirectory,
  genResult,
  logger = (msg) => {
    // Empty logger is the default.
  }
) {
  let doExecute = true
  let isEnabledS = genResult.generatorOptions[dbEnum.generatorOptions.enabled]
  let f =
    genResult.generatorOptions[
      dbEnum.generatorOptions.postProcessConditionalFile
    ]

  let isEnabled = true
  if (isEnabledS == 'false' || isEnabledS == '0') isEnabled = false
  if (!isEnabled) {
    // If `enabled` is false, then we do nothing.
    doExecute = false
  } else if (f != null) {
    // If `postProcessConditionalFile' doesn't exist, we also do nothing.
    f = path.join(genResult.templatePath, f)
    if (!fs.existsSync(f)) doExecute = false
  }

  // Now we deal with postProcessing
  let postProcessPromises = []
  if (
    doExecute &&
    dbEnum.generatorOptions.postProcessMulti in genResult.generatorOptions
  ) {
    let cmd =
      genResult.generatorOptions[dbEnum.generatorOptions.postProcessMulti]
    for (const genFile of Object.keys(genResult.content)) {
      let fileName = path.join(outputDirectory, genFile)
      cmd = cmd + ' ' + fileName
    }
    postProcessPromises.push(
      util.executeExternalProgram(cmd, genResult.templatePath, {
        rejectOnFail: false,
        routeErrToOut:
          genResult.generatorOptions[dbEnum.generatorOptions.routeErrToOut]
      })
    )
  }
  if (
    doExecute &&
    dbEnum.generatorOptions.postProcessSingle in genResult.generatorOptions
  ) {
    let cmd =
      genResult.generatorOptions[dbEnum.generatorOptions.postProcessSingle]
    for (const genFile of Object.keys(genResult.content)) {
      let fileName = path.join(outputDirectory, genFile)
      let singleCmd = cmd + ' ' + fileName
      postProcessPromises.push(
        util.executeExternalProgram(singleCmd, genResult.templatePath, {
          rejectOnFail: false
        })
      )
    }
  }
  if (postProcessPromises.length > 0)
    logger(env.formatEmojiMessage('🤖', 'Executing post-processing actions:'))
  return Promise.all(postProcessPromises).then(() => genResult)
}

/**
 * This async function takes a string, and resolves a preview object out of it.
 *
 * @param {*} content String to form into preview.
 */
async function contentIndexer(content, linesPerIndex = 2000) {
  let index = 0
  let indexedResult = {}
  let code = content.split(/\n/)
  let loc = code.length

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
async function generateSingleFileForPreview(db, sessionId, outFileName) {
  // in case user customization has invalidated the cache
  dbCache.clear()

  return queryPackage
    .getSessionPackagesByType(
      db,
      sessionId,
      dbEnum.packageType.genTemplatesJson
    )
    .then((pkgs) => {
      let promises = []
      pkgs.forEach((pkg) => {
        promises.push(
          generate(
            db,
            sessionId,
            pkg.id,
            {},
            {
              generateOnly: outFileName,
              disableDeprecationWarnings: true
            }
          )
        )
      })
      return Promise.all(promises)
    })
    .then((genResultArrays) => {
      let content = ''
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
