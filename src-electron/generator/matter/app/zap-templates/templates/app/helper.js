/*
 *
 *    Copyright (c) 2020 Project CHIP Authors
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

const YAML = require('yaml');
const fs = require('fs');

// Import helpers from zap core
const zapPath = '../../../../../../';
const templateUtil = require(zapPath + 'generator/template-util.js');
const zclHelper = require(zapPath + 'generator/helper-zcl.js');
const queryCommand = require(zapPath + 'db/query-command.js');
const zclQuery = require(zapPath + 'db/query-zcl.js');
const queryEvents = require(zapPath + 'db/query-event.js');
const cHelper = require(zapPath + 'generator/helper-c.js');
const string = require(zapPath + 'util/string');
const dbEnum = require(zapPath + '../src-shared/db-enum.js');

const StringHelper = require('../../common/StringHelper.js');
const ChipTypesHelper = require('../../common/ChipTypesHelper.js');
const TestHelper = require('../../common/ClusterTestGeneration.js');

// This list of attributes is taken from section '11.2. Global Attributes' of the
// Data Model specification.
const kGlobalAttributes = [
  0xfff8, // GeneratedCommandList
  0xfff9, // AcceptedCommandList
  0xfffa, // EventList
  0xfffb, // AttributeList
  0xfffc, // ClusterRevision
  0xfffd // FeatureMap
];

let configData = undefined;
function getConfigData(global) {
  if (configData === undefined) {
    let f = global.resource('config-data');
    // NOTE: This has to be sync, so we can use this data in if conditions.
    if (f) {
      let rawData = fs.readFileSync(f, { encoding: 'utf8', flag: 'r' });
      configData = YAML.parse(rawData);
    }
  }
  return configData;
}

function isInConfigList(string, listName) {
  const data = getConfigData(this.global);
  return data[listName].includes(string);
}

//  Endpoint-config specific helpers
// these helpers are a Hot fix for the "GENERATED_FUNCTIONS" problem
// They should be removed or replace once issue #4369 is resolved
// These helpers only works within the endpoint_config iterator

// List of clusters with generated functions maintained for backwards
// compatibility. The following lists are outdated and are kept to
// make sure older SDK releases continue working with zap updates.
const endpointClusterWithInit = [
  'Basic',
  'Color Control',
  'Groups',
  'Identify',
  'Level Control',
  'Localization Configuration',
  'Occupancy Sensing',
  'On/Off',
  'Pump Configuration and Control',
  'Scenes',
  'Time Format Localization',
  'Thermostat',
  'Mode Select'
];
const endpointClusterWithAttributeChanged = [
  'Bridged Device Basic',
  'Door Lock',
  'Identify',
  'Pump Configuration and Control',
  'Window Covering',
  'Fan Control'
];
const endpointClusterWithPreAttribute = [
  'Door Lock',
  'Pump Configuration and Control',
  'Thermostat User Interface Configuration',
  'Time Format Localization',
  'Localization Configuration',
  'Mode Select',
  'Fan Control',
  'Thermostat'
];

/**
 * Populate the GENERATED_FUNCTIONS field
 */
function chip_endpoint_generated_functions() {
  const configData = getConfigData(this.global);
  let alreadySetCluster = [];
  let ret = '\\\n';
  this.clusterList.forEach((c) => {
    let clusterName = c.clusterName;
    let functionList = '';
    if (alreadySetCluster.includes(clusterName)) {
      // Only one array of Generated functions per cluster across all endpoints
      return;
    }
    if (c.comment.includes('server')) {
      let hasFunctionArray = false;
      let isClusterInitFunctionIncluded = configData
        ? configData.ClustersWithInitFunctions.includes(clusterName)
        : endpointClusterWithInit.includes(clusterName);
      let isClusterAttributeChangedFunctionIncluded = configData
        ? configData.ClustersWithAttributeChangedFunctions.includes(clusterName)
        : endpointClusterWithAttributeChanged.includes(clusterName);
      let isClusterPreAttributeChangedFunctionIncluded = configData
        ? configData.ClustersWithPreAttributeChangeFunctions.includes(
            clusterName
          )
        : endpointClusterWithPreAttribute.includes(clusterName);
      if (isClusterInitFunctionIncluded) {
        hasFunctionArray = true;
        functionList = functionList.concat(
          `  (EmberAfGenericClusterFunction) emberAf${cHelper.asCamelCased(
            clusterName,
            false
          )}ClusterServerInitCallback,\\\n`
        );
      }

      if (isClusterAttributeChangedFunctionIncluded) {
        functionList = functionList.concat(
          `  (EmberAfGenericClusterFunction) Matter${cHelper.asCamelCased(
            clusterName,
            false
          )}ClusterServerAttributeChangedCallback,\\\n`
        );
        hasFunctionArray = true;
      }

      if (
        configData &&
        'ClustersWithShutdownFunctions' in configData &&
        configData.ClustersWithShutdownFunctions.includes(clusterName)
      ) {
        hasFunctionArray = true;
        functionList = functionList.concat(
          `  (EmberAfGenericClusterFunction) Matter${cHelper.asCamelCased(
            clusterName,
            false
          )}ClusterServerShutdownCallback,\\\n`
        );
      }

      if (isClusterPreAttributeChangedFunctionIncluded) {
        functionList = functionList.concat(
          `  (EmberAfGenericClusterFunction) Matter${cHelper.asCamelCased(
            clusterName,
            false
          )}ClusterServerPreAttributeChangedCallback,\\\n`
        );
        hasFunctionArray = true;
      }

      if (hasFunctionArray) {
        ret = ret.concat(
          `const EmberAfGenericClusterFunction chipFuncArray${cHelper.asCamelCased(
            clusterName,
            false
          )}Server[] = {\\\n`
        );
        ret = ret.concat(functionList);
        ret = ret.concat(`};\\\n`);
        alreadySetCluster.push(clusterName);
      }
    }
  });
  return ret.concat('\n');
}

