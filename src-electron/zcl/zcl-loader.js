/**
 *
 *    Copyright (c) 2020 Silicon Labs
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
const fsPromise = fs.promises
const path = require('path')
const queryPackage = require('../db/query-package')
const queryCommand = require('../db/query-command')
const queryLoader = require('../db/query-loader')
const dbEnum = require('../../src-shared/db-enum')
const sLoad = require('./zcl-loader-silabs')
const dLoad = require('./zcl-loader-dotdot')
const queryZcl = require('../db/query-zcl')
const queryDeviceType = require('../db/query-device-type')
const env = require('../util/env')
const types = require('../util/types')
const util = require('../util/util')
const queryNotification = require('../db/query-session-notification')

/**
 * Records the toplevel package information and resolves into packageId
 * @param {*} db
 * @param {*} metadataFile
 * @param {*} crc
 * @param {*} isTopLevelPackageInSync
 * @returns packageId
 */
async function recordToplevelPackage(
  db,
  metadataFile,
  crc,
  isTopLevelPackageInSync
) {
  let topLevel = await queryPackage.registerTopLevelPackage(
    db,
    metadataFile,
    crc,
    dbEnum.packageType.zclProperties,
    null,
    null,
    null,
    isTopLevelPackageInSync
  )
  return topLevel.id
}

/**
 * Records the version into the database.
 *
 * @param {*} db
 * @param {*} ctx
 */
async function recordVersion(db, packageId, version, category, description) {
  return queryPackage.updateVersion(
    db,
    packageId,
    version,
    category,
    description
  )
}

/**
 * Retrieve zcl package information
 * @param {*} db
 * @param {*} metadataFile
 * @param {*} options
 * @returns package zcl package information
 */
async function loadZclMetaFilesCommon(db, metadataFile, options) {
  try {
    let ctx = await loadZcl(db, metadataFile)
    return {
      packageId: ctx.packageId,
      multiProtocolInfo: ctx.zcl ? ctx.zcl.multiProtocol : null,
      category: ctx.category,
      parentFile: metadataFile,
    }
  } catch (err) {
    if (options.failOnLoadingError) throw err
  }
}

/**
 * Load attribute mapping table if there is multi-protocol information from a json file.
 * @param {*} db
 * @param {*} multiProtcolInfo
 * @param {*} categoryToPackageIdMap
 */
async function loadAttributeMappingForMultiProtocol(
  db,
  multiProtcolInfo,
  categoryToPackageIdMap
) {
  let attributeMapRes = []
  for (const mi of multiProtcolInfo) {
    let resolvedMetafile = path.resolve(mi.parentFile)
    let metaDataDir = path.dirname(resolvedMetafile)
    let multiProtocolFileName = path.join(
      metaDataDir,
      mi.multiProtocolInfo.defaults
    )
    // Check if this package exists in the db. Add it to package table if it does not exist
    let pkgInfo = await queryPackage.getPackageByPathAndType(
      db,
      multiProtocolFileName,
      dbEnum.packageType.jsonExtension
    )
    let multiProtocolData = await fsPromise.readFile(
      multiProtocolFileName,
      'utf8'
    )
    let actualMultiProtocolFileCrc = util.checksum(multiProtocolData)
    if (!pkgInfo) {
      await queryPackage.insertPathCrc(
        db,
        multiProtocolFileName,
        actualMultiProtocolFileCrc,
        dbEnum.packageType.jsonExtension,
        mi.packageId,
        null,
        mi.category
      )
    } else if (pkgInfo.crc == actualMultiProtocolFileCrc) {
      // No need to load the file again if already loaded once
      continue
    }
    let multiProtocolJsonInfo = JSON.parse(multiProtocolData)
    let jsonFileCategories = multiProtocolJsonInfo.categories
    let clusterInfo = multiProtocolJsonInfo.clusters
    if (clusterInfo && clusterInfo.length > 0) {
      for (const ci of clusterInfo) {
        let attributeInfo = ci.attributes
        if (attributeInfo && attributeInfo.length > 0) {
          for (const ai of attributeInfo) {
            let attributeMapEntry = []
            for (const category of jsonFileCategories) {
              if (ai[category]) {
                attributeMapEntry.push(
                  ai[category].code
                    ? types.hexStringToInt(ai[category].code)
                    : null
                )
                attributeMapEntry.push(
                  ai[category].manufacturerCode
                    ? types.hexStringToInt(ai[category].manufacturerCode)
                    : null
                )
                attributeMapEntry.push(
                  ci[category].code
                    ? types.hexStringToInt(ci[category].code)
                    : null
                )
                attributeMapEntry.push(
                  ci[category].manufacturerCode
                    ? types.hexStringToInt(ci[category].manufacturerCode)
                    : null
                )
                attributeMapEntry.push(categoryToPackageIdMap[category])
                attributeMapEntry.push(categoryToPackageIdMap[category])
              }
            }
            attributeMapRes.push(attributeMapEntry)
          }
        }
      }
    }
  }
  await queryLoader.insertAttributeMappings(db, attributeMapRes)
}

/**
 * Toplevel function that loads the zcl file and passes it off to the correct zcl loader.
 *
 * @export
 * @param {*} db
 * @param {*} metadataFile array of paths
 * @returns Array of loaded packageIds.
 */
