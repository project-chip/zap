/**
 *
 *    Copyright (c) 2020 Silicon Labs
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
const yargs = require('yargs')
const args = require('../src-electron/util/args')
const sdkArgs = require('../src-electron/util/sdk-args')
const { timeout } = require('./test-util.js')
const env = require('../src-electron/util/env')

function x(arg = 'blah') {
  return arg
}

function y(
  arg = {
    a: 1,
    b: 2
  }
) {
  return arg.a + arg.b
}

let workDir

beforeAll(async () => {
  env.setDevelopmentEnv()
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zap-sdk-args-'))
})

afterAll(() => {
  fs.rmSync(workDir, { recursive: true, force: true })
})

/**
 * Writes a project directory the way SLC leaves one: a .zap file naming its
 * data model, and the SDK paths it resolved beside it.
 *
 * @param {*} name Directory name under the work directory.
 * @param {*} categories Package categories the .zap file declares.
 * @param {*} slcArgs Contents of slc_args.json.
 * @returns {string} path to the .zap file
 */
function project(name, categories, slcArgs) {
  let dir = path.join(workDir, name)
  fs.mkdirSync(dir, { recursive: true })
  let zapFile = path.join(dir, 'app.zap')
  fs.writeFileSync(
    zapFile,
    JSON.stringify({
      featureLevel: 108,
      package: categories.map((category) => ({
        type: 'zcl-properties',
        category: category,
        version: 1,
        path: 'nowhere/zcl.json'
      })),
      endpointTypes: [],
      endpoints: []
    })
  )
  fs.writeFileSync(path.join(dir, 'slc_args.json'), JSON.stringify(slcArgs))
  return zapFile
}

const sdkMatterZcl = env.locateProjectResource('./zcl-builtin/matter/zcl.json')
const sdkMatterTemplates = env.locateProjectResource(
  './test/gen-template/matter/gen-test.json'
)
const sdkZigbeeZcl = env.builtinSilabsZclMetafile()
const sdkZigbeeTemplates = env.locateProjectResource(
  './test/gen-template/zigbee/gen-templates.json'
)

const bothSdks = {
  'zcl.matterZclJsonFile': sdkMatterZcl,
  'zcl.matterTemplateJsonFile': sdkMatterTemplates,
  'zcl.zigbeeZclJsonFile': sdkZigbeeZcl,
  'zcl.zigbeeTemplateJsonFile': sdkZigbeeTemplates
}

test(
  'edit: packages come from slc_args.json for the protocol the file names',
  () => {
    // Both SDKs are installed, so the file has to be what decides. Otherwise a
    // Matter application is edited against the Zigbee data model, and package
    // matching writes that into it.
    let zapFile = project('matter-app', ['matter'], bothSdks)
    let a = args.processCommandLineArguments([
      'node',
      'main.js',
      'edit',
      'endpoint',
      'list',
      zapFile
    ])
    expect(a.zclProperties).toEqual([sdkMatterZcl])
    expect(a.generationTemplate).toEqual([sdkMatterTemplates])
  },
  timeout.short()
)

test(
  'edit: a multiprotocol file gets both protocols',
  () => {
    let zapFile = project('multi-app', ['zigbee', 'matter'], bothSdks)
    let a = args.processCommandLineArguments([
      'node',
      'main.js',
      'edit',
      'endpoint',
      'list',
      zapFile
    ])
    expect(a.zclProperties.sort()).toEqual([sdkMatterZcl, sdkZigbeeZcl].sort())
    expect(a.generationTemplate.sort()).toEqual(
      [sdkMatterTemplates, sdkZigbeeTemplates].sort()
    )
  },
  timeout.short()
)

test(
  'edit: what the command line names wins over slc_args.json',
  () => {
    let zapFile = project('explicit-app', ['matter'], bothSdks)
    let a = args.processCommandLineArguments([
      'node',
      'main.js',
      'edit',
      'endpoint',
      'list',
      zapFile,
      '--zcl',
      'zigbee',
      '--gen',
      sdkZigbeeTemplates
    ])
    expect(a.zclProperties).toEqual([sdkZigbeeZcl])
    expect(a.generationTemplate).toEqual([sdkZigbeeTemplates])
  },
  timeout.short()
)

