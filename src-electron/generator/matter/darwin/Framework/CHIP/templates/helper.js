/*
 *
 *    Copyright (c) 2021 Project CHIP Authors
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
const path = require('path');

// Import helpers from zap core
const string = require('../../../../../../util/string');
const templateUtil = require('../../../../../../generator/template-util');
const zclHelper = require('../../../../../../generator/helper-zcl.js');
const zclQuery = require('../../../../../../db/query-zcl.js');

const ChipTypesHelper = require('../../../../app/zap-templates/common/ChipTypesHelper');
const TestHelper = require('../../../../app/zap-templates/common/ClusterTestGeneration.js');
const StringHelper = require('../../../../app/zap-templates/common/StringHelper.js');
const appHelper = require('../../../../app/zap-templates/templates/app/helper.js');
const dbEnum = require('../../../../../../../src-shared/db-enum');

function asObjectiveCBasicType(type, options) {
  if (StringHelper.isOctetString(type)) {
    return options.hash.is_mutable ? 'NSMutableData *' : 'NSData *';
  } else if (StringHelper.isCharString(type)) {
    return options.hash.is_mutable ? 'NSMutableString *' : 'NSString *';
  } else {
    return ChipTypesHelper.asBasicType(this.chipType);
  }
}

/**
 * Converts an expression involving possible variables whose types are objective C objects into an expression whose type is a C++
 * type
 */
async function asTypedExpressionFromObjectiveC(value, type) {
  const valueIsANumber = !isNaN(value);
  if (!value || valueIsANumber) {
    return appHelper.asTypedLiteral.call(this, value, type);
  }

  const tokens = value.split(' ');
  if (tokens.length < 2) {
    return appHelper.asTypedLiteral.call(this, value, type);
  }

  let expr = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (['+', '-', '/', '*', '%', '(', ')'].includes(token)) {
      expr[i] = token;
    } else if (!isNaN(token.replace(/ULL$|UL$|U$|LL$|L$/i, ''))) {
      expr[i] = await appHelper.asTypedLiteral.call(this, token, type);
    } else {
      const variableType = TestHelper.chip_tests_variables_get_type.call(
        this,
        token
      );
      const asType = await asObjectiveCNumberType.call(
        this,
        token,
        variableType,
        true
      );
      expr[i] = `[${token} ${asType}Value]`;
    }
  }

  return expr.join(' ');
}

function asObjectiveCNumberType(label, type, asLowerCased) {
  function fn(pkgId) {
    const options = { hash: {} };
    return zclHelper.asUnderlyingZclType
      .call(this, type, options)
      .then((zclType) => {
        const basicType = ChipTypesHelper.asBasicType(zclType);
        switch (basicType) {
          case 'bool':
            return 'Bool';
          case 'uint8_t':
            return 'UnsignedChar';
          case 'uint16_t':
            return 'UnsignedShort';
          case 'uint32_t':
            return 'UnsignedInt';
          case 'uint64_t':
            return 'UnsignedLongLong';
          case 'int8_t':
            return 'Char';
          case 'int16_t':
            return 'Short';
          case 'int32_t':
            return 'Int';
          case 'int64_t':
            return 'LongLong';
          case 'float':
            return 'Float';
          case 'double':
            return 'Double';
          default:
            error =
              label +
              ': Unhandled underlying type ' +
              zclType +
              ' for original type ' +
              type;
            throw error;
        }
      })
      .then((typeName) =>
        asLowerCased
          ? typeName[0].toLowerCase() + typeName.substring(1)
          : typeName
      );
  }

  const promise = templateUtil
    .ensureZclPackageIds(this)
    .then(fn.bind(this))
    .catch((err) => console.log(err));
  return templateUtil.templatePromise(this.global, promise);
}

const compatClusterNameMap = {
  UnitTesting: 'TestCluster',
};

function compatClusterNameRemapping(cluster) {
  cluster = appHelper.asUpperCamelCase(cluster, {
    hash: { preserveAcronyms: false },
  });

  if (cluster in compatClusterNameMap) {
    cluster = compatClusterNameMap[cluster];
  }

  return cluster;
}

