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
 * The `zap edit` command line: everything the GUI can do to a configuration,
 * driven from a terminal or a script.
 *
 * The subcommands are organized as noun-verb pairs, mirroring the panels of
 * the GUI: `endpoint`, `devicetype`, `cluster`, `attribute`, `command`,
 * `event` and `feature`. `zap edit apply` runs a whole list of operations in
 * one process, which matters because loading the ZCL metadata is by far the
 * slowest part of any invocation.
 *
 * The command tree here is generated from the description in `cli-spec`, which
 * is also what `zap edit help` reports, so the parser and the help cannot
 * disagree about what exists.
 *
 * @module CLI API: edit command line
 */

const fs = require('fs')
const yargs = require('yargs/yargs')
const env = require('../util/env.js')
const cliSession = require('./cli-session.js')
const cliOperations = require('./cli-operations.js')
const cliOutput = require('./cli-output.js')
const cliScript = require('./cli-script.js')
const cliError = require('./cli-error.js')
const cliHelp = require('./cli-help.js')
const spec = require('./cli-spec.js')

const CliError = cliError.CliError

const EDIT_COMMAND = 'edit'

/**
 * Translates one option from the spec into the shape yargs wants.
 *
 * @param {*} option
 * @returns {*} yargs option definition
 */
function toYargsOption(option) {
  let translated = { desc: option.desc }
  if (option.type) translated.type = option.type
  if (option.choices) translated.choices = option.choices
  if (option.alias) translated.alias = option.alias
  if (option.required) translated.demandOption = true
  let fallback = spec.defaultOf(option)
  if (fallback !== undefined) translated.default = fallback
  return translated
}

/**
 * Registers a set of options from the spec onto a yargs instance.
 *
 * @param {*} y yargs instance
 * @param {*} options
 * @returns {*} the yargs instance
 */
function applyOptions(y, options) {
  Object.entries(options || {}).forEach(([flag, option]) =>
    y.option(flag, toYargsOption(option))
  )
  return y
}

/**
 * Registers a leaf subcommand. The handler only tags the parsed arguments with
 * the operation to run; execution happens later, in `run`.
 *
 * @param {*} y yargs instance
 * @param {string} verb
 * @param {*} definition Operation description from the spec.
 * @returns {*} the yargs instance
 */
function registerOperation(y, verb, definition) {
  let positional = definition.noFile ? '' : ' <zapFile>'
  return y.command(
    `${verb}${positional}`,
    definition.describe,
    (b) => applyOptions(b, definition.options),
    (argv) => {
      argv.editOperation = definition.operation
    }
  )
}

/**
 * Builds the whole `zap edit` command tree onto a yargs instance.
 *
 * @param {*} y yargs instance
 * @returns {*} the yargs instance
 */
function buildCommandTree(y) {
  Object.entries(spec.groups).forEach(([group, definition]) => {
    y.command(group, definition.describe, (b) => {
      Object.entries(definition.operations).forEach(([verb, operation]) =>
        registerOperation(b, verb, operation)
      )
      return b.demandCommand(1, `Specify a ${group} operation.`)
    })
  })

  Object.entries(spec.topLevel).forEach(([verb, definition]) => {
    // `help` is parsed separately, see parseHelpCommandLine.
    if (verb !== 'help') registerOperation(y, verb, definition)
  })

  return y.demandCommand(
    1,
    'Specify what to edit. Try: zap edit help, or zap edit --help'
  )
}

/**
 * Parses `zap edit help [topic...]`.
 *
 * yargs claims a bare `help` positional for its own usage screen, and there is
 * no way to register a command that outranks it. Since describing the command
 * surface needs nothing from the command tree, help is parsed on its own here
 * instead of fighting over the word.
 *
 * @param {string[]} args Arguments after the `help` word.
 * @returns {*} parsed arguments, tagged with `editOperation`
 */
function parseHelpCommandLine(args) {
  let parser = yargs(args)
    .scriptName('zap edit help')
    .usage(
      `Usage: zap edit help [topic] [--format json]

Describes what zap edit can do and which options each operation takes.

  zap edit help                      every operation, one line each
  zap edit help attribute            options of every attribute operation
  zap edit help attribute set        options of one operation
  zap edit help --format json        the whole surface as a machine readable schema`
    )
    .wrap(null)
  applyOptions(parser, spec.globalOptions)

  let parsed = parser.parseSync()
  parsed.topic = parsed._.map((word) => `${word}`)
  parsed.editOperation = 'help'
  parsed._ = [EDIT_COMMAND, 'help']
  return parsed
}

/**
 * True when the raw process arguments ask for the `edit` command.
 *
 * @param {string[]} argv Raw `process.argv`.
 * @returns {boolean} whether this is a `zap edit` invocation
 */
function isEditCommandLine(argv) {
  return indexOfEditCommand(argv) >= 0
}

