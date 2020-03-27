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
      networkId: {}
    },
    endpointTypeView: {
      selectedEndpointType: [],
      name: {},
      deviceTypeRef: {}
    },
    clustersView: {
      selected: [],
      selectedServers: [],
      selectedClients: []
    },
    attributeView: {
      selectedAttributes: [],
      selectedExternal: [],
      selectedFlash: [],
      selectedSingleton: [],
      selectedBounded: [],
      defaultValues: {}
    },
    commandView: {
      selectedIn: [],
      selectedOut: []
    },
    reportingView: {
      selectedReporting: [],
      reportingMin: {},
      reportingMax: {},
      reportableChange: {}
    }
  }
}
