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
const dbEnum = require('../../src-shared/db-enum.js')
const fs = require('fs')
const { default: cluster } = require('cluster')
const fsp = fs.promises

async function selectClusterName(db, clusterRef) {
  let clusterName = await dbApi.dbAll(
    db,
    'SELECT NAME FROM CLUSTER WHERE CLUSTER_ID = ?',
    [clusterRef]
  )
  return clusterName[0].NAME
}

async function selectAttributeName(db, attributeId) {
  let attributeName = await dbApi.dbAll(
    db,
    'SELECT NAME FROM ATTRIBUTE WHERE ATTRIBUTE_ID = ?',
    [attributeId]
  )
  return attributeName[0].NAME
}

async function queryMetaFile(db, packageId) {
  let path = await dbApi.dbAll(
    db,
    'SELECT PATH FROM PACKAGE WHERE PACKAGE_ID = ?',
    [packageId]
  )
  return path[0].PATH
}
async function queryPackages(db, attributeId) {
  let package_ref = await dbApi.dbAll(
    db,
    'SELECT PACKAGE_REF FROM ATTRIBUTE WHERE ATTRIBUTE_ID = ?',
    [attributeId]
  )
  return package_ref[0].PACKAGE_REF
}

/**
 * Returns an array of objects containing global attributes that should be forced external.
 *
 * @export
 * @param {*} db
 * @param {*} attributeId
 * @returns An array of objects
 */

async function checkGlobals(db, attributeId) {
  let pkgs = await queryPackages(db, attributeId)
  let zcl = await queryMetaFile(db, pkgs)
  let obj = await fsp.readFile(zcl)
  let data = JSON.parse(obj)
  let externals = data.attributeAccessInterfaceAttributes
  let lists = data.listsUseAttributeAccessInterface
  let forcedExternal = { externals, lists }
  return forcedExternal
}

/**
 * Returns a flag stating which type of storage option the attribute is categorized to be.
 *
 * @export
 * @param {*} db
 * @param {*} staticAttribute
 * @param {*} forcedExternal
 * @param {*} clusterRef
 * @param {*} attributeId
 * @returns A flag.
 */

async function checkStorage(
  db,
  clusterName,
  clusterRef,
  storagePolicy,
  forcedExternal,
  attributeId,
  attribute
) {
  let storageOption
  let attributeName
  if (!clusterName) {
    clusterName = await selectClusterName(db, clusterRef)
    if (storagePolicy == dbEnum.storagePolicy.attributeAccessInterface) {
      storageOption = dbEnum.storageOption.external
    } else if (storagePolicy == dbEnum.storagePolicy.any) {
      storageOption = dbEnum.storageOption.ram
    }
  }
  if (
    forcedExternal.externals &&
    forcedExternal.externals[clusterName] &&
    forcedExternal.externals[clusterName].includes(attributeName)
  ) {
    storageOption = dbEnum.storageOption.external
  }
  return storageOption
}

exports.checkGlobals = checkGlobals
exports.checkStorage = checkStorage
