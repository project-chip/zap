const scriptUtil = require('./script-util.js')
const path = require('path')

exports.default = async function (context) {
  if (
    context.electronPlatformName === 'win32' ||
    context.electronPlatformName === 'linux'
  ) {
    try {
      await scriptUtil.executeCmd({}, 'npx', [
        'copyfiles',
        '-V',
        '-f',
        path.resolve(context.outDir, '../apack.json'),
        path.resolve(context.outDir, '../src/assets/zap.png'),
        context.appOutDir
      ])
      console.log('Files copied successfully.')
    } catch (error) {
      console.error('Error copying files:', error)
    }
  }
}
