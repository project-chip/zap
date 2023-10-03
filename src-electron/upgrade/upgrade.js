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

const dbApi = require('../db/db-api.js')
const queryPackage = require('../db/query-package.js')
const queryCluster = require('../db/query-cluster.js')
const dbEnum = require('../../src-shared/db-enum.js')
const fs = require('fs')
const fsp = fs.promises

/**
 * This file implements upgrade rules which are used to upgrade .zap files and xml files
 * to be in sync with the spec
 */

/**
 * Returns an array of objects containing global attributes that should be forced external.
 *
 * @export
 * @param {*} db
 * @param {*} attributeId
 * @returns An array of objects
 */

async function getForcedExternalStorage(db, attributeId) {
  let pkgs = await queryPackage.getPackageRefByAttributeId(db, attributeId)
  let zcl = await queryPackage.getPackageByPackageId(db, pkgs)
  let obj = await fsp.readFile(zcl.path)
  let data = JSON.parse(JSON.stringify(obj))
  let byName = data?.attributeAccessInterfaceAttributes
  let lists = data?.listsUseAttributeAccessInterface
  let forcedExternal = { byName, lists }
  return forcedExternal
}

/**
 * Returns a flag stating which type of storage option the attribute is categorized to be.
 *
 * @export
 * @param {*} db
 * @param {*} clusterName
 * @param {*} clusterRef
 * @param {*} storagePolicy
 * @param {*} forcedExternal
 * @param {*} attributeId
 * @returns Storage Option
 */

async function computeStorageTemplate(db, clusterRef, attributes) {
  let clusterName
  let forcedExternal
  clusterName = await queryCluster.selectClusterName(db, clusterRef)
  attributes.forEach(async (attribute) => {
    forcedExternal = await getForcedExternalStorage(db, attribute.id)
    if (
      forcedExternal.byName &&
      forcedExternal.byName[clusterName] &&
      forcedExternal.byName[clusterName].includes(attribute.name)
    ) {
      attribute.storagePolicy = dbEnum.storagePolicy.attributeAccessInterface
    }
  })
  return attributes
}

/**
 * Returns a flag stating which type of storage option the attribute is categorized to be.
 *
 * @export
 * @param {*} db
 * @param {*} clusterName
 * @param {*} clusterRef
 * @param {*} storagePolicy
 * @param {*} forcedExternal
 * @param {*} attributeId
 * @returns Storage Option
 */

async function computeStorageNewConfig(
  db,
  clusterRef,
  storagePolicy,
  forcedExternal,
  attributeName
) {
  let storageOption
  let clusterName
  clusterName = await queryCluster.selectClusterName(db, clusterRef)
  if (storagePolicy == dbEnum.storagePolicy.attributeAccessInterface) {
    storageOption = dbEnum.storageOption.external
  } else if (storagePolicy == dbEnum.storagePolicy.any) {
    storageOption = dbEnum.storageOption.ram
  } else {
    throw 'check storage policy'
  }
  if (
    forcedExternal.byName &&
    forcedExternal.byName[clusterName] &&
    forcedExternal.byName[clusterName].includes(attributeName)
  ) {
    storageOption = dbEnum.storageOption.external
  }
  return storageOption
}

/**
 * Returns a flag stating which type of storage option the attribute is categorized to be.
 *
 * @export
 * @param {*} db
 * @param {*} clusterName
 * @param {*} forcedExternal
 * @param {*} attributeId
 * @returns Storage Policy
 */

async function computeStorageImport(
  db,
  clusterName,
  forcedExternal,
  attributeName
) {
  let storagePolicy
  if (
    forcedExternal.byName &&
    forcedExternal.byName[clusterName] &&
    forcedExternal.byName[clusterName].includes(attributeName)
  ) {
    storagePolicy = dbEnum.storagePolicy.attributeAccessInterface
  }
  return storagePolicy
}

exports.getForcedExternalStorage = getForcedExternalStorage
exports.computeStorageImport = computeStorageImport
exports.computeStorageNewConfig = computeStorageNewConfig
exports.computeStorageTemplate = computeStorageTemplate