function chip_endpoint_generated_commands_list(options) {
  let ret = [];
  let index = 0;
  this.clusterList.forEach((c) => {
    let acceptedCommands = [];
    let generatedCommands = [];

    c.commands.forEach((cmd) => {
      if (cmd.mask.includes('incoming_server')) {
        acceptedCommands.push(`${cmd.commandId} /* ${cmd.name} */`);
        if (cmd.responseId !== null) {
          generatedCommands.push(`${cmd.responseId} /* ${cmd.responseName} */`);
        }
      }
    });

    generatedCommands = [...new Set(generatedCommands)].sort((a, b) =>
      a.localeCompare(b)
    );

    if (acceptedCommands.length > 0 || generatedCommands.length > 0) {
      ret.push({ text: `  /* ${c.comment} */\\` });
    }
    if (acceptedCommands.length > 0) {
      acceptedCommands.push('chip::kInvalidCommandId /* end of list */');
      ret.push({
        text: `  /*   AcceptedCommandList (index=${index}) */ \\\n  ${acceptedCommands.join(
          ', \\\n  '
        )}, \\`
      });
      index += acceptedCommands.length;
    }
    if (generatedCommands.length > 0) {
      generatedCommands.push('chip::kInvalidCommandId /* end of list */');
      ret.push({
        text: `  /*   GeneratedCommandList (index=${index})*/ \\\n  ${generatedCommands.join(
          ', \\\n  '
        )}, \\`
      });
      index += generatedCommands.length;
    }
  });
  return templateUtil.collectBlocks(ret, options, this);
}

function chip_endpoint_generated_event_count(options) {
  return this.eventList.length;
}

function chip_endpoint_generated_event_list(options) {
  let comment = null;

  let index = 0;
  let ret = '{ \\\n';
  this.eventList.forEach((ev) => {
    if (ev.comment != comment) {
      ret += `  /* ${ev.comment} */ \\\n`;
      ret += `  /* EventList (index=${index}) */ \\\n`;
      comment = ev.comment;
    }
    ret += `  ${ev.eventId}, /* ${ev.name} */ \\\n`;
    index++;
  });
  ret += '}\n';
  return ret;
}

/**
 * Return endpoint config GENERATED_CLUSTER MACRO
 * To be used as a replacement of endpoint_cluster_list since this one
 * includes the GENERATED_FUNCTIONS array
 */
