#!/usr/bin/env node
/**
 *
 *    Copyright (c) 2023 Silicon Labs
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

const fs = require('fs')
const path = require('path')
const process = require('process')
const scriptUtil = require('./script-util')

const unifySdkPath = process.argv[2]
if (!unifySdkPath) {
  throw Error('Missing Argument. Usage: unify-regen.js <unify_sdk_path>')
}

/**
 * Regenerates all zap generated files for the Unify gsdk.
 */
async function generateZapFiles() {
  try {
    // get the Zcl file
    const zclFile = `${unifySdkPath}components/uic_dotdot/dotdot-xml/library.xml`
    if (!fs.existsSync(zclFile)) {
      throw Error(`Invalid Zcl File ${zclFile} does not exist.`)
    } else {
      console.log(`👍 ZCL metafile: ${zclFile}`)
    }

    // get all template files in the unify sdk
    const templateFiles = await scriptUtil.locateRecursively(
      unifySdkPath,
      'gen-templates.json'
    )
    if (templateFiles.length === 0) {
      throw Error(`No template files found in ${unifySdkPath}`)
    } else {
      console.log(`👍 Found ${templateFiles.length} template files.`)
    }

    // get ZAP main path
    const zapCli = scriptUtil.mainPath(false)

    for (const templateFile of templateFiles) {
      // get the output directory as per unify sdk structure
      const outputDir = path.join(
        path.dirname(path.dirname(templateFile)),
        'zap-generated'
      )
      fs.rmSync(outputDir, { recursive: true, force: true })

      let cmdArgs = [
        'node',
        scriptUtil.mainPath(false),
        'generate',
        '--unhandled-rejections=strict',
        '--tempState' // consecutive generation of zap files breaks without this flag
      ]
      cmdArgs.push('-o')
      cmdArgs.push(outputDir)
      cmdArgs.push('--gen')
      cmdArgs.push(templateFile)
      cmdArgs.push('--zcl')
      cmdArgs.push(zclFile)

      await scriptUtil.executeCmd(null, 'npx', cmdArgs)
    }
  } catch (error) {
    throw Error('An error occurred during the ZAP generation process:', error)
  }
}

generateZapFiles()
