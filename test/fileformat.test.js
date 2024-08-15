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

test('Conversion of format 0 to format 1', async () => {
  // Read format 0 file, make sure it's format 0.
  state1 = await importJs.readDataFromFile(testUtil.otherTestFile.fileFormat0)
  expect(state1.fileFormat).toBeUndefined()
  // Request updated file format.
  state1.fileFormat = 1
  let state1JSON = JSON.stringify(state1, null, 2)

  // Force it to convert to format 1
  state1.fileFormat = 1
  state2 = fileFormat.convertToFile(state1)
  expect(state2.fileFormat).toEqual(1)
  let state2JSON = JSON.stringify(state2, null, 2)

  state3 = fileFormat.convertFromFile(state2)
  let state3JSON = JSON.stringify(state2, null, 2)

  expect(state1JSON).not.toEqual(state2JSON)

  // state3JSON is functionally the same, but NOT equal to state1JSON
  //expect(state3JSON).toEqual(state1JSON)
})

test('Read format 1', async () => {
  let state = await importJs.readDataFromFile(
    testUtil.otherTestFile.fileFormat1,
  )
  expect(state).not.toBeNull()
  expect(state.endpointTypes.length).toEqual(1)
  expect(state.endpointTypes[0].clusters.length).toEqual(3)
  expect(state.endpoints.length).toEqual(1)
})

test('Future file', async () => {
  try {
    await importJs.readDataFromFile(testUtil.otherTestFile.fileFormatFuture)
    fail('Import should fail.')
  } catch (err) {
    expect(err.message).toContain('requires feature level 99999, we only have')
  }
})
