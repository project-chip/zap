#!/usr/bin/env node
/**
 *
 *    Copyright (c) 2026 Silicon Labs
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
 * Smoke test for `zap edit` on a packaged zap-cli binary.
 *
 * The release build already checks that zap-cli exists and reports a version.
 * That does not prove the edit command works: the data model has to load out of
 * the binary's own bundle, the database has to be created in a writable state
 * directory, and a .zap file has to survive a save and a reload. This exercises
 * that path the way a person would.
 *
 * Usage:
 *   node src-script/smoke-test-cli.js --binary ./dist/zap-linux-x64/zap-cli
 *   node src-script/smoke-test-cli.js            (defaults to source via zap-start)
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv))
  .option('binary', {
    alias: 'b',
    type: 'string',
    desc: 'Path to the packaged zap-cli binary. Omitted means run from source.'
  })
  .option('keep', {
    type: 'boolean',
    default: false,
    desc: 'Keep the scratch directory, for looking at what was produced.'
  })
  .help().argv

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zap-cli-smoke-'))
const zapFile = path.join(workDir, 'smoke.zap')
const stateDir = path.join(workDir, 'state')
fs.mkdirSync(stateDir, { recursive: true })

let failures = []
let stepNumber = 0

/**
 * Runs one zap invocation, against the binary when given one and against the
 * source tree otherwise.
 *
 * @param {string[]} args
 * @returns {*} `{ status, stdout, stderr }`
 */
function zap(args) {
  let command
  let commandArgs
  if (argv.binary) {
    command = path.resolve(argv.binary)
    commandArgs = args
  } else {
    command = process.execPath
    commandArgs = [path.join(__dirname, 'zap-start.js'), ...args]
  }
  let result = spawnSync(command, commandArgs, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    display: `${path.basename(command)} ${args.join(' ')}`
  }
}

/**
 * Extracts the JSON object out of a stdout that may carry other lines first.
 *
 * Progress lines can themselves contain braces, so every candidate start is
 * tried and the first one that parses into an object wins.
 *
 * @param {string} text
 * @returns {string} the JSON object found, or the original text
 */
function jsonPayloadOf(text) {
  for (
    let start = text.indexOf('{');
    start >= 0;
    start = text.indexOf('{', start + 1)
  ) {
    let depth = 0
    let inString = false
    let escaped = false
    for (let i = start; i < text.length; i++) {
      let ch = text[i]
      if (inString) {
        if (escaped) escaped = false
        else if (ch === '\\') escaped = true
        else if (ch === '"') inString = false
        continue
      }
      if (ch === '"') inString = true
      else if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          let candidate = text.slice(start, i + 1)
          try {
            let parsed = JSON.parse(candidate)
            if (parsed != null && typeof parsed === 'object') return candidate
          } catch {
            // Not the payload; keep looking from the next brace.
          }
          break
        }
      }
    }
  }
  return text
}

/**
 * Runs a step and records whether its output held what it had to hold.
 *
 * @param {string} what Description used in the report.
 * @param {string[]} args Arguments to pass.
 * @param {object} [expect] `{ contains: string[], code: number }`
 */
function step(what, args, expect = {}) {
  stepNumber += 1
  let expectedCode = expect.code == null ? 0 : expect.code
  let result = zap(args)
  let output = `${result.stdout}\n${result.stderr}`
  let problems = []

  if (result.status !== expectedCode) {
    problems.push(`exit code ${result.status}, expected ${expectedCode}`)
  }
  for (let needle of expect.contains || []) {
    if (!output.includes(needle)) {
      problems.push(`output missing "${needle}"`)
    }
  }

  if (problems.length) {
    failures.push({ what, display: result.display, problems, output })
    console.log(`  ${stepNumber}. FAIL  ${what}`)
    for (let p of problems) console.log(`         ${p}`)
  } else {
    console.log(`  ${stepNumber}. ok    ${what}`)
  }
  return result
}

// Every edit runs against a scratch state directory so the smoke test never
// touches the machine's real ~/.zap, and so it can run next to other jobs.
const common = ['--stateDirectory', stateDir, '--noZapFileLog', '--quiet']

// A bundled data model name, which is the only way to name the data model
// inside a packaged binary without knowing where its bundle is mounted.
const matter = ['--zcl', 'matter']

console.log(
  `zap edit smoke test: ${argv.binary ? path.resolve(argv.binary) : 'source tree'}`
)
console.log(`scratch: ${workDir}`)

step('reports a version', ['--version'], { contains: ['Version'] })

step('edit help lists the operations', ['edit', 'help'], {
  contains: ['endpoint create', 'cluster enable', 'attribute set']
})

