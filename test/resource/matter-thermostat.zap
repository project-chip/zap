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
      "deviceTypeName": "MA-thermostat",
      "deviceTypeCode": 769,
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
          "name": "Thermostat",
          "code": "0x0201",
          "define": "THERMOSTAT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => SetpointRaiseLower"
          ],
          "attributes": [
            "- | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Thermostat",
          "code": "0x0201",
          "define": "THERMOSTAT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LocalTemperature [int16s]",
            "- | 0x0001 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => OutdoorTemperature [int16s]",
            "- | 0x0002 |        | server | RAM |           |       |                 0x01 | 1 | 1 | 65534 | 0 => Occupancy [bitmap8]",
            "- | 0x0003 |        | server | RAM |           |       |               0x02BC | 1 | 1 | 65534 | 0 => AbsMinHeatSetpointLimit [int16s]",
            "- | 0x0004 |        | server | RAM |           |       |               0x0BB8 | 1 | 1 | 65534 | 0 => AbsMaxHeatSetpointLimit [int16s]",
            "- | 0x0005 |        | server | RAM |           |       |               0x0640 | 1 | 1 | 65534 | 0 => AbsMinCoolSetpointLimit [int16s]",
            "- | 0x0006 |        | server | RAM |           |       |               0x0C80 | 1 | 1 | 65534 | 0 => AbsMaxCoolSetpointLimit [int16s]",
            "- | 0x0007 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => PICoolingDemand [int8u]",
            "- | 0x0008 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => PIHeatingDemand [int8u]",
            "- | 0x0009 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => HVACSystemTypeConfiguration [bitmap8]",
            "- | 0x0010 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => LocalTemperatureCalibration [int8s]",
            "+ | 0x0011 |        | server | RAM |           |       |               0x0A28 | 1 | 1 | 65534 | 0 => OccupiedCoolingSetpoint [int16s]",
            "+ | 0x0012 |        | server | RAM |           |       |               0x07D0 | 1 | 1 | 65534 | 0 => OccupiedHeatingSetpoint [int16s]",
            "- | 0x0013 |        | server | RAM |           |       |               0x0A28 | 1 | 1 | 65534 | 0 => UnoccupiedCoolingSetpoint [int16s]",
            "- | 0x0014 |        | server | RAM |           |       |               0x07D0 | 1 | 1 | 65534 | 0 => UnoccupiedHeatingSetpoint [int16s]",
            "- | 0x0015 |        | server | RAM |           |       |               0x02BC | 1 | 1 | 65534 | 0 => MinHeatSetpointLimit [int16s]",
            "- | 0x0016 |        | server | RAM |           |       |               0x0BB8 | 1 | 1 | 65534 | 0 => MaxHeatSetpointLimit [int16s]",
            "- | 0x0017 |        | server | RAM |           |       |               0x0640 | 1 | 1 | 65534 | 0 => MinCoolSetpointLimit [int16s]",
            "- | 0x0018 |        | server | RAM |           |       |               0x0C80 | 1 | 1 | 65534 | 0 => MaxCoolSetpointLimit [int16s]",
            "- | 0x0019 |        | server | RAM |           |       |                 0x19 | 1 | 1 | 65534 | 0 => MinSetpointDeadBand [int8s]",
            "- | 0x001a |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => RemoteSensing [bitmap8]",
            "+ | 0x001b |        | server | RAM |           |       |                 0x04 | 1 | 1 | 65534 | 0 => ControlSequenceOfOperation [ThermostatControlSequence]",
            "+ | 0x001c |        | server | RAM |           |       |                 0x01 | 1 | 1 | 65534 | 0 => SystemMode [enum8]",
            "- | 0x001e |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => ThermostatRunningMode [enum8]",
            "- | 0x0020 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => StartOfWeek [enum8]",
            "- | 0x0021 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => NumberOfWeeklyTransitions [int8u]",
            "- | 0x0022 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => NumberOfDailyTransitions [int8u]",
            "- | 0x0023 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => TemperatureSetpointHold [enum8]",
            "- | 0x0024 |        | server | RAM |           |       |               0xFFFF | 1 | 1 | 65534 | 0 => TemperatureSetpointHoldDuration [int16u]",
            "- | 0x0025 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => ThermostatProgrammingOperationMode [bitmap8]",
            "- | 0x0029 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => ThermostatRunningState [bitmap16]",
            "- | 0x0030 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => SetpointChangeSource [enum8]",
            "- | 0x0031 |        | server | RAM |           |       |               0x8000 | 1 | 1 | 65534 | 0 => SetpointChangeAmount [int16s]",
            "- | 0x0032 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => SetpointChangeSourceTimestamp [epoch_s]",
            "- | 0x0040 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => ACType [enum8]",
            "- | 0x0041 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => ACCapacity [int16u]",
            "- | 0x0042 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => ACRefrigerantType [enum8]",
            "- | 0x0043 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => ACCompressorType [enum8]",
            "- | 0x0044 |        | server | RAM |           |       |           0x00000000 | 1 | 1 | 65534 | 0 => ACErrorCode [bitmap32]",
            "- | 0x0045 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => ACLouverPosition [enum8]",
            "- | 0x0046 |        | server | RAM |           |       |               0x8000 | 1 | 1 | 65534 | 0 => ACCoilTemperature [int16s]",
            "- | 0x0047 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => ACCapacityformat [enum8]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "- | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
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
      "deviceIdentifier": 769
    }
  ]
}