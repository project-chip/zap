{
  "fileFormat": 1,
  "featureLevel": 99999,
  "creator": "zap",
  "keyValuePairs": [
    "commandDiscovery = 1",
    "defaultResponsePolicy = always",
    "manufacturerCodes = 0x1002"
  ],
  "package": [
    {
      "pathRelativity": "relativeToZap",
      "path": "../../../zcl-builtin/silabs/zcl.json",
      "type": "zcl-properties",
      "category": "zigbee",
      "version": 1,
      "description": "ZigbeePro test data"
    }
  ],
  "endpointTypes": [
    {
      "name": "Endpoint Type A",
      "deviceTypeName": "TA-billingunit",
      "deviceTypeCode": 515,
      "deviceTypeProfileId": 263,
      "clusters": [
        {
          "name": "Basic",
          "code": "0x0000",
          "define": "BASIC_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x08 | 0 | 0 | 65534 | 0 => ZCL version [int8u]",
            "+ | 0x0004 |        | server | NVM |           |       |    Test manufacturer | 0 | 0 | 65534 | 0 => manufacturer name [char_string]",
            "+ | 0x0005 |        | server | NVM |           |       | Test model identifier | 0 | 0 | 65534 | 0 => model identifier [char_string]",
            "+ | 0x0006 |        | server | NVM |           |       |       Test date code | 0 | 0 | 65534 | 0 => date code [char_string]",
            "+ | 0x0007 |        | server | RAM |           |       |                 0x00 | 0 | 0 | 65534 | 0 => power source [enum8]"
          ]
        },
        {
          "name": "Information",
          "code": "0x0900",
          "define": "INFORMATION_CLUSTER",
          "side": "client",
          "enabled": 1,
          "commands": [
            "0x0000 |        | client | 1 | 1 => RequestInformation",
            "0x0001 |        | client | 1 | 1 => PushInformationResponse"
          ]
        },
        {
          "name": "Information",
          "code": "0x0900",
          "define": "INFORMATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 1 | 1 => RequestInformationResponse",
            "0x0001 |        | server | 1 | 1 => PushInformation"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 0 | 0 | 65534 | 0 => node description [char_string]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 0 | 0 | 65534 | 0 => delivery enable [boolean]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 0 | 0 | 65534 | 0 => enable secure configuration [boolean]"
          ]
        }
      ]
    }
  ],
  "endpoints": [
    {
      "endpointTypeName": "Endpoint Type A",
      "endpointTypeIndex": 0,
      "profileId": 263,
      "endpointId": 41,
      "networkId": 1,
      "endpointVersion": 1,
      "deviceIdentifier": null
    }
  ],
  "log": []
}
