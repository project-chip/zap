{
  "featureLevel": 45,
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
      "version": "Matter Test Data",
      "type": "zcl-properties"
    },
    {
      "pathRelativity": "relativeToZap",
      "path": "meta/gen-test.json",
      "version": "meta-test",
      "type": "gen-templates-json"
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
              "incoming": 1,
              "outgoing": 1
            }
          ],
          "attributes": []
        },
        {
          "name": "Test 1",
          "code": 43981,
          "mfgCode": null,
          "define": "TEST_1",
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": [
            {
              "name": "at1",
              "code": 0,
              "mfgCode": null,
              "side": "server",
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "at2",
              "code": 1,
              "mfgCode": null,
              "side": "server",
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        }
      ]
    },
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
              "incoming": 1,
              "outgoing": 1
            }
          ],
          "attributes": []
        },
        {
          "name": "Test 1",
          "code": 43981,
          "mfgCode": null,
          "define": "TEST_1",
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": []
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