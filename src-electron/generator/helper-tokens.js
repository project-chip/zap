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

const templateUtil = require('./template-util')
const types = require('../util/types.js')
const string = require('../util/string')
const helperC = require('./helper-c.js')
const queryAttribute = require('../db/query-attribute.js')
const queryCluster = require('../db/query-cluster.js')

function token_cluster_create(config) {
  return {
    name: config.name,
    hexCode: config.hexCode,
    side: config.side,
    hasSingletons: false,
    singletons: {},
    hasNonSingletons: false,
    nonSingletons: {},
  }
}

/**
  This function builds creates a new context from the endpoint_config structure
  for use in the zap-tokens.h template. The endpoint_config context provides a
  list of endpoints, and endpointTypes, where each endpointType contains a list
  of clusters, and each cluster contains a list of attributes. However, the
  tokens template requires a list of attributes per endpoint, and per cluster,
  discriminating from singletons and non-singletons, so this function performs
  the required grouping.

  While each attribute contains an isSingleton attribute, the database schema
  allows for the same attribute to be returned both as singleton and non-singleton
  in different clusters, for different endpoints. In consequence, care must be
  taken to remove the singletons from the cluster and endpoint attribute lists.
  This is done in two steps, the first loop creates a global (context) list of
  singletons and non-singletons, and the second loop removes the singletons from
  the endpoint, and clusters.

  Clusters from different endpoints may have different attributes, therefore each
  endpoint keeps a separate list of clusters. Additionally, a context-level
  map of clusters is required in order to gather all attributes (singletons and
  non-singletons) from all endpoint clusters.
*/
async function tokens_context(options) {
  let context = {
    global: this.global,
    endpoints: {},
    clusters: {},
    singletons: {},
    nonSingletons: {},
    dictionary: {},
    maxSize: 1,
    token_id: 0xb000,
  }
  let promises = []
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  // Loop through all the endpoints
  this.endpoints.forEach((endpoint) => {
    // Endpoint
    let ep = {
      id: endpoint.endpointId,
      name: endpoint.name,
      clusters: {},
      dictionary: {},
      hasNonSingletons: false,
      nonSingletons: {},
    }
    context.endpoints[ep.id] = ep
    this.endpointTypes.forEach((ept) => {
      // Endpoint Type
      if (endpoint.endpointTypeRef == ept.id) {
        // WARNING: Two different type may have the same cluster with a different CONFIGURATION
        ept.clusters.forEach((cluster) => {
          let ctx_cl = null // global cluster
          let ep_cl = null // endpoint cluster
          // Global cluster
          if (cluster.code in context.clusters) {
            ctx_cl = context.clusters[cluster.code]
          } else {
            ctx_cl = token_cluster_create(cluster)
            context.clusters[cluster.code] = ctx_cl
          }
          // Endpoint cluster
          if (cluster.code in ep.clusters) {
            ep_cl = ep.clusters[cluster.code]
          } else {
            ep_cl = token_cluster_create(cluster)
            ep.clusters[cluster.code] = ep_cl
          }
          // Attributes
          cluster.attributes.forEach((attribute) => {
            if ('NVM' == attribute.storage) {
              let name = string.toSnakeCase(attribute.name)
              let key = `${cluster.code}:${attribute.code}`
              if (key in context.singletons) {
                // Registered singleton, ignore
              } else if (key in context.nonSingletons) {
                let attr = context.nonSingletons[key]
                // Registered non-singleton
                if (attribute.isSingleton) {
                  // Move to singletons
                  context.singletons[key] = attr
                  ctx_cl.singletons[key] = attr
                  ep_cl.singletons[key] = attr
                  delete context.nonSingletons[key]
                } else {
                  // Add the registered non-singleton to the endpoint and cluster
                  ep_cl.nonSingletons[key] = attr
                  ep.nonSingletons[key] = attr
                }
              } else {
                // New attribute (singleton or non-singleton)
                let attr = {
                  global: this.global,
                  key: key,
                  name: name,
                  define: attribute.define,
                  hexCode: attribute.hexCode,
                  type: attribute.type,
                  typeSize: -1,
                  tokenType: helperC.asUnderscoreLowercase(attribute.define),
                  defaultValue: attribute.defaultValue,
                  longDefault: null,
                  maxLength: attribute.maxLength,
                  serverSide: 'server' == attribute.side,
                  isSingleton: attribute.isSingleton,
                  cluster: ep_cl,
                }
                // Register the new attribute
                if (attr.isSingleton) {
                  context.singletons[key] = attr
                  ctx_cl.singletons[key] = attr
                  ep_cl.singletons[key] = attr
                  delete context.nonSingletons[key]
                } else {
                  context.nonSingletons[key] = attr
                  ep_cl.nonSingletons[key] = attr
                  ep.nonSingletons[key] = attr
                }
                // Create a promise to load the long defaults
                promises.push(
                  types
                    .typeSizeAttribute(
                      this.global.db,
                      packageIds,
                      attribute,
                      `ERROR: ${attribute.name}, invalid size, ${attribute.type}`,
                    )
                    .then((size) => {
                      attr.typeSize = size
                      if (size > 2) {
                        attr.longDefault = types.longTypeDefaultValue(
                          attr.typeSize,
                          attr.type,
                          attr.defaultValue,
                        )
                      }
                      if (size > context.maxSize) {
                        context.maxSize = size
                      }
                    }), // then size
                ) // push(promise(type))
              } // new attribute
            } // NVM
          }) // attributes
        }) // clusters
      } // ept == ep.ept
    }) // enpoint types
  }) // endpoints

  // Fix global attributes and clusters
  context.hasSingletons = Object.keys(context.singletons).length > 0
  context.hasNonSingletons = Object.keys(context.nonSingletons).length > 0
  context.hasAttributes = context.hasSingletons || context.hasNonSingletons
  Object.entries(context.clusters).forEach(([code, cl]) => {
    cl.hasSingletons = Object.entries(cl.singletons).length > 0
  })

  // Fix endpoints and endpoint clusters
  Object.entries(context.endpoints).forEach(([epCode, ep]) => {
    Object.entries(ep.clusters).forEach(([clCode, cl]) => {
      Object.entries(cl.nonSingletons).forEach(([attCode, attr]) => {
        if (attr.key in context.singletons) {
          // These non-singletons were overridden with singletons
          delete cl.nonSingletons[attr.key]
          delete ep.nonSingletons[attr.key]
        }
      }) // non-singletons
      cl.hasSingletons = Object.entries(cl.singletons).length > 0
      cl.hasNonSingletons = Object.entries(cl.nonSingletons).length > 0
      // if(cl.hasSingletons) {
      //   context.clusters[cl.code] = cl
      // }
    }) // cluster
    ep.hasNonSingletons = Object.entries(ep.nonSingletons).length > 0
  }) // endpoints

  return templateUtil.templatePromise(
    this.global,
    Promise.all(promises).then(() => options.fn(context)),
  )
}