/**
 * True for the interpreter and script path that lead a raw `process.argv`.
 *
 * Callers do not agree on whether those two are included, so rather than
 * counting positions this recognizes them by shape: a path, or a bare
 * interpreter name. No zap command looks like either.
 *
 * @param {string} arg
 * @returns {boolean} whether the argument is a leading path rather than a command
 */
function isInterpreterOrScriptPath(arg) {
  if (arg.includes('/') || arg.includes('\\')) return true
  if (['node', 'electron'].includes(arg)) return true
  return ['.js', '.mjs', '.cjs', '.exe'].some((ext) => arg.endsWith(ext))
}

/**
 * True when a leading flag takes a following value token.
 *
 * Built from the edit command's own global options so that
 * `--stateDirectory /tmp edit …` skips `/tmp` rather than mistaking it for a
 * command, while a boolean such as `--logToStdout` leaves `edit` in place.
 * Unknown flags are treated as boolean: consuming their next token would hide
 * a legitimate `edit` that follows.
 *
 * @param {string} flag A token that starts with `-`.
 * @returns {boolean} whether the next argv token is this flag's value
 */
function optionTakesValue(flag) {
  if (flag.includes('=')) return false
  let name = flag.replace(/^--?/, '')
  for (let [key, opt] of Object.entries(spec.globalOptions)) {
    let aliases = opt.alias == null ? [] : [].concat(opt.alias)
    let names = [key, ...aliases].flatMap((n) => [
      n,
      n.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    ])
    if (!names.includes(name)) continue
    return opt.type !== 'boolean'
  }
  return false
}

/**
 * Finds where the `edit` command starts in the raw arguments.
 *
 * Global options may precede `edit` (`zap --logToStdout edit …`). Flags are
 * skipped, and a following value is skipped when the flag is known to take
 * one, so that `--output edit` (the word as a value) is not mistaken for the
 * command. The first non-option, non-path token must still be `edit` itself;
 * `zap generate …` does not engage this parser.
 *
 * @param {string[]} argv Raw `process.argv`, with or without its leading paths.
 * @returns {number} index of 'edit', or -1
 */
function indexOfEditCommand(argv) {
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i]
    if (typeof arg !== 'string') continue
    if (arg.startsWith('-')) {
      if (optionTakesValue(arg) && i + 1 < argv.length) i++
      continue
    }
    if (isInterpreterOrScriptPath(arg)) continue
    return arg === EDIT_COMMAND ? i : -1
  }
  return -1
}

/**
 * Options that appeared before the `edit` token.
 *
 * Detection allows `zap --logToStdout edit …`, but the edit parser only sees
 * what follows `edit` unless those leading flags are carried across. Skip the
 * interpreter and script paths; everything else before `edit` is an option.
 *
 * @param {string[]} argv
 * @param {number} editIndex
 * @returns {string[]} preceding option tokens
 */
function precedingEditOptions(argv, editIndex) {
  let out = []
  for (let i = 0; i < editIndex; i++) {
    let arg = argv[i]
    if (typeof arg !== 'string') continue
    if (isInterpreterOrScriptPath(arg)) continue
    out.push(arg)
  }
  return out
}

/**
 * Parses a `zap edit ...` command line.
 *
 * This uses its own yargs instance rather than the general purpose one so that
 * the nested subcommands, their per-command help and their required options
 * all behave the way a person would expect.
 *
 * @param {string[]} argv Raw `process.argv`.
 * @returns {*} parsed arguments, tagged with `editOperation`
 */
function parseEditCommandLine(argv) {
  let start = indexOfEditCommand(argv)
  let afterEdit = start < 0 ? argv : argv.slice(start + 1)
  let preceding = start < 0 ? [] : precedingEditOptions(argv, start)
  // `help` is the first token after `edit`, not after any leading globals.
  if (afterEdit[0] === 'help') {
    return parseHelpCommandLine([...preceding, ...afterEdit.slice(1)])
  }
  let args = [...preceding, ...afterEdit]

  let parser = yargs(args)
    .scriptName('zap edit')
    .usage(
      `Usage: zap edit <group> <operation> <file.zap> [options]

Everything the ZAP user interface can do to a configuration, from a terminal.
Names are matched loosely, so "On/Off", ON_OFF and 0x0006 all select the same
cluster.

Examples:
${spec.examples.map((e) => `  ${e.command}`).join('\n')}

Run 'zap edit help' for every operation and the options it takes, or
'zap edit help --format json' for the same thing as a machine readable schema.`
    )
    .help()
    .alias({ help: ['h', '?'] })
    .wrap(null)
  applyOptions(parser, spec.globalOptions)
  buildCommandTree(parser)

  let parsed = parser.parseSync()
  parsed._ = [EDIT_COMMAND, ...parsed._]
  return normalizeStdinScript(parsed)
}

