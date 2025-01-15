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
const templateUtil = require(zapPath + 'generator/template-util.js');
const zclHelper = require(zapPath + 'generator/helper-zcl.js');
const ChipTypesHelper = require('../../../app/zap-templates/common/ChipTypesHelper.js');
const StringHelper = require('../../../app/zap-templates/common/StringHelper.js');
const appHelper = require('../../../app/zap-templates/templates/app/helper.js');
const dbEnum = require('../../../../../../src-shared/db-enum');
const queryZcl = require(zapPath + 'db/query-zcl');
const zclUtil = require(zapPath + 'util/zcl-util.js');

const characterStringTypes = ['CHAR_STRING', 'LONG_CHAR_STRING'];
const octetStringTypes = ['OCTET_STRING', 'LONG_OCTET_STRING'];

function convertBasicCTypeToJavaType(cType) {
  switch (cType) {
    case 'uint8_t':
    case 'int8_t':
    case 'uint16_t':
    case 'int16_t':
      return 'int';
    case 'uint32_t':
    case 'int32_t':
    case 'uint64_t':
    case 'int64_t':
      return 'long';
    case 'bool':
      return 'boolean';
    case 'float':
      return 'float';
    case 'double':
      return 'double';
    default:
      let error = 'Unhandled type in convertBasicCTypeToJavaType ' + cType;
      throw error;
  }
}

function convertBasicCTypeToJniType(cType) {
  switch (convertBasicCTypeToJavaType(cType)) {
    case 'int':
      return 'jint';
    case 'long':
      return 'jlong';
    case 'boolean':
      return 'jboolean';
    case 'float':
      return 'jfloat';
    case 'double':
      return 'jdouble';
    default:
      let error = 'Unhandled type in convertBasicCTypeToJniType ' + cType;
      throw error;
  }
}

function convertBasicCTypeToJavaBoxedType(cType) {
  switch (convertBasicCTypeToJavaType(cType)) {
    case 'int':
      return 'Integer';
    case 'long':
      return 'Long';
    case 'boolean':
      return 'Boolean';
    case 'float':
      return 'Float';
    case 'double':
      return 'Double';
    default:
      let error = 'Unhandled type in convertBasicCTypeToJavaBoxedType ' + cType;
      throw error;
  }
}

async function asJavaBoxedType(type, zclType) {
  if (StringHelper.isOctetString(type)) {
    return 'byte[]';
  } else if (StringHelper.isCharString(type)) {
    return 'String';
  } else {
    try {
      return convertBasicCTypeToJavaBoxedType(
        ChipTypesHelper.asBasicType(zclType)
      );
    } catch (error) {
      // Unknown type, default to Object.
      return 'Object';
    }
  }
}

