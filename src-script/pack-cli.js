'use strict'

// Utilty script for adding zap-cli binaries to zap binaries generated via "pack:$platform" NPM targets

const zip = require('../node_modules/7zip-bin/index')
const scriptUtil = require('./script-util.js')
const fs = require('fs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv)).argv
const baseDir = `${__dirname}/../`
let args = []
console.log(argv)

let platform
if (argv.p) {
  platform = argv.p
} else {
  platform = process.platform
}

if (platform.includes('darwin') || platform.includes('mac')) {
  fs.rename(`${baseDir}/dist/zap-macos`, `${baseDir}/dist/zap-cli`, () => {})
  args.push('a', `${baseDir}/dist/zap-mac.zip`, `${baseDir}/dist/zap-cli`)
} else if (platform.includes('win')) {
  fs.rename(
    `${baseDir}/dist/zap-win.exe`,
    `${baseDir}/dist/zap-cli.exe`,
    () => {}
  )
  args.push('a', `${baseDir}/dist/zap-win.zip`, `${baseDir}/dist/zap-cli.exe`)
} else {
  fs.rename(`${baseDir}/dist/zap-linux`, `${baseDir}/dist/zap-cli`, () => {})
  args.push('a', `${baseDir}/dist/zap-linux.zip`, `${baseDir}/dist/zap-cli`)
}

scriptUtil.executeCmd({}, zip.path7za, [...args])
