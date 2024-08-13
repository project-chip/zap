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

/**
 * Fetches forced external storage settings based on the given package ID.
 * Utilizes the attribute access interface to query storage policies
 * associated with the specified package ID.
 *
 * @param {Object} db - Database connection object.
 * @param {Number} packageId - The ID of the package to query.
 * @returns {Promise<Array>} A promise that resolves to an array of forced external storage settings.
 */

async function getForcedExternalStorage(db, packageId) {
  try {
    let forcedExternal = await queryPackage.getAttributeAccessInterface(
      db,
      dbEnum.storagePolicy.attributeAccessInterface,
      packageId
    )
    return forcedExternal
  } catch (error) {
    console.error('Error fetching forced external storage:', error)
    throw error // Optionally re-throw the error for further handling
  }
}

/**
 * This function takes a clusterId (the database ID, not the specification-defined ID), an array of attributes (associated with the database defined clusterID),
 * and a packageId to identify the specific package the attributes belong to. It changes the global attributes (attributes with specification defined clusterId = null) to represent storage policy
 * based on the cluster/attribute pair in zcl.json.
 *
 * Although the specification defined clusterID of the attribute is null indicating it is a global attribute, we know what the database defined clusterID is by what is passed in as a parameter.
 *
 * That database defined clusterID is used to query the name of the cluster which is in turn used to compute the storage policy for that cluster/attribute pair based on the packageId.
 *
 * @export
 * @param {*} db
 * @param {*} clusterId (database defined) the clusterId representing a cluster from the database being used in the application
 * @param {*} attributes an array of objects representing the attributes associated with the cluster
 * @param {*} packageId the ID of the package to which the attributes belong, used to determine storage policies specific to the package
 * @returns an array of objects representing attributes in the database
 */

async function computeStoragePolicyForGlobalAttributes(
  db,
  clusterId,
  attributes,
  packageId
) {
  try {
    let forcedExternal
    let clusterName = await queryCluster.selectClusterName(db, clusterId)
    return Promise.all(
      attributes.map(async (attribute) => {
        if (attribute.clusterId == null) {
          forcedExternal = await getForcedExternalStorage(db, packageId)
          forcedExternal.some((option) => {
            if (
              option.optionCategory == clusterName &&
              option.optionLabel == attribute.name
            ) {
              attribute.storagePolicy =
                dbEnum.storagePolicy.attributeAccessInterface
              return true
            }
          })
        }
        return attribute
      })
    )
  } catch (error) {
    console.error(
      'Failed to compute storage policy for global attributes:',
      error
    )
    throw error // Rethrow the error if you want to handle it further up the call stack
  }
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
  try {
    let storageOption
    if (storagePolicy == dbEnum.storagePolicy.attributeAccessInterface) {
      storageOption = dbEnum.storageOption.external
    } else if (storagePolicy == dbEnum.storagePolicy.any) {
      storageOption = dbEnum.storageOption.ram
    } else {
      throw new Error('Invalid storage policy')
    }
    return storageOption
  } catch (error) {
    console.error('Error computing new storage option config:', error)
    throw error // Rethrow the error for further handling if necessary
  }
}
/**
 * This asynchronous function computes and returns the new configuration for a storage policy.
 *
 * @param {Object} db - The database instance.
 * @param {Number} clusterRef - The reference to the cluster.
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
  try {
    let clusterName = await queryCluster.selectClusterName(db, clusterRef)
    forcedExternal.some((option) => {
      if (
        option.optionCategory == clusterName &&
        option.optionLabel == attributeName
      ) {
        storagePolicy = dbEnum.storagePolicy.attributeAccessInterface
        return true
      }
    })
    return storagePolicy
  } catch (error) {
    console.error('Error computing storage policy new config:', error)
    throw error // Rethrow the error for further handling if necessary
  }
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
  try {
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
  } catch (error) {
    console.error('Error computing storage import:', error)
    throw error // Rethrow the error for further handling if necessary
  }
}

exports.getForcedExternalStorage = getForcedExternalStorage
exports.computeStorageImport = computeStorageImport
exports.computeStoragePolicyNewConfig = computeStoragePolicyNewConfig
exports.computeStorageOptionNewConfig = computeStorageOptionNewConfig
exports.computeStoragePolicyForGlobalAttributes =
  computeStoragePolicyForGlobalAttributes
