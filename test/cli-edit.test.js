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
 *
 *
 * @jest-environment node
 */

const fs = require('fs')
const os = require('os')
const path = require('path')

const env = require('../src-electron/util/env')
const testUtil = require('./test-util')
const startup = require('../src-electron/main-process/startup')
const dbApi = require('../src-electron/db/db-api')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const genEngine = require('../src-electron/generator/generation-engine')
const importJs = require('../src-electron/importexport/import')
const querySessionNotification = require('../src-electron/db/query-session-notification')
const cliCommands = require('../src-electron/cli/cli-commands')
const cliOutput = require('../src-electron/cli/cli-output')
const cliHelp = require('../src-electron/cli/cli-help')
const cliOperations = require('../src-electron/cli/cli-operations')
const cliPolicy = require('../src-electron/cli/cli-policy')
const conformChecker = require('../src-electron/validation/conformance-checker')
const conformEvaluator = require('../src-electron/validation/conformance-expression-evaluator')

let workDir
let repoScratchFiles = []

beforeAll(() => {
  env.setDevelopmentEnv()
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zap-cli-edit-'))
})

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
  repoScratchFiles.forEach((f) => {
    fs.rmSync(f, { force: true })
    // Saving always leaves the previous content behind with a ~ suffix.
    fs.rmSync(f + '~', { force: true })
  })
})

const multiprotocolPackages = {
  zclProperties: [
    env.builtinSilabsZclMetafile(),
    env.locateProjectResource(
      './zcl-builtin/matter/zcl-with-test-extensions.json'
    )
  ],
  generationTemplate: [
    env.locateProjectResource(testUtil.testTemplate.zigbee),
    env.locateProjectResource(testUtil.testTemplate.matter)
  ]
}

const matterPackages = {
  zclProperties: [env.locateProjectResource('./zcl-builtin/matter/zcl.json')],
  generationTemplate: [env.locateProjectResource(testUtil.testTemplate.matter)]
}

// The Zigbee templates are what declare shareClusterStatesAcrossEndpoints,
// which is how a data model says its cluster configuration is global.
const zigbeePackages = {
  zclProperties: [env.builtinSilabsZclMetafile()],
  generationTemplate: [env.locateProjectResource(testUtil.testTemplate.zigbee)]
}

/**
 * Builds the argument object that the edit runner expects, filling in the
 * defaults that yargs would normally supply.
 *
 * @param {*} overrides
 * @returns {*} argv-like object
 */
function args(overrides) {
  return {
    zclProperties: [env.builtinSilabsZclMetafile()],
    generationTemplate: [env.builtinTemplateMetafile()],
    packageMatch: 'fuzzy',
    format: 'text',
    validate: true,
    strict: false,
    dryRun: false,
    backup: false,
    quiet: true,
    new: false,
    noZapFileLog: true,
    noLoadingFailure: true,
    ...overrides
  }
}

/**
 * Runs one edit operation and returns what it printed.
 *
 * @param {*} overrides
 * @returns {Promise<*>} `{ code, output }`
 */
async function edit(overrides) {
  let output = ''
  let errors = ''
  let code = await startup.startEdit(args(overrides), {
    printer: (text) => {
      output += text + '\n'
    },
    // Failures normally go to stderr so that JSON on stdout stays parseable.
    // Collected here so that what the user is told can be asserted on.
    errorPrinter: (text) => {
      errors += text + '\n'
    },
    logger: () => {}
  })
  return { code: code, output: output, errors: errors }
}

/**
 * Copies a test resource into the scratch directory so tests never write to
 * the repository.
 *
 * @param {string} source
 * @param {string} name
 * @returns {string} path of the copy
 */
function scratchCopy(source, name) {
  let target = path.join(workDir, name)
  fs.copyFileSync(source, target)
  return target
}

/**
 * Copies a test resource next to the original, so that the relative package
 * paths inside the .zap file still resolve. Needed by anything that checks how
 * packages survive a save.
 *
 * @param {string} source
 * @param {string} name
 * @returns {string} path of the copy
 */
function siblingCopy(source, name) {
  let target = path.join(path.dirname(source), name)
  fs.copyFileSync(source, target)
  repoScratchFiles.push(target)
  return target
}

/**
 * Runs something against a database that has never seen anything, which is
 * what a colleague's machine or a build agent is. The edit database is
 * long-lived and shared by every test in this file, and a package it already
 * holds is found by path even when the file behind it is gone, so a first
 * encounter cannot be staged in it.
 *
 * @param {Function} body
 * @returns {Promise} whatever the body returns
 */
