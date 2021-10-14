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

const queryAccess = require('../db/query-access')
const queryPackage = require('../db/query-package')
const templateUtil = require('./template-util')
const bin = require('../util/bin')
const env = require('../util/env')
const types = require('../util/types')
const string = require('../util/string')
const _ = require('lodash')
const dbEnum = require('../../src-shared/db-enum')

/**
 * This module contains the API for templating. For more detailed instructions, read {@tutorial template-tutorial}
 *
 * @module Templating API: Access helpers
 */

async function access(options) {
  let entityType = null
  let includeDefault = true

  if ('entity' in options.hash) {
    entityType = options.hash.entity
  } else {
    entityType = this.entityType
  }

  if ('includeDefault' in options.hash) {
    includeDefault = options.hash.includeDefault == 'true'
  }

  if (entityType == null) {
    throw new Error(
      'Access helper requires entityType, either from context, or from the entity="<entityType>" option.'
    )
  }

  let accessList

  switch (entityType) {
    case 'attribute':
      accessList = await queryAccess.selectAttributeAccess(
        this.global.db,
        this.id
      )
      break
    case 'command':
      accessList = await queryAccess.selectCommandAccess(
        this.global.db,
        this.id
      )
      break
    case 'event':
      accessList = await queryAccess.selectEventAccess(this.global.db, this.id)
      break
    default:
      throw new Error(
        `Entity type ${entityType} not supported. Requires: attribute/command/event.`
      )
  }

  if (includeDefault) {
    let packageId = await templateUtil.ensureZclPackageId(this)
    let defaultAccess = await queryAccess.selectDefaultAccess(
      this.global.db,
      packageId,
      entityType
    )
    accessList.push(...defaultAccess)
  }

  let p = templateUtil.collectBlocks(accessList, options, this)
  return templateUtil.templatePromise(this.global, p)
}

exports.access = access
