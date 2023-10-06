{
  "fileFormat": 2,
  "featureLevel": 98,
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
      "path": "meta/zcl.json",
      "type": "zcl-properties",
      "version": 1,
      "description": "Unit Test Meta-data"
    },
    {
      "pathRelativity": "relativeToZap",
      "path": "../gen-template/zigbee/gen-templates.json",
      "type": "gen-templates-json",
      "category": "zigbee",
      "version": "test-v1"
    }
  ],
  "endpointTypes": [
    {
      "id": 1,
      "name": "Anonymous Endpoint Type",
      "deviceTypeRef": {
        "code": 65535,
        "profileId": 65535,
        "label": "Custom ZCL Device Type",
        "name": "Custom ZCL Device Type"
      },
      "deviceTypes": [
        {
          "code": 65535,
          "profileId": 65535,
          "label": "Custom ZCL Device Type",
          "name": "Custom ZCL Device Type"
        }
      ],
      "deviceVersions": [
        1
      ],
      "deviceIdentifiers": [
        65535
      ],
      "deviceTypeName": "Custom ZCL Device Type",
      "deviceTypeCode": 65535,
      "deviceTypeProfileId": 65535,
      "clusters": [
        {
          "name": "Api Maturity Test",
          "code": 4386,
          "mfgCode": null,
          "define": "API_MATURITY_TEST",
          "side": "client",
          "enabled": 1,
          "apiMaturity": "internal",
          "commands": [
            {
              "name": "StableCommand",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "isIncoming": 0,
              "isEnabled": 1
            },
            {
              "name": "StableCommandResponse",
              "code": 1,
              "mfgCode": null,
              "source": "server",
              "isIncoming": 1,
              "isEnabled": 1
            }
          ]
        },
        {
          "name": "Api Maturity Test",
          "code": 4386,
          "mfgCode": null,
          "define": "API_MATURITY_TEST",
          "side": "server",
          "enabled": 1,
          "apiMaturity": "internal",
          "commands": [
            {
              "name": "StableCommand",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "isIncoming": 1,
              "isEnabled": 1
            },
            {
              "name": "StableCommandResponse",
              "code": 1,
              "mfgCode": null,
              "source": "server",
              "isIncoming": 0,
              "isEnabled": 1
            }
          ]
        },
        {
          "name": "Test 1",
          "code": 43981,
          "mfgCode": null,
          "define": "TEST_1",
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "TestCommand1",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "isIncoming": 0,
              "isEnabled": 1
            }
          ]
        },
        {
          "name": "Test 2",
          "code": 43982,
          "mfgCode": null,
          "define": "TEST_2",
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "TestCommand1",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "isIncoming": 1,
              "isEnabled": 1
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
      "profileId": 65535,
      "endpointId": 1,
      "networkId": 0
    }
  ],
  "log": []
}