async function onAFreshMachine(body) {
  let previous = env.appDirectory()
  let temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zap-cli-edit-state-'))
  env.setAppDirectory(temporary)
  try {
    return await body()
  } finally {
    env.setAppDirectory(previous)
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}

/**
 * Adds a custom XML entry to a .zap file's package list without loading it,
 * which is the state a file arrives in when the XML it names is not there.
 *
 * @param {string} file
 * @param {string} xmlName Path as it should appear, relative to the .zap.
 */
function declareCustomXml(file, xmlName) {
  let json = JSON.parse(fs.readFileSync(file, 'utf8'))
  json.package.push({
    pathRelativity: 'relativeToZap',
    path: xmlName,
    type: 'zcl-xml-standalone'
  })
  fs.writeFileSync(file, JSON.stringify(json, null, 2))
}

test('cli edit: parses a nested subcommand into an operation', () => {
  let argv = cliCommands.parseEditCommandLine([
    '/usr/bin/node',
    '/somewhere/main.js',
    'edit',
    'cluster',
    'enable',
    'light.zap',
    '--endpoint',
    '1',
    '--cluster',
    'On/Off',
    '--side',
    'server'
  ])
  expect(argv.editOperation).toBe('cluster.enable')
  expect(argv.zapFile).toBe('light.zap')
  expect(argv.endpoint).toBe(1)
  expect(argv.cluster).toBe('On/Off')
  expect(argv.side).toBe('server')
  expect(argv._).toContain('edit')
})

test('cli edit: parses repeated device types and hyphenated options', () => {
  let argv = cliCommands.parseEditCommandLine([
    'node',
    'main.js',
    'edit',
    'endpoint',
    'create',
    'light.zap',
    '--endpoint',
    '2',
    '--device-type',
    'MA-onofflight',
    '--device-type',
    'MA-dimmablelight',
    '--device-version',
    '1'
  ])
  expect(argv.editOperation).toBe('endpoint.create')
  expect(argv.deviceType).toEqual(['MA-onofflight', 'MA-dimmablelight'])
  expect(argv.deviceVersion).toEqual([1])
})

test('cli edit: reads a batch script from stdin when asked with a dash', () => {
  // yargs-parser treats a lone dash as a positional rather than the value of
  // the option before it, so this needs putting back together.
  let spaced = cliCommands.parseEditCommandLine([
    'node',
    'main.js',
    'edit',
    'apply',
    'light.zap',
    '--script',
    '-'
  ])
  expect(spaced.script).toBe('-')
  expect(spaced._).not.toContain('-')

  let joined = cliCommands.parseEditCommandLine([
    'node',
    'main.js',
    'edit',
    'apply',
    'light.zap',
    '--script=-'
  ])
  expect(joined.script).toBe('-')

  // An genuinely empty value is still an error rather than stdin.
  let empty = cliCommands.parseEditCommandLine([
    'node',
    'main.js',
    'edit',
    'apply',
    'light.zap',
    '--script',
    ''
  ])
  expect(empty.script).toBe('')
})

test(
  'cli edit: arguments that never reached the edit parser are reported',
  async () => {
    // `edit` is parsed by its own parser. Reaching the runner with no
    // operation attached (for example via `zap --flag edit` without a nested
    // subcommand) used to fail with a type error deep inside it.
    let argv = args({ zapFile: testUtil.zigbeeTestFile.onOff })
    delete argv.editOperation

    let { code, errors } = await (async () => {
      let out = ''
      let err = ''
      let result = await startup.startEdit(argv, {
        printer: (t) => (out += t + '\n'),
        errorPrinter: (t) => (err += t + '\n'),
        logger: () => {}
      })
      return { code: result, output: out, errors: err }
    })()

    expect(code).toBe(1)
    expect(errors).toContain('No operation')
  },
  testUtil.timeout.long()
)

test('cli edit: recognizes the edit command among leading global options', () => {
  expect(
    cliCommands.isEditCommandLine([
      '/usr/bin/node',
      '/opt/zap/main.js',
      'edit',
      'endpoint',
      'list'
    ])
  ).toBeTruthy()
  // Callers do not agree on whether the interpreter and script are included.
  expect(
    cliCommands.isEditCommandLine(['edit', 'endpoint', 'list'])
  ).toBeTruthy()
  expect(
    cliCommands.isEditCommandLine(['/opt/zap/zap-cli.exe', 'edit', 'info'])
  ).toBeTruthy()

  // Global options may precede edit; boolean flags leave the command in place,
  // and flags that take a value consume their following token.
  expect(
    cliCommands.isEditCommandLine([
      'node',
      'main.js',
      '--logToStdout',
      'edit',
      'endpoint',
      'list'
    ])
  ).toBeTruthy()
  expect(
    cliCommands.isEditCommandLine([
      'node',
      'main.js',
      '--stateDirectory',
      '/tmp/zap-state',
      'edit',
      'endpoint',
      'list'
    ])
  ).toBeTruthy()
  expect(
    cliCommands.isEditCommandLine([
      'node',
      'main.js',
      '--stateDirectory=/tmp/zap-state',
      'edit',
      'endpoint',
      'list'
    ])
  ).toBeTruthy()

  let withLeading = cliCommands.parseEditCommandLine([
    'node',
    'main.js',
    '--logToStdout',
    '--format',
    'json',
    'edit',
    'endpoint',
    'list',
    'light.zap'
  ])
  expect(withLeading.editOperation).toBe('endpoint.list')
  expect(withLeading.logToStdout).toBe(true)
  expect(withLeading.format).toBe('json')
  expect(withLeading.zapFile).toBe('light.zap')

  expect(
    cliCommands.isEditCommandLine(['node', 'main.js', 'generate', 'a.zap'])
  ).toBeFalsy()
  expect(
    cliCommands.isEditCommandLine(['node', 'main.js', 'light.zap'])
  ).toBeFalsy()
  // The word edit as the value of an option is not the edit command.
  expect(
    cliCommands.isEditCommandLine(['node', 'main.js', '--output', 'edit'])
  ).toBeFalsy()
})

test('cli edit: reports only the validation findings an edit introduces', () => {
  let before = {
    endpoints: [],
    attributes: [
      {
        endpointIdentifierLabel: '1',
        clusterName: 'On/Off',
        attributeName: 'x',
        issues: ['Out of range']
      }
    ],
    conformance: []
  }
  let after = {
    endpoints: [],
    attributes: [
      {
        endpointIdentifierLabel: '1',
        clusterName: 'On/Off',
        attributeName: 'x',
        issues: ['Out of range']
      },
      {
        endpointIdentifierLabel: '2',
        clusterName: 'Level Control',
        attributeName: 'y',
        issues: ['Out of range']
      }
    ],
    conformance: []
  }
  let diff = cliOutput.diffValidation(before, after)
  expect(diff.newErrors).toBe(1)
  expect(diff.preExistingErrors).toBe(1)
  expect(diff.issues).toHaveLength(1)
  expect(diff.issues[0]).toContain('Level Control')

  let unchanged = cliOutput.diffValidation(before, before)
  expect(unchanged.newErrors).toBe(0)
  expect(unchanged.headline).toContain('no new issues')
})

test('cli edit: describes every operation it can actually run', () => {
  let schema = cliHelp.describeCli()
  let described = schema.operations
    .map((o) => o.operation)
    // 'new', 'apply' and 'help' are handled by the runner, not the registry.
    .filter((name) => name.includes('.'))
  let implemented = cliOperations.operationNames()

  // The help is generated from the same description the parser is built from,
  // so the only drift left to catch is the description naming an operation
  // that does not exist, or an operation that nothing exposes.
  expect(described.sort()).toEqual(implemented.sort())
})

test('cli edit: the modules depend on each other in one direction only', () => {
  // The layering is the load-bearing part of this design: nothing here writes
  // SQL, so every module has to be reachable from the entry point without
  // passing through a cycle. Read the requires and check that, rather than
  // trusting a diagram in a document.
  let dir = path.join(__dirname, '..', 'src-electron', 'cli')
  let dependencies = {}
  for (let file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    let source = fs.readFileSync(path.join(dir, file), 'utf8')
    let name = path.basename(file, '.js')
    dependencies[name] = [...source.matchAll(/require\('\.\/([\w-]+)\.js'\)/g)]
      .map((match) => match[1])
      .filter((dependency) => dependency !== name)
    // Nothing in here may talk to the database except through query-* modules,
    // which is what keeps triggers and defaults behaving as they do for the GUI.
    expect(source).not.toMatch(/dbApi\.db(All|Get|Insert|Update|Remove)\(/)
  }

  let visiting = new Set()
  let done = new Set()
  let cycle = null
  let walk = (name, path) => {
    if (done.has(name) || cycle != null) return
    if (visiting.has(name)) {
      cycle = [...path, name].join(' -> ')
      return
    }
    visiting.add(name)
    ;(dependencies[name] || []).forEach((next) => walk(next, [...path, name]))
    visiting.delete(name)
    done.add(name)
  }
  Object.keys(dependencies).forEach((name) => walk(name, []))
  expect(cycle).toBeNull()

  // And the leaves are leaves, so anything may render output or refuse.
  expect(dependencies['cli-error']).toEqual([])
  expect(dependencies['cli-output']).toEqual([])
  expect(dependencies['cli-spec']).toEqual([])
})

test('cli edit: reports the flag and the batch script name of every option', () => {
  let schema = cliHelp.describeCli()
  let set = schema.operations.find((o) => o.operation === 'attribute.set')

  let minInterval = set.options.find((o) => o.flag === '--min-interval')
  expect(minInterval.param).toBe('minInterval')
  expect(minInterval.type).toBe('number')

  let cluster = set.options.find((o) => o.flag === '--cluster')
  expect(cluster.required).toBe(true)

  let storage = set.options.find((o) => o.flag === '--storage')
  expect(storage.choices).toEqual(['RAM', 'NVM', 'External'])

  // Everything an agent needs to drive the tool without guessing.
  expect(schema.batchScript.example[0].op).toBe('endpoint.create')
  expect(schema.notes.length).toBeGreaterThan(0)
  expect(schema.discovery.length).toBeGreaterThan(0)
  expect(
    schema.globalOptions.find((o) => o.flag === '--format').choices
  ).toEqual(['text', 'json'])
})

test('cli edit: help narrows to a group or a single operation', () => {
  let overview = cliHelp.help({ format: 'text' })
  expect(overview).toContain('attribute set')
  expect(overview).toContain('feature enable')

  let group = cliHelp.help({ format: 'text', topic: ['attribute'] })
  expect(group).toContain('zap edit attribute set <file.zap>')
  expect(group).not.toContain('zap edit cluster enable')

  // A topic can be written the way it is typed or the way it is scripted.
  let spaced = cliHelp.help({ format: 'text', topic: ['attribute', 'set'] })
  let dotted = cliHelp.help({ format: 'text', topic: ['attribute.set'] })
  expect(spaced).toBe(dotted)
  expect(spaced).toContain('--reportable-change')

  let json = JSON.parse(
    cliHelp.help({ format: 'json', topic: ['cluster', 'enable'] })
  )
  expect(json.operations).toHaveLength(1)
  expect(json.operations[0].operation).toBe('cluster.enable')

  expect(() => cliHelp.help({ format: 'text', topic: ['nonsense'] })).toThrow(
    /No help topic/
  )
})

test(
  'cli edit: help answers without opening a configuration',
  async () => {
    // No zapFile, and deliberately a ZCL metafile that does not exist: asking
    // what the commands are must not pay for loading any metadata.
    let { code, output } = await edit({
      editOperation: 'help',
      format: 'json',
      zclProperties: ['/nonexistent/zcl.json']
    })
    expect(code).toBe(0)
    let schema = JSON.parse(output)
    expect(schema.operations.length).toBeGreaterThan(20)
    expect(schema.usage).toContain('zap edit')
  },
  testUtil.timeout.short()
)

test('cli edit: keeps stdout clean when the output is machine readable', () => {
  let realLog = console.log
  let realError = console.error
  let onError = []
  try {
    console.error = (...args) => onError.push(args.join(' '))

    cliCommands.routeConsoleForMachineOutput({ format: 'text' })
    expect(console.log).toBe(realLog)

    // Loading a configuration prints progress through console.log from several
    // modules. In json mode that would corrupt the payload, so it has to land
    // on stderr instead.
    cliCommands.routeConsoleForMachineOutput({ format: 'json' })
    expect(console.log).not.toBe(realLog)
    console.log('progress that must not reach stdout')
    expect(onError).toContain('progress that must not reach stdout')
  } finally {
    console.log = realLog
    console.error = realError
  }
})

test(
  'cli edit: lists endpoints of an existing configuration',
  async () => {
    let { code, output } = await edit({
      editOperation: 'endpoint.list',
      zapFile: testUtil.zigbeeTestFile.onOff
    })
    expect(code).toBe(0)
    expect(output).toContain('3 endpoint(s)')
    // A pure query must not rewrite the file it was pointed at.
    expect(output).not.toContain('Saved')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: preserves packages and endpoints across a save',
  async () => {
    // Copied next to the original so the relative package paths in the file
    // still point at the ZCL metafile and the generation templates.
    let file = siblingCopy(
      testUtil.zigbeeTestFile.onOff,
      'cli-edit-round-trip.zap'
    )
    let before = JSON.parse(fs.readFileSync(file, 'utf8'))

    // A query does not save, so force a write with a no-change edit.
    let { code } = await edit({
      editOperation: 'endpoint.update',
      zapFile: file,
      endpoint: 1,
      network: before.endpoints[0].networkId
    })
    expect(code).toBe(0)

    let after = JSON.parse(fs.readFileSync(file, 'utf8'))
    // Editing must not re-point a configuration at different packages the way
    // convert deliberately does, and must not drop the generation template.
    // Package metadata such as version and category is refreshed from the
    // package that was actually loaded, so only the references are compared.
    let references = (state) =>
      state.package.map((p) => `${p.type} ${p.pathRelativity} ${p.path}`).sort()
    expect(references(after)).toEqual(references(before))
    expect(after.endpoints.map((e) => e.endpointId)).toEqual(
      before.endpoints.map((e) => e.endpointId)
    )
    expect(after.endpointTypes.length).toBe(before.endpointTypes.length)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: creates a configuration and builds an endpoint on it',
  async () => {
    let file = path.join(workDir, 'built-from-scratch.zap')

    let created = await edit({ editOperation: 'new', zapFile: file })
    expect(created.code).toBe(0)
    expect(fs.existsSync(file)).toBeTruthy()

    let added = await edit({
      editOperation: 'endpoint.create',
      zapFile: file,
      endpoint: 1,
      deviceType: ['ZLL-onofflight']
    })
    expect(added.code).toBe(0)
    expect(added.output).toContain('Created endpoint 1')

    let listed = await edit({ editOperation: 'endpoint.list', zapFile: file })
    expect(listed.output).toContain('1 endpoint(s)')
    expect(listed.output).toContain('ZLL-onofflight')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: enables a cluster and configures one of its attributes',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'attributes.zap')

    // Endpoint 1 is the switch side of this configuration and has On/off as a
    // client, so it starts without a Level Control server.
    let enabled = await edit({
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Level Control',
      side: 'server'
    })
    expect(enabled.code).toBe(0)
    expect(enabled.output).toContain('Enabled cluster Level Control')

    // Endpoint 2 is the light and already has On/off on the server side.
    let set = await edit({
      editOperation: 'attribute.set',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      attribute: 'on/off',
      enabled: true,
      default: '1',
      storage: 'RAM'
    })
    expect(set.code).toBe(0)
    expect(set.output).toContain('default=1')
    expect(set.output).toContain('storage=RAM')

    let listed = await edit({
      editOperation: 'attribute.list',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      enabledOnly: true,
      format: 'json'
    })
    let rows = JSON.parse(listed.output).operations[0].rows
    let onOff = rows.find((r) => r.code === '0x0000' && r.side === 'server')
    expect(onOff.enabled).toBe('yes')
    expect(onOff.default).toBe('1')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: rejects an out of range default value under --strict',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'strict.zap')
    let before = fs.readFileSync(file, 'utf8')

    let { code, output } = await edit({
      editOperation: 'attribute.set',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      attribute: 'on/off',
      enabled: true,
      default: '0xFFFFFFFF',
      strict: true
    })
    expect(code).toBe(1)
    expect(output).toContain('new error(s)')
    expect(fs.readFileSync(file, 'utf8')).toBe(before)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: refuses to configure an element of a disabled cluster side',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'disabled-side.zap')

    // Endpoint 1 carries On/off as a client only. The saved file format drops
    // everything hanging off a disabled cluster, so this has to be refused
    // rather than accepted and quietly lost.
    let attribute = await edit({
      editOperation: 'attribute.set',
      zapFile: file,
      endpoint: 1,
      cluster: 'On/off',
      attribute: 'on/off',
      enabled: true
    })
    expect(attribute.code).toBe(1)
    expect(attribute.errors).toContain('zap edit cluster enable')

    let command = await edit({
      editOperation: 'command.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'On/off',
      command: 'Toggle',
      direction: 'in'
    })
    expect(command.code).toBe(1)

    // Asking for both directions still does the half that fits.
    let both = await edit({
      editOperation: 'command.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'On/off',
      command: 'Toggle',
      direction: 'both'
    })
    expect(both.code).toBe(0)
    expect(both.output).toContain('Enabled command Toggle (0x02) out')

    // Zigbee still has a Configure page for client-only clusters. Listing the
    // client side has to keep working; the Matter-only guard must not fire.
    let listed = await edit({
      editOperation: 'attribute.list',
      zapFile: file,
      endpoint: 1,
      cluster: 'On/off',
      side: 'client',
      format: 'json'
    })
    expect(listed.code).toBe(0)
    expect(JSON.parse(listed.output).operations[0].rows.length).toBeGreaterThan(
      0
    )
  },
  testUtil.timeout.long()
)

test(
  'cli edit: refuses Matter client-only clusters the way the Configure button does',
  async () => {
    // The GUI greys out Configure when enableServerOnly is on and the cluster
    // is Client only. That flag is Matter features, not Zigbee. The CLI has to
    // refuse the same surface so a script cannot edit what the page never shows.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-matter-client-only.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 21,
      deviceType: ['MA-onofflight']
    })
    expect(created.code).toBe(0)

    // Device types usually bring the server. Leave the client on and take the
    // server off so the cluster is exactly the Client-only state the button
    // disables for.
    await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 21,
      cluster: 'On/Off',
      side: 'client'
    })
    let clientOnly = await edit({
      ...matter,
      editOperation: 'cluster.disable',
      endpoint: 21,
      cluster: 'On/Off',
      side: 'server'
    })
    expect(clientOnly.code).toBe(0)

    let listed = await edit({
      ...matter,
      editOperation: 'attribute.list',
      endpoint: 21,
      cluster: 'On/Off'
    })
    expect(listed.code).toBe(1)
    expect(listed.errors).toContain('client only')
    expect(listed.errors).toContain('zap edit cluster enable')

    let set = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 21,
      cluster: 'On/Off',
      attribute: 'OnOff',
      enabled: true
    })
    expect(set.code).toBe(1)
    expect(set.errors).toContain('client only')

    let command = await edit({
      ...matter,
      editOperation: 'command.list',
      endpoint: 21,
      cluster: 'On/Off'
    })
    expect(command.code).toBe(1)
    expect(command.errors).toContain('client only')

    // Turning the server back on restores the page, and listing works again.
    let restored = await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 21,
      cluster: 'On/Off',
      side: 'server'
    })
    expect(restored.code).toBe(0)

    let again = await edit({
      ...matter,
      editOperation: 'attribute.list',
      endpoint: 21,
      cluster: 'On/Off',
      format: 'json'
    })
    expect(again.code).toBe(0)
    expect(JSON.parse(again.output).operations[0].rows.length).toBeGreaterThan(
      0
    )
  },
  testUtil.timeout.long()
)

