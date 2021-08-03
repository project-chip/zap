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

export interface DbPackageType {
  packageId: number,
  parentPackageRef: number,
  path: string,
  type: string,
  crc: number,
  version: string,
}

export interface DbPackageOptionType {
  optionId: number,
  packageRef: number,
  optionCategory: string,
  optionCode: string,
  optionLabel: string,
}

export interface DbPackageOptionDefaultType {
  optionDefaultId: number,
  packageRef: number,
  optionCategory: string,
  optionRef: number,
}

export interface DbPackageExtensionType {
  packageExtensionId: number,
  packageRef: number,
  entity: string,
  property: string,
  type: string,
  configurability: string,
  label: string,
  globalDefault: string,
}

export interface DbPackageExtensionDefaultType {
  packageExtensionRef: number,
  entityCode: number,
  entityQualifier: string,
  parentCode: number,
  manufacturerCode: number,
  value: string,
}

export interface DbSpecType {
  specId: number,
  packageRef: number,
  code: string,
  description: string,
  certifiable: number,
}

export interface DbDomainType {
  domainId: number,
  packageRef: number,
  name: string,
  latestSpecRef: number,
}

export interface DbClusterType {
  clusterId: number,
  packageRef: number,
  domainName: string,
  code: number,
  manufacturerCode: number,
  name: string,
  description: string,
  define: string,
  isSingleton: number,
  revision: number,
  introducedInRef: number,
  removedInRef: number,
}

export interface DbCommandType {
  commandId: number,
  clusterRef: number,
  packageRef: number,
  code: number,
  manufacturerCode: number,
  name: string,
  description: string,
  source: string,
  isOptional: number,
  introducedInRef: number,
  removedInRef: number,
  responseName: number,
  responseRef: number,
}

export interface DbCommandArgType {
  commandRef: number,
  fieldIdentifier: number,
  name: string,
  type: string,
  isArray: number,
  presentIf: string,
  countArg: string,
  introducedInRef: number,
  removedInRef: number,
}

export interface DbEventType {
  eventId: number,
  clusterRef: number,
  packageRef: number,
  code: number,
  manufacturerCode: number,
  name: string,
  description: string,
  side: string,
  isOptional: string,
  priority: string,
  introducedInRef: number,
  removedInRef: number,
}

export interface DbEventFieldType {
  eventRef: number,
  fieldIdentifier: number,
  name: string,
  type: string,
  introducedInRef: number,
  removedInRef: number,
}

export interface DbAttributeType {
  attributeId: number,
  clusterRef: number,
  packageRef: number,
  code: number,
  manufacturerCode: number,
  name: string,
  type: string,
  side: string,
  define: string,
  min: string,
  max: string,
  minLength: number,
  maxLength: number,
  isWritable: number,
  defaultValue: string,
  isSceneRequired: number,
  isOptional: number,
  isReportable: number,
  arrayType: string,
  introducedInRef: number,
  removedInRef: number,
}

export interface DbGlobalAttributeDefaultType {
  globalAttributeDefaultId: number,
  clusterRef: number,
  attributeRef: number,
  defaultValue: string,
}

export interface DbGlobalAttributeBitType {
  globalAttributeDefaultRef: number,
  bit: number,
  value: number,
  tagRef: number,
}

export interface DbDeviceTypeType {
  deviceTypeId: number,
  packageRef: number,
  domain: string,
  code: number,
  profileId: number,
  name: string,
  description: string,
}

export interface DbDeviceTypeClusterType {
  deviceTypeClusterId: number,
  deviceTypeRef: number,
  clusterRef: number,
  clusterName: string,
  includeClient: number,
  includeServer: number,
  lockClient: number,
  lockServer: number,
}

export interface DbDeviceTypeAttributeType {
  deviceTypeClusterRef: number,
  attributeRef: number,
  attributeName: string,
}

export interface DbDeviceTypeCommandType {
  deviceTypeClusterRef: number,
  commandRef: number,
  commandName: string,
}

export interface DbTagType {
  tagId: number,
  packageRef: number,
  clusterRef: number,
  name: string,
  description: string,
}

export interface DbAtomicType {
  atomicId: number,
  packageRef: number,
  name: string,
  description: string,
  atomicIdentifier: number,
  atomicSize: number,
  isDiscrete: number,
  isString: number,
  isLong: number,
  isChar: number,
  isSigned: number,
}

export interface DbBitmapType {
  bitmapId: number,
  packageRef: number,
  name: string,
  type: string,
}

export interface DbBitmapFieldType {
  bitmapRef: number,
  fieldIdentifier: number,
  name: string,
  mask: number,
  type: string,
}

export interface DbEnumType {
  enumId: number,
  packageRef: number,
  name: string,
  type: string,
}

export interface DbEnumItemType {
  enumRef: number,
  fieldIdentifier: number,
  name: string,
  value: number,
}

export interface DbStructType {
  structId: number,
  packageRef: number,
  name: string,
}

export interface DbStructItemType {
  structRef: number,
  fieldIdentifier: number,
  name: string,
  type: string,
  arrayType: string,
  minLength: number,
  maxLength: number,
  isWritable: number,
}

export interface DbUserType {
  userId: number,
  userKey: string,
  creationTime: number,
}

export interface DbSessionType {
  sessionId: number,
  userRef: number,
  sessionKey: string,
  creationTime: number,
  dirty: number,
}

export interface DbSessionKeyValueType {
  sessionRef: number,
  key: string,
  value: string,
}

export interface DbSessionLogType {
  sessionRef: number,
  timestamp: string,
  log: string,
}

export interface DbSessionPackageType {
  sessionRef: number,
  packageRef: number,
  required: number,
  enabled: number,
}

export interface DbEndpointTypeType {
  endpointTypeId: number,
  sessionRef: number,
  name: string,
  deviceTypeRef: number,
}

export interface DbEndpointType {
  endpointId: number,
  sessionRef: number,
  endpointTypeRef: number,
  profile: number,
  endpointIdentifier: number,
  networkIdentifier: number,
  deviceIdentifier: number,
  deviceVersion: number,
}

export interface DbEndpointTypeClusterType {
  endpointTypeClusterId: number,
  endpointTypeRef: number,
  clusterRef: number,
  side: string,
  enabled: number,
}

export interface DbEndpointTypeAttributeType {
  endpointTypeAttributeId: number,
  endpointTypeRef: number,
  endpointTypeClusterRef: number,
  attributeRef: number,
  included: number,
  storageOption: string,
  singleton: number,
  bounded: number,
  defaultValue: string,
  includedReportable: number,
  minInterval: number,
  maxInterval: number,
  reportableChange: number,
}

export interface DbEndpointTypeCommandType {
  endpointTypeCommandId: number,
  endpointTypeRef: number,
  endpointTypeClusterRef: number,
  commandRef: number,
  incoming: number,
  outgoing: number,
}

export interface DbEndpointTypeEventType {
  endpointTypeEventId: number,
  endpointTypeRef: number,
  endpointTypeClusterRef: number,
  eventRef: number,
  included: number,
}

export interface DbPackageExtensionValueType {
  packageExtensionValueId: number,
  packageExtensionRef: number,
  sessionRef: number,
  entityCode: number,
  parentCode: number,
  value: string,
}

export interface DbSettingType {
  category: string,
  key: string,
  value: string,
}
