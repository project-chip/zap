/**
 *
 *    Copyright (c) 2026 Silicon Labs
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

/**
 * The data model and generation templates an SDK resolved for a project.
 *
 * Studio and `slc generate` both expand the `zcl.*` properties an apack.json
 * declares and hand the results to ZAP on the command line. SLC also writes the
 * same answers next to the .zap file, as slc_args.json, which is how the server
 * finds them when the interface opens a project file. This does the same for a
 * command line that was given a project .zap and no packages: without it the
 * bundled test data model is used instead, and package matching writes that
 * back into the file on save.
 *
 * @module JS API: SDK arguments
 */

const fs = require('fs')
const path = require('path')
const dbEnum = require('../../src-shared/db-enum.js')

const slcArgsFileName = 'slc_args.json'

/**
 * The slc_args.json keys holding the data model and the generation templates
 * for one protocol, under the package category a .zap file names it by.
 */
const propertiesByCategory = {
  [dbEnum.helperCategory.zigbee]: {
    zcl: dbEnum.slcArgs.zigbeeZclJsonFile,
    template: dbEnum.slcArgs.zigbeeTemplateJsonFile
  },
  [dbEnum.helperCategory.matter]: {
    zcl: dbEnum.slcArgs.matterZclJsonFile,
    template: dbEnum.slcArgs.matterTemplateJsonFile
  }
}

/**
 * Reads the slc_args.json that sits beside a .zap file. Absent or unreadable
 * is not an error: it just means this file was not written by SLC, and the
 * caller carries on with what it had.
 *
 * @param {*} zapFile Path to a .zap file.
 * @returns {*} `{ file, args }`, or null
 */
function readSlcArgs(zapFile) {
  if (typeof zapFile !== 'string' || zapFile.length === 0) return null
  // `--in` also accepts a directory, and generation output is written next to
  // whatever it names. Only an actual configuration has an slc_args.json.
  let stat = fs.existsSync(zapFile) ? fs.statSync(zapFile) : null
  if (stat == null || !stat.isFile()) return null
  let file = path.join(path.dirname(path.resolve(zapFile)), slcArgsFileName)
  if (!fs.existsSync(file)) return null
  try {
    let args = JSON.parse(fs.readFileSync(file, 'utf8'))
    return args != null && typeof args === 'object' ? { file, args } : null
  } catch (err) {
    return null
  }
}

/**
 * The protocols a .zap file is configured against, taken from the categories of
 * its data model packages.
 *
 * Only the data model packages are consulted. A generation template package is
 * the one thing in the file that a previous edit may have replaced with
 * something from another protocol, so it cannot say what the file is.
 *
 * @param {*} zapFile Path to a .zap file.
 * @returns {string[]} package categories, possibly empty
 */
function categoriesOfZapFile(zapFile) {
  try {
    let state = JSON.parse(fs.readFileSync(zapFile, 'utf8'))
    let packages = Array.isArray(state.package) ? state.package : []
    return [
      ...new Set(
        packages
          .filter((pkg) => pkg.type === dbEnum.packageType.zclProperties)
          .map((pkg) => pkg.category)
          .filter((category) => category in propertiesByCategory)
      )
    ]
  } catch (err) {
    return []
  }
}

/**
 * The packages the SDK resolved for the project this .zap file belongs to.
 *
 * Which protocols to answer for comes from the file itself, so a Matter
 * application in a workspace that also has the Zigbee SDK installed gets the
 * Matter data model and the Matter templates, and a multiprotocol file gets
 * both. A file whose data model packages say nothing recognisable falls back to
 * every protocol slc_args.json has an answer for.
 *
 * @param {*} zapFile Path to a .zap file.
 * @returns {*} `{ zclProperties, generationTemplate, categories, file }`, or
 *              null when there is nothing to say
 */
function packagesForZapFile(zapFile) {
  let slcArgs = readSlcArgs(zapFile)
  if (slcArgs == null) return null

  let known = Object.keys(propertiesByCategory)
  let categories = categoriesOfZapFile(zapFile)
  if (categories.length === 0) {
    categories = known.filter(
      (category) => slcArgs.args[propertiesByCategory[category].zcl] != null
    )
  }

  let pick = (kind) =>
    categories
      .map((category) => slcArgs.args[propertiesByCategory[category][kind]])
      .filter((file) => typeof file === 'string' && fs.existsSync(file))

  let zclProperties = pick('zcl')
  let generationTemplate = pick('template')
  if (zclProperties.length === 0 && generationTemplate.length === 0) return null

  return {
    zclProperties: zclProperties,
    generationTemplate: generationTemplate,
    categories: categories,
    file: slcArgs.file
  }
}

exports.slcArgsFileName = slcArgsFileName
exports.readSlcArgs = readSlcArgs
exports.categoriesOfZapFile = categoriesOfZapFile
exports.packagesForZapFile = packagesForZapFile
