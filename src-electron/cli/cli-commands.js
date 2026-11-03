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
 * The configuration command line: everything the GUI can do to a .zap file,
 * driven from a terminal or a script.
 *
 * The subcommands sit at the root and are organized as noun-verb pairs,
 * mirroring the panels of the GUI: `zap endpoint create`, `zap cluster enable`,
 * `zap attribute set`. `zap apply` runs a whole list of operations in one
 * process, which matters because loading the ZCL metadata is by far the
 * slowest part of any invocation.
 *
 * The command tree here is generated from the description in `cli-spec`, which
 * is also what `zap help` reports, so the parser and the help cannot disagree
 * about what exists.
 *
 * @module CLI API: command line
 */

const fs = require('fs')
const yargs = require('yargs/yargs')
const env = require('../util/env.js')
const cliSession = require('./cli-session.js')
const operationRunner = require('../util/operation-runner.js')
const cliOutput = require('./cli-output.js')
const cliScript = require('./cli-script.js')
const cliError = require('./cli-error.js')
const cliHelp = require('./cli-help.js')
const spec = require('./cli-spec.js')

const CliError = cliError.CliError

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
      argv.cliOperation = definition.operation
    }
  )
}

/**
 * Builds the whole `zap` command tree onto a yargs instance.
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
    'Specify what to do. Try: zap help, or zap endpoint --help'
  )
}

/**
 * Parses `zap help [topic...]`.
 *
 * yargs claims a bare `help` positional for its own usage screen, and there is
 * no way to register a command that outranks it. Since describing the command
 * surface needs nothing from the command tree, help is parsed on its own here
 * instead of fighting over the word.
 *
 * @param {string[]} args Arguments after the `help` word.
 * @returns {*} parsed arguments, tagged with `cliOperation`
 */
function parseHelpCommandLine(args) {
  let parser = yargs(args)
    .scriptName('zap help')
    .usage(
      `Usage: zap help [topic] [--format json]

Describes what the configuration commands can do and which options each one takes.

  zap help                      every operation, one line each
  zap help attribute            options of every attribute operation
  zap help attribute set        options of one operation
  zap help --format json        the whole surface as a machine readable schema`
    )
    .wrap(null)
  applyOptions(parser, spec.globalOptions)

  let parsed = parser.parseSync()
  parsed.topic = parsed._.map((word) => `${word}`)
  parsed.cliOperation = 'help'
  parsed._ = ['help']
  return parsed
}

/**
 * True when the raw process arguments ask for a configuration command.
 *
 * Those commands live at the root (`zap endpoint list`, `zap new file.zap`).
 *
 * @param {string[]} argv Raw `process.argv`.
 * @returns {boolean} whether this is a configuration-command invocation
 */
function isCliCommandLine(argv) {
  return indexOfCliCommand(argv) >= 0
}

/**
 * Names that start a configuration command: the groups and the top-level
 * operations.
 *
 * @returns {Set<string>} command names
 */
function configurationCommands() {
  return new Set([...Object.keys(spec.groups), ...Object.keys(spec.topLevel)])
}

/**
 * True when something after `index` is a positional argument rather than a flag.
 *
 * @param {string[]} argv
 * @param {number} index
 * @returns {boolean} whether a positional follows
 */
function hasPositionalAfter(argv, index) {
  for (let i = index + 1; i < argv.length; i++) {
    let arg = argv[i]
    if (typeof arg !== 'string') continue
    if (arg.startsWith('-')) {
      if (optionTakesValue(arg) && i + 1 < argv.length) i++
      continue
    }
    return true
  }
  return false
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
 * Built from the configuration commands' own global options so that
 * `--stateDirectory /tmp endpoint list …` skips `/tmp` rather than mistaking
 * it for a command, while a boolean such as `--logToStdout` leaves `endpoint`
 * in place. Unknown flags are treated as boolean: consuming their next token
 * would hide a legitimate command that follows.
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
 * Finds where a configuration command starts in the raw arguments.
 *
 * The command is the group or operation itself (`zap endpoint list`,
 * `zap new file.zap`). Global options may precede it
 * (`zap --logToStdout endpoint list …`). Flags are skipped, and a following
 * value is skipped when the flag is known to take one, so that
 * `--output info` is not mistaken for the command. `zap generate …` does not
 * engage this parser. Bare `zap new`, with no file after it, opens a window
 * and is left to the general parser.
 *
 * @param {string[]} argv Raw `process.argv`, with or without its leading paths.
 * @returns {number} index of the configuration command, or -1
 */
function indexOfCliCommand(argv) {
  let commands = configurationCommands()
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i]
    if (typeof arg !== 'string') continue
    if (arg.startsWith('-')) {
      if (optionTakesValue(arg) && i + 1 < argv.length) i++
      continue
    }
    if (isInterpreterOrScriptPath(arg)) continue
    if (!commands.has(arg)) return -1
    if (arg === 'new' && !hasPositionalAfter(argv, i)) return -1
    return i
  }
  return -1
}

/**
 * Options that appeared before the command token.
 *
 * Detection allows `zap --logToStdout endpoint list …`. Skip the interpreter
 * and script paths; everything else before the command is an option.
 *
 * @param {string[]} argv
 * @param {number} commandIndex
 * @returns {string[]} preceding option tokens
 */