function chip_endpoint_cluster_list(options) {
  let order = options.hash.order;
  if (order == null || order.length == 0) {
    order =
      'clusterId, attributes, attributeCount, clusterSize, mask, functions, acceptedCommandList, generatedCommandList';
    // eventList and eventCount was added later, so default needs to stay like this for backwards compatibility.
  }
  const configData = getConfigData(this.global);
  let ret = '{ \\\n';
  let totalCommands = 0;
  this.clusterList.forEach((c) => {
    let mask = '';
    let functionArray = c.functions;
    let clusterName = c.clusterName;
    let isClusterInitFunctionIncluded = configData
      ? configData.ClustersWithInitFunctions.includes(clusterName)
      : endpointClusterWithInit.includes(clusterName);
    let isClusterAttributeChangedFunctionIncluded = configData
      ? configData.ClustersWithAttributeChangedFunctions.includes(clusterName)
      : endpointClusterWithAttributeChanged.includes(clusterName);
    let isClusterPreAttributeChangedFunctionIncluded = configData
      ? configData.ClustersWithPreAttributeChangeFunctions.includes(clusterName)
      : endpointClusterWithPreAttribute.includes(clusterName);

    if (c.comment.includes('server')) {
      let hasFunctionArray = false;
      if (isClusterInitFunctionIncluded) {
        c.mask.push('INIT_FUNCTION');
        hasFunctionArray = true;
      }

      if (isClusterAttributeChangedFunctionIncluded) {
        c.mask.push('ATTRIBUTE_CHANGED_FUNCTION');
        hasFunctionArray = true;
      }

      if (
        configData &&
        'ClustersWithShutdownFunctions' in configData &&
        configData.ClustersWithShutdownFunctions.includes(clusterName)
      ) {
        c.mask.push('SHUTDOWN_FUNCTION');
        hasFunctionArray = true;
      }

      if (isClusterPreAttributeChangedFunctionIncluded) {
        c.mask.push('PRE_ATTRIBUTE_CHANGED_FUNCTION');
        hasFunctionArray = true;
      }

      if (hasFunctionArray) {
        functionArray =
          'chipFuncArray' + cHelper.asCamelCased(clusterName, false) + 'Server';
      }
    }

    if (c.mask.length == 0) {
      mask = '0';
    } else {
      mask = c.mask
        .map((m) => `ZAP_CLUSTER_MASK(${m.toUpperCase()})`)
        .join(' | ');
    }

    let acceptedCommands = 0;
    let generatedCommandList = [];
    c.commands.forEach((cmd) => {
      if (cmd.mask.includes('incoming_server')) {
        acceptedCommands++;
        if (cmd.responseId !== null) {
          generatedCommandList.push(cmd.responseId);
        }
      }
    });
    let generatedCommands = new Set(generatedCommandList).size;

    let acceptedCommandsListVal = 'nullptr';
    let generatedCommandsListVal = 'nullptr';

    if (acceptedCommands > 0) {
      acceptedCommands++; // Leaves space for the terminator
      acceptedCommandsListVal = `ZAP_GENERATED_COMMANDS_INDEX( ${totalCommands} )`;
    }

    if (generatedCommands > 0) {
      generatedCommands++; // Leaves space for the terminator
      generatedCommandsListVal = `ZAP_GENERATED_COMMANDS_INDEX( ${
        totalCommands + acceptedCommands
      } )`;
    }

    let eventCount = c.eventCount;
    let eventList = 'nullptr';
    if (eventCount > 0) {
      eventList = `ZAP_GENERATED_EVENTS_INDEX( ${c.eventIndex} )`;
    }

    let individualItems = [];
    let orderTokens = order.split(',').map((x) => (x ? x.trim() : ''));
    orderTokens.forEach((tok) => {
      switch (tok) {
        case 'clusterId':
          individualItems.push(`.clusterId = ${c.clusterId}`);
          break;
        case 'attributes':
          individualItems.push(
            `.attributes = ZAP_ATTRIBUTE_INDEX(${c.attributeIndex})`
          );
          break;
        case 'attributeCount':
          individualItems.push(`.attributeCount = ${c.attributeCount}`);
          break;
        case 'clusterSize':
          individualItems.push(`.clusterSize = ${c.attributeSize}`);
          break;
        case 'mask':
          individualItems.push(`.mask = ${mask}`);
          break;
        case 'functions':
          individualItems.push(`.functions = ${functionArray}`);
          break;
        case 'acceptedCommandList':
          individualItems.push(
            `.acceptedCommandList = ${acceptedCommandsListVal}`
          );
          break;
        case 'generatedCommandList':
          individualItems.push(
            `.generatedCommandList = ${generatedCommandsListVal}`
          );
          break;
        case 'eventList':
          individualItems.push(`.eventList = ${eventList}`);
          break;
        case 'eventCount':
          individualItems.push(`.eventCount = ${eventCount}`);
          break;
        default:
          throw new Error(`Unknown token '${tok}' in order optional argument`);
      }
    });
    ret = ret.concat(`  { \\
      /* ${c.comment} */ \\
      ${individualItems.join(', \\\n      ')}, \\
    },\\\n`);

    totalCommands = totalCommands + acceptedCommands + generatedCommands;
  });
  return ret.concat('}\n');
}

/**
 * Return the number of data versions we need for our fixed endpoints.
 *
 * This is just the count of server clusters on those endpoints.
 */
function chip_endpoint_data_version_count() {
  let serverCount = 0;
  for (const ep of this.endpoints) {
    let epType = this.endpointTypes.find(
      (type) => type.id == ep.endpointTypeRef
    );
    for (const cluster of epType.clusters) {
      if (cluster.side == 'server') {
        ++serverCount;
      }
    }
  }
  return serverCount;
}

//  End of Endpoint-config specific helpers

async function asNativeType(type) {
  function fn(pkgId) {
    const options = { hash: {} };
    // Add clusterId if available in context
    if (this.clusterId) {
      options.hash.clusterId = this.clusterId;
    } else if (this.clusterRef) {
      options.hash.clusterId = this.clusterRef;
    }
    return zclHelper.asUnderlyingZclType
      .call(this, type, options)
      .then((zclType) => {
        return ChipTypesHelper.asBasicType(zclType);
      });
  }

  const promise = templateUtil
    .ensureZclPackageIds(this)
    .then(fn.bind(this))
    .catch((err) => {
      console.log(err);
      throw err;
    });
  return templateUtil.templatePromise(this.global, promise);
}