test(
  'cli edit: matches names loosely and reports unknown ones helpfully',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'lookup.zap')

    // 'onoff' has neither the slash nor the casing of the real cluster name.
    let loose = await edit({
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'onoff',
      side: 'server'
    })
    expect(loose.code).toBe(0)
    expect(loose.output).toContain('0x0006')

    // The same cluster addressed by its code.
    let byCode = await edit({
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: '0x0006',
      side: 'server'
    })
    expect(byCode.code).toBe(0)

    let missing = await edit({
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Not A Real Cluster',
      side: 'server'
    })
    expect(missing.code).toBe(1)
    expect(missing.errors).toContain('Did you mean')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: enables and disables commands',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'commands.zap')

    let enabled = await edit({
      editOperation: 'command.enable',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      command: 'Toggle',
      direction: 'in'
    })
    expect(enabled.code).toBe(0)
    expect(enabled.output).toContain('Enabled command Toggle')

    let listed = await edit({
      editOperation: 'command.list',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      format: 'json'
    })
    let toggle = JSON.parse(listed.output).operations[0].rows.find(
      (r) => r.name === 'Toggle'
    )
    expect(toggle.in).toBe('yes')

    let disabled = await edit({
      editOperation: 'command.disable',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      command: 'Toggle',
      direction: 'in'
    })
    expect(disabled.code).toBe(0)

    let afterDisable = await edit({
      editOperation: 'command.list',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      format: 'json'
    })
    expect(
      JSON.parse(afterDisable.output).operations[0].rows.find(
        (r) => r.name === 'Toggle'
      ).in
    ).toBe('no')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: adds and removes device types on an endpoint',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'devicetypes.zap')

    let added = await edit({
      editOperation: 'devicetype.add',
      zapFile: file,
      endpoint: 1,
      deviceType: ['ZLL-onofflight']
    })
    expect(added.code).toBe(0)

    let listed = await edit({
      editOperation: 'devicetype.list',
      zapFile: file,
      endpoint: 1,
      format: 'json'
    })
    let rows = JSON.parse(listed.output).operations[0].rows
    expect(rows.some((r) => r.name === 'ZLL-onofflight')).toBeTruthy()

    let removed = await edit({
      editOperation: 'devicetype.remove',
      zapFile: file,
      endpoint: 1,
      deviceType: ['ZLL-onofflight']
    })
    // The endpoint had no other device type, so removing the only one must be
    // refused rather than leaving an endpoint that generates nothing.
    expect(removed.code).toBe(rows.length > 1 ? 0 : 1)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: adding a device type brings in everything it would have brought in at creation',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-devicetype-defaults.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    // One endpoint built with both device types at once, and one built with
    // the first and extended with the second afterwards. The two paths run
    // through different queries, so they are compared rather than assumed.
    let together = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 11,
      deviceType: ['MA-onofflight', 'MA-dimmablelight']
    })
    expect(together.code).toBe(0)

    let stepwise = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 12,
      deviceType: ['MA-onofflight']
    })
    expect(stepwise.code).toBe(0)

    let beforeAdd = await edit({
      ...matter,
      editOperation: 'cluster.list',
      endpoint: 12,
      enabledOnly: true,
      format: 'json'
    })
    let clustersBefore = JSON.parse(beforeAdd.output).operations[0].rows.length

    let added = await edit({
      ...matter,
      editOperation: 'devicetype.add',
      endpoint: 12,
      deviceType: ['MA-dimmablelight']
    })
    expect(added.code).toBe(0)

    let enabledClusters = async (endpoint) => {
      let listed = await edit({
        ...matter,
        editOperation: 'cluster.list',
        endpoint: endpoint,
        enabledOnly: true,
        format: 'json'
      })
      return JSON.parse(listed.output)
        .operations[0].rows.map((r) => `${r.code}/${r.side}`)
        .sort()
    }
    let enabledAttributes = async (endpoint, cluster) => {
      let listed = await edit({
        ...matter,
        editOperation: 'attribute.list',
        endpoint: endpoint,
        cluster: cluster,
        enabledOnly: true,
        format: 'json'
      })
      return JSON.parse(listed.output)
        .operations[0].rows.map((r) => `${r.code}/${r.side}`)
        .sort()
    }

    let clusters11 = await enabledClusters(11)
    let clusters12 = await enabledClusters(12)
    expect(clusters12).toEqual(clusters11)
    // The added device type has to have contributed something, or the
    // comparison above would pass for the wrong reason.
    expect(clusters12.length).toBeGreaterThan(clustersBefore)

    expect(await enabledAttributes(12, 'Level Control')).toEqual(
      await enabledAttributes(11, 'Level Control')
    )
  },
  testUtil.timeout.long()
)

test(
  'cli edit: duplicates and deletes endpoints',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'endpoints.zap')

    let duplicated = await edit({
      editOperation: 'endpoint.duplicate',
      zapFile: file,
      endpoint: 1
    })
    expect(duplicated.code).toBe(0)

    let afterDuplicate = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(afterDuplicate.endpoints.length).toBe(4)

    let deleted = await edit({
      editOperation: 'endpoint.delete',
      zapFile: file,
      endpoint: 1,
      force: true
    })
    expect(deleted.code).toBe(0)

    let afterDelete = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(afterDelete.endpoints.length).toBe(3)
    expect(afterDelete.endpoints.map((e) => e.endpointId)).not.toContain(1)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: refuses edits that would corrupt the configuration',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-guards.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 3,
      deviceType: ['MA-onofflight']
    })
    await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 4,
      deviceType: ['MA-onofflight'],
      parent: 3
    })

    // Endpoint composition is a tree. Putting 3 under its own child 4 would
    // make walking the parent chain during generation loop forever.
    let cycle = await edit({
      ...matter,
      editOperation: 'endpoint.update',
      endpoint: 3,
      parent: 4
    })
    expect(cycle.code).toBe(1)
    expect(cycle.errors).toContain('loop')

    let self = await edit({
      ...matter,
      editOperation: 'endpoint.update',
      endpoint: 3,
      parent: 3
    })
    expect(self.code).toBe(1)

    // Deleting a parent orphans its children, so it needs --force. The rows
    // from selectAllEndpoints expose the link as parentRef (not
    // parentEndpointRef), and this refusal is how that mapping is pinned.
    let blocked = await edit({
      ...matter,
      editOperation: 'endpoint.delete',
      endpoint: 3
    })
    expect(blocked.code).toBe(1)
    expect(blocked.errors).toContain('parent')
    expect(blocked.errors).toContain('--force')
    let stillThere = await edit({
      ...matter,
      editOperation: 'endpoint.list',
      format: 'json'
    })
    expect(
      JSON.parse(stillThere.output).operations[0].rows.map((r) => r.endpoint)
    ).toEqual(expect.arrayContaining([3, 4]))

    // Detaching is allowed, and is how you break out of the above.
    let detach = await edit({
      ...matter,
      editOperation: 'endpoint.update',
      endpoint: 4,
      parent: ''
    })
    expect(detach.code).toBe(0)
    let after = await edit({
      ...matter,
      editOperation: 'endpoint.list',
      format: 'json'
    })
    expect(
      JSON.parse(after.output).operations[0].rows.find((r) => r.endpoint === 4)
        .parent
    ).toBe('')

    // The column write turns an empty string into 0, so an empty default has
    // to be refused rather than quietly storing a different value.
    let emptyDefault = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 3,
      cluster: 'On/Off',
      attribute: 'OnOff',
      default: ''
    })
    expect(emptyDefault.code).toBe(1)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: a failing step in a batch leaves the file untouched',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'atomic.zap')
    let before = fs.readFileSync(file, 'utf8')
    let script = path.join(workDir, 'half-bad.yaml')
    fs.writeFileSync(
      script,
      `- op: cluster.enable
  endpoint: 2
  cluster: Level Control
  side: server
- op: cluster.enable
  endpoint: 2
  cluster: No Such Cluster
  side: server
`
    )

    let applied = await edit({
      editOperation: 'apply',
      zapFile: file,
      script: script
    })
    expect(applied.code).toBe(1)
    // The first operation succeeded in memory, but nothing is written unless
    // the whole script does, so the file must be exactly as it was.
    expect(fs.readFileSync(file, 'utf8')).toBe(before)

    let empty = path.join(workDir, 'empty.yaml')
    fs.writeFileSync(empty, '')
    let nothing = await edit({
      editOperation: 'apply',
      zapFile: file,
      script: empty
    })
    expect(nothing.code).toBe(0)
    expect(nothing.output).toContain('no operations')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: explains a command direction that cannot be recorded',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'either-source.zap')
    // Some commands are declared with source "either", which leaves the
    // outgoing direction with no cluster side to be recorded against.
    let selector = {
      zapFile: file,
      endpoint: 2,
      cluster: 'ISO 7816 Protocol Tunnel',
      command: 'TransferApdu'
    }
    await edit({
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 2,
      cluster: 'ISO 7816 Protocol Tunnel',
      side: 'both'
    })

    let incoming = await edit({
      ...selector,
      editOperation: 'command.enable',
      direction: 'in'
    })
    expect(incoming.code).toBe(0)

    let outgoing = await edit({
      ...selector,
      editOperation: 'command.enable',
      direction: 'out'
    })
    expect(outgoing.code).toBe(1)
    expect(outgoing.errors).toContain("source 'either'")

    // Asking for both still does the half that can be expressed.
    let both = await edit({
      ...selector,
      editOperation: 'command.enable',
      direction: 'both'
    })
    expect(both.code).toBe(0)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: says what is wrong with a file it cannot read',
  async () => {
    let notAConfiguration = path.join(workDir, 'not-a-configuration.zap')
    fs.writeFileSync(notAConfiguration, '{"hello":"world"}')
    let json = await edit({
      editOperation: 'endpoint.list',
      zapFile: notAConfiguration
    })
    expect(json.code).toBe(1)
    expect(json.errors).toContain('could not be read as a configuration')

    let corrupt = path.join(workDir, 'corrupt.zap')
    fs.writeFileSync(corrupt, '{ not json at all')
    let broken = await edit({
      editOperation: 'endpoint.list',
      zapFile: corrupt
    })
    expect(broken.code).toBe(1)
    expect(broken.errors).toContain('could not be read as a configuration')

    let missing = await edit({
      editOperation: 'endpoint.list',
      zapFile: path.join(workDir, 'nowhere.zap')
    })
    expect(missing.code).toBe(1)
    expect(missing.errors).toContain('No such file')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: refuses to create an endpoint that already exists',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'duplicate-id.zap')
    let { code } = await edit({
      editOperation: 'endpoint.create',
      zapFile: file,
      endpoint: 1,
      deviceType: ['ZLL-onofflight']
    })
    expect(code).toBe(1)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: applies a batch script in one pass',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'batch.zap')
    let script = path.join(workDir, 'changes.yaml')
    fs.writeFileSync(
      script,
      `- op: cluster.enable
  endpoint: 2
  cluster: Level Control
  side: server
- op: attribute.set
  endpoint: 2
  cluster: Level Control
  attribute: current level
  enabled: true
  default: "5"
- op: command.enable
  endpoint: 2
  cluster: Level Control
  command: Move
  direction: in
`
    )

    let applied = await edit({
      editOperation: 'apply',
      zapFile: file,
      script: script
    })
    expect(applied.code).toBe(0)
    expect(applied.output).toContain('Enabled cluster Level Control')
    expect(applied.output).toContain('default=5')
    expect(applied.output).toContain('Enabled command Move')
    expect(applied.output).toContain('Saved')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: rejects a batch script naming an unknown operation',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'bad-batch.zap')
    let script = path.join(workDir, 'bad.yaml')
    fs.writeFileSync(script, `- op: cluster.explode\n  endpoint: 1\n`)

    let { code } = await edit({
      editOperation: 'apply',
      zapFile: file,
      script: script
    })
    expect(code).toBe(1)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: dry run reports the change but leaves the file alone',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'dry-run.zap')
    let before = fs.readFileSync(file, 'utf8')

    let { code, output } = await edit({
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Level Control',
      side: 'server',
      dryRun: true
    })
    expect(code).toBe(0)
    expect(output).toContain('Enabled cluster Level Control')
    expect(output).not.toContain('Saved')
    expect(fs.readFileSync(file, 'utf8')).toBe(before)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: writes elsewhere when an output file is given',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'source.zap')
    let target = path.join(workDir, 'nested', 'target.zap')
    let before = fs.readFileSync(file, 'utf8')

    let { code } = await edit({
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Level Control',
      side: 'server',
      output: target
    })
    expect(code).toBe(0)
    expect(fs.existsSync(target)).toBeTruthy()
    expect(fs.readFileSync(file, 'utf8')).toBe(before)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: suggests a runnable next command built from real values',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'suggestions.zap')

    let listed = await edit({
      editOperation: 'cluster.list',
      zapFile: file,
      endpoint: 2,
      enabledOnly: true
    })
    expect(listed.output).toContain('Next:')
    // The suggestion has to name this file and a cluster that is really on
    // this endpoint, so it can be run exactly as printed.
    let suggested = listed.output
      .split('\n')
      .find((line) => line.trim().startsWith('zap edit attribute list'))
    expect(suggested).toContain(file)
    expect(suggested).toMatch(/--endpoint 2/)

    // Names with spaces have to come back quoted.
    let quoted = await edit({
      editOperation: 'attribute.list',
      zapFile: file,
      endpoint: 2,
      cluster: 'Level Control'
    })
    expect(quoted.output).toContain('--cluster "Level Control"')

    // A filter that matches nothing should offer to widen the search rather
    // than suggest acting on a row that is not there.
    let empty = await edit({
      editOperation: 'attribute.list',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      filter: 'nothingmatchesthis'
    })
    expect(empty.output).toContain('0 attribute(s)')
    expect(empty.output).toContain('Next:')
    expect(empty.output).not.toContain('--filter')

    let silent = await edit({
      editOperation: 'cluster.list',
      zapFile: file,
      endpoint: 2,
      suggest: false
    })
    expect(silent.output).not.toContain('Next:')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: never suggests turning off something the device type requires',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-safe-suggestions.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 9,
      deviceType: ['MA-dimmablelight']
    })

    let listed = await edit({
      ...matter,
      editOperation: 'feature.list',
      endpoint: 9,
      cluster: 'Level Control',
      format: 'json'
    })
    let parsed = JSON.parse(listed.output).operations[0]
    let mandatory = parsed.rows.filter(
      (r) => r.conformance === 'M' && r.enabled === 'yes'
    )
    expect(mandatory.length).toBeGreaterThan(0)

    // Whatever it proposes, it must not be to switch a feature off.
    ;(parsed.nextSteps || []).forEach((step) =>
      expect(step).not.toContain('feature disable')
    )
  },
  testUtil.timeout.long()
)

