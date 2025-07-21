const fs = require('fs')
const path = require('path')
const Seven = require('node-7z')
const sevenBin = require('7zip-bin')
const pathTo7zip = sevenBin.path7za

exports.default = async function (buildResult) {
  for (const element of buildResult?.artifactPaths || []) {
    if (
      (element.includes('mac') ||
        element.includes('win') ||
        element.includes('linux')) &&
      element.endsWith('.zip')
    ) {
      // Add apack.json first
      await new Promise((resolve, reject) => {
        const myStream1 = Seven.add(
          element, // The .zip file (output)
          path.join(buildResult.outDir, '../apack.json'), // Add apack.json
          {
            $progress: true,
            $bin: pathTo7zip
          }
        )

        myStream1.on('end', resolve)
        myStream1.on('error', (err) => {
          console.log('Error adding apack.json:', err.stderr)
          reject(err)
        })
      })

      // Then add zap.png after apack.json is added
      await new Promise((resolve, reject) => {
        const myStream2 = Seven.add(
          element, // The .zip file (output)
          path.join(buildResult.outDir, '../src/assets/zap.png'), // Add zap.png
          {
            $progress: true,
            $bin: pathTo7zip
          }
        )

        myStream2.on('end', resolve)
        myStream2.on('error', (err) => {
          console.log('Error adding zap.png:', err.stderr)
          reject(err)
        })
      })
    }
  }
}
