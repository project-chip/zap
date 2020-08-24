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
const restApi = require('../../../src-shared/rest-api.js')

export default function () {
  return {
    studioProject: '',
    leftDrawerOpenState: true,
    miniState: false,
    informationText: 'Use this as a placeholder for information.',
    clusters: [],
    attributes: [],
    commands: [],
    zclDeviceTypes: {},
    endpoints: [],
    genericOptions: {},
    selectedGenericOptions: {},
    endpointView: {
      selectedEndpoint: [],
      endpointId: {},
      endpointType: {},
      networkId: {},
      endpointIdValidationIssues: {},
      networkIdValidationIssues: {},
    },
    endpointTypeView: {
      selectedEndpointType: [],
      name: {},
      deviceTypeRef: {},
    },
    clustersView: {
      selected: [],
      selectedServers: [],
      selectedClients: [],
      // These are based off of the selected ZCL Endpoints Device Type
      recommendedClients: [],
      recommendedServers: [],
    },
    attributeView: {
      selectedAttributes: [],
      editableAttributes: {},
      selectedExternal: [],
      selectedFlash: [],
      selectedSingleton: [],
      selectedBounded: [],
      defaultValues: {},
      // These are based off of the selected ZCL Endpoint Device Type
      recommendedAttributes: [],
      defaultValueValidationIssues: {},
      selectedReporting: [],
      reportingMin: {},
      reportingMax: {},
      reportableChange: {},
    },
    commandView: {
      selectedIn: [],
      selectedOut: [],
      // These are based off of the selected ZCL Endpoint Device Type
      requiredCommands: [],
    },
    calledArgs: { defaultUiMode: restApi.uiMode.OLD },
  }
}
