/**
 *
 *    Copyright (c) 2024 Silicon Labs
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

/**
 * The `zap edit` command surface, described as data.
 *
 * The yargs command tree and the machine readable output of `zap edit help`
 * are both generated from this one description, so what the parser accepts and
 * what the help advertises cannot drift apart. That matters most for callers
 * that are not people: a script or an agent can read the schema, learn every
 * operation and parameter, and never have to guess a flag name.
 *
 * @module CLI API: command surface
 */

const env = require('../util/env.js')

/**
 * Selects an endpoint. Present on nearly every operation, and always the
 * endpoint identifier rather than a database row id.
 */
const endpointOption = {
  desc: 'Endpoint identifier, as shown in the GUI (not a row id).',
  type: 'number',
  required: true
}

/** Selects a cluster within an endpoint. */
const clusterOption = {
  desc: 'Cluster name, define or code. For example "On/Off", ON_OFF or 0x0006.',
  type: 'string',
  required: true
}

/** Narrows a listing to entries whose name or code contains some text. */
const filterOption = {
  desc: 'Only show entries whose name or code contains this text.',
  type: 'string'
}

/** Narrows a listing to the entries that are turned on. */
const enabledOnlyOption = {
  desc: 'Only show entries that are enabled.',
  type: 'boolean',
  default: false
}

/**
 * The groups of operations, mirroring the panels of the user interface.
 *
 * Each operation names the `cli-operations` entry it runs, describes itself,
 * and lists its options by command line flag. Option keys are the flag spelling
 * (`device-type`); the schema also reports the camelCase spelling that batch
 * scripts use (`deviceType`).
 */
