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
 * Rendering of `zap` results, either as text for a person or as JSON for
 * a script.
 *
 * @module CLI API: output rendering
 */

const validationReport = require('../util/validation-report.js')

const collectIssues = validationReport.collectIssues
const complianceKey = validationReport.complianceKey

/**
 * Quotes a value so the suggested commands can be pasted into a shell as they
 * stand. Cluster and device type names routinely contain spaces and slashes.
 *
 * @param {*} value
 * @returns {string} the value, quoted if it needs to be
 */
function shellQuote(value) {
  let text = `${value}`
  return /^[A-Za-z0-9._:/=<>-]+$/.test(text) ? text : `"${text}"`
}

/**
 * The command line flag for an operation parameter: `enabledOnly` is typed
 * as `--enabled-only`.
 *
 * @param {string} name camelCase parameter name
 * @returns {string} the flag, dashes included
 */
function flagFor(name) {
  return `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
}

/**
 * Renders an `{ op, params }` step as the command that runs it against the
 * file in hand.
 *
 * Suggestions are only worth printing if they can be run without editing them
 * first, so the real file name goes in and values are quoted.
 *
 * @param {*} step `{ op: 'cluster.enable', params: { endpoint: 1, ... } }`
 * @param {string} [zapFile] The file the run is working on.
 * @returns {string} the command line
 */
function renderStep(step, zapFile) {
  let parts = [
    `zap ${step.op.replace('.', ' ')}`,
    shellQuote(zapFile || '<file.zap>')
  ]
  for (let [name, value] of Object.entries(step.params || {})) {
    if (value === undefined || value === null) continue
    parts.push(
      value === true ? flagFor(name) : `${flagFor(name)} ${shellQuote(value)}`
    )
  }
  return parts.join(' ')
}

/**
 * Renders the steps an operation proposed, one command per line.
 *
 * @param {Array} steps
 * @param {string} [zapFile]
 * @returns {string[]} command lines
 */
function renderSteps(steps, zapFile) {
  return (steps || []).map((s) => renderStep(s, zapFile))
}

/**
 * Renders a `{ columns, rows }` payload as an aligned plain text table.
 *
 * @param {*} table
 * @returns {string} the rendered table
 */
function renderTable(table) {
  if (table == null || table.rows.length === 0) return ''
  let columns = table.columns
  let widths = columns.map((c) => c.length)
  let cells = table.rows.map((row) =>
    columns.map((c, i) => {
      let text = row[c] === undefined || row[c] === null ? '' : String(row[c])
      if (text.length > widths[i]) widths[i] = text.length
      return text
    })
  )
  let lines = []
  lines.push(
    columns
      .map((c, i) => c.toUpperCase().padEnd(widths[i]))
      .join('  ')
      .trimEnd()
  )
  lines.push(widths.map((w) => '-'.repeat(w)).join('  '))
  cells.forEach((row) => {
    lines.push(
      row
        .map((text, i) => text.padEnd(widths[i]))
        .join('  ')
        .trimEnd()
    )
  })
  return lines.join('\n')
}

/**
 * Collects the results of a run so they can be printed in one go, in whichever
 * format the user asked for.
 */
class Report {
  /**
   * @param {string} format 'text' or 'json'.
   * @param {boolean} suggest Whether to print follow-up commands. JSON output
   * always carries them as data, so this only governs the text rendering.
   * @param {string} [zapFile] The file being worked on, named in the
   * follow-up commands so they can be run as printed.
   */
  constructor(format = 'text', suggest = true, zapFile = null) {
    this.format = format
    this.suggest = suggest
    this.zapFile = zapFile
    this.entries = []
    this.savedTo = null
    this.validation = null
    this.notifications = null
  }

  /**
   * Records the outcome of a single operation.
   *
   * @param {string} operation
   * @param {*} opResult
   */
  add(operation, opResult) {
    this.entries.push({
      operation: operation,
      changed: opResult.changed === true,
      failed: opResult.failed === true,
      messages: [
        ...(opResult.messages || []),
        ...(opResult.warnings || []).map((w) => `warning: ${w}`)
      ],
      table: opResult.table || null,
      next: renderSteps(opResult.next, this.zapFile)
    })
  }

  /**
   * True when at least one operation modified the configuration.
   *
   * @returns {boolean} whether anything changed
   */
  get changed() {
    return this.entries.some((e) => e.changed)
  }

  /**
   * True when an operation found the configuration to be in error. Only the
   * checks report this; an edit that leaves errors behind is reported through
   * the validation diff instead.
   *
   * @returns {boolean} whether a check failed
   */
  get failed() {
    return this.entries.some((e) => e.failed)
  }

  /**
   * Renders everything collected so far.
   *
   * @returns {string} the report text
   */
  render() {
    if (this.format === 'json') {
      return JSON.stringify(
        {
          operations: this.entries.map((e) => ({
            operation: e.operation,
            changed: e.changed,
            failed: e.failed ? true : undefined,
            messages: e.messages,
            rows: e.table == null ? undefined : e.table.rows,
            nextSteps: e.next.length > 0 ? e.next : undefined
          })),
          savedTo: this.savedTo,
          validation: this.validation,
          notifications: this.notifications
        },
        null,
        2
      )
    }
    let out = []
    this.entries.forEach((e) => {
      e.messages.forEach((m) => out.push(m))
      let table = renderTable(e.table)
      if (table !== '') out.push(table)
      if (e.next.length > 0 && this.suggest) {
        out.push('Next:')
        e.next.forEach((command) => out.push(`  ${command}`))
      }
    })
    if (this.validation != null) {
      out.push(this.validation.headline)
      this.validation.issues.forEach((i) => out.push(`  ${i}`))
    }
    if (this.notifications != null) {
      out.push(this.notifications.headline)
      this.notifications.messages.forEach((m) => out.push(`  ${m}`))
    }
    if (this.savedTo != null) {
      out.push(`Saved ${this.savedTo}`)
    }
    return out.join('\n')
  }
}

/**
 * Renders one validation finding.
 *
 * @param {*} issue
 * @returns {string} the line
 */
function issueText(issue) {
  return `${issue.kind}: ${issue.text}`
}

/**
 * Compares two sets of findings as multisets, so that a finding appearing twice
 * before and three times after counts as one new one.
 *
 * @param {Array} before
 * @param {Array} after
 * @param {function} textOf Identity of a finding, for comparison.
 * @returns {*} `{ introduced, resolved }`, the findings only `after` has and how many only `before` had
 */
function compareFindings(before, after, textOf) {
  let counts = new Map()
  before.forEach((finding) => {
    let text = textOf(finding)
    counts.set(text, (counts.get(text) || 0) + 1)
  })
  let introduced = []
  after.forEach((finding) => {
    let text = textOf(finding)
    let remaining = counts.get(text) || 0
    if (remaining > 0) {
      counts.set(text, remaining - 1)
    } else {
      introduced.push(finding)
    }
  })
  return {
    introduced: introduced,
    resolved: [...counts.values()].reduce((a, b) => a + b, 0)
  }
}

/**
 * Renders one notification the way the validation findings are rendered.
 *
 * @param {*} notification
 * @returns {string} the line
 */
function notificationText(notification) {
  let kind = `${notification.type || 'warning'}`.toLowerCase()
  let scope = notification.scope === 'data model' ? 'data model: ' : ''
  return `${kind}: ${scope}${notification.message}`
}

/**
 * Compares the notifications before and after an edit and reports the ones the
 * edit brought about.
 *
 * This is the count the user interface keeps in its toolbar, which goes up as
 * you work: switching on a provisional cluster, or a command whose response is
 * not switched on, is allowed but noted. Only what this run added is worth
 * spelling out, on the same reasoning as the validation diff.
 *
 * @param {Array} before Notifications from before the edit.
 * @param {Array} after Notifications from after the edit.
 * @param {*} options `covered`, findings already reported elsewhere, and `maxLines`.
 * @returns {*} `{ introduced, preExisting, resolved, headline, messages }`
 */
function diffNotifications(before, after, options = {}) {
  let maxLines = options.maxLines || 20
  let covered = (options.covered || []).map(complianceKey)
  let comparison = compareFindings(before, after, notificationText)
  let preExisting = after.length - comparison.introduced.length
  let introduced = comparison.introduced
    .filter((notification) => {
      let key = complianceKey(notification.message)
      return !covered.some((reported) => reported.includes(key))
    })
    .map(notificationText)

  let headline =
    introduced.length === 0
      ? 'Notifications: none new'
      : `Notifications: ${introduced.length} new`
  let context = []
  if (preExisting > 0) {
    context.push(`${preExisting} pre-existing`)
  }
  if (comparison.resolved > 0) context.push(`${comparison.resolved} resolved`)
  if (context.length > 0) headline += ` (${context.join(', ')})`

  let messages = introduced.slice(0, maxLines)
  if (introduced.length > messages.length) {
    messages.push(`... and ${introduced.length - messages.length} more`)
  }

  return {
    introduced: introduced.length,
    preExisting: preExisting,
    resolved: comparison.resolved,
    headline: headline,
    messages: messages
  }
}

/**
 * Compares the validation state before and after an edit and reports only what
 * the edit changed.
 *
 * Configurations routinely carry findings that predate the current edit, and
 * listing all of them after every change buries the one line that matters. So
 * the detail is reserved for newly introduced findings, and everything else is
 * reduced to a count.
 *
 * @param {*} before Report from before the edit, or null for a new file.
 * @param {*} after Report from after the edit.
 * @param {*} options `maxLines`, how many findings to spell out.
 * @returns {*} `{ newErrors, newWarnings, preExistingErrors, preExistingWarnings, resolved, headline, issues }`
 */
function diffValidation(before, after, options = {}) {
  let maxLines = options.maxLines || 20
  let beforeIssues = collectIssues(before)
  let afterIssues = collectIssues(after)

  let comparison = compareFindings(beforeIssues, afterIssues, issueText)
  let introduced = comparison.introduced
  let resolved = comparison.resolved

  let newErrors = introduced.filter((i) => i.kind === 'error').length
  let newWarnings = introduced.filter((i) => i.kind === 'warning').length
  let preExistingErrors =
    afterIssues.filter((i) => i.kind === 'error').length - newErrors
  let preExistingWarnings =
    afterIssues.filter((i) => i.kind === 'warning').length - newWarnings

  let headline
  if (introduced.length === 0) {
    headline = 'Validation: no new issues'
  } else {
    headline = `Validation: ${newErrors} new error(s), ${newWarnings} new warning(s)`
  }
  let context = []
  if (preExistingErrors > 0)
    context.push(`${preExistingErrors} pre-existing error(s)`)
  if (preExistingWarnings > 0) {
    context.push(`${preExistingWarnings} pre-existing warning(s)`)
  }
  if (resolved > 0) context.push(`${resolved} resolved`)
  if (context.length > 0) headline += ` (${context.join(', ')})`

  let texts = introduced.map(issueText)
  let truncated = texts.slice(0, maxLines)
  if (texts.length > truncated.length) {
    truncated.push(`... and ${texts.length - truncated.length} more`)
  }

  return {
    newErrors: newErrors,
    newWarnings: newWarnings,
    preExistingErrors: preExistingErrors,
    preExistingWarnings: preExistingWarnings,
    resolved: resolved,
    headline: headline,
    issues: truncated
  }
}

exports.Report = Report
exports.renderStep = renderStep
exports.renderSteps = renderSteps
exports.collectIssues = collectIssues
exports.complianceKey = complianceKey
exports.diffNotifications = diffNotifications
exports.diffValidation = diffValidation
