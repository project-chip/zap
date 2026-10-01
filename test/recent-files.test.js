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
 *
 *
 * @jest-environment node
 */

const fs = require('fs')
const os = require('os')
const path = require('path')
const env = require('../src-electron/util/env')
const recentFiles = require('../src-electron/util/recent-files')
const { timeout } = require('./test-util')

let tmpDir
let previousDays
let previousDir

beforeAll(() => {
  env.setDevelopmentEnv()
  previousDir = env.appDirectory()
  previousDays = env.getRecentFileDays()
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zap-recent-'))
  env.setAppDirectory(tmpDir)
  env.setRecentFileDays(21)
})

afterAll(() => {
  env.setRecentFileDays(previousDays)
  env.setAppDirectory(previousDir)
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

test(
  'Records .zap files and ignores other extensions',
  () => {
    let zapPath = path.join(tmpDir, 'sample.zap')
    let otherPath = path.join(tmpDir, 'notes.txt')
    fs.writeFileSync(zapPath, '{}')
    fs.writeFileSync(otherPath, 'nope')

    recentFiles.recordRecentFile(otherPath)
    recentFiles.recordRecentFile(zapPath)

    let list = recentFiles.getRecentFiles(21)
    expect(list).toHaveLength(1)
    expect(list[0].path).toBe(path.resolve(zapPath))
    expect(list[0].lastUsed).toBeGreaterThan(0)
  },
  timeout.short()
)

test(
  'Drops files older than the configured window',
  () => {
    let oldPath = path.join(tmpDir, 'old.zap')
    fs.writeFileSync(oldPath, '{}')
    recentFiles.recordRecentFile(oldPath)

    let stored = JSON.parse(
      fs.readFileSync(recentFiles.recentFilesPath(), 'utf8')
    )
    stored = stored.map((entry) =>
      entry.path === path.resolve(oldPath)
        ? { ...entry, lastUsed: Date.now() - 30 * 24 * 60 * 60 * 1000 }
        : entry
    )
    fs.writeFileSync(recentFiles.recentFilesPath(), JSON.stringify(stored))

    let list = recentFiles.getRecentFiles(21)
    expect(list.find((e) => e.path === path.resolve(oldPath))).toBeUndefined()
  },
  timeout.short()
)

test(
  'Drops files that no longer exist',
  () => {
    let gone = path.join(tmpDir, 'gone.zap')
    fs.writeFileSync(gone, '{}')
    recentFiles.recordRecentFile(gone)
    fs.unlinkSync(gone)

    let list = recentFiles.getRecentFiles(21)
    expect(list.find((e) => e.path === path.resolve(gone))).toBeUndefined()
  },
  timeout.short()
)
