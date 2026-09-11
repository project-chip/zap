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
 *  Main UI
 *
 * @module JS API: UI
 */

// enable stack trace to be mapped back to the correct line number in TypeScript source files.
require('source-map-support').install()

const { app } = require('electron')
const args = require('../util/args')
const env = require('../util/env')
const windowJs = require('./window')
const startup = require('../main-process/startup')
const uiUtil = require('./ui-util')
const util = require('../util/util')

env.versionsCheck()
env.setProductionEnv()

/**
 * Hook second instance.
 *
 * @param {*} argv
 */
function hookSecondInstanceEvents(argv) {
  app
    .whenReady()
    .then(() =>
      startup.startUpSecondaryInstance(argv, { quitFunction: app.quit })
    )
}

/**
 * Hook up all the events for the electron app object.
 */
function hookMainInstanceEvents(argv) {
  app
    .whenReady()
    .then(() =>
      startup.startUpMainInstance(argv, {
        quitFunction: app.quit,
        uiEnableFunction: uiUtil.enableUi
      })
    )
    .catch((err) => {
      console.log(err)
      app.quit()
    })

  if (!argv._.includes('server') && !argv.noServer) {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
    app.on('activate', () => {
      env.logInfo('Activate...')
      windowJs.windowCreateIfNotThere(argv.httpPort, argv.output)
    })
  }

  let isCleanShutdownDone = false
  app.on('will-quit', (event) => {
    // node-sqlite3 closes asynchronously. If we let Electron tear down the
    // Node environment before the close callback fires, node-sqlite3 will
    // try to invoke a JS callback in a destroyed isolate and abort() (see
    // https://github.com/TryGhost/node-sqlite3 Database::Work_AfterClose).
    // Defer the actual quit until the async shutdown finishes, then use
    // app.exit() which does NOT re-fire 'will-quit'.
    if (isCleanShutdownDone) return
    event.preventDefault()
    startup
      .shutdown()
      .catch((err) => env.logError(`Error during shutdown: ${err}`))
      .finally(() => {
        isCleanShutdownDone = true
        app.exit(0)
      })
  })

  app.on('second-instance', (event, commandLine, workingDirectory) => {
    env.logInfo(`Zap instance started with command line: ${commandLine}`)
  })
}

let argv = args.processCommandLineArguments(process.argv)

util.mainOrSecondaryInstance(
  argv.reuseZapInstance,
  () => hookMainInstanceEvents(argv),
  () => hookSecondInstanceEvents(argv)
)
