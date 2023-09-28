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

const dbApi = require('./db-api.js')
const queryPackage = require('./query-package.js')
const queryAttribute = require('./query-attribute.js')
const queryCluster = require('./query-cluster.js')
const dbEnum = require('../../src-shared/db-enum.js')
const fs = require('fs')
const fsp = fs.promises

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
  let zcl = await queryPackage.getMetaFile(db, pkgs)
  let obj = await fsp.readFile(zcl)
  let data = JSON.parse(obj)
  let externals = data?.attributeAccessInterfaceAttributes
  let lists = data?.listsUseAttributeAccessInterface
  let forcedExternal = { externals, lists }
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
 * @returns A flag.
 */

async function computeStorage(
  db,
  clusterName,
  clusterRef,
  storagePolicy,
  forcedExternal,
  attributeId
) {
  let storageOption
  let attributeName
  if (!clusterName) {
    clusterName = await queryCluster.selectClusterName(db, clusterRef)
    if (storagePolicy == dbEnum.storagePolicy.attributeAccessInterface) {
      storageOption = dbEnum.storageOption.external
    } else if (storagePolicy == dbEnum.storagePolicy.any) {
      storageOption = dbEnum.storageOption.ram
    } else {
      throw 'check storage policy'
    }
  }
  attributeName = await queryAttribute.selectAttributeName(db, attributeId)
  if (
    forcedExternal.externals &&
    forcedExternal.externals[clusterName] &&
    forcedExternal.externals[clusterName].includes(attributeName)
  ) {
    storageOption = dbEnum.storageOption.external
  }
  return storageOption
}

exports.getForcedExternalStorage = getForcedExternalStorage
exports.computeStorage = computeStorage
