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

import { logError } from '../util/env'
import {
  mapDatabase,
  resolveTemplateDirectory,
  compileTemplate,
  infoFromDb,
  groupInfoIntoDbRow,
  resolveHelper,
  generateDataToPreview,
} from '../generator/static-generator.js'
import {
  getUppercase,
  getStrong,
  getHexValue,
  getLargestStringInArray,
  getSwitch,
  getCase,
  getDefault,
  getCamelCaseWithoutUnderscore,
  isEitherCommandSource,
  isCommandManufactureSpecific,
  getDirection,
  trimNewLinesTabs,
  getFormatCharactersForCommandArguments,
} from '../handlebars/helpers/helper-utils.js'

/**
 *
 *
 * @export
 * @param {*} db
 * @param {*} app
 */
export function registerGenerationApi(db, app) {
  app.get('/preview/:name', async (request, response) => {
    const HANDLEBAR_HELPER_UPPERCASE = 'uppercase'
    const HANDLEBAR_HELPER_STRONG = 'strong'
    const HANDLEBAR_HELPER_HEX_VALUE = 'hexValue'
    const HANDLEBAR_HELPER_LENGTH_OF_LARGEST_STRING = 'largestStringInArray'
    const HANDLEBAR_HELPER_SWITCH = 'switch'
    const HANDLEBAR_HELPER_CASE = 'case'
    const HANDLEBAR_HELPER_DEFAULT = 'default'
    const HANDLEBAR_HELPER_CAMEL_CASE = 'camelCaseWithoutUnderscore'
    const HANDLEBAR_HELPER_EITHER_COMMAND_SOURCE = 'eitherCommandSource'
    const HANDLEBAR_HELPER_COMMAND_MANUFACTURE_SPECIFIC =
      'commandManufactureSpecific'
    const HANDLEBAR_HELPER_DIRECTION = 'direction'
    const HANDLEBAR_HELPER_TRIM_NEW_LINES_TABS = 'trimNewLinesTabs'
    const HANDLEBAR_HELPER_FORMAT_CHARACTERS_FOR_COMMAND_AGRS =
      'formatCharactersForCommandArguments'
    const HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE = 'att-storage.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS = 'af-structs.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_CLUSTERS = 'cluster-id.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_ENUMS = 'enums.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_BITMAPS = 'bitmaps.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS = 'print-cluster.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_DEBUG_PRINTING =
      'debug-printing-zcl.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_CALLBACK_ZCL = 'callback-zcl.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_GLOBAL =
      'client-command-macro-global.handlebars'
    const HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_CLUSTER =
      'client-command-macro-cluster.handlebars'
    const DATABASE_ROW_TYPE_CLUSTER = 'clusters'
    const DATABASE_ROW_TYPE_ENUMS = 'enums'
    const DATABASE_ROW_TYPE_BITMAPS = 'bitmaps'
    const DATABASE_ROW_TYPE_PRINT_CLUSTER = 'print-cluster'
    const DATABASE_ROW_TYPE_AF_STRUCTS = 'af-structs'
    const DATABASE_ROW_TYPE_ATT_STORAGE = 'att-storage'
    const DATABASE_ROW_TYPE_DEBUG_PRINTING = 'debug-printing-zcl'
    const DATABASE_ROW_TYPE_CALLBACK_ZCL = 'callback-zcl'
    const DATABASE_ROW_TYPE_CALLBACK_ZCL_COMMAND = 'callback-zcl-command'
    const DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_GLOBAL =
      'client-command-macro-global'
    const DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_CLUSTER =
      'client-command-macro-cluster'
    const DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_CLUSTER_COMMANDS =
      'client-command-macro-cluster-commands'

    //cluster-id.h generation
    var clusterHandleBarHelpers = {}
    clusterHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase
    var clusterRowToHandlebarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_CLUSTER,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CLUSTERS,
      },
    ]

    const clusterGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_CLUSTERS])
      )
      .then((databaseRows) =>
        infoFromDb(databaseRows, [DATABASE_ROW_TYPE_CLUSTER])
      )
      .then((helperResolution) =>
        resolveHelper(helperResolution, clusterHandleBarHelpers)
      )
      .then((resultToFile) =>
        generateDataToPreview(
          resultToFile,
          clusterRowToHandlebarTemplateFileMap
        )
      )
      .catch((err) => logError(err))

    //enums.h generation
    var enumHandleBarHelpers = {}
    enumHandleBarHelpers[HANDLEBAR_HELPER_STRONG] = getStrong
    enumHandleBarHelpers[HANDLEBAR_HELPER_HEX_VALUE] = getHexValue
    var enumsRowToHandlebarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_ENUMS,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_ENUMS,
      },
      {
        dbRowType: DATABASE_ROW_TYPE_BITMAPS,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_BITMAPS,
      },
    ]

    const enumGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [
          HANDLEBAR_TEMPLATE_FILE_ENUMS,
          HANDLEBAR_TEMPLATE_FILE_BITMAPS,
        ])
      )
      .then((databaseRows) =>
        infoFromDb(databaseRows, [
          DATABASE_ROW_TYPE_ENUMS,
          DATABASE_ROW_TYPE_BITMAPS,
        ])
      )
      .then((databaseRowsWithEnumItems) =>
        groupInfoIntoDbRow(databaseRowsWithEnumItems, {
          tableName: 'ENUM_ITEMS',
          foreignKey: 'ENUM_REF',
          primaryKey: 'ENUM_ID',
          dbType: 'enums',
        })
      )
      .then((databaseRowsWithBitmapFields) =>
        groupInfoIntoDbRow(databaseRowsWithBitmapFields, {
          tableName: 'BITMAP_FIELDS',
          foreignKey: 'BITMAP_REF',
          primaryKey: 'BITMAP_ID',
          dbType: 'bitmaps',
        })
      )
      .then((helperResolution) =>
        resolveHelper(helperResolution, enumHandleBarHelpers)
      )
      .then((resultToFile) =>
        generateDataToPreview(resultToFile, enumsRowToHandlebarTemplateFileMap)
      )
      .catch((err) => logError(err))

    //print-cluster.h generation
    var printClusterHandleBarHelpers = {}
    printClusterHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase
    printClusterHandleBarHelpers[
      HANDLEBAR_HELPER_LENGTH_OF_LARGEST_STRING
    ] = getLargestStringInArray
    var printClusterRowToHandleBarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_PRINT_CLUSTER,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS,
      },
    ]

    const printClusterGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS])
      )
      .then((databaseRows) =>
        infoFromDb(databaseRows, [DATABASE_ROW_TYPE_PRINT_CLUSTER])
      )
      .then((helperResolution) =>
        resolveHelper(helperResolution, printClusterHandleBarHelpers)
      )
      .then((resultToFile) =>
        generateDataToPreview(
          resultToFile,
          printClusterRowToHandleBarTemplateFileMap
        )
      )
      .catch((err) => logError(err))

    //af-structs.h generation
    var afStructsHandleBarHelpers = {}
    afStructsHandleBarHelpers[HANDLEBAR_HELPER_SWITCH] = getSwitch
    afStructsHandleBarHelpers[HANDLEBAR_HELPER_CASE] = getCase
    afStructsHandleBarHelpers[HANDLEBAR_HELPER_DEFAULT] = getDefault
    var afStructsRowToHandleBarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_AF_STRUCTS,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS,
      },
    ]

    const afStructsGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS])
      )
      .then((databaseRows) =>
        infoFromDb(databaseRows, [DATABASE_ROW_TYPE_AF_STRUCTS])
      )
      .then((databaseRowsWithEnumItems) =>
        groupInfoIntoDbRow(databaseRowsWithEnumItems, {
          tableName: 'STRUCT_ITEMS',
          foreignKey: 'STRUCT_REF',
          primaryKey: 'STRUCT_ID',
          dbType: 'af-structs',
        })
      )
      .then((helperResolution) =>
        resolveHelper(helperResolution, afStructsHandleBarHelpers)
      )
      .then((resultToFile) =>
        generateDataToPreview(
          resultToFile,
          afStructsRowToHandleBarTemplateFileMap
        )
      )
      .catch((err) => logError(err))

    //att-storage.h generation
    var attStorageRowToHandleBarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_ATT_STORAGE,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE,
      },
    ]

    const attStorageGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE])
      )
      .then((resultToFile) =>
        generateDataToPreview(
          resultToFile,
          attStorageRowToHandleBarTemplateFileMap
        )
      )
      .catch((err) => logError(err))

    //debug-printing-zcl.h generation
    var debugPrintingHandleBarHelpers = {}
    debugPrintingHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase
    debugPrintingHandleBarHelpers[
      HANDLEBAR_HELPER_CAMEL_CASE
    ] = getCamelCaseWithoutUnderscore
    var debugPrintingRowToHandlebarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_DEBUG_PRINTING,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_DEBUG_PRINTING,
      },
    ]

    const debugPrintingGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_DEBUG_PRINTING])
      )
      .then((databaseRows) =>
        infoFromDb(databaseRows, [DATABASE_ROW_TYPE_DEBUG_PRINTING])
      )
      .then((helperResolution) =>
        resolveHelper(helperResolution, debugPrintingHandleBarHelpers)
      )
      .then((resultToFile) =>
        generateDataToPreview(
          resultToFile,
          debugPrintingRowToHandlebarTemplateFileMap
        )
      )
      .catch((err) => logError(err))

    //callback-zcl.h generation
    var callbackZclHandleBarHelpers = {}
    callbackZclHandleBarHelpers[
      HANDLEBAR_HELPER_CAMEL_CASE
    ] = getCamelCaseWithoutUnderscore
    callbackZclHandleBarHelpers[HANDLEBAR_HELPER_SWITCH] = getSwitch
    callbackZclHandleBarHelpers[HANDLEBAR_HELPER_CASE] = getCase
    callbackZclHandleBarHelpers[HANDLEBAR_HELPER_DEFAULT] = getDefault
    var callbackZclRowToHandlebarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_CALLBACK_ZCL,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CALLBACK_ZCL,
      },
      {
        dbRowType: DATABASE_ROW_TYPE_CALLBACK_ZCL_COMMAND,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CALLBACK_ZCL,
      },
    ]

    const callbackZclGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_CALLBACK_ZCL])
      )
      .then((databaseRows) =>
        infoFromDb(databaseRows, [
          DATABASE_ROW_TYPE_CALLBACK_ZCL,
          DATABASE_ROW_TYPE_CALLBACK_ZCL_COMMAND,
        ])
      )
      .then((databaseRowsWithCommands) =>
        groupInfoIntoDbRow(databaseRowsWithCommands, {
          tableName: 'COMMAND_ARG',
          foreignKey: 'COMMAND_REF',
          primaryKey: 'COMMAND_ID',
          dbType: 'callback-zcl-command',
        })
      )
      .then((databaseRowsWithCallbackItems) =>
        groupInfoIntoDbRow(databaseRowsWithCallbackItems, {
          tableName: 'COMMAND',
          foreignKey: 'CLUSTER_REF',
          primaryKey: 'CLUSTER_ID',
          dbType: 'callback-zcl',
          subItems: databaseRowsWithCallbackItems['callback-zcl-command'],
        })
      )
      .then((helperResolution) =>
        resolveHelper(helperResolution, callbackZclHandleBarHelpers)
      )
      .then((resultToFile) =>
        generateDataToPreview(
          resultToFile,
          callbackZclRowToHandlebarTemplateFileMap
        )
      )
      .catch((err) => logError(err))

    //client-command-macro.h generation
    var clientCommandMacroHandleBarHelpers = {}
    clientCommandMacroHandleBarHelpers[
      HANDLEBAR_HELPER_EITHER_COMMAND_SOURCE
    ] = isEitherCommandSource
    clientCommandMacroHandleBarHelpers[
      HANDLEBAR_HELPER_COMMAND_MANUFACTURE_SPECIFIC
    ] = isCommandManufactureSpecific
    clientCommandMacroHandleBarHelpers[
      HANDLEBAR_HELPER_DIRECTION
    ] = getDirection
    clientCommandMacroHandleBarHelpers[
      HANDLEBAR_HELPER_TRIM_NEW_LINES_TABS
    ] = trimNewLinesTabs
    clientCommandMacroHandleBarHelpers[HANDLEBAR_HELPER_SWITCH] = getSwitch
    clientCommandMacroHandleBarHelpers[HANDLEBAR_HELPER_CASE] = getCase
    clientCommandMacroHandleBarHelpers[HANDLEBAR_HELPER_DEFAULT] = getDefault
    clientCommandMacroHandleBarHelpers[HANDLEBAR_HELPER_STRONG] = getStrong
    clientCommandMacroHandleBarHelpers[
      HANDLEBAR_HELPER_FORMAT_CHARACTERS_FOR_COMMAND_AGRS
    ] = getFormatCharactersForCommandArguments
    clientCommandMacroHandleBarHelpers[
      HANDLEBAR_HELPER_UPPERCASE
    ] = getUppercase
    clientCommandMacroHandleBarHelpers[
      HANDLEBAR_HELPER_CAMEL_CASE
    ] = getCamelCaseWithoutUnderscore
    var clientCommandMacroRowToHandlebarTemplateFileMap = [
      {
        dbRowType: DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_GLOBAL,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_GLOBAL,
      },
      {
        dbRowType: DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_CLUSTER,
        hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_CLUSTER,
      },
    ]

    const clientCommandMacroGenerationCode = await mapDatabase(db)
      .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
      .then((templates) =>
        compileTemplate(templates, [
          HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_GLOBAL,
          HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_CLUSTER,
        ])
      )
      .then((databaseRows) =>
        infoFromDb(databaseRows, [
          DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_GLOBAL,
          DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_CLUSTER,
          DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_CLUSTER_COMMANDS,
        ])
      )
      .then((databaseRowsWithCommands) =>
        groupInfoIntoDbRow(databaseRowsWithCommands, {
          tableName: 'COMMAND_ARG',
          foreignKey: 'COMMAND_REF',
          primaryKey: 'COMMAND_ID',
          dbType: 'client-command-macro-global',
        })
      )
      .then((databaseRowsWithCommands) =>
        groupInfoIntoDbRow(databaseRowsWithCommands, {
          tableName: 'COMMAND_ARG',
          foreignKey: 'COMMAND_REF',
          primaryKey: 'COMMAND_ID',
          dbType: 'client-command-macro-cluster-commands',
        })
      )
      .then((databaseRowsWithCommands) =>
        groupInfoIntoDbRow(databaseRowsWithCommands, {
          tableName: 'COMMAND',
          foreignKey: 'CLUSTER_REF',
          primaryKey: 'CLUSTER_ID',
          dbType: 'client-command-macro-cluster',
          subItems:
            databaseRowsWithCommands['client-command-macro-cluster-commands'],
        })
      )
      .then((helperResolution) =>
        resolveHelper(helperResolution, clientCommandMacroHandleBarHelpers)
      )
      .then((resultToFile) =>
        generateDataToPreview(
          resultToFile,
          clientCommandMacroRowToHandlebarTemplateFileMap
        )
      )
      .catch((err) => logError(err))

    if (request.params.name === DATABASE_ROW_TYPE_CLUSTER) {
      response.json(clusterGenerationCode)
    } else if (request.params.name === DATABASE_ROW_TYPE_ENUMS) {
      response.json(enumGenerationCode)
    } else if (request.params.name === DATABASE_ROW_TYPE_PRINT_CLUSTER) {
      response.json(printClusterGenerationCode)
    } else if (request.params.name === DATABASE_ROW_TYPE_AF_STRUCTS) {
      response.json(afStructsGenerationCode)
    } else if (request.params.name === DATABASE_ROW_TYPE_ATT_STORAGE) {
      response.json(attStorageGenerationCode)
    } else if (request.params.name === DATABASE_ROW_TYPE_DEBUG_PRINTING) {
      response.json(debugPrintingGenerationCode)
    } else if (request.params.name === DATABASE_ROW_TYPE_CALLBACK_ZCL) {
      response.json(callbackZclGenerationCode)
    } else if (
      request.params.name === DATABASE_ROW_TYPE_CLIENT_COMMAND_MACRO_GLOBAL
    ) {
      response.json(clientCommandMacroGenerationCode)
    }
  })
}
