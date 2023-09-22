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

function compatClusterNameRemapping(cluster, options) {
  cluster = appHelper.asUpperCamelCase(cluster, {
    hash: { preserveAcronyms: true },
  });

  const old = oldName.call(this, cluster, options);

  if (old) {
    return old;
  }

  return cluster;
}

function compatAttributeNameRemapping(cluster, attribute, options) {
  cluster = appHelper.asUpperCamelCase(cluster, {
    hash: { preserveAcronyms: true },
  });

  attribute = appHelper.asUpperCamelCase(attribute, {
    hash: { preserveAcronyms: true },
  });

  const old = oldName.call(this, cluster, {
    hash: {
      ...options.hash,
      attribute: attribute,
    },
  });

  if (old) {
    return old;
  }

  return attribute;
}

function compatCommandNameRemapping(cluster, command, options) {
  cluster = appHelper.asUpperCamelCase(cluster, {
    hash: { preserveAcronyms: true },
  });

  command = appHelper.asUpperCamelCase(command, {
    hash: { preserveAcronyms: true },
  });

  const old = oldName.call(this, cluster, {
    hash: {
      ...options.hash,
      command: command,
    },
  });

  if (old) {
    return old;
  }

  return command;
}

/**
 * Figure out whether the entity represented by cluster+options (could be a
 * cluster, attribute, command, etc) has an old name that it was renamed from,
 * and if so return it.
 */
function oldName(cluster, options) {
  const data = fetchAvailabilityData(this.global);
  const path = makeAvailabilityPath(cluster, options);

  return findDataForPath(data, ['renames', ...path]);
}

function hasOldName(cluster, options) {
  return oldName.call(this, cluster, options) !== undefined;
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
    if (options.hash.stronglyTypedArrays) {
      let innerType = await asObjectiveCClass.call(this, type, cluster, { hash: { ...options.hash, forceNotList: true }});
      return `NSArray<${innerType} *>`;
    }

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
      cluster = compatClusterNameRemapping.call(this, cluster, { hash: {} });
      // If we are generating the "use the old name" API, here, and using the
      // pre-everything-got-renamed cluster name, we need to also use the
      // pre-everything-got-renamed struct name.  For example, if a struct got
      // renamed from Foo to FooStruct and there is an attribute that has that
      // type, we want to output the pre-renaming name for the getters that
      // predate the "great Matter API revamp", and the post-renaming name for
      // the ones that post-date it.
      type =
        oldName.call(this, cluster, {
          hash: {
            struct: type,
          },
        }) || type;
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

function objCEnumItemLabel(itemLabel, options) {
  if (options.hash.preserveAcronyms) {
    return appHelper.asUpperCamelCase.call(this, itemLabel, options);
  }

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
    if (f) {
      let rawData = fs.readFileSync(f, { encoding: 'utf8', flag: 'r' });
      availabilityData = YAML.parse(rawData);
    } else {
      throw new Error(
        `Resource availability-data not found among the context resources. Check your template.json file.`
      );
    }
  }
  return availabilityData;
}