test(
  'edit: without slc_args.json the bundled test packages are still used',
  () => {
    let dir = path.join(workDir, 'bare')
    fs.mkdirSync(dir, { recursive: true })
    let zapFile = path.join(dir, 'app.zap')
    fs.writeFileSync(zapFile, JSON.stringify({ package: [] }))
    let a = args.processCommandLineArguments([
      'node',
      'main.js',
      'edit',
      'endpoint',
      'list',
      zapFile
    ])
    expect(a.zclProperties).toEqual([sdkZigbeeZcl])
    expect(a.generationTemplate).toEqual([sdkZigbeeTemplates])
  },
  timeout.short()
)

test(
  'sdk args: a template package of another protocol does not decide the answer',
  () => {
    // This is the shape a file is left in by an edit that did not name its
    // templates: Matter data model, Zigbee test templates. The data model is
    // the only part that can still say what the application is.
    let dir = path.join(workDir, 'corrupted')
    fs.mkdirSync(dir, { recursive: true })
    let zapFile = path.join(dir, 'app.zap')
    fs.writeFileSync(
      zapFile,
      JSON.stringify({
        package: [
          { type: 'zcl-properties', category: 'matter', path: 'zcl.json' },
          {
            type: 'gen-templates-json',
            category: 'zigbee',
            path: 'gen-templates.json'
          }
        ]
      })
    )
    fs.writeFileSync(path.join(dir, 'slc_args.json'), JSON.stringify(bothSdks))

    expect(sdkArgs.categoriesOfZapFile(zapFile)).toEqual(['matter'])
    let resolved = sdkArgs.packagesForZapFile(zapFile)
    expect(resolved.zclProperties).toEqual([sdkMatterZcl])
    expect(resolved.generationTemplate).toEqual([sdkMatterTemplates])
  },
  timeout.short()
)

test(
  'sdk args: nothing to say without an slc_args.json',
  () => {
    expect(sdkArgs.packagesForZapFile(null)).toBeNull()
    expect(
      sdkArgs.packagesForZapFile(path.join(workDir, 'bare', 'app.zap'))
    ).toBeNull()
    // A directory is what `--in` may name; only a file has an SDK answer.
    expect(sdkArgs.packagesForZapFile(workDir)).toBeNull()
  },
  timeout.short()
)

test(
  'Test basic command line processing',
  () => {
    let a = args.processCommandLineArguments([
      'node',
      'test.js',
      '--noUI',
      '--httpPort',
      '123',
      '--arglessArg',
      '--xmlRoot',
      'XmlRoot'
    ])

    expect(a.noUI).toBeTruthy()
    expect(a.httpPort).toBeTruthy()
    expect(a.httpPort).toEqual(123)
    expect(a.arglessArg).toBeTruthy()
    expect(a.xmlRoot).toBe('XmlRoot')
  },
  timeout.short()
)

test(
  'validate: --logToStdout is boolean and does not consume the .zap path',
  () => {
    let a = args.processCommandLineArguments([
      'node',
      'main.js',
      '--noUi',
      '--noServer',
      'validate',
      '--logToStdout',
      '/tmp/test.zap'
    ])
    expect(a.logToStdout).toBe(true)
    expect(a.zapFiles).toEqual(['/tmp/test.zap'])
  },
  timeout.short()
)

test(
  'validate: -i a,b is split into two zap paths',
  () => {
    let a = args.processCommandLineArguments([
      'node',
      'main.js',
      '--noUi',
      '--noServer',
      'validate',
      '-i',
      '/tmp/one.zap,/tmp/two.zap'
    ])
    expect(a.zapFiles).toEqual(['/tmp/one.zap', '/tmp/two.zap'])
  },
  timeout.short()
)

test(
  'Verify how yargs works',
  () => {
    let argv = yargs(['a', '--x', 1, 'b', '--y', 2, '--tst', 42]).parse()
    expect(argv._).toContain('a')
    expect(argv._).toContain('b')
    expect(argv.x).toBe(1)
    expect(argv.y).toBe(2)
    expect(argv.tst).toBe(42)
  },
  timeout.short()
)

test(
  'Verify how unpassed arguments work',
  () => {
    expect(x()).toBe('blah')
    expect(x(null)).toBe(null)
    expect(x(undefined)).toBe('blah')
    expect(x('funny')).toBe('funny')

    expect(y()).toBe(3)
    expect(y({ a: 22, b: 34 })).toBe(56)
    expect(y({ a: 22 })).toBe(NaN) // A missing options key is just missing
  },
  timeout.short()
)
