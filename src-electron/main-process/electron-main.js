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

const { app } = require('electron')

const dbApi = require('../db/db-api.js')
const args = require('../util/args.js')
const env = require('../util/env.js')
const windowJs = require('./window.js')
const startup = require('./startup.js')

env.versionsCheck()

if (process.env.DEV) {
  env.setDevelopmentEnv()
} else {
  env.setProductionEnv()
}

// Registration of all app listeners, the main lifecycle of the application
if (app != null) {
  app
    .whenReady()
    .then(() => {
      var argv = args.processCommandLineArguments(process.argv)

      if (argv.logToStdout) {
        env.logInitStdout()
      } else {
        env.logInitLogFile()
      }

      // For now delete the DB file. There is some weird constraint we run into.
      if (argv.clearDb != null) {
        startup.clearDatabaseFile(env.sqliteFile())
      }

      if (argv._.includes('selfCheck')) {
        return startup.startSelfCheck()
      } else if (argv._.includes('generate')) {
        return startup.startGeneration(
          argv.output,
          argv.generationTemplate,
          argv.zclProperties,
          argv.zapFile
        )
      } else {
        return startup.startNormal(
          !argv.noUi,
          argv.showUrl,
          argv.uiMode,
          argv.embeddedMode
        )
      }
    })
    .catch((err) => {
      console.log(err)
      app.quit(1)
    })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    env.logInfo('Activate...')
    windowJs.windowCreateIfNotThere(args.httpPort)
  })

  app.on('quit', () => {
    if (env.mainDatabase() != null) {
      dbApi
        .closeDatabase(env.mainDatabase())
        .then(() => env.logInfo('Database closed, shutting down.'))
    }
  })
}

exports.loaded = true