function precedingCliOptions(argv, commandIndex) {
  let out = []
  for (let i = 0; i < commandIndex; i++) {
    let arg = argv[i]
    if (typeof arg !== 'string') continue
    if (isInterpreterOrScriptPath(arg)) continue
    out.push(arg)
  }
  return out
}

/**
 * Parses a configuration command line (`zap endpoint list file.zap`, and so on).
 *
 * This uses its own yargs instance rather than the general purpose one so that
 * the nested subcommands, their per-command help and their required options
 * all behave the way a person would expect.
 *
 * @param {string[]} argv Raw `process.argv`.
 * @returns {*} parsed arguments, tagged with `cliOperation`
 */
function parseCliCommandLine(argv) {
  let start = indexOfCliCommand(argv)
  let afterCommand = start < 0 ? argv : argv.slice(start)
  let preceding = start < 0 ? [] : precedingCliOptions(argv, start)
  if (afterCommand[0] === 'help') {
    return parseHelpCommandLine([...preceding, ...afterCommand.slice(1)])
  }
  let args = [...preceding, ...afterCommand]

  let parser = yargs(args)
    .scriptName('zap')
    .usage(
      `Usage: zap <group> <operation> <file.zap> [options]

Everything the ZAP user interface can do to a configuration, from a terminal.
Names are matched loosely, so "On/Off", ON_OFF and 0x0006 all select the same
cluster.

Examples:
${spec.examples.map((e) => `  ${e.command}`).join('\n')}

Run 'zap help' for every operation and the options it takes, or
'zap help --format json' for the same thing as a machine readable schema.`
    )
    .help()
    .alias({ help: ['h', '?'] })
    .wrap(null)
  applyOptions(parser, spec.globalOptions)
  buildCommandTree(parser)

  let parsed = parser.parseSync()
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
    `  zap package add ${ctx.zapFile} --xml <file.xml>`,
    `or drop the reference:`,
    `  zap package remove ${ctx.zapFile} --xml ${unresolved[0].declared}`,
    `or pass --force to edit it as it loaded.`
  )
  throw new CliError(
    `${ctx.zapFile} names ${unresolved.length} custom XML package(s) this session does not have`,
    hints
  )
}

/**
 * Runs a parsed `zap` command line.
 *
 * @param {*} argv Result of `parseCliCommandLine`.
 * @param {*} options `logger` and `printer` overrides, used by tests.
 * @returns {Promise<number>} process exit code
 */
async function run(argv, options = {}) {
  let printer = options.printer || ((text) => process.stdout.write(text + '\n'))
  let logger =
    options.logger ||
    (argv.quiet || argv.format === 'json' ? () => {} : console.error)
  let reportSharedClusterState = (shared) =>
    logger(
      env.formatEmojiMessage(
        '🔧',
        `shared cluster states across endpoints ${shared.endpoints.join(', ')}`
      )
    )

  // Describing the command surface must not pay for loading the ZCL metadata,
  // which is the whole reason it is worth asking for separately.
  if (argv.cliOperation === 'help') {
    printer(cliHelp.help(argv))
    return 0
  }

  // Reachable only if arguments arrive from somewhere other than the command
  // parser, which tags every command it recognizes. Better to say so than to
  // fail further in on a missing operation name.
  if (argv.cliOperation == null) {
    throw new CliError('No operation to run', [
      `Name a configuration command. Try: zap help`
    ])
  }

  let report = new cliOutput.Report(argv.format, argv.suggest !== false)
  let ctx = null
  try {
    let startFromBlank = argv.cliOperation === 'new' || argv.new === true
    if (startFromBlank) requireNothingToOverwrite(argv)
    ctx = await cliSession.open(argv, {
      logger: logger,
      zapFile: startFromBlank ? null : argv.zapFile
    })

    let operations
    if (argv.cliOperation === 'apply') {
      operations = await cliScript.load(argv.script)
      if (operations.length === 0) {
        report.add('apply', {
          changed: false,
          messages: [`${argv.script} contains no operations, nothing to do`]
        })
      }
    } else if (argv.cliOperation === 'new') {
      operations = []
      report.add('new', {
        changed: true,
        messages: [`Created an empty configuration`],
        next: [
          `zap devicetype list ${argv.zapFile} --all`,
          `zap endpoint create ${argv.zapFile} --endpoint 1 --device-type <name>`
        ]
      })
    } else {
      operations = [{ op: argv.cliOperation, params: argv }]
    }

    // A Matter configuration is not valid without its Root Node, and the user
    // interface creates one the moment you start a new configuration, so
    // starting one here does the same.
    if (startFromBlank && argv.rootNode !== false) {
      let rootNode = await operationRunner.createRootNode(
        ctx,
        reportSharedClusterState
      )
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
      let opResult = await operationRunner.execute(
        ctx,
        operation.op,
        operation.params,
        reportSharedClusterState
      )
      report.add(operation.op, opResult)
    }

    let mustWrite = report.changed || startFromBlank

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

exports.isCliCommandLine = isCliCommandLine
exports.parseCliCommandLine = parseCliCommandLine
exports.routeConsoleForMachineOutput = routeConsoleForMachineOutput
exports.run = run