async function asTypedExpression(value, type) {
  const valueIsANumber = !isNaN(value);
  if (!value || valueIsANumber) {
    return asTypedLiteral.call(this, value, type);
  }

  const tokens = value.split(' ');
  if (tokens.length < 2) {
    return asTypedLiteral.call(this, value, type);
  }

  value = tokens
    .map((token) => {
      if (!TestHelper.chip_tests_variables_has.call(this, token)) {
        return token;
      }

      if (!TestHelper.chip_tests_variables_is_nullable.call(this, token)) {
        return token;
      }

      return `${token}.Value()`;
    })
    .join(' ');

  const resultType = await asNativeType.call(this, type);
  return `static_cast<${resultType}>(${value})`;
}

async function asTypedLiteral(value, type, cookie) {
  const valueIsANumber = !isNaN(value);
  if (!valueIsANumber) {
    return value;
  }

  const basicType = await asNativeType.call(this, type);
  switch (basicType) {
    case 'int32_t':
      return value + 'L';
    case 'int64_t':
      return value + 'LL';
    case 'uint8_t':
    case 'uint16_t':
      return value + 'U';
    case 'uint32_t':
      return value + 'UL';
    case 'uint64_t':
      return value + 'ULL';
    case 'float':
      if (value == Infinity || value == -Infinity) {
        return `${value < 0 ? '-' : ''}INFINITY`;
      }
      // If the number looks like an integer, append ".0" to the end;
      // otherwise adding an "f" suffix makes compilers complain.
      value = value.toString();
      if (value.match(/^-?[0-9]+$/)) {
        value = value + '.0';
      }
      return value + 'f';
    default:
      if (value == Infinity || value == -Infinity) {
        return `${value < 0 ? '-' : ''}INFINITY`;
      }
      return value;
  }
}

function hasSpecificAttributes(options) {
  return this.count > kGlobalAttributes.length;
}

function asLowerCamelCase(label, options) {
  const preserveAcronyms = options && options.hash.preserveAcronyms;
  return string.tokensIntoCamelCase(label, true, preserveAcronyms);
}

function asUpperCamelCase(label, options) {
  const preserveAcronyms = options && options.hash.preserveAcronyms;
  return string.tokensIntoCamelCase(label, false, preserveAcronyms);
}
/**
 * Same as asUpperCamelCase, but with a special case for "RFID".
 * Special case for cluster specific object files for Matter.
 *
 * @param {*} label
 * @param {*} options
 * @returns {string}
 */
function chip_name_for_id_usage(label, options) {
  if (label == 'RFID') {
    return 'Rfid';
  }
  return asUpperCamelCase(label, options);
}

function chip_friendly_endpoint_type_name(options) {
  let name = this.endpointTypeName;
  if (name.startsWith('MA-')) {
    // prefix likely for "Matter" and is redundant
    name = name.substring(3);
  }

  return asLowerCamelCase(name);
}

function asMEI(prefix, suffix) {
  // Left-shift (and for that matter bitwise or) produces a _signed_ 32-bit
  // number, which will probably be negative.  Force it to unsigned 32-bit using
  // >>> 0.
  return cHelper.asHex(((prefix << 16) | suffix) >>> 0, 8);
}

// Not to be exported.
function nsValueToNamespace(ns, clusterCount) {
  if (ns === undefined) {
    // This use is happening within a specific cluster namespace already, so
    // usually there is no need for more prefixing.  But for globals, we need to
    // prefix them with "Globals::", because they are not in fact in the cluster
    // namespace.
    if (clusterCount == 0) {
      return 'Globals::';
    }

    return '';
  }

  if (ns == 'detail') {
    return ns;
  }

  const prefix = 'chip::app::Clusters::';
  const postfix = '::';

  if (clusterCount == 0) {
    return `${prefix}Globals${postfix}`;
  }

  return `${prefix}${asUpperCamelCase(ns)}${postfix}`;
}

// Not to be exported.
function nsValueToPythonNamespace(ns, clusterCount) {
  if (clusterCount == 0) {
    return 'Globals';
  }
  return ns;
}

