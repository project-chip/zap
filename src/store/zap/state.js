export default function () {
  return {
    informationText: 'Use this as a placeholder for information.',
    clusters: [],
    attributes: [],
    commands: [],
    zclDeviceTypes: {},
    endpoints: [],
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
      selectedExternal: [],
      selectedFlash: [],
      selectedSingleton: [],
      selectedBounded: [],
      defaultValues: {},
      // These are based off of the selected ZCL Endpoint Device Type
      recommendedAttributes: [],
      defaultValueValidationIssues: {},
    },
    commandView: {
      selectedIn: [],
      selectedOut: [],
      // These are based off of the selected ZCL Endpoint Device Type
      requiredCommands: [],
    },
    reportingView: {
      selectedReporting: [],
      reportingMin: {},
      reportingMax: {},
      reportableChange: {},
    },
  }
}