const compatAttributeNameMap = {
  Descriptor: {
    DeviceTypeList: 'DeviceList',
  },
};

function compatAttributeNameRemapping(cluster, attribute) {
  cluster = appHelper.asUpperCamelCase(cluster, {
    hash: { preserveAcronyms: false },
  });

  attribute = appHelper.asUpperCamelCase(attribute, {
    hash: { preserveAcronyms: false },
  });

  if (cluster in compatAttributeNameMap) {
    if (attribute in compatAttributeNameMap[cluster]) {
      attribute = compatAttributeNameMap[cluster][attribute];
    }
  }

  return attribute;
}

async function asObjectiveCClass(type, cluster, options) {
  let pkgIds = await templateUtil.ensureZclPackageIds(this);
  let isStruct = await zclHelper
    .isStruct(this.global.db, type, pkgIds)
    .then((zclType) => zclType != 'unknown');

  if (
    (this.isArray || this.entryType || options.hash.forceList) &&
    !options.hash.forceNotList
  ) {
    return 'NSArray';
  }

  if (StringHelper.isOctetString(type)) {
    return 'NSData';
  }

  if (StringHelper.isCharString(type)) {
    return 'NSString';
  }

  if (isStruct) {
    if (options.hash.compatRemapClusterName) {
      cluster = compatClusterNameRemapping.call(this, cluster);
    } else {
      let preserveAcronyms = true;
      if ('preserveAcronyms' in options.hash) {
        preserveAcronyms = options.hash.preserveAcronyms;
      }
      cluster = appHelper.asUpperCamelCase(cluster, {
        hash: { preserveAcronyms: preserveAcronyms },
      });
    }
    return `MTR${cluster}Cluster${appHelper.asUpperCamelCase(type)}`;
  }

  return 'NSNumber';
}

async function asObjectiveCType(type, cluster, options) {
  let typeStr = await asObjectiveCClass.call(this, type, cluster, options);
  if (this.isNullable || this.isOptional) {
    typeStr = `${typeStr} * _Nullable`;
  } else {
    typeStr = `${typeStr} * _Nonnull`;
  }

  return typeStr;
}

function asStructPropertyName(prop) {
  prop = appHelper.asLowerCamelCase(prop);

  // If prop is now "description", we need to rename it, because that's
  // reserved.
  if (prop == 'description') {
    return 'descriptionString';
  }

  // If prop starts with a sequence of capital letters (which can happen for
  // output of asLowerCamelCase if the original string started that way,
  // lowercase all but the last one.
  return prop.replace(/^([A-Z]+)([A-Z])/, (match, p1, p2) => {
    return p1.toLowerCase() + p2;
  });
}

function asGetterName(prop) {
  let propName = asStructPropertyName(prop);
  if (propName.match(/^new[A-Z]/) || propName == 'count') {
    return 'get' + appHelper.asUpperCamelCase(prop);
  }
  return propName;
}

function commandHasRequiredField(command) {
  return command.arguments.some((arg) => !arg.isOptional);
}

/**
 * Produce a reasonable name for an Objective C enum for the given cluster name
 * and enum label.  Because a lot of our enum labels already have the cluster
 * name prefixed (e.g. NetworkCommissioning*, or the IdentifyIdentifyType that
 * has it prefixed _twice_) just concatenating the two gives overly verbose
 * names in a few cases (e.g. "IdentifyIdentifyIdentifyType").
 *
 * This function strips out the redundant cluster names, and strips off trailing
 * "Enum" bits on the enum names while we're here.
 */
function objCEnumName(clusterName, enumLabel, options) {
  clusterName = appHelper.asUpperCamelCase(clusterName, {
    hash: { preserveAcronyms: options.hash.preserveAcronyms },
  });
  enumLabel = appHelper.asUpperCamelCase(enumLabel);
  // Some enum names have one or more copies of the cluster name at the
  // beginning.
  while (enumLabel.startsWith(clusterName)) {
    enumLabel = enumLabel.substring(clusterName.length);
  }

  if (enumLabel.endsWith('Enum')) {
    // Strip that off; it'll clearly be an enum anyway.
    enumLabel = enumLabel.substring(0, enumLabel.length - 'Enum'.length);
  }

  return 'MTR' + clusterName + enumLabel;
}

