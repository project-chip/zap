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
  if (toks.length != 12) throw new Error(`Invalid format: ${a}`)

  let attr = {}
  attr.included = toks[0] === '+' ? 1 : 0
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
    a.included === 1 ? '+' : '-',
    types.intToHexString(a.code, 2),
    a.mfgCode != null ? types.intToHexString(a.mfgCode, 2) : '      ',
    a.side,
    a.storageOption === 'External' ? 'Ext' : a.storageOption,
    a.singleton ? 'singleton' : '         ',
    a.bounded ? 'bound' : '     ',
    a.defaultValue.padStart(20, ' '),
    a.reportable,
    a.minInterval,
    a.maxInterval,
    a.reportableChange,
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
    cmd.mfgCode != null ? types.intToHexString(cmd.mfgCode, 2) : '      ',
    cmd.source,
    cmd.incoming,
    cmd.outgoing,
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
  if (toks.length != 4) throw new Error(`Invalid format: ${a}`)

  let evnt = {}
  evnt.included = toks[0] === '+' ? 1 : 0
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
    ev.included === 1 ? '+' : '-',
    types.intToHexString(ev.code, 2),
    ev.mfgCode != null ? types.intToHexString(ev.mfgCode, 2) : '      ',
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
  if (state.fileFormat && state.fileFormat === 1) {
    // Convert key value pairs
    if (state.keyValuePairs) {
      state.keyValuePairs = packKeyValuePairs(state.keyValuePairs)
    }

    for (let ept of state.endpointTypes) {
      // Now cleanse the clusters
      for (let c of ept.clusters) {
        cleanseCluster(c)
      }

      for (let c of ept.clusters) {
        // Now we convert all the attributes...
        if (c.attributes) {
          let atts = []
          for (let a of c.attributes) {
            atts.push(packAttribute(a))
          }
          c.attributes = atts
        }

        // ... and commands...
        if (c.commands) {
          let cmds = []
          for (let cmd of c.commands) {
            cmds.push(packCommand(cmd))
          }
          c.commands = cmds
        }

        // ... and events.
        if (c.events) {
          let evs = []
          for (let ev of c.events) {
            evs.push(packEvent(ev))
          }
          c.events = evs
        }
      }
    }

    return state
  } else if (state.fileFormat && state.fileFormat === 2) {
    for (let ept of state.endpointTypes) {
      let enabledClusters = ept.clusters.filter((c) => c.enabled)
      ept.clusters = enabledClusters
      for (let c of enabledClusters) {
        let enabledAttributes = c.attributes
          ? c.attributes.filter((a) => a.included)
          : null
        if (enabledAttributes) {
          c.attributes = enabledAttributes
        }

        // ... and commands...
        let enabledCommands = c.commands
          ? c.commands.filter((c) => c.isEnabled)
          : null
        if (enabledCommands) {
          c.commands = enabledCommands
        }

        // ... and events.
        let enabledEvents = c.events ? c.events.filter((e) => e.included) : null
        if (enabledEvents) {
          c.events = enabledEvents
        }
      }
    }
    return state
  } else {
    return state
  }
}

/**
 * Updates the clusters with the new command format where there is isIncoming
 * and isEnabled instead of incoming and outgoing
 * @param {*} cluster
 * @param {*} clusterToCommandMap
 * @returns state or null
 */
