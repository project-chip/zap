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
 */

const _ = require('lodash')
const types = require('../util/types')

// Converts attribute storage string to internal representation
function unpackAttribute(a) {
  let data
  if (a.includes('=>')) {
    data = a.split('=>')[0]
  } else {
    data = a
  }
  let toks = data.split(' | ').map((x) => x.trim())
  if (toks.length != 11) throw new Error(`Invalid format: ${a}`)

  let attr = {}
  attr.included = 1
  attr.code = types.hexStringToInt(toks[1])
  if (toks[2].length == 0) {
    attr.mfgCode = null
  } else {
    attr.mfgCode = types.hexStringToInt(toks[2])
  }
  attr.side = toks[3]
  attr.storageOption = toks[4] === 'Ext' ? 'External' : toks[4]
  attr.singleton = toks[5] === 'singleton' ? 1 : 0
  attr.bounded = toks[6] === 'bound' ? 1 : 0
  attr.defaultValue = toks[7]
  attr.reportable = parseInt(toks[8])
  attr.minInterval = parseInt(toks[9])
  attr.maxInterval = parseInt(toks[10])
  attr.reportableChange = parseInt(toks[11])
  return attr
}

// Converts attribute object for internal representation.
function packAttribute(a) {
  let data = [
    types.intToHexString(a.code, 2).padStart(10, ' '),
    a.mfgCode != null ? types.intToHexString(a.mfgCode, 2) : '       ',
    a.side,
    a.storageOption === 'External'
      ? 'Ext'.padStart(13, ' ')
      : a.storageOption.padStart(13, ' '),
    a.singleton ? 'singleton' : '         ',
    a.bounded ? 'bound'.padStart(2, ' ') : '       ',
    a.defaultValue ? a.defaultValue.padStart(20, ' ') : ' '.padStart(20, ' '),
    a.reportable ? String(a.reportable).padStart(10, ' ') : '          ',
    a.minInterval
      ? String(a.minInterval).padStart(19, ' ')
      : ' '.padStart(19, ' '),
    a.maxInterval
      ? String(a.maxInterval).padStart(19, ' ')
      : ' '.padStart(19, ' '),
    a.reportableChange
      ? String(a.reportableChange).padStart(19, ' ')
      : ' '.padStart(19, ' '),
  ].join(' | ')
  return `${data} => ${a.name} [${a.type}]`
}

// Converts command storage string to internal representation
function unpackCommand(c) {
  let data
  if (c.includes('=>')) {
    data = c.split('=>')[0]
  } else {
    data = c
  }
  let toks = data.split(' | ').map((x) => x.trim())
  if (toks.length != 5) throw new Error(`Invalid format: ${a}`)

  let cmd = {}
  cmd.code = types.hexStringToInt(toks[0])
  if (toks[1].length == 0) {
    cmd.mfgCode = null
  } else {
    cmd.mfgCode = types.hexStringToInt(toks[1])
  }
  cmd.source = toks[2]
  cmd.incoming = toks[3] === '1' ? 1 : 0
  cmd.outgoing = toks[4] === '1' ? 1 : 0
  return cmd
}

// Converts command object for file representation.
function packCommand(cmd) {
  let data = [
    types.intToHexString(cmd.code, 2),
    cmd.mfgCode != null ? types.intToHexString(cmd.mfgCode, 2) : '       ',
    cmd.source,
    String(cmd.incoming).padStart(8, ' '),
    String(cmd.outgoing).padStart(7, ' '),
  ].join(' | ')
  return `${data} => ${cmd.name}`
}

// Convert string representation to internal object representation
function unpackEvent(ev) {
  let data
  if (ev.includes('=>')) {
    data = ev.split('=>')[0]
  } else {
    data = ev
  }
  let toks = data.split(' | ').map((x) => x.trim())
  if (toks.length != 3) throw new Error(`Invalid format: ${a}`)

  let evnt = {}
  evnt.code = types.hexStringToInt(toks[1])
  if (toks[2].length == 0) {
    evnt.mfgCode = null
  } else {
    evnt.mfgCode = types.hexStringToInt(toks[2])
  }
  evnt.side = toks[3]

  return evnt
}

// Converts event object for file representation
function packEvent(ev) {
  let data = [
    types.intToHexString(ev.code, 2),
    ev.mfgCode != null ? types.intToHexString(ev.mfgCode, 2) : '       ',
    ev.side,
  ].join(' | ')
  return `${data} => ${ev.name}`
}

// Converts the key value pairs in the file into internal representation
function unpackKeyValuePairs(keyValuePairs) {
  let kvps = []
  for (let kvp of keyValuePairs) {
    if (_.isString(kvp)) {
      let pair = kvp.split('=').map((x) => x.trim())
      kvps.push({
        key: pair[0],
        value: pair[1],
      })
    } else {
      kvps.push(kvp)
    }
  }
  return kvps
}