function findDataForPath(availabilityData, path) {
  let foundData = undefined;
  for (let releaseData of availabilityData) {
    let names = [...path];
    let currentValue = releaseData;
    while (currentValue != undefined && names.length != 0) {
      currentValue = currentValue[names.shift()];
    }

    if (currentValue === undefined) {
      continue;
    }

    if (foundData !== undefined) {
      throw new Error(
        `Found two releases matching path: ${JSON.stringify(path)}`
      );
    }

    // Store for now so we can do the "only one thing matches" check above on
    // later releases.
    foundData = currentValue;

    // Go on to the next release
  }

  return foundData;
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
      currentContainer = currentContainer[containerNames.shift()];
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

/**
 * Takes a path (not including the leading "introduced" or "deprecated") and
 * modifies it to point to the container of the thing being referenced, if any.
 * If there is no container, returns undefined.
 */
function findPathToContainer(availabilityPath) {
  switch (availabilityPath[0]) {
    case 'struct fields':
      return ['structs', ...availabilityPath.slice(1, -1)];
    case 'event fields':
      return ['events', ...availabilityPath.slice(1, -1)];
    case 'command fields':
      return ['commands', ...availabilityPath.slice(1, -1)];
    case 'enum values':
      return ['enums', ...availabilityPath.slice(1, -1)];
    case 'bitmap values':
      return ['bitmaps', ...availabilityPath.slice(1, -1)];

    case 'structs':
    case 'events':
    case 'commands':
    case 'attributes':
    case 'enums':
    case 'bitmaps':
      return ['clusters', ...availabilityPath.slice(1, -1)];

    case 'apis':
    case 'global attributes':
    case 'clusters':
      return undefined;

    default:
      throw `Don't know how to find container for path '${JSON.stringify(
        availabilityPath
      )}'`;
  }
}

/**
 * Finds the release in which this path, or one of its ancestors, was
 * deprecated, if such a release exists.  If no such release exists, returns
 * undefined.
 */
function findDeprecationRelease(global, path, options) {
  if (path === undefined) {
    return undefined;
  }

  const data = fetchAvailabilityData(global);
  let deprecatedRelease = undefined;
  let deprecationPath = [...path];
  while (deprecatedRelease === undefined && deprecationPath != undefined) {
    deprecatedRelease = findReleaseForPath(
      data,
      ['deprecated', ...deprecationPath],
      options
    );
    deprecationPath = findPathToContainer(deprecationPath);
  }
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
  return deprecatedRelease;
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

  let deprecatedRelease = findDeprecationRelease(this.global, path, options);
  const deprecatedVersions = deprecatedRelease?.versions;

  if (introducedVersions === undefined && deprecatedVersions !== undefined) {
    throw new Error(
      `Found deprecation but no introduction for: '${clusterName}' '${JSON.stringify(
        options.hash
      )}'`
    );
  }

  if (isProvisional.call(this, clusterName, options)) {
    return 'MTR_PROVISIONALLY_AVAILABLE';
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

  if (deprecatedVersions === undefined) {
    let availabilityStrings = Object.entries(introducedVersions).map(
      ([os, version]) => `${os}(${version})`
    );
    return `MTR_AVAILABLE(${availabilityStrings.join(', ')})`;
  }

  if (!options.hash.deprecationMessage) {
    throw new Error(
      `Deprecation needs a deprecation message for ${clusterName} and ${JSON.stringify(
        options.hash
      )} (${this.global.templatePath}:${options.loc.start.line})`
    );
  }

  if (deprecatedVersions === 'future') {
    let availabilityStrings = Object.entries(introducedVersions).map(
      ([os, version]) => `${os}(${version})`
    );
    return `MTR_AVAILABLE(${availabilityStrings.join(
      ', '
    )})\nMTR_NEWLY_DEPRECATED("${options.hash.deprecationMessage}")`;
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

  let swiftUnavailableRelease = findReleaseForPath(
    data,
    ['swiftUnavailable', ...path],
    options
  );
  let swiftUnavailable;
  if (swiftUnavailableRelease == undefined) {
    swiftUnavailable = '';
  } else {
    swiftUnavailable = ` NS_SWIFT_UNAVAILABLE("${options.hash.deprecationMessage}")`;
  }

  let availabilityStrings = Object.entries(introducedVersions).map(
    ([os, version]) => `${os}(${version}, ${deprecatedVersions[os]})`
  );
  return `MTR_DEPRECATED("${
    options.hash.deprecationMessage
  }", ${availabilityStrings.join(', ')})${swiftUnavailable}`;
}

/**
 * Utility for wasIntroducedBeforeRelease and isSupported.  Returns undefined if
 * the the path we are looking at was not officially introduced, otherwise
 * returns -1 if it was introduced before the reference release, 0 if it was
 * introduced in the reference release, 1 if it was introduced after the
 * reference release.
 *
 * Throws if referenceRelease is not defined.
 */
function compareIntroductionToReferenceRelease(global, path, options, referenceRelease) {
  if (referenceRelease === undefined) {
    throw new Error("Can't compare to non-existent release");
  }

  const data = fetchAvailabilityData(global);

  let introducedRelease = findReleaseForPath(
    data,
    ['introduced', ...path],
    options
  );
  if (introducedRelease === undefined) {
    return undefined;
  }

  let referenceIndex = data.indexOf(referenceRelease);
  let introducedIndex = data.indexOf(introducedRelease);
  if (introducedIndex < referenceIndex) {
    return -1;
  }

  if (introducedIndex > referenceIndex) {
    return 1;
  }

  return 0;
}

function wasIntroducedBeforeRelease(releaseName, clusterName, options) {
  const data = fetchAvailabilityData(this.global);
  const path = makeAvailabilityPath(clusterName, options);

  let referenceRelease = findReleaseByName(data, releaseName);
  if (referenceRelease === undefined) {
    throw new Error(`Invalid release name: ${releaseName}`);
  }

  let comparisonStatus = compareIntroductionToReferenceRelease(
    this.global,
    makeAvailabilityPath(clusterName, options),
    options, referenceRelease
  );
  if (comparisonStatus === undefined) {
    // Not introduced yet, so not introduced before anything in particular.
    return false;
  }

  return comparisonStatus == -1;
}

/**
 * Utility for wasRemoved and findProvisionalRelease.  Finds a release that
 * mentions the given path or some ancestor of it in the given section.  Returns
 * the release and the path that ended up being found, or undefined if nothing
 * was found.
 */
function findReleaseForPathOrAncestorAndSection(global, cluster, options, section) {
  const data = fetchAvailabilityData(global);
  let path = makeAvailabilityPath(cluster, options);

  while (path !== undefined) {
    let foundRelease = findReleaseForPath(
      data,
      [section, ...path],
      options
    );
    if (foundRelease !== undefined) {
      return { release: foundRelease, path: path };
    }
    path = findPathToContainer(path);
  }
  return undefined;
}

function wasRemoved(cluster, options) {
  return findReleaseForPathOrAncestorAndSection(this.global, cluster, options, 'removed') !== undefined;
}

function pathsEqual(path1, path2) {
  if (path1.length != path2.length) {
    return false;
  }

  for (let i = 0; i < path1.length; ++i) {
    if (path1[i] != path2[i]) {
      return false;
    }
  }

  return true;
}

function isSupported(cluster, options) {
  // Things that are removed are not supported.
  if (wasRemoved.call(this, cluster, options)) {
    return false;
  }

  // Things that have a deprecated container and were not introduced before the
  // deprecation are not supported.
  let path = makeAvailabilityPath(cluster, options);
  let deprecationRelease = findDeprecationRelease(this.global, findPathToContainer(path), options);
  if (deprecationRelease !== undefined) {
    let comparisonStatus = compareIntroductionToReferenceRelease(this.global, path, options, deprecationRelease);
    // The only case where we might be supported is if we have an explicit
    // introduction and the introduction comes before the ancestor deprecation.
    if (comparisonStatus != -1) {
      return false;
    }
  }

  return true;
}

function isProvisional(cluster, options) {
  let provisionalRelease = findReleaseForPathOrAncestorAndSection(this.global, cluster, options, 'provisional');
  if (provisionalRelease === undefined) {
    // For attributes, also check whether this is a provisional global
    // attribute.
    let attrName = options.hash.attribute;
    if (attrName) {
      provisionalRelease = findReleaseForPathOrAncestorAndSection(
        this.global,
        /* cluster does not apply to global attributes */
        "",
        /*
         * Keep our options (e.g. in terms of isForIds bits), but replace
         * attribute with globalAttribute.
         */
        { hash: { ...options.hash, attribute: undefined, globalAttribute: attrName } },
        'provisional'
      );
    }
    if (provisionalRelease === undefined) {
      return false;
    }
  }

  let path = makeAvailabilityPath(cluster, options);
  while (path !== undefined) {
    let comparisonStatus = compareIntroductionToReferenceRelease(
      this.global,
      path,
      options,
      provisionalRelease.release
    );

    // If we have an explicit introduction for something that is at the scope of
    // the provisional thing or narrower, and that introduction comes no earlier
    // than the provisional marking (we allow the same release for cases we
    // unfortunately have where we introduced some parts of a provisional
    // thing), then this not considered provisional.
    if (comparisonStatus === 1 || comparisonStatus === 0) {
      return false;
    }

    // If we have walked all the way up to the path to the provisional thing
    // without finding an overriding introduction, we are done.
    if (pathsEqual(path, provisionalRelease.path)) {
      break;
    }

    path = findPathToContainer(path);
  }

  return true;
}

function hasRenamedFields(cluster, options) {
  const data = fetchAvailabilityData(this.global);
  // Try to minimize duplication by reusing existing path-construction and
  // manipulation bits.  Just use dummy values for the leaf we're going to
  // remove.
  let hashAddition;
  if (options.hash.struct) {
    hashAddition = {
      structField: 'dummy',
    };
  } else if (options.hash.event) {
    hashAddition = {
      eventField: 'dummy',
    };
  } else if (options.hash.command) {
    hashAddition = {
      commandField: 'dummy',
    };
  } else if (options.hash.enum) {
    hashAddition = {
      enumValue: 'dummy',
    };
  } else if (options.hash.bitmap) {
    hashAddition = {
      bitmapValue: 'dummy',
    };
  } else {
    throw new Error(
      `hasRenamedFields called for a non-container object: ${cluster} '${JSON.stringify(
        options.hash
      )}'`
    );
  }

  let path = makeAvailabilityPath(cluster, {
    hash: {
      ...options.hash,
      ...hashAddition,
    },
  });

  // Now strip off the last bit of the path, so we're just checking for any
  // renames in our container.
  path.pop();

  return findDataForPath(data, ['renames', ...path]) !== undefined;
}

function and() {
  let args = [...arguments];
  // Strip off the options arg.
  let options = args.pop();

  return args.reduce((running, current) => {
    if (current instanceof Promise) {
      throw new Error(
        "Promise passed as argument to 'and'.  You probably want to use async_if/async_and"
      );
    }
    return running && current;
  }, true);
}

function or() {
  let args = [...arguments];
  // Strip off the options arg.
  let options = args.pop();

  return args.reduce((running, current) => {
    if (current instanceof Promise) {
      throw new Error(
        "Promise passed as argument to 'or'.  You probably want to use async_if/async_or"
      );
    }
    return running || current;
  }, false);
}

function not(value) {
  if (value instanceof Promise) {
    throw new Error(
      "Promise passed as argument to 'not'.  You probably want to use async_if/async_not"
    );
  }

  return !value;
}

async function async_if(value, options) {
  let condition = await value;
  if (condition) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
}

async function async_and() {
  let args = [...arguments];
  // Strip off the options arg.
  let options = args.pop();

  let booleans = await Promise.all(args);
  return booleans.reduce((running, current) => {
    return running && current;
  }, true);
}

async function async_or() {
  let args = [...arguments];
  // Strip off the options arg.
  let options = args.pop();

  let booleans = await Promise.all(args);
  return booleans.reduce((running, current) => {
    return running || current;
  }, false);
}

async function async_not(value) {
  let toBeNegated = await value;
  return !toBeNegated;
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
exports.compatCommandNameRemapping = compatCommandNameRemapping;
exports.availability = availability;
exports.wasIntroducedBeforeRelease = wasIntroducedBeforeRelease;
exports.wasRemoved = wasRemoved;
exports.isSupported = isSupported;
exports.isProvisional = isProvisional;
exports.and = and;
exports.or = or;
exports.not = not;
exports.async_if = async_if;
exports.async_and = async_and;
exports.async_or = async_or;
exports.async_not = async_not;
exports.oldName = oldName;
exports.hasOldName = hasOldName;
exports.hasRenamedFields = hasRenamedFields;

exports.meta = {
  category: dbEnum.helperCategory.matter,
  alias: ['darwin/Framework/CHIP/templates/helper.js', 'darwin-chip-helper'],
};
