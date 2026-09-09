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
 * `zap edit help`: describes the whole command surface, either as a page for a
 * person or as a schema for a script.
 *
 * This answers the question "what can I do and what do I have to pass" without
 * touching the database, which matters because loading the ZCL metadata takes
 * seconds and discovering the command surface should not.
 *
 * @module CLI API: help
 */

const spec = require('./cli-spec.js')
const cliError = require('./cli-error.js')

const CliError = cliError.CliError

/**
 * Flattens one operation from the spec into the shape reported by the schema.
 *
 * @param {string} group Group name, or null for a top level operation.
 * @param {string} verb
 * @param {*} definition
 * @returns {*} the described operation
 */
function describeOperation(group, verb, definition) {
  let path = group == null ? verb : `${group} ${verb}`
  let options = Object.entries(definition.options || {}).map(
    ([flag, option]) => {
      let described = {
        flag: `--${flag}`,
        param: spec.toParamName(flag),
        type: option.choices ? 'string' : option.type || 'string',
        required: option.required === true,
        description: option.desc
      }
      if (option.choices) described.choices = option.choices
      let fallback = spec.defaultOf(option)
      if (fallback !== undefined) described.default = fallback
      return described
    }
  )
  return {
    operation: definition.operation,
    command: `zap edit ${path}${definition.noFile ? '' : ' <file.zap>'}`,
    path: path,
    group: group,
    verb: verb,
    description: definition.describe,
    readOnly: definition.readOnly === true,
    takesFile: definition.noFile !== true,
    options: options
  }
}

/**
 * Builds the machine readable description of the whole command surface.
 *
 * @returns {*} the schema
 */
function describeCli() {
  let operations = []
  for (let [group, definition] of Object.entries(spec.groups)) {
    for (let [verb, operation] of Object.entries(definition.operations)) {
      operations.push(describeOperation(group, verb, operation))
    }
  }
  for (let [verb, operation] of Object.entries(spec.topLevel)) {
    operations.push(describeOperation(null, verb, operation))
  }

  let globalOptions = Object.entries(spec.globalOptions).map(
    ([flag, option]) => {
      let described = {
        flag: `--${flag}`,
        param: flag,
        type: option.choices ? 'string' : option.type || 'string',
        required: false,
        description: option.desc
      }
      if (option.alias) {
        described.aliases = [].concat(option.alias).map((a) => `--${a}`)
      }
      if (option.choices) described.choices = option.choices
      let fallback = spec.defaultOf(option)
      if (fallback !== undefined) described.default = fallback
      return described
    }
  )

  return {
    command: 'zap edit',
    description:
      'Everything the ZAP user interface can do to a .zap configuration, from a terminal or a script.',
    usage: 'zap edit <group> <operation> <file.zap> [options]',
    groups: Object.entries(spec.groups).map(([name, definition]) => ({
      group: name,
      description: definition.describe,
      operations: Object.keys(definition.operations).map((v) => `${name} ${v}`)
    })),
    operations: operations,
    globalOptions: globalOptions,
    batchScript: spec.batchScript,
    notes: spec.notes,
    discovery: spec.discovery,
    examples: spec.examples,
    exitCodes: { 0: 'success', 1: 'failure, with the reason on stderr' }
  }
}

/**
 * Pads to a column width for the text renderer.
 *
 * @param {string} text
 * @param {number} width
 * @returns {string} padded text
 */
function pad(text, width) {
  return text.length >= width ? text : text + ' '.repeat(width - text.length)
}

/**
 * Renders one operation with its options.
 *
 * @param {*} operation
 * @returns {string[]} lines
 */
function renderOperation(operation) {
  let lines = [`${operation.command}`, `  ${operation.description}`]
  if (operation.options.length > 0) {
    let width = Math.max(...operation.options.map((o) => o.flag.length))
    lines.push('')
    operation.options.forEach((option) => {
      let notes = []
      if (option.required) notes.push('required')
      if (option.choices) notes.push(option.choices.join(' | '))
      if (option.default !== undefined && option.default !== false) {
        notes.push(`default ${option.default}`)
      }
      lines.push(
        `  ${pad(option.flag, width)}  ${option.description}${
          notes.length > 0 ? ` [${notes.join(', ')}]` : ''
        }`
      )
    })
  }
  return lines
}

/**
 * Renders the overview: every operation on one line each.
 *
 * @param {*} schema
 * @returns {string} the overview
 */
