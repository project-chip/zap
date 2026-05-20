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

/**
 * Returns the cluster-scoped 'Feature' bitmap, or null when the cluster does not
 * define one. Uses selectBitmapByNameAndClusterId for a targeted lookup, then
 * confirms the bitmap is associated with clusterId (the DB helper may return a
 * package-wide singleton when only one bitmap with that name exists).
 *
 * @param {*} db
 * @param {number[]} packageIds
 * @param {number} clusterId
 * @returns {Promise<object|null>}
 */
async function selectFeatureBitmapForCluster(db, packageIds, clusterId) {
  const candidate = await queryZcl.selectBitmapByNameAndClusterId(
    db,
    'Feature',
    clusterId,
    packageIds
  )
  if (!candidate) {
    return null
  }
  const clusterBitmaps = (
    await Promise.all(
      packageIds.map((pkgId) =>
        queryZcl.selectClusterBitmaps(db, pkgId, clusterId)
      )
    )
  ).flat()
  return clusterBitmaps.some((b) => b.id === candidate.id) ? candidate : null
}

/**
 * Block helper that renders its body when the cluster in the current context
 * defines a bitmap named 'Feature', and its inverse ({{else}}) when it does
 * not. Intended for choosing between `using FeatureBitmapType = Feature;` and
 * `using FeatureBitmapType = Clusters::StaticApplicationConfig::NoFeatureFlagsDefined;`
 * in static-cluster-config headers.
 *
 * Must be used inside a context that exposes a cluster `id` field, such as
 * `zcl_clusters`, `selectedServerCluster`, or any block helper whose context
 * object carries the ZCL cluster database ID as `id`.
 *
 * @param {*} options - Handlebars options object (fn / inverse blocks).
 * @returns {Promise<string>} Rendered `fn` block when the cluster has a
 *   bitmap named 'Feature'; rendered `inverse` block otherwise.
 *
 * @example
 * // Inside a selectedServerCluster or zcl_clusters block:
 * {{#if_cluster_has_feature_bitmap}}
 * using FeatureBitmapType = Feature;
 * {{else}}
 * using FeatureBitmapType = Clusters::StaticApplicationConfig::NoFeatureFlagsDefined;
 * {{/if_cluster_has_feature_bitmap}}
 */
async function if_cluster_has_feature_bitmap(options) {
  if (!('id' in this))
    throw new Error(
      'if_cluster_has_feature_bitmap requires a cluster id inside the context.'
    )
  const packageIds = await templateUtil.ensureZclPackageIds(this)
  const featureBitmap = await selectFeatureBitmapForCluster(
    this.global.db,
    packageIds,
    this.id
  )
  return featureBitmap ? options.fn(this) : options.inverse(this)
}

/**
 * Block helper that renders its body when the bitwise AND of `featureMapValue`
 * and `mask` is non-zero (i.e. the specific feature bit is set), and its
 * inverse ({{else}}) when the bit is clear.
 *
 * Both arguments are parsed as integers so decimal strings (e.g. `"3"`) and
 * hex strings (e.g. `"0x3"`) are accepted.
 *
 * Combine with `cluster_feature_items` when you want to iterate over feature
 * fields and selectively render only those that are enabled:
 * {{#cluster_feature_items clusterCode}}
 *   {{#if_feature_bit_enabled featureMapValue mask}}...{{/if_feature_bit_enabled}}
 * {{/cluster_feature_items}}
 *
 * @given {string|number} featureMapValue - The raw FeatureMap attribute default
 *   value for the current endpoint cluster (e.g. `"3"`).
 * @given {string|number} mask - The bitmask of the feature field being tested
 *   (e.g. `1`).
 * @param {*} options - Handlebars options object (fn / inverse blocks).
 * @returns {string} Rendered `fn` block when `(featureMapValue & mask) !== 0`;
 *   rendered `inverse` block otherwise.
 *
 * @example
 * // LevelControl, featureMap default = 3 (kOnOff | kLighting):
 * {{#if_feature_bit_enabled "3" "1"}}enabled{{else}}disabled{{/if_feature_bit_enabled}}
 * // → "enabled"
 * {{#if_feature_bit_enabled "3" "4"}}enabled{{else}}disabled{{/if_feature_bit_enabled}}
 * // → "disabled"  (kFrequency bit 0x4 is not set)
 */