const groups = {
  endpoint: {
    describe: 'Create, change, copy and delete endpoints.',
    operations: {
      list: {
        operation: 'endpoint.list',
        describe: 'List the endpoints with their device types.',
        readOnly: true,
        options: {}
      },
      create: {
        operation: 'endpoint.create',
        describe: 'Create an endpoint and its endpoint type.',
        options: {
          endpoint: {
            desc: 'Endpoint identifier to create.',
            type: 'number',
            required: true
          },
          'device-type': {
            desc: 'Device type name or code. Repeat for a multi-device endpoint.',
            type: 'array',
            required: true
          },
          'device-version': {
            desc: 'Device type version. Defaults to 1.',
            type: 'array'
          },
          profile: {
            desc: 'Profile id. Defaults to the profile of the first device type.',
            type: 'string'
          },
          network: { desc: 'Network id. Defaults to 0.', type: 'number' },
          parent: {
            desc: 'Identifier of the parent endpoint.',
            type: 'number'
          },
          name: { desc: 'Endpoint type name.', type: 'string' }
        }
      },
      update: {
        operation: 'endpoint.update',
        describe:
          'Change the identifier, profile, network or parent of an endpoint.',
        options: {
          endpoint: {
            desc: 'Endpoint identifier to update.',
            type: 'number',
            required: true
          },
          'new-endpoint': {
            desc: 'New endpoint identifier.',
            type: 'number'
          },
          profile: { desc: 'New profile id.', type: 'string' },
          network: { desc: 'New network id.', type: 'number' },
          parent: {
            desc: 'New parent endpoint identifier. Pass an empty value to detach.',
            type: 'string'
          }
        }
      },
      delete: {
        operation: 'endpoint.delete',
        describe: 'Delete an endpoint and the endpoint type behind it.',
        options: {
          endpoint: {
            desc: 'Endpoint identifier to delete.',
            type: 'number',
            required: true
          },
          force: {
            desc: 'Delete even if other endpoints name this one as their parent.',
            type: 'boolean',
            default: false
          }
        }
      },
      duplicate: {
        operation: 'endpoint.duplicate',
        describe:
          'Copy an endpoint with all of its cluster and element selections.',
        options: {
          endpoint: {
            desc: 'Endpoint identifier to copy.',
            type: 'number',
            required: true
          },
          'new-endpoint': {
            desc: 'Identifier for the copy. Defaults to the lowest free one.',
            type: 'number'
          }
        }
      }
    }
  },

  devicetype: {
    describe: 'Manage the device types of an endpoint.',
    operations: {
      list: {
        operation: 'devicetype.list',
        describe:
          'List the device types on an endpoint, or every available device type.',
        readOnly: true,
        options: {
          endpoint: { desc: 'Endpoint identifier.', type: 'number' },
          all: {
            desc: 'List every device type the configuration could use.',
            type: 'boolean',
            default: false
          },
          filter: filterOption
        }
      },
      add: {
        operation: 'devicetype.add',
        describe:
          'Add a device type to an endpoint, keeping the existing ones.',
        options: {
          endpoint: endpointOption,
          'device-type': {
            desc: 'Device type name or code.',
            type: 'array',
            required: true
          },
          'device-version': {
            desc: 'Device type version. Defaults to 1.',
            type: 'number'
          }
        }
      },
      remove: {
        operation: 'devicetype.remove',
        describe: 'Remove a device type from an endpoint.',
        options: {
          endpoint: endpointOption,
          'device-type': {
            desc: 'Device type name or code.',
            type: 'array',
            required: true
          }
        }
      },
      set: {
        operation: 'devicetype.set',
        describe: 'Replace the whole device type list of an endpoint.',
        options: {
          endpoint: endpointOption,
          'device-type': {
            desc: 'Device type name or code, in order. The first one is primary.',
            type: 'array',
            required: true
          },
          'device-version': {
            desc: 'Device type version, once for all or once per device type.',
            type: 'array'
          }
        }
      }
    }
  },

  cluster: {
    describe: 'Enable and disable clusters on an endpoint.',
    operations: {
      list: {
        operation: 'cluster.list',
        describe:
          'List the clusters of an endpoint, or every available cluster.',
        readOnly: true,
        options: {
          endpoint: { desc: 'Endpoint identifier.', type: 'number' },
          all: {
            desc: 'List every cluster the configuration could use.',
            type: 'boolean',
            default: false
          },
          'enabled-only': enabledOnlyOption,
          filter: filterOption
        }
      },
      enable: {
        operation: 'cluster.enable',
        describe:
          'Enable a cluster. The first time, its mandatory attributes and commands come along.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          side: {
            desc: 'Which side of the cluster to act on.',
            choices: ['client', 'server', 'both'],
            required: true
          }
        }
      },
      disable: {
        operation: 'cluster.disable',
        describe: 'Disable a cluster.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          side: {
            desc: 'Which side of the cluster to act on.',
            choices: ['client', 'server', 'both'],
            required: true
          }
        }
      }
    }
  },

  attribute: {
    describe:
      'Configure attributes: inclusion, defaults, storage and reporting.',
    operations: {
      list: {
        operation: 'attribute.list',
        describe:
          'List the attributes of a cluster with their configuration. The fixed column names the fields the data model decides.',
        readOnly: true,
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          'enabled-only': enabledOnlyOption,
          filter: filterOption
        }
      },
      set: {
        operation: 'attribute.set',
        describe: 'Change any combination of attribute settings.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          attribute: {
            desc: 'Attribute name, define or code.',
            type: 'string',
            required: true
          },
          side: {
            desc: 'Cluster side. Inferred when the attribute exists on one side only.',
            choices: ['client', 'server']
          },
          enabled: {
            desc: 'Include the attribute in the configuration.',
            type: 'boolean'
          },
          default: {
            desc: 'Default value. Pass "null" for a nullable attribute.',
            type: 'string'
          },
          storage: {
            desc: 'Storage option. Fixed at External for an attribute served through the Attribute Access Interface.',
            choices: ['RAM', 'NVM', 'External']
          },
          singleton: { desc: 'Mark as singleton.', type: 'boolean' },
          bounded: { desc: 'Mark as bounded.', type: 'boolean' },
          reporting: { desc: 'Enable reporting.', type: 'boolean' },
          'min-interval': {
            desc: 'Reporting minimum interval.',
            type: 'number'
          },
          'max-interval': {
            desc: 'Reporting maximum interval.',
            type: 'number'
          },
          'reportable-change': { desc: 'Reportable change.', type: 'number' }
        }
      },
      enable: {
        operation: 'attribute.enable',
        describe: 'Include an attribute in the configuration.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          attribute: {
            desc: 'Attribute name, define or code.',
            type: 'string',
            required: true
          },
          side: {
            desc: 'Cluster side. Inferred when the attribute exists on one side only.',
            choices: ['client', 'server']
          }
        }
      },
      disable: {
        operation: 'attribute.disable',
        describe: 'Exclude an attribute from the configuration.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          attribute: {
            desc: 'Attribute name, define or code.',
            type: 'string',
            required: true
          },
          side: {
            desc: 'Cluster side. Inferred when the attribute exists on one side only.',
            choices: ['client', 'server']
          }
        }
      }
    }
  },

  command: {
    describe: 'Enable and disable cluster commands.',
    operations: {
      list: {
        operation: 'command.list',
        describe:
          'List the commands of a cluster with their incoming and outgoing state.',
        readOnly: true,
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          'enabled-only': enabledOnlyOption,
          filter: filterOption
        }
      },
      enable: {
        operation: 'command.enable',
        describe: 'Enable a command.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          command: {
            desc: 'Command name or code.',
            type: 'string',
            required: true
          },
          direction: {
            desc: 'in is a command the device receives, out is one it sends.',
            choices: ['in', 'out', 'both'],
            required: true
          }
        }
      },
      disable: {
        operation: 'command.disable',
        describe: 'Disable a command.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          command: {
            desc: 'Command name or code.',
            type: 'string',
            required: true
          },
          direction: {
            desc: 'in is a command the device receives, out is one it sends.',
            choices: ['in', 'out', 'both'],
            required: true
          }
        }
      }
    }
  },

  event: {
    describe: 'Enable and disable cluster events.',
    operations: {
      list: {
        operation: 'event.list',
        describe: 'List the events of a cluster.',
        readOnly: true,
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          'enabled-only': enabledOnlyOption,
          filter: filterOption
        }
      },
      enable: {
        operation: 'event.enable',
        describe: 'Enable an event.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          event: {
            desc: 'Event name or code.',
            type: 'string',
            required: true
          }
        }
      },
      disable: {
        operation: 'event.disable',
        describe: 'Disable an event.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          event: {
            desc: 'Event name or code.',
            type: 'string',
            required: true
          }
        }
      }
    }
  },

  feature: {
    describe: 'Enable and disable Matter cluster features.',
    operations: {
      list: {
        operation: 'feature.list',
        describe: 'List the features of a cluster and the current featureMap.',
        readOnly: true,
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          filter: filterOption
        }
      },
      enable: {
        operation: 'feature.enable',
        describe:
          'Enable a feature, along with the elements its conformance requires.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          feature: {
            desc: 'Feature name, letter code or bit number.',
            type: 'string',
            required: true
          }
        }
      },
      disable: {
        operation: 'feature.disable',
        describe:
          'Disable a feature, along with the elements its conformance requires.',
        options: {
          endpoint: endpointOption,
          cluster: clusterOption,
          feature: {
            desc: 'Feature name, letter code or bit number.',
            type: 'string',
            required: true
          }
        }
      }
    }
  },

  package: {
    describe:
      'Add and remove the custom XML a configuration reads its clusters from.',
    operations: {
      list: {
        operation: 'package.list',
        describe:
          'List the packages of a configuration, including custom XML it names but does not have.',
        readOnly: true,
        options: {
          filter: filterOption
        }
      },
      add: {
        operation: 'package.add',
        describe:
          'Load a custom ZCL XML file, making its clusters available to this configuration. Same as choosing the file on the Extensions page.',
        options: {
          xml: {
            desc: 'Path of the ZCL XML file. Repeat for several files.',
            type: 'array',
            required: true
          }
        }
      },
      remove: {
        operation: 'package.remove',
        describe:
          'Take a custom ZCL XML file back out. The endpoint configuration that came from it goes too, so this needs --force when the clusters are in use.',
        options: {
          xml: {
            desc: 'Path or file name of the custom XML to remove.',
            type: 'string',
            required: true
          }
        }
      }
    }
  }
}

