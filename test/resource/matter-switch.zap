{
  "fileFormat": 1,
  "featureLevel": 96,
  "creator": "zap",
  "keyValuePairs": [
    "commandDiscovery = 1",
    "defaultResponsePolicy = always",
    "manufacturerCodes = 0x1002"
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
      "name": "Anonymous Endpoint Type",
      "deviceTypeName": "MA-genericswitch",
      "deviceTypeCode": 15,
      "deviceTypeProfileId": 259,
      "clusters": [
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => Identify",
            "0x0040 |        | client | 1 | 0 => TriggerEffect"
          ],
          "attributes": [
            "- | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                  0x0 | 1 | 1 | 65534 | 0 => IdentifyTime [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                  0x0 | 1 | 1 | 65534 | 0 => IdentifyType [enum8]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "- | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Descriptor",
          "code": "0x001d",
          "define": "DESCRIPTOR_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "- | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Descriptor",
          "code": "0x001d",
          "define": "DESCRIPTOR_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => DeviceTypeList [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ServerList [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ClientList [array]",
            "+ | 0x0003 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => PartsList [array]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "- | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binding",
          "code": "0x001e",
          "define": "BINDING_CLUSTER",
          "side": "client",
          "enabled": 1,
          "attributes": [
            "- | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binding",
          "code": "0x001e",
          "define": "BINDING_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => Binding [array]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "- | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Switch",
          "code": "0x003b",
          "define": "SWITCH_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "- | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Switch",
          "code": "0x003b",
          "define": "SWITCH_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => NumberOfPositions [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => CurrentPosition [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => MultiPressMax [int8u]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "- | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0001 |        | server => InitialPress",
            "+ | 0x0003 |        | server => ShortRelease",
            "+ | 0x0005 |        | server => MultiPressOngoing"
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
      "endpointVersion": 1,
      "deviceIdentifier": 15
    }
  ]
}