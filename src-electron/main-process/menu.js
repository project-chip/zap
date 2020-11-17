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

const path = require('path')
const { dialog, Menu } = require('electron')
const env = require('../util/env.js')
const util = require('../util/util.js')
const queryConfig = require('../db/query-config.js')
const queryGeneric = require('../db/query-generic.js')
const querySession = require('../db/query-session.js')
const exportJs = require('../importexport/export.js')
const uiJs = require('./ui.js')
const preference = require('./preference.js')
const generationEngine = require('../generator/generation-engine.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')

var httpPort

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
          preference.createOrShowWindow(httpPort)
        },
      },
      {
        label: 'Session Information...',
        click(menuItem, browserWindow, event) {
          let cookieText = ''
          util
            .getSessionKeyFromBrowserWindow(browserWindow)
            .then((sessionKey) => {
              cookieText = sessionKey
              return sessionKey
            })
            .then((sessionKey) =>
              querySession.getSessionInfoFromSessionKey(
                env.mainDatabase(),
                sessionKey
              )
            )
            .then((row) => {
              dialog.showMessageBox(browserWindow, {
                title: 'Information',
                message: `Zap session id: ${
                  row.sessionId
                }\nWinID Session key: ${row.sessionKey}\nTime: ${new Date(
                  row.creationTime
                )}\nCookie session key: ${cookieText}`,
                buttons: ['Dismiss'],
              })
            })
            .catch((err) => uiJs.showErrorMessage('Session info', err))
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
    .selectFileLocation(env.mainDatabase(), dbEnum.fileLocationCategory.save)
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
        fileOpen(env.mainDatabase(), result.filePaths)
      }
    })
    .catch((err) => uiJs.showErrorMessage('Open file', err))
}

/**
 * Perform a save, defering to save as if file is not yet selected.
 *
 * @param {*} menuItem
 * @param {*} browserWindow
 * @param {*} event
 */
function doSave(menuItem, browserWindow, event) {
  util
    .getSessionKeyFromBrowserWindow(browserWindow)
    .then((sessionKey) =>
      querySession.getSessionInfoFromSessionKey(env.mainDatabase(), sessionKey)
    )
    .then((row) =>
      queryConfig.getSessionKeyValue(
        env.mainDatabase(),
        row.sessionId,
        dbEnum.sessionKey.filePath
      )
    )
    .then((filePath) => {
      if (filePath == null) {
        doSaveAs(menuItem, browserWindow, event)
      } else {
        return fileSave(env.mainDatabase(), browserWindow, filePath)
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
    .selectFileLocation(env.mainDatabase(), dbEnum.fileLocationCategory.save)
    .then((filePath) => {
      var opts = {
        filters: [
          { name: 'ZAP Config', extensions: ['zap'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      }
      if (filePath != null) {
        opts.defaultPath = filePath
      }
      return dialog.showSaveDialog(opts)
    })
    .then((result) => {
      if (!result.canceled) {
        return fileSave(env.mainDatabase(), browserWindow, result.filePath)
      } else {
        return null
      }
    })
    .then((filePath) => {
      if (filePath != null) {
        queryGeneric.insertFileLocation(
          env.mainDatabase(),
          filePath,
          dbEnum.fileLocationCategory.save
        )
        browserWindow.setTitle(filePath)
        dialog.showMessageBox(browserWindow, {
          title: 'Save',
          message: `Save done. Output: ${filePath}`,
          buttons: ['Ok'],
        })
      }
    })
    .catch((err) => uiJs.showErrorMessage('Save file', err))
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
        return Promise.resolve({ path: result.filePaths[0] })
      } else {
        return Promise.resolve({})
      }
    })
    .then((context) => {
      if (!('path' in context)) return context

      return util
        .getSessionKeyFromBrowserWindow(browserWindow)
        .then((sessionKey) =>
          querySession.getSessionInfoFromSessionKey(
            env.mainDatabase(),
            sessionKey
          )
        )
        .then((session) => {
          env.logInfo(`Generating for session ${session.sessionId}`)
          context.sessionId = session.sessionId
          return context
        })
    })
    .then((context) => {
      context.packageIds = []
      if (!('sessionId' in context)) return context

      env.logInfo(
        `Collecting session packages for session ${context.sessionId}`
      )
      return queryPackage
        .getSessionPackagesByType(
          env.mainDatabase(),
          context.sessionId,
          dbEnum.packageType.genTemplatesJson
        )
        .then((pkgs) => {
          pkgs.forEach((pkg) => {
            env.logInfo(`Package ${pkg.id}, type: ${pkg.type}`)
            context.packageIds.push(pkg.id)
          })
          return context
        })
    })
    .then((context) => {
      var promises = []
      context.packageIds.forEach((pkgId) => {
        env.logInfo(
          `Setting up generation for session ${context.sessionId} and package ${pkgId}`
        )
        promises.push(
          generationEngine.generateAndWriteFiles(
            env.mainDatabase(),
            context.sessionId,
            pkgId,
            context.path
          )
        )
      })
      return Promise.all(promises).then(() => context)
    })
    .then((context) => {
      dialog.showMessageBox(browserWindow, {
        title: 'Generation',
        message: `Generation Output: ${context.path}`,
        buttons: ['Ok'],
      })
    })
    .catch((err) => uiJs.showErrorMessage('Save file', err))
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
        dialog.showMessageBox(browserWindow, {
          title: 'Handlebar Templates',
          message: `Handlebar Template Directory: ${filePath}`,
          buttons: ['Ok'],
        })
      }
    })
    .catch((err) => uiJs.showErrorMessage('Save file', err))
}

/**
 * perform the save.
 *
 * @param {*} db
 * @param {*} browserWindow
 * @param {*} filePath
 * @returns Promise of saving.
 */
function fileSave(db, browserWindow, filePath) {
  util
    .getSessionKeyFromBrowserWindow(browserWindow)
    .then((sessionKey) =>
      querySession.getSessionInfoFromSessionKey(db, sessionKey)
    )
    .then((row) => {
      return queryConfig
        .updateKeyValue(
          db,
          row.sessionId,
          dbEnum.sessionKey.filePath,
          path.resolve(filePath)
        )
        .then(() => row)
    })
    .then((row) => exportJs.exportDataIntoFile(db, row.sessionId, filePath))
    .catch((err) => uiJs.showErrorMessage('File save', err))
}

/**
 * Perform the do open action, possibly reading in multiple files.
 *
 * @param {*} db
 * @param {*} filePaths
 */
function fileOpen(db, filePaths) {
  filePaths.forEach((filePath, index) => {
    uiJs.readAndOpenFile(db, filePath, httpPort)
  })
}

/**
 * Initialize a menu.
 *
 * @export
 * @param {*} port
 */
function initMenu(port) {
  httpPort = port
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

exports.initMenu = initMenu