function renderOverview(schema) {
  let lines = [
    schema.description,
    '',
    `Usage: ${schema.usage}`,
    '',
    'OPERATIONS'
  ]
  let width = Math.max(...schema.operations.map((o) => o.path.length))
  schema.groups.forEach((group) => {
    lines.push('')
    lines.push(`  ${group.group}: ${group.description}`)
    schema.operations
      .filter((o) => o.group === group.group)
      .forEach((o) => lines.push(`    ${pad(o.path, width)}  ${o.description}`))
  })
  lines.push('')
  lines.push('  on their own:')
  schema.operations
    .filter((o) => o.group == null)
    .forEach((o) => lines.push(`    ${pad(o.path, width)}  ${o.description}`))

  lines.push('', 'OPTIONS THAT APPLY TO EVERY OPERATION')
  let globalWidth = Math.max(...schema.globalOptions.map((o) => o.flag.length))
  schema.globalOptions.forEach((option) => {
    let notes = []
    if (option.choices) notes.push(option.choices.join(' | '))
    if (option.default !== undefined && option.default !== false) {
      notes.push(`default ${option.default}`)
    }
    lines.push(
      `  ${pad(option.flag, globalWidth)}  ${option.description}${
        notes.length > 0 ? ` [${notes.join(', ')}]` : ''
      }`
    )
  })

  lines.push('', 'GOOD TO KNOW')
  schema.notes.forEach((note) => lines.push(`  - ${note}`))

  lines.push('', 'FINDING OUT WHICH VALUES ARE LEGAL')
  schema.discovery.forEach((entry) => {
    lines.push(`  ${entry.question}`)
    lines.push(`    ${entry.command}`)
  })

  lines.push(
    '',
    'MORE',
    "  zap edit help <group>             options of every operation in a group, e.g. 'zap edit help attribute'",
    "  zap edit help <group> <operation> options of one operation, e.g. 'zap edit help attribute set'",
    '  zap edit help --format json       the whole surface as a machine readable schema'
  )
  return lines.join('\n')
}

/**
 * Renders help text, either the overview or a single topic.
 *
 * @param {*} schema
 * @param {string[]} topic Words the caller asked about, possibly empty.
 * @returns {string} the help text
 */
function renderHelp(schema, topic = []) {
  if (topic.length === 0) return renderOverview(schema)

  // 'attribute.set', 'attribute set' and 'attribute' all have to work.
  let wanted = topic.join(' ').replace(/\./g, ' ').trim().toLowerCase()

  let exact = schema.operations.filter((o) => o.path.toLowerCase() === wanted)
  if (exact.length > 0) {
    return exact.map((o) => renderOperation(o).join('\n')).join('\n\n')
  }

  let inGroup = schema.operations.filter(
    (o) => o.group != null && o.group.toLowerCase() === wanted
  )
  if (inGroup.length > 0) {
    let group = schema.groups.find((g) => g.group.toLowerCase() === wanted)
    return [
      `${group.group}: ${group.description}`,
      ...inGroup.map((o) => renderOperation(o).join('\n'))
    ].join('\n\n')
  }

  throw new CliError(`No help topic '${topic.join(' ')}'`, [
    `Known topics: ${schema.groups
      .map((g) => g.group)
      .concat(
        schema.operations.filter((o) => o.group == null).map((o) => o.path)
      )
      .join(', ')}`
  ])
}

/**
 * Produces the output of `zap edit help`.
 *
 * @param {*} argv Parsed arguments, for `format` and the topic positional.
 * @returns {string} the help output
 */
function help(argv) {
  let schema = describeCli()
  let topic = [].concat(argv.topic || [])
  if (argv.format === 'json') {
    if (topic.length === 0) return JSON.stringify(schema, null, 2)
    let wanted = topic.join(' ').replace(/\./g, ' ').trim().toLowerCase()
    let matching = schema.operations.filter(
      (o) =>
        o.path.toLowerCase() === wanted ||
        (o.group != null && o.group.toLowerCase() === wanted)
    )
    if (matching.length === 0) {
      // Reuse the text renderer's error, which lists the known topics.
      renderHelp(schema, topic)
    }
    return JSON.stringify(
      { ...schema, groups: undefined, operations: matching },
      null,
      2
    )
  }
  return renderHelp(schema, topic)
}

exports.describeCli = describeCli
exports.help = help
