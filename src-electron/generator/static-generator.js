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
const path = require('path')

const handlebars = require('handlebars/dist/cjs/handlebars')
const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')

const fsExtra = require('fs-extra')

const env = require('../util/env.js')
const helperUtil = require('./helper-util.js')

/**
 * Find the handlebar template file, compile and return the template file.
 * In the case of Generate this will take the template directory mentioned.
 * However in the case of the browser the templates come from the
 * gen-template repository.
 *
 * @param {string} [templateDirectory=""] Directory where the templates reside
 * @param {string} [name=""] Name of the template file
 * @returns A compiled Template
 */
function getHandlebarsTemplate(templateDirectory = '', name = '') {
  var source = ''
  var fileName
  if (templateDirectory) {
    fileName = path.join(templateDirectory, name)
  } else {
    templateDirectory = __dirname + '/../../test/gen-template'
    fileName = path.join(templateDirectory, name)
  }
  env.logInfo('Using ' + fileName + ' as a template')
  source = fsExtra.readFileSync(fileName, 'utf8')
  return handlebars.compile(source)
}

/**
 * Resolve is listed on the map containing the database.
 *
 * @export
 * @param {Object} db database
 * @returns A promise with resolve listed on the map
 */
function mapDatabase(db) {
  return new Promise((resolve, reject) => {
    var resultantMap = {}
    resultantMap.database = db
    resolve(resultantMap)
  })
}

/**
 * Resolve the handlebar template directory to be able to use the correct
 * handlebar templates for generation/preview.
 *
 * @export
 * @param {Object} map HashMap
 * @param {string} handlebarTemplateDirectory Handlebar template directory path
 * @returns A promise with resolve listed on a map which has the handlebar
 * directory.
 */
function resolveTemplateDirectory(map, handlebarTemplateDirectory = '') {
  return new Promise((resolve, reject) => {
    map.handlebarTemplateDirectory = handlebarTemplateDirectory
    resolve(map)
  })
}

/**
 * Resolve the compiled handlebar templates for use.
 *
 * @export
 * @param {Object} map Map for database and template directory
 * @param {string[]} templateFiles Array of handlebar template files
 * @returns A promise with resolve listed on a map which has the compiled
 * templates.
 */
function compileTemplate(map, templateFiles) {
  return new Promise((resolve, reject) => {
    for (var templateFile of templateFiles) {
      var compiledTemplate = getHandlebarsTemplate(
        map.handlebarTemplateDirectory,
        templateFile
      )
      map[templateFile] = compiledTemplate
    }
    resolve(map)
  })
}

/**
 * The database information is retrieved by calling database query
 * functions. Then a resolve is listed on the map containing database, compiled
 * template and database row information so that they can be passed on to more
 * promises.
 *
 * @export
 * @param {Object} map Map for database, template directory and compiled templates
 * @param {string[]} dbRowTypeArray Array of strings with each string representing a
 * type of database row
 * @returns A promise with resolve listed on a map which has the database rows.
 */
