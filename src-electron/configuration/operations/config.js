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
 * Whole-configuration operations: summary, validation check, and the session options the user interface lets you edit.
 *
 * @module Configuration API: config operations
 */

const dbEnum = require('../../../src-shared/db-enum.js')
const queryEndpoint = require('../../db/query-endpoint.js')
const queryPackage = require('../../db/query-package.js')
const querySession = require('../../db/query-session.js')
const operationError = require('../errors.js')
const sessionContent = require('../../util/session-content.js')
const validationReport = require('../../util/validation-report.js')
const outcome = require('../outcome.js')

const result = outcome.result
const OperationError = operationError.OperationError

const editableSessionOptionKeys = new Set([
  dbEnum.sessionOption.manufacturerCodes,
  dbEnum.sessionOption.defaultResponsePolicy,
  'commandDiscovery',
  dbEnum.sessionKey.disableComponentToggling,
  dbEnum.sessionKey.informationText
])

/**
 * Prints a summary of the configuration: its packages and its endpoints.
 *
 * @param {*} ctx
 * @returns {Promise<*>} operation result
 */
async function configInfo(ctx) {
  let pairs = await queryPackage.getPackageSessionPackagePairBySessionId(
    ctx.db,
    ctx.sessionId
  )
  let endpoints = await queryEndpoint.selectAllEndpoints(ctx.db, ctx.sessionId)
  let rows = pairs.map((p) => ({
    type: p.pkg.type,
    category: p.pkg.category || '',
    version: p.pkg.version || '',
    path: p.pkg.path
  }))
  let messages = [
    `${ctx.zapFile == null ? 'new configuration' : ctx.zapFile}`,
    `${endpoints.length} endpoint(s), ${rows.length} package(s)`
  ]
  // Said here as well as by `package list`, because a configuration missing
  // part of its data model is not a detail to go looking for.
  for (let missing of ctx.unresolvedCustomXml || []) {
    messages.push(
      `custom XML not loaded: ${missing.path}${missing.exists ? '' : ' (no such file)'}`
    )
  }
  return result(false, messages, {
    columns: ['type', 'category', 'version', 'path'],
    rows: rows
  })
}

/**
 * Reports everything ZAP knows to be wrong with the configuration, without
 * changing it.
 *
 * Two things are asked, because the user interface shows both and they do not
 * see the same problems. Validation recomputes the specification requirements
 * from the current state: malformed endpoints, defaults out of range, clusters,
 * attributes and commands a device type requires, and elements that a cluster's
 * feature selection makes mandatory or unsupported. The notifications hold what
 * was observed as the configuration was read and edited, which is the only place
 * some things are recorded: a provisional cluster in use, a command whose
 * response is missing, a duplicate, a device type that is no longer known.
 *
 * Where both describe the same problem the validation account is kept, being the
 * one recomputed just now.
 *
 * @param {*} ctx
 * @param {*} params
 * @returns {Promise<*>} operation result
 */
async function configCheck(ctx, params) {
  let issues = validationReport.collectIssues(
    await sessionContent.validate(ctx)
  )
  let rows = issues.map((issue) => ({
    kind: issue.kind,
    source: 'validation',
    message: issue.text
  }))

  let notifications = await sessionContent.notifications(ctx)
  if (params.packages === true) {
    notifications = notifications.concat(
      await sessionContent.packageNotifications(ctx)
    )
  }
  let reported = issues.map((issue) =>
    validationReport.complianceKey(issue.text)
  )
  for (let notification of notifications) {
    let key = validationReport.complianceKey(notification.message)
    if (reported.some((seen) => seen.includes(key))) continue
    rows.push({
      kind: `${notification.type}`.toLowerCase(),
      source: notification.scope,
      message: notification.message
    })
  }

  let errors = rows.filter((r) => r.kind === 'error').length
  let warnings = rows.length - errors
  // The table is reported even when it is empty, so that something reading the
  // JSON always has a list of findings to walk rather than sometimes nothing.
  let report = result(
    false,
    [
      `${ctx.zapFile == null ? 'configuration' : ctx.zapFile}: ${errors} error(s), ${warnings} warning(s)`,
      ...(rows.length === 0 ? ['nothing to report'] : [])
    ],
    { columns: ['kind', 'source', 'message'], rows: rows }
  )
  report.failed = errors > 0
  return report
}

/** Stores a user-editable configuration option in the active session. */
async function optionSet(ctx, params) {
  const key = params.key
  const value = params.value
  if (typeof key !== 'string' || !editableSessionOptionKeys.has(key)) {
    throw new OperationError(`Unknown editable configuration option '${key}'`, [
      `Editable options: ${[...editableSessionOptionKeys].join(', ')}`
    ])
  }
  if (
    value === undefined ||
    (value !== null && !['string', 'number', 'boolean'].includes(typeof value))
  ) {
    throw new OperationError(`Option '${key}' requires a scalar value`)
  }

  await querySession.updateSessionKeyValue(ctx.db, ctx.sessionId, key, value)
  const outcome = result(true, [`Updated configuration option ${key}`])
  outcome.key = key
  outcome.value = value
  return outcome
}

/**
 * The operations this module contributes, keyed by dotted name.
 */
const operations = {
  'config.info': (ctx) => configInfo(ctx),
  'config.check': (ctx, params) => configCheck(ctx, params),
  'option.set': (ctx, params) => optionSet(ctx, params)
}

exports.operations = operations