/**
 * Operations that sit directly under `zap edit` rather than in a group.
 */
const topLevel = {
  info: {
    operation: 'config.info',
    describe: 'Show the packages and endpoint count of a configuration.',
    readOnly: true,
    options: {}
  },
  check: {
    operation: 'config.check',
    describe:
      'Validate a configuration and list its notifications, without changing it. Reports what the GUI reports in its validation and notification panels: specification compliance, defaults out of range, provisional clusters, missing response commands. With --strict, exits non-zero when there are errors.',
    readOnly: true,
    options: {
      packages: {
        desc: 'Also report what ZAP has to say about the data model itself, rather than only about this configuration.',
        type: 'boolean',
        default: false
      }
    }
  },
  new: {
    operation: 'new',
    describe: 'Create an empty configuration file.',
    options: {}
  },
  apply: {
    operation: 'apply',
    describe:
      'Apply a list of operations from a YAML or JSON script in a single pass.',
    options: {
      script: {
        desc: 'Script file holding the operations, or - to read stdin.',
        type: 'string',
        required: true
      }
    }
  },
  help: {
    operation: 'help',
    describe:
      'Describe the operations and their options. Add --format json for a machine readable schema.',
    readOnly: true,
    noFile: true,
    options: {}
  }
}

/**
 * Options accepted by every operation.
 */