function infoFromDb(map, dbRowTypeArray) {
  return new Promise((resolve, reject) => {
    var db = map.database
    var dbInfo = {}
    for (let dbRowType of dbRowTypeArray) {
      if (
        dbRowType === 'clusters' ||
        dbRowType === 'print-cluster' ||
        dbRowType === 'debug-printing-zcl' ||
        dbRowType === 'callback-zcl' ||
        dbRowType === 'client-command-macro-cluster'
      ) {
        // When one has the right sessionID, use the following
        // dbInfo[dbRowType] = queryPackage.callPackageSpecificFunctionOverSessionPackages(db, sessionId, queryZcl
        //  .selectAllClusters, [])
        dbInfo[dbRowType] = queryZcl
          .selectAllClusters(db)
          .then((dbRows) => (map[dbRowType] = dbRows))
      } else if (dbRowType == 'enums') {
        dbInfo[dbRowType] = queryZcl
          .selectAllEnums(db)
          .then((dbRows) => (map[dbRowType] = dbRows))
      } else if (dbRowType == 'bitmaps') {
        dbInfo[dbRowType] = queryZcl
          .selectAllBitmaps(db)
          .then((dbRows) => (map[dbRowType] = dbRows))
      } else if (dbRowType === 'af-structs') {
        dbInfo[dbRowType] = queryZcl
          .selectAllStructs(db)
          .then((dbRows) => (map[dbRowType] = dbRows))
      } else if (
        dbRowType === 'callback-zcl-command' ||
        dbRowType === 'client-command-macro-cluster-commands'
      ) {
        dbInfo[dbRowType] = queryZcl
          .selectAllCommands(db)
          .then((dbRows) => (map[dbRowType] = dbRows))
      } else if (dbRowType === 'client-command-macro-global') {
        dbInfo[dbRowType] = queryZcl
          .selectAllGlobalCommands(db)
          .then((dbRows) => (map[dbRowType] = dbRows))
      }
    }
    // Going through an array of promises and resolving them.
    Promise.all(Object.values(dbInfo))
      .then(() => {
        resolve(map)
      })
      .catch((reason) => {
        env.logError(`infoFromDb Handle rejected promise (${reason}) here.`)
      })
  })
}

/**
 * Additional information attached to each database row. Essentially a way
 * to group by content.
 *
 * @export
 * @param {Object} map Map containing database, compiled templates, database and
 * database rows for different database types.
 * @param {Object} groupByParams Object to group information by
 * @param {string} groupByParams.subItemName
 * @param {string} groupByParams.foreignKey
 * @param {string} groupByParams.primaryKey
 * @param {string} groupByParams.dbType
 * @returns A promise with resolve listed on a map which has the database,
 * compiled templates and database rows along with additional grouped by
 * content.
 */
function groupInfoIntoDbRow(map, groupByParams) {
  let groupDbRowInfo = []
  let i = 0
  if (groupByParams) {
    for (i = 0; i < groupByParams.length; i++) {
      // Table Name for the creating a sub-list
      let subItemName = groupByParams[i].joinRecords
      // Foreign Key in the table
      let foreignKey = groupByParams[i].foreignKey
      // Primary key in the parent table inorder to join
      let primaryKey = groupByParams[i].primaryKey
      // dbType to call the sql queries on the table
      let dbType = groupByParams[i].dbType

      let db = map.database
      // for eg map[EnumItems], map[BitmapFields], etc
      let dbRows = map[dbType]
      // Collecting the rows having the same key in subDBRows
      let subDbRows = []
      let subItems
      if (groupByParams[i].subItems) {
        subItems = new Promise((resolve, reject) => {
          resolve(map[groupByParams[i].subItems])
        })
      }
      if (!subItems) {
        if (subItemName == 'EnumItems') {
          subItems = queryZcl.selectAllEnumItems(db)
        } else if (subItemName == 'BitmapFields') {
          subItems = queryZcl.selectAllBitmapFields(db)
        } else if (subItemName == 'StructItems') {
          subItems = queryZcl.selectAllStructItems(db)
        } else if (subItemName == 'CommandArguments') {
          subItems = queryZcl.selectAllCommandArguments(db)
        } else {
          return
        }
      }

      groupDbRowInfo[i] = subItems
        .then(
          (rows) =>
            new Promise((resolve, reject) => {
              for (let i = 0; i < rows.length; i++) {
                // create a map here and print in next prmoise to see if it is populated
                if (subDbRows[rows[i][foreignKey]] == null) {
                  subDbRows[rows[i][foreignKey]] = [rows[i]]
                } else {
                  subDbRows[rows[i][foreignKey]].push(rows[i])
                }
              }
              for (let j = 0; j < dbRows.length; j++) {
                var pk = dbRows[j][primaryKey]
                dbRows[j][subItemName] = subDbRows[pk]
              }
              resolve(map)
            })
        )
        .catch((reason) => {
          env.logError(
            `groupInfoIntoDbRow Handle rejected promise (${reason}) here.`
          )
        })
    }
    // Going through an array of promises and resolving them.
    return Promise.all(groupDbRowInfo)
      .then((results) => map)
      .catch((reason) => {
        env.logError(
          `groupInfoIntoDbRow Handle rejected promise (${reason}) here.`
        )
      })
  } else {
    return new Promise((resolve, reject) => map)
  }
}

