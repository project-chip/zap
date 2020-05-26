// Copyright (c) 2020 Silicon Labs. All rights reserved.

import yargs from 'yargs'
import { logInfo } from '../util/env'

// TODO how to handle relative pathing for things like properties file.
export var zclPropertiesFile = './test/zcl/zcl-test.properties'
export var httpPort = 9070

/**
 * Process the command line arguments and resets the state in this file
 * to the specified values.
 *
 * @export
 * @param {*} argv
 * @returns parsed argv object
 */
export function processCommandLineArguments(argv) {
  var ret = yargs
    .command('generate', 'Generate ZCL artifacts.', (yargs) => {
      yargs.positional('outputDir', {
        alias: 'o',
        description: 'Output directory for generated files.',
      })
    })
    .command('selfCheck', 'Perform the self-check of the application.')
    .option('httpPort', {
      desc: 'Port used for the HTTP server',
      alias: 'p',
      type: 'number',
      default: httpPort,
    })
    .option('zclProperties', {
      desc: 'zcl.properties file to read in.',
      alias: 'zcl',
      type: 'string',
      default: zclPropertiesFile,
    })
    .option('noUi', {
      desc: "Don't show the main window when starting.",
    })
    .option('showUrl', {
      desc: 'Print out the URL that an external browser should use.',
    })
    .usage('Usage: $0 <command> [options]')
    .help()
    .parse(argv)

  // Now populate exported variables with this.
  logInfo('Command line arguments:')
  logInfo(ret)

  zclPropertiesFile = ret.zclProperties
  httpPort = ret.httpPort

  return ret
}
