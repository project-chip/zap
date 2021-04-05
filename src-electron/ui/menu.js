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

const { dialog, Menu, shell } = require('electron')
const env = require('../util/env.js')
const queryGeneric = require('../db/query-generic.js')
const querySession = require('../db/query-session.js')
const uiJs = require('./ui-util.js')
const preference = require('../main-process/preference.js')
const about = require('../main-process/about.js')
const generationEngine = require('../generator/generation-engine.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')
const commonUrl = require('../../src-shared/common-url.js')
const browserApi = require('./browser-api.js')

const newConfiguration = 'New Configuration'

const template = (db, httpPort) => [
  {
    role: 'fileMenu',
    submenu: [
      {
        label: newConfiguration + '...',
        accelerator: 'CmdOrCtrl+N',
        httpPort: httpPort,
        click(menuItem, browserWindow, event) {
          uiJs.openNewConfiguration(menuItem.httpPort)
        },
      },
      {
        label: 'Open File...',
        accelerator: 'CmdOrCtrl+O',
        db: db,
        click(menuItem, browserWindow, event) {
          doOpen(menuItem.db)
        },
      },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        db: db,
        click(menuItem, browserWindow, event) {
          doSave(menuItem.db, browserWindow)
        },
      },
      {
        label: 'Save As...',
        db: db,
        click(menuItem, browserWindow, event) {
          doSaveAs(menuItem.db, browserWindow)
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Generate Code',
        db: db,
        click(menuItem, browserWindow, event) {
          generateInDir(menuItem.db, browserWindow)
        },
      },
      {
        label: 'Preferences...',
        httpPort: httpPort,
        click(menuItem, browserWindow, event) {
          preference.createOrShowPreferencesWindow(
            browserWindow,
            menuItem.httpPort
          )
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
        label: 'Documentation',
        click(menuItem, browserWindow, event) {
          shell.openExternal(commonUrl.documentationUrl)
        },
      },
      {
        label: 'User and session information',
        db: db,
        click(menuItem, browserWindow, event) {
          getUserSessionInfoMessage(menuItem.db, browserWindow)
            .then((msg) => {
              dialog.showMessageBox(browserWindow, {
                title: 'User and session information',
                message: msg,
                buttons: ['Dismiss'],
              })
            })
            .catch((err) => uiJs.showErrorMessage('Session info', err))
        },
      },
      {
        label: 'Renderer API information',
        click(menuItem, browserWindow, event) {
          browserApi.getRendererApiInformation(browserWindow).then((msg) => {
            dialog.showMessageBox(browserWindow, {
              title: 'Renderer API information',
              message: msg,
              buttons: ['Dismiss'],
            })
          })
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Start progress',
        click(menuItem, browserWindow) {
          browserApi.progressStart(browserWindow, 'Test progress indication.')
        },
      },
      {
        label: 'End progress',
        click(menuItem, browserWindow) {
          browserApi.progressEnd(browserWindow)
        },
      },
      {
        label: 'About',
        httpPort: httpPort,
        click(menuItem, browserWindow, event) {
          about.createOrShowAboutWindow(browserWindow, menuItem.httpPort)
        },
      },
    ],
  },
]

async function getUserSessionInfoMessage(db, browserWindow) {
  let userKey = await browserApi.getUserKeyFromBrowserWindow(browserWindow)
  let session = await querySession.getSessionInfoFromSessionKey(db, userKey)
  let sessionUuid = await browserApi.getSessionUuidFromBrowserWindow(
    browserWindow
  )
  return `
  Browser session UUID: ${sessionUuid}
  Browser user key: ${userKey}

  Session id: ${session.sessionId}
  Session creationTime: ${new Date(session.creationTime)}
  Session session key:  ${session.sessionKey}
  `
}

/**
 * Perform a file->open operation.
 *
 * @param {*} menuItem
 * @param {*} browserWindow
 * @param {*} event
 */
function doOpen(db) {
  queryGeneric
    .selectFileLocation(db, dbEnum.fileLocationCategory.save)
    .then((filePath) => {
      let opts = {
        properties: ['openFile', 'multiSelections'],
      }
      if (filePath != null) {
        opts.defaultPath = filePath
      }
      return dialog.showOpenDialog(opts)
    })
    .then((result) => {
      if (!result.canceled) {
        fileOpen(result.filePaths)
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
function doSave(db, browserWindow) {
  if (browserWindow.getTitle().includes(newConfiguration)) {
    doSaveAs(db, browserWindow)
  } else {
    fileSave(browserWindow, null)
  }
}

/**
 * Perform save as.
 *
 * @param {*} menuItem
 * @param {*} browserWindow
 * @param {*} event
 */
function doSaveAs(db, browserWindow) {
  queryGeneric
    .selectFileLocation(db, dbEnum.fileLocationCategory.save)
    .then((filePath) => {
      let opts = {
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
        fileSave(browserWindow, result.filePath)
        return result.filePath
      } else {
        return null
      }
    })
    .then((filePath) => {
      if (filePath != null) {
        queryGeneric.insertFileLocation(
          db,
          filePath,
          dbEnum.fileLocationCategory.save
        )
        browserWindow.setTitle(filePath)
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
function generateInDir(db, browserWindow) {
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

      return browserApi
        .getUserKeyFromBrowserWindow(browserWindow)
        .then((sessionKey) =>
          querySession.getSessionInfoFromSessionKey(db, sessionKey)
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
          db,
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
      let promises = []
      context.packageIds.forEach((pkgId) => {
        env.logInfo(
          `Setting up generation for session ${context.sessionId} and package ${pkgId}`
        )
        promises.push(
          generationEngine.generateAndWriteFiles(
            db,
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
 * perform the save.
 *
 * @param {*} db
 * @param {*} browserWindow
 * @param {*} filePath
 * @returns Promise of saving.
 */
function fileSave(browserWindow, filePath) {
  browserApi.executeSave(browserWindow, filePath)
}

/**
 * Perform the do open action, possibly reading in multiple files.
 *
 * @param {*} db
 * @param {*} filePaths
 */
function fileOpen(filePaths) {
  filePaths.forEach((filePath, index) => {
    uiJs.openFileConfiguration(filePath, httpPort)
  })
}

/**
 * Initialize a menu.
 *
 * @export
 * @param {*} port
 */
function initMenu(db, httpPort) {
  const menu = Menu.buildFromTemplate(template(db, httpPort))
  Menu.setApplicationMenu(menu)
}

exports.initMenu = initMenu
exports.newConfiguration = newConfiguration