test(
  'cli edit: filters a catalog listing down to what was asked for',
  async () => {
    let everything = await edit({
      editOperation: 'cluster.list',
      zapFile: testUtil.zigbeeTestFile.onOff,
      all: true,
      format: 'json'
    })
    let all = JSON.parse(everything.output).operations[0].rows
    expect(all.length).toBeGreaterThan(50)

    let filtered = await edit({
      editOperation: 'cluster.list',
      zapFile: testUtil.zigbeeTestFile.onOff,
      all: true,
      filter: 'level',
      format: 'json'
    })
    let some = JSON.parse(filtered.output).operations[0].rows
    expect(some.length).toBeGreaterThan(0)
    expect(some.length).toBeLessThan(all.length)
    expect(some.every((r) => r.name.toLowerCase().includes('level'))).toBe(true)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: emits machine readable output on request',
  async () => {
    let { code, output } = await edit({
      editOperation: 'endpoint.list',
      zapFile: testUtil.zigbeeTestFile.onOff,
      format: 'json'
    })
    expect(code).toBe(0)
    let parsed = JSON.parse(output)
    expect(parsed.operations[0].operation).toBe('endpoint.list')
    expect(parsed.operations[0].rows.length).toBe(3)
    expect(parsed.savedTo).toBeNull()
  },
  testUtil.timeout.long()
)

test(
  'cli edit: toggles a matter feature and the elements its conformance requires',
  async () => {
    // Copied next to the original so the .zap file's own package references
    // still resolve, which is what makes the Matter conformance data load.
    let file = siblingCopy(
      testUtil.matterTestFile.switch,
      'cli-edit-features.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let enabledCluster = await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 1,
      cluster: 'On/Off',
      side: 'server'
    })
    expect(enabledCluster.code).toBe(0)

    let listed = await edit({
      ...matter,
      editOperation: 'feature.list',
      endpoint: 1,
      cluster: 'On/Off',
      format: 'json'
    })
    let rows = JSON.parse(listed.output).operations[0].rows
    expect(rows.find((r) => r.code === 'OFFONLY').enabled).toBe('no')

    // OffOnly means the cluster stops accepting On and Toggle, so turning it
    // on has to disable those commands the way the GUI's confirmation does.
    let enabled = await edit({
      ...matter,
      editOperation: 'feature.enable',
      endpoint: 1,
      cluster: 'On/Off',
      feature: 'OffOnly'
    })
    expect(enabled.code).toBe(0)
    expect(enabled.output).toContain('disabled command On')
    expect(enabled.output).toContain('disabled command Toggle')

    let after = await edit({
      ...matter,
      editOperation: 'feature.list',
      endpoint: 1,
      cluster: 'On/Off',
      format: 'json'
    })
    expect(
      JSON.parse(after.output).operations[0].rows.find(
        (r) => r.code === 'OFFONLY'
      ).enabled
    ).toBe('yes')

    // Lighting and OffOnly exclude each other, so this one has to be refused.
    let conflicting = await edit({
      ...matter,
      editOperation: 'feature.enable',
      endpoint: 1,
      cluster: 'On/Off',
      feature: 'LT'
    })
    expect(conflicting.code).toBe(1)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: judges a feature by the conformance of the endpoint device type',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-dt-conformance.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 7,
      deviceType: ['MA-dimmablelight']
    })
    expect(created.code).toBe(0)

    let listed = await edit({
      ...matter,
      editOperation: 'feature.list',
      endpoint: 7,
      cluster: 'On/Off',
      format: 'json'
    })
    let lighting = JSON.parse(listed.output).operations[0].rows.find(
      (r) => r.code === 'LT'
    )
    // The On/Off cluster makes Lighting conditional, but a Dimmable Light
    // makes it mandatory, and the device type is the one that applies here.
    expect(lighting.conformance).toBe('M')
    expect(lighting.requiredBy).toContain('Dimmable Light')
    expect(lighting.enabled).toBe('yes')

    let disabled = await edit({
      ...matter,
      editOperation: 'feature.disable',
      endpoint: 7,
      cluster: 'On/Off',
      feature: 'LT'
    })
    expect(disabled.code).toBe(0)
    expect(disabled.output).toContain('mandatory for device type')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: counts what a feature toggle drags along, and stops warning once it is satisfied',
  async () => {
    // The GUI says how much a feature costs by listing the elements in its
    // confirmation dialog. A count of them is the same answer in the form a
    // caller reads first, and it has to agree with the list underneath it.
    //
    // It also only pops up the compliance warning when displayWarning says to.
    // The warning text is composed either way, and after an enable that
    // satisfies a mandatory conformance it reads as though the enable had not
    // happened, which is exactly the false belief an agent would build on.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-feature-counts.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 8,
      deviceType: ['MA-dimmablelight']
    })
    expect(created.code).toBe(0)

    let lighting = (enabled) =>
      edit({
        ...matter,
        editOperation: enabled ? 'feature.enable' : 'feature.disable',
        endpoint: 8,
        cluster: 'On/Off',
        feature: 'LT'
      })

    let countOf = (output, state, kind) =>
      output
        .split('\n')
        .filter((line) => line.trim() === `${state} ${kind}`.trim()).length
    let listed = (output, state, kind) =>
      output
        .split('\n')
        .filter((line) => line.startsWith(`  ${state} ${kind} `)).length

    let off = await lighting(false)
    expect(off.code).toBe(0)
    let summary =
      /Its conformance (\d+) attributes and (\d+) commands disabled:/
    expect(off.output).toMatch(summary)
    let counted = summary.exec(off.output)
    expect(listed(off.output, 'disabled', 'attribute')).toBe(Number(counted[1]))
    expect(listed(off.output, 'disabled', 'command')).toBe(Number(counted[2]))
    expect(countOf(off.output, 'disabled', 'attribute')).toBe(0)
    // Switching off a feature the device type requires is worth saying.
    expect(off.output).toContain('should be enabled, as it is mandatory')

    let on = await lighting(true)
    expect(on.code).toBe(0)
    expect(on.output).toMatch(
      /Its conformance (\d+) attributes and (\d+) commands enabled:/
    )
    // The rule is now met, so repeating it would only mislead.
    expect(on.output).not.toContain('should be enabled, as it is mandatory')
  },
  testUtil.timeout.long()
)

test('cli edit: a feature that declares no conformance requires nothing', () => {
  // Much of the newer Matter data model leaves conformance off a feature
  // altogether. Reading that as an expression to evaluate crashed the toggle
  // with a type error, which is the one outcome a command line must never
  // produce: no answer, and a stack trace instead of a reason.
  let evaluate = (expression) =>
    conformEvaluator.evaluateConformanceExpression(expression, { LT: true })
  expect(evaluate(null)).toBe('optional')
  expect(evaluate(undefined)).toBe('optional')
  expect(evaluate('')).toBe('optional')
  expect(evaluate('M')).toBe('mandatory')

  // And the same shape reaching the checker, which is the path a toggle takes.
  let elements = {
    attributes: [{ id: 1, name: 'DoorState', conformance: null, included: 1 }],
    commands: [{ id: 2, name: 'UnboltDoor', conformance: null, isEnabled: 1 }],
    events: [{ id: 3, name: 'DoorStateChange', conformance: null, included: 0 }]
  }
  let feature = {
    code: 'DPS',
    name: 'DoorPositionSensor',
    bit: 5,
    conformance: null,
    cluster: 'Door Lock'
  }
  let checked = conformChecker.checkElementConformance(
    elements,
    { DPS: true },
    feature,
    1,
    [feature]
  )
  expect(checked.disableChange).toBe(false)
  expect(checked.attributesToUpdate).toEqual([])
  expect(checked.commandsToUpdate).toEqual([])
  expect(checked.eventsToUpdate).toEqual([])
})

test(
  'cli edit: will not start fresh on top of an existing configuration',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'occupied.zap')
    let before = fs.readFileSync(file, 'utf8')

    // Starting from empty and saving would replace what is there, which is not
    // something to do on the strength of a mistyped file name.
    let refused = await edit({ editOperation: 'new', zapFile: file })
    expect(refused.code).toBe(1)
    expect(refused.errors).toContain('already holds a configuration')
    expect(fs.readFileSync(file, 'utf8')).toBe(before)

    // The same protection covers building from scratch with a script.
    let script = path.join(workDir, 'nothing.yaml')
    fs.writeFileSync(script, '[]')
    let alsoRefused = await edit({
      editOperation: 'apply',
      zapFile: file,
      script: script,
      new: true
    })
    expect(alsoRefused.code).toBe(1)
    expect(fs.readFileSync(file, 'utf8')).toBe(before)

    // Writing elsewhere is fine, and leaves the original alone.
    let elsewhere = path.join(workDir, 'fresh.zap')
    let allowed = await edit({
      editOperation: 'new',
      zapFile: file,
      output: elsewhere
    })
    expect(allowed.code).toBe(0)
    expect(fs.readFileSync(file, 'utf8')).toBe(before)

    // And --force is the way to say you meant it.
    let forced = await edit({
      editOperation: 'new',
      zapFile: file,
      force: true
    })
    expect(forced.code).toBe(0)
    expect(JSON.parse(fs.readFileSync(file, 'utf8')).endpoints).toHaveLength(0)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: gives a new matter configuration its root node',
  async () => {
    let matterFile = path.join(workDir, 'root-node.zap')
    let created = await edit({
      ...matterPackages,
      editOperation: 'new',
      zapFile: matterFile
    })
    expect(created.code).toBe(0)
    expect(created.output).toContain('Root Node')

    let state = JSON.parse(fs.readFileSync(matterFile, 'utf8'))
    expect(state.endpoints).toHaveLength(1)
    expect(state.endpoints[0].endpointId).toBe(0)
    expect(state.endpoints[0].parentEndpointIdentifier).toBeNull()
    expect(state.endpointTypes[0].deviceTypes.map((d) => d.code)).toContain(
      0x0016
    )

    // Opting out has to leave the configuration genuinely empty.
    let bare = path.join(workDir, 'root-node-opt-out.zap')
    let optedOut = await edit({
      ...matterPackages,
      editOperation: 'new',
      zapFile: bare,
      rootNode: false
    })
    expect(optedOut.code).toBe(0)
    expect(JSON.parse(fs.readFileSync(bare, 'utf8')).endpoints).toHaveLength(0)

    // Zigbee declares no root node device type, so nothing should appear.
    let zigbeeFile = path.join(workDir, 'zigbee-no-root-node.zap')
    let zigbee = await edit({ editOperation: 'new', zapFile: zigbeeFile })
    expect(zigbee.code).toBe(0)
    expect(zigbee.output).not.toContain('Root Node')
    expect(
      JSON.parse(fs.readFileSync(zigbeeFile, 'utf8')).endpoints
    ).toHaveLength(0)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: keeps the parent of a composed endpoint across an edit',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.endpointComposition,
      'cli-edit-composition.zap'
    )
    let before = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(
      before.endpoints.find((e) => e.endpointId === 2).parentEndpointIdentifier
    ).toBe(1)

    let listed = await edit({
      ...matterPackages,
      editOperation: 'endpoint.list',
      zapFile: file,
      format: 'json'
    })
    let rows = JSON.parse(listed.output).operations[0].rows
    expect(rows.find((r) => r.endpoint === 2).parent).toBe(1)

    let edited = await edit({
      ...matterPackages,
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 2,
      cluster: 'Identify',
      side: 'server'
    })
    expect(edited.code).toBe(0)

    let after = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(
      after.endpoints.map((e) => [e.endpointId, e.parentEndpointIdentifier])
    ).toEqual(
      before.endpoints.map((e) => [e.endpointId, e.parentEndpointIdentifier])
    )
  },
  testUtil.timeout.long()
)