const globalOptions = {
  zclProperties: {
    desc: `zcl.properties or zcl.json metafile to read in. Also accepts a bundled data model name: ${env
      .builtinZclMetafileNameList()
      .join(', ')}.`,
    alias: ['zcl', 'z'],
    type: 'array',
    default: () => env.builtinSilabsZclMetafile()
  },
  generationTemplate: {
    desc: `generation template metafile (gen-templates.json) to read in. Also accepts a bundled name: ${env
      .builtinGenTemplateMetafileNameList()
      .join(', ')}. When omitted, the test templates matching --zcl are used.`,
    alias: ['gen', 'g'],
    type: 'array',
    default: () => env.builtinTemplateMetafile()
  },
  // Unlike convert, whose job is to re-point a file at new packages, editing
  // has to leave the file's own package references intact. 'ignore' would drop
  // the generation template the file names, so 'fuzzy' is the default here:
  // load what the file asks for, and only guess if it is missing.
  packageMatch: {
    desc: 'How to associate the packages named in the .zap file with loaded ones.',
    choices: ['fuzzy', 'strict', 'ignore'],
    default: 'fuzzy'
  },
  category: {
    desc: 'Restrict lookups to one ZCL package category, such as zigbee or matter. A multiprotocol configuration numbers its endpoints per protocol, so this is how you say which endpoint 1 you mean.',
    type: 'string'
  },
  // Studio installs the UC component behind a cluster when the cluster is
  // switched on in the interface. Both of these have to be given for the same
  // thing to happen from a command line; either alone leaves the edit as a
  // change to the .zap file only.
  studioHttpPort: {
    desc: "Port of Simplicity Studio's HTTP server. With --ideProjectPath, enabling a cluster also installs the UC components it needs.",
    type: 'number'
  },
  ideProjectPath: {
    desc: 'Path of the Simplicity Studio project this .zap belongs to. Required with --studioHttpPort for UC component integration.',
    alias: ['studioProject'],
    type: 'string'
  },
  output: {
    desc: 'Write the result here instead of back into the input file.',
    alias: ['out', 'o'],
    type: 'string'
  },
  dryRun: {
    desc: 'Apply the operations and report, but do not write any file.',
    alias: 'dry-run',
    type: 'boolean',
    default: false
  },
  validate: {
    desc: 'Validate the configuration after editing.',
    type: 'boolean',
    default: true
  },
  strict: {
    desc: 'Refuse to save when this edit introduces validation errors, and make check exit non-zero when it finds any.',
    type: 'boolean',
    default: false
  },
  format: {
    desc: 'Output format. json is intended for scripts and agents.',
    choices: ['text', 'json'],
    default: 'text'
  },
  quiet: {
    desc: 'Suppress progress messages, print only results.',
    alias: 'q',
    type: 'boolean',
    default: false
  },
  suggest: {
    desc: 'Print the commands that are the natural next step. JSON output carries them either way, as nextSteps.',
    type: 'boolean',
    default: true
  },
  new: {
    desc: 'Start from an empty configuration instead of reading the file.',
    type: 'boolean',
    default: false
  },
  force: {
    desc: 'Allow starting from an empty configuration on top of a file that already holds one.',
    type: 'boolean',
    default: false
  },
  rootNode: {
    desc: 'When starting a new configuration whose data model declares a Root Node device type, put it on endpoint 0. Matter needs this; --no-root-node skips it.',
    alias: 'root-node',
    type: 'boolean',
    default: true
  },
  saveFileFormat: {
    desc: 'Save file format to write.',
    type: 'number',
    default: () =>
      process.env[env.environmentVariable.saveFileFormat.name] ||
      env.defaultFileFormat()
  },
  noZapFileLog: {
    desc: `When writing out the .zap file, don't include the log.`,
    type: 'boolean',
    default: false
  },
  noLoadingFailure: {
    desc: 'Ignore ZCL or template metafiles that fail to load.',
    type: 'boolean',
    default: false
  },
  stateDirectory: {
    desc: 'Sets the state directory.',
    default: () =>
      process.env[env.environmentVariable.stateDir.name] || '~/.zap'
  },
  tempState: {
    desc: 'Use a unique temporary directory for state.',
    type: 'boolean',
    default: () =>
      process.env[env.environmentVariable.uniqueStateDir.name] == '1'
  },
  logToStdout: {
    desc: 'Write log output to stdout instead of the log file.',
    type: 'boolean',
    default: false
  },
  cleanupDelay: {
    desc: 'Milliseconds to wait for SQLite cleanup before exiting.',
    type: 'number',
    default: () =>
      process.env[env.environmentVariable.cleanupDelay.name] || '1500'
  },
  noEmoji: {
    desc: 'Disable emoji characters in console output.',
    type: 'boolean',
    default: false
  }
}

