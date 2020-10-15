#!/usr/bin/env node
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
const fs = require('fs')
const scriptUtil = require('./script-util.js')

var arg = yargs
  .option('zcl', {
    desc: 'Specifies zcl metafile file to be used.',
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
  .option('in', {
    desc: 'Input .zap file from which to read configuration.',
    alias: 'i',
    type: 'string',
    demandOption: false,
  })
  .demandOption(
    ['zcl', 'out', 'generationTemplate'],
    'Please provide required options!'
  )
  .help()
  .wrap(null).argv

var ctx = {}

var cli = [
  'src-electron/main-process/electron-main.js',
  'generate',
  '--noUi',
  '--noServer',
  '--zcl',
  arg.zcl,
  '--generationTemplate',
  arg.generationTemplate,
  '--out',
  arg.out,
]
if (arg.in != null) {
  cli.push('--in')
  cli.push(arg.in)
}

scriptUtil
  .executeCmd(ctx, 'electron', cli)
  .then(() => {
    console.log('😎 All done.')
    process.exit(0)
  })
  .catch((code) => {
    process.exit(code)
  })
