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

/**
 * This module provides mappings between database columns and JS keys.
 *
 * @module DB API: DB types and enums.
 */
exports.packageType = {
  zclProperties: 'zcl-properties',
  zclXml: 'zcl-xml-child',
  zclXmlStandalone: 'zcl-xml-standalone',
  sqlSchema: 'sql-schema',
  genTemplatesJson: 'gen-templates-json',
  genSingleTemplate: 'gen-template',
  genHelper: 'gen-helper',
}

exports.packageOptionCategory = {
  manufacturerCodes: 'manufacturerCodes',
  typeMap: 'typeMap',
}

exports.side = {
  client: 'client',
  server: 'server',
}
exports.source = {
  client: 'client',
  server: 'server',
}

exports.storageOption = {
  ram: 'RAM',
  nvm: 'NVM',
  external: 'External',
}

exports.zclType = {
  struct: 'struct',
  enum: 'enum',
  bitmap: 'bitmap',
  atomic: 'atomic',
  unknown: 'unknown',
}