function if_feature_bit_enabled(featureMapValue, mask, options) {
  const value = parseInt(featureMapValue)
  return !isNaN(value) && (value & parseInt(mask)) !== 0
    ? options.fn(this)
    : options.inverse(this)
}

/**
 * Block helper that iterates over all fields of the Feature bitmap for a
 * cluster identified by its ZCL cluster code, regardless of which bits are
 * currently enabled. Use `if_feature_bit_enabled` inside the body to act on
 * only those fields whose bit is set in a given FeatureMap value.
 *
 * This is the preferred way to access Feature bitmap fields inside
 * `user_cluster_attributes` because `zcl_bitmaps` requires a cluster database
 * `id` in context that is not available there. This helper performs the cluster
 * lookup by ZCL code (not name) for robustness.
 *
 * Each iteration context exposes:
 *   - `name`  {string}  field name as stored in the ZCL database (e.g. `"kOnOff"`)
 *   - `label` {string}  same as `name`
 *   - `mask`  {number}  the field's bitmask (e.g. `1`)
 *
 * If the cluster has no bitmap named 'Feature' the body is never rendered.
 *
 * @given {string|number} clusterCode - The ZCL cluster code (e.g. `8` for
 *   LevelControl). Inside `user_cluster_attributes` pass `../code` to
 *   reference the enclosing `user_clusters` cluster code.
 * @param {*} options - Handlebars options object.
 * @returns {Promise<string>} Concatenated rendered blocks for each feature field.
 *
 * @example
 * // List only enabled feature bits for LevelControl (featureMap default = 3):
 * {{#if (is_str_equal name "FeatureMap")}}
 * {{#cluster_feature_items ../code}}
 * {{#if_feature_bit_enabled ../defaultValue mask}}
 *     FeatureBitmapType::k{{asUpperCamelCase label preserveAcronyms=true}}, // feature bit {{as_hex mask}}
 * {{/if_feature_bit_enabled}}
 * {{/cluster_feature_items}}
 * {{/if}}
 * // Emits: FeatureBitmapType::kOnOff,     // feature bit 0x1
 * //        FeatureBitmapType::kLighting,   // feature bit 0x2
 * // Skips kFrequency (mask 0x4 not set in value 3)
 *
 * @example
 * // List ALL defined feature bits regardless of enabled state:
 * {{#cluster_feature_items clusterCode}}
 *     {{label}}: {{as_hex mask}}
 * {{/cluster_feature_items}}
 */
async function cluster_feature_items(clusterCode, options) {
  const packageIds = await templateUtil.ensureZclPackageIds(this)

  // Resolve the internal cluster DB ID from the ZCL cluster code.
  let clusterId = null
  for (const pkgId of packageIds) {
    const cluster = await queryZcl.selectClusterByCode(
      this.global.db,
      pkgId,
      parseInt(clusterCode)
    )
    if (cluster) {
      clusterId = cluster.id
      break
    }
  }
  if (clusterId == null) {
    return ''
  }

  const featureBitmap = await selectFeatureBitmapForCluster(
    this.global.db,
    packageIds,
    clusterId
  )
  if (!featureBitmap) {
    return ''
  }

  const allFields = await queryZcl.selectAllBitmapFieldsById(
    this.global.db,
    featureBitmap.id
  )
  const p = templateUtil.collectBlocks(allFields, options, this)
  return templateUtil.templatePromise(this.global, p)
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
exports.if_cluster_has_feature_bitmap = if_cluster_has_feature_bitmap
exports.if_feature_bit_enabled = if_feature_bit_enabled
exports.cluster_feature_items = cluster_feature_items
