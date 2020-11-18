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

const queryPackage = require('../db/query-package.js')
const dbEnum = require('../../src-shared/db-enum.js')
const templateUtil = require('./template-util.js')

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
  var prop = options.hash.property
  if (prop == null) {
    return ''
  } else {
    return templateUtil
      .ensureTemplatePackageId(this)
      .then((packageId) =>
        queryPackage.selectPackageExtension(
          this.global.db,
          packageId,
          dbEnum.packageExtensionEntity.cluster
        )
      )
      .then((extensions) => {
        var f = extensions.filter((x) => x.property == prop)
        if (f.length == 0) {
          return ''
        } else {
          var val = null
          f[0].defaults.forEach((d) => {
            if (d.entityCode == this.code) val = d.value
          })
          if (val == null) val = f[0].globalDefault
          if (val == null) val = ''
          return val
        }
      })
  }
}

function command_extension(options) {}
function attribute_extension(options) {}
function device_type_extension(options) {}

exports.cluster_extension = cluster_extension
exports.command_extension = command_extension
exports.attribute_extension = attribute_extension
exports.device_type_extension = device_type_extension