function asJniBasicType(type, useBoxedTypes) {
  if (this && this.isOptional) {
    return 'jobject';
  } else if (StringHelper.isOctetString(type)) {
    return 'jbyteArray';
  } else if (StringHelper.isCharString(type)) {
    return 'jstring';
  } else if (useBoxedTypes) {
    return 'jobject';
  }
  function fn(pkgId) {
    const options = { hash: {} };
    return zclHelper.asResolvedUnderlyingZclType
      .call(this, type, options)
      .then((zclType) => {
        return convertBasicCTypeToJniType(
          ChipTypesHelper.asBasicType(zclType),
          false
        );
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

function asJniSignatureBasic(type, useBoxedTypes) {
  function fn(pkgId) {
    const options = { hash: {} };
    return zclHelper.asResolvedUnderlyingZclType
      .call(this, type, options)
      .then((zclType) => {
        return convertCTypeToJniSignature(
          ChipTypesHelper.asBasicType(zclType),
          useBoxedTypes
        );
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

function convertCTypeToJniSignature(cType, useBoxedTypes) {
  let javaType;
  if (useBoxedTypes) {
    javaType = convertBasicCTypeToJavaBoxedType(cType);
  } else {
    javaType = convertBasicCTypeToJavaType(cType);
  }

  switch (javaType) {
    case 'int':
      return 'I';
    case 'long':
      return 'J';
    case 'boolean':
      return 'Z';
    case 'double':
      return 'D';
    case 'float':
      return 'F';
    case 'Boolean':
      return 'Ljava/lang/Boolean;';
    case 'Integer':
      return 'Ljava/lang/Integer;';
    case 'Long':
      return 'Ljava/lang/Long;';
    case 'Double':
      return 'Ljava/lang/Double;';
    case 'Float':
      return 'Ljava/lang/Float;';
    default:
      let error =
        'Unhandled Java type in convertCTypeToJniSignature ' +
        javaType +
        ' for C type ' +
        cType;
      throw error;
  }
}

function convertAttributeCallbackTypeToJavaName(cType) {
  // These correspond to OctetStringAttributeCallback and CharStringAttributeCallback in ChipClusters-java.zapt.
  if (StringHelper.isOctetString(this.type)) {
    return 'OctetString';
  } else if (StringHelper.isCharString(this.type)) {
    return 'CharString';
  } else {
    return convertBasicCTypeToJavaBoxedType(cType);
  }
}

/**
 * Note: This is a util function
 * Available options:
 * - isBoxedJavaType: 0/1 to return string types in different ways
 * - All other options passed to this helper are considered as overrides for
 * zcl types
 * for eg: (as_underlying_java_zcl_type type clusterId boolean='Boolean')
 * will return "Boolean" for "boolean" type
 * @param {*} type
 * @param {*} clusterId
 * @param {*} options
 * @returns The corresponding java data type for a zcl data type.
 */
async function as_underlying_java_zcl_type_util(
  type,
  clusterId,
  options,
  context
) {
  let hash = options.hash;
  // Overwrite any type with the one coming from the template options
  // Eg: {{as_underlying_java_zcl_type type [clusterId] boolean='Boolean'}}
  // Here all types named 'boolean' will be returned as 'Boolean'
  if (type in hash) {
    return hash[type];
  }

  // Get ZCL Data Type from the db
  const packageIds = await templateUtil.ensureZclPackageIds(context);
  let dataType = await queryZcl.selectDataTypeByNameAndClusterId(
    context.global.db,
    type,
    clusterId,
    packageIds
  );

  if (!dataType) {
    env.logWarning(type + ' not found in the data_type table');
    return 0;
  }
  let isBoxedJavaType =
    hash && hash.isBoxedJavaType ? hash.isBoxedJavaType : false;
  if (
    dataType.discriminatorName.toLowerCase() == dbEnum.zclType.bitmap ||
    dataType.discriminatorName.toLowerCase() == dbEnum.zclType.enum ||
    dataType.discriminatorName.toLowerCase() == dbEnum.zclType.number
  ) {
    if (dataType.name.includes('float')) {
      return 'Float';
    } else if (dataType.name.includes('double')) {
      return 'Double';
    } else if (dataType.name.includes('single')) {
      return 'Float';
    } else {
      let sizeAndSign = await zclUtil.zcl_data_type_size_and_sign(
        type,
        dataType,
        clusterId,
        packageIds,
        context
      );
      if (sizeAndSign.size >= 3) {
        return 'Long';
      }
    }
    return 'Integer';
  } else if (octetStringTypes.includes(type.toUpperCase())) {
    return isBoxedJavaType ? 'byte[]' : 'OctetString';
  } else if (characterStringTypes.includes(type.toUpperCase())) {
    return isBoxedJavaType ? 'String' : 'CharString';
  } else {
    let error = 'Unhandled type in as_underlying_java_zcl_type_util ' + type;
    if (isBoxedJavaType) {
      return 'Object';
    } else {
      throw error;
    }
  }
}

/**
 * Note: This helper needs to be used under a block helper which has a
 * reference to clusterId.
 * Available options:
 * - isBoxedJavaType: 0/1 to return string types in different ways
 * - All other options passed to this helper are considered as overrides for
 * zcl types
 * for eg: (as_underlying_java_zcl_type type clusterId boolean='Boolean')
 * will return "Boolean" for "boolean" type
 * @param {*} type
 * @param {*} clusterId
 * @param {*} options
 * @returns The corresponding java data type for a zcl data type.
 */
async function as_underlying_java_zcl_type(type, clusterId, options) {
  return as_underlying_java_zcl_type_util(type, clusterId, options, this);
}

async function asUnderlyingBasicType(type) {
  const options = { hash: {} };
  let zclType = await zclHelper.asResolvedUnderlyingZclType.call(
    this,
    type,
    options
  );
  return ChipTypesHelper.asBasicType(zclType);
}

async function asJavaType(type, zclType, cluster, options) {
  let pkgIds = await templateUtil.ensureZclPackageIds(this);
  if (zclType == null) {
    const options = { hash: {} };
    zclType = await zclHelper.asUnderlyingZclType.call(this, type, options);
  }
  let isStruct = await zclHelper
    .isStruct(this.global.db, type, pkgIds)
    .then((zclType) => zclType != 'unknown');

  let typedef = await queryZcl.selectStructByNameAndClusterId(
    this.global.db,
    type,
    cluster,
    pkgIds
  );

  let classType = '';

  if (StringHelper.isOctetString(type)) {
    classType += 'byte[]';
  } else if (StringHelper.isCharString(type)) {
    classType += 'String';
  } else if (isStruct) {
    classType += `ChipStructs.${appHelper.asUpperCamelCase(
      cluster
    )}Cluster${appHelper.asUpperCamelCase(type)}`;
  } else if (typedef) {
    return asJavaType(typedef.type, null, cluster, options);
  } else {
    let javaBoxedType = asJavaBoxedType(type, zclType);
    if (javaBoxedType == 'Object' && options.hash.clusterId) {
      javaBoxedType = await as_underlying_java_zcl_type_util(
        type,
        options.hash.clusterId,
        options,
        this
      );
    }
    classType += javaBoxedType;
  }

  if (!options.hash.underlyingType) {
    if (!options.hash.forceNotList && (this.isArray || this.entryType)) {
      if (!options.hash.removeGenericType) {
        classType = 'ArrayList<' + classType + '>';
      } else {
        classType = 'ArrayList';
      }
    }

    if (this.isOptional) {
      if (!options.hash.removeGenericType) {
        classType = 'Optional<' + classType + '>';
      } else {
        classType = 'Optional';
      }
    }

    if (this.isNullable && options.hash.includeAnnotations) {
      classType = '@Nullable ' + classType;
    }
  }

  return classType;
}

async function asJniType(type, zclType, cluster, options) {
  let types = await asJniHelper.call(this, type, zclType, cluster, options);
  return types['jniType'];
}

async function asJniSignature(type, zclType, cluster, useBoxedTypes, options) {
  let types = await asJniHelper.call(this, type, zclType, cluster, options);
  return useBoxedTypes ? types['jniBoxedSignature'] : types['jniSignature'];
}

async function asJniClassName(type, zclType, cluster, options) {
  let types = await asJniHelper.call(this, type, zclType, cluster, options);
  return types['jniClassName'];
}

async function asJniHelper(type, zclType, cluster, options) {
  let pkgIds = await templateUtil.ensureZclPackageIds(this);
  if (zclType == null) {
    zclType = await zclHelper.asUnderlyingZclType.call(this, type, options);
  }
  let isStruct = await zclHelper
    .isStruct(this.global.db, type, pkgIds)
    .then((zclType) => zclType != 'unknown');

  if (this.isOptional) {
    const signature = 'Ljava/util/Optional;';
    return {
      jniType: 'jobject',
      jniSignature: signature,
      jniBoxedSignature: signature
    };
  }

  if (this.isArray) {
    const signature = 'Ljava/util/ArrayList;';
    return {
      jniType: 'jobject',
      jniSignature: signature,
      jniBoxedSignature: signature
    };
  }

  if (StringHelper.isOctetString(type)) {
    const signature = '[B';
    return {
      jniType: 'jbyteArray',
      jniSignature: signature,
      jniBoxedSignature: signature
    };
  }

  if (StringHelper.isCharString(type)) {
    const signature = 'Ljava/lang/String;';
    return {
      jniType: 'jstring',
      jniSignature: signature,
      jniBoxedSignature: signature
    };
  }

  if (isStruct) {
    const signature = `Lchip/devicecontroller/ChipStructs$${appHelper.asUpperCamelCase(
      cluster
    )}Cluster${appHelper.asUpperCamelCase(type)};`;
    return {
      jniType: 'jobject',
      jniSignature: signature,
      jniBoxedSignature: signature
    };
  }

  let jniBoxedSignature;
  try {
    jniBoxedSignature = await asJniSignatureBasic.call(this, type, true);
  } catch (error) {
    jniBoxedSignature = 'Ljava/lang/Object;';
  }
  let jniSignature;
  try {
    jniSignature = await asJniSignatureBasic.call(this, type, false);
  } catch (error) {
    jniSignature = 'Ljava/lang/Object;';
  }
  // Example: Ljava/lang/Integer; -> java/lang/Integer, needed for JNI class lookup
  let jniClassName = jniBoxedSignature.substring(
    1,
    jniBoxedSignature.length - 1
  );
  return {
    jniType: asJniBasicType(type, true),
    jniSignature: jniSignature,
    jniBoxedSignature: jniBoxedSignature,
    jniClassName: jniClassName
  };
}

function incrementDepth(depth) {
  return depth + 1;
}

/**
 * If helper that checks if an attribute is basic or not based for java code
 * generation
 * For eg: In java, an attribute is not basic if it is either nullable, optional,
 * array type or struct.
 * Note: This helper should be used within an attribute block helper and also
 * needs to be used under a block helper which has a reference to clusterId.
 * example:
 * {{#if_basic_attribute type}}
 * type is basic
 * {{else}}
 * type is not basic
 * {{/if_basic_attribute}}
 * @param {*} type
 * @param {*} clusterId
 * @param {*} options
 * @returns Promise of content
 */
async function if_basic_attribute(type, clusterId, options) {
  let struct = null;
  if (this.isNullable || this.isOptional || this.isArray) {
    return options.inverse(this);
  } else {
    let packageIds = await templateUtil.ensureZclPackageIds(this);
    struct = await queryZcl.selectStructByNameAndClusterId(
      this.global.db,
      type,
      clusterId,
      packageIds
    );
    if (struct) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  }
}

/**
 * If helper that checks if an attribute is not supported for java code
 * generation
 * Note: This helper needs to be used under a block helper which has a
 * reference to clusterId.
 * For eg: In java, an attribute callback is not supported when it is a struct.
 * However it is supported if it is an array of structs.
 * @param {*} type
 * @param {*} isArray
 * @param {*} clusterId
 * @param {*} options
 * @returns Promise of content
 */
async function if_unsupported_attribute_callback(
  type,
  isArray,
  clusterId,
  options
) {
  let struct = null;
  if (isArray) {
    return options.inverse(this);
  } else {
    let packageIds = await templateUtil.ensureZclPackageIds(this);
    struct = await queryZcl.selectStructByNameAndClusterId(
      this.global.db,
      type,
      clusterId,
      packageIds
    );
    if (struct) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  }
}

const dep = templateUtil.deprecatedHelper;

//
// Module exports
//
exports.asUnderlyingBasicType = asUnderlyingBasicType;
exports.asJavaType = asJavaType;
exports.asJavaBoxedType = dep(asJavaBoxedType, {
  to: 'as_underlying_java_zcl_type'
});
exports.asJniType = asJniType;
exports.asJniSignature = asJniSignature;
exports.asJniClassName = asJniClassName;
exports.asJniBasicType = asJniBasicType;
exports.asJniSignatureBasic = asJniSignatureBasic;
exports.convertBasicCTypeToJniType = convertBasicCTypeToJniType;
exports.convertCTypeToJniSignature = convertCTypeToJniSignature;
exports.convertBasicCTypeToJavaBoxedType = convertBasicCTypeToJavaBoxedType;
exports.convertAttributeCallbackTypeToJavaName = dep(
  convertAttributeCallbackTypeToJavaName,
  { to: 'as_underlying_java_zcl_type' }
);
exports.incrementDepth = incrementDepth;

exports.meta = {
  category: dbEnum.helperCategory.matter,
  alias: ['controller/java/templates/helper.js', 'matter-java-helper']
};
exports.as_underlying_java_zcl_type = as_underlying_java_zcl_type;
exports.if_basic_attribute = if_basic_attribute;
exports.if_unsupported_attribute_callback = if_unsupported_attribute_callback;
