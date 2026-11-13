/**
 * Helpers for turning validation results and notifications into comparable
 * findings. Presentation layers can render these records in their own format.
 *
 * @module Configuration API: validation report
 */

/**
 * Flattens a validation report into one entry per finding.
 *
 * @param {*} report Output of `validate-all`.
 * @returns {Array} array of `{ kind, text }`
 */
function collectIssues(report) {
  let issues = []
  if (report == null) return issues

  for (let row of report.endpoints || []) {
    let fields = row.issues || {}
    for (let field of Object.keys(fields)) {
      for (let issue of fields[field] || []) {
        issues.push({
          kind: 'error',
          text: `endpoint ${row.endpointId}: ${issue}`
        })
      }
    }
  }
  for (let row of report.attributes || []) {
    for (let issue of row.issues || []) {
      issues.push({
        kind: 'error',
        text: `endpoint ${row.endpointIdentifierLabel} ${row.clusterName}/${row.attributeName}: ${issue}`
      })
    }
  }
  for (let row of report.conformance || []) {
    for (let warning of row.warnings || []) {
      issues.push({
        kind: 'warning',
        text: `endpoint ${row.endpointId} ${row.clusterName || ''}: ${warning}`
      })
    }
  }
  return issues
}

/**
 * Reduces a finding to its wording for duplicate detection.
 *
 * @param {string} message
 * @returns {string} normalized comparable form
 */
function complianceKey(message) {
  return `${message}`
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase()
}

exports.collectIssues = collectIssues
exports.complianceKey = complianceKey
