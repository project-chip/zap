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
  if (line.startsWith('configuredEndpoint:')) {
    // configuredEndpoint:*ep:1,pi: -1,di:-1,dv:1,ept:Centralized,nwk:Primary
  } else if (line.startsWith('beginEndpointType:')) {
    // Create a temporary state.endpoint
    state.endpoint = {
      typeName: line.substring('beginEndpointType:'.length),
    }
  } else if (line.startsWith('endEndpointType')) {
    // Stick the endpoint into `state.endpoints[endpoint.typeName]'
    if (!('endpoints' in state)) {
      state.endpoints = {}
    }
    state.endpoints[state.endpoint.typeName] = state.endpoint
    delete state.endpoint
  } else if (line.startsWith('device:')) {
    state.endpoint.device = line.substring('device:'.length)
  } else if (line.startsWith('deviceId:')) {
    state.endpoint.deviceId = parseInt(line.substring('deviceId:'.length))
  } else if (line.startsWith('profileId:')) {
    state.endpoint.profileId = parseInt(line.substring('profileId:'.length))
  }
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
