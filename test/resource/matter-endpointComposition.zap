{
  "fileFormat": 2,
  "featureLevel": 103,
  "creator": "zap",
  "keyValuePairs": [
    {
      "key": "commandDiscovery",
      "value": "1"
    },
    {
      "key": "defaultResponsePolicy",
      "value": "always"
    },
    {
      "key": "manufacturerCodes",
      "value": "0x1002"
    }
  ],
  "package": [
    {
      "pathRelativity": "relativeToZap",
      "path": "../../zcl-builtin/matter/zcl.json",
      "type": "zcl-properties",
      "category": "matter",
      "version": 1,
      "description": "Matter SDK ZCL data"
    },
    {
      "pathRelativity": "relativeToZap",
      "path": "../gen-template/matter/gen-test.json",
      "type": "gen-templates-json",
      "category": "matter",
      "version": "test-matter"
    }
  ],
  "endpointTypes": [
    {
      "id": 1,
      "name": "Anonymous Endpoint Type",
      "deviceTypeRef": {
        "code": 112,
        "profileId": 259,
        "label": "MA-refrigerator",
        "name": "MA-refrigerator"
      },
      "deviceTypes": [
        {
          "code": 112,
          "profileId": 259,
          "label": "MA-refrigerator",
          "name": "MA-refrigerator"
        }
      ],
      "deviceVersions": [
        1
      ],
      "deviceIdentifiers": [
        112
      ],
      "deviceTypeName": "MA-refrigerator",
      "deviceTypeCode": 112,
      "deviceTypeProfileId": 259,
      "clusters": [
        {
          "name": "Descriptor",
          "code": 29,
          "mfgCode": null,
          "define": "DESCRIPTOR_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            {
              "name": "DeviceTypeList",
              "code": 0,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "ServerList",
              "code": 1,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "ClientList",
              "code": 2,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "PartsList",
              "code": 3,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "GeneratedCommandList",
              "code": 65528,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "AcceptedCommandList",
              "code": 65529,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "EventList",
              "code": 65530,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "AttributeList",
              "code": 65531,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "FeatureMap",
              "code": 65532,
              "mfgCode": null,
              "side": "server",
              "type": "bitmap32",
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "ClusterRevision",
              "code": 65533,
              "mfgCode": null,
              "side": "server",
              "type": "int16u",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": null,
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            }
          ]
        }
      ]
    },
    {
      "id": 2,
      "name": "Anonymous Endpoint Type",
      "deviceTypeRef": {
        "code": 113,
        "profileId": 259,
        "label": "MA-temperature-controlled-cabinet",
        "name": "MA-temperature-controlled-cabinet"
      },
      "deviceTypes": [
        {
          "code": 113,
          "profileId": 259,
          "label": "MA-temperature-controlled-cabinet",
          "name": "MA-temperature-controlled-cabinet"
        }
      ],
      "deviceVersions": [
        1
      ],
      "deviceIdentifiers": [
        113
      ],
      "deviceTypeName": "MA-temperature-controlled-cabinet",
      "deviceTypeCode": 113,
      "deviceTypeProfileId": 259,
      "clusters": [
        {
          "name": "Descriptor",
          "code": 29,
          "mfgCode": null,
          "define": "DESCRIPTOR_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            {
              "name": "DeviceTypeList",
              "code": 0,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "ServerList",
              "code": 1,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "ClientList",
              "code": 2,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "PartsList",
              "code": 3,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "GeneratedCommandList",
              "code": 65528,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "AcceptedCommandList",
              "code": 65529,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "EventList",
              "code": 65530,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "AttributeList",
              "code": 65531,
              "mfgCode": null,
              "side": "server",
              "type": "array",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "FeatureMap",
              "code": 65532,
              "mfgCode": null,
              "side": "server",
              "type": "bitmap32",
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            },
            {
              "name": "ClusterRevision",
              "code": 65533,
              "mfgCode": null,
              "side": "server",
              "type": "int16u",
              "included": 1,
              "storageOption": "External",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            }
          ]
        }
      ]
    }
  ],
  "endpoints": [
    {
      "endpointTypeName": "Anonymous Endpoint Type",
      "endpointTypeIndex": 0,
      "profileId": 259,
      "endpointId": 1,
      "networkId": 0,
      "parentEndpointIdentifier": null
    },
    {
      "endpointTypeName": "Anonymous Endpoint Type",
      "endpointTypeIndex": 1,
      "profileId": 259,
      "endpointId": 2,
      "networkId": 0,
      "parentEndpointIdentifier": 1
    }
  ]
}