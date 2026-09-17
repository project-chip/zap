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
 * Error type used by the `zap edit` command line.
 *
 * @module CLI API: errors
 */

/**
 * An error that is caused by bad user input rather than by a bug. These are
 * reported as a plain message without a stack trace.
 */
class CliError extends Error {
  /**
   * @param {string} message
   * @param {string[]} hints Additional lines printed under the message.
   */
  constructor(message, hints = []) {
    super(message)
    this.name = 'CliError'
    this.hints = hints
  }
}

/**
 * Levenshtein distance, used to order lookup suggestions.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} the edit distance
 */
function editDistance(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let previous = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) previous[j] = j
  for (let i = 1; i <= a.length; i++) {
    let current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    previous = current
  }
  return previous[b.length]
}

/**
 * Orders candidates so that the ones most like what the user typed come first.
 * An alphabetical dump of a hundred cluster names is not a suggestion; the
 * handful that resemble the typo is.
 *
 * @param {string} spec What the user typed.
 * @param {string[]} candidates
 * @returns {string[]} candidates, best match first
 */
function rankCandidates(spec, candidates) {
  let needle = String(spec)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (needle === '') return candidates
  return candidates
    .map((candidate) => {
      let hay = candidate.toLowerCase().replace(/[^a-z0-9]/g, '')
      // Containment beats pure edit distance: a short query that appears
      // inside a long name is usually the thing being looked for.
      let contains = hay.includes(needle) || needle.includes(hay)
      return {
        candidate: candidate,
        score: (contains ? 0 : 1000) + editDistance(needle, hay)
      }
    })
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
    .map((entry) => entry.candidate)
}

/**
 * Builds a `CliError` that reports a failed lookup together with the things
 * the user most plausibly meant.
 *
 * @param {string} what Human readable entity kind, such as 'cluster'.
 * @param {string} spec What the user actually typed.
 * @param {string[]} candidates Valid values, may be long, gets truncated.
 * @param {number} maxCandidates
 * @returns {CliError} error carrying the candidate list as hints
 */
function notFound(what, spec, candidates = [], maxCandidates = 10) {
  let hints = []
  if (candidates.length > 0) {
    let ranked = rankCandidates(spec, candidates)
    let shown = ranked.slice(0, maxCandidates)
    hints.push(`Did you mean one of:`)
    shown.forEach((c) => hints.push(`  ${c}`))
    if (ranked.length > shown.length) {
      hints.push(`  ... and ${ranked.length - shown.length} more`)
    }
  }
  return new CliError(`Unknown ${what}: '${spec}'`, hints)
}

/**
 * Builds a `CliError` for a lookup that matched more than one entity.
 *
 * @param {string} what Human readable entity kind, such as 'device type'.
 * @param {string} spec What the user actually typed.
 * @param {string[]} matches Descriptions of the matched entities.
 * @returns {CliError} error carrying the ambiguity resolution hints
 */
function ambiguous(what, spec, matches) {
  return new CliError(
    `Ambiguous ${what}: '${spec}' matches ${matches.length} entries`,
    [
      ...matches.map((m) => `  ${m}`),
      `Narrow it down with --category, or use the numeric code.`
    ]
  )
}

exports.CliError = CliError
exports.notFound = notFound
exports.ambiguous = ambiguous