function objCEnumItemLabel(itemLabel) {
  // Check for the case when we're:
  // 1. A single word (that's the regexp at the beginning, which matches the
  //    word-splitting regexp in string.toCamelCase).
  // 2. All upper-case.
  //
  // This will get converted to lowercase except the first letter by
  // asUpperCamelCase, which is not really what we want.
  //
  // This is not just using asUpperCamelCase with preserveAcronyms=true, because
  // there are some enum names like "WEP-PERSONAL" that we don't want to
  // preserve the PERSONAL part for.
  if (!/ |_|-|\//.test(itemLabel) && itemLabel.toUpperCase() == itemLabel) {
    return itemLabel.replace(/[.:]/g, '');
  }

  return appHelper.asUpperCamelCase(itemLabel);
}

function hasArguments() {
  return !!this.arguments.length;
}

let availabilityData;
function fetchAvailabilityData(global) {
  if (!availabilityData) {
    let f = global.resource('availability-data');
    // NOTE: This has to be sync, so we can use this data in if conditions.
    let rawData = fs.readFileSync(f, { encoding: 'utf8', flag: 'r' });
    availabilityData = YAML.parse(rawData);
  }
  return availabilityData;
}

function findReleaseForPath(availabilityData, path, options) {
  if (options.hash.isForIds) {
    // Ids include all clusters, not just the ones we have real support for.
    // Try looking for things under "ids:" first.
    let newPath = [...path];
    // Insert "ids" after the "introduced" or "deprecated" bit.
    newPath.splice(1, 0, 'ids');
    let releaseData = findReleaseForPath(availabilityData, newPath, {
      hash: { isForIds: false },
    });
    if (releaseData !== undefined) {
      return releaseData;
    }
  }

  if (options.hash.isForCommandPayload) {
    // Command payloads include all clusters, not just the ones we have real
    // support for. Try looking for things under "command payloads:" first.
    let newPath = [...path];
    // Insert "command payloads" after the "introduced" or "deprecated" bit.
    newPath.splice(newPath.indexOf('commands'), 1, 'command payloads');
    let releaseData = findReleaseForPath(availabilityData, newPath, {
      hash: { isForCommandPayload: false },
    });
    if (releaseData !== undefined) {
      return releaseData;
    }
  }

  let foundRelease = undefined;
  for (let releaseData of availabilityData) {
    // Our path, except the last item, leads to an array.  The last item is then
    // a possible item in that array.
    let containerNames = [...path];
    let item = containerNames.pop();
    let currentContainer = releaseData;
    while (currentContainer !== undefined && containerNames.length != 0) {
      currentContainer = currentContainer?.[containerNames.shift()];
    }

    if (currentContainer === undefined) {
      continue;
    }

    if (currentContainer.includes(item)) {
      if (foundRelease !== undefined) {
        throw new Error(
          `Found two releases matching path: ${JSON.stringify(path)}`
        );
      }

      // Store for now so we can do the "only one thing matches" check above on
      // later releases.
      foundRelease = releaseData;
    }

    // Go on to the next release
  }

  return foundRelease;
}

function findReleaseByName(availabilityData, name) {
  return availabilityData.find((releaseData) => releaseData.release == name);
}