let schema = step(
  'edit help emits a machine readable schema',
  ['edit', 'help', '--format', 'json'],
  { contains: ['"operations"'] }
)
if (schema.status === 0) {
  try {
    // Running from source, the dev launcher prints build progress before the
    // payload. The packaged binary has no build step, so its stdout is only the
    // JSON. Take the object either way.
    let parsed = JSON.parse(jsonPayloadOf(schema.stdout))
    if (parsed.operations == null) {
      failures.push({
        what: 'help schema has an operations key',
        display: 'edit help --format json',
        problems: ['no operations key'],
        output: schema.stdout.slice(0, 500)
      })
      console.log('     FAIL  help schema has an operations key')
    }
  } catch (e) {
    failures.push({
      what: 'help schema is valid JSON',
      display: 'edit help --format json',
      problems: [e.message],
      output: schema.stdout.slice(0, 500)
    })
    console.log('     FAIL  help schema is valid JSON')
  }
}

step(
  'creates a Matter configuration from a bundled data model',
  ['edit', 'new', zapFile, '--force', ...matter, ...common],
  { contains: ['MA-rootdevice'] }
)

// --gen is intentionally omitted above. The CLI must attach the Matter test
// templates that ship with the binary whenever --zcl matter is used alone.
step(
  'attaches the matching test templates when --gen is omitted',
  ['edit', 'package', 'list', zapFile, ...matter, ...common],
  { contains: ['gen-templates-json', 'test-matter'] }
)

step(
  'creates an endpoint with a device type',
  [
    'edit',
    'endpoint',
    'create',
    zapFile,
    '--endpoint',
    '1',
    '--device-type',
    'MA-dimmablelight',
    ...matter,
    ...common
  ],
  { contains: ['MA-dimmablelight'] }
)

step(
  'sets an attribute default',
  [
    'edit',
    'attribute',
    'set',
    zapFile,
    '--endpoint',
    '1',
    '--cluster',
    'Level Control',
    '--attribute',
    'CurrentLevel',
    '--enabled',
    '--default',
    '42',
    ...matter,
    ...common
  ],
  { contains: ['default=42'] }
)

step(
  'lists features with their conformance',
  [
    'edit',
    'feature',
    'list',
    zapFile,
    '--endpoint',
    '1',
    '--cluster',
    'On/Off',
    ...matter,
    ...common
  ],
  { contains: ['Lighting'] }
)

step(
  'enables an event',
  [
    'edit',
    'endpoint',
    'create',
    zapFile,
    '--endpoint',
    '2',
    '--device-type',
    'MA-doorlock',
    ...matter,
    ...common
  ],
  { contains: ['MA-doorlock'] }
)

step(
  'enables a cluster event',
  [
    'edit',
    'event',
    'enable',
    zapFile,
    '--endpoint',
    '2',
    '--cluster',
    'Door Lock',
    '--event',
    'DoorLockAlarm',
    ...matter,
    ...common
  ],
  { contains: ['DoorLockAlarm'] }
)

step(
  'reads the file back with the edits in it',
  ['edit', 'endpoint', 'list', zapFile, ...matter, ...common],
  { contains: ['MA-dimmablelight', 'MA-doorlock'] }
)

step(
  'reports an unknown cluster instead of failing silently',
  [
    'edit',
    'cluster',
    'enable',
    zapFile,
    '--endpoint',
    '1',
    '--cluster',
    'No Such Cluster',
    '--side',
    'server',
    ...matter,
    ...common
  ],
  { code: 1, contains: ['Unknown cluster'] }
)

// The saved file has to be a .zap a person or the GUI can open, not just
// something the command line accepted.
if (fs.existsSync(zapFile)) {
  try {
    let saved = JSON.parse(fs.readFileSync(zapFile, 'utf8'))
    let ids = (saved.endpoints || []).map((e) => e.endpointId)
    let hasAll = [0, 1, 2].every((id) => ids.includes(id))
    if (!hasAll) {
      failures.push({
        what: 'saved file holds endpoints 0, 1 and 2',
        display: zapFile,
        problems: [`endpoints are ${ids.join(', ')}`],
        output: ''
      })
      console.log('     FAIL  saved file holds endpoints 0, 1 and 2')
    } else {
      console.log(`  ${stepNumber + 1}. ok    saved file parses as a .zap`)
    }
  } catch (e) {
    failures.push({
      what: 'saved file parses as JSON',
      display: zapFile,
      problems: [e.message],
      output: ''
    })
    console.log('     FAIL  saved file parses as JSON')
  }
} else {
  failures.push({
    what: 'saved file exists',
    display: zapFile,
    problems: ['file was never written'],
    output: ''
  })
  console.log('     FAIL  saved file exists')
}

console.log('')
if (failures.length === 0) {
  console.log('zap edit smoke test: PASS')
  if (!argv.keep) fs.rmSync(workDir, { recursive: true, force: true })
  process.exit(0)
}

console.log(`zap edit smoke test: FAIL (${failures.length})`)
for (let f of failures) {
  console.log('')
  console.log(`- ${f.what}`)
  console.log(`  command: ${f.display}`)
  for (let p of f.problems) console.log(`  ${p}`)
  if (f.output) {
    console.log('  output:')
    console.log(
      f.output
        .split('\n')
        .slice(-25)
        .map((l) => `    ${l}`)
        .join('\n')
    )
  }
}
console.log('')
console.log(`scratch kept at: ${workDir}`)
process.exit(1)