function updateCommands(cluster, clusterToCommandMap) {
  if (cluster.commands) {
    for (let cmd of cluster.commands) {
      // Returning the state since the .zap file has already been updated
      // to the new format based on the schema correction for
      // endpoint_type_command
      if ('isIncoming' in cmd) {
        return true
      }
      // Create the cmd in the new format where there is no incoming and outgoing
      let tempCmdOutgoing = { ...cmd }
      let tempCmdIncoming = { ...cmd }
      if (tempCmdOutgoing.outgoing) {
        tempCmdOutgoing.isIncoming = 0
        tempCmdOutgoing.isEnabled = cmd.outgoing
        if (cluster.side in clusterToCommandMap[cluster.name]) {
          clusterToCommandMap[cluster.name][cluster.side].push(tempCmdOutgoing)
        } else {
          clusterToCommandMap[cluster.name][cluster.side] = [tempCmdOutgoing]
        }
      }
      if (tempCmdIncoming.incoming) {
        tempCmdIncoming.isIncoming = 1
        tempCmdIncoming.isEnabled = cmd.incoming
        let clusterSide = cmd.source == 'client' ? 'server' : 'client'
        if (clusterSide in clusterToCommandMap[cluster.name]) {
          clusterToCommandMap[cluster.name][clusterSide].push(tempCmdIncoming)
        } else {
          clusterToCommandMap[cluster.name][clusterSide] = [tempCmdIncoming]
        }
      }
      delete tempCmdOutgoing.incoming
      delete tempCmdOutgoing.outgoing
      delete tempCmdIncoming.incoming
      delete tempCmdIncoming.outgoing
    }
  }
  return false
}

/**
 * This function gets the JSON from the file, and converts it to the correct database state
 */
function convertFromFile(state) {
  if (state.fileFormat && state.fileFormat > 0) {
    // Convert key value pairs
    if (state.keyValuePairs) {
      state.keyValuePairs = unpackKeyValuePairs(state.keyValuePairs)
    }

    for (let ept of state.endpointTypes) {
      let clusterToCommandMap = {}
      // Now uncleanse the clusters
      for (let c of ept.clusters) {
        uncleanseCluster(c)
        if (!(c.name in clusterToCommandMap)) {
          clusterToCommandMap[c.name] = {}
        }

        // Now we convert all the attributes...
        if (c.attributes) {
          let atts = []
          for (let a of c.attributes) {
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
          for (let cmd of c.commands) {
            if (_.isString(cmd)) {
              cmds.push(unpackCommand(cmd))
            } else {
              cmds.push(cmd)
            }
          }
          c.commands = cmds
        }

        let updateCommandRes = updateCommands(c, clusterToCommandMap)
        if (updateCommandRes) {
          return state
        }

        // ... and events.
        if (c.events) {
          let evs = []
          for (let ev of c.events) {
            if (_.isString(ev)) {
              evs.push(unpackEvent(ev))
            } else {
              evs.push(ev)
            }
          }
          c.events = evs
        }
      }

      // Use the above map to update the commands within all clusters
      for (let c of ept.clusters) {
        if (clusterToCommandMap[c.name][c.side]) {
          c.commands = clusterToCommandMap[c.name][c.side]
        } else {
          c.commands = []
        }
      }
    }
    return state
  } else {
    // Convert key value pairs
    if ('endpointTypes' in state) {
      if (!Array.isArray(state.endpointTypes)) {
        return state
      }
      for (let ept of state.endpointTypes) {
        // Create a cluster to command map. Update the map correctly such that
        // the right commands are stored under the right side of the cluster
        // i.e. if cluster side is the same as command source then command is
        // stored under the cluster side as outgoing command and if cluster side
        // is not the same as command source then command is stored on the
        // opposite cluster side as an incoming command.
        // Note: The map is just needed for fixing the old .zap file. This is
        // not needed once the .zap file is updated and saved.
        let clusterToCommandMap = {}
        for (let c of ept.clusters) {
          if (!(c.name in clusterToCommandMap)) {
            clusterToCommandMap[c.name] = {}
          }
          let updateCommandRes = updateCommands(c, clusterToCommandMap)
          if (updateCommandRes) {
            return state
          }
        }

        // Use the above map to update the commands within all clusters
        for (let c of ept.clusters) {
          if (clusterToCommandMap[c.name][c.side]) {
            c.commands = clusterToCommandMap[c.name][c.side]
          } else {
            c.commands = []
          }
        }
      }
      return state
    } else {
      return state
    }
  }
}

exports.convertFromFile = convertFromFile
exports.convertToFile = convertToFile
