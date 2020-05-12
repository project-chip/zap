// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { app } from 'electron'
import { initHttpServer } from '../server/http-server.js'
import { initializeElectronUi, windowCreateIfNotThere } from './window.js'
import { processCommandLineArguments, zclPropertiesFile, httpPort } from './args.js'
import { initDatabase, closeDatabase, loadSchema } from '../db/db-api.js'
import { setMainDatabase, mainDatabase, logInfo, logError, logWarning, logInit, logInitLogFile, logInitStdout, sqliteFile, setDevelopmentEnv, setProductionEnv, schemaFile } from './env.js'
import { loadZcl } from '../zcl/zcl-loader.js'
import { version } from '../../package.json'

logInitLogFile()

if (process.env.DEV) {
  setDevelopmentEnv()
} else {
  setProductionEnv()
}

function attachToDb(db) {
  return new Promise((resolve, reject) => {
    setMainDatabase(db)
    resolve(db)
  })
}

function startSelfCheck() {
  logInitStdout()
  logInfo('Starting self-check')
  initDatabase(sqliteFile())
    .then((db) => attachToDb(db))
    .then((db) => loadSchema(db, schemaFile(), version))
    .then((db) => loadZcl(db, zclPropertiesFile))
    .then(() => {
      logInfo('Self-check done!')
    }).catch((err)=> {
      logError(err)
      throw err
    })
}

function startNormal(ui, showUrl) {
  initDatabase(sqliteFile())
    .then((db) => attachToDb(db))
    .then((db) => loadSchema(db, schemaFile(), version))
    .then((db) => loadZcl(db, zclPropertiesFile))
    .then((db) => initHttpServer(db, httpPort))
    .then(() => {
      if (ui) {
        initializeElectronUi(httpPort)
      } else {
        if (app.dock) {
          app.dock.hide()
        }
        if ( showUrl ) {
          console.log(`http://localhost:${httpPort}/index.html`)
        }
      }
    })
    .catch((err) => {
      logError(err)
      throw err
    })
}

app.on('ready', () => {
  var argv = processCommandLineArguments(process.argv)

  logInfo(argv)
  
  if ( argv._.includes('selfCheck')) {
    startSelfCheck()
  } else {
    startNormal(!argv.noUi, argv.showUrl)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  logInfo('Activate...')
  windowCreateIfNotThere(httpPort)
})

app.on('quit', () => {
  closeDatabase(mainDatabase()).then(() => logInfo('Database closed, shutting down.'))
})
