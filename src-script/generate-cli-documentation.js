const path = require('path')
const fs = require('fs')
const scriptUtil = require('./script-util.js')
const { execSync } = require('child_process')

/**
 * Function to generate the CLI help output
 */
async function generateHelp() {
  try {
    let main = scriptUtil.mainPath(false)
    let introText = `# ZAP CLI
  
The\`zap-cli\`is a command-line interface for key ZAP functionalities, enabling users to generate and manage ZCL artifacts, launch server instances, and more. \`zap-cli\`
is ideal for those who prefer the command line, need a lightweight alternative to the full UI or need to automate certain ZAP-related tasks.

Below is the detailed help output for the CLI:

---

\`\`\`
    `
    let helpOutput = execSync(`node ${main} --help`, { encoding: 'utf-8' })
    let outroText = `\n\`\`\``
    fs.writeFileSync('docs/zap-cli.md', introText + helpOutput + outroText)
    console.log('Zap CLI doc generated successfully')
  } catch (error) {
    console.error('Failed to generate CLI documentation:', error.message)
    throw error
  }
}

generateHelp()