// Not to be exported.
//
// dataType can be "Enum", "Struct", or "Bitmap".
async function getClusterCountForType(db, pkgId, type, dataType, options) {
  if (options.hash.cluster === '') {
    // This is a non-global data type that is associated with multiple
    // clusters: in that case our caller can pass in cluster="", and
    // we know that clusterCount > 1, so just set it to 2.
    return 2;
  }

  const cluster = options.hash.cluster || options.hash.ns;
  const typeObj = await zclQuery[`select${dataType}ByNameAndClusterName`](
    db,
    type,
    cluster,
    pkgId
  );
  if (typeObj) {
    return typeObj[`${dataType.toLowerCase()}ClusterCount`];
  }

  if (options.hash.cluster === undefined) {
    // Backwards-compat case: we were called without ns or cluster at all
    // (not even cluster="").  Just get by name, since that's all we have to
    // work with.  It won't work right when names are not unique, but that's
    // the best we can do.
    //
    // selectBitmapByName has different argument ordering from selectEnumByName
    // and selectStructByName, so account for that here.
    const isBitmap = dataType == 'Bitmap';
    const backwardsCompatTypeObj = await zclQuery[`select${dataType}ByName`](
      db,
      isBitmap ? pkgId : type,
      isBitmap ? type : pkgId
    );
    return backwardsCompatTypeObj[`${dataType.toLowerCase()}ClusterCount`];
  }

  // Something is wrong here.  Possibly the caller is passing in a munged
  // cluster name.  Just fail out instead of silently returning bad data.
  throw new Error(
    `Unable to find ${dataType.toLowerCase()} ${type} in cluster ${options.hash.cluster}`
  );
}

/*
 * @brief
 *
 * This function converts a given ZAP type to a Cluster Object
 * type used by the Matter SDK.
 *
 * Args:
 *
 * type:            ZAP type specified in the XML
 * isDecodable:     Whether to emit an Encodable or Decodable cluster
 *                  object type.
 *
 * These types can be found in src/app/data-model/.
 *
 */
async function zapTypeToClusterObjectType(type, isDecodable, options) {
  // Add clusterId if available in context
  if (this.clusterId) {
    options.hash.clusterId = this.clusterId;
  } else if (this.clusterRef) {
    options.hash.clusterId = this.clusterRef;
  }
  // Use the entryType as a type
  if (type == 'array' && this.entryType) {
    type = this.entryType;
  }

  let passByReference = false;
  async function fn(pkgId) {
    const typeChecker = async (method) =>
      zclHelper[method](this.global.db, type, pkgId).then(
        (zclType) => zclType != 'unknown'
      );

    const types = {
      isEnum: await typeChecker('isEnum'),
      isBitmap: await typeChecker('isBitmap'),
      isEvent: await typeChecker('isEvent'),
      isStruct: await typeChecker('isStruct')
    };

    const typesCount = Object.values(types).filter((isType) => isType).length;
    if (typesCount > 1) {
      let error = type + ' is ambiguous: \n';
      Object.entries(types).forEach(([key, value]) => {
        if (value) {
          error += '\t' + key + ': ' + value + '\n';
        }
      });
      throw error;
    }

    if (types.isEnum) {
      // Catching baseline enums and converting them into 'uint[size]_t'
      let s = type.toLowerCase().match(/^enum(\d+)$/);
      if (s) {
        return 'uint' + s[1] + '_t';
      }

      const clusterCount = await getClusterCountForType(
        this.global.db,
        pkgId,
        type,
        'Enum',
        options
      );
      const ns = nsValueToNamespace(options.hash.ns, clusterCount);
      return ns + asUpperCamelCase.call(this, type, options);
    }

    if (types.isBitmap) {
      // Catching baseline bitmaps and converting them into 'uint[size]_t'
      let s = type.toLowerCase().match(/^bitmap(\d+)$/);
      if (s) {
        return 'uint' + s[1] + '_t';
      }

      const clusterCount = await getClusterCountForType(
        this.global.db,
        pkgId,
        type,
        'Bitmap',
        options
      );
      const ns = nsValueToNamespace(options.hash.ns, clusterCount);
      return (
        'chip::BitMask<' + ns + asUpperCamelCase.call(this, type, options) + '>'
      );
    }

    if (types.isStruct) {
      passByReference = true;
      const clusterCount = await getClusterCountForType(
        this.global.db,
        pkgId,
        type,
        'Struct',
        options
      );
      const ns = nsValueToNamespace(options.hash.ns, clusterCount);
      return (
        ns +
        'Structs::' +
        asUpperCamelCase.call(this, type, options) +
        '::' +
        (isDecodable ? 'DecodableType' : 'Type')
      );
    }

    if (types.isEvent) {
      passByReference = true;
      // There are no global events, so just pass 1 for cluster count.
      const ns = nsValueToNamespace(options.hash.ns, 1);
      return (
        ns +
        'Events::' +
        asUpperCamelCase.call(this, type, options) +
        '::' +
        (isDecodable ? 'DecodableType' : 'Type')
      );
    }

    return zclHelper.asUnderlyingZclType.call(
      { global: this.global },
      type,
      options
    );
  }

  let typeStr = await templateUtil
    .ensureZclPackageIds(this)
    .then(fn.bind(this));
  if ((this.isArray || this.entryType) && !options.hash.forceNotList) {
    passByReference = true;
    // If we did not have a namespace provided, we can assume we're inside
    // chip::app.
    let listNamespace = options.hash.ns ? 'chip::app::' : '';
    if (isDecodable) {
      typeStr = `${listNamespace}DataModel::DecodableList<${typeStr}>`;
    } else {
      // Use const ${typeStr} so that consumers don't have to create non-const
      // data to encode.
      typeStr = `${listNamespace}DataModel::List<const ${typeStr}>`;
    }
  }
  if (this.isNullable && !options.hash.forceNotNullable) {
    passByReference = true;
    // If we did not have a namespace provided, we can assume we're inside
    // chip::app::.
    let ns = options.hash.ns ? 'chip::app::' : '';
    typeStr = `${ns}DataModel::Nullable<${typeStr}>`;
  }
  if (this.isOptional && !options.hash.forceNotOptional) {
    passByReference = true;
    // If we did not have a namespace provided, we can assume we're inside
    // chip::.
    let ns = options.hash.ns ? 'chip::' : '';
    typeStr = `${ns}Optional<${typeStr}>`;
  }
  if (options.hash.isArgument && passByReference) {
    typeStr = `const ${typeStr} &`;
  }
  return templateUtil.templatePromise(this.global, Promise.resolve(typeStr));
}