test(
  'cli edit: shares the state of a zigbee cluster across the endpoints that enable it',
  async () => {
    // In Zigbee a cluster's configuration is one global thing: the same cluster
    // on two endpoints includes the same attributes, with the same storage and
    // defaults, and the framework keeps one copy. The user interface re-aligns
    // the endpoints after every change, so editing without that step wrote
    // files the interface would never have produced.
    let file = siblingCopy(
      testUtil.zigbeeTestFile.threeEp,
      'cli-edit-shared-zigbee.zap'
    )
    let zigbee = { ...zigbeePackages, zapFile: file }

    let identifyTime = async (endpoint) => {
      let listed = await edit({
        ...zigbee,
        editOperation: 'attribute.list',
        endpoint: endpoint,
        cluster: 'Identify',
        side: 'server',
        format: 'json'
      })
      expect(listed.code).toBe(0)
      return JSON.parse(listed.output).operations[0].rows.find(
        (r) => `${r.code}` === '0x0000' && r.side === 'server'
      )
    }

    // Endpoints 42 and 43 both enable Identify, which is what makes them
    // share it.
    expect((await identifyTime(42)).storage).toBe('RAM')
    expect((await identifyTime(43)).storage).toBe('RAM')

    let changed = await edit({
      ...zigbee,
      editOperation: 'attribute.set',
      endpoint: 42,
      cluster: 'Identify',
      attribute: 'identify time',
      side: 'server',
      enabled: true,
      storage: 'NVM',
      default: '7'
    })
    expect(changed.code).toBe(0)

    // The endpoint that was not named follows the one that was.
    let asked = await identifyTime(42)
    let other = await identifyTime(43)
    expect(asked.storage).toBe('NVM')
    expect(other.storage).toBe('NVM')
    expect(`${other.default}`).toBe(`${asked.default}`)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: shares nothing when no loaded template asks for it',
  async () => {
    // The companion of the test above, and the one that shows what decides.
    // Same Zigbee data model, same two endpoints, same cluster: only the
    // generator option is gone, and with it the sharing. Nothing here reasons
    // from the word "zigbee".
    let templates = siblingCopy(
      env.locateProjectResource(testUtil.testTemplate.zigbee),
      'cli-edit-templates-without-sharing.json'
    )
    let metafile = JSON.parse(fs.readFileSync(templates, 'utf8'))
    delete metafile.options.generator.shareClusterStatesAcrossEndpoints
    fs.writeFileSync(templates, JSON.stringify(metafile, null, 2))

    let file = path.join(workDir, 'cli-edit-unshared-zigbee.zap')
    let zigbee = {
      zclProperties: [env.builtinSilabsZclMetafile()],
      generationTemplate: [templates],
      zapFile: file
    }

    expect((await edit({ ...zigbee, editOperation: 'new' })).code).toBe(0)
    for (let endpoint of [1, 2]) {
      expect(
        (
          await edit({
            ...zigbee,
            editOperation: 'endpoint.create',
            endpoint: endpoint,
            deviceType: ['HA-onofflight']
          })
        ).code
      ).toBe(0)
    }

    let identifyTime = async (endpoint) => {
      let listed = await edit({
        ...zigbee,
        editOperation: 'attribute.list',
        endpoint: endpoint,
        cluster: 'Identify',
        side: 'server',
        format: 'json'
      })
      expect(listed.code).toBe(0)
      return JSON.parse(listed.output).operations[0].rows.find(
        (r) => r.name === 'identify time' && r.side === 'server'
      )
    }

    let changed = await edit({
      ...zigbee,
      editOperation: 'attribute.set',
      endpoint: 1,
      cluster: 'Identify',
      attribute: 'identify time',
      side: 'server',
      enabled: true,
      storage: 'NVM',
      default: '7'
    })
    expect(changed.code).toBe(0)

    expect((await identifyTime(1)).storage).toBe('NVM')
    expect((await identifyTime(2)).storage).toBe('RAM')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: leaves matter endpoints alone, where an attribute is per endpoint',
  async () => {
    // The mirror image of the test above. Matter does not share cluster state,
    // so a change to one endpoint must not reach another, and the Matter
    // storage policy must not be applied to Zigbee either.
    let matterFile = path.join(workDir, 'cli-edit-unshared-matter.zap')
    let matter = { ...matterPackages, zapFile: matterFile }

    expect(
      (
        await edit({
          ...matter,
          editOperation: 'new',
          zapFile: matterFile
        })
      ).code
    ).toBe(0)
    for (let endpoint of [1, 2]) {
      expect(
        (
          await edit({
            ...matter,
            editOperation: 'endpoint.create',
            endpoint: endpoint,
            deviceType: ['MA-onofflight']
          })
        ).code
      ).toBe(0)
    }

    let onOff = async (endpoint) => {
      let listed = await edit({
        ...matter,
        editOperation: 'attribute.list',
        endpoint: endpoint,
        cluster: 'On/Off',
        side: 'server',
        format: 'json'
      })
      return JSON.parse(listed.output).operations[0].rows.find(
        (r) => r.name === 'OnOff' && r.side === 'server'
      )
    }

    let changed = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 1,
      cluster: 'On/Off',
      attribute: 'OnOff',
      side: 'server',
      enabled: true,
      storage: 'NVM'
    })
    expect(changed.code).toBe(0)

    expect((await onOff(1)).storage).toBe('NVM')
    expect((await onOff(2)).storage).toBe('RAM')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: shares only the zigbee half of a multiprotocol configuration',
  async () => {
    let file = siblingCopy(
      testUtil.zigbeeTestFile.multiProtocol,
      'cli-edit-shared-multiprotocol.zap'
    )
    let mp = { ...multiprotocolPackages, zapFile: file }

    // The shipped file has one Zigbee endpoint, so a second one is needed
    // before anything can be shared with it.
    let added = await edit({
      ...mp,
      editOperation: 'endpoint.create',
      endpoint: 7,
      deviceType: ['LO-dimmablelight'],
      category: 'zigbee'
    })
    expect(added.code).toBe(0)

    let onOff = async (endpoint, category, name) => {
      let listed = await edit({
        ...mp,
        editOperation: 'attribute.list',
        endpoint: endpoint,
        cluster: 'On/Off',
        side: 'server',
        category: category,
        format: 'json'
      })
      expect(listed.code).toBe(0)
      return JSON.parse(listed.output).operations[0].rows.find(
        (r) => r.name === name && r.side === 'server'
      )
    }

    let changed = await edit({
      ...mp,
      editOperation: 'attribute.set',
      endpoint: 1,
      cluster: 'On/Off',
      attribute: 'on/off',
      side: 'server',
      category: 'zigbee',
      enabled: true,
      storage: 'NVM'
    })
    expect(changed.code).toBe(0)

    // The other Zigbee endpoint follows, and the Matter one does not.
    expect((await onOff(1, 'zigbee', 'on/off')).storage).toBe('NVM')
    expect((await onOff(7, 'zigbee', 'on/off')).storage).toBe('NVM')
    expect((await onOff(1, 'matter', 'OnOff')).storage).toBe('RAM')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: tells apart the two endpoint 1s of a multiprotocol configuration',
  async () => {
    // Zigbee and Matter each number their endpoints from scratch, so a
    // multiprotocol file legitimately holds two endpoints called 1.
    let file = siblingCopy(
      testUtil.zigbeeTestFile.multiProtocol,
      'cli-edit-multiprotocol.zap'
    )
    let mp = { ...multiprotocolPackages, zapFile: file }

    let listed = await edit({
      ...mp,
      editOperation: 'endpoint.list',
      format: 'json'
    })
    let rows = JSON.parse(listed.output).operations[0].rows
    expect(rows.filter((r) => r.endpoint === 1)).toHaveLength(2)
    // The listing has to say which is which, or it cannot be acted on.
    rows.forEach((r) => expect(r.category).toBeDefined())

    // Without a category there is no honest answer, so it must refuse rather
    // than pick one and edit the wrong protocol's endpoint.
    let ambiguous = await edit({
      ...mp,
      editOperation: 'cluster.list',
      endpoint: 1,
      enabledOnly: true
    })
    expect(ambiguous.code).toBe(1)
    expect(ambiguous.errors).toContain('--category')

    let zigbee = await edit({
      ...mp,
      editOperation: 'cluster.list',
      endpoint: 1,
      enabledOnly: true,
      category: 'zigbee',
      format: 'json'
    })
    expect(zigbee.code).toBe(0)

    let matter = await edit({
      ...mp,
      editOperation: 'cluster.list',
      endpoint: 1,
      enabledOnly: true,
      category: 'matter',
      format: 'json'
    })
    expect(matter.code).toBe(0)

    // Two different endpoints, so two different sets of clusters.
    let clustersOf = (out) =>
      JSON.parse(out)
        .operations[0].rows.map((r) => r.code)
        .sort()
    expect(clustersOf(zigbee.output)).not.toEqual(clustersOf(matter.output))

    // Callers write Matter and Zigbee as often as the lowercase package names.
    let mixedCase = await edit({
      ...mp,
      editOperation: 'cluster.list',
      endpoint: 1,
      enabledOnly: true,
      category: 'Matter',
      format: 'json'
    })
    expect(mixedCase.code).toBe(0)
    expect(clustersOf(mixedCase.output)).toEqual(clustersOf(matter.output))

    let nonsense = await edit({
      ...mp,
      editOperation: 'cluster.list',
      all: true,
      category: 'nonsense'
    })
    expect(nonsense.code).toBe(1)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: enables and disables the remaining element kinds',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'toggles.zap')
    let enabledAttribute = async () => {
      let listed = await edit({
        editOperation: 'attribute.list',
        zapFile: file,
        endpoint: 2,
        cluster: 'On/off',
        format: 'json'
      })
      return JSON.parse(listed.output).operations[0].rows.find(
        (r) => r.name === 'on/off' && r.side === 'server'
      ).enabled
    }

    let disabled = await edit({
      editOperation: 'attribute.disable',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      attribute: 'on/off'
    })
    expect(disabled.code).toBe(0)
    expect(await enabledAttribute()).toBe('no')

    let reenabled = await edit({
      editOperation: 'attribute.enable',
      zapFile: file,
      endpoint: 2,
      cluster: 'On/off',
      attribute: 'on/off'
    })
    expect(reenabled.code).toBe(0)
    expect(await enabledAttribute()).toBe('yes')

    let clusterOff = await edit({
      editOperation: 'cluster.disable',
      zapFile: file,
      endpoint: 2,
      cluster: 'Scenes',
      side: 'server'
    })
    expect(clusterOff.code).toBe(0)
    let clusters = await edit({
      editOperation: 'cluster.list',
      zapFile: file,
      endpoint: 2,
      enabledOnly: true,
      format: 'json'
    })
    expect(
      JSON.parse(clusters.output).operations[0].rows.map((r) => r.name)
    ).not.toContain('Scenes')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: replaces the whole device type list of an endpoint',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-devicetype-set.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 4,
      deviceType: ['MA-onofflight']
    })

    let replaced = await edit({
      ...matter,
      editOperation: 'devicetype.set',
      endpoint: 4,
      deviceType: ['MA-dimmablelight', 'MA-onofflight'],
      deviceVersion: [2]
    })
    expect(replaced.code).toBe(0)

    let listed = await edit({
      ...matter,
      editOperation: 'devicetype.list',
      endpoint: 4,
      format: 'json'
    })
    let rows = JSON.parse(listed.output).operations[0].rows
    // Order matters: the first entry is the primary device type.
    expect(rows.map((r) => r.name)).toEqual([
      'MA-dimmablelight',
      'MA-onofflight'
    ])
    expect(rows.every((r) => r.version === 2)).toBe(true)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: disables a matter event',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.switch,
      'cli-edit-event-disable.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let events = await edit({
      ...matter,
      editOperation: 'event.list',
      endpoint: 1,
      cluster: 'Switch',
      format: 'json'
    })
    let name = JSON.parse(events.output).operations[0].rows[0].name

    await edit({
      ...matter,
      editOperation: 'event.enable',
      endpoint: 1,
      cluster: 'Switch',
      event: name
    })
    let off = await edit({
      ...matter,
      editOperation: 'event.disable',
      endpoint: 1,
      cluster: 'Switch',
      event: name
    })
    expect(off.code).toBe(0)

    let after = await edit({
      ...matter,
      editOperation: 'event.list',
      endpoint: 1,
      cluster: 'Switch',
      format: 'json'
    })
    expect(
      JSON.parse(after.output).operations[0].rows.find((r) => r.name === name)
        .enabled
    ).toBe('no')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: will not pretend to toggle a feature it cannot record',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-featuremap.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 33,
      deviceType: ['MA-dimmablelight']
    })
    expect(created.code).toBe(0)

    let featureCodes = async () => {
      let listed = await edit({
        ...matter,
        editOperation: 'feature.list',
        endpoint: 33,
        cluster: 'On/Off',
        format: 'json'
      })
      return JSON.parse(listed.output).operations[0].rows
    }
    expect((await featureCodes()).find((r) => r.code === 'LT').enabled).toBe(
      'yes'
    )

    // A feature is a bit of the FeatureMap attribute's value, and the saved
    // format only keeps attributes that are included, so excluding it throws
    // the whole feature selection away.
    let excluded = await edit({
      ...matter,
      editOperation: 'attribute.disable',
      endpoint: 33,
      cluster: 'On/Off',
      attribute: 'FeatureMap'
    })
    expect(excluded.code).toBe(0)
    expect(excluded.output).toContain('feature selection')

    // Having lost its home, a toggle must be refused rather than reported as
    // done and silently dropped on the next save.
    let toggled = await edit({
      ...matter,
      editOperation: 'feature.enable',
      endpoint: 33,
      cluster: 'On/Off',
      feature: 'DF'
    })
    expect(toggled.code).toBe(1)
    expect(toggled.errors).toContain('cannot be saved')

    // And the listing has to say why everything reads as off.
    let listed = await edit({
      ...matter,
      editOperation: 'feature.list',
      endpoint: 33,
      cluster: 'On/Off'
    })
    expect(listed.output).toContain('FeatureMap attribute is not enabled')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: a duplicated endpoint matches the one it came from',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-duplicate-fidelity.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 41,
      deviceType: ['MA-dimmablelight']
    })
    await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 41,
      cluster: 'On/Off',
      attribute: 'OnOff',
      default: '1'
    })
    let duplicated = await edit({
      ...matter,
      editOperation: 'endpoint.duplicate',
      endpoint: 41,
      newEndpoint: 42
    })
    expect(duplicated.code).toBe(0)

    let listing = async (operation, endpoint, extra) => {
      let listed = await edit({
        ...matter,
        editOperation: operation,
        endpoint: endpoint,
        format: 'json',
        ...extra
      })
      return JSON.parse(listed.output).operations[0].rows
    }
    for (let [operation, extra] of [
      ['cluster.list', { enabledOnly: true }],
      ['attribute.list', { cluster: 'On/Off', enabledOnly: true }],
      ['command.list', { cluster: 'On/Off', enabledOnly: true }],
      ['devicetype.list', {}]
    ]) {
      expect(await listing(operation, 42, extra)).toEqual(
        await listing(operation, 41, extra)
      )
    }
  },
  testUtil.timeout.long()
)