/**
 * Things a caller cannot discover from the option list alone, but will
 * otherwise learn by trial and error.
 */
const notes = [
  'Names are matched ignoring case and punctuation, so "On/Off", onoff, ON_OFF and 0x0006 all select the same cluster. An unknown name reports the closest candidates.',
  '--endpoint is the endpoint identifier shown in the GUI and in generated code, never a database row id.',
  'Attributes, commands, events and features can only be configured on a cluster side that is enabled. Run cluster enable first; otherwise the edit would be dropped when the file is saved.',
  'Loading the ZCL metadata dominates the runtime of every invocation. To make several changes, use one apply run rather than several commands.',
  'The default ZCL metafile is the built-in Zigbee one. Pass --zcl ./zcl-builtin/matter/zcl.json for Matter configurations.',
  'A multiprotocol configuration numbers its endpoints per protocol, so the same identifier can appear twice. Use --category zigbee or --category matter to say which one you mean; without it such an operation is refused rather than guessed at.',
  'Editing writes back to the input file unless -o is given. Operations that only read never write. Whatever the file held before is kept alongside it with a ~ suffix.',
  'Saving normalizes a configuration the same way zap convert does: unselected elements are dropped and mandatory ones are added.',
  'A new configuration whose data model declares a Root Node device type, which Matter does, gets it on endpoint 0 automatically. Pass --no-root-node to skip that.',
  'A feature is judged by the conformance its endpoint device type gives it, which is often stricter than the cluster conformance. feature list reports the one that applies and which device type requires it. A feature whose conformance is X or D cannot be selected at all.',
  'Some of an attribute is not yours to set. The storage of one served through the Attribute Access Interface is fixed at External, reporting can be mandatory or forbidden, an external attribute keeps no default value, and nothing but inclusion can be set on an attribute that is not included. attribute list names these in its fixed column, and attribute set refuses them rather than writing something the next read would undo.',
  'Every edit ends by reporting the validation findings and the notifications it introduced, which is what the GUI counts in its toolbar. config check reports both in full for a configuration as it stands.',
  'In Zigbee a cluster configuration is global: where the same cluster is enabled on more than one endpoint, a change to it is applied to all of them, as the GUI does. Matter attributes are per endpoint and are left independent. In a multiprotocol configuration both hold, each on the endpoints of its own protocol.',
  'Endpoint composition is expressed with --parent. Nothing checks that a device type requiring child endpoints has them, in this tool or in the GUI.',
  'Every command ends by suggesting what usually comes next, built from the configuration in hand so it can be run as printed. In JSON those arrive as nextSteps.'
]