async function loadZclMetafiles(
  db,
  metadataFiles,
  options = {
    failOnLoadingError: true,
  }
) {
  let packageIds = []
  let multiProtcolInfo = []
  let categoryToPackageIdMap = {}
  if (Array.isArray(metadataFiles)) {
    for (let f of metadataFiles) {
      let metaInfo = await loadZclMetaFilesCommon(db, f, options)
      if (metaInfo) {
        categoryToPackageIdMap[metaInfo.category] = metaInfo.packageId
        packageIds.push(metaInfo.packageId)
        if (metaInfo.multiProtocolInfo) {
          multiProtcolInfo.push(metaInfo)
        }
      }
    }
  } else {
    let metaInfo = await loadZclMetaFilesCommon(db, metadataFiles, options)
    packageIds.push(metaInfo.packageId)
  }

  // Check for attributeMapping for multi-protocol use case.
  if (multiProtcolInfo.length > 0) {
    await loadAttributeMappingForMultiProtocol(
      db,
      multiProtcolInfo,
      categoryToPackageIdMap
    )
  }
  return packageIds
}

/**
 * Loads individual zcl.json metafile.
 *
 * @param {*} db
 * @param {*} metadataFile
 * @returns Context object that contains .db and .packageId
 */
async function loadZcl(db, metadataFile) {
  let ext = path.extname(metadataFile)
  let resolvedMetafile = path.resolve(metadataFile)

  if (ext == '.xml') {
    return dLoad.loadToplevelXmlFile(db, resolvedMetafile)
  } else if (ext == '.properties') {
    return sLoad.loadZclProperties(db, resolvedMetafile)
  } else if (ext == '.json') {
    return sLoad.loadZclJson(db, resolvedMetafile)
  } else {
    throw new Error(`Unknown zcl metafile type: ${metadataFile}`)
  }
}

/**
 * Load individual custom XML files.
 *
 * @param {*} db
 * @param {*} filePath
 * @param {*} sessionId Current session within which we're loading this file.
 */
async function loadIndividualFile(db, filePath, sessionId) {
  let ext = path.extname(filePath)
  if (ext == '.xml') {
    return sLoad.loadIndividualSilabsFile(db, filePath, sessionId)
  } else {
    let err = new Error(
      `Unable to read file: ${filePath}. Expecting an XML file with ZCL clusters.`
    )
    env.logWarning(err)
    queryNotification.setNotification(db, 'WARNING', err, sessionId, 2, 0)
    return { succeeded: false, err }
  }
}

/**
 * Promises to qualify whether zcl file needs to be reloaded.
 * If yes, the it will resolve with {filePath, data, packageId}
 * If not, then it will resolve with {error}
 *
 * @param {*} db
 * @param {*} info
 * @param {*} parentPackageId
 * @param {*} isCustom
 * @returns Promise that resolves int he object of data.
 */
async function qualifyZclFile(
  db,
  info,
  parentPackageId,
  packageType,
  isCustom
) {
  let filePath = info.filePath
  let data = info.data
  let actualCrc = info.crc

  let pkg = await queryPackage.getPackageByPathAndParent(
    db,
    filePath,
    parentPackageId,
    isCustom
  )

  if (pkg == null) {
    // This is executed if there is no CRC in the database.
    env.logDebug(`No CRC in the database for file ${filePath}, parsing.`)
    let packageId = await queryPackage.insertPathCrc(
      db,
      filePath,
      actualCrc,
      packageType,
      parentPackageId
    )
    return {
      filePath: filePath,
      data: data,
      packageId: parentPackageId == null ? packageId : parentPackageId,
    }
  } else {
    // This is executed if CRC is found in the database.
    if (pkg.crc == actualCrc) {
      // Sending data back when it is a custom xml
      if (parentPackageId == null) {
        return {
          filePath: filePath,
          data: data,
          packageId: pkg.id,
          customXmlReload: true,
          crc: actualCrc,
        }
      }
      env.logDebug(
        `CRC match for file ${pkg.path} (${pkg.crc}), skipping parsing.`
      )
      return {
        error: `${pkg.path} skipped`,
        packageId: pkg.id,
      }
    } else {
      env.logDebug(
        `CRC missmatch for file ${pkg.path}, (${pkg.crc} vs ${actualCrc}) package id ${pkg.id}, parsing.`
      )
      await queryPackage.updatePathCrc(db, filePath, actualCrc, parentPackageId)
      return {
        filePath: filePath,
        data: data,
        packageId: parentPackageId == null ? pkg.id : parentPackageId, // Changing from package to pkg.id since package is not defined
      }
    }
  }
}

/**
 * Promises to perform a post loading step.
 *
 * @param {*} db
 * @returns Promise to deal with the post-loading cleanup.
 */
async function processZclPostLoading(db, packageId) {
  // These queries must make sure that they update ONLY the entities under a given packageId.
  await queryLoader.updateDataTypeClusterReferences(db, packageId)
  await queryDeviceType.updateDeviceTypeEntityReferences(db, packageId)
  return queryCommand.updateCommandRequestResponseReferences(db, packageId)
}

/**
 *
 * @param {*} db
 * @param {*} packageIds
 * @returns data type discriminator map
 */
async function getDiscriminatorMap(db, packageIds) {
  let typeMap = new Map()
  let discriminators = await queryZcl.selectAllDiscriminators(db, packageIds)
  discriminators.forEach((d) => {
    typeMap.set(d.name.toLowerCase(), d.id)
  })
  return typeMap
}

exports.loadZcl = loadZcl
exports.loadZclMetafiles = loadZclMetafiles
exports.recordToplevelPackage = recordToplevelPackage
exports.recordVersion = recordVersion
exports.processZclPostLoading = processZclPostLoading
exports.loadIndividualFile = loadIndividualFile
exports.qualifyZclFile = qualifyZclFile
exports.getDiscriminatorMap = getDiscriminatorMap