test(
  'cli edit: attribute settings survive a save and reload',
  async () => {
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-persistence.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 51,
      deviceType: ['MA-dimmablelight']
    })
    let set = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 51,
      cluster: 'Level Control',
      attribute: 'CurrentLevel',
      enabled: true,
      default: '42',
      storage: 'NVM',
      singleton: true,
      bounded: true,
      reporting: true,
      minInterval: 7,
      maxInterval: 700,
      reportableChange: 3
    })
    expect(set.code).toBe(0)

    // Read back through a fresh load of the saved file, so this covers the
    // export and import as well as the write.
    let listed = await edit({
      ...matter,
      editOperation: 'attribute.list',
      endpoint: 51,
      cluster: 'Level Control',
      format: 'json'
    })
    let row = JSON.parse(listed.output).operations[0].rows.find(
      (r) => r.name === 'CurrentLevel' && r.side === 'server'
    )
    expect(row).toMatchObject({
      enabled: 'yes',
      storage: 'NVM',
      default: '42',
      singleton: 'yes',
      bounded: 'yes',
      reporting: 'yes',
      min: 7,
      max: 700,
      change: 3
    })
  },
  testUtil.timeout.long()
)

test(
  'cli edit: a configuration built here generates the code it should',
  async () => {
    // Every other test checks the CLI against itself: it writes something and
    // reads it back. This one checks the thing that actually matters, which is
    // that the file is usable. A configuration is built entirely through the
    // CLI, saved, and then handed to the generator, and the values set on the
    // way in are looked for in the generated C.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-generation.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 61,
      deviceType: ['MA-dimmablelight']
    })
    expect(created.code).toBe(0)

    let set = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 61,
      cluster: 'Level Control',
      attribute: 'CurrentLevel',
      enabled: true,
      // A value no default would produce, so finding it proves it came from here.
      default: '25'
    })
    expect(set.code).toBe(0)

    let db = await dbApi.initDatabaseAndLoadSchema(
      env.sqliteTestFile('cli-edit-generation'),
      env.schemaFile(),
      env.zapVersion()
    )
    try {
      await zclLoader.loadZclMetafiles(db, matterPackages.zclProperties)
      let templates = await genEngine.loadTemplates(
        db,
        matterPackages.generationTemplate
      )
      expect(templates.error).toBeUndefined()

      let imported = await importJs.importDataFromFile(db, file, {
        sessionId: null
      })
      expect(imported.errors).toHaveLength(0)

      let generated = await genEngine.generate(
        db,
        imported.sessionId,
        imported.templateIds[0],
        {},
        { generateOnly: 'endpoint-config.c', disableDeprecationWarnings: true }
      )
      expect(generated.hasErrors).toBeFalsy()

      let endpointConfig = generated.content['endpoint-config.c']
      expect(endpointConfig).toBeDefined()
      // The attribute default travelled from the command line into the C.
      expect(endpointConfig).toContain(
        'ZAP_SIMPLE_DEFAULT(25) }, /* CurrentLevel */'
      )
      // And the Dimmable Light device type's two mandatory Level Control
      // features are in the FeatureMap the generator emitted, which is the
      // device-type conformance path arriving at the output.
      expect(endpointConfig).toContain(
        'ZAP_SIMPLE_DEFAULT(3) }, /* FeatureMap */'
      )
    } finally {
      await dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)

test(
  'cli edit: manages matter clusters and events',
  async () => {
    let file = scratchCopy(testUtil.matterTestFile.switch, 'matter.zap')

    let info = await edit({
      ...matterPackages,
      editOperation: 'config.info',
      zapFile: file
    })
    expect(info.code).toBe(0)
    expect(info.output).toContain('endpoint(s)')

    let events = await edit({
      ...matterPackages,
      editOperation: 'event.list',
      zapFile: file,
      endpoint: 1,
      cluster: 'Switch',
      format: 'json'
    })
    expect(events.code).toBe(0)
    let rows = JSON.parse(events.output).operations[0].rows
    expect(rows.length).toBeGreaterThan(0)

    let enabled = await edit({
      ...matterPackages,
      editOperation: 'event.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Switch',
      event: rows[0].name
    })
    expect(enabled.code).toBe(0)
    expect(enabled.output).toContain(`Enabled event ${rows[0].name}`)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: will not move an attribute the data model serves externally',
  async () => {
    // The Matter data model names cluster and attribute pairs that are reached
    // through the Attribute Access Interface: their value lives in application
    // code rather than in an attribute store, so their storage is fixed at
    // External and they have no default. The GUI greys both controls out. The
    // CLI has to refuse them, because ZAP re-applies the policy every time a
    // configuration is read, so a write that disagreed would be reported as
    // done and then quietly undone.
    let file = scratchCopy(
      testUtil.matterTestFile.matterTest,
      'matter-external.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 71,
      deviceType: ['MA-rootdevice']
    })
    expect(created.code).toBe(0)
    let enabled = await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 71,
      cluster: 'Access Control',
      side: 'server'
    })
    expect(enabled.code).toBe(0)

    // The listing says which fields are not the caller's to set.
    let listed = await edit({
      ...matter,
      editOperation: 'attribute.list',
      endpoint: 71,
      cluster: 'Access Control',
      filter: 'ACL',
      format: 'json'
    })
    expect(listed.code).toBe(0)
    let acl = JSON.parse(listed.output).operations[0].rows.find(
      (r) => r.name === 'ACL' && r.side === 'server'
    )
    expect(acl.storage).toBe('External')
    expect(acl.fixed).toContain('storage')

    let moved = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 71,
      cluster: 'Access Control',
      attribute: 'ACL',
      enabled: true,
      storage: 'RAM'
    })
    expect(moved.code).toBe(1)
    expect(moved.errors).toContain('Attribute Access Interface')

    // Asking for the storage the model already gives it is not a fight.
    let agreed = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 71,
      cluster: 'Access Control',
      attribute: 'ACL',
      enabled: true,
      storage: 'External'
    })
    expect(agreed.code).toBe(0)

    let valued = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 71,
      cluster: 'Access Control',
      attribute: 'ACL',
      default: '7'
    })
    expect(valued.code).toBe(1)
    expect(valued.errors).toContain('no default value to set')

    // An attribute of the same cluster that is not one of the pairs stays
    // free, which is the whole point of matching on the pair.
    let ordinary = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 71,
      cluster: 'Basic Information',
      attribute: 'NodeLabel',
      enabled: true,
      storage: 'NVM',
      default: 'lamp'
    })
    expect(ordinary.code).toBe(0)
    expect(ordinary.output).toContain('storage=NVM')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: will not configure an attribute that is not included',
  async () => {
    // Storage, default value, singleton and bounded say how an attribute is
    // kept, and one that is not included is not kept at all, which is why the
    // GUI greys all four until the attribute is switched on.
    let file = scratchCopy(
      testUtil.matterTestFile.matterTest,
      'matter-inclusion.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 72,
      deviceType: ['MA-onofflight']
    })
    expect(created.code).toBe(0)
    let enabled = await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 72,
      cluster: 'Basic Information',
      side: 'server'
    })
    expect(enabled.code).toBe(0)

    let listed = await edit({
      ...matter,
      editOperation: 'attribute.list',
      endpoint: 72,
      cluster: 'Basic Information',
      format: 'json'
    })
    let excluded = JSON.parse(listed.output).operations[0].rows.find(
      (r) => r.enabled === 'no' && r.side === 'server'
    )
    expect(excluded).toBeDefined()

    let configured = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 72,
      cluster: 'Basic Information',
      attribute: excluded.name,
      singleton: true
    })
    expect(configured.code).toBe(1)
    expect(configured.errors).toContain('is not enabled')

    // Including it as part of the same change is enough.
    let together = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 72,
      cluster: 'Basic Information',
      attribute: excluded.name,
      enabled: true,
      singleton: true
    })
    expect(together.code).toBe(0)
    expect(together.output).toContain('singleton=true')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: will not fight the reporting policy',
  async () => {
    // Matter makes reporting mandatory for most attributes, and ZAP forces it
    // back on when the file is read, so refusing is the only honest answer.
    let file = scratchCopy(
      testUtil.matterTestFile.matterTest,
      'matter-reporting.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let listed = await edit({
      ...matter,
      editOperation: 'attribute.list',
      endpoint: 1,
      cluster: 'On/Off',
      format: 'json'
    })
    let mandatory = JSON.parse(listed.output).operations[0].rows.find(
      (r) => r.enabled === 'yes' && `${r.fixed}`.includes('reporting')
    )
    expect(mandatory).toBeDefined()

    let off = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 1,
      cluster: 'On/Off',
      attribute: mandatory.name,
      reporting: false
    })
    expect(off.code).toBe(1)
    expect(off.errors).toContain('mandatory reporting')

    let on = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 1,
      cluster: 'On/Off',
      attribute: mandatory.name,
      reporting: true
    })
    expect(on.code).toBe(0)
  },
  testUtil.timeout.long()
)

