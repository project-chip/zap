{
  "featureLevel": 96,
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
      "path": "meta/gen-test.json",
      "type": "gen-templates-json",
      "version": "meta-test"
    }
  ],
  "endpointTypes": [
    {
      "name": "Anonymous Endpoint Type",
      "deviceTypeName": "Custom ZCL Device Type",
      "deviceTypeCode": 65535,
      "deviceTypeProfileId": 65535,
      "clusters": [
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
              "incoming": 0,
              "outgoing": 1
            }
          ]
        },
        {
          "name": "Test 1",
          "code": 43981,
          "mfgCode": null,
          "define": "TEST_1",
          "side": "server",
          "enabled": 0,
          "attributes": [
            {
              "name": "at2",
              "code": 1,
              "mfgCode": null,
              "side": "server",
              "type": "int16u",
              "included": 0,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 1,
              "minInterval": 1,
              "maxInterval": 65534,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Test 2",
          "code": 43982,
          "mfgCode": null,
          "define": "TEST_2",
          "side": "client",
          "enabled": 0,
          "commands": [
            {
              "name": "TestCommand1",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 1
            }
          ]
        },
        {
          "name": "Test 2",
          "code": 43982,
          "mfgCode": null,
          "define": "TEST_2",
          "side": "server",
          "enabled": 1
        }
      ]
    },
    {
      "name": "Anonymous Endpoint Type",
      "deviceTypeName": "Custom ZCL Device Type",
      "deviceTypeCode": 65535,
      "deviceTypeProfileId": 65535,
      "clusters": []
    }
  ],
  "endpoints": [
    {
      "endpointTypeName": "Anonymous Endpoint Type",
      "endpointTypeIndex": 0,
      "profileId": 65535,
      "endpointId": 1,
      "networkId": 0,
      "endpointVersion": 1,
      "deviceIdentifier": 65535
    },
    {
      "endpointTypeName": "Anonymous Endpoint Type",
      "endpointTypeIndex": 1,
      "profileId": 65535,
      "endpointId": 2,
      "networkId": 0,
      "endpointVersion": 1,
      "deviceIdentifier": 65535
    }
  ],
  "log": []
}