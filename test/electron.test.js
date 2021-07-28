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

const electronMain = require('../src-electron/main-process/electron-main')
const window = require('../src-electron/ui/window.js')
const { timeout } = require('./test-util.js')

test(
  'Make sure electron main process loads',
  () => {
    expect(electronMain.loaded).toBeTruthy()
  },
  timeout.short()
)

test(
  'Test constructing queries for the window',
  () => {
    process.env.DEV = true
    process.env.MODE = 'electron'
    let query = window.createQueryString('um', 1234)
    expect(query).toBe(`?uiMode=um&restPort=1234`)

    process.env.DEV = false
    process.env.MODE = ''
    query = window.createQueryString('um')
    expect(query).toBe(`?uiMode=um`)
    query = window.createQueryString()
    expect(query).toBe(``)
  },
  timeout.short()
)

require('../src-electron/main-process/preference.ts')
