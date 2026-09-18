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

/**
 * This module contains Matter specific APIs.
 *
 * @module JS API: Matter specific APIs.
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
 * Returns both the attributes that are forced to external storage and the
 * subset of those whose default value stays under ZAP control. The optionCode
 * of each returned entry says which one it is:
 * - attributeAccessInterface: forced to External storage
 * - keepDefault: the default value is not cleared
 *
 * @param {Object} db - Database connection object.
 * @param {Number} packageIds - The ID of the packages to query.
 * @returns {Promise<Array>} A promise that resolves to an array of forced external storage settings.
 */
async function getForcedExternalStorage(db, packageIds) {
  try {
    // Ensure packageIds is an array
    const packageIdsArray = Array.isArray(packageIds)
      ? packageIds
      : [packageIds]

    let forcedExternal = await queryPackage.getAttributeAccessInterface(
      db,
      [dbEnum.storagePolicy.attributeAccessInterface, dbEnum.keepDefaultOption],
      packageIdsArray
    )
    return forcedExternal
  } catch (error) {
    console.error('Error fetching forced external storage:', error)
    throw error // Optionally re-throw the error for further handling
  }
}

/**
 * Tells whether a cluster/attribute pair from getForcedExternalStorage is
 * forced to external storage.
 *
 * @param {Array} forcedExternal - An array of external options.
 * @param {String} clusterName - The name of the cluster.
 * @param {String} attributeName - The name of the attribute.
 * @returns {boolean}
 */
function isForcedExternal(forcedExternal, clusterName, attributeName) {
  return forcedExternal.some(
    (option) =>
      option.optionCategory == clusterName &&
      option.optionLabel == attributeName &&
      option.optionCode == dbEnum.storagePolicy.attributeAccessInterface
  )
}

/**
 * Tells whether a cluster/attribute pair from getForcedExternalStorage keeps
 * its default value. The attribute is still External; only the default is left
 * alone.
 *
 * @param {Array} forcedExternal - An array of external options.
 * @param {String} clusterName - The name of the cluster.
 * @param {String} attributeName - The name of the attribute.
 * @returns {boolean}
 */
function keepsDefault(forcedExternal, clusterName, attributeName) {
  return forcedExternal.some(
    (option) =>
      option.optionCategory == clusterName &&
      option.optionLabel == attributeName &&
      option.optionCode == dbEnum.keepDefaultOption
  )
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
  packageIds
) {
  try {
    let forcedExternal
    let clusterName = await queryCluster.selectClusterName(db, clusterId)
    return Promise.all(
      attributes.map(async (attribute) => {
        if (attribute.clusterId == null) {
          forcedExternal = await getForcedExternalStorage(db, packageIds)
          if (isForcedExternal(forcedExternal, clusterName, attribute.name)) {
            attribute.storagePolicy =
              dbEnum.storagePolicy.attributeAccessInterface
          }
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
 * Resolves the storage option a configuration may use.
 *
 * attributeAccessInterface always wins and forces External:
 * list- and struct-typed attributes, and explicit AAI annotations.
 *
 * Otherwise a spec persistence of nonVolatile defaults to NVM and rejects
 * RAM. External remains allowed for those attributes.
 *
 * @param {String} storagePolicy
 * @param {String} [persistence]
 * @param {String} [requested] currently selected or imported storage option
 * @returns {String} RAM, NVM, or External
 */
function resolveStorageOption(storagePolicy, persistence, requested) {
  if (storagePolicy == dbEnum.storagePolicy.attributeAccessInterface) {
    return dbEnum.storageOption.external
  }
  if (storagePolicy != null && storagePolicy != dbEnum.storagePolicy.any) {
    throw new Error('Invalid storage policy')
  }
  if (persistence == dbEnum.persistence.nonVolatile) {
    if (
      requested == dbEnum.storageOption.external ||
      requested == dbEnum.storageOption.nvm
    ) {
      return requested
    }
    return dbEnum.storageOption.nvm
  }
  return requested || dbEnum.storageOption.ram
}

/**
 * This asynchronous function computes and returns the new configuration for a storage option.
 *
 * @param {String} storagePolicy - The current storage policy.
 * @param {String} [persistence] - Spec persistence quality, if any.
 *
 * The function first initializes the storageOption. Then it checks the storagePolicy:
 * - If it's 'attributeAccessInterface', it sets the storageOption to 'external'.
 * - If it's 'any' and persistence is nonVolatile, it sets the storageOption to 'nvm'.
 * - If it's 'any', it sets the storageOption to 'ram'.
 * If the storagePolicy is neither of these, it throws an error 'check storage policy'.
 * Finally, it returns the updated storage option.
 */
async function computeStorageOptionNewConfig(storagePolicy, persistence) {
  try {
    return resolveStorageOption(storagePolicy, persistence)
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
    if (isForcedExternal(forcedExternal, clusterName, attributeName)) {
      storagePolicy = dbEnum.storagePolicy.attributeAccessInterface
    }
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
    if (isForcedExternal(forcedExternal, clusterName, attributeName)) {
      updatedStoragePolicy = dbEnum.storagePolicy.attributeAccessInterface
    }
    return updatedStoragePolicy
  } catch (error) {
    console.error('Error computing storage import:', error)
    throw error // Rethrow the error for further handling if necessary
  }
}

exports.getForcedExternalStorage = getForcedExternalStorage
exports.isForcedExternal = isForcedExternal
exports.keepsDefault = keepsDefault
exports.resolveStorageOption = resolveStorageOption
exports.computeStorageImport = computeStorageImport
exports.computeStoragePolicyNewConfig = computeStoragePolicyNewConfig
exports.computeStorageOptionNewConfig = computeStorageOptionNewConfig
exports.computeStoragePolicyForGlobalAttributes =
  computeStoragePolicyForGlobalAttributes
