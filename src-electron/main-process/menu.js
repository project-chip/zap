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

const { dialog, Menu } = require('electron')
const { appDirectory, logInfo, mainDatabase } = require('../util/env.js')
const queryConfig = require('../db/query-config.js')
const queryGeneric = require('../db/query-generic.js')

import { getSessionInfoFromWindowId } from '../db/query-session.js'
import {
  compileTemplate,
  generateDataToFile,
  getGenerationProperties,
  groupInfoIntoDbRow,
  infoFromDb,
  mapDatabase,
  resolveHelper,
  resolveTemplateDirectory,
  generateCode,
} from '../generator/static-generator.js'
import { showErrorMessage } from './ui.js'
import { windowCreate } from './window.js'
import { exportDataIntoFile } from '../importexport/export.js'
import {
  readDataFromFile,
  writeStateToDatabase,
} from '../importexport/import.js'
import * as Preference from './preference.js'

var httpPort
var generationDirectory = appDirectory() + '/generation-output'
var handlebarTemplateDirectory = __dirname + '/../../test/gen-template'
var generationOptionsFile =
  handlebarTemplateDirectory + '/generation-options.json'

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
        accelerator: 'CmdOrCtrl+O',
        click(menuItem, browserWindow, event) {
          doOpen(menuItem, browserWindow, event)
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Preferences...',
        click(menuItem, browserWindow, event) {
          Preference.createOrShowWindow(httpPort)
        },
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
        accelerator: 'CmdOrCtrl+S',
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
  queryGeneric
    .selectFileLocation(mainDatabase(), 'save')
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
      queryConfig.getSessionKeyValue(mainDatabase(), row.sessionId, 'filePath')
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
  queryGeneric
    .selectFileLocation(mainDatabase(), 'save')
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
        queryGeneric.insertFileLocation(mainDatabase(), filePath, 'save')
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
    .showOpenDialog({
      buttonLabel: 'Save',
      properties: ['openDirectory', 'createDirectory'],
    })
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
        getGenerationProperties(
          generationOptionsFile
        ).then((generationOptions) =>
          generateCode(
            mainDatabase(),
            generationOptions,
            generationDirectory,
            handlebarTemplateDirectory
          )
        )
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
 *
 *
 * @export
 * @param {*} generationDir
 */
export function generateCodeViaCli(generationDir) {
  generationDirectory = generationDir
  return getGenerationProperties(
    generationOptionsFile
  ).then((generationOptions) =>
    generateCode(
      mainDatabase(),
      generationOptions,
      generationDirectory,
      handlebarTemplateDirectory
    )
  )
}

/**
 *
 *
 * @export
 * @param {*} handlebarTemplateDir
 */
export function setHandlebarTemplateDirForCli(handlebarTemplateDir) {
  return new Promise((resolve, reject) => {
    handlebarTemplateDirectory = handlebarTemplateDir
    generationOptionsFile =
      handlebarTemplateDirectory + '/generation-options.json'
    resolve(handlebarTemplateDir)
  })
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
      return queryConfig
        .updateKeyValue(db, row.sessionId, 'filePath', filePath)
        .then(() => row)
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
