const scriptUtil = require('./script-util.js')
const path = require('path')

exports.default = async function (context) {
  if (
    context.electronPlatformName === 'win' ||
    context.electronPlatformName === 'linux'
  ) {
    return scriptUtil.executeCmd({}, 'npx', [
      'copyfiles',
      '-V',
      '-u',
      '5',
      path.resolve(context.outDir, '../apack.json'),
      context.appOutDir,
    ])
  }
}