/**
 * Restores the conventional meaning of `--script -`.
 *
 * yargs-parser treats a lone dash as a positional rather than as the value of
 * the option before it, so `--script -` arrives as an empty script with a
 * stray dash alongside. Everyone writes it that way, so it is put back
 * together rather than only supporting `--script=-`.
 *
 * @param {*} parsed
 * @returns {*} the same parsed arguments
 */
function normalizeStdinScript(parsed) {
  if (parsed.script === '' && parsed._.includes('-')) {
    parsed.script = '-'
    parsed._ = parsed._.filter((token) => token !== '-')
  }
  return parsed
}

/**
 * Sends everything that is not the result to stderr when the caller asked for
 * machine readable output.
 *
 * Loading a configuration prints progress and specification warnings through
 * `console.log`, from several modules that have no idea a machine is reading
 * along. Advertising `--format json` is only honest if stdout then carries the
 * JSON and nothing else, so for the duration of such a run `console.log` is
 * pointed at stderr. Nothing is lost, it just stops corrupting the payload.
 *
 * @param {*} argv Parsed arguments.
 * @returns {*} the same parsed arguments
 */
function routeConsoleForMachineOutput(argv) {
  if (argv.format === 'json' || argv.quiet === true) {
    console.log = (...args) => console.error(...args)
  }
  return argv
}

/**
 * Decides which file the result should be written to.
 *
 * @param {*} argv
 * @returns {string} output path
 */
function outputPath(argv) {
  if (argv.output != null) return argv.output
  if (argv.zapFile != null) return argv.zapFile
  throw new CliError('Nothing to write to, pass -o <file.zap>')
}

/**
 * Refuses to start from an empty configuration on top of a file that already
 * holds one.
 *
 * Starting fresh and then saving would replace whatever was there, and a
 * configuration is not something to discard on the strength of a mistyped file
 * name. There is a `~` copy afterwards either way, but noticing at the time is
 * better than finding out later.
 *
 * @param {*} argv
 * @returns {undefined} nothing, throws when the target is occupied
 */
function requireNothingToOverwrite(argv) {
  if (argv.force === true) return
  let target = argv.output != null ? argv.output : argv.zapFile
  if (target == null || !fs.existsSync(target)) return
  throw new CliError(`${target} already holds a configuration`, [
    `Starting from an empty one would replace it. Either edit it as it is,`,
    `write somewhere else with -o, or pass --force to replace it.`
  ])
}

/**
 * True for operations that only read the configuration.
 *
 * @param {string} operation Dotted operation name.
 * @returns {boolean} whether the operation is read-only
 */
function isReadOnly(operation) {
  return (
    operation === 'config.info' ||
    operation === 'config.check' ||
    operation.endsWith('.list')
  )
}

/**
 * Refuses to edit a configuration whose custom XML is not the custom XML it
 * names.
 *
 * The importer answers a custom XML it cannot load by moving on: the package is
 * dropped, or, when the database holds another one, quietly put in its place.
 * Either way the session is built on a different data model than the file
 * describes, and saving writes that difference back into the file. Reading such
 * a configuration is still allowed, since that is how you find out.
 *
 * @param {*} ctx
 * @param {Array} operations The operations about to run.
 * @returns {void} nothing, or throws
 */
function requireResolvedPackages(ctx, operations) {
  let unresolved = ctx.unresolvedCustomXml || []
  if (unresolved.length === 0 || ctx.argv.force === true) return
  // Repairing the reference is itself an edit, so the package operations are
  // the way out of this rather than something to stop.
  if (
    operations.length > 0 &&
    operations.every((o) => o.op.startsWith('package.'))
  ) {
    return
  }

  let hints = unresolved.map(
    (missing) =>
      `  ${missing.declared}${missing.exists ? ' (named but not loaded)' : ' (no such file)'}`
  )
  let substituted = ctx.substitutedCustomXml || []
  substituted.forEach((p) =>
    hints.push(`  ${p.path} was loaded instead, though the file never names it`)
  )
  hints.push(
    `Saving would write that difference back into the file. Point it at the file:`,
    `  zap edit package add ${ctx.zapFile} --xml <file.xml>`,
    `or drop the reference:`,
    `  zap edit package remove ${ctx.zapFile} --xml ${unresolved[0].declared}`,
    `or pass --force to edit it as it loaded.`
  )
  throw new CliError(
    `${ctx.zapFile} names ${unresolved.length} custom XML package(s) this session does not have`,
    hints
  )
}

/**
 * Runs a parsed `zap edit` command line.
 *
 * @param {*} argv Result of `parseEditCommandLine`.
 * @param {*} options `logger` and `printer` overrides, used by tests.
 * @returns {Promise<number>} process exit code
 */
