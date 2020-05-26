// Copyright (c) 2019 Silicon Labs. All rights reserved.

import { logError, logInitStdout } from '../util/env.js'

/**
 * This file is used specifically and only for development. It installs
 * `electron-debug` & `vue-devtools`. There shouldn't be any need to
 *  modify this file, but it can be used to extend your development
 *  environment.
 */

logInitStdout()

// Install `electron-debug` with `devtron`
require('electron-debug')({ showDevTools: false })

// Install `vue-devtools`
require('electron').app.on('ready', () => {
  let installExtension = require('electron-devtools-installer')
  installExtension
    .default(installExtension.VUEJS_DEVTOOLS)
    .then(() => {})
    .catch((err) => {
      logError('Unable to install `vue-devtools`: \n', err)
    })
})

// Require `main` process to boot app
require('./electron-main')