test('cli edit: knows what to say about each thing the data model fixes', () => {
  // The rules themselves, away from any configuration: which fields a listing
  // should mark, and which changes a caller is not making.
  let where = {
    attribute: { name: 'ACL' },
    cluster: { name: 'Access Control' },
    side: 'server',
    endpoint: 1
  }
  let free = { storage: null, reporting: null }
  let external = { storage: 'External', reporting: null }
  let mustReport = { storage: null, reporting: true }
  let mustNotReport = { storage: null, reporting: false }

  expect(cliPolicy.fixedFields(free)).toBe('')
  expect(cliPolicy.fixedFields(external)).toBe('storage')
  expect(cliPolicy.fixedFields(mustReport)).toBe('reporting')
  expect(cliPolicy.fixedFields({ storage: 'External', reporting: false })).toBe(
    'storage+reporting'
  )

  let respect = (policy, requested) => () =>
    cliPolicy.requirePolicyRespected(policy, requested, where)
  expect(respect(external, { storage: 'RAM' })).toThrow('Access Interface')
  expect(respect(external, { storage: 'External' })).not.toThrow()
  expect(respect(free, { storage: 'RAM' })).not.toThrow()
  expect(respect(mustReport, { reporting: false })).toThrow('mandatory')
  expect(respect(mustReport, { reporting: true })).not.toThrow()
  expect(respect(mustNotReport, { reporting: true })).toThrow('prohibited')
  expect(respect(free, { reporting: false })).not.toThrow()

  let keep = (requested, storage, policy) => () =>
    cliPolicy.requireDefaultCanBeKept(requested, storage, policy, where)
  expect(keep('7', 'RAM', free)).not.toThrow()
  expect(keep('7', 'External', free)).toThrow('stored externally')
  expect(keep('7', 'External', external)).toThrow('no default value to set')
  // Clearing it asks for nothing that is not already so.
  expect(keep(null, 'External', external)).not.toThrow()
  expect(keep('null', 'External', external)).not.toThrow()

  expect(() =>
    cliPolicy.requireIncluded(false, ['--singleton'], where)
  ).toThrow('is not enabled')
  expect(() =>
    cliPolicy.requireIncluded(true, ['--singleton'], where)
  ).not.toThrow()
})

test('cli edit: refuses a feature the specification leaves no choice about', () => {
  // No shipped data model has one, so the rule is checked directly rather than
  // through a configuration. The GUI greys these toggles out.
  let cluster = { name: 'On/Off' }
  expect(() =>
    cliPolicy.requireToggleableFeature(
      { name: 'Lighting', code: 'LT', conformance: 'X' },
      cluster,
      1
    )
  ).toThrow('disallowed')
  expect(() =>
    cliPolicy.requireToggleableFeature(
      { name: 'Lighting', code: 'LT', conformance: 'D' },
      cluster,
      1
    )
  ).toThrow('deprecated')
  expect(() =>
    cliPolicy.requireToggleableFeature(
      { name: 'Lighting', code: 'LT', conformance: 'O' },
      cluster,
      1
    )
  ).not.toThrow()
})

test(
  'cli edit: reports the notifications an edit introduces',
  async () => {
    // The GUI keeps a count of these in its toolbar and it goes up as you
    // work: enabling a command whose response command is not enabled is
    // allowed, but noted. Nothing recomputes that later, so a CLI that drops
    // it on the floor is the only place it is ever lost.
    let file = scratchCopy(
      testUtil.matterTestFile.matterTest,
      'matter-notifications.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 73,
      deviceType: ['MA-onofflight']
    })
    expect(created.code).toBe(0)

    let enabled = await edit({
      ...matter,
      editOperation: 'command.enable',
      endpoint: 73,
      cluster: 'Scenes',
      command: 'EnhancedAddScene',
      direction: 'in'
    })
    expect(enabled.code).toBe(0)
    expect(enabled.output).toContain('Notifications: 1 new')
    expect(enabled.output).toContain(
      'EnhancedAddSceneResponse should be enabled'
    )

    // Doing as it says takes the notification away again.
    let answered = await edit({
      ...matter,
      editOperation: 'command.enable',
      endpoint: 73,
      cluster: 'Scenes',
      command: 'EnhancedAddSceneResponse',
      direction: 'out'
    })
    expect(answered.code).toBe(0)
    expect(answered.output).toContain('Notifications: none new')
    expect(answered.output).toContain('1 resolved')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: switching off an element a feature requires is reported as such',
  async () => {
    // Two different rules can want the same attribute, and the interface shows
    // both: the device type requires it, and the cluster's feature selection
    // requires it. The second is the one that moves when a feature is toggled,
    // so an edit that leaves it unmet has to say which feature and why.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-element-conformance.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 10,
      deviceType: ['MA-onofflight']
    })
    expect(created.code).toBe(0)

    // OnTime conforms to Lighting, which this device type has on.
    let off = await edit({
      ...matter,
      editOperation: 'attribute.disable',
      endpoint: 10,
      cluster: 'On/Off',
      attribute: 'OnTime'
    })
    expect(off.code).toBe(0)
    expect(off.output).toContain(
      'attribute: OnTime has mandatory conformance to LT and should be enabled, when feature: LT is enabled'
    )

    // The same for a command, and both survive into the standing report.
    let command = await edit({
      ...matter,
      editOperation: 'command.disable',
      endpoint: 10,
      cluster: 'On/Off',
      command: 'OnWithTimedOff',
      direction: 'in'
    })
    expect(command.code).toBe(0)
    expect(command.output).toContain(
      'command: OnWithTimedOff has mandatory conformance to LT'
    )

    let checked = await edit({
      ...matter,
      editOperation: 'config.check',
      format: 'json'
    })
    let messages = JSON.parse(checked.output).operations[0].rows.map(
      (r) => r.message
    )
    expect(
      messages.filter((m) => m.includes('mandatory conformance to LT'))
    ).toHaveLength(2)

    // Putting them back takes both accounts of the problem away.
    for (let repair of [
      {
        editOperation: 'attribute.enable',
        cluster: 'On/Off',
        attribute: 'OnTime'
      },
      {
        editOperation: 'command.enable',
        cluster: 'On/Off',
        command: 'OnWithTimedOff',
        direction: 'in'
      }
    ]) {
      expect((await edit({ ...matter, endpoint: 10, ...repair })).code).toBe(0)
    }

    let clean = await edit({
      ...matter,
      editOperation: 'config.check',
      format: 'json'
    })
    expect(
      JSON.parse(clean.output)
        .operations[0].rows.map((r) => r.message)
        .filter((m) => m.includes('mandatory conformance to LT'))
    ).toEqual([])
  },
  testUtil.timeout.long()
)

test(
  'cli edit: the interface sees the non-compliance a command line edit leaves behind',
  async () => {
    // The count in the interface toolbar is the one thing that tells a person
    // their configuration stopped meeting the specification, and none of it is
    // written into the .zap file: it is recomputed as the file is read, and
    // added to by database triggers as the file is edited.
    //
    // So the question worth answering is not whether the CLI writes
    // notifications, but whether opening a CLI-edited file produces the ones
    // the interface would have raised itself. This does exactly what the
    // interface does on open, and looks.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-gui-notifications.zap'
    )
    let matter = { ...matterPackages, zapFile: file }

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 9,
      deviceType: ['MA-onofflight']
    })
    expect(created.code).toBe(0)

    // Lighting is mandatory for this device type, so switching it off is a
    // configuration that no longer meets the specification.
    let broken = await edit({
      ...matter,
      editOperation: 'feature.disable',
      endpoint: 9,
      cluster: 'On/Off',
      feature: 'LT'
    })
    expect(broken.code).toBe(0)
    expect(broken.output).toContain('Notifications:')

    let db = await dbApi.initDatabaseAndLoadSchema(
      env.sqliteTestFile('cli-edit-gui-notifications'),
      env.schemaFile(),
      env.zapVersion()
    )
    try {
      await zclLoader.loadZclMetafiles(db, matterPackages.zclProperties)
      let imported = await importJs.importDataFromFile(db, file, {
        sessionId: null
      })
      expect(imported.errors).toHaveLength(0)

      let notifications = await querySessionNotification.getNotification(
        db,
        imported.sessionId
      )
      let messages = notifications.map((n) => n.message)
      let about = (text) => messages.filter((m) => m.includes(text))

      // The feature itself, and the elements that went with it.
      expect(
        about('feature: Lighting (LT)').some((m) =>
          m.includes('should be enabled')
        )
      ).toBe(true)
      expect(about('GlobalSceneControl needs to be enabled')).not.toHaveLength(
        0
      )
      expect(about('OnWithTimedOff incoming needs to be enabled')).not.toEqual(
        []
      )

      // And the toolbar has a number to show, since none of them have been read.
      let unseen = await querySessionNotification.getUnseenNotificationCount(
        db,
        imported.sessionId
      )
      expect(unseen).toBeGreaterThanOrEqual(messages.length)
    } finally {
      await dbApi.closeDatabase(db)
    }

    // Undoing it takes them away again, so the count follows the configuration
    // rather than accumulating.
    let repaired = await edit({
      ...matter,
      editOperation: 'feature.enable',
      endpoint: 9,
      cluster: 'On/Off',
      feature: 'LT'
    })
    expect(repaired.code).toBe(0)

    let checked = await edit({
      ...matter,
      editOperation: 'config.check',
      format: 'json'
    })
    let rows = JSON.parse(checked.output).operations[0].rows
    expect(
      rows.filter((r) => `${r.message}`.includes('feature: Lighting (LT)'))
    ).toEqual([])
  },
  testUtil.timeout.long()
)