/**
 * Resolve the helper functions to be used in later promises.
 *
 * @export
 * @param {Object} map
 * @param {Object} helperFunctions Map for handlebar helper name to helper function
 * @returns A promise with resolve listed on a map which has the helper
 * functions.
 */
function resolveHelper(map, helperFunctions) {
  return new Promise((resolve, reject) => {
    let handlebarHelpers = {}
    for (let i = 0; i < helperFunctions.length; i++) {
      handlebarHelpers[helperFunctions[i]['helperNameForTemplate']] =
        helperUtil[helperFunctions[i]['helperFunctionName']]
    }
    map.helperFunctions = handlebarHelpers
    resolve(map)
  })
}

/**
 * The database information is used to show the generation output to a preview
 * pane using the compiled handlebar templates.
 *
 * @export
 * @param {Object} map
 * @param {Object[]} databaseRowToHandlebarTemplateFileMap Map linking the
 * database row type with handlebar template file.
 * @param {string} databaseRowToHandlebarTemplateFileMap.dbRowType Database
 * row type
 * @param {string} databaseRowToHandlebarTemplateFileMap.hTemplateFile Handlebar
 * template file
 * @returns A promise with resolve listed on the data which can be seen in the
 * preview pane.
 */
function generateDataToPreview(map, databaseRowToHandlebarTemplateFileMap) {
  return new Promise((resolve, reject) => {
    var result = '',
      code = ''
    var loc = 0,
      index = 0
    var indexedResult = { 1: '' }
    for (let i = 0; i < databaseRowToHandlebarTemplateFileMap.length; i++) {
      var compiledTemplate =
        map[databaseRowToHandlebarTemplateFileMap[i].hTemplateFile]
      var dbRows = map[databaseRowToHandlebarTemplateFileMap[i].dbRowType]
      for (var key in map.helperFunctions) {
        handlebars.registerHelper(key, map.helperFunctions[key])
      }
      var define = compiledTemplate({
        type: dbRows,
      })
      result = result + define
    }
    code = result.split(/\n/)
    loc = code.length
    // Indexing the generation result for faster preview pane generation
    for (let i = 0; i < loc; i++) {
      if (i % 2000 === 0) {
        index++
        indexedResult[index] = ''
      }
      indexedResult[index] = indexedResult[index].concat(code[i]).concat('\n')
    }
    resolve(indexedResult)
  })
}

/**
 * The database information is used to write the generation output to a file
 * using the compiled handlebar templates.
 *
 * @export
 * @param {Object} map
 * @param {string} outputFileName The generation file name
 * @param {Object[]} databaseRowToHandlebarTemplateFileMap Map linking the
 * database row type with handlebar template file.
 * @param {string} databaseRowToHandlebarTemplateFileMap.dbRowType Database
 * row type
 * @param {string} databaseRowToHandlebarTemplateFileMap.hTemplateFile Handlebar
 * template file
 * @returns A new promise resolve listed on the data which is generated.
 */
function generateDataToFile(
  map,
  outputFileName,
  databaseRowToHandlebarTemplateFileMap
) {
  return new Promise((resolve, reject) => {
    var result = ''
    var generationDirectory = map.generationDirectory
    for (let i = 0; i < databaseRowToHandlebarTemplateFileMap.length; i++) {
      var compiledTemplate =
        map[databaseRowToHandlebarTemplateFileMap[i].hTemplateFile]
      var dbRows = map[databaseRowToHandlebarTemplateFileMap[i].dbRowType]
      for (var key in map.helperFunctions) {
        handlebars.registerHelper(key, map.helperFunctions[key])
      }
      var define = compiledTemplate({
        type: dbRows,
      })
      if (!fsExtra.existsSync(generationDirectory)) {
        fsExtra.mkdirSync(generationDirectory)
      }
      result = result + define
    }
    resolve(result)
    fsExtra.writeFileSync(generationDirectory + '/' + outputFileName, result)
  })
}