async function run(argv, options = {}) {
  let printer = options.printer || ((text) => process.stdout.write(text + '\n'))
  let logger =
    options.logger ||
    (argv.quiet || argv.format === 'json' ? () => {} : console.error)

  // Describing the command surface must not pay for loading the ZCL metadata,
  // which is the whole reason it is worth asking for separately.
  if (argv.editOperation === 'help') {
    printer(cliHelp.help(argv))
    return 0
  }

  // Reachable only if arguments arrive from somewhere other than the edit
  // parser, which tags every command it recognizes. Better to say so than to
  // fail further in on a missing operation name.
  if (argv.editOperation == null) {
    throw new CliError('No operation to run', [
      `'edit' has to be the first argument. Try: zap edit help`
    ])
  }

  let report = new cliOutput.Report(argv.format, argv.suggest !== false)
  let ctx = null
  try {
    let startFromBlank = argv.editOperation === 'new' || argv.new === true
    if (startFromBlank) requireNothingToOverwrite(argv)
    ctx = await cliSession.open(argv, {
      logger: logger,
      zapFile: startFromBlank ? null : argv.zapFile
    })

    let operations
    if (argv.editOperation === 'apply') {
      operations = await cliScript.load(argv.script)
      if (operations.length === 0) {
        report.add('apply', {
          changed: false,
          messages: [`${argv.script} contains no operations, nothing to do`]
        })
      }
    } else if (argv.editOperation === 'new') {
      operations = []
      report.add('new', {
        changed: true,
        messages: [`Created an empty configuration`],
        next: [
          `zap edit devicetype list ${argv.zapFile} --all`,
          `zap edit endpoint create ${argv.zapFile} --endpoint 1 --device-type <name>`
        ]
      })
    } else {
      operations = [{ op: argv.editOperation, params: argv }]
    }

    // A Matter configuration is not valid without its Root Node, and the user
    // interface creates one the moment you start a new configuration, so
    // starting one here does the same.
    if (startFromBlank && argv.rootNode !== false) {
      let rootNode = await cliOperations.createRootNode(ctx)
      if (rootNode.changed) report.add('rootNode', rootNode)
    }

    // Snapshot the state up front so that afterwards we can report what this
    // run introduced rather than everything the file already had.
    let mutating = startFromBlank || operations.some((o) => !isReadOnly(o.op))
    if (mutating) requireResolvedPackages(ctx, operations)
    let validationEnabled = argv.validate !== false && mutating
    let before =
      validationEnabled && !startFromBlank
        ? await cliSession.validate(ctx)
        : null
    let notificationsBefore = mutating
      ? await cliSession.notifications(ctx)
      : []

    for (let operation of operations) {
      let opResult = await cliOperations.execute(
        ctx,
        operation.op,
        operation.params
      )
      report.add(operation.op, opResult)
    }

    let mustWrite = report.changed || startFromBlank

    // In Zigbee a cluster's configuration is shared by every endpoint that
    // enables it, and the user interface re-aligns them after each change. Do
    // the same before validating, so the findings describe what will be saved.
    if (mustWrite) {
      let shared = await cliOperations.unifySharedClusterStates(ctx)
      if (shared.applied) {
        logger(
          env.formatEmojiMessage(
            '🔧',
            `shared cluster states across endpoints ${shared.endpoints.join(', ')}`
          )
        )
      }
    }

    if (mustWrite && validationEnabled) {
      report.validation = cliOutput.diffValidation(
        before,
        await cliSession.validate(ctx)
      )
    }
    if (mustWrite) {
      report.notifications = cliOutput.diffNotifications(
        notificationsBefore,
        await cliSession.notifications(ctx),
        // Validation recomputes some of the same findings, and having said them
        // once is enough.
        { covered: report.validation == null ? [] : report.validation.issues }
      )
    }

    if (!mustWrite) {
      printer(report.render())
      // A check that found errors is only allowed to fail the run when asked
      // to, so that reading the report stays the ordinary case.
      return report.failed && argv.strict ? 1 : 0
    }
    if (
      argv.strict &&
      report.validation != null &&
      report.validation.newErrors > 0
    ) {
      printer(report.render())
      throw new CliError(
        `Not saving: this edit introduced ${report.validation.newErrors} validation error(s) and --strict is set`
      )
    }
    if (argv.dryRun) {
      report.savedTo = null
      printer(report.render())
      logger(env.formatEmojiMessage('🔧', 'dry run, no file written'))
      return 0
    }

    report.savedTo = await cliSession.save(ctx, outputPath(argv), {
      noZapFileLog: argv.noZapFileLog
    })
    printer(report.render())
    return 0
  } finally {
    await cliSession.close(ctx)
  }
}

exports.isEditCommandLine = isEditCommandLine
exports.parseEditCommandLine = parseEditCommandLine
exports.routeConsoleForMachineOutput = routeConsoleForMachineOutput
exports.run = run
