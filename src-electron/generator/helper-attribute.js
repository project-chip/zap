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
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: Attribute helpers
 */

const queryAttribute = require('../db/query-attribute')
const queryZcl = require('../db/query-zcl')
const templateUtil = require('./template-util')
const envConfig = require('../util/env')
const dbEnum = require('../../src-shared/db-enum')

/**
 * Counts the number of mandatory attributes (not optional, non-global) for the current cluster context.
 * Usage: {{count_mandatory_matter_attributes side="server"}}
 * If side is not provided or invalid, counts all attributes.
 */
async function count_mandatory_matter_attributes(options) {
  if (!('id' in this))
    throw new Error(
      'count_mandatory_matter_attributes requires a cluster id inside the context.'
    )
  const packageIds = await templateUtil.ensureZclPackageIds(this)
  let side = options?.hash?.side
  if (typeof side === 'string') side = side.toLowerCase()
  let attributes
  if (side === dbEnum.side.server || side === dbEnum.side.client) {
    attributes =
      await queryZcl.selectAttributesByClusterIdAndSideIncludingGlobal(
        this.global.db,
        this.id,
        packageIds,
        side
      )
  } else {
    // Get all attributes for this cluster (both sides)
    attributes = await queryZcl.selectAttributesByClusterIdIncludingGlobal(
      this.global.db,
      this.id,
      packageIds
    )
  }
  // Count mandatory attributes (not optional, non-global)
  return attributes.filter((a) => a.clusterRef && !a.isOptional).length
}

/**
 * Get feature bits from the given context.
 * @param {*} options
 * @returns feature bits
 */
async function featureBits(options) {
  if ('featureBits' in this) {
    let p = templateUtil.collectBlocks(this.featureBits, options, this)
    return templateUtil.templatePromise(this.global, p)
  } else {
    return ''
  }
}

/**
 * Valid within a cluster context, requires code.
 *
 * @returns Produces attribute defaults.
 */
async function attributeDefault(options) {
  if (!('id' in this)) throw new Error('Requires an id inside the context.')
  // If used at the toplevel, 'this' is the toplevel context object.
  // when used at the cluster level, 'this' is a cluster
  let code = parseInt(options.hash.code)

  let packageIds = await templateUtil.ensureZclPackageIds(this)
  let attr = await queryAttribute.selectAttributeByCode(
    this.global.db,
    packageIds,
    this.id,
    code,
    this.mfgCode
  )
  if (attr == null) {
    // Check if it's global attribute
    attr = await queryAttribute.selectAttributeByCode(
      this.global.db,
      packageIds,
      null,
      code,
      this.mfgCode
    )
  }
  let defs = await queryAttribute.selectGlobalAttributeDefaults(
    this.global.db,
    this.id,
    attr.id
  )
  let p = templateUtil.collectBlocks([defs], options, this)
  return templateUtil.templatePromise(this.global, p)
}

/**
 * Given an attribute Id determine its corresponding atomic identifier from the
 * atomic table.
 * @param {*} attributeId
 */
async function as_underlying_atomic_identifier_for_attribute_id(attributeId) {
  let attributeDetails =
    await queryZcl.selectAttributeByAttributeIdAndClusterRef(
      this.global.db,
      attributeId,
      null
    )
  let atomicInfo = attributeDetails
    ? await queryZcl.selectAtomicType(
        this.global.db,
        [attributeDetails.packageRef],
        attributeDetails.type
      )
    : null
  // If attribute type directly points to the atomic type then return that
  if (atomicInfo) {
    // All types in the number and string table should be found here.
    return atomicInfo.atomicId
  } else {
    // If attribute type does not point to atomic type
    let dataType = await queryZcl.selectDataTypeByNameAndClusterId(
      this.global.db,
      attributeDetails.type,
      attributeDetails.clusterRef,
      [attributeDetails.packageRef]
    )
    if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.enum
    ) {
      let enumInfo = await queryZcl.selectEnumByNameAndClusterId(
        this.global.db,
        attributeDetails.type,
        attributeDetails.clusterRef,
        [attributeDetails.packageRef]
      )
      atomicInfo = await queryZcl.selectAtomicType(
        this.global.db,
        [attributeDetails.packageRef],
        dbEnum.zclType.enum + enumInfo.size * 8
      )
      return atomicInfo ? atomicInfo.atomicId : null
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.bitmap
    ) {
      let bitmapInfo = await queryZcl.selectBitmapByNameAndClusterId(
        this.global.db,
        attributeDetails.type,
        attributeDetails.clusterRef,
        [attributeDetails.packageRef]
      )
      atomicInfo = await queryZcl.selectAtomicType(
        this.global.db,
        [attributeDetails.packageRef],
        dbEnum.zclType.bitmap + bitmapInfo.size * 8
      )
      return atomicInfo ? atomicInfo.atomicId : null
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.struct
    ) {
      atomicInfo = await queryZcl.selectAtomicType(
        this.global.db,
        [attributeDetails.packageRef],
        dbEnum.zclType.struct
      )
      return atomicInfo ? atomicInfo.atomicId : null
    } else if (
      dataType &&
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.array
    ) {
      atomicInfo = await queryZcl.selectAtomicType(
        this.global.db,
        [attributeDetails.packageRef],
        dbEnum.zclType.array
      )
      return atomicInfo ? atomicInfo.atomicId : null
    } else {
      envConfig.logError(
        `In as_underlying_atomic_identifier_for_attribute_id, could not determine the data type. Type name: ${attributeDetails?.type || 'unknown'}, resolved dataType: ${JSON.stringify(dataType)}`
      )
      return null
    }
  }
}

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.

exports.global_attribute_default = attributeDefault
exports.feature_bits = featureBits
exports.as_underlying_atomic_identifier_for_attribute_id =
  as_underlying_atomic_identifier_for_attribute_id
exports.count_mandatory_matter_attributes = count_mandatory_matter_attributes
