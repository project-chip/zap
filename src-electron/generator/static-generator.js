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
import Handlebars from 'handlebars'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs-extra'
import {
  selectAllClusters,
  selectAllEnums,
  selectAllEnumItems,
  selectAllBitmaps,
  selectAllBitmapFields,
  selectAllStructs,
  selectAllStructItems,
  selectAllCommands,
  selectAllCommandArguments,
  selectAllGlobalCommands,
  selectAllClusterCommands,
} from '../db/query-zcl.js'
import { logError } from '../util/env.js'

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
Handlebars.getTemplate = function (templateDirectory = '', name = '') {
  var source = ''
  if (templateDirectory) {
    source = readFileSync(templateDirectory + '/' + name, 'utf8')
  } else {
    templateDirectory = __dirname + '/../../test/gen-template'
    source = readFileSync(templateDirectory + '/' + name, 'utf8')
  }
  return Handlebars.compile(source)
}

/**
 * Resolve is listed on the map containing the database.
 *
 * @export
 * @param {Object} db database
 * @returns A promise with resolve listed on the map
 */
export function mapDatabase(db) {
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
export function resolveTemplateDirectory(map, handlebarTemplateDirectory = '') {
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
export function compileTemplate(map, templateFiles) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < templateFiles.length; i++) {
      var compiledTemplate = Handlebars.getTemplate(
        map.handlebarTemplateDirectory,
        templateFiles[i]
      )
      map[templateFiles[i]] = compiledTemplate
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
 * @param {string[]} dbRowType Array of strings with each string representing a
 * type of database row
 * @returns A promise with resolve listed on a map which has the database rows.
 */
export function infoFromDb(map, dbRowType) {
  return new Promise((resolve, reject) => {
    var db = map.database
    var dbInfo = []
    for (let i = 0; i < dbRowType.length; i++) {
      if (dbRowType[i] === 'clusters') {
        dbInfo[i] = selectAllClusters(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] == 'enums') {
        dbInfo[i] = selectAllEnums(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] == 'bitmaps') {
        dbInfo[i] = selectAllBitmaps(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'print-cluster') {
        dbInfo[i] = selectAllClusters(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'af-structs') {
        dbInfo[i] = selectAllStructs(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'debug-printing-zcl') {
        dbInfo[i] = selectAllClusters(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'callback-zcl') {
        dbInfo[i] = selectAllClusters(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'callback-zcl-command') {
        dbInfo[i] = selectAllCommands(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'client-command-macro-global') {
        dbInfo[i] = selectAllGlobalCommands(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'client-command-macro-cluster') {
        dbInfo[i] = selectAllClusters(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      } else if (dbRowType[i] === 'client-command-macro-cluster-commands') {
        dbInfo[i] = selectAllCommands(db).then(
          (dbRows) => (map[dbRowType[i]] = dbRows)
        )
      }
    }
    // Going through an array of promises and resolving them.
    Promise.all(dbInfo)
      .then(() => {
        resolve(map)
      })
      .catch((reason) => {
        logError(`infoFromDb Handle rejected promise (${reason}) here.`)
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
export function groupInfoIntoDbRow(map, groupByParams) {
  return new Promise((resolve, reject) => {
    // Table Name for the creating a sub-list
    var subItemName = groupByParams.tableName
    // Foreign Key in the table
    var foreignKey = groupByParams.foreignKey
    // Primary key in the parent table inorder to join
    var primaryKey = groupByParams.primaryKey
    // dbType to call the sql queries on the table
    var dbType = groupByParams.dbType

    var db = map.database
    // for eg map[ENUM_ITEMS], map[BITMAP_FIELDS], etc
    var dbRows = map[dbType]
    // Collecting the rows having the same key in subDBRows
    var subDbRows = []
    var subItems
    if (groupByParams.subItems) {
      subItems = new Promise((resolve, reject) => {
        resolve(groupByParams.subItems)
      })
    }
    if (!subItems) {
      if (subItemName == 'ENUM_ITEMS') {
        subItems = selectAllEnumItems(db)
      } else if (subItemName == 'BITMAP_FIELDS') {
        subItems = selectAllBitmapFields(db)
      } else if (subItemName == 'STRUCT_ITEMS') {
        subItems = selectAllStructItems(db)
      } else if (subItemName == 'COMMAND_ARG') {
        subItems = selectAllCommandArguments(db)
      } else {
        return
      }
    }

    subItems
      .then(function (rows) {
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
      .catch((reason) => {
        logError(`groupInfoIntoDbRow Handle rejected promise (${reason}) here.`)
      })
  })
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
export function resolveHelper(map, helperFunctions) {
  return new Promise((resolve, reject) => {
    map.helperFunctions = helperFunctions
    resolve(map)
  })
}

/**
 * Resolve the generation directory to be able to generate to the correct
 * directory.
 *
 * @export
 * @param {Object} map
 * @param {string} generationDirectory generation directory path.
 * @returns A promise with resolve listed on a map which has the generation
 * directory.
 */
export function resolveGenerationDirectory(map, generationDirectory) {
  return new Promise((resolve, reject) => {
    map.generationDirectory = generationDirectory
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
export function generateDataToPreview(
  map,
  databaseRowToHandlebarTemplateFileMap
) {
  return new Promise((resolve, reject) => {
    var result = ''
    for (let i = 0; i < databaseRowToHandlebarTemplateFileMap.length; i++) {
      var compiledTemplate =
        map[databaseRowToHandlebarTemplateFileMap[i].hTemplateFile]
      var dbRows = map[databaseRowToHandlebarTemplateFileMap[i].dbRowType]
      for (var key in map.helperFunctions) {
        Handlebars.registerHelper(key, map.helperFunctions[key])
      }
      var define = compiledTemplate({
        type: dbRows,
      })
      result = result + define
    }
    resolve(result)
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
export function generateDataToFile(
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
        Handlebars.registerHelper(key, map.helperFunctions[key])
      }
      var define = compiledTemplate({
        type: dbRows,
      })
      if (!existsSync(generationDirectory)) {
        mkdirSync(generationDirectory)
      }
      result = result + define
    }
    resolve(result)
    writeFileSync(generationDirectory + '/' + outputFileName, result)
  })
}
