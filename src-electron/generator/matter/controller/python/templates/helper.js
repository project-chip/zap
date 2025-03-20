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

// Import helpers from zap core
const zapPath = '../../../../../';
const dbEnum = require('../../../../../../src-shared/db-enum');
const ChipTypesHelper = require('../../../app/zap-templates/common/ChipTypesHelper');
const templateUtil = require(zapPath + 'generator/template-util.js');
const queryZcl = require(zapPath + 'db/query-zcl');

const characterStringTypes = ['CHAR_STRING', 'LONG_CHAR_STRING'];
const octetStringTypes = ['OCTET_STRING', 'LONG_OCTET_STRING'];

function asPythonType(zclType) {
  const type = ChipTypesHelper.asBasicType(zclType);
  switch (type) {
    case 'bool':
      return 'bool';
    case 'int8_t':
    case 'int16_t':
    case 'int32_t':
    case 'int64_t':
    case 'uint8_t':
    case 'uint16_t':
    case 'uint32_t':
    case 'uint64_t':
      return 'int';
    case 'char *':
      return 'str';
    case 'uint8_t *':
    case 'chip::ByteSpan':
      return 'bytes';
    case 'chip::CharSpan':
      return 'str';
  }
}

/**
 * Note: This helper needs to be used under a block helper which has a
 * reference to clusterId.
 * Available options:
 * - All options passed to this helper are considered as overrides for
 * zcl types
 * for eg: (as_underlying_python_zcl_type type clusterId SomeType='Stype')
 * will return "Stype" for "SomeType" type
 * @param {*} type
 * @param {*} clusterId
 * @param {*} options
 * @returns The corresponding python data type for a zcl data type.
 */
async function as_underlying_python_zcl_type(type, clusterId, options) {
  let hash = options.hash;
  // Overwrite any type with the one coming from the template options
  // Eg: {{as_underlying_python_zcl_type type [clusterId] SomeType='Stype'}}
  // Here all types named 'SomeType' will be returned as 'Stype'
  if (type in hash) {
    return hash[type];
  }

  // Get ZCL Data Type from the db
  const packageIds = await templateUtil.ensureZclPackageIds(this);
  let dataType = await queryZcl.selectDataTypeByNameAndClusterId(
    this.global.db,
    type,
    clusterId,
    packageIds
  );
  if (type && type.toLowerCase() == 'boolean') {
    return 'bool';
  } else if (
    dataType &&
    dataType.discriminatorName &&
    (dataType.discriminatorName.toLowerCase() == dbEnum.zclType.bitmap ||
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.enum ||
      dataType.discriminatorName.toLowerCase() == dbEnum.zclType.number)
  ) {
    // Do not know on why this is the case but returning nothing for floats
    // and this is done for compatibility with asPythonType.
    // Issue: https://github.com/project-chip/connectedhomeip/issues/25718
    if (
      dataType.name.includes('float') ||
      dataType.name.includes('double') ||
      dataType.name.includes('single')
    ) {
      return '';
    }
    return 'int';
  } else if (octetStringTypes.includes(type.toUpperCase())) {
    return 'bytes';
  } else if (characterStringTypes.includes(type.toUpperCase())) {
    return 'str';
  } else {
    return '';
  }
}

function asPythonCType(zclType) {
  const type = ChipTypesHelper.asBasicType(zclType);
  switch (type) {
    case 'bool':
    case 'int8_t':
    case 'int16_t':
    case 'int32_t':
    case 'int64_t':
    case 'uint8_t':
    case 'uint16_t':
    case 'uint32_t':
    case 'uint64_t':
      return 'c_' + type.replace('_t', '');
    case 'char *':
    case 'uint8_t *':
      return 'c_char_p';
  }
}

const dep = templateUtil.deprecatedHelper;

//
// Module exports
//
exports.asPythonType = dep(asPythonType, {
  to: 'as_underlying_python_zcl_type'
});
exports.asPythonCType = asPythonCType;

exports.meta = {
  category: dbEnum.helperCategory.matter,
  alias: ['controller/python/templates/helper.js', 'matter-python-helper']
};
exports.as_underlying_python_zcl_type = as_underlying_python_zcl_type;
