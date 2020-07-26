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
const env = require('../util/env.js')
const restApi = require(`../../src-shared/rest-api.js`)

// TODO how to handle relative pathing for things like properties file.
exports.zclPropertiesFile = './test/zcl/zcl-test.properties'
exports.genTemplateJsonFile = './test/gen-template/generation-options.json'
exports.httpPort = 9070
exports.uiMode = restApi.uiMode.ZIGBEE

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
    .option('gentemplateJson', {
      desc: 'gen-template.json file to read in.',
      alias: 'gen',
      type: 'string',
      default: exports.genTemplateJsonFile,
    })
    .option('uiMode', {
      desc: 'Mode of the UI to begin in. Options are: ZIGBEE, OLD',
      alias: 'ui',
      type: 'string',
      default: exports.uiMode,
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
    .option('clearDb', {
      desc: 'Clear out the database and start with a new file.',
      type: 'string',
    })
    .usage('Usage: $0 <command> [options]')
    .help()
    .parse(argv)

  // Now populate exported variables with this.
  env.logInfo('Command line arguments:')
  env.logInfo(ret)

  exports.zclPropertiesFile = ret.zclProperties
  exports.httpPort = ret.httpPort
  exports.uiMode = ret.uiMode

  return ret
}

exports.processCommandLineArguments = processCommandLineArguments
