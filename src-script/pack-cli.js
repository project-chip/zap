'use strict'

// Utilty script for adding ${cli} binaries to zap binaries generated via "pack:$platform" NPM targets

const zip = require('../node_modules/7zip-bin/index')
const scriptUtil = require('./script-util.js')
const fsp = require('fs/promises')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const baseDir = `${__dirname}/../`
const dist = `${baseDir}/dist`
console.log(argv)

const platform = argv.p ? argv.p : process.platform

async function addToZip(dst, filename) {
  await scriptUtil.executeCmd({}, zip.path7za, [
    'a',
    `${dist}/${dst}`,
    `${dist}/${filename}`,
  ])
}

async function rename(oldPath, newPath) {
  await fsp.rename(`${dist}/${oldPath}`, `${dist}/${newPath}`)
}

async function main() {
  if (platform.includes('darwin') || platform.includes('mac')) {
    let file = 'zap-macos'
    let cli = `zap-cli`

    await rename(`${file}`, cli)
    await addToZip(`zap-mac-x64.zip`, cli)

    // NOTE: pkg support for macos-arm64 is experimental
    // await rename(`${file}-arm64`, cli)
    // await addToZip(`${file}-arm64.zip`, cli)
  } else if (platform.includes('win')) {
    let file = 'zap-win'
    let cli = `zap-cli.exe`

    await rename(`${file}-x64.exe`, cli)
    await addToZip(`${file}-x64.zip`, cli)

    await rename(`${file}-arm64.exe`, cli)
    await addToZip(`${file}-arm64.zip`, cli)
  } else if (platform.includes('linux')) {
    let file = 'zap-linux'
    let cli = `zap-cli`

    await rename(`${file}-x64`, cli)
    await addToZip(`${file}-x64.zip`, cli)

    await rename(`${file}-arm64`, cli)
    await addToZip(`${file}-arm64.zip`, cli)
  }
}

main()
