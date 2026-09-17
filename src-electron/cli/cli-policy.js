/**
 *
 *    Copyright (c) 2024 Silicon Labs
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
 * The parts of an attribute's configuration that the data model decides rather
 * than the user.
 *
 * The user interface expresses this by greying out a control: the storage of an
 * attribute served through the Attribute Access Interface is fixed at External,
 * and the reporting switch of an attribute whose reporting the specification
 * makes mandatory or forbids cannot be moved. A command line has no grey, so it
 * says no instead, which is better than the alternative. ZAP re-applies these
 * policies whenever a configuration is read back in, so a write that disagrees
 * with them does not survive the round trip: without these checks the command
 * line reports a change that the next read silently undoes.
 *
 * @module CLI API: data model policy
 */

const dbEnum = require('../../src-shared/db-enum.js')
const matterSdk = require('../sdk/matter.js')
const resolver = require('./cli-resolver.js')
const cliError = require('./cli-error.js')

const CliError = cliError.CliError

/**
 * The (cluster, attribute) pairs the loaded data model serves through the
 * Attribute Access Interface, as the user interface asks for them over
 * /zcl/forcedExternal.
 *
 * The answer covers the whole configuration and is wanted once per attribute,
 * so it is kept for the lifetime of the session.
 *
 * @param {*} ctx
 * @returns {Promise<Array>} package options describing the pairs
 */
async function forcedExternalPairs(ctx) {
  if (ctx.forcedExternal === undefined) {
    ctx.forcedExternal = await matterSdk.getForcedExternalStorage(
      ctx.db,
      await resolver.zclPackageIds(ctx)
    )
  }
  return ctx.forcedExternal
}

/**
 * What the data model fixes about one attribute of one cluster.
 *
 * Storage is decided by the attribute's own storage policy together with the
 * forced-external pairs, which is why the cluster matters: ClusterRevision is
 * ordinary on most clusters and served through the Attribute Access Interface
 * on Access Control.
 *
 * @param {*} ctx
 * @param {*} cluster
 * @param {*} attribute
 * @returns {Promise<*>} `{ storage, reporting }`, each null where the choice is free
 */
async function attributePolicy(ctx, cluster, attribute) {
  let storagePolicy = await matterSdk.computeStoragePolicyNewConfig(
    ctx.db,
    cluster.id,
    attribute.storagePolicy,
    await forcedExternalPairs(ctx),
    attribute.name
  )

  let storage = null
  if (storagePolicy === dbEnum.storagePolicy.attributeAccessInterface) {
    storage = await matterSdk.computeStorageOptionNewConfig(storagePolicy)
  }

  let reporting = null
  if (attribute.reportingPolicy === dbEnum.reportingPolicy.mandatory) {
    reporting = true
  } else if (attribute.reportingPolicy === dbEnum.reportingPolicy.prohibited) {
    reporting = false
  }

  return { storage: storage, reporting: reporting }
}

/**
 * Names the fields of an attribute that are not the user's to set, for the
 * listings. Empty when everything about it is free.
 *
 * @param {*} policy Result of `attributePolicy`.
 * @returns {string} 'storage', 'reporting', 'storage+reporting' or ''
 */
function fixedFields(policy) {
  let fields = []
  if (policy.storage != null) fields.push('storage')
  if (policy.reporting != null) fields.push('reporting')
  return fields.join('+')
}

/**
 * Names the attribute a message is about.
 *
 * @param {*} where `{ attribute, cluster, side, endpoint }`
 * @returns {string} the subject of the sentence
 */
function describe(where) {
  return (
    `Attribute ${where.attribute.name} on ` +
    `${where.cluster.name}/${where.side} of endpoint ${where.endpoint}`
  )
}

/**
 * Refuses an attribute change that contradicts the data model.
 *
 * @param {*} policy Result of `attributePolicy`.
 * @param {*} requested `{ storage, reporting }` as asked for, undefined where not asked for.
 * @param {*} where `{ attribute, cluster, side, endpoint }` for the message.
 * @returns {undefined} nothing, throws when the change is not the user's to make
 */
