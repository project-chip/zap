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
const path = require('path')
const importJs = require('../src-electron/importexport/import.js')
const dbEnum = require('../src-electron/db/db-enum.js')

test('Test file existence', () => {
  return importJs
    .readDataFromFile(path.join(__dirname, 'resource/save-file-1.json'))
    .then((state) => {
      expect(state).not.toBe(null)
      expect(state.creator).toBe('zap')
      expect(state.package[0].type).toBe(dbEnum.packageType.zclProperties)
    })
})
