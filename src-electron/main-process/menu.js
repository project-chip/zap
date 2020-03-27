// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { Menu, dialog } from 'electron'
import { windowCreate } from './window.js'
import { mainDatabase, logError, logInfo, appDirectory } from './env.js'
import { mapDatabase, resolveTemplateDirectory, compileTemplate, infoFromDb, generateDataToFile, groupInfoIntoDbRow, resolveHelper } from '../generator/static_generator.js'
import { getUppercase, getStrong, getHexValue } from "../handlebars/helpers/helper_utils.js"
import { getSessionIdFromWindowdId } from '../db/query.js'
import { exportDataIntoFile } from './importexport.js'
import { showErrorMessage } from './ui.js'

var httpPort
var generationDirectory = appDirectory() + "/generation-output"
var handlebarTemplateDirectory = __dirname + '/../../zcl/generation-templates'

const template = [
  {
    role: 'fileMenu',
    submenu: [
      {
        label: 'Generate Code',
        click (menuItem, browserWindow, event) {
          generateInDir(browserWindow)
        }
      },
      {
        label: 'Handlebar Template Directory',
        click (menuItem, browserWindow, event) {
          setHandlebarTemplateDirectory(browserWindow)
        }
      },
      {
        label: 'Open File...',
        click (menuItem, browserWindow, event) {
          doOpen(menuItem, browserWindow, event)
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Session Information...',
        click (menuItem, browserWindow, event) {
          let winId = browserWindow.id
          getSessionIdFromWindowdId(mainDatabase(), winId).then(row => {
            dialog.showMessageBox(browserWindow, {
              title: 'Information',
              message: `Window id: ${winId}\nZap session id: ${row.sessionId}\nSession key: ${row.sessionKey}\nTime: ${new Date(row.creationTime)}`,
              buttons: [ 'Dismiss' ]
            })  
          }).catch(err => showErrorMessage('Session info', err))
        }
      },
      {
        label: 'Save'
      },
      {
        label: 'Save As...',
        click (menuItem, browserWindow, event) {
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

function doOpen(menuItem, browserWindow, event) {
  dialog.showOpenDialog({
    properties: ['multiSelections']
  }).then(result => {
    if (!result.canceled) {
      fileOpen(mainDatabase(), browserWindow.id, result.filePaths)
    }
  }).catch(err => showErrorMessage('Open file', err))
}

function doSaveAs(menuItem, browserWindow, event) {
  dialog.showSaveDialog({}).then(result => {
    if(!result.canceled) {
      return fileSave(mainDatabase(), browserWindow.id, result.filePath)
    } else {
      return Promise.resolve(null)
    }
  }).then(filePath => {
    if ( filePath != null ) {
      dialog.showMessageBox(browserWindow, {
        title: 'Save',
        message: `Save done. Output: ${filePath}`,
        buttons: [ 'Ok' ]
      })
    }
  })
  .catch(err => showErrorMessage('Save file', err))
}

/**
Given: Browser Window
Returns: N/A
Description: This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.
*/
function generateInDir(browserWindow) {
  dialog.showOpenDialog({properties: ['openDirectory']}).then(result => {
    if(!result.canceled) {
      return Promise.resolve(result.filePaths[0])
    } else {
      return Promise.resolve(null)
    }
  }).then(filePath => {
    if ( filePath != null ) {
      generationDirectory = filePath
      generateCode(mainDatabase())
      dialog.showMessageBox(browserWindow, {
        title: 'Generation',
        message: `Generation Output: ${filePath}`,
        buttons: [ 'Ok' ]
      })
    }
  })
  .catch(err => showErrorMessage('Save file', err))
}

/**
Given: Browser Window
Returns: N/A
Description: This function gets the directory where user wants the output and
calls generateCode function which generates the code in the user selected
output.
*/
function setHandlebarTemplateDirectory(browserWindow) {
  dialog.showOpenDialog({properties: ['openDirectory']}).then(result => {
    if(!result.canceled) {
      return Promise.resolve(result.filePaths[0])
    } else {
      return Promise.resolve(null)
    }
  }).then(filePath => {
    if ( filePath != null ) {
      handlebarTemplateDirectory = filePath
      dialog.showMessageBox(browserWindow, {
        title: 'Handlebar Templates',
        message: `Handlebar Template Directory: ${filePath}`,
        buttons: [ 'Ok' ]
      })
    }
  })
  .catch(err => showErrorMessage('Save file', err))
}

/**
Given: N/A
Returns: N/A
Description: This function generates the code into the user defined directory using promises
*/
function generateCode (db) {
  const HANDLEBAR_HELPER_UPPERCASE =  'uppercase';
  const HANDLEBAR_HELPER_STRONG =  'strong';
  const HANDLEBAR_HELPER_HEX_VALUE =  'hexValue';
  const HANDLEBAR_TEMPLATE_FILE_CLUSTERS = "cluster-id.handlebars"
  const HANDLEBAR_TEMPLATE_FILE_ENUMS = "enums.handlebars"
  const HANDLEBAR_TEMPLATE_FILE_BITMAPS = "bitmaps.handlebars"
  const DATABASE_ROW_TYPE_CLUSTER = "clusters"
  const DATABASE_ROW_TYPE_ENUMS = "enums"
  const DATABASE_ROW_TYPE_BITMAPS = "bitmaps"

  //cluster-id.h generation
  var clusterHandleBarHelpers = {}
  clusterHandleBarHelpers[HANDLEBAR_HELPER_UPPERCASE] = getUppercase;
  var clusterRowToHandlebarTemplateFileMap = [{dbRowType: DATABASE_ROW_TYPE_CLUSTER, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_CLUSTERS}];
    mapDatabase(db)
    .then(templateDir =>resolveTemplateDirectory(templateDir, handlebarTemplateDirectory))
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
  var enumsRowToHandlebarTemplateFileMap = [{dbRowType: DATABASE_ROW_TYPE_ENUMS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_ENUMS},
                                            {dbRowType: DATABASE_ROW_TYPE_BITMAPS, hTemplateFile: HANDLEBAR_TEMPLATE_FILE_BITMAPS}];
  mapDatabase(db)
    .then(templateDir =>resolveTemplateDirectory(templateDir, handlebarTemplateDirectory))
    .then(templates => compileTemplate(templates, [HANDLEBAR_TEMPLATE_FILE_ENUMS, HANDLEBAR_TEMPLATE_FILE_BITMAPS]))
    .then(databaseRows => infoFromDb(databaseRows, [DATABASE_ROW_TYPE_ENUMS, DATABASE_ROW_TYPE_BITMAPS]))
    .then(databaseRowsWithEnumItems => groupInfoIntoDbRow(databaseRowsWithEnumItems, {tableName: 'ENUM_ITEMS', foreignKey: 'ENUM_REF', primaryKey: 'ENUM_ID', dbType: 'enums', columns: {NAME: "NAME", VALUE: "VALUE"}} ))
    .then(databaseRowsWithBitmapFields => groupInfoIntoDbRow(databaseRowsWithBitmapFields, {tableName: 'BITMAP_FIELDS', foreignKey: 'BITMAP_REF', primaryKey: 'BITMAP_ID', dbType: 'bitmaps', columns: {NAME: "NAME", VALUE: "MASK"}}))
    .then(helperResolution => resolveHelper(helperResolution, enumHandleBarHelpers))
    .then(directoryResolution => resolveGenerationDirectory(directoryResolution))
    .then(resultToFile => generateDataToFile(resultToFile, 'enums.h', enumsRowToHandlebarTemplateFileMap))
    .catch(err => logError(err))  
}

// This function is called when file save is triggered.
function fileSave (db, winId, filePath) {
  return getSessionIdFromWindowdId(db, winId)
    .then(row => exportDataIntoFile(db, row.sessionId, filePath));
}

// This function is called when file open is triggered.
function fileOpen (db, winId, filePaths) {
  filePaths.forEach((item, index) => {
    logInfo(`Opening: ${item}`)
    windowCreate(httpPort, item)
  })
}

/**
Given: a map and a generation directory path.
Return: a map which has the generation directory.
Description: Resolve the generation directory to be able to generate to the
correct directory.
*/
export function resolveGenerationDirectory(map) {
	return new Promise((resolve, reject) => {
		map.generationDirectory = generationDirectory;
		resolve(map);
	})
}

export function initMenu (port) {
  httpPort = port
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
