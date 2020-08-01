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

const { spawn } = require('child_process')
const yargs = require('yargs')
const fs = require('fs')

function executeCmd(ctx, cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Executing: ${cmd}`)
    var c = spawn(cmd, args)
    c.on('exit', (code) => {
      if (code == 0) {
        resolve(ctx)
      } else {
        console.log(`👎 Program ${cmd} exited with error code: ${code}`)
        reject(code)
      }
    })
    c.stdout.on('data', (data) => {
      process.stdout.write(data)
    })
    c.stderr.on('data', (data) => {
      process.stderr.write('⇝ ' + data)
    })
  })
}

var arg = yargs
  .option('zclProperties', {
    desc: 'Specifies zcl.properties file to be used.',
    alias: 'z',
    type: 'string',
    demandOption: true,
  })
  .option('out', {
    desc: 'Output directory where the generated files will go.',
    alias: 'o',
    type: 'string',
    demandOption: true,
  })
  .option('generationTemplate', {
    desc: 'Specifies gen-template.json file to be used.',
    alias: 'g',
    type: 'string',
    demandOption: true,
  })
  .demandOption(
    ['zclProperties', 'out', 'generationTemplate'],
    'Please provide required options!'
  )
  .help().argv

var ctx = {}

if (!fs.existsSync(arg.out)) {
  console.log(`✅ Creating directory: ${arg.out}`)
  fs.mkdirSync(arg.out)
}

executeCmd(ctx, 'electron', [
  'src-electron/main-process/electron-main.js',
  '--noUi',
  '--noServer',
  '--zclProperties',
  arg.zclProperties,
  '--genTemplateJson',
  arg.generationTemplate,
  '--output',
  arg.out,
  'generate',
])
  .then(() => {
    console.log('😎 All done.')
    process.exit(0)
  })
  .catch((code) => {
    process.exit(code)
  })
