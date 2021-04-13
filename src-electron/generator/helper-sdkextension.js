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

const dbEnum = require('../../src-shared/db-enum.js')
const templateUtil = require('./template-util.js')
const util = require('../util/util.js')

/**
 * This module contains the API for accessing SDK extensions.
 *
 * @module Templating API: C formatting helpers
 */

/**
 * When inside a context that contains 'code', this
 * helper will output the value of the cluster extension
 * specified by property="propName" attribute.
 *
 * @param {*} options
 * @returns Value of the cluster extension property.
 */
function cluster_extension(options) {
  let prop = options.hash.property
  if (prop == null) {
    return ''
  } else {
    return templateUtil
      .ensureTemplatePackageId(this)
      .then((packageId) =>
        templateUtil.ensureZclClusterSdkExtensions(this, packageId)
      )
      .then((extensions) =>
        util.getClusterExtensionDefault(extensions, prop, this.code)
      )
  }
}

/**
 * When inside a context that contains 'code', this
 * helper will output the value of the cluster extension
 * specified by property="propName" attribute.
 *
 * @param {*} options
 * @returns Value of the cluster extension property.
 */
function device_type_extension(options) {
  let prop = options.hash.property
  if (prop == null) {
    return ''
  } else {
    return templateUtil
      .ensureTemplatePackageId(this)
      .then((packageId) =>
        templateUtil.ensureZclDeviceTypeSdkExtensions(this, packageId)
      )
      .then((extensions) => {
        let f = extensions.filter((x) => x.property == prop)
        if (f.length == 0) {
          return ''
        } else {
          let val = null
          f[0].defaults.forEach((d) => {
            if (d.entityCode == this.code) val = d.value
            if (d.entityCode == this.label) val = d.value
          })
          if (val == null) val = f[0].globalDefault
          if (val == null) val = ''
          return val
        }
      })
  }
}

function subentityExtension(context, prop, entityType) {
  if (prop == null) {
    return ''
  } else {
    return templateUtil
      .ensureTemplatePackageId(context)
      .then((packageId) => {
        if (entityType == dbEnum.packageExtensionEntity.attribute) {
          return templateUtil.ensureZclAttributeSdkExtensions(
            context,
            packageId
          )
        } else if (entityType == dbEnum.packageExtensionEntity.command) {
          return templateUtil.ensureZclCommandSdkExtensions(context, packageId)
        } else {
          throw `Invalid subentity: ${entityType}`
        }
      })
      .then((extensions) => {
        let f = extensions.filter((x) => x.property == prop)
        if (f.length == 0) {
          return ''
        } else {
          let val = null
          f[0].defaults.forEach((d) => {
            if (
              d.entityCode == context.code &&
              d.parentCode == context.clusterCode
            ) {
              val = d.value
            }
          })
          if (val == null) val = f[0].globalDefault
          if (val == null) val = ''
          return val
        }
      })
  }
}

/**
 * When inside a context that contains 'code' and parent 'code', this
 * helper will output the value of the command extension
 * specified by property="propName" attribute.
 *
 * @param {*} options
 * @returns Value of the command extension property.
 */
function command_extension(options) {
  let prop = options.hash.property
  return subentityExtension(this, prop, dbEnum.packageExtensionEntity.command)
}

function if_extension_true(options) {
  let prop = options.hash.property
  if (prop == '') return ''

  return subentityExtension(
    this,
    prop,
    dbEnum.packageExtensionEntity.command
  ).then((val) => {
    if (val == true || val == 1) {
      return options.fn(this)
    } else {
      return ''
    }
  })
}

/**
 * When inside a context that contains 'code' and parent 'code', this
 * helper will output the value of the attribute extension
 * specified by property="propName" attribute.
 *
 * @param {*} options
 * @returns Value of the attribute extension property.
 */
function attribute_extension(options) {
  let prop = options.hash.property
  return subentityExtension(this, prop, dbEnum.packageExtensionEntity.attribute)
}

exports.cluster_extension = cluster_extension
exports.command_extension = command_extension
exports.attribute_extension = attribute_extension
exports.device_type_extension = device_type_extension
exports.if_extension_true = if_extension_true
