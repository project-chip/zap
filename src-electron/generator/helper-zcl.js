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

const queryZcl = require('../db/query-zcl.js')
const queryPackage = require('../db/query-package.js')
const dbEnum = require('../db/db-enum.js')

function ensurePackageId(context) {
  if ('packageId' in context) {
    return Promise.resolve(context.packageId)
  } else {
    return queryPackage
      .getSessionPackagesByType(
        context.db,
        context.sessionId,
        dbEnum.packageType.zclProperties
      )
      .then((pkgs) => {
        if (pkgs.length == 0) {
          return null
        } else {
          context.packageId = pkgs[0].id
          return pkgs[0].id
        }
      })
  }
}

function zcl_enums(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllEnums(this.db, packageId))
    .then((ens) => {
      var promises = []
      ens.forEach((element) => {
        var block = options.fn(element)
        promises.push(block)
      })
      return Promise.all(promises)
    })
    .then((blocks) => {
      var ret = ''
      blocks.forEach((b) => {
        ret = ret.concat(b)
      })
      return ret
    })
}

function zcl_structs(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllStructs(this.db, packageId))
    .then((st) => {
      var promises = []
      st.forEach((element) => {
        var block = options.fn(element)
        promises.push(block)
      })
      return Promise.all(promises)
    })
    .then((blocks) => {
      var ret = ''
      blocks.forEach((b) => {
        ret = ret.concat(b)
      })
      return ret
    })
}

function zcl_clusters(options) {
  return ensurePackageId(this)
    .then((packageId) => queryZcl.selectAllClusters(this.db, packageId))
    .then((cl) => {
      var promises = []
      cl.forEach((element) => {
        var block = options.fn(element)
        promises.push(block)
      })
      return Promise.all(promises)
    })
    .then((blocks) => {
      var ret = ''
      blocks.forEach((b) => {
        ret = ret.concat(b)
      })
      return ret
    })
}

exports.zcl_enums = zcl_enums
exports.zcl_structs = zcl_structs
exports.zcl_clusters = zcl_clusters
