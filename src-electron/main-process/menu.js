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

import { dialog, Menu } from 'electron'
import { getSessionInfoFromWindowId } from '../db/query-session.js'
import {
  compileTemplate,
  generateDataToFile,
  groupInfoIntoDbRow,
  infoFromDb,
  mapDatabase,
  resolveHelper,
  resolveTemplateDirectory,
} from '../generator/static-generator.js'
import {
  getHexValue,
  getStrong,
  getUppercase,
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
import { appDirectory, logError, logInfo, mainDatabase } from '../util/env.js'
import { showErrorMessage } from './ui.js'
import { windowCreate } from './window.js'
import { selectFileLocation, insertFileLocation } from '../db/query-generic.js'
import { updateKeyValue, getSessionKeyValue } from '../db/query-config.js'
import { exportDataIntoFile } from '../importexport/export.js'
import {
  readDataFromFile,
  writeStateToDatabase,
} from '../importexport/import.js'

var httpPort
var generationDirectory = appDirectory() + '/generation-output'
var handlebarTemplateDirectory = __dirname + '/../../test/gen-template'

const template = [
  {
    role: 'fileMenu',
    submenu: [
      {
        label: 'Generate Code',
        click(menuItem, browserWindow, event) {
          generateInDir(browserWindow)
        },
      },
      {
        label: 'Handlebar Template Directory',
        click(menuItem, browserWindow, event) {
          setHandlebarTemplateDirectory(browserWindow)
        },
      },
      {
        label: 'Open File...',
        click(menuItem, browserWindow, event) {
          doOpen(menuItem, browserWindow, event)
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Session Information...',
        click(menuItem, browserWindow, event) {
          let winId = browserWindow.id
          getSessionInfoFromWindowId(mainDatabase(), winId)
            .then((row) => {
              dialog.showMessageBox(browserWindow, {
                title: 'Information',
                message: `Window id: ${winId}\nZap session id: ${
                  row.sessionId
                }\nSession key: ${row.sessionKey}\nTime: ${new Date(
                  row.creationTime
                )}`,
                buttons: ['Dismiss'],
              })
            })
            .catch((err) => showErrorMessage('Session info', err))
        },
      },
      {
        label: 'Save',
        click(menuItem, browserWindow, event) {
          doSave(menuItem, browserWindow, event)
        },
      },
      {
        label: 'Save As...',
        click(menuItem, browserWindow, event) {
          doSaveAs(menuItem, browserWindow, event)
        },
      },
      {
        type: 'separator',
      },
      {
        role: 'close',
      },
      {
        type: 'separator',
      },
      {
        role: 'quit',
      },
    ],
  },
  {
    role: 'editMenu',
  },
  {
    role: 'viewMenu',
  },
  {
    role: 'windowMenu',
  },
  {
    label: 'Help',
    submenu: [
      {
        role: 'about',
      },
    ],
  },
]
/**
 * Perform a file->open operation.
 *
 * @param {*} menuItem
 * @param {*} browserWindow
 * @param {*} event
 */
function doOpen(menuItem, browserWindow, event) {
  selectFileLocation(mainDatabase(), 'save')
    .then((filePath) => {
      var opts = {
        properties: ['openFile', 'multiSelections'],
      }
      if (filePath != null) {
        opts.defaultPath = filePath
      }
      return dialog.showOpenDialog(opts)
    })
    .then((result) => {
      if (!result.canceled) {
        fileOpen(mainDatabase(), browserWindow.id, result.filePaths)
      }
    })
    .catch((err) => showErrorMessage('Open file', err))
}

/**
 * Perform a save, defering to save as if file is not yet selected.
 *
 * @param {*} menuItem
 * @param {*} browserWindow
 * @param {*} event
 */
function doSave(menuItem, browserWindow, event) {
  getSessionInfoFromWindowId(mainDatabase(), browserWindow.id)
    .then((row) =>
      getSessionKeyValue(mainDatabase(), row.sessionId, 'filePath')
    )
    .then((filePath) => {
      if (filePath == null) {
        doSaveAs(menuItem, browserWindow, event)
      } else {
        return fileSave(mainDatabase(), browserWindow.id, filePath)
      }
    })
}

/**
 * Perform save as.
 *
 * @param {*} menuItem
 * @param {*} browserWindow
 * @param {*} event
 */
function doSaveAs(menuItem, browserWindow, event) {
  selectFileLocation(mainDatabase(), 'save')
    .then((filePath) => {
      var opts = {}
      if (filePath != null) {
        opts.defaultPath = filePath
      }
      return dialog.showSaveDialog(opts)
    })
    .then((result) => {
      if (!result.canceled) {
        return fileSave(mainDatabase(), browserWindow.id, result.filePath)
      } else {
        return null
      }
    })
    .then((filePath) => {
      if (filePath != null) {
        insertFileLocation(mainDatabase(), filePath, 'save')
        browserWindow.setTitle(filePath)
        dialog.showMessageBox(browserWindow, {
          title: 'Save',
          message: `Save done. Output: ${filePath}`,
          buttons: ['Ok'],
        })
      }
    })
    .catch((err) => showErrorMessage('Save file', err))
}

/**
 * This function gets the directory where user wants the output and
 * calls generateCode function which generates the code in the user selected
 * output.
 *
 * @param {*} browserWindow
 */
function generateInDir(browserWindow) {
  dialog
    .showOpenDialog({ properties: ['openDirectory'] })
    .then((result) => {
      if (!result.canceled) {
        return Promise.resolve(result.filePaths[0])
      } else {
        return Promise.resolve(null)
      }
    })
    .then((filePath) => {
      if (filePath != null) {
        generationDirectory = filePath
        generateCode(mainDatabase())
        dialog.showMessageBox(browserWindow, {
          title: 'Generation',
          message: `Generation Output: ${filePath}`,
          buttons: ['Ok'],
        })
      }
    })
    .catch((err) => showErrorMessage('Save file', err))
}

/**
 * This function gets the directory where user wants the output and calls
 * generateCode function which generates the code in the user selected output.
 *
 * @param {*} browserWindow
 */
function setHandlebarTemplateDirectory(browserWindow) {
  dialog
    .showOpenDialog({ properties: ['openDirectory'] })
    .then((result) => {
      if (!result.canceled) {
        return Promise.resolve(result.filePaths[0])
      } else {
        return Promise.resolve(null)
      }
    })
    .then((filePath) => {
      if (filePath != null) {
        handlebarTemplateDirectory = filePath
        dialog.showMessageBox(browserWindow, {
          title: 'Handlebar Templates',
          message: `Handlebar Template Directory: ${filePath}`,
          buttons: ['Ok'],
        })
      }
    })
    .catch((err) => showErrorMessage('Save file', err))
}

/**
 * This function generates the code into the user defined directory using promises
 *
 * @param {*} db
 */
function generateCode(db) {
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
  const HANDLEBAR_TEMPLATE_FILE_DEBUG_PRINTING = 'debug-printing-zcl.handlebars'
  const HANDLEBAR_TEMPLATE_FILE_CALLBACK_ZCL = 'callback-zcl.handlebars'
  const HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_GLOBAL =
    'client-command-macro-global.handlebars'
  const HANDLEBAR_TEMPLATE_FILE_CLIENT_COMMAND_MACRO_CLUSTER =
    'client-command-macro-cluster.handlebars'
  const DATABASE_ROW_TYPE_CLUSTER = 'clusters'
  const DATABASE_ROW_TYPE_ENUMS = 'enums'
  const DATABASE_ROW_TYPE_BITMAPS = 'bitmaps'
  const DATABASE_ROW_TYPE_AF_STRUCTS = 'af-structs'
  const DATABASE_ROW_TYPE_PRINT_CLUSTER = 'print-cluster'
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
  mapDatabase(db)
    .then((templateDir) =>
      resolveTemplateDirectory(templateDir, handlebarTemplateDirectory)
    )
    .then((templates) =>
      compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_CLUSTERS])
    )
    .then((databaseRows) =>
      infoFromDb(databaseRows, [DATABASE_ROW_TYPE_CLUSTER])
    )
    .then((helperResolution) =>
      resolveHelper(helperResolution, clusterHandleBarHelpers)
    )
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'cluster-id.h',
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
  mapDatabase(db)
    .then((templateDir) =>
      resolveTemplateDirectory(templateDir, handlebarTemplateDirectory)
    )
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
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'enums.h',
        enumsRowToHandlebarTemplateFileMap
      )
    )
    .catch((err) => logError(err))

  //print-cluster.h
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
  mapDatabase(db)
    .then((templateDir) =>
      resolveTemplateDirectory(templateDir, handlebarTemplateDirectory)
    )
    .then((templates) =>
      compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS])
    )
    .then((databaseRows) =>
      infoFromDb(databaseRows, [DATABASE_ROW_TYPE_PRINT_CLUSTER])
    )
    .then((helperResolution) =>
      resolveHelper(helperResolution, printClusterHandleBarHelpers)
    )
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'print-cluster.h',
        printClusterRowToHandleBarTemplateFileMap
      )
    )
    .catch((err) => logError(err))

  //af-structs.h
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
  mapDatabase(db)
    .then((templateDir) =>
      resolveTemplateDirectory(templateDir, handlebarTemplateDirectory)
    )
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
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'af-structs.h',
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
  mapDatabase(db)
    .then((templateDir) => resolveTemplateDirectory(templateDir, ''))
    .then((templates) =>
      compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE])
    )
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'att-storage.h',
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

  mapDatabase(db)
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
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'debug-printing-zcl.h',
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

  mapDatabase(db)
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
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'callback-zcl.h',
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
  clientCommandMacroHandleBarHelpers[HANDLEBAR_HELPER_DIRECTION] = getDirection
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
  clientCommandMacroHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase
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

  mapDatabase(db)
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
    .then((directoryResolution) =>
      resolveGenerationDirectory(directoryResolution)
    )
    .then((resultToFile) =>
      generateDataToFile(
        resultToFile,
        'client-command-macro.h',
        clientCommandMacroRowToHandlebarTemplateFileMap
      )
    )
    .catch((err) => logError(err))
}
/**
 * perform the save.
 *
 * @param {*} db
 * @param {*} winId
 * @param {*} filePath
 * @returns Promise of saving.
 */
