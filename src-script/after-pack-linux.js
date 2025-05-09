/**
 * after-pack-linux-assets.js
 * Adds zap-cli, apack.json, and zap.png to Linux app output before .deb/.rpm packaging.
 */
const scriptUtil = require('./script-util.js')
const path = require('path')
const fs = require('fs')

exports.default = async function (context) {
  const { electronPlatformName, appOutDir, outDir, arch } = context

  if (electronPlatformName === 'linux') {
    // 1. Copy apack.json and zap.png
    await scriptUtil.executeCmd({}, 'npx', [
      'copyfiles',
      '-V',
      '-f',
      path.resolve(outDir, '../apack.json'),
      path.resolve(outDir, '../src/assets/zap.png'),
      appOutDir
    ])
    console.log('✅ apack.json and zap.png copied to Linux appOutDir')

    // 2. Copy zap-cli for correct arch
    const archName = arch === 3 ? 'arm64' : 'x64' // arch === 3 => arm64, else x64
    const cliSource = path.resolve(outDir, `../dist/zap-linux-${archName}`)
    const cliDest = path.join(appOutDir, 'zap-cli')

    if (!fs.existsSync(cliSource)) {
      throw new Error(`❌ zap-cli binary not found at ${cliSource}`)
    }

    fs.copyFileSync(cliSource, cliDest)
    fs.chmodSync(cliDest, 0o755)

    console.log(`✅ zap-cli (${archName}) copied to ${cliDest}`)
  }
}
