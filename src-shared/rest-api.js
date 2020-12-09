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

const uri = {
  zclEntity: '/zcl/:entity/:id',
  saveSessionKeyValue: '/save',
  getAllSessionKeyValues: '/allKeyValues',
  generate: '/generate',
  endpoint: '/endpoint',
  endpointType: '/endpointType',
  initialState: '/initialState',
  option: '/option',
  commandUpdate: '/command/update',
  cluster: '/cluster',
  attributeUpdate: '/attribute/update',
  preview: '/preview/',
  previewName: '/preview/:name',
  previewNameIndex: '/preview/:name/:index',
  sql: '/sql',
  packages: `/packages`,
  addNewPackage: `/packages/add`,
  sessionPackage: `/sessionPackage`,
}

const uiMode = {
  ZIGBEE: `zigbee`,
}

const httpCode = {
  ok: 200,
  badRequest: 400,
  notFound: 404,
  isSuccess: (code) => {
    return code >= 200 && code < 300
  },
}

const uc = {
  // command id
  componentTree: '/uc/component/tree',
  componentAdd: '/uc/component/add',
  componentRemove: '/uc/component/remove',
}

const ide = {
  // request
  open: '/file/open',
  close: '/file/close',
  save: '/file/save',
  saveAs: '/file/saveAs',
  rename: '/file/rename',
  move: '/file/move',
  isDirty: '/file/isDirty',

  // response
  openResponse: 'openResponse',
}

const updateKey = {
  deviceTypeRef: 'deviceTypeRef',
  endpointId: 'endpointId',
  endpointType: 'endpointType',
  networkId: 'networkId',
  name: 'name',
  attributeSelected: 'selectedAttributes',
  attributeSingleton: 'selectedSingleton',
  attributeBounded: 'selectedBounded',
  attributeDefault: 'defaultValue',
  attributeReporting: 'selectedReporting',
  attributeReportMin: 'reportingMin',
  attributeReportMax: 'reportingMax',
  attributeReportChange: 'reportableChange',
  attributeStorage: 'storageOption',
}

exports.uri = uri
exports.httpCode = httpCode
exports.uiMode = uiMode
exports.uc = uc
exports.ide = ide
exports.updateKey = updateKey