/**
 *
 *
 * @export
 * @param {*} filePath
 * @returns A promise with the generation options
 */
function getGenerationProperties(filePath) {
  return new Promise((resolve, reject) => {
    let rawData
    let actualFilePath = filePath
    if (!actualFilePath || 0 === actualFilePath.length) {
      actualFilePath = path.join(
        __dirname,
        '../../test/gen-template/generation-options.json'
      )
    }
    env.logInfo('Reading generation properties from ' + actualFilePath)
    rawData = fsExtra.readFileSync(actualFilePath)
    var generationOptions = JSON.parse(rawData)
    resolve(generationOptions)
  })
}

/**
 * This function generates the code into the user defined directory using promises
 *
 * @param {*} db
 */
function generateCode(
  db,
  generationOptions,
  generationDirectory,
  handlebarTemplateDirectory
) {
  //Keeping track of each generation promise
  let generatedCodeMap = []

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
    let filename = currentGenerationOptions[generationOptionIndex]['filename']
    let handlebarTemplatePerDataRow =
      currentGenerationOptions[generationOptionIndex][
        'handlebar-templates-per-data-row'
      ]

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

    generatedCodeMap[generationOptionIndex] = mapDatabase(db)
      .then((templateDir) =>
        resolveTemplateDirectory(templateDir, handlebarTemplateDirectory)
      )
      .then((templates) => compileTemplate(templates, templateArray))
      .then((databaseRows) => infoFromDb(databaseRows, dbRowTypeArray))
      .then((databaseRowsWithMoreInfo) =>
        groupInfoIntoDbRow(databaseRowsWithMoreInfo, groupInfoToDb)
      )
      .then((helperResolution) => resolveHelper(helperResolution, helperApis))
      .then(
        (directoryResolution) =>
          new Promise((resolve, reject) => {
            directoryResolution.generationDirectory = generationDirectory
            resolve(directoryResolution)
          })
      )
      .then((resultToFile) =>
        generateDataToFile(resultToFile, filename, handlebarTemplatePerDataRow)
      )
      .catch((err) => env.logError(err))
  }

  return Promise.all(generatedCodeMap).catch((error) => {
    env.logError(error)
  })
}

function getGeneratedCodeMap(generationOptions, db) {
  return new Promise((resolve, reject) => {
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
      let filename = currentGenerationOptions[generationOptionIndex]['filename']
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
        .then((helperResolution) => resolveHelper(helperResolution, helperApis))
        .then((resultToFile) =>
          generateDataToPreview(resultToFile, handlebarTemplatePerDataRow)
        )
        .catch((err) => env.logError(err))
    }

    // Making sure all generation promises are resolved before handling the get request
    Promise.all(Object.values(generatedCodeMap)).then((messages) => {
      resolve(generatedCodeMap)
    })
  })
}

function writeGeneratedFiles(
  generationOptionsFile,
  db,
  generationDirectory,
  handlebarTemplateDirectory
) {
  return getGenerationProperties(
    generationOptionsFile
  ).then((generationOptions) =>
    generateCode(
      db,
      generationOptions,
      generationDirectory,
      handlebarTemplateDirectory
    )
  )
}

function createGeneratedFileMap(db) {
  return getGenerationProperties('').then((generationOptions) =>
    getGeneratedCodeMap(generationOptions, db)
  )
}

// exports
exports.writeGeneratedFiles = writeGeneratedFiles
exports.createGeneratedFileMap = createGeneratedFileMap