function makeAvailabilityPath(clusterName, options) {
  if (options.hash.struct) {
    if (options.hash.structField) {
      return [
        'struct fields',
        clusterName,
        options.hash.struct,
        options.hash.structField,
      ];
    }

    return ['structs', clusterName, options.hash.struct];
  }

  if (options.hash.event) {
    if (options.hash.eventField) {
      return [
        'event fields',
        clusterName,
        options.hash.event,
        options.hash.eventField,
      ];
    }

    return ['events', clusterName, options.hash.event];
  }

  if (options.hash.command) {
    if (options.hash.commandField) {
      return [
        'command fields',
        clusterName,
        options.hash.command,
        options.hash.commandField,
      ];
    }

    return ['commands', clusterName, options.hash.command];
  }

  if (options.hash.attribute) {
    return ['attributes', clusterName, options.hash.attribute];
  }

  if (options.hash.enum) {
    if (options.hash.enumValue) {
      return [
        'enum values',
        clusterName,
        options.hash.enum,
        options.hash.enumValue,
      ];
    }

    return ['enums', clusterName, options.hash.enum];
  }

  if (options.hash.bitmap) {
    if (options.hash.bitmapValue) {
      return [
        'bitmap values',
        clusterName,
        options.hash.bitmap,
        options.hash.bitmapValue,
      ];
    }

    return ['bitmaps', clusterName, options.hash.bitmap];
  }

  if (options.hash.api) {
    return ['apis', options.hash.api];
  }

  if (options.hash.globalAttribute) {
    return ['global attributes', options.hash.globalAttribute];
  }

  return ['clusters', clusterName];
}

async function availability(clusterName, options) {
  const data = fetchAvailabilityData(this.global);
  const path = makeAvailabilityPath(clusterName, options);

  if (
    options.hash.fabricScopedDeprecationMessage &&
    options.hash.nonFabricScopedDeprecationMessage &&
    options.hash.type
  ) {
    // Figure out the right deprecation message for cases where it unfortunately
    // depends on the type.
    if (options.hash.deprecationMessage) {
      throw new Error(
        `Should not specify deprecationMessage along with fabricScopedDeprecationMessage and nonFabricScopedDeprecationMessage`
      );
    }
    let packageIds = await templateUtil.ensureZclPackageIds(this);
    let st = await zclQuery.selectStructByName(
      this.global.db,
      options.hash.type,
      packageIds
    );
    if (st && st.isFabricScoped) {
      options.hash.deprecationMessage =
        options.hash.fabricScopedDeprecationMessage;
    } else {
      options.hash.deprecationMessage =
        options.hash.nonFabricScopedDeprecationMessage;
    }
  }

  let introducedRelease = findReleaseForPath(
    data,
    ['introduced', ...path],
    options
  );
  if (introducedRelease !== undefined && options.hash.minimalRelease) {
    let minimalRelease = findReleaseByName(data, options.hash.minimalRelease);
    if (minimalRelease === undefined) {
      throw new Error(`Invalid release name: ${options.hash.minimalRelease}`);
    }
    if (data.indexOf(minimalRelease) > data.indexOf(introducedRelease)) {
      introducedRelease = minimalRelease;
    }
  }
  let introducedVersions = introducedRelease?.versions;

  let deprecatedRelease = findReleaseForPath(
    data,
    ['deprecated', ...path],
    options
  );
  if (options.hash.deprecatedRelease) {
    let minimalDeprecatedRelease = findReleaseByName(
      data,
      options.hash.deprecatedRelease
    );
    if (
      deprecatedRelease === undefined ||
      data.indexOf(deprecatedRelease) > data.indexOf(minimalDeprecatedRelease)
    ) {
      deprecatedRelease = minimalDeprecatedRelease;
    }
  }
  const deprecatedVersions = deprecatedRelease?.versions;

  if (introducedVersions === undefined && deprecatedVersions !== undefined) {
    throw new Error(
      `Found deprecation but no introduction for: '${clusterName}' '${JSON.stringify(
        options.hash
      )}'`
    );
  }

  if (introducedVersions === undefined) {
    console.log(
      `WARNING: Missing "introduced" entry for: '${clusterName}' '${JSON.stringify(
        options.hash
      )}'`
    );
    introducedVersions = 'future';
  }

  if (introducedVersions === 'future') {
    return 'MTR_NEWLY_AVAILABLE';
  }

  if (introducedVersions === '' && deprecatedVersions === undefined) {
    // TODO: For now, to minimize changes to code by not outputting availability on
    // things that don't already have it.  Eventually this block should go
    // away.
    return '';
  }

  if (deprecatedVersions === undefined) {
    let availabilityStrings = Object.entries(introducedVersions).map(
      ([os, version]) => `${os}(${version})`
    );
    return `API_AVAILABLE(${availabilityStrings.join(', ')})`;
  }

  if (!options.hash.deprecationMessage) {
    throw new Error(
      `Deprecation needs a deprecation message for ${clusterName} and ${JSON.stringify(
        options.hash
      )}`
    );
  }

  if (deprecatedVersions === 'future') {
    // TODO: For now, to minimize changes to code by not outputting
    // availability on things that don't already have it.  Eventually this
    // condition and the return after it should go away and the return inside
    // the if should become unconditional.
    if (introducedVersions != '') {
      let availabilityStrings = Object.entries(introducedVersions).map(
        ([os, version]) => `${os}(${version})`
      );
      return `API_AVAILABLE(${availabilityStrings.join(
        ', '
      )}) MTR_NEWLY_DEPRECATED("${options.hash.deprecationMessage}")`;
    }
    return `MTR_NEWLY_DEPRECATED("${options.hash.deprecationMessage}")`;
  }

  // Make sure the set of OSes we were introduced and deprecated on is the same.
  let introducedOSes = Object.keys(introducedVersions);
  let deprecatedOSes = Object.keys(deprecatedVersions);
  for (let os of deprecatedOSes) {
    if (!introducedOSes.includes(os)) {
      throw new Error(
        `Deprecation versions '${JSON.stringify(
          deprecatedVersions
        )}' include an OS that introduction versions '${JSON.stringify(
          introducedVersions
        )}' do not include: '${os}'.`
      );
    }
  }
  for (let os of introducedOSes) {
    if (!deprecatedOSes.includes(os)) {
      throw new Error(
        `Deprecation versions '${JSON.stringify(
          deprecatedVersions
        )}' do not include an OS that introduction versions '${JSON.stringify(
          introducedVersions
        )}' include: '${os}'.`
      );
    }
  }

  let availabilityStrings = Object.entries(introducedVersions).map(
    ([os, version]) => `${os}(${version}, ${deprecatedVersions[os]})`
  );
  return `API_DEPRECATED("${
    options.hash.deprecationMessage
  }", ${availabilityStrings.join(', ')})`;
}