function zapTypeToEncodableClusterObjectType(type, options) {
  return zapTypeToClusterObjectType.call(this, type, false, options);
}

function zapTypeToDecodableClusterObjectType(type, options) {
  return zapTypeToClusterObjectType.call(this, type, true, options);
}

async function _zapTypeToPythonClusterObjectType(type, options) {
  async function fn(pkgId) {
    const typeChecker = async (method) =>
      zclHelper[method](this.global.db, type, pkgId).then(
        (zclType) => zclType != 'unknown'
      );

    if (await typeChecker('isEnum')) {
      // Catching baseline enums and converting them into 'uint'
      if (type.toLowerCase().match(/^enum\d+$/g)) {
        return 'uint';
      }

      const clusterCount = await getClusterCountForType(
        this.global.db,
        pkgId,
        type,
        'Enum',
        options
      );
      const ns = nsValueToPythonNamespace(options.hash.ns, clusterCount);

      return ns + '.Enums.' + type;
    }

    if (await typeChecker('isBitmap')) {
      return 'uint';
    }

    if (await typeChecker('isStruct')) {
      const clusterCount = await getClusterCountForType(
        this.global.db,
        pkgId,
        type,
        'Struct',
        options
      );
      const ns = nsValueToPythonNamespace(options.hash.ns, clusterCount);

      return ns + '.Structs.' + type;
    }

    if (StringHelper.isCharString(type)) {
      return 'str';
    }

    if (StringHelper.isOctetString(type)) {
      return 'bytes';
    }

    if (type.toLowerCase() == 'single') {
      return 'float32';
    }

    if (type.toLowerCase() == 'double') {
      return 'float';
    }

    if (type.toLowerCase() == 'boolean') {
      return 'bool';
    }

    // #10748: asUnderlyingZclType will emit wrong types for int{48|56|64}(u), so we process all int values here.
    if (type.toLowerCase().match(/^int\d+$/)) {
      return 'int';
    }

    if (type.toLowerCase().match(/^int\d+u$/)) {
      return 'uint';
    }
    // Add clusterId if available in context
    if (this.clusterId) {
      options.hash.clusterId = this.clusterId;
    } else if (this.clusterRef) {
      options.hash.clusterId = this.clusterRef;
    }
    let resolvedType = await zclHelper.asUnderlyingZclType.call(
      { global: this.global },
      type,
      options
    );
    {
      let basicType = ChipTypesHelper.asBasicType(resolvedType);
      if (basicType.match(/^int\d+_t$/)) {
        return 'int';
      }
      if (basicType.match(/^uint\d+_t$/)) {
        return 'uint';
      }
    }
  }

  let promise = templateUtil.ensureZclPackageIds(this).then(fn.bind(this));
  if ((this.isArray || this.entryType) && !options.hash.forceNotList) {
    promise = promise.then((typeStr) => `typing.List[${typeStr}]`);
  }

  const isNull = this.isNullable && !options.hash.forceNotNullable;
  const isOptional = this.isOptional && !options.hash.forceNotOptional;

  if (isNull && isOptional) {
    promise = promise.then(
      (typeStr) => `typing.Union[None, Nullable, ${typeStr}]`
    );
  } else if (isNull) {
    promise = promise.then((typeStr) => `typing.Union[Nullable, ${typeStr}]`);
  } else if (isOptional) {
    promise = promise.then((typeStr) => `typing.Optional[${typeStr}]`);
  }

  return templateUtil.templatePromise(this.global, promise);
}

function zapTypeToPythonClusterObjectType(type, options) {
  return _zapTypeToPythonClusterObjectType.call(this, type, options);
}

