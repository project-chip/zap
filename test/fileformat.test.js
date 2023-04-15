/**
 *
 *    Copyright (c) 2023 Silicon Labs
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

const importJs = require('../src-electron/importexport/import')
const testUtil = require('./test-util')
const fileFormat = require('../src-electron/importexport/file-format')

const testFile = testUtil.otherTestFile.fileFormat0

test('Conversion', async () => {
  // Read format 0 file, make sure it's format 0.
  state1 = await importJs.readDataFromFile(testFile)
  expect(state1.fileFormat).toBeUndefined()

  // Force it to convert to format 1
  state1.fileFormat = 1
  state2 = fileFormat.convertToFile(state1)
  expect(state1.fileFormat).toEqual(1)

  state3 = fileFormat.convertFromFile(state2)

  expect(JSON.stringify(state1, null, 2)).toEqual(
    JSON.stringify(state3, null, 2)
  )
})