/**
 * How to find out which values are legal for the selector options, which is
 * the one thing a static schema cannot answer on its own.
 */
const discovery = [
  {
    question: 'Which device types can I use?',
    command: 'zap edit devicetype list <file.zap> --all --format json'
  },
  {
    question: 'Which clusters can I use?',
    command: 'zap edit cluster list <file.zap> --all --format json'
  },
  {
    question: 'What is already in this configuration?',
    command: 'zap edit endpoint list <file.zap> --format json'
  },
  {
    question: 'Which clusters are enabled on an endpoint?',
    command:
      'zap edit cluster list <file.zap> --endpoint 1 --enabled-only --format json'
  },
  {
    question: 'Which attributes does a cluster have, and how are they set?',
    command:
      'zap edit attribute list <file.zap> --endpoint 1 --cluster On/Off --format json'
  },
  {
    question: 'Which commands, events or features does a cluster have?',
    command:
      'zap edit command list <file.zap> --endpoint 1 --cluster On/Off --format json'
  },
  {
    question: 'Is this configuration compliant?',
    command: 'zap edit check <file.zap> --format json'
  }
]

const examples = [
  {
    description: 'Look at a configuration',
    command: 'zap edit endpoint list light.zap'
  },
  {
    description: 'Add an endpoint',
    command:
      'zap edit endpoint create light.zap --endpoint 1 --device-type "ZLL-onofflight"'
  },
  {
    description: 'Enable a cluster',
    command:
      'zap edit cluster enable light.zap --endpoint 1 --cluster "Level Control" --side server'
  },
  {
    description: 'Configure an attribute',
    command:
      'zap edit attribute set light.zap --endpoint 1 --cluster On/Off --attribute OnOff --enabled --default 1'
  },
  {
    description: 'Make several changes in one pass',
    command: 'zap edit apply light.zap --script changes.yaml'
  },
  {
    description: 'Check a configuration for compliance',
    command: 'zap edit check light.zap'
  },
  {
    description: 'Read the whole command surface as JSON',
    command: 'zap edit help --format json'
  }
]

const batchScript = {
  describe:
    'zap edit apply reads a YAML or JSON list of operations and applies them in one pass. Each entry names an operation in its op field and carries the same parameters as the matching subcommand, using the camelCase parameter names reported for each option. A top level operations: key wrapping the list is also accepted, and --script - reads from stdin. Add --new to start from an empty configuration.',
  example: [
    { op: 'endpoint.create', endpoint: 1, deviceType: 'ZLL-onofflight' },
    {
      op: 'cluster.enable',
      endpoint: 1,
      cluster: 'Level Control',
      side: 'server'
    },
    {
      op: 'attribute.set',
      endpoint: 1,
      cluster: 'Level Control',
      attribute: 'CurrentLevel',
      enabled: true,
      default: '10'
    }
  ]
}

/**
 * Turns a command line flag into the camelCase name that yargs produces and
 * that batch scripts use.
 *
 * @param {string} flag
 * @returns {string} the camelCase parameter name
 */
function toParamName(flag) {
  return flag.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * Resolves an option default, which may be a function so that environment
 * lookups happen at parse time rather than at module load.
 *
 * @param {*} option
 * @returns {*} the default value, or undefined
 */
function defaultOf(option) {
  return typeof option.default === 'function'
    ? option.default()
    : option.default
}

exports.groups = groups
exports.topLevel = topLevel
exports.globalOptions = globalOptions
exports.notes = notes
exports.discovery = discovery
exports.examples = examples
exports.batchScript = batchScript
exports.toParamName = toParamName
exports.defaultOf = defaultOf
