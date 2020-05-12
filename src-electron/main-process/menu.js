// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { dialog, Menu } from 'electron'
import { getSessionIdFromWindowdId } from '../db/query-session.js'
import { compileTemplate, generateDataToFile, groupInfoIntoDbRow, infoFromDb, mapDatabase, resolveHelper, resolveTemplateDirectory } from '../generator/static_generator.js'
import { getHexValue, getStrong, getUppercase, getLargestStringInArray, getSwitch, getCase, getDefault } from "../handlebars/helpers/helper_utils.js"
import { appDirectory, logError, logInfo, mainDatabase } from './env.js'
import { exportDataIntoFile } from './importexport.js'
import { showErrorMessage } from './ui.js'
import { windowCreate } from './window.js'
import { selectFileLocation, insertFileLocation } from '../db/query-generic.js'

var httpPort
var generationDirectory = appDirectory() + "/generation-output"
var handlebarTemplateDirectory = __dirname + '/../../zcl/generation-templates'

const template = [
  {
    role: 'fileMenu',
    submenu: [
      {
        label: 'Generate Code',
        click(menuItem, browserWindow, event) {
          generateInDir(browserWindow)
        }
      },
      {
        label: 'Handlebar Template Directory',
        click(menuItem, browserWindow, event) {
          setHandlebarTemplateDirectory(browserWindow)
        }
      },
      {
        label: 'Open File...',
        click(menuItem, browserWindow, event) {
          doOpen(menuItem, browserWindow, event)
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Session Information...',
        click(menuItem, browserWindow, event) {
          let winId = browserWindow.id
          getSessionIdFromWindowdId(mainDatabase(), winId).then(row => {
            dialog.showMessageBox(browserWindow, {
              title: 'Information',
              message: `Window id: ${winId}\nZap session id: ${row.sessionId}\nSession key: ${row.sessionKey}\nTime: ${new Date(row.creationTime)}`,
              buttons: ['Dismiss']
            })
          }).catch(err => showErrorMessage('Session info', err))
        }
      },
      {
        label: 'Save',
        click(menuItem, browserWindow, event) {
          doSave(menuItem, browserWindow, event)
        }
      },
      {
        label: 'Save As...',
        click(menuItem, browserWindow, event) {
          doSaveAs(menuItem, browserWindow, event)
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'close'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  },
  {
    role: 'editMenu'
  },
  {
    role: 'viewMenu'
  },
  {
    role: 'windowMenu'
  },
  {
    label: 'Help',
    submenu: [
      {
        role: 'about'
      }
    ]
  }
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
    .then(filePath => {
      var opts = {
        properties: ['multiSelections']
      }
      if (filePath != null) {
        opts.defaultPath = filePath
      }
      return dialog.showOpenDialog(opts)
    })
    .then(result => {
      if (!result.canceled) {
        fileOpen(mainDatabase(), browserWindow.id, result.filePaths)
      }
    }).catch(err => showErrorMessage('Open file', err))
}

/**
 * Perform a save, defering to save as if file is not yet selected.
 *
 * @param {*} menuItem
 * @param {*} browserWindow
 * @param {*} event
 */
function doSave(menuItem, browserWindow, event) {
  doSaveAs(menuItem, browserWindow, event)
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
    .then(
      filePath => {
        var opts = {}
        if (filePath != null) {
          opts.defaultPath = filePath
        }
        return dialog.showSaveDialog(opts)
      }
    )
    .then(result => {
      if (!result.canceled) {
        return fileSave(mainDatabase(), browserWindow.id, result.filePath)
      } else {
        return Promise.resolve(null)
      }
    })
    .then(filePath => {
      if (filePath != null) {
        insertFileLocation(mainDatabase(), filePath, 'save')
        dialog.showMessageBox(browserWindow, {
          title: 'Save',
          message: `Save done. Output: ${filePath}`,
          buttons: ['Ok']
        })
      }
    })
    .catch(err => showErrorMessage('Save file', err))
}

/**
 * This function gets the directory where user wants the output and
 * calls generateCode function which generates the code in the user selected
 * output.
 *
 * @param {*} browserWindow
 */
function generateInDir(browserWindow) {
  dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
    if (!result.canceled) {
      return Promise.resolve(result.filePaths[0])
    } else {
      return Promise.resolve(null)
    }
  }).then(filePath => {
    if (filePath != null) {
      generationDirectory = filePath
      generateCode(mainDatabase())
      dialog.showMessageBox(browserWindow, {
        title: 'Generation',
        message: `Generation Output: ${filePath}`,
        buttons: ['Ok']
      })
    }
  })
    .catch(err => showErrorMessage('Save file', err))
}

/**
 * This function gets the directory where user wants the output and calls 
 * generateCode function which generates the code in the user selected output.
 *
 * @param {*} browserWindow
 */
function setHandlebarTemplateDirectory(browserWindow) {
  dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
    if (!result.canceled) {
      return Promise.resolve(result.filePaths[0])
    } else {
      return Promise.resolve(null)
    }
  }).then(filePath => {
    if (filePath != null) {
      handlebarTemplateDirectory = filePath
      dialog.showMessageBox(browserWindow, {
        title: 'Handlebar Templates',
        message: `Handlebar Template Directory: ${filePath}`,
        buttons: ['Ok']
      })
    }
  })
    .catch(err => showErrorMessage('Save file', err))
}

