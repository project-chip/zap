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
const queryAttribute = require('../db/query-attribute.js')
const dbEnum = require('../../src-shared/db-enum.js')
const fs = require('fs')
const fsp = fs.promises

/**
 * This asynchronous function retrieves and returns the forced external storage options.
 *
 * @param {Object} db - The database instance.
 *
 * The function calls the 'getAttributeAccessInterface' method from 'queryPackage' with
 * the database instance and 'attributeAccessInterface' from 'storagePolicy' as parameters.
 * The result is assigned to 'forcedExternal'.
 * Finally, it returns the 'forcedExternal' options.
 */

async function getForcedExternalStorage(db) {
  let forcedExternal = await queryPackage.getAttributeAccessInterface(
    db,
    dbEnum.storagePolicy.attributeAccessInterface
  )
  return forcedExternal
}

/**
 * This function takes a clusterId (the database ID, not the specification-defined ID) and an array of attributes (associated with the database defined clusterID)
 * and changes the global attributes (attributes with specification defined clusterId = null) to represent storage policy
 * based on the cluster/attribute pair in zcl.json
 *
 * Although the specification defined clusterID of the attriibute is null indicating it is a global attribute, we know what the database defined clusterID is by what is passed in as a parameter.
 *
 * That database defined clusterID is used to query the name of the cluster which is in turn used to compute the storage policy for that cluster/attribute pair.
 *
 * @export
 * @param {*} db
 * @param {*} clusterId (database defined) the clusterId representing a cluster from the database being used in the application
 * @param {*} attributes an array of objects representing the attributes associated with the cluster
 * @returns an array of objects representing attributes in the database
 */

async function computeStoragePolicyForGlobalAttributes(
  db,
  clusterId,
  attributes
) {
  let forcedExternal
  let clusterName = await queryCluster.selectClusterName(db, clusterId)
  return Promise.all(
    attributes.map(async (attribute) => {
      if (attribute.clusterId == null) {
        forcedExternal = await getForcedExternalStorage(db, attribute.id)
        forcedExternal.map((option) => {
          if (
            option.optionCategory == clusterName &&
            option.optionLabel == attribute.name
          ) {
            attribute.storagePolicy =
              dbEnum.storagePolicy.attributeAccessInterface
          }
        })
      }
      return attribute
    })
  )
}
/**
 * This asynchronous function computes and returns the new configuration for a storage option.
 *
 * @param {String} storagePolicy - The current storage policy.
 *
 * The function first initializes the storageOption. Then it checks the storagePolicy:
 * - If it's 'attributeAccessInterface', it sets the storageOption to 'external'.
 * - If it's 'any', it sets the storageOption to 'ram'.
 * If the storagePolicy is neither of these, it throws an error 'check storage policy'.
 * Finally, it returns the updated storage option.
 */

async function computeStorageOptionNewConfig(storagePolicy) {
  let storageOption
  if (storagePolicy == dbEnum.storagePolicy.attributeAccessInterface) {
    storageOption = dbEnum.storageOption.external
  } else if (storagePolicy == dbEnum.storagePolicy.any) {
    storageOption = dbEnum.storageOption.ram
  } else {
    throw 'check storage policy'
  }
  return storageOption
}
/**
 * This asynchronous function computes and returns the new configuration for a storage policy.
 *
 * @param {Object} db - The database instance.
 * @param {Object} clusterRef - The reference to the cluster.
 * @param {String} storagePolicy - The current storage policy.
 * @param {Array} forcedExternal - An array of external options.
 * @param {String} attributeName - The name of the attribute.
 *
 * The function first queries to get the cluster name using the cluster reference.
 * Then it iterates over each option in the forcedExternal array. If the option's category
 * matches the cluster name and the option's label matches the attribute name, it updates
 * the storage policy to attributeAccessInterface. Finally, it returns the updated storage policy.
 */
async function computeStoragePolicyNewConfig(
  db,
  clusterRef,
  storagePolicy,
  forcedExternal,
  attributeName
) {
  let clusterName = await queryCluster.selectClusterName(db, clusterRef)
  forcedExternal.some((option) => {
    if (
      option.optionCategory == clusterName &&
      option.optionLabel == attributeName
    ) {
      storagePolicy = dbEnum.storagePolicy.attributeAccessInterface
    }
  })
  return storagePolicy
}

/**
 * This asynchronous function computes and returns the updated storage import policy.
 *
 * @param {Object} db - The database instance.
 * @param {String} clusterName - The name of the cluster.
 * @param {String} storagePolicy - The current storage policy.
 * @param {Array} forcedExternal - An array of external options.
 * @param {String} attributeName - The name of the attribute.
 *
 * The function first initializes the updatedStoragePolicy with the current storage policy.
 * Then it iterates over each option in the forcedExternal array. If the option's category
 * matches the cluster name and the option's label matches the attribute name, it updates
 * the updatedStoragePolicy to attributeAccessInterface and stops the iteration.
 * Finally, it returns the updated storage policy.
 */

async function computeStorageImport(
  db,
  clusterName,
  storagePolicy,
  forcedExternal,
  attributeName
) {
  let updatedStoragePolicy = storagePolicy
  forcedExternal.some((option) => {
    if (
      option.optionCategory == clusterName &&
      option.optionLabel == attributeName
    ) {
      updatedStoragePolicy = dbEnum.storagePolicy.attributeAccessInterface
      return true
    }
    return false
  })
  return updatedStoragePolicy
}

exports.getForcedExternalStorage = getForcedExternalStorage
exports.computeStorageImport = computeStorageImport
exports.computeStoragePolicyNewConfig = computeStoragePolicyNewConfig
exports.computeStorageOptionNewConfig = computeStorageOptionNewConfig
exports.computeStoragePolicyForGlobalAttributes =
  computeStoragePolicyForGlobalAttributes