async function _getPythonFieldDefault(type, options) {
  async function fn(pkgId) {
    const typeChecker = async (method) =>
      zclHelper[method](this.global.db, type, pkgId).then(
        (zclType) => zclType != 'unknown'
      );

    if (await typeChecker('isEnum')) {
      return '0';
    }

    if (await typeChecker('isBitmap')) {
      return '0';
    }

    if (await typeChecker('isStruct')) {
      const clusterCount = await getClusterCountForType(
        this.global.db,
        pkgId,
        type,
        'Struct',
        options
      );
      const ns = nsValueToPythonNamespace(options.hash.ns, clusterCount);

      return 'field(default_factory=lambda: ' + ns + '.Structs.' + type + '())';
    }

    if (StringHelper.isCharString(type)) {
      return '""';
    }

    if (StringHelper.isOctetString(type)) {
      return 'b""';
    }

    if (['single', 'double'].includes(type.toLowerCase())) {
      return '0.0';
    }

    if (type.toLowerCase() == 'boolean') {
      return 'False';
    }

    // #10748: asUnderlyingZclType will emit wrong types for int{48|56|64}(u), so we process all int values here.
    if (type.toLowerCase().match(/^int\d+$/)) {
      return '0';
    }

    if (type.toLowerCase().match(/^int\d+u$/)) {
      return '0';
    }
    // Add clusterId if available in context
    if (this.clusterId) {
      options.hash.clusterId = this.clusterId;
    } else if (this.clusterRef) {
      options.hash.clusterId = this.clusterRef;
    }
    let resolvedType = await zclHelper.asUnderlyingZclType.call(
      { global: this.global },
      type,
      options
    );
    {
      let basicType = ChipTypesHelper.asBasicType(resolvedType);
      if (basicType.match(/^int\d+_t$/)) {
        return '0';
      }
      if (basicType.match(/^uint\d+_t$/)) {
        return '0';
      }
    }
  }

  let promise = templateUtil.ensureZclPackageIds(this).then(fn.bind(this));
  if ((this.isArray || this.entryType) && !options.hash.forceNotList) {
    promise = promise.then((typeStr) => `field(default_factory=lambda: [])`);
  }

  const isNull = this.isNullable && !options.hash.forceNotNullable;
  const isOptional = this.isOptional && !options.hash.forceNotOptional;

  if (isNull && isOptional) {
    promise = promise.then((typeStr) => `None`);
  } else if (isNull) {
    promise = promise.then((typeStr) => `NullValue`);
  } else if (isOptional) {
    promise = promise.then((typeStr) => `None`);
  }

  return templateUtil.templatePromise(this.global, promise);
}

function getPythonFieldDefault(type, options) {
  return _getPythonFieldDefault.call(this, type, options);
}

// Allow-list of enums that we generate as enums, not enum classes.
let weakEnumList = undefined;
function isWeaklyTypedEnum(label) {
  if (weakEnumList === undefined) {
    let f = this.global.resource('weak-enum-list');
    // NOTE: This has to be sync, so we can use this data in if conditions.
    if (f) {
      let rawData = fs.readFileSync(f, { encoding: 'utf8', flag: 'r' });
      weakEnumList = YAML.parse(rawData);
    } else {
      weakEnumList = [
        'AttributeWritePermission',
        'BarrierControlBarrierPosition',
        'BarrierControlMovingState',
        'ColorControlOptions',
        'ColorLoopAction',
        'ColorLoopDirection',
        'ColorMode',
        'ContentLaunchStatus',
        'ContentLaunchStreamingType',
        'EnhancedColorMode',
        'HardwareFaultType',
        'HueDirection',
        'HueMoveMode',
        'HueStepMode',
        'IdentifyEffectIdentifier',
        'IdentifyEffectVariant',
        'IdentifyIdentifyType',
        'InterfaceType',
        'KeypadLockout',
        'LevelControlOptions',
        'MoveMode',
        'NetworkFaultType',
        'OnOffDelayedAllOffEffectVariant',
        'OnOffDyingLightEffectVariant',
        'OnOffEffectIdentifier',
        'PHYRateType',
        'RadioFaultType',
        'RoutingRole',
        'SaturationMoveMode',
        'SaturationStepMode',
        'SecurityType',
        'SetpointAdjustMode',
        'StartUpOnOffValue',
        'StatusCode',
        'StepMode',
        'TemperatureDisplayMode',
        'WiFiVersionType'
      ];
    }
  }
  return weakEnumList.includes(label);
}

let legacyStructList = undefined;
function isLegacyStruct(label) {
  if (legacyStructList === undefined) {
    let f = this.global.resource('legacy-struct-list');
    // NOTE: This has to be sync, so we can use this data in if conditions.
    let rawData = fs.readFileSync(f, { encoding: 'utf8', flag: 'r' });
    legacyStructList = YAML.parse(rawData);
  }
  return legacyStructList.includes(label);
}

function incrementDepth(depth) {
  return depth + 1;
}

function hasProperty(obj, prop) {
  return prop in obj;
}