/**
  The token template assigns an unique ID to each unique attribute. These IDs
  span all attributes from all clusters from all endpointTypes. This helper
  function allows the template to increment the token ID within the tokens context.
*/
function token_next(context) {
  context.token_id = context.token_id + 1
}

function debug_object(obj) {
  return JSON.stringify(obj)
}

/**
 * Util function that extracts all the token attribute information.
 * @param {*} context
 * @param {*} options
 * @returns Information on all token attributes in the configuration.
 */
async function token_attribute_util(context, options) {
  let packageIds = await templateUtil.ensureZclPackageIds(context)
  let res = await queryAttribute.selectAllUserTokenAttributes(
    context.global.db,
    context.global.sessionId,
    packageIds,
    options,
  )
  return res
}

/**
 * Get information about all the token attributes in the configuration or this
 * helper can be used within an endpoint block helper to fetch the
 * corresponding token attributes based on endpoint type given.
 * Available Options:
 * isSingleton: 0/1, option can be used to filter attributes based on singleton
 * or non-singleton(Available with endpointTypeRef only)
 * @param {*} endpointTypeRef
 * @param {*} options
 * @returns singleton and non-singleton token attributes along with their
 * endpoint information. Singleton attributes are only returned once whereas
 * non-singleton attributes are returned per endpoint. However if used within
 * an endpoint block helper it returns token_attributes for a given endpoint
 * type.
 */