test(
  'cli edit: checks a configuration without changing it',
  async () => {
    let file = scratchCopy(
      testUtil.matterTestFile.matterTest,
      'matter-check.zap'
    )
    let before = fs.readFileSync(file, 'utf8')

    let checked = await edit({
      ...matterPackages,
      editOperation: 'config.check',
      zapFile: file,
      format: 'json'
    })
    expect(checked.code).toBe(0)
    let report = JSON.parse(checked.output).operations[0]
    expect(report.changed).toBe(false)
    expect(report.failed).toBe(true)
    expect(fs.readFileSync(file, 'utf8')).toBe(before)

    // Both accounts are there: what validation recomputes, and what only the
    // notifications know, such as a command whose response is missing.
    let sources = new Set(report.rows.map((r) => r.source))
    expect(sources.has('validation')).toBe(true)
    expect(sources.has('configuration')).toBe(true)
    expect(report.rows.some((r) => r.kind === 'error')).toBe(true)

    // And nothing is said twice, though the two sources overlap.
    let keys = report.rows.map((r) => cliOutput.complianceKey(r.message))
    expect(new Set(keys).size).toBe(keys.length)
    keys.forEach((key) => {
      expect(keys.filter((other) => other.includes(key))).toHaveLength(1)
    })

    // Errors only fail the run when asked to.
    let strict = await edit({
      ...matterPackages,
      editOperation: 'config.check',
      zapFile: file,
      strict: true
    })
    expect(strict.code).toBe(1)
    expect(strict.output).toContain('error(s)')

    // An empty configuration has nothing wrong with it, and still answers with
    // a list of findings rather than with nothing at all.
    let empty = path.join(workDir, 'empty-check.zap')
    let created = await edit({ editOperation: 'new', zapFile: empty })
    expect(created.code).toBe(0)
    let clean = await edit({
      editOperation: 'config.check',
      zapFile: empty,
      strict: true,
      format: 'json'
    })
    expect(clean.code).toBe(0)
    let cleanReport = JSON.parse(clean.output).operations[0]
    expect(cleanReport.rows).toEqual([])
    expect(cleanReport.failed).toBeUndefined()
    expect(cleanReport.messages[0]).toContain('0 error(s), 0 warning(s)')

    // The data model's own complaints are kept out of the way until asked for.
    let withPackages = await edit({
      ...matterPackages,
      editOperation: 'config.check',
      zapFile: file,
      packages: true,
      format: 'json'
    })
    expect(withPackages.code).toBe(0)
    let all = JSON.parse(withPackages.output).operations[0].rows
    expect(all.length).toBeGreaterThan(report.rows.length)
    expect(all.some((r) => r.source === 'data model')).toBe(true)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: adds custom xml and configures the clusters it brings',
  async () => {
    // The Extensions page loads a ZCL XML file into the session, and its
    // clusters then behave like any other. This is that, headless: the file
    // starts without the package, gains it, and the custom cluster becomes
    // usable and survives the save.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-package-add.zap'
    )
    let matter = { ...matterPackages, zapFile: file }
    let xml = path.resolve(testUtil.testMatterCustomXml)

    let created = await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 31,
      deviceType: ['MA-onofflight']
    })
    expect(created.code).toBe(0)

    // Before the XML is loaded the cluster does not exist, and saying so with
    // the near misses is the whole point of the lookup.
    let missing = await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 31,
      cluster: 'Sample Custom Cluster',
      side: 'server'
    })
    expect(missing.code).toBe(1)
    expect(missing.errors).toContain('Unknown cluster')

    let added = await edit({
      ...matter,
      editOperation: 'package.add',
      xml: [xml]
    })
    expect(added.code).toBe(0)
    expect(added.output).toContain('Loaded custom XML')
    expect(added.output).toContain('Sample Custom Cluster')

    // It went into the file, which is what makes the next command work.
    let packages = JSON.parse(fs.readFileSync(file, 'utf8')).package
    expect(packages.some((p) => p.type === 'zcl-xml-standalone')).toBe(true)

    let enabled = await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 31,
      cluster: 'Sample Custom Cluster',
      side: 'server'
    })
    expect(enabled.code).toBe(0)

    let set = await edit({
      ...matter,
      editOperation: 'attribute.set',
      endpoint: 31,
      cluster: 'Sample Custom Cluster',
      attribute: 'FlipFlop',
      enabled: true,
      default: '1'
    })
    expect(set.code).toBe(0)

    let listed = await edit({
      ...matter,
      editOperation: 'attribute.list',
      endpoint: 31,
      cluster: 'Sample Custom Cluster',
      enabledOnly: true,
      format: 'json'
    })
    expect(listed.code).toBe(0)
    let flipFlop = JSON.parse(listed.output).operations[0].rows.find(
      (r) => r.name === 'FlipFlop'
    )
    expect(flipFlop.enabled).toBe('yes')
    expect(flipFlop.default).toBe('1')

    // The listing names the custom XML alongside the built-in packages.
    let inventory = await edit({
      ...matter,
      editOperation: 'package.list',
      format: 'json'
    })
    expect(inventory.code).toBe(0)
    let rows = JSON.parse(inventory.output).operations[0].rows
    let custom = rows.find((r) => r.type === 'zcl-xml-standalone')
    expect(custom.status).toBe('loaded')
    expect(custom.path).toContain('matter-custom.xml')

    // Only an XML file will do, and saying which file is wrong beats a parse
    // error from further in.
    let wrongKind = await edit({
      ...matter,
      editOperation: 'package.add',
      xml: [matterPackages.zclProperties[0]]
    })
    expect(wrongKind.code).toBe(1)
    expect(wrongKind.errors).toContain('not an XML file')

    let absent = await edit({
      ...matter,
      editOperation: 'package.add',
      xml: [path.join(workDir, 'no-such-file.xml')]
    })
    expect(absent.code).toBe(1)
    expect(absent.errors).toContain('No such file')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: removing custom xml takes the endpoint configuration with it',
  async () => {
    // Disabling a custom XML package makes database triggers delete the
    // endpoint clusters that came from it. The GUI does that on a button press
    // with nothing said; here it is counted first and refused until asked for
    // twice, because it is not recoverable from the file afterwards.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-package-remove.zap'
    )
    let matter = { ...matterPackages, zapFile: file }
    let xml = path.resolve(testUtil.testMatterCustomXml)

    await edit({
      ...matter,
      editOperation: 'endpoint.create',
      endpoint: 41,
      deviceType: ['MA-onofflight']
    })
    await edit({ ...matter, editOperation: 'package.add', xml: [xml] })
    let enabled = await edit({
      ...matter,
      editOperation: 'cluster.enable',
      endpoint: 41,
      cluster: 'Sample Custom Cluster',
      side: 'server'
    })
    expect(enabled.code).toBe(0)

    let refused = await edit({
      ...matter,
      editOperation: 'package.remove',
      xml: 'matter-custom.xml'
    })
    expect(refused.code).toBe(1)
    expect(refused.errors).toContain('endpoint 41')
    expect(refused.errors).toContain('--force')

    // And the refusal changed nothing.
    let still = await edit({
      ...matter,
      editOperation: 'cluster.list',
      endpoint: 41,
      enabledOnly: true,
      format: 'json'
    })
    expect(
      JSON.parse(still.output).operations[0].rows.some(
        (r) => r.name === 'Sample Custom Cluster'
      )
    ).toBe(true)

    let removed = await edit({
      ...matter,
      editOperation: 'package.remove',
      xml: 'matter-custom.xml',
      force: true
    })
    expect(removed.code).toBe(0)
    expect(removed.output).toContain('Removed custom XML')
    expect(removed.output).toContain('endpoint 41')

    let after = JSON.parse(fs.readFileSync(file, 'utf8'))
    expect(after.package.some((p) => p.type === 'zcl-xml-standalone')).toBe(
      false
    )
    let clusters = after.endpointTypes
      .flatMap((e) => e.clusters || [])
      .filter((c) => c.name === 'Sample Custom Cluster')
    expect(clusters).toEqual([])

    // An unknown name is a lookup failure like any other.
    let unknown = await edit({
      ...matter,
      editOperation: 'package.remove',
      xml: 'not-a-package.xml'
    })
    expect(unknown.code).toBe(1)
    expect(unknown.errors).toContain('Unknown custom XML package')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: refuses to edit a configuration whose custom xml it does not have',
  async () => {
    // The importer answers a custom XML it cannot load by moving on, and says
    // nothing: the package is dropped from the configuration, so a save writes
    // the file back without it. The session is then built on a different data
    // model than the file describes, which is why editing is refused. Reading
    // is not, since that is how anyone finds out.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-package-missing.zap'
    )
    declareCustomXml(file, 'cli-edit-nowhere.xml')
    let matter = { ...matterPackages, zapFile: file }

    await onAFreshMachine(async () => {
      let blocked = await edit({
        ...matter,
        editOperation: 'cluster.enable',
        endpoint: 1,
        cluster: 'Identify',
        side: 'server'
      })
      expect(blocked.code).toBe(1)
      expect(blocked.errors).toContain(
        'custom XML package(s) this session does not have'
      )
      expect(blocked.errors).toContain('no such file')
      expect(blocked.errors).toContain('zap edit package remove')

      // Reading works, and says what is wrong rather than pretending.
      let info = await edit({ ...matter, editOperation: 'config.info' })
      expect(info.code).toBe(0)
      expect(info.output).toContain('custom XML not loaded')

      let listed = await edit({
        ...matter,
        editOperation: 'package.list',
        format: 'json'
      })
      expect(listed.code).toBe(0)
      expect(
        JSON.parse(listed.output).operations[0].rows.some(
          (r) => r.status === 'missing'
        )
      ).toBe(true)

      // --force is the way through for someone who means it.
      let forced = await edit({
        ...matter,
        editOperation: 'cluster.enable',
        endpoint: 1,
        cluster: 'Identify',
        side: 'server',
        force: true
      })
      expect(forced.code).toBe(0)
      expect(forced.output).toContain('Enabled cluster Identify')
    })

    // Forcing it through wrote the file without the package it could not load,
    // so there is nothing left to complain about.
    expect(
      JSON.parse(fs.readFileSync(file, 'utf8')).package.some(
        (p) => p.type === 'zcl-xml-standalone'
      )
    ).toBe(false)
  },
  testUtil.timeout.long()
)

test(
  'cli edit: will not edit against a custom xml quietly put in place of another',
  async () => {
    // The worse half of the same problem. When the database holds a custom XML
    // of its own, the importer hands that one over instead of the one the file
    // names, and the configuration is then edited against clusters it never
    // asked for. The substitution is named, because nothing else would reveal
    // it.
    let file = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-package-substituted.zap'
    )
    declareCustomXml(file, 'cli-edit-nowhere.xml')
    let matter = { ...matterPackages, zapFile: file }

    let other = siblingCopy(
      testUtil.matterTestFile.matterTest,
      'cli-edit-package-other.zap'
    )

    await onAFreshMachine(async () => {
      // Something else of the same type, which is all it takes.
      let primed = await edit({
        ...matterPackages,
        zapFile: other,
        editOperation: 'package.add',
        xml: [path.resolve(testUtil.testMatterCustomXml)]
      })
      expect(primed.code).toBe(0)

      let blocked = await edit({
        ...matter,
        editOperation: 'cluster.enable',
        endpoint: 1,
        cluster: 'Identify',
        side: 'server'
      })
      expect(blocked.code).toBe(1)
      expect(blocked.errors).toContain('loaded instead')
      expect(blocked.errors).toContain('matter-custom.xml')

      // The listing tells the two apart: one named and absent, one present and
      // unnamed.
      let listed = await edit({
        ...matter,
        editOperation: 'package.list',
        format: 'json'
      })
      let rows = JSON.parse(listed.output).operations[0].rows
      expect(rows.some((r) => r.status === 'missing')).toBe(true)
      expect(
        rows.some((r) => r.status === 'loaded, not named by the file')
      ).toBe(true)

      // Repairing means both: drop the reference that goes nowhere, and the
      // package that arrived uninvited.
      let dropped = await edit({
        ...matter,
        editOperation: 'package.remove',
        xml: 'cli-edit-nowhere.xml'
      })
      expect(dropped.code).toBe(0)
      expect(dropped.output).toContain('never loaded')

      let uninvited = await edit({
        ...matter,
        editOperation: 'package.remove',
        xml: 'matter-custom.xml'
      })
      expect(uninvited.code).toBe(0)

      let allowed = await edit({
        ...matter,
        editOperation: 'cluster.enable',
        endpoint: 1,
        cluster: 'Identify',
        side: 'server'
      })
      expect(allowed.code).toBe(0)
    })

    expect(
      JSON.parse(fs.readFileSync(file, 'utf8')).package.some(
        (p) => p.type === 'zcl-xml-standalone'
      )
    ).toBe(false)
  },
  testUtil.timeout.long()
)

// The cluster-to-component mapping is a package extension the generation
// templates carry, so these need a --gen that declares one.
const componentPackages = {
  zclProperties: [env.builtinSilabsZclMetafile()],
  generationTemplate: [env.locateProjectResource(testUtil.testTemplate.zigbee2)]
}

test(
  'cli edit: names the UC components an enabled cluster needs',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'components.zap')

    let enabled = await edit({
      ...componentPackages,
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Level Control',
      side: 'server'
    })
    expect(enabled.code).toBe(0)
    // Only Studio writes the project file, so the edit cannot install it. It
    // can say what is now missing, which is the part a caller cannot work out.
    expect(enabled.output).toContain('UC component(s) not installed')
    expect(enabled.output).toContain('zigbee_zll_level_control_server')

    // Switching it back off is not a reason to talk about components: removal
    // is Studio's decision and the data model has to ask for it.
    let disabled = await edit({
      ...componentPackages,
      editOperation: 'cluster.disable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Level Control',
      side: 'server'
    })
    expect(disabled.code).toBe(0)
    expect(disabled.output).not.toContain('UC component(s)')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: reports the components of a whole device type once',
  async () => {
    let file = path.join(workDir, 'component-endpoint.zap')
    let created = await edit({
      ...componentPackages,
      editOperation: 'new',
      zapFile: file
    })
    expect(created.code).toBe(0)

    let added = await edit({
      ...componentPackages,
      editOperation: 'endpoint.create',
      zapFile: file,
      endpoint: 1,
      deviceType: ['ZLL-onofflight']
    })
    expect(added.code).toBe(0)
    // A device type switches on a handful of clusters at once. One line for the
    // lot, not one per cluster.
    expect(added.output).toContain('UC component(s) not installed')
    expect(added.output.match(/UC component\(s\) not installed/g)).toHaveLength(
      1
    )
    expect(added.output).toContain('zigbee_on_off')
  },
  testUtil.timeout.long()
)

test(
  'cli edit: refuses when Studio integration was asked for but is not there',
  async () => {
    let file = scratchCopy(testUtil.zigbeeTestFile.onOff, 'no-studio.zap')

    // Nothing listens on port 1. Before, this saved the edit and quietly
    // installed nothing, which looks exactly like success.
    let attempted = await edit({
      ...componentPackages,
      editOperation: 'cluster.enable',
      zapFile: file,
      endpoint: 1,
      cluster: 'Level Control',
      side: 'server',
      studioHttpPort: 1,
      ideProjectPath: path.join(workDir, 'nowhere.slcp')
    })
    expect(attempted.code).toBe(1)
    expect(attempted.errors).toContain('Studio integration was requested')
    expect(attempted.errors).toContain('nothing is answering on port 1')
  },
  testUtil.timeout.long()
)