function wasIntroducedBeforeRelease(releaseName, clusterName, options) {
  const data = fetchAvailabilityData(this.global);
  const path = makeAvailabilityPath(clusterName, options);

  let introducedRelease = findReleaseForPath(
    data,
    ['introduced', ...path],
    options
  );
  if (introducedRelease === undefined) {
    return false;
  }

  let referenceRelease = findReleaseByName(data, releaseName);
  if (referenceRelease === undefined) {
    throw new Error(`Invalid release name: ${releaseName}`);
  }

  return data.indexOf(introducedRelease) < data.indexOf(referenceRelease);
}

//
// Module exports
//
exports.asObjectiveCBasicType = asObjectiveCBasicType;
exports.asObjectiveCNumberType = asObjectiveCNumberType;
exports.asObjectiveCClass = asObjectiveCClass;
exports.asObjectiveCType = asObjectiveCType;
exports.asStructPropertyName = asStructPropertyName;
exports.asTypedExpressionFromObjectiveC = asTypedExpressionFromObjectiveC;
exports.asGetterName = asGetterName;
exports.commandHasRequiredField = commandHasRequiredField;
exports.objCEnumName = objCEnumName;
exports.objCEnumItemLabel = objCEnumItemLabel;
exports.hasArguments = hasArguments;
exports.compatClusterNameRemapping = compatClusterNameRemapping;
exports.compatAttributeNameRemapping = compatAttributeNameRemapping;
exports.availability = availability;
exports.wasIntroducedBeforeRelease = wasIntroducedBeforeRelease;

exports.meta = {
  category: dbEnum.helperCategory.matter,
  alias: ['darwin/Framework/CHIP/templates/helper.js', 'darwin-chip-helper'],
};
