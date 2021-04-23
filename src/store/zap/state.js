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
    leftDrawerOpenState: true,
    miniState: false,
    informationText: '',
    clusters: [],
    domains: [],
    attributes: [],
    commands: [],
    zclDeviceTypes: {},
    endpoints: [],
    genericOptions: {},
    selectedGenericOptions: {},
    projectPackages: [],
    clusterManager: {
      openDomains: {},
      filter: {
        label: 'No Filter',
        domainFilterFn: (domain, currentOpenDomains, context) =>
          currentOpenDomains[domain],
      },
      filterOptions: [
        {
          label: 'No Filter',
          domainFilterFn: (domain, currentOpenDomains, context) =>
            currentOpenDomains[domain],
        },
        {
          label: 'All Clusters',
          domainFilterFn: (domain, currentOpenDomains, context) => true,
        },
        {
          label: 'Only Enabled',
          domainFilterFn: (domain, currentOpenDomains, context) =>
            context.enabledClusters.map((a) => a.domainName).includes(domain),
          clusterFilterFn: (cluster, context) =>
            context.enabledClusters.find((a) => cluster.id == a.id) !=
            undefined,
        },
        {
          label: 'Close All',
          domainFilterFn: (domain, currentOpenDomains, context) => false,
        },
      ],
      filterString: '',
    },
    endpointView: {
      selectedEndpoint: [],
      endpointId: {},
      endpointType: {},
      networkId: {},
      endpointVersion: {},
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
      editableAttributesReporting: {},
      selectedSingleton: [],
      selectedBounded: [],
      defaultValue: {},
      storageOption: {},
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
    calledArgs: {
      defaultUiMode: restApi.uiMode.ZIGBEE,
    },
    debugNavBar: false, // default visibility mode for debug navigation bar
    studio: {
      projectInfoJson: [], // HTTP response from Studio jetty server
      ucComponents: [],
      selectedUcComponents: [], // [] of 'studio..' prefixed Studio internal component ids
      selectedUcComponentIds: [], // [] of 'zigbee_' prefixed component ids
      // a list of dict: { "clusterCode": "$zcl_cluster-$zcl_role", "value": ["$uc_component_id"] }
      zclSdkExtClusterToUcComponentMap: [],
    },
  }
}
