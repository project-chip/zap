/**
 * This script runs after all artifacts are built by Electron Builder.
 * It adds additional files (e.g., apack.json, zap.png, zap-cli) to the final
 * .zip artifacts for macOS, Windows, and Linux platforms.
 */
const fs = require('fs')
const path = require('path')
const Seven = require('node-7z')
const sevenBin = require('7zip-bin')
const pathTo7zip = sevenBin.path7za

exports.default = async function (buildResult) {
  const zipFiles = buildResult?.artifactPaths || []

  for (const zipPath of zipFiles) {
    if (!zipPath.endsWith('.zip')) continue
    if (
      !(
        zipPath.includes('mac') ||
        zipPath.includes('win') ||
        zipPath.includes('linux')
      )
    )
      continue

    const additions = [
      path.join(buildResult.outDir, '../apack.json'),
      path.join(buildResult.outDir, '../src/assets/zap.png')
    ]

    // Detect platform and arch from filename
    const platform = zipPath.includes('mac')
      ? 'macos'
      : zipPath.includes('linux')
        ? 'linux'
        : zipPath.includes('win')
          ? 'win'
          : null

    let arch = zipPath.includes('arm64') ? 'arm64' : 'x64'

    if (!platform) continue

    // Compose zap-cli binary name
    let cliName =
      platform === 'win' ? `zap-win-${arch}.exe` : `zap-${platform}-${arch}`

    // MacOS doesn't have an arm64 binary yet
    if (platform === 'macos') {
      cliName = `zap-macos`
    }

    const cliPath = path.join(buildResult.outDir, '../dist', cliName)

    if (fs.existsSync(cliPath)) {
      const tempName = platform === 'win' ? 'zap-cli.exe' : 'zap-cli'
      const tempPath = path.join(__dirname, tempName)

      // Copy to temp with desired name
      fs.copyFileSync(cliPath, tempPath)

      additions.push(tempPath)

      // Clean up after zip
      process.on('exit', () => {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
      })
    } else {
      console.warn(`⚠️  zap-cli not found for ${platform}-${arch}: ${cliPath}`)
    }

    // Add files to zip
    for (const filePath of additions) {
      await new Promise((resolve, reject) => {
        const stream = Seven.add(zipPath, filePath, {
          $bin: pathTo7zip,
          $progress: true
        })
        stream.on('end', resolve)
        stream.on('error', (err) => {
          console.error(`❌ Error adding ${filePath}:`, err.stderr || err)
          reject(err)
        })
      })

      console.log(
        `✅ Added ${path.basename(filePath)} to ${path.basename(zipPath)}`
      )
    }
  }
}
