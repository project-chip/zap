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
 */

function parseZclAfv2Line(state, line) {
  //console.log(`zclAfv2:${line}`)
}

function parseZclCustomizer(state, line) {
  //console.log(`zclCustomizer:${line}`)
}

async function readIscData(filePath, data) {
  const lines = data.toString().split(/\r?\n/)
  var parser = null
  var state = {}
  lines.forEach((line) => {
    if (line == '{setupId:zclAfv2') {
      parser = parseZclAfv2Line
      return
    }
    if (line == '{setupId:zclCustomizer') {
      parser = parseZclCustomizer
      return
    }

    if (line == '}') {
      parser = null
      return
    }

    if (parser != null) parser(state, line)
  })
  state.loader = iscDataLoader
  return state
}

async function iscDataLoader(db, state, sessionId) {
  throw 'ISC not yet supported.'
}

exports.readIscData = readIscData