async function token_attributes(endpointTypeRef, options) {
  if (typeof endpointTypeRef != 'object') {
    let packageIds = await templateUtil.ensureZclPackageIds(this)
    let endpointTokenAttributes =
      await queryAttribute.selectTokenAttributesForEndpoint(
        this.global.db,
        packageIds,
        endpointTypeRef,
        options,
      )
    return templateUtil.collectBlocks(endpointTokenAttributes, options, this)
  } else {
    // Since no enpointTypeRef was provided, options are entailed within
    // endpointTypeRef
    options = endpointTypeRef
    let allTokenAttributes = await token_attribute_util(this, options)
    return templateUtil.collectBlocks(allTokenAttributes, options, this)
  }
}

/**
 * This helper can return all token associated clusters across endpoints or
 * this helper can be used within an endpoint block helper to fetch the
 * corresponding token associated clusters.
 * Available Options:
 * isSingleton: 0/1, option can be used to filter clusters based on singleton
 * or non-singleton attributes.
 * @param {*} endpointTypeRef
 * @param {*} options
 * @returns Token associated clusters for a particular endpoint type or all
 * token associated clusters across endpoints.
 */
async function token_attribute_clusters(endpointTypeRef, options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this)
  if (typeof endpointTypeRef != 'object') {
    // Token attribute clusters based on given endpoint type reference
    let endpointTokenAttributeClusters =
      await queryCluster.selectTokenAttributeClustersForEndpoint(
        this.global.db,
        packageIds,
        endpointTypeRef,
        options,
      )
    return templateUtil.collectBlocks(
      endpointTokenAttributeClusters,
      options,
      this,
    )
  } else {
    // All token attribute clusters available in the configuration
    // Since no enpointTypeRef was provided, options are entailed within
    // endpointTypeRef
    options = endpointTypeRef
    let allTokenAttributeClusters =
      await queryCluster.selectAllUserClustersWithTokenAttributes(
        this.global.db,
        this.global.sessionId,
        packageIds,
        options,
      )
    return templateUtil.collectBlocks(allTokenAttributeClusters, options, this)
  }
}

/**
 * Get all endpoints which have token attributes in the configuration.
 * AvailableOptions:
 * - isSingleton: 0/1, option can be used to filter endpoints based on singleton
 * or non-singleton.
 * @param {*} options
 * @returns all endpoints with token attributes
 */
async function token_attribute_endpoints(options) {
  let isSingletonSpecific = 'isSingleton' in options.hash
  let allTokenAttributes = await token_attribute_util(this, options)
  if (isSingletonSpecific) {
    allTokenAttributes = allTokenAttributes.filter(
      (item) => item.isSingleton == options.hash.isSingleton,
    )
  }
  let uniqueEndpoints = [
    ...new Map(
      allTokenAttributes.map((item) => [
        item['endpointId'],
        { endpointId: item.endpointId, endpointTypeRef: item.endpointTypeRef },
      ]),
    ).values(),
  ]
  uniqueEndpoints.sort((a, b) => (a.endpointId > b.endpointId ? 1 : -1))
  return templateUtil.collectBlocks(uniqueEndpoints, options, this)
}

const dep = templateUtil.deprecatedHelper

// WARNING! WARNING! WARNING! WARNING! WARNING! WARNING!
//
// Note: these exports are public API. Templates that might have been created in the past and are
// available in the wild might depend on these names.
// If you rename the functions, you need to still maintain old exports list.

exports.tokens_context = dep(
  tokens_context,
  'tokens_context has been deprecated. Use token_attributes, token_attribute_clusters and token_attribute_endpoints instead.',
)
exports.token_next = dep(
  token_next,
  'token_next has been deprecated. Use token_attributes, token_attribute_clusters and token_attribute_endpoints instead.',
)
exports.debug_object = debug_object
exports.token_attributes = token_attributes
exports.token_attribute_clusters = token_attribute_clusters
exports.token_attribute_endpoints = token_attribute_endpoints