// Packs key value pairs for extenrnal representation
function packKeyValuePairs(keyValuePairs) {
  let props = []
  for (let kvp of keyValuePairs) {
    props.push(`${kvp.key} = ${kvp.value}`)
  }
  return props
}

// Cleanses toplevel cluster data.
function cleanseCluster(c) {
  c.code = '0x' + c.code.toString(16).padStart(4, '0')
  if (c.mfgCode != null) {
    c.mfgCode = '0x' + c.mfgCode.toString(16).padStart(4, '0')
  } else {
    delete c.mfgCode
  }
}

// Uncleanses the toplevel cluster data.
function uncleanseCluster(c) {
  if (_.isString(c.code)) {
    let code = c.code
    if (code.startsWith('0x')) code = code.substring(2)
    c.code = parseInt(code, 16)
  }

  if (_.isString(c.mfgCode)) {
    let code = c.mfgCode
    if (code.startsWith('0x')) code = code.substring(2)
    c.mfgCode = parseInt(code, 16)
  }
}

/**
 * This function gets the state from database and converts it for a given file format.
 *
 * @param {*} state
 * @param {*} fileFormat
 */
function convertToFile(state) {
  if (state.fileFormat && state.fileFormat === 2) {
    // Convert key value pairs
    if (state.keyValuePairs) {
      state.keyValuePairs = packKeyValuePairs(state.keyValuePairs)
    }

    for (let ept of state.endpointTypes) {
      // Now cleanse the clusters
      let enabledClusters = ept.clusters.filter((c) => c.enabled)
      ept.clusters = enabledClusters
      for (let c of enabledClusters) {
        cleanseCluster(c)
      }

      for (let c of enabledClusters) {
        // Now we convert all the attributes...
        let enabledAttributes = c.attributes
          ? c.attributes.filter((a) => a.included)
          : null
        if (enabledAttributes) {
          let atts = [
            '   code    | mfgCode |  side  | storageOption | singleton | bounded |     defaultValue     | reportable |     minInterval     |     maxInterval     |   reportableChange',
          ]
          for (let a of enabledAttributes) {
            atts.push(packAttribute(a))
          }
          c.attributes = atts
        }

        // ... and commands...
        let enabledCommands = c.commands
          ? c.commands.filter((c) => c.incoming || c.outgoing)
          : null
        if (enabledCommands) {
          let cmds = [' code  | mfgCode | source | incoming | outgoing']
          for (let cmd of enabledCommands) {
            cmds.push(packCommand(cmd))
          }
          c.commands = cmds
        }

        // ... and events.
        let enabledEvents = c.events ? c.events.filter((e) => e.included) : null
        if (enabledEvents) {
          let evs = [' code  | mfgCode | side']
          for (let ev of enabledEvents) {
            evs.push(packEvent(ev))
          }
          c.events = evs
        }
      }
    }

    return state
  } else {
    return state
  }
}

/**
 * This function gets the JSON from the file, and converts it to the correct database state
 */
function convertFromFile(state) {
  if (state.fileFormat && state.fileFormat === 2) {
    // Convert key value pairs
    if (state.keyValuePairs) {
      state.keyValuePairs = unpackKeyValuePairs(state.keyValuePairs)
    }

    for (let ept of state.endpointTypes) {
      // Now uncleanse the clusters
      for (let c of ept.clusters) {
        uncleanseCluster(c)

        // Now we convert all the attributes...
        if (c.attributes) {
          let atts = []
          for (let [i, a] of c.attributes.entries()) {
            if (i === 0) {
              continue
            }
            if (_.isString(a)) {
              atts.push(unpackAttribute(a))
            } else {
              atts.push(a)
            }
          }
          c.attributes = atts
        }

        // ... and commands.
        if (c.commands) {
          let cmds = []
          for (let [i, cmd] of c.commands.entries()) {
            if (i === 0) {
              continue
            }
            if (_.isString(cmd)) {
              cmds.push(unpackCommand(cmd))
            } else {
              cmds.push(cmd)
            }
          }
          c.commands = cmds
        }

        // ... and events.
        if (c.events) {
          let evs = []
          for (let [i, ev] of c.events.entries()) {
            if (i === 0) {
              continue
            }
            if (_.isString(ev)) {
              evs.push(unpackEvent(ev))
            } else {
              evs.push(ev)
            }
          }
          c.events = evs
        }
      }
    }
    return state
  } else {
    return state
  }
}

exports.convertFromFile = convertFromFile
exports.convertToFile = convertToFile