async function zcl_events_fields_by_event_name(name, options) {
  const { db, sessionId } = this.global;
  const packageIds = await templateUtil.ensureZclPackageIds(this);

  const promise = queryEvents
    .selectAllEvents(db, packageIds)
    .then((events) => events.find((event) => event.name == name))
    .then((evt) => queryEvents.selectEventFieldsByEventId(db, evt.id))
    .then((fields) =>
      fields.map((field) => {
        field.label = field.name;
        return field;
      })
    )
    .then((fields) => templateUtil.collectBlocks(fields, options, this));
  return templateUtil.templatePromise(this.global, promise);
}

// Must be used inside zcl_clusters
async function zcl_commands_that_need_timed_invoke(options) {
  const { db } = this.global;
  let packageIds = await templateUtil.ensureZclPackageIds(this);
  let commands = await queryCommand.selectCommandsByClusterId(
    db,
    this.id,
    packageIds
  );
  commands = commands.filter((cmd) => cmd.mustUseTimedInvoke);
  return templateUtil.collectBlocks(commands, options, this);
}

// Allows conditioning generation on whether the given type is a fabric-scoped
// struct.
async function if_is_fabric_scoped_struct(type, options) {
  let packageIds = await templateUtil.ensureZclPackageIds(this);
  let st;
  if (options.hash.cluster) {
    st = await zclQuery.selectStructByNameAndClusterName(
      this.global.db,
      type,
      options.hash.cluster,
      packageIds
    );
  } else {
    // Backwards compat case; will not work right when multiple structs share
    // the same name.
    st = await zclQuery.selectStructByName(this.global.db, type, packageIds);
  }

  if (st && st.isFabricScoped) {
    return options.fn(this);
  }

  return options.inverse(this);
}

// check if a value is numerically 0 for the purpose of default value
// interpretation. Note that this does NOT check for data type, so assumes
// a string of 'false' is 0 because boolean false is 0.
function isNonZeroValue(value) {
  if (!value) {
    return false;
  }

  if (value === '0') {
    return false;
  }

  // Hex value usage is inconsistent in XML. It looks we have
  // all of 0x0, 0x00, 0x0000 so support all here.
  if (value.match(/^0x0+$/)) {
    return false;
  }

  // boolean 0 is false. We do not do a type check here
  // so if anyone defaults a string to 'false' this will be wrong.
  if (value === 'false') {
    return false;
  }

  return true;
}

// Check if the default value is non-zero
// Generally does string checks for empty strings, numeric or hex zeroes or
// boolean values.
async function if_is_non_zero_default(value, options) {
  if (isNonZeroValue(value)) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
}

const dep = templateUtil.deprecatedHelper;

//
// Module exports
//
exports.chip_endpoint_generated_functions = chip_endpoint_generated_functions;
exports.chip_endpoint_cluster_list = chip_endpoint_cluster_list;
exports.chip_endpoint_data_version_count = chip_endpoint_data_version_count;
exports.chip_endpoint_generated_commands_list =
  chip_endpoint_generated_commands_list;
exports.chip_endpoint_generated_event_count =
  chip_endpoint_generated_event_count;
exports.chip_endpoint_generated_event_list = chip_endpoint_generated_event_list;
exports.asTypedExpression = asTypedExpression;
exports.asTypedLiteral = asTypedLiteral;
exports.asLowerCamelCase = asLowerCamelCase;
exports.asUpperCamelCase = asUpperCamelCase;
exports.chip_friendly_endpoint_type_name = chip_friendly_endpoint_type_name;
exports.hasProperty = hasProperty;
exports.hasSpecificAttributes = hasSpecificAttributes;
exports.asMEI = asMEI;
exports.zapTypeToEncodableClusterObjectType =
  zapTypeToEncodableClusterObjectType;
exports.zapTypeToDecodableClusterObjectType =
  zapTypeToDecodableClusterObjectType;
exports.zapTypeToPythonClusterObjectType = zapTypeToPythonClusterObjectType;
exports.isWeaklyTypedEnum = dep(isWeaklyTypedEnum, {
  to: 'isInConfigList'
});
exports.isLegacyStruct = dep(isLegacyStruct, {
  to: 'isInConfigList'
});
exports.isInConfigList = isInConfigList;
exports.getPythonFieldDefault = getPythonFieldDefault;
exports.incrementDepth = incrementDepth;
exports.zcl_events_fields_by_event_name = zcl_events_fields_by_event_name;
exports.zcl_commands_that_need_timed_invoke =
  zcl_commands_that_need_timed_invoke;
exports.if_is_fabric_scoped_struct = if_is_fabric_scoped_struct;
exports.if_is_non_zero_default = if_is_non_zero_default;
exports.chip_name_for_id_usage = chip_name_for_id_usage;

exports.meta = {
  category: dbEnum.helperCategory.matter,
  alias: ['templates/app/helper.js', 'matter-app-helper']
};
