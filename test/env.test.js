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

const env = require('../src-electron/util/env.js')

test('Test environment', () => {
  expect(env.appDirectory().length).toBeGreaterThan(10)
  expect(env.sqliteFile().length).toBeGreaterThan(10)
  expect(env.iconsDirectory().length).toBeGreaterThan(10)
})

test('Test logging', () => {
  env.logSql('Sql log test.')
  env.logInfo('Info log test.')
  env.logWarning('Warn log test.')
  env.logError('Error log test.')
})

test('Main database', () => {
  env.setMainDatabase('stalin')
  expect(env.mainDatabase()).toBe('stalin')
})
