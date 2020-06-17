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

const yargs = require('yargs')
const { logInfo } = require('../util/env.js')

// TODO how to handle relative pathing for things like properties file.
exports.zclPropertiesFile = './test/zcl/zcl-test.properties'
exports.httpPort = 9070

/**
 * Process the command line arguments and resets the state in this file
 * to the specified values.
 *
 * @export
 * @param {*} argv
 * @returns parsed argv object
 */
function processCommandLineArguments(argv) {
  var ret = yargs
    .command('generate', 'Generate ZCL artifacts.', (yargs) => {
      yargs.positional('outputDir', {
        alias: 'o',
        description: 'Output directory for generated files.',
      })
    })
    .command('selfCheck', 'Perform the self-check of the application.')
    .command('sdkGen', 'Perform the SDK component generation.')
    .option('httpPort', {
      desc: 'Port used for the HTTP server',
      alias: 'p',
      type: 'number',
      default: exports.httpPort,
    })
    .option('zclProperties', {
      desc: 'zcl.properties file to read in.',
      alias: 'zcl',
      type: 'string',
      default: exports.zclPropertiesFile,
    })
    .option('noUi', {
      desc: "Don't show the main window when starting.",
    })
    .option('showUrl', {
      desc: 'Print out the URL that an external browser should use.',
    })
    .option('output', {
      desc: 'Specifying the output directory for generation',
      alias: 'o',
      type: 'string',
    })
    .option('template', {
      desc: 'Specifying the handlebar template directory for generation',
      type: 'string',
    })
    .usage('Usage: $0 <command> [options]')
    .help()
    .parse(argv)

  // Now populate exported variables with this.
  logInfo('Command line arguments:')
  logInfo(ret)

  exports.zclPropertiesFile = ret.zclProperties
  exports.httpPort = ret.httpPort

  return ret
}

exports.processCommandLineArguments = processCommandLineArguments