function fileSave(db, winId, filePath) {
  return getSessionInfoFromWindowId(db, winId)
    .then((row) => {
      return updateKeyValue(db, row.sessionId, 'filePath', filePath).then(
        () => row
      )
    })
    .then((row) => exportDataIntoFile(db, row.sessionId, filePath))
    .catch((err) => showErrorMessage('File save', err))
}

/**
 * Perform the do open action, possibly reading in multiple files.
 *
 * @param {*} db
 * @param {*} winId
 * @param {*} filePaths
 */
function fileOpen(db, winId, filePaths) {
  filePaths.forEach((filePath, index) => {
    readAndProcessFile(db, filePath)
  })
}

/**
 * Process a single file, parsing it in as JSON and then possibly opening
 * a new window if all is good.
 *
 * @param {*} db
 * @param {*} filePath
 */
function readAndProcessFile(db, filePath) {
  logInfo(`Read and process: ${filePath}`)
  readDataFromFile(filePath)
    .then((state) => writeStateToDatabase(mainDatabase(), state))
    .then((sessionId) => {
      windowCreate(httpPort, filePath, sessionId)
      return true
    })
    .catch((err) => {
      showErrorMessage(filePath, err)
    })
}

/**
 * Description: Resolve the generation directory to be able to generate to the
 * correct directory.
 * @export
 * @param {*} map
 * @returns promise that resolves into a map.
 */
export function resolveGenerationDirectory(map) {
  return new Promise((resolve, reject) => {
    map.generationDirectory = generationDirectory
    resolve(map)
  })
}

/**
 * Initialize a menu.
 *
 * @export
 * @param {*} port
 */
export function initMenu(port) {
  httpPort = port
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
