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
    if (!('endpoint' in state)) {
      state.endpoint = []
    }
    // configuredEndpoint:*ep:1,pi: -1,di:-1,dv:1,ept:Centralized,nwk:Primary
    var tokens = line.substring('configuredEndpoint:'.length).split(',')
    var endpoint = {}
    tokens.forEach((tok) => {
      if (tok.startsWith('ep:')) {
        endpoint.endpoint = parseInt(tok.substring('ep:'.length))
      } else if (tok.startsWith('*ep:')) {
        endpoint.endpoint = parseInt(tok.substring('*ep:'.length))
      } else if (tok.startsWith('pi:')) {
        endpoint.profileId = parseInt(tok.substring('pi:'.length))
      } else if (tok.startsWith('di:')) {
        endpoint.deviceId = parseInt(tok.substring('di:'.length))
      } else if (tok.startsWith('dv:')) {
        endpoint.deviceVersion = parseInt(tok.substring('dv:'.length))
      } else if (tok.startsWith('ept:')) {
        endpoint.endpointType = tok.substring('ept:'.length)
      } else if (tok.startsWith('nwk:')) {
        endpoint.network = tok.substring('nwk:'.length)
      }
    })
    state.endpoint.push(endpoint)
  } else if (line.startsWith('beginEndpointType:')) {
    // Create a temporary state.endpointType
    state.endpointType = {
      typeName: line.substring('beginEndpointType:'.length),
    }
  } else if (line.startsWith('endEndpointType')) {
    // Stick the endpoint into `state.endpointTypes[endpointType.typeName]'
    if (!('endpointTypes' in state)) {
      state.endpointTypes = {}
    }
    state.endpointTypes[state.endpointType.typeName] = state.endpointType
    delete state.endpointType
  } else if (line.startsWith('device:')) {
    state.endpointType.device = line.substring('device:'.length)
  } else if (line.startsWith('deviceId:')) {
    state.endpointType.deviceId = parseInt(line.substring('deviceId:'.length))
  } else if (line.startsWith('profileId:')) {
    state.endpointType.profileId = parseInt(line.substring('profileId:'.length))
  } else if (line == 'beginAttributeDefaults') {
    state.parseState = line
  } else if (line == 'endAttributeDefaults') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttributeDefaultReportingConfig') {
    state.parseState = line
  } else if (line == 'endAttributeDefaultReportingConfig') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:EXTERNALLY_SAVED') {
    state.parseState = line
  } else if (line == 'endAttrList:EXTERNALLY_SAVED') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:OPTIONAL') {
    state.parseState = line
  } else if (line == 'endAttrList:OPTIONAL') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:SINGLETON') {
    state.parseState = line
  } else if (line == 'endAttrList:SINGLETON') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:BOUNDED') {
    state.parseState = line
  } else if (line == 'endAttrList:BOUNDED') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:SAVED_TO_FLASH') {
    state.parseState = line
  } else if (line == 'endAttrList:SAVED_TO_FLASH') {
    state.parseState = 'zclAfv2'
  } else if (line == 'beginAttrList:REPORTABLE') {
    state.parseState = line
  } else if (line == 'endAttrList:REPORTABLE') {
    state.parseState = 'zclAfv2'
  }
}

function parseZclCustomizer(state, line) {
  //console.log(`zclCustomizer:${line}`)
}

async function readIscData(filePath, data) {
  const lines = data.toString().split(/\r?\n/)
  var parser = null
  var state = {
    filePath: filePath,
    featureLevel: 0,
    keyValuePairs: [],
    loader: iscDataLoader,
    parseState: 'init',
  }

  lines.forEach((line) => {
    if (line == '{setupId:zclAfv2') {
      parser = parseZclAfv2Line
      state.parseState = 'zclAfv2'
      return
    }
    if (line == '{setupId:zclCustomizer') {
      parser = parseZclCustomizer
      state.parseState = 'zclCustomizer'
      return
    }

    if (line == '}') {
      parser = null
      state.parseState = 'nonSetup'
      return
    }

    if (parser != null) parser(state, line)
  })

  delete state.parseState
  return state
}

async function iscDataLoader(db, state, sessionId) {
  throw 'ISC not yet supported.'
}

exports.readIscData = readIscData
