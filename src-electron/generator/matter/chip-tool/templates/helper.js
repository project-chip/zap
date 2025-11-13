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
const zapPath = '../../../../';
const templateUtil = require(zapPath + 'generator/template-util.js');
const zclHelper = require(zapPath + 'generator/helper-zcl.js');
const zclQuery = require(zapPath + 'db/query-zcl.js');
const dbEnum = require('../../../../../src-shared/db-enum');

const ChipTypesHelper = require('../../app/zap-templates/common/ChipTypesHelper');

function asDelimitedCommand(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function asTypeMinValue(type) {
  function fn(pkgId) {
    const options = { hash: {} };
    // Add clusterId if available in context
    if (this.clusterId) {
      options.hash.clusterId = this.clusterId;
    } else if (this.clusterRef) {
      options.hash.clusterId = this.clusterRef;
    }
    this.isArray = false;
    return zclHelper.asUnderlyingZclType
      .call(this, type, options)
      .then((zclType) => {
        const basicType = ChipTypesHelper.asBasicType(zclType);
        switch (basicType) {
          case 'bool':
            return '0';
          case 'int8_t':
          case 'int16_t':
          case 'int32_t':
          case 'int64_t':
            return 'INT' + parseInt(basicType.slice(3)) + '_MIN';
          case 'uint8_t':
          case 'uint16_t':
          case 'uint32_t':
          case 'uint64_t':
            return '0';
          case 'float':
          case 'double':
            return `-std::numeric_limits<${basicType}>::infinity()`;
          default:
            error =
              'asTypeMinValue: Unhandled underlying type ' +
              zclType +
              ' for original type ' +
              type;
            throw error;
        }
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

function asTypeMaxValue(type) {
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
        const basicType = ChipTypesHelper.asBasicType(zclType);
        switch (basicType) {
          case 'bool':
            return '1';
          case 'int8_t':
          case 'int16_t':
          case 'int32_t':
          case 'int64_t':
            return 'INT' + parseInt(basicType.slice(3)) + '_MAX';
          case 'uint8_t':
          case 'uint16_t':
          case 'uint32_t':
          case 'uint64_t':
            return 'UINT' + parseInt(basicType.slice(4)) + '_MAX';
          case 'float':
          case 'double':
            return `std::numeric_limits<${basicType}>::infinity()`;
          default:
            return 'err';
        }
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

async function structs_with_cluster_name(options) {
  const packageIds = await templateUtil.ensureZclPackageIds(this);

  const structs = await zclQuery.selectAllStructsWithItems(
    this.global.db,
    packageIds
  );

  let blocks = [];
  for (const s of structs) {
    if (s.struct_cluster_count == 0) {
      continue;
    }

    if (s.struct_cluster_count == 1) {
      const clusters = await zclQuery.selectStructClusters(
        this.global.db,
        s.id
      );
      blocks.push({
        id: s.id,
        name: s.name,
        struct_fabric_idx_field: s.struct_fabric_idx_field,
        clusterName: clusters[0].name
      });
    }

    if (s.struct_cluster_count > 1) {
      blocks.push({
        id: s.id,
        name: s.name,
        struct_fabric_idx_field: s.struct_fabric_idx_field,
        clusterName: 'detail'
      });
    }
  }

  return templateUtil.collectBlocks(blocks, options, this);
}

async function assertSameTestType(current, expected) {
  if (current == expected) {
    return '';
  }

  const filename = this.parent.parent.parent.filename;
  const testName = this.parent.parent.parent.testName;
  const error = `\nFile: ${filename}\nTest: ${testName}\nCluster ${this.parent.cluster} Attribute: ${this.name}: Constraint type "${expected}" does not match the current type "${current}".`;
  throw error;
}

const dep = templateUtil.deprecatedHelper;

//
// Module exports
//
exports.asDelimitedCommand = dep(
  asDelimitedCommand,
  'asDelimitedCommand has been deprecated. Use cleanse_label_as_kebab_case instead'
);
exports.asTypeMinValue = dep(
  asTypeMinValue,
  'asTypeMinValue has been deprecated. Use as_type_min_value instead'
);
exports.asTypeMaxValue = dep(
  asTypeMaxValue,
  'asTypeMaxValue has been deprecated. Use as_type_max_value instead'
);
exports.structs_with_cluster_name = dep(
  structs_with_cluster_name,
  'structs_with_cluster_name has been deprecated. Use structs_with_clusters instead'
);
exports.assertSameTestType = assertSameTestType;

exports.meta = {
  category: dbEnum.helperCategory.matter,
  alias: ['chip-tool/templates/helper.js', 'matter-chip-tool-helper']
};