function requirePolicyRespected(policy, requested, where) {
  let subject = describe(where)

  if (
    requested.storage !== undefined &&
    policy.storage != null &&
    requested.storage !== policy.storage
  ) {
    throw new CliError(
      `${subject} is served through the Attribute Access Interface`,
      [
        `Its storage is fixed at ${policy.storage}, which is why the user interface`,
        `greys the choice out: the value lives in application code rather than in`,
        `an attribute store. Drop --storage, or pass --storage ${policy.storage}.`
      ]
    )
  }

  if (
    requested.reporting !== undefined &&
    policy.reporting != null &&
    requested.reporting !== policy.reporting
  ) {
    throw new CliError(
      `${subject} has ${
        policy.reporting ? 'mandatory' : 'prohibited'
      } reporting`,
      [
        `The specification ${
          policy.reporting ? 'requires' : 'does not allow'
        } reporting for it, so the user interface`,
        `greys the switch out. Drop --reporting, or pass --reporting ${policy.reporting}.`
      ]
    )
  }
}

/**
 * Refuses a default value where there is nowhere to keep one.
 *
 * External attributes are read and written by application code, so the user
 * interface blanks and greys their default. For the ones the data model puts
 * there the default is discarded outright when the configuration is read back.
 *
 * Clearing the default is still allowed, on the same reasoning as asking for
 * the storage that is already fixed: a caller restating what is already so is
 * not asking for anything.
 *
 * @param {*} requested The default value asked for, null to clear it.
 * @param {string} storage The storage that applies once the change is made.
 * @param {*} policy Result of `attributePolicy`.
 * @param {*} where `{ attribute, cluster, side, endpoint }` for the message.
 * @returns {undefined} nothing, throws when a default cannot be kept
 */
function requireDefaultCanBeKept(requested, storage, policy, where) {
  if (storage !== dbEnum.storageOption.external) return
  if (requested === null || `${requested}`.toLowerCase() === 'null') return
  let subject = describe(where)
  if (policy.storage === dbEnum.storageOption.external) {
    throw new CliError(`${subject} has no default value to set`, [
      `It is served through the Attribute Access Interface, so its value comes`,
      `from application code and the configuration keeps no default for it.`
    ])
  }
  throw new CliError(`${subject} is stored externally`, [
    `An external attribute is read and written by application code, so the`,
    `configuration keeps no default for it. Pass --storage RAM or --storage NVM`,
    `alongside --default to hold a value here.`
  ])
}

/**
 * Refuses to configure an attribute that is not part of the configuration.
 *
 * Storage, default value, singleton and bounded describe how an attribute is
 * kept, and an attribute that is not included is not kept at all, which is why
 * the user interface greys all four until the attribute is switched on.
 *
 * @param {boolean} included Whether the attribute is included once the change is made.
 * @param {string[]} fields The fields being set.
 * @param {*} where `{ attribute, cluster, side, endpoint }` for the message.
 * @returns {undefined} nothing, throws when the attribute is not included
 */
function requireIncluded(included, fields, where) {
  if (included) return
  throw new CliError(
    `Attribute ${where.attribute.name} is not enabled on ${where.cluster.name}/${where.side} of endpoint ${where.endpoint}`,
    [
      `${fields.join(', ')} ${fields.length > 1 ? 'describe' : 'describes'} how the attribute is kept, and`,
      `an attribute that is not included is not kept at all. Include it first, or`,
      `add --enabled to the same change.`
    ]
  )
}

/**
 * Refuses a feature toggle that the specification leaves no room for.
 *
 * @param {*} feature
 * @param {*} cluster
 * @param {number} endpoint Endpoint identifier.
 * @returns {undefined} nothing, throws for disallowed and deprecated features
 */
function requireToggleableFeature(feature, cluster, endpoint) {
  let reason = null
  if (feature.conformance === dbEnum.conformanceTag.disallowed) {
    reason = 'disallowed'
  } else if (feature.conformance === dbEnum.conformanceTag.deprecated) {
    reason = 'deprecated'
  }
  if (reason == null) return
  throw new CliError(
    `Feature ${feature.name} (${feature.code}) is ${reason} on ${cluster.name} of endpoint ${endpoint}`,
    [
      `Its conformance is ${feature.conformance}${
        feature.deviceTypes
          ? ` for device type ${feature.deviceTypes.join(', ')}`
          : ''
      }, so there is`,
      `nothing to select: the user interface greys the switch out.`
    ]
  )
}

exports.attributePolicy = attributePolicy
exports.fixedFields = fixedFields
exports.requireDefaultCanBeKept = requireDefaultCanBeKept
exports.requireIncluded = requireIncluded
exports.requirePolicyRespected = requirePolicyRespected
exports.requireToggleableFeature = requireToggleableFeature