/**
 * This function generates the code into the user defined directory using promises
 *
 * @param {*} db
 */
function generateCode(db) {
  const HANDLEBAR_HELPER_UPPERCASE = 'uppercase';
  const HANDLEBAR_HELPER_STRONG = 'strong';
  const HANDLEBAR_HELPER_HEX_VALUE = 'hexValue';
  const HANDLEBAR_HELPER_LENGTH_OF_LARGEST_STRING = 'largestStringInArray';
  const HANDLEBAR_HELPER_SWITCH = "switch";
  const HANDLEBAR_HELPER_CASE = "case";
  const HANDLEBAR_HELPER_DEFAULT = "default";
  const HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE = "att-storage.handlebars";
  const HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS = "af-structs.handlebars";
  const HANDLEBAR_TEMPLATE_FILE_CLUSTERS = "cluster-id.handlebars";
  const HANDLEBAR_TEMPLATE_FILE_ENUMS = "enums.handlebars";
  const HANDLEBAR_TEMPLATE_FILE_BITMAPS = "bitmaps.handlebars";
  const HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS = "print-cluster.handlebars";
  const DATABASE_ROW_TYPE_CLUSTER = "clusters";
  const DATABASE_ROW_TYPE_ENUMS = "enums";
  const DATABASE_ROW_TYPE_BITMAPS = "bitmaps";
  const DATABASE_ROW_TYPE_AF_STRUCTS = "af-structs";
  const DATABASE_ROW_TYPE_PRINT_CLUSTER = "print-cluster";
  const DATABASE_ROW_TYPE_ATT_STORAGE = "att-storage";

  //cluster-id.h generation
  var clusterHandleBarHelpers = {}
  clusterHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase;
  var clusterRowToHandlebarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_CLUSTER, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CLUSTERS }];
  mapDatabase(db)
    .then(templateDir => resolveTemplateDirectory(templateDir, handlebarTemplateDirectory))
    .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_CLUSTERS]))
    .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_CLUSTER]))
    .then(helperResolution => resolveHelper(helperResolution, clusterHandleBarHelpers))
    .then(directoryResolution => resolveGenerationDirectory(directoryResolution))
    .then(resultToFile => generateDataToFile(resultToFile, 'cluster-id.h', clusterRowToHandlebarTemplateFileMap))
    .catch(err => logError(err))

  //enums.h generation
  var enumHandleBarHelpers = {}
  enumHandleBarHelpers[HANDLEBAR_HELPER_STRONG] = getStrong;
  enumHandleBarHelpers[HANDLEBAR_HELPER_HEX_VALUE] = getHexValue;
  var enumsRowToHandlebarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_ENUMS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_ENUMS },
  { dbRowType: DATABASE_ROW_TYPE_BITMAPS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_BITMAPS }];
  mapDatabase(db)
    .then(templateDir => resolveTemplateDirectory(templateDir, handlebarTemplateDirectory))
    .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_ENUMS, HANDLEBAR_TEMPLATE_FILE_BITMAPS]))
    .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_ENUMS, DATABASE_ROW_TYPE_BITMAPS]))
    .then(databaseRowsWithEnumItems => groupInfoIntoDbRow(databaseRowsWithEnumItems, { tableName: 'ENUM_ITEMS', foreignKey: 'ENUM_REF', primaryKey: 'ENUM_ID', dbType: 'enums', columns: { NAME: "NAME", VALUE: "VALUE" } }))
    .then(databaseRowsWithBitmapFields => groupInfoIntoDbRow(databaseRowsWithBitmapFields, { tableName: 'BITMAP_FIELDS', foreignKey: 'BITMAP_REF', primaryKey: 'BITMAP_ID', dbType: 'bitmaps', columns: { NAME: "NAME", VALUE: "MASK" } }))
    .then(helperResolution => resolveHelper(helperResolution, enumHandleBarHelpers))
    .then(directoryResolution => resolveGenerationDirectory(directoryResolution))
    .then(resultToFile => generateDataToFile(resultToFile, 'enums.h', enumsRowToHandlebarTemplateFileMap))
    .catch(err => logError(err))

  //print-cluster.h
  var printClusterHandleBarHelpers = {}
  printClusterHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase;
  printClusterHandleBarHelpers[HANDLEBAR_HELPER_LENGTH_OF_LARGEST_STRING] = getLargestStringInArray;
  var printClusterRowToHandleBarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_PRINT_CLUSTER, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS }];
  mapDatabase(db)
    .then(templateDir => resolveTemplateDirectory(templateDir, handlebarTemplateDirectory))
    .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_PRINT_CLUSTERS]))
    .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_PRINT_CLUSTER]))
    .then(helperResolution => resolveHelper(helperResolution, printClusterHandleBarHelpers))
    .then(directoryResolution => resolveGenerationDirectory(directoryResolution))
    .then(resultToFile => generateDataToFile(resultToFile, 'print-cluster.h', printClusterRowToHandleBarTemplateFileMap))
    .catch(err => logError(err))

  //af-structs.h
  var afStructsHandleBarHelpers = {}
  afStructsHandleBarHelpers[HANDLEBAR_HELPER_SWITCH] = getSwitch;
  afStructsHandleBarHelpers[HANDLEBAR_HELPER_CASE] = getCase;
  afStructsHandleBarHelpers[HANDLEBAR_HELPER_DEFAULT] = getDefault;
  var afStructsRowToHandleBarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_AF_STRUCTS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS }];
  mapDatabase(db)
    .then(templateDir => resolveTemplateDirectory(templateDir, handlebarTemplateDirectory))
    .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_AF_STRUCTS]))
    .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_AF_STRUCTS]))
    .then(databaseRowsWithEnumItems => groupInfoIntoDbRow(databaseRowsWithEnumItems, { tableName: 'STRUCT_ITEMS', foreignKey: 'STRUCT_REF', primaryKey: 'STRUCT_ID', dbType: 'af-structs', columns: { NAME: "NAME", VALUE: "TYPE" } }))
    .then(helperResolution => resolveHelper(helperResolution, afStructsHandleBarHelpers))
    .then(directoryResolution => resolveGenerationDirectory(directoryResolution))
    .then(resultToFile => generateDataToFile(resultToFile, 'af-structs.h', afStructsRowToHandleBarTemplateFileMap))
    .catch(err => logError(err))
    
  //att-storage.h generation
  var attStorageRowToHandleBarTemplateFileMap = [{ dbRowType: DATABASE_ROW_TYPE_ATT_STORAGE, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE }];

  mapDatabase(db)
      .then(templateDir => resolveTemplateDirectory(templateDir, ""))
      .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_ATT_STORAGE]))
      .then(directoryResolution => resolveGenerationDirectory(directoryResolution))
      .then(resultToFile => generateDataToFile(resultToFile, 'att-storage.h', attStorageRowToHandleBarTemplateFileMap))
      .catch(err => logError(err))
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
  return getSessionIdFromWindowdId(db, winId)
    .then(row => exportDataIntoFile(db, row.sessionId, filePath))
    .catch(err => showErrorMessage("File save", err))
}

/**
 * Perform the do open action.
 *
 * @param {*} db
 * @param {*} winId
 * @param {*} filePaths
 */
function fileOpen(db, winId, filePaths) {
  filePaths.forEach((item, index) => {
    logInfo(`Opening: ${item}`)
    windowCreate(httpPort, item)
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
    map.generationDirectory = generationDirectory;
    resolve(map);
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
