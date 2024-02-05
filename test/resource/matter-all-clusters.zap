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
      "name": "MA-rootdevice",
      "deviceTypeName": "MA-rootdevice",
      "deviceTypeCode": 22,
      "deviceTypeProfileId": 259,
      "clusters": [
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Identify",
            "0x0040 |        | client | 1 | 0 => TriggerEffect"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => IdentifyTime [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                  0x0 | 1 | 0 | 65344 | 0 => IdentifyType [enum8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => AddGroup",
            "0x0001 |        | client | 1 | 1 => ViewGroup",
            "0x0002 |        | client | 1 | 1 => GetGroupMembership",
            "0x0003 |        | client | 1 | 1 => RemoveGroup",
            "0x0004 |        | client | 1 | 1 => RemoveAllGroups",
            "0x0005 |        | client | 1 | 1 => AddGroupIfIdentifying"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 1 | 1 => AddGroupResponse",
            "0x0001 |        | server | 1 | 1 => ViewGroupResponse",
            "0x0002 |        | server | 1 | 1 => GetGroupMembershipResponse",
            "0x0003 |        | server | 1 | 1 => RemoveGroupResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NameSupport [bitmap8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => AddScene",
            "0x0001 |        | client | 1 | 1 => ViewScene",
            "0x0002 |        | client | 1 | 1 => RemoveScene",
            "0x0003 |        | client | 1 | 1 => RemoveAllScenes",
            "0x0004 |        | client | 1 | 1 => StoreScene",
            "0x0005 |        | client | 1 | 1 => RecallScene",
            "0x0006 |        | client | 1 | 1 => GetSceneMembership"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "server",
          "enabled": 0,
          "commands": [
            "0x0000 |        | server | 1 | 1 => AddSceneResponse",
            "0x0001 |        | server | 1 | 1 => ViewSceneResponse",
            "0x0002 |        | server | 1 | 1 => RemoveSceneResponse",
            "0x0003 |        | server | 1 | 1 => RemoveAllScenesResponse",
            "0x0004 |        | server | 1 | 1 => StoreSceneResponse",
            "0x0006 |        | server | 1 | 1 => GetSceneMembershipResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SceneCount [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentScene [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => CurrentGroup [group_id]",
            "+ | 0x0003 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SceneValid [boolean]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NameSupport [bitmap8]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Off",
            "0x0001 |        | client | 1 | 1 => On",
            "0x0002 |        | client | 1 | 1 => Toggle"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => OnOff [boolean]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => MoveToLevel",
            "0x0001 |        | client | 1 | 1 => Move",
            "0x0002 |        | client | 1 | 1 => Step",
            "0x0003 |        | client | 1 | 1 => Stop",
            "0x0004 |        | client | 1 | 1 => MoveToLevelWithOnOff",
            "0x0005 |        | client | 1 | 1 => MoveWithOnOff",
            "0x0006 |        | client | 1 | 1 => StepWithOnOff",
            "0x0007 |        | client | 1 | 1 => StopWithOnOff"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentLevel [int8u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Descriptor",
          "code": "0x001d",
          "define": "DESCRIPTOR_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Descriptor",
          "code": "0x001d",
          "define": "DESCRIPTOR_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => DeviceTypeList [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ServerList [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ClientList [array]",
            "+ | 0x0003 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => PartsList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | Ext |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binding",
          "code": "0x001e",
          "define": "BINDING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binding",
          "code": "0x001e",
          "define": "BINDING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => Binding [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Access Control",
          "code": "0x001f",
          "define": "ACCESS_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Access Control",
          "code": "0x001f",
          "define": "ACCESS_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65534 | 0 => ACL [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65534 | 0 => Extension [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                    4 | 1 | 1 | 65534 | 0 => SubjectsPerAccessControlEntry [int16u]",
            "+ | 0x0003 |        | server | Ext |           |       |                    3 | 1 | 1 | 65534 | 0 => TargetsPerAccessControlEntry [int16u]",
            "+ | 0x0004 |        | server | Ext |           |       |                    4 | 1 | 1 | 65534 | 0 => AccessControlEntriesPerFabric [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | Ext |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => AccessControlEntryChanged",
            "+ | 0x0001 |        | server => AccessControlExtensionChanged"
          ]
        },
        {
          "name": "Basic Information",
          "code": "0x0028",
          "define": "BASIC_INFORMATION_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Basic Information",
          "code": "0x0028",
          "define": "BASIC_INFORMATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext | singleton |       |                   10 | 1 | 0 | 65344 | 0 => DataModelRevision [int16u]",
            "+ | 0x0001 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => VendorName [char_string]",
            "+ | 0x0002 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => VendorID [vendor_id]",
            "+ | 0x0003 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductName [char_string]",
            "+ | 0x0004 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductID [int16u]",
            "+ | 0x0005 |        | server | NVM | singleton |       |                      | 1 | 0 | 65344 | 0 => NodeLabel [char_string]",
            "+ | 0x0006 |        | server | Ext | singleton |       |                   XX | 1 | 0 | 65344 | 0 => Location [char_string]",
            "+ | 0x0007 |        | server | Ext | singleton |       |                    0 | 1 | 0 | 65344 | 0 => HardwareVersion [int16u]",
            "+ | 0x0008 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => HardwareVersionString [char_string]",
            "+ | 0x0009 |        | server | Ext | singleton |       |                    0 | 1 | 0 | 65344 | 0 => SoftwareVersion [int32u]",
            "+ | 0x000a |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => SoftwareVersionString [char_string]",
            "+ | 0x000b |        | server | Ext | singleton |       |     20210614123456ZZ | 1 | 0 | 65344 | 0 => ManufacturingDate [char_string]",
            "+ | 0x000c |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => PartNumber [char_string]",
            "+ | 0x000d |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductURL [long_char_string]",
            "+ | 0x000e |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductLabel [char_string]",
            "+ | 0x000f |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => SerialNumber [char_string]",
            "+ | 0x0010 |        | server | NVM | singleton |       |                    0 | 1 | 0 | 65344 | 0 => LocalConfigDisabled [boolean]",
            "+ | 0x0011 |        | server | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => Reachable [boolean]",
            "+ | 0x0012 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => UniqueID [char_string]",
            "+ | 0x0013 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => CapabilityMinima [CapabilityMinimaStruct]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => StartUp",
            "+ | 0x0001 |        | server => ShutDown",
            "+ | 0x0002 |        | server => Leave"
          ]
        },
        {
          "name": "OTA Software Update Provider",
          "code": "0x0029",
          "define": "OTA_SOFTWARE_UPDATE_PROVIDER_CLUSTER",
          "side": "client",
          "enabled": 1,
          "commands": [
            "0x0000 |        | client | 0 | 1 => QueryImage",
            "0x0002 |        | client | 0 | 1 => ApplyUpdateRequest",
            "0x0004 |        | client | 0 | 1 => NotifyUpdateApplied"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "OTA Software Update Provider",
          "code": "0x0029",
          "define": "OTA_SOFTWARE_UPDATE_PROVIDER_CLUSTER",
          "side": "server",
          "enabled": 0,
          "commands": [
            "0x0001 |        | server | 0 | 1 => QueryImageResponse",
            "0x0003 |        | server | 1 | 1 => ApplyUpdateResponse"
          ],
          "attributes": [
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "- | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "OTA Software Update Requestor",
          "code": "0x002a",
          "define": "OTA_SOFTWARE_UPDATE_REQUESTOR_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => AnnounceOTAProvider"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "OTA Software Update Requestor",
          "code": "0x002a",
          "define": "OTA_SOFTWARE_UPDATE_REQUESTOR_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => DefaultOTAProviders [array]",
            "+ | 0x0001 |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => UpdatePossible [boolean]",
            "+ | 0x0002 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => UpdateState [OTAUpdateStateEnum]",
            "+ | 0x0003 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => UpdateStateProgress [int8u]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => StateTransition",
            "+ | 0x0001 |        | server => VersionApplied",
            "+ | 0x0002 |        | server => DownloadError"
          ]
        },
        {
          "name": "Localization Configuration",
          "code": "0x002b",
          "define": "LOCALIZATION_CONFIGURATION_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Localization Configuration",
          "code": "0x002b",
          "define": "LOCALIZATION_CONFIGURATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | NVM |           |       |                en-US | 1 | 1 | 65534 | 0 => ActiveLocale [char_string]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => SupportedLocales [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Time Format Localization",
          "code": "0x002c",
          "define": "TIME_FORMAT_LOCALIZATION_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Time Format Localization",
          "code": "0x002c",
          "define": "TIME_FORMAT_LOCALIZATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | NVM |           |       |                    0 | 1 | 1 | 65534 | 0 => HourFormat [HourFormat]",
            "+ | 0x0001 |        | server | NVM |           |       |                    0 | 1 | 1 | 65534 | 0 => ActiveCalendarType [CalendarType]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => SupportedCalendarTypes [array]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Unit Localization",
          "code": "0x002d",
          "define": "UNIT_LOCALIZATION_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Unit Localization",
          "code": "0x002d",
          "define": "UNIT_LOCALIZATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | NVM |           |       |                    0 | 1 | 1 | 65534 | 0 => TemperatureUnit [TempUnitEnum]",
            "+ | 0xfffc |        | server | RAM |           |       |                  0x1 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Power Source Configuration",
          "code": "0x002e",
          "define": "POWER_SOURCE_CONFIGURATION_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Power Source Configuration",
          "code": "0x002e",
          "define": "POWER_SOURCE_CONFIGURATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => Sources [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Power Source",
          "code": "0x002f",
          "define": "POWER_SOURCE_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Power Source",
          "code": "0x002f",
          "define": "POWER_SOURCE_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => Status [PowerSourceStatusEnum]",
            "+ | 0x0001 |        | server | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => Order [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |                   B1 | 1 | 1 | 65534 | 0 => Description [char_string]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedInputVoltage [int32u]",
            "- | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedInputFrequency [int16u]",
            "- | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredCurrentType [WiredCurrentTypeEnum]",
            "- | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedCurrent [int32u]",
            "- | 0x0007 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredNominalVoltage [int32u]",
            "- | 0x0008 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredMaximumCurrent [int32u]",
            "- | 0x0009 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredPresent [boolean]",
            "- | 0x000a |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveWiredFaults [array]",
            "- | 0x000b |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatVoltage [int32u]",
            "- | 0x000c |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatPercentRemaining [int8u]",
            "- | 0x000d |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatTimeRemaining [int32u]",
            "+ | 0x000e |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => BatChargeLevel [BatChargeLevelEnum]",
            "+ | 0x000f |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplacementNeeded [boolean]",
            "+ | 0x0010 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplaceability [BatReplaceabilityEnum]",
            "- | 0x0011 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatPresent [boolean]",
            "- | 0x0012 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveBatFaults [array]",
            "- | 0x0013 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplacementDescription [char_string]",
            "- | 0x0014 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatCommonDesignation [BatCommonDesignationEnum]",
            "- | 0x0015 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatANSIDesignation [char_string]",
            "- | 0x0016 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatIECDesignation [char_string]",
            "- | 0x0017 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatApprovedChemistry [BatApprovedChemistryEnum]",
            "- | 0x0018 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatCapacity [int32u]",
            "- | 0x0019 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatQuantity [int8u]",
            "- | 0x001a |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatChargeState [BatChargeStateEnum]",
            "- | 0x001b |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatTimeToFullCharge [int32u]",
            "- | 0x001c |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatFunctionalWhileCharging [boolean]",
            "- | 0x001d |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatChargingCurrent [int32u]",
            "- | 0x001e |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveBatChargeFaults [array]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "General Commissioning",
          "code": "0x0030",
          "define": "GENERAL_COMMISSIONING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => ArmFailSafe",
            "0x0002 |        | client | 1 | 1 => SetRegulatoryConfig",
            "0x0004 |        | client | 1 | 0 => CommissioningComplete"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "General Commissioning",
          "code": "0x0030",
          "define": "GENERAL_COMMISSIONING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0001 |        | server | 1 | 1 => ArmFailSafeResponse",
            "0x0003 |        | server | 1 | 1 => SetRegulatoryConfigResponse",
            "0x0005 |        | server | 0 | 1 => CommissioningCompleteResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => Breadcrumb [int64u]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => BasicCommissioningInfo [BasicCommissioningInfo]",
            "+ | 0x0002 |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => RegulatoryConfig [RegulatoryLocationType]",
            "+ | 0x0003 |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => LocationCapability [RegulatoryLocationType]",
            "+ | 0x0004 |        | server | Ext |           |       |                    1 | 1 | 1 | 65534 | 0 => SupportsConcurrentConnection [boolean]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Network Commissioning",
          "code": "0x0031",
          "define": "NETWORK_COMMISSIONING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => ScanNetworks",
            "0x0002 |        | client | 1 | 1 => AddOrUpdateWiFiNetwork",
            "0x0003 |        | client | 1 | 1 => AddOrUpdateThreadNetwork",
            "0x0004 |        | client | 1 | 1 => RemoveNetwork",
            "0x0006 |        | client | 1 | 1 => ConnectNetwork",
            "0x0008 |        | client | 1 | 1 => ReorderNetwork"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Network Commissioning",
          "code": "0x0031",
          "define": "NETWORK_COMMISSIONING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0001 |        | server | 1 | 1 => ScanNetworksResponse",
            "0x0005 |        | server | 1 | 1 => NetworkConfigResponse",
            "0x0007 |        | server | 1 | 1 => ConnectNetworkResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxNetworks [int8u]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => Networks [array]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => ScanMaxTimeSeconds [int8u]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => ConnectMaxTimeSeconds [int8u]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => InterfaceEnabled [boolean]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LastNetworkingStatus [NetworkCommissioningStatus]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LastNetworkID [octet_string]",
            "+ | 0x0007 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LastConnectErrorValue [int32s]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Diagnostic Logs",
          "code": "0x0032",
          "define": "DIAGNOSTIC_LOGS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | client | 1 | 0 => RetrieveLogsRequest"
          ],
          "attributes": [
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "General Diagnostics",
          "code": "0x0033",
          "define": "GENERAL_DIAGNOSTICS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "General Diagnostics",
          "code": "0x0033",
          "define": "GENERAL_DIAGNOSTICS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | client | 1 | 0 => TestEventTrigger"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => NetworkInterfaces [array]",
            "+ | 0x0001 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RebootCount [int16u]",
            "+ | 0x0002 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 1 | 65534 | 0 => UpTime [int64u]",
            "+ | 0x0003 |        | server | Ext |           |       |           0x00000000 | 1 | 1 | 65534 | 0 => TotalOperationalHours [int32u]",
            "+ | 0x0004 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => BootReason [BootReasonEnum]",
            "+ | 0x0005 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveHardwareFaults [array]",
            "+ | 0x0006 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveRadioFaults [array]",
            "+ | 0x0007 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveNetworkFaults [array]",
            "+ | 0x0008 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => TestEventTriggersEnabled [boolean]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => HardwareFaultChange",
            "+ | 0x0001 |        | server => RadioFaultChange",
            "+ | 0x0002 |        | server => NetworkFaultChange",
            "+ | 0x0003 |        | server => BootReason"
          ]
        },
        {
          "name": "Software Diagnostics",
          "code": "0x0034",
          "define": "SOFTWARE_DIAGNOSTICS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => ResetWatermarks"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Software Diagnostics",
          "code": "0x0034",
          "define": "SOFTWARE_DIAGNOSTICS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ThreadMetrics [array]",
            "+ | 0x0001 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 1 | 65534 | 0 => CurrentHeapFree [int64u]",
            "+ | 0x0002 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 1 | 65534 | 0 => CurrentHeapUsed [int64u]",
            "+ | 0x0003 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => CurrentHeapHighWatermark [int64u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => SoftwareFault"
          ]
        },
        {
          "name": "Thread Network Diagnostics",
          "code": "0x0035",
          "define": "THREAD_NETWORK_DIAGNOSTICS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => ResetCounts"
          ]
        },
        {
          "name": "Thread Network Diagnostics",
          "code": "0x0035",
          "define": "THREAD_NETWORK_DIAGNOSTICS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => Channel [int16u]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => RoutingRole [RoutingRole]",
            "+ | 0x0002 |        | server | Ext |           |       |                    0 | 1 | 0 | 65344 | 0 => NetworkName [char_string]",
            "+ | 0x0003 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => PanId [int16u]",
            "+ | 0x0004 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => ExtendedPanId [int64u]",
            "+ | 0x0005 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => MeshLocalPrefix [octet_string]",
            "+ | 0x0006 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => OverrunCount [int64u]",
            "+ | 0x0007 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => NeighborTable [array]",
            "+ | 0x0008 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => RouteTable [array]",
            "+ | 0x0009 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => PartitionId [int32u]",
            "+ | 0x000a |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => Weighting [int8u]",
            "+ | 0x000b |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => DataVersion [int8u]",
            "+ | 0x000c |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => StableDataVersion [int8u]",
            "+ | 0x000d |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => LeaderRouterId [int8u]",
            "+ | 0x000e |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => DetachedRoleCount [int16u]",
            "+ | 0x000f |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ChildRoleCount [int16u]",
            "+ | 0x0010 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RouterRoleCount [int16u]",
            "+ | 0x0011 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => LeaderRoleCount [int16u]",
            "+ | 0x0012 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => AttachAttemptCount [int16u]",
            "+ | 0x0013 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => PartitionIdChangeCount [int16u]",
            "+ | 0x0014 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => BetterPartitionAttachAttemptCount [int16u]",
            "+ | 0x0015 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ParentChangeCount [int16u]",
            "+ | 0x0016 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxTotalCount [int32u]",
            "+ | 0x0017 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxUnicastCount [int32u]",
            "+ | 0x0018 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxBroadcastCount [int32u]",
            "+ | 0x0019 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxAckRequestedCount [int32u]",
            "+ | 0x001a |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxAckedCount [int32u]",
            "+ | 0x001b |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxNoAckRequestedCount [int32u]",
            "+ | 0x001c |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxDataCount [int32u]",
            "+ | 0x001d |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxDataPollCount [int32u]",
            "+ | 0x001e |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxBeaconCount [int32u]",
            "+ | 0x001f |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxBeaconRequestCount [int32u]",
            "+ | 0x0020 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxOtherCount [int32u]",
            "+ | 0x0021 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxRetryCount [int32u]",
            "+ | 0x0022 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxDirectMaxRetryExpiryCount [int32u]",
            "+ | 0x0023 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxIndirectMaxRetryExpiryCount [int32u]",
            "+ | 0x0024 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxErrCcaCount [int32u]",
            "+ | 0x0025 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxErrAbortCount [int32u]",
            "+ | 0x0026 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => TxErrBusyChannelCount [int32u]",
            "+ | 0x0027 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxTotalCount [int32u]",
            "+ | 0x0028 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxUnicastCount [int32u]",
            "+ | 0x0029 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxBroadcastCount [int32u]",
            "+ | 0x002a |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxDataCount [int32u]",
            "+ | 0x002b |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxDataPollCount [int32u]",
            "+ | 0x002c |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxBeaconCount [int32u]",
            "+ | 0x002d |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxBeaconRequestCount [int32u]",
            "+ | 0x002e |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxOtherCount [int32u]",
            "+ | 0x002f |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxAddressFilteredCount [int32u]",
            "+ | 0x0030 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxDestAddrFilteredCount [int32u]",
            "+ | 0x0031 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxDuplicatedCount [int32u]",
            "+ | 0x0032 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxErrNoFrameCount [int32u]",
            "+ | 0x0033 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxErrUnknownNeighborCount [int32u]",
            "+ | 0x0034 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxErrInvalidSrcAddrCount [int32u]",
            "+ | 0x0035 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxErrSecCount [int32u]",
            "+ | 0x0036 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxErrFcsCount [int32u]",
            "+ | 0x0037 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RxErrOtherCount [int32u]",
            "+ | 0x0038 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 1 | 65534 | 0 => ActiveTimestamp [int64u]",
            "+ | 0x0039 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 1 | 65534 | 0 => PendingTimestamp [int64u]",
            "+ | 0x003a |        | server | Ext |           |       |               0x0000 | 1 | 1 | 65534 | 0 => Delay [int32u]",
            "+ | 0x003b |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => SecurityPolicy [SecurityPolicy]",
            "+ | 0x003c |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ChannelPage0Mask [octet_string]",
            "+ | 0x003d |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => OperationalDatasetComponents [OperationalDatasetComponents]",
            "+ | 0x003e |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ActiveNetworkFaultsList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |               0x000F | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "WiFi Network Diagnostics",
          "code": "0x0036",
          "define": "WIFI_NETWORK_DIAGNOSTICS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => ResetCounts"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "WiFi Network Diagnostics",
          "code": "0x0036",
          "define": "WIFI_NETWORK_DIAGNOSTICS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => BSSID [octet_string]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => SecurityType [SecurityTypeEnum]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => WiFiVersion [WiFiVersionEnum]",
            "+ | 0x0003 |        | server | Ext |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ChannelNumber [int16u]",
            "+ | 0x0004 |        | server | Ext |           |       |                 0x00 | 1 | 0 | 65344 | 0 => RSSI [int8s]",
            "+ | 0x0005 |        | server | Ext |           |       |           0x00000000 | 1 | 0 | 65344 | 0 => BeaconLostCount [int32u]",
            "+ | 0x0006 |        | server | Ext |           |       |           0x00000000 | 1 | 0 | 65344 | 0 => BeaconRxCount [int32u]",
            "+ | 0x0007 |        | server | Ext |           |       |           0x00000000 | 1 | 0 | 65344 | 0 => PacketMulticastRxCount [int32u]",
            "+ | 0x0008 |        | server | Ext |           |       |           0x00000000 | 1 | 0 | 65344 | 0 => PacketMulticastTxCount [int32u]",
            "+ | 0x0009 |        | server | Ext |           |       |           0x00000000 | 1 | 0 | 65344 | 0 => PacketUnicastRxCount [int32u]",
            "+ | 0x000a |        | server | Ext |           |       |           0x00000000 | 1 | 0 | 65344 | 0 => PacketUnicastTxCount [int32u]",
            "+ | 0x000b |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => CurrentMaxRate [int64u]",
            "+ | 0x000c |        | server | Ext |           |       |   0x0000000000000000 | 1 | 1 | 65534 | 0 => OverrunCount [int64u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => Disconnection",
            "+ | 0x0001 |        | server => AssociationFailure",
            "+ | 0x0002 |        | server => ConnectionStatus"
          ]
        },
        {
          "name": "Ethernet Network Diagnostics",
          "code": "0x0037",
          "define": "ETHERNET_NETWORK_DIAGNOSTICS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => ResetCounts"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Ethernet Network Diagnostics",
          "code": "0x0037",
          "define": "ETHERNET_NETWORK_DIAGNOSTICS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => PHYRate [PHYRateEnum]",
            "+ | 0x0001 |        | server | Ext |           |       |                 0x00 | 1 | 1 | 65534 | 0 => FullDuplex [boolean]",
            "+ | 0x0002 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => PacketRxCount [int64u]",
            "+ | 0x0003 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => PacketTxCount [int64u]",
            "+ | 0x0004 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => TxErrCount [int64u]",
            "+ | 0x0005 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => CollisionCount [int64u]",
            "+ | 0x0006 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 0 | 65344 | 0 => OverrunCount [int64u]",
            "+ | 0x0007 |        | server | Ext |           |       |                 0x00 | 1 | 1 | 65534 | 0 => CarrierDetect [boolean]",
            "+ | 0x0008 |        | server | Ext |           |       |   0x0000000000000000 | 1 | 1 | 65534 | 0 => TimeSinceReset [int64u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Switch",
          "code": "0x003b",
          "define": "SWITCH_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Switch",
          "code": "0x003b",
          "define": "SWITCH_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => NumberOfPositions [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CurrentPosition [int8u]",
            "- | 0x0002 |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => MultiPressMax [int8u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Administrator Commissioning",
          "code": "0x003c",
          "define": "ADMINISTRATOR_COMMISSIONING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => OpenCommissioningWindow",
            "0x0001 |        | client | 1 | 1 => OpenBasicCommissioningWindow",
            "0x0002 |        | client | 1 | 1 => RevokeCommissioning"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Administrator Commissioning",
          "code": "0x003c",
          "define": "ADMINISTRATOR_COMMISSIONING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => WindowStatus [CommissioningWindowStatusEnum]",
            "+ | 0x0001 |        | server | Ext |           |       |                    1 | 1 | 1 | 65534 | 0 => AdminFabricIndex [fabric_idx]",
            "+ | 0x0002 |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => AdminVendorId [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Operational Credentials",
          "code": "0x003e",
          "define": "OPERATIONAL_CREDENTIALS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => AttestationRequest",
            "0x0002 |        | client | 1 | 0 => CertificateChainRequest",
            "0x0004 |        | client | 1 | 0 => CSRRequest",
            "0x0006 |        | client | 1 | 0 => AddNOC",
            "0x0007 |        | client | 1 | 0 => UpdateNOC",
            "0x0009 |        | client | 1 | 1 => UpdateFabricLabel",
            "0x000a |        | client | 1 | 1 => RemoveFabric",
            "0x000b |        | client | 1 | 1 => AddTrustedRootCertificate"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Operational Credentials",
          "code": "0x003e",
          "define": "OPERATIONAL_CREDENTIALS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0001 |        | server | 0 | 1 => AttestationResponse",
            "0x0003 |        | server | 0 | 1 => CertificateChainResponse",
            "0x0005 |        | server | 0 | 1 => CSRResponse",
            "0x0008 |        | server | 0 | 1 => NOCResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => NOCs [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => Fabrics [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => SupportedFabrics [int8u]",
            "+ | 0x0003 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => CommissionedFabrics [int8u]",
            "+ | 0x0004 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => TrustedRootCertificates [array]",
            "+ | 0x0005 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => CurrentFabricIndex [int8u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Group Key Management",
          "code": "0x003f",
          "define": "GROUP_KEY_MANAGEMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => KeySetWrite",
            "0x0001 |        | client | 1 | 0 => KeySetRead",
            "0x0003 |        | client | 1 | 0 => KeySetRemove",
            "0x0004 |        | client | 1 | 0 => KeySetReadAllIndices"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Group Key Management",
          "code": "0x003f",
          "define": "GROUP_KEY_MANAGEMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0002 |        | server | 0 | 1 => KeySetReadResponse",
            "0x0005 |        | server | 0 | 1 => KeySetReadAllIndicesResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => GroupKeyMap [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => GroupTable [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => MaxGroupsPerFabric [int16u]",
            "+ | 0x0003 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => MaxGroupKeysPerFabric [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Fixed Label",
          "code": "0x0040",
          "define": "FIXED_LABEL_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Fixed Label",
          "code": "0x0040",
          "define": "FIXED_LABEL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => LabelList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "User Label",
          "code": "0x0041",
          "define": "USER_LABEL_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "User Label",
          "code": "0x0041",
          "define": "USER_LABEL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => LabelList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Door Lock",
          "code": "0x0101",
          "define": "DOOR_LOCK_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => LockDoor",
            "0x0001 |        | client | 1 | 1 => UnlockDoor"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    6 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Door Lock",
          "code": "0x0101",
          "define": "DOOR_LOCK_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => LockState [DlLockState]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => LockType [DlLockType]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ActuatorEnabled [boolean]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => DoorState [DoorStateEnum]",
            "- | 0x0021 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => Language [char_string]",
            "- | 0x0022 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => LEDSettings [int8u]",
            "- | 0x0023 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => AutoRelockTime [int32u]",
            "- | 0x0024 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SoundVolume [int8u]",
            "- | 0x0025 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => OperatingMode [OperatingModeEnum]",
            "- | 0x0027 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => DefaultConfigurationRegister [DlDefaultConfigurationRegister]",
            "- | 0x0028 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => EnableLocalProgramming [boolean]",
            "- | 0x0029 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnableOneTouchLocking [boolean]",
            "- | 0x002a |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnableInsideStatusLED [boolean]",
            "- | 0x002b |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnablePrivacyModeButton [boolean]",
            "- | 0x0030 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => WrongCodeEntryLimit [int8u]",
            "- | 0x0031 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => UserCodeTemporaryDisableTime [int8u]",
            "- | 0x0032 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SendPINOverTheAir [boolean]",
            "- | 0x0033 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => RequirePINforRemoteOperation [boolean]",
            "+ | 0xfffd |        | server | RAM |           |       |                    6 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Barrier Control",
          "code": "0x0103",
          "define": "BARRIER_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => BarrierControlGoToPercent",
            "0x0001 |        | client | 1 | 1 => BarrierControlStop"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Barrier Control",
          "code": "0x0103",
          "define": "BARRIER_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier moving state [enum8]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier safety status [bitmap16]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier capabilities [bitmap8]",
            "+ | 0x000a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier position [int8u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Color Control",
          "code": "0x0300",
          "define": "COLOR_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => MoveToHue",
            "0x0001 |        | client | 1 | 1 => MoveHue",
            "0x0002 |        | client | 1 | 1 => StepHue",
            "0x0003 |        | client | 1 | 1 => MoveToSaturation",
            "0x0004 |        | client | 1 | 1 => MoveSaturation",
            "0x0005 |        | client | 1 | 1 => StepSaturation",
            "0x0006 |        | client | 1 | 1 => MoveToHueAndSaturation",
            "0x0007 |        | client | 1 | 1 => MoveToColor",
            "0x0008 |        | client | 1 | 1 => MoveColor",
            "0x0009 |        | client | 1 | 1 => StepColor",
            "0x000a |        | client | 1 | 1 => MoveToColorTemperature",
            "0x0047 |        | client | 1 | 1 => StopMoveStep",
            "0x004b |        | client | 1 | 1 => MoveColorTemperature",
            "0x004c |        | client | 1 | 1 => StepColorTemperature"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Color Control",
          "code": "0x0300",
          "define": "COLOR_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentHue [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentSaturation [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RemainingTime [int16u]",
            "+ | 0x0003 |        | server | RAM |           |       |               0x616B | 1 | 0 | 65344 | 0 => CurrentX [int16u]",
            "+ | 0x0004 |        | server | RAM |           |       |               0x607D | 1 | 0 | 65344 | 0 => CurrentY [int16u]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => DriftCompensation [enum8]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CompensationText [char_string]",
            "+ | 0x0007 |        | server | RAM |           |       |               0x00FA | 1 | 0 | 65344 | 0 => ColorTemperatureMireds [int16u]",
            "+ | 0x0008 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => ColorMode [enum8]",
            "+ | 0x000f |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => Options [bitmap8]",
            "+ | 0x0010 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NumberOfPrimaries [int8u]",
            "+ | 0x0011 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1X [int16u]",
            "+ | 0x0012 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1Y [int16u]",
            "+ | 0x0013 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1Intensity [int8u]",
            "+ | 0x0015 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2X [int16u]",
            "+ | 0x0016 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2Y [int16u]",
            "+ | 0x0017 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2Intensity [int8u]",
            "+ | 0x0019 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3X [int16u]",
            "+ | 0x001a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3Y [int16u]",
            "+ | 0x001b |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3Intensity [int8u]",
            "+ | 0x0020 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4X [int16u]",
            "+ | 0x0021 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4Y [int16u]",
            "+ | 0x0022 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4Intensity [int8u]",
            "+ | 0x0024 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5X [int16u]",
            "+ | 0x0025 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5Y [int16u]",
            "+ | 0x0026 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5Intensity [int8u]",
            "+ | 0x0028 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6X [int16u]",
            "+ | 0x0029 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6Y [int16u]",
            "+ | 0x002a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6Intensity [int8u]",
            "+ | 0x0030 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => WhitePointX [int16u]",
            "+ | 0x0031 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => WhitePointY [int16u]",
            "+ | 0x0032 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRX [int16u]",
            "+ | 0x0033 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRY [int16u]",
            "+ | 0x0034 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRIntensity [int8u]",
            "+ | 0x0036 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGX [int16u]",
            "+ | 0x0037 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGY [int16u]",
            "+ | 0x0038 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGIntensity [int8u]",
            "+ | 0x003a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBX [int16u]",
            "+ | 0x003b |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBY [int16u]",
            "+ | 0x003c |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBIntensity [int8u]",
            "+ | 0x4000 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => EnhancedCurrentHue [int16u]",
            "+ | 0x4001 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => EnhancedColorMode [enum8]",
            "+ | 0x4002 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => ColorLoopActive [int8u]",
            "+ | 0x4003 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => ColorLoopDirection [int8u]",
            "+ | 0x4004 |        | server | RAM |           |       |               0x0019 | 1 | 0 | 65344 | 0 => ColorLoopTime [int16u]",
            "+ | 0x400a |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ColorCapabilities [bitmap16]",
            "+ | 0x400b |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ColorTempPhysicalMinMireds [int16u]",
            "+ | 0x400c |        | server | RAM |           |       |               0xFEFF | 1 | 0 | 65344 | 0 => ColorTempPhysicalMaxMireds [int16u]",
            "+ | 0x400d |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CoupleColorTempToLevelMinMireds [int16u]",
            "+ | 0x4010 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => StartUpColorTemperatureMireds [int16u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Illuminance Measurement",
          "code": "0x0400",
          "define": "ILLUMINANCE_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Illuminance Measurement",
          "code": "0x0400",
          "define": "ILLUMINANCE_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => MeasuredValue [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MinMeasuredValue [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxMeasuredValue [int16u]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => Tolerance [int16u]",
            "- | 0x0004 |        | server | RAM |           |       |                 0xFF | 1 | 1 | 65534 | 0 => LightSensorType [enum8]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Temperature Measurement",
          "code": "0x0402",
          "define": "TEMPERATURE_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Temperature Measurement",
          "code": "0x0402",
          "define": "TEMPERATURE_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MeasuredValue [int16s]",
            "+ | 0x0001 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MinMeasuredValue [int16s]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MaxMeasuredValue [int16s]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Tolerance [int16u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Relative Humidity Measurement",
          "code": "0x0405",
          "define": "RELATIVE_HUMIDITY_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Relative Humidity Measurement",
          "code": "0x0405",
          "define": "RELATIVE_HUMIDITY_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MeasuredValue [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => MinMeasuredValue [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x2710 | 1 | 0 | 65344 | 0 => MaxMeasuredValue [int16u]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Tolerance [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Occupancy [OccupancyBitmap]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => OccupancySensorType [OccupancySensorTypeEnum]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => OccupancySensorTypeBitmap [OccupancySensorTypeBitmap]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Client Monitoring",
          "code": "0x1046",
          "define": "CLIENT_MONITORING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => RegisterClientMonitoring",
            "0x0001 |        | client | 1 | 1 => UnregisterClientMonitoring"
          ],
          "attributes": [
            "+ | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Client Monitoring",
          "code": "0x1046",
          "define": "CLIENT_MONITORING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                0x12C | 1 | 1 | 65534 | 0 => IdleModeInterval [int32u]",
            "+ | 0x0001 |        | server | RAM |           |       |                0x12C | 1 | 1 | 65534 | 0 => ActiveModeInterval [int32u]",
            "+ | 0x0002 |        | server | RAM |           |       |                0xFA0 | 1 | 1 | 65534 | 0 => ActiveModeThreshold [int16u]",
            "+ | 0x0003 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ExpectedClients [array]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Unit Testing",
          "code": "0xfff1fc05",
          "define": "UNIT_TESTING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Test",
            "0x0001 |        | client | 1 | 0 => TestNotHandled",
            "0x0002 |        | client | 1 | 1 => TestSpecific"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Unit Testing",
          "code": "0xfff1fc05",
          "define": "UNIT_TESTING_CLUSTER",
          "side": "server",
          "enabled": 0,
          "commands": [
            "0x0000 |        | server | 1 | 1 => TestSpecificResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                false | 1 | 0 | 65344 | 0 => boolean [boolean]",
            "+ | 0x0001 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap8 [Bitmap8MaskMap]",
            "+ | 0x0002 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap16 [Bitmap16MaskMap]",
            "+ | 0x0003 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap32 [Bitmap32MaskMap]",
            "+ | 0x0004 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap64 [Bitmap64MaskMap]",
            "+ | 0x0005 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int8u [int8u]",
            "+ | 0x0006 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int16u [int16u]",
            "+ | 0x0008 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int32u [int32u]",
            "+ | 0x000c |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int64u [int64u]",
            "+ | 0x000d |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int8s [int8s]",
            "+ | 0x000e |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int16s [int16s]",
            "+ | 0x0010 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int32s [int32s]",
            "+ | 0x0014 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int64s [int64s]",
            "+ | 0x0015 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => enum8 [enum8]",
            "+ | 0x0016 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => enum16 [enum16]",
            "+ | 0x0019 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => octet_string [octet_string]",
            "+ | 0x001a |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => list_int8u [array]",
            "+ | 0x001b |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => list_octet_string [array]",
            "+ | 0x001c |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => list_struct_octet_string [array]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Fault Injection",
          "code": "0xfff1fc06",
          "define": "FAULT_INJECTION_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => FailAtFault",
            "0x0001 |        | client | 1 | 0 => FailRandomlyAtFault"
          ],
          "attributes": [
            "+ | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Fault Injection",
          "code": "0xfff1fc06",
          "define": "FAULT_INJECTION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        }
      ]
    },
    {
      "name": "MA-onofflight",
      "deviceTypeName": "MA-onofflight",
      "deviceTypeCode": 256,
      "deviceTypeProfileId": 259,
      "clusters": [
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Identify",
            "0x0040 |        | client | 1 | 0 => TriggerEffect"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => IdentifyTime [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                  0x0 | 1 | 0 | 65344 | 0 => IdentifyType [enum8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => AddGroup",
            "0x0001 |        | client | 1 | 1 => ViewGroup",
            "0x0002 |        | client | 1 | 1 => GetGroupMembership",
            "0x0003 |        | client | 1 | 1 => RemoveGroup",
            "0x0004 |        | client | 1 | 1 => RemoveAllGroups",
            "0x0005 |        | client | 1 | 1 => AddGroupIfIdentifying"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 1 | 1 => AddGroupResponse",
            "0x0001 |        | server | 1 | 1 => ViewGroupResponse",
            "0x0002 |        | server | 1 | 1 => GetGroupMembershipResponse",
            "0x0003 |        | server | 1 | 1 => RemoveGroupResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NameSupport [bitmap8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => AddScene",
            "0x0001 |        | client | 1 | 1 => ViewScene",
            "0x0002 |        | client | 1 | 1 => RemoveScene",
            "0x0003 |        | client | 1 | 1 => RemoveAllScenes",
            "0x0004 |        | client | 1 | 1 => StoreScene",
            "0x0005 |        | client | 1 | 1 => RecallScene",
            "0x0006 |        | client | 1 | 1 => GetSceneMembership"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 1 | 1 => AddSceneResponse",
            "0x0001 |        | server | 1 | 1 => ViewSceneResponse",
            "0x0002 |        | server | 1 | 1 => RemoveSceneResponse",
            "0x0003 |        | server | 1 | 1 => RemoveAllScenesResponse",
            "0x0004 |        | server | 1 | 1 => StoreSceneResponse",
            "0x0006 |        | server | 1 | 1 => GetSceneMembershipResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SceneCount [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentScene [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => CurrentGroup [group_id]",
            "+ | 0x0003 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SceneValid [boolean]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NameSupport [bitmap8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "client",
          "enabled": 1,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Off",
            "0x0001 |        | client | 1 | 1 => On",
            "0x0002 |        | client | 1 | 1 => Toggle",
            "0x0040 |        | client | 1 | 0 => OffWithEffect",
            "0x0041 |        | client | 1 | 0 => OnWithRecallGlobalScene",
            "0x0042 |        | client | 1 | 0 => OnWithTimedOff"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | NVM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => OnOff [boolean]",
            "+ | 0x4000 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => GlobalSceneControl [boolean]",
            "+ | 0x4001 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => OnTime [int16u]",
            "+ | 0x4002 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => OffWaitTime [int16u]",
            "+ | 0x4003 |        | server | NVM |           |       |                 0xFF | 1 | 0 | 65344 | 0 => StartUpOnOff [OnOffStartUpOnOff]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |               0x0001 | 1 | 0 | 65344 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/off Switch Configuration",
          "code": "0x0007",
          "define": "ON_OFF_SWITCH_CONFIGURATION_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/off Switch Configuration",
          "code": "0x0007",
          "define": "ON_OFF_SWITCH_CONFIGURATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => switch type [enum8]",
            "+ | 0x0010 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => switch actions [enum8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => MoveToLevel",
            "0x0001 |        | client | 1 | 1 => Move",
            "0x0002 |        | client | 1 | 1 => Step",
            "0x0003 |        | client | 1 | 1 => Stop",
            "0x0004 |        | client | 1 | 1 => MoveToLevelWithOnOff",
            "0x0005 |        | client | 1 | 1 => MoveWithOnOff",
            "0x0006 |        | client | 1 | 1 => StepWithOnOff",
            "0x0007 |        | client | 1 | 1 => StopWithOnOff"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | NVM |           |       |                 0xFE | 1 | 0 | 65344 | 0 => CurrentLevel [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RemainingTime [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |                 0x01 | 1 | 1 | 65534 | 0 => MinLevel [int8u]",
            "+ | 0x0003 |        | server | RAM |           |       |                 0xFE | 1 | 1 | 65534 | 0 => MaxLevel [int8u]",
            "+ | 0x0004 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => CurrentFrequency [int16u]",
            "+ | 0x0005 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => MinFrequency [int16u]",
            "+ | 0x0006 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => MaxFrequency [int16u]",
            "+ | 0x000f |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => Options [LevelControlOptions]",
            "+ | 0x0010 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => OnOffTransitionTime [int16u]",
            "+ | 0x0011 |        | server | RAM |           |       |                 0xFF | 1 | 1 | 65534 | 0 => OnLevel [int8u]",
            "+ | 0x0012 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => OnTransitionTime [int16u]",
            "+ | 0x0013 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => OffTransitionTime [int16u]",
            "+ | 0x0014 |        | server | RAM |           |       |                   50 | 1 | 1 | 65534 | 0 => DefaultMoveRate [int8u]",
            "+ | 0x4000 |        | server | NVM |           |       |                  255 | 1 | 0 | 65344 | 0 => StartUpCurrentLevel [int8u]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binary Input (Basic)",
          "code": "0x000f",
          "define": "BINARY_INPUT_BASIC_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binary Input (Basic)",
          "code": "0x000f",
          "define": "BINARY_INPUT_BASIC_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0051 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => out of service [boolean]",
            "+ | 0x0055 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => present value [boolean]",
            "+ | 0x006f |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => status flags [bitmap8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Descriptor",
          "code": "0x001d",
          "define": "DESCRIPTOR_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Descriptor",
          "code": "0x001d",
          "define": "DESCRIPTOR_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => DeviceTypeList [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ServerList [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ClientList [array]",
            "+ | 0x0003 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => PartsList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | Ext |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binding",
          "code": "0x001e",
          "define": "BINDING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Binding",
          "code": "0x001e",
          "define": "BINDING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => Binding [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Actions",
          "code": "0x0025",
          "define": "ACTIONS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Actions",
          "code": "0x0025",
          "define": "ACTIONS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ActionList [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => EndpointLists [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => SetupURL [long_char_string]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | Ext |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Basic Information",
          "code": "0x0028",
          "define": "BASIC_INFORMATION_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Basic Information",
          "code": "0x0028",
          "define": "BASIC_INFORMATION_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | Ext | singleton |       |                   10 | 1 | 0 | 65344 | 0 => DataModelRevision [int16u]",
            "+ | 0x0001 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => VendorName [char_string]",
            "+ | 0x0002 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => VendorID [vendor_id]",
            "+ | 0x0003 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductName [char_string]",
            "+ | 0x0004 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductID [int16u]",
            "+ | 0x0005 |        | server | NVM | singleton |       |                      | 1 | 0 | 65344 | 0 => NodeLabel [char_string]",
            "+ | 0x0006 |        | server | Ext | singleton |       |                   XX | 1 | 0 | 65344 | 0 => Location [char_string]",
            "+ | 0x0007 |        | server | Ext | singleton |       |                    0 | 1 | 0 | 65344 | 0 => HardwareVersion [int16u]",
            "+ | 0x0008 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => HardwareVersionString [char_string]",
            "+ | 0x0009 |        | server | Ext | singleton |       |                    0 | 1 | 0 | 65344 | 0 => SoftwareVersion [int32u]",
            "+ | 0x000a |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => SoftwareVersionString [char_string]",
            "+ | 0x000b |        | server | Ext | singleton |       |     20210614123456ZZ | 1 | 0 | 65344 | 0 => ManufacturingDate [char_string]",
            "+ | 0x000c |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => PartNumber [char_string]",
            "+ | 0x000d |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductURL [long_char_string]",
            "+ | 0x000e |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductLabel [char_string]",
            "+ | 0x000f |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => SerialNumber [char_string]",
            "+ | 0x0010 |        | server | NVM | singleton |       |                    0 | 1 | 0 | 65344 | 0 => LocalConfigDisabled [boolean]",
            "+ | 0x0011 |        | server | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => Reachable [boolean]",
            "+ | 0x0012 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => UniqueID [char_string]",
            "+ | 0x0013 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => CapabilityMinima [CapabilityMinimaStruct]",
            "+ | 0xfffd |        | server | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "OTA Software Update Provider",
          "code": "0x0029",
          "define": "OTA_SOFTWARE_UPDATE_PROVIDER_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => QueryImage",
            "0x0002 |        | client | 1 | 1 => ApplyUpdateRequest"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "OTA Software Update Provider",
          "code": "0x0029",
          "define": "OTA_SOFTWARE_UPDATE_PROVIDER_CLUSTER",
          "side": "server",
          "enabled": 0,
          "commands": [
            "0x0003 |        | server | 1 | 1 => ApplyUpdateResponse"
          ],
          "attributes": [
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "OTA Software Update Requestor",
          "code": "0x002a",
          "define": "OTA_SOFTWARE_UPDATE_REQUESTOR_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "OTA Software Update Requestor",
          "code": "0x002a",
          "define": "OTA_SOFTWARE_UPDATE_REQUESTOR_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Power Source",
          "code": "0x002f",
          "define": "POWER_SOURCE_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Power Source",
          "code": "0x002f",
          "define": "POWER_SOURCE_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => Status [PowerSourceStatusEnum]",
            "+ | 0x0001 |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => Order [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |                   B2 | 1 | 0 | 65344 | 0 => Description [char_string]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedInputVoltage [int32u]",
            "- | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedInputFrequency [int16u]",
            "- | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredCurrentType [WiredCurrentTypeEnum]",
            "- | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedCurrent [int32u]",
            "- | 0x0007 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredNominalVoltage [int32u]",
            "- | 0x0008 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredMaximumCurrent [int32u]",
            "- | 0x0009 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredPresent [boolean]",
            "- | 0x000a |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveWiredFaults [array]",
            "- | 0x000b |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => BatVoltage [int32u]",
            "- | 0x000c |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => BatPercentRemaining [int8u]",
            "- | 0x000d |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => BatTimeRemaining [int32u]",
            "+ | 0x000e |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => BatChargeLevel [BatChargeLevelEnum]",
            "+ | 0x000f |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplacementNeeded [boolean]",
            "+ | 0x0010 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplaceability [BatReplaceabilityEnum]",
            "- | 0x0011 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatPresent [boolean]",
            "- | 0x0012 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ActiveBatFaults [array]",
            "- | 0x0013 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplacementDescription [char_string]",
            "- | 0x0014 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatCommonDesignation [BatCommonDesignationEnum]",
            "- | 0x0015 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatANSIDesignation [char_string]",
            "- | 0x0016 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatIECDesignation [char_string]",
            "- | 0x0017 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatApprovedChemistry [BatApprovedChemistryEnum]",
            "- | 0x0018 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatCapacity [int32u]",
            "- | 0x0019 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatQuantity [int8u]",
            "- | 0x001a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => BatChargeState [BatChargeStateEnum]",
            "- | 0x001b |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatTimeToFullCharge [int32u]",
            "- | 0x001c |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatFunctionalWhileCharging [boolean]",
            "- | 0x001d |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatChargingCurrent [int32u]",
            "- | 0x001e |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveBatChargeFaults [array]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0001 |        | server => BatFaultChange"
          ]
        },
        {
          "name": "General Commissioning",
          "code": "0x0030",
          "define": "GENERAL_COMMISSIONING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => ArmFailSafe",
            "0x0002 |        | client | 1 | 1 => SetRegulatoryConfig"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "General Commissioning",
          "code": "0x0030",
          "define": "GENERAL_COMMISSIONING_CLUSTER",
          "side": "server",
          "enabled": 0,
          "commands": [
            "0x0001 |        | server | 1 | 1 => ArmFailSafeResponse",
            "0x0003 |        | server | 1 | 1 => SetRegulatoryConfigResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    o | 1 | 0 | 65344 | 0 => Breadcrumb [int64u]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => BasicCommissioningInfo [BasicCommissioningInfo]",
            "+ | 0x0004 |        | server | Ext |           |       |                    1 | 1 | 1 | 65534 | 0 => SupportsConcurrentConnection [boolean]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Network Commissioning",
          "code": "0x0031",
          "define": "NETWORK_COMMISSIONING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => ScanNetworks",
            "0x0002 |        | client | 1 | 0 => AddOrUpdateWiFiNetwork",
            "0x0003 |        | client | 1 | 0 => AddOrUpdateThreadNetwork",
            "0x0004 |        | client | 1 | 0 => RemoveNetwork",
            "0x0006 |        | client | 1 | 0 => ConnectNetwork",
            "0x0008 |        | client | 1 | 0 => ReorderNetwork"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Network Commissioning",
          "code": "0x0031",
          "define": "NETWORK_COMMISSIONING_CLUSTER",
          "side": "server",
          "enabled": 0,
          "commands": [
            "0x0001 |        | server | 1 | 1 => ScanNetworksResponse",
            "0x0005 |        | server | 0 | 1 => NetworkConfigResponse",
            "0x0007 |        | server | 0 | 1 => ConnectNetworkResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxNetworks [int8u]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => Networks [array]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => ScanMaxTimeSeconds [int8u]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => ConnectMaxTimeSeconds [int8u]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => InterfaceEnabled [boolean]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LastNetworkingStatus [NetworkCommissioningStatus]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LastNetworkID [octet_string]",
            "+ | 0x0007 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LastConnectErrorValue [int32s]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Switch",
          "code": "0x003b",
          "define": "SWITCH_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Switch",
          "code": "0x003b",
          "define": "SWITCH_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => NumberOfPositions [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CurrentPosition [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => MultiPressMax [int8u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => SwitchLatched"
          ]
        },
        {
          "name": "Group Key Management",
          "code": "0x003f",
          "define": "GROUP_KEY_MANAGEMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Group Key Management",
          "code": "0x003f",
          "define": "GROUP_KEY_MANAGEMENT_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => GroupKeyMap [array]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => GroupTable [array]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Fixed Label",
          "code": "0x0040",
          "define": "FIXED_LABEL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Fixed Label",
          "code": "0x0040",
          "define": "FIXED_LABEL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => LabelList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "User Label",
          "code": "0x0041",
          "define": "USER_LABEL_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "User Label",
          "code": "0x0041",
          "define": "USER_LABEL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => LabelList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Boolean State",
          "code": "0x0045",
          "define": "BOOLEAN_STATE_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Boolean State",
          "code": "0x0045",
          "define": "BOOLEAN_STATE_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => StateValue [boolean]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Mode Select",
          "code": "0x0050",
          "define": "MODE_SELECT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => ChangeToMode"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Mode Select",
          "code": "0x0050",
          "define": "MODE_SELECT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               Coffee | 1 | 1 | 65534 | 0 => Description [char_string]",
            "+ | 0x0001 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => StandardNamespace [enum16]",
            "+ | 0x0002 |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => SupportedModes [array]",
            "+ | 0x0003 |        | server | NVM |           |       |                    0 | 1 | 1 | 65534 | 0 => CurrentMode [int8u]",
            "+ | 0x0004 |        | server | NVM |           |       |                    0 | 1 | 1 | 65534 | 0 => StartUpMode [int8u]",
            "+ | 0x0005 |        | server | NVM |           |       |                  255 | 1 | 1 | 65534 | 0 => OnMode [int8u]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Door Lock",
          "code": "0x0101",
          "define": "DOOR_LOCK_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => LockDoor",
            "0x0001 |        | client | 1 | 0 => UnlockDoor",
            "0x0003 |        | client | 1 | 1 => UnlockWithTimeout",
            "0x000b |        | client | 1 | 0 => SetWeekDaySchedule",
            "0x000c |        | client | 1 | 0 => GetWeekDaySchedule",
            "0x000d |        | client | 1 | 0 => ClearWeekDaySchedule",
            "0x000e |        | client | 1 | 0 => SetYearDaySchedule",
            "0x000f |        | client | 1 | 0 => GetYearDaySchedule",
            "0x001a |        | client | 1 | 0 => SetUser",
            "0x001b |        | client | 1 | 0 => GetUser",
            "0x001d |        | client | 1 | 0 => ClearUser",
            "0x0022 |        | client | 1 | 0 => SetCredential",
            "0x0024 |        | client | 1 | 0 => GetCredentialStatus",
            "0x0026 |        | client | 1 | 0 => ClearCredential"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    6 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Door Lock",
          "code": "0x0101",
          "define": "DOOR_LOCK_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x001c |        | server | 0 | 1 => GetUserResponse",
            "0x0023 |        | server | 0 | 1 => SetCredentialResponse",
            "0x0025 |        | server | 0 | 1 => GetCredentialStatusResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => LockState [DlLockState]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => LockType [DlLockType]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ActuatorEnabled [boolean]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => DoorState [DoorStateEnum]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => DoorOpenEvents [int32u]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => DoorClosedEvents [int32u]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => OpenPeriod [int16u]",
            "+ | 0x0011 |        | server | RAM |           |       |                   10 | 1 | 1 | 65534 | 0 => NumberOfTotalUsersSupported [int16u]",
            "+ | 0x0012 |        | server | RAM |           |       |                   10 | 1 | 1 | 65534 | 0 => NumberOfPINUsersSupported [int16u]",
            "+ | 0x0013 |        | server | RAM |           |       |                   10 | 1 | 1 | 65534 | 0 => NumberOfRFIDUsersSupported [int16u]",
            "+ | 0x0014 |        | server | RAM |           |       |                   10 | 1 | 1 | 65534 | 0 => NumberOfWeekDaySchedulesSupportedPerUser [int8u]",
            "+ | 0x0015 |        | server | RAM |           |       |                   10 | 1 | 1 | 65534 | 0 => NumberOfYearDaySchedulesSupportedPerUser [int8u]",
            "+ | 0x0016 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => NumberOfHolidaySchedulesSupported [int8u]",
            "+ | 0x0017 |        | server | RAM |           |       |                    6 | 1 | 1 | 65534 | 0 => MaxPINCodeLength [int8u]",
            "+ | 0x0018 |        | server | RAM |           |       |                    6 | 1 | 1 | 65534 | 0 => MinPINCodeLength [int8u]",
            "+ | 0x0019 |        | server | RAM |           |       |                   20 | 1 | 1 | 65534 | 0 => MaxRFIDCodeLength [int8u]",
            "+ | 0x001a |        | server | RAM |           |       |                   10 | 1 | 1 | 65534 | 0 => MinRFIDCodeLength [int8u]",
            "+ | 0x001b |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => CredentialRulesSupport [DlCredentialRuleMask]",
            "+ | 0x001c |        | server | RAM |           |       |                    5 | 1 | 1 | 65534 | 0 => NumberOfCredentialsSupportedPerUser [int8u]",
            "+ | 0x0021 |        | server | RAM |           |       |                   en | 1 | 0 | 65344 | 0 => Language [char_string]",
            "- | 0x0022 |        | server | RAM |           |       |                    0 | 0 | 1 | 65534 | 0 => LEDSettings [int8u]",
            "+ | 0x0023 |        | server | RAM |           |       |                   60 | 1 | 0 | 65344 | 0 => AutoRelockTime [int32u]",
            "+ | 0x0024 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SoundVolume [int8u]",
            "+ | 0x0025 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => OperatingMode [OperatingModeEnum]",
            "+ | 0x0026 |        | server | RAM |           |       |               0xFFF6 | 1 | 1 | 65534 | 0 => SupportedOperatingModes [DlSupportedOperatingModes]",
            "+ | 0x0027 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => DefaultConfigurationRegister [DlDefaultConfigurationRegister]",
            "- | 0x0028 |        | server | RAM |           |       |                    1 | 0 | 1 | 65534 | 0 => EnableLocalProgramming [boolean]",
            "+ | 0x0029 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnableOneTouchLocking [boolean]",
            "+ | 0x002a |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => EnableInsideStatusLED [boolean]",
            "+ | 0x002b |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnablePrivacyModeButton [boolean]",
            "- | 0x002c |        | server | RAM |           |       |                    0 | 0 | 1 | 65534 | 0 => LocalProgrammingFeatures [DlLocalProgrammingFeatures]",
            "+ | 0x0030 |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => WrongCodeEntryLimit [int8u]",
            "+ | 0x0031 |        | server | RAM |           |       |                   10 | 1 | 0 | 65344 | 0 => UserCodeTemporaryDisableTime [int8u]",
            "- | 0x0032 |        | server | RAM |           |       |                    0 | 0 | 1 | 65534 | 0 => SendPINOverTheAir [boolean]",
            "+ | 0x0033 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => RequirePINforRemoteOperation [boolean]",
            "- | 0x0035 |        | server | RAM |           |       |                      | 0 | 1 | 65534 | 0 => ExpiringUserTimeout [int16u]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                0xD13 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    6 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0000 |        | server => DoorLockAlarm",
            "+ | 0x0002 |        | server => LockOperation",
            "+ | 0x0003 |        | server => LockOperationError",
            "+ | 0x0004 |        | server => LockUserChange"
          ]
        },
        {
          "name": "Window Covering",
          "code": "0x0102",
          "define": "WINDOW_COVERING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => UpOrOpen",
            "0x0001 |        | client | 1 | 0 => DownOrClose",
            "0x0002 |        | client | 1 | 0 => StopMotion",
            "0x0004 |        | client | 1 | 0 => GoToLiftValue",
            "0x0005 |        | client | 1 | 0 => GoToLiftPercentage",
            "0x0007 |        | client | 1 | 0 => GoToTiltValue",
            "0x0008 |        | client | 1 | 0 => GoToTiltPercentage"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Window Covering",
          "code": "0x0102",
          "define": "WINDOW_COVERING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x08 | 1 | 0 | 65344 | 0 => Type [Type]",
            "+ | 0x0001 |        | server | RAM |           |       |               0xFFFF | 1 | 0 | 65545 | 0 => PhysicalClosedLimitLift [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0xFFFF | 1 | 0 | 65545 | 0 => PhysicalClosedLimitTilt [int16u]",
            "+ | 0x0003 |        | server | NVM |           |       |               0x7FFF | 1 | 0 | 65344 | 0 => CurrentPositionLift [int16u]",
            "+ | 0x0004 |        | server | NVM |           |       |               0x7FFF | 1 | 0 | 65344 | 0 => CurrentPositionTilt [int16u]",
            "+ | 0x0005 |        | server | NVM |           |       |               0x0000 | 1 | 0 | 65545 | 0 => NumberOfActuationsLift [int16u]",
            "+ | 0x0006 |        | server | NVM |           |       |               0x0000 | 1 | 0 | 65545 | 0 => NumberOfActuationsTilt [int16u]",
            "+ | 0x0007 |        | server | NVM |           |       |                 0x03 | 1 | 0 | 65344 | 0 => ConfigStatus [ConfigStatus]",
            "+ | 0x0008 |        | server | NVM |           |       |                   50 | 1 | 0 | 100 | 0 => CurrentPositionLiftPercentage [Percent]",
            "+ | 0x0009 |        | server | NVM |           |       |                   50 | 1 | 0 | 100 | 0 => CurrentPositionTiltPercentage [Percent]",
            "+ | 0x000a |        | server | RAM |           |       |                 0x00 | 1 | 0 | 127 | 0 => OperationalStatus [OperationalStatus]",
            "+ | 0x000b |        | server | RAM |           |       |                 5000 | 1 | 0 | 10000 | 0 => TargetPositionLiftPercent100ths [Percent100ths]",
            "+ | 0x000c |        | server | RAM |           |       |                 5000 | 1 | 0 | 10000 | 0 => TargetPositionTiltPercent100ths [Percent100ths]",
            "+ | 0x000d |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EndProductType [EndProductType]",
            "+ | 0x000e |        | server | NVM |           |       |                 5000 | 1 | 0 | 10000 | 0 => CurrentPositionLiftPercent100ths [Percent100ths]",
            "+ | 0x000f |        | server | NVM |           |       |                 5000 | 1 | 0 | 10000 | 0 => CurrentPositionTiltPercent100ths [Percent100ths]",
            "+ | 0x0010 |        | server | NVM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => InstalledOpenLimitLift [int16u]",
            "+ | 0x0011 |        | server | NVM |           |       |               0xFFFF | 1 | 0 | 65344 | 0 => InstalledClosedLimitLift [int16u]",
            "+ | 0x0012 |        | server | NVM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => InstalledOpenLimitTilt [int16u]",
            "+ | 0x0013 |        | server | NVM |           |       |               0xFFFF | 1 | 0 | 65344 | 0 => InstalledClosedLimitTilt [int16u]",
            "+ | 0x0017 |        | server | NVM |           |       |                 0x00 | 1 | 0 | 15 | 0 => Mode [Mode]",
            "+ | 0x001a |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SafetyStatus [SafetyStatus]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                 0x17 | 1 | 0 | 65344 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Barrier Control",
          "code": "0x0103",
          "define": "BARRIER_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => BarrierControlGoToPercent",
            "0x0001 |        | client | 1 | 1 => BarrierControlStop"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Barrier Control",
          "code": "0x0103",
          "define": "BARRIER_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier moving state [enum8]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier safety status [bitmap16]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier capabilities [bitmap8]",
            "+ | 0x000a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier position [int8u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Pump Configuration and Control",
          "code": "0x0200",
          "define": "PUMP_CONFIGURATION_AND_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Pump Configuration and Control",
          "code": "0x0200",
          "define": "PUMP_CONFIGURATION_AND_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MaxPressure [int16s]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MaxSpeed [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MaxFlow [int16u]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MinConstPressure [int16s]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxConstPressure [int16s]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MinCompPressure [int16s]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxCompPressure [int16s]",
            "+ | 0x0007 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MinConstSpeed [int16u]",
            "+ | 0x0008 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxConstSpeed [int16u]",
            "+ | 0x0009 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MinConstFlow [int16u]",
            "+ | 0x000a |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxConstFlow [int16u]",
            "+ | 0x000b |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MinConstTemp [int16s]",
            "+ | 0x000c |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => MaxConstTemp [int16s]",
            "+ | 0x0010 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => PumpStatus [PumpStatusBitmap]",
            "+ | 0x0011 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => EffectiveOperationMode [OperationModeEnum]",
            "+ | 0x0012 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => EffectiveControlMode [ControlModeEnum]",
            "+ | 0x0013 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Capacity [int16s]",
            "+ | 0x0014 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => Speed [int16u]",
            "+ | 0x0015 |        | server | RAM |           |       |             0x000000 | 1 | 1 | 65534 | 0 => LifetimeRunningHours [int24u]",
            "+ | 0x0016 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => Power [int24u]",
            "+ | 0x0017 |        | server | RAM |           |       |           0x00000000 | 1 | 1 | 65534 | 0 => LifetimeEnergyConsumed [int32u]",
            "+ | 0x0020 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => OperationMode [OperationModeEnum]",
            "+ | 0x0021 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => ControlMode [ControlModeEnum]",
            "+ | 0xfffc |        | server | RAM |           |       |                 0x1F | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Thermostat",
          "code": "0x0201",
          "define": "THERMOSTAT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => SetpointRaiseLower",
            "0x0001 |        | client | 0 | 1 => SetWeeklySchedule",
            "0x0002 |        | client | 0 | 1 => GetWeeklySchedule",
            "0x0003 |        | client | 0 | 1 => ClearWeeklySchedule"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Thermostat",
          "code": "0x0201",
          "define": "THERMOSTAT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 1 | 0 => GetWeeklyScheduleResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => LocalTemperature [int16s]",
            "+ | 0x0003 |        | server | RAM |           |       |               0x02BC | 1 | 0 | 65344 | 0 => AbsMinHeatSetpointLimit [int16s]",
            "+ | 0x0004 |        | server | RAM |           |       |               0x0BB8 | 1 | 0 | 65344 | 0 => AbsMaxHeatSetpointLimit [int16s]",
            "+ | 0x0005 |        | server | RAM |           |       |               0x0640 | 1 | 0 | 65344 | 0 => AbsMinCoolSetpointLimit [int16s]",
            "+ | 0x0006 |        | server | RAM |           |       |               0x0C80 | 1 | 0 | 65344 | 0 => AbsMaxCoolSetpointLimit [int16s]",
            "- | 0x0007 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => PICoolingDemand [int8u]",
            "- | 0x0008 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => PIHeatingDemand [int8u]",
            "+ | 0x0011 |        | server | RAM |           |       |               0x0A28 | 1 | 0 | 65344 | 0 => OccupiedCoolingSetpoint [int16s]",
            "+ | 0x0012 |        | server | RAM |           |       |               0x07D0 | 1 | 0 | 65344 | 0 => OccupiedHeatingSetpoint [int16s]",
            "+ | 0x0015 |        | server | RAM |           |       |               0x02BC | 1 | 0 | 65344 | 0 => MinHeatSetpointLimit [int16s]",
            "+ | 0x0016 |        | server | RAM |           |       |               0x0BB8 | 1 | 0 | 65344 | 0 => MaxHeatSetpointLimit [int16s]",
            "+ | 0x0017 |        | server | RAM |           |       |               0x0640 | 1 | 0 | 65344 | 0 => MinCoolSetpointLimit [int16s]",
            "+ | 0x0018 |        | server | RAM |           |       |               0x0C80 | 1 | 0 | 65344 | 0 => MaxCoolSetpointLimit [int16s]",
            "+ | 0x0019 |        | server | RAM |           |       |                 0x19 | 1 | 1 | 65534 | 0 => MinSetpointDeadBand [int8s]",
            "+ | 0x001b |        | server | RAM |           |       |                 0x04 | 1 | 0 | 65344 | 0 => ControlSequenceOfOperation [ThermostatControlSequence]",
            "+ | 0x001c |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => SystemMode [enum8]",
            "- | 0x001e |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => ThermostatRunningMode [enum8]",
            "- | 0x0020 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => StartOfWeek [enum8]",
            "- | 0x0021 |        | server | RAM |           |       |                    7 | 1 | 0 | 65344 | 0 => NumberOfWeeklyTransitions [int8u]",
            "- | 0x0022 |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => NumberOfDailyTransitions [int8u]",
            "- | 0x0023 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => TemperatureSetpointHold [enum8]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |               0x0023 | 1 | 0 | 65344 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Fan Control",
          "code": "0x0202",
          "define": "FAN_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Fan Control",
          "code": "0x0202",
          "define": "FAN_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => FanMode [FanModeType]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x02 | 1 | 1 | 65534 | 0 => FanModeSequence [FanModeSequenceType]",
            "+ | 0x0002 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => PercentSetting [int8u]",
            "+ | 0x0003 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => PercentCurrent [int8u]",
            "+ | 0x0004 |        | server | RAM |           |       |                  100 | 1 | 1 | 65534 | 0 => SpeedMax [int8u]",
            "+ | 0x0005 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => SpeedSetting [int8u]",
            "+ | 0x0006 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => SpeedCurrent [int8u]",
            "+ | 0x0007 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => RockSupport [bitmap8]",
            "+ | 0x0008 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => RockSetting [bitmap8]",
            "+ | 0x0009 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => WindSupport [bitmap8]",
            "+ | 0x000a |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => WindSetting [bitmap8]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                 0x0F | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Thermostat User Interface Configuration",
          "code": "0x0204",
          "define": "THERMOSTAT_USER_INTERFACE_CONFIGURATION_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Thermostat User Interface Configuration",
          "code": "0x0204",
          "define": "THERMOSTAT_USER_INTERFACE_CONFIGURATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => TemperatureDisplayMode [enum8]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => KeypadLockout [enum8]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ScheduleProgrammingVisibility [enum8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    2 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Color Control",
          "code": "0x0300",
          "define": "COLOR_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => MoveToHue",
            "0x0001 |        | client | 1 | 1 => MoveHue",
            "0x0002 |        | client | 1 | 1 => StepHue",
            "0x0003 |        | client | 1 | 1 => MoveToSaturation",
            "0x0004 |        | client | 1 | 1 => MoveSaturation",
            "0x0005 |        | client | 1 | 1 => StepSaturation",
            "0x0006 |        | client | 1 | 1 => MoveToHueAndSaturation",
            "0x0007 |        | client | 1 | 1 => MoveToColor",
            "0x0008 |        | client | 1 | 1 => MoveColor",
            "0x0009 |        | client | 1 | 1 => StepColor",
            "0x000a |        | client | 1 | 1 => MoveToColorTemperature",
            "0x0040 |        | client | 1 | 0 => EnhancedMoveToHue",
            "0x0041 |        | client | 1 | 0 => EnhancedMoveHue",
            "0x0042 |        | client | 1 | 0 => EnhancedStepHue",
            "0x0043 |        | client | 1 | 0 => EnhancedMoveToHueAndSaturation",
            "0x0044 |        | client | 1 | 0 => ColorLoopSet",
            "0x0047 |        | client | 1 | 1 => StopMoveStep",
            "0x004b |        | client | 1 | 1 => MoveColorTemperature",
            "0x004c |        | client | 1 | 1 => StepColorTemperature"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Color Control",
          "code": "0x0300",
          "define": "COLOR_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentHue [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentSaturation [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RemainingTime [int16u]",
            "+ | 0x0003 |        | server | RAM |           |       |               0x616B | 1 | 0 | 65344 | 0 => CurrentX [int16u]",
            "+ | 0x0004 |        | server | RAM |           |       |               0x607D | 1 | 0 | 65344 | 0 => CurrentY [int16u]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => DriftCompensation [enum8]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CompensationText [char_string]",
            "+ | 0x0007 |        | server | RAM |           |       |               0x00FA | 1 | 0 | 65344 | 0 => ColorTemperatureMireds [int16u]",
            "+ | 0x0008 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => ColorMode [enum8]",
            "+ | 0x000f |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => Options [bitmap8]",
            "+ | 0x0010 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NumberOfPrimaries [int8u]",
            "+ | 0x0011 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1X [int16u]",
            "+ | 0x0012 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1Y [int16u]",
            "+ | 0x0013 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1Intensity [int8u]",
            "+ | 0x0015 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2X [int16u]",
            "+ | 0x0016 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2Y [int16u]",
            "+ | 0x0017 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2Intensity [int8u]",
            "+ | 0x0019 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3X [int16u]",
            "+ | 0x001a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3Y [int16u]",
            "+ | 0x001b |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3Intensity [int8u]",
            "+ | 0x0020 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4X [int16u]",
            "+ | 0x0021 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4Y [int16u]",
            "+ | 0x0022 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4Intensity [int8u]",
            "+ | 0x0024 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5X [int16u]",
            "+ | 0x0025 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5Y [int16u]",
            "+ | 0x0026 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5Intensity [int8u]",
            "+ | 0x0028 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6X [int16u]",
            "+ | 0x0029 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6Y [int16u]",
            "+ | 0x002a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6Intensity [int8u]",
            "+ | 0x0030 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => WhitePointX [int16u]",
            "+ | 0x0031 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => WhitePointY [int16u]",
            "+ | 0x0032 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRX [int16u]",
            "+ | 0x0033 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRY [int16u]",
            "+ | 0x0034 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRIntensity [int8u]",
            "+ | 0x0036 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGX [int16u]",
            "+ | 0x0037 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGY [int16u]",
            "+ | 0x0038 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGIntensity [int8u]",
            "+ | 0x003a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBX [int16u]",
            "+ | 0x003b |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBY [int16u]",
            "+ | 0x003c |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBIntensity [int8u]",
            "+ | 0x4000 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => EnhancedCurrentHue [int16u]",
            "+ | 0x4001 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => EnhancedColorMode [enum8]",
            "+ | 0x4002 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => ColorLoopActive [int8u]",
            "+ | 0x4003 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => ColorLoopDirection [int8u]",
            "+ | 0x4004 |        | server | RAM |           |       |               0x0019 | 1 | 0 | 65344 | 0 => ColorLoopTime [int16u]",
            "+ | 0x4005 |        | server | RAM |           |       |               0x2300 | 1 | 0 | 65344 | 0 => ColorLoopStartEnhancedHue [int16u]",
            "+ | 0x4006 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ColorLoopStoredEnhancedHue [int16u]",
            "+ | 0x400a |        | server | RAM |           |       |                 0x1F | 1 | 0 | 65344 | 0 => ColorCapabilities [bitmap16]",
            "+ | 0x400b |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ColorTempPhysicalMinMireds [int16u]",
            "+ | 0x400c |        | server | RAM |           |       |               0xFEFF | 1 | 0 | 65344 | 0 => ColorTempPhysicalMaxMireds [int16u]",
            "+ | 0x400d |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CoupleColorTempToLevelMinMireds [int16u]",
            "+ | 0x4010 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => StartUpColorTemperatureMireds [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                 0x1F | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Ballast Configuration",
          "code": "0x0301",
          "define": "BALLAST_CONFIGURATION_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Ballast Configuration",
          "code": "0x0301",
          "define": "BALLAST_CONFIGURATION_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x01 | 1 | 1 | 65534 | 0 => PhysicalMinLevel [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0xFE | 1 | 1 | 65534 | 0 => PhysicalMaxLevel [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => BallastStatus [bitmap8]",
            "+ | 0x0010 |        | server | RAM |           |       |                 0x01 | 1 | 1 | 65534 | 0 => MinLevel [int8u]",
            "+ | 0x0011 |        | server | RAM |           |       |                 0xFE | 1 | 1 | 65534 | 0 => MaxLevel [int8u]",
            "+ | 0x0014 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => IntrinsicBallastFactor [int8u]",
            "+ | 0x0015 |        | server | RAM |           |       |                 0xFF | 1 | 1 | 65534 | 0 => BallastFactorAdjustment [int8u]",
            "+ | 0x0020 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LampQuantity [int8u]",
            "+ | 0x0030 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LampType [char_string]",
            "+ | 0x0031 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => LampManufacturer [char_string]",
            "+ | 0x0032 |        | server | RAM |           |       |             0xFFFFFF | 1 | 1 | 65534 | 0 => LampRatedHours [int24u]",
            "+ | 0x0033 |        | server | RAM |           |       |             0x000000 | 1 | 1 | 65534 | 0 => LampBurnHours [int24u]",
            "+ | 0x0034 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => LampAlarmMode [bitmap8]",
            "+ | 0x0035 |        | server | RAM |           |       |             0xFFFFFF | 1 | 1 | 65534 | 0 => LampBurnHoursTripPoint [int24u]",
            "+ | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "+ | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "+ | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Illuminance Measurement",
          "code": "0x0400",
          "define": "ILLUMINANCE_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Illuminance Measurement",
          "code": "0x0400",
          "define": "ILLUMINANCE_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x0000 | 1 | 1 | 65534 | 0 => MeasuredValue [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x01 | 1 | 1 | 65534 | 0 => MinMeasuredValue [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0xFFFE | 1 | 1 | 65534 | 0 => MaxMeasuredValue [int16u]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => Tolerance [int16u]",
            "+ | 0x0004 |        | server | RAM |           |       |                 0xFF | 1 | 1 | 65534 | 0 => LightSensorType [enum8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Temperature Measurement",
          "code": "0x0402",
          "define": "TEMPERATURE_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Temperature Measurement",
          "code": "0x0402",
          "define": "TEMPERATURE_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MeasuredValue [int16s]",
            "+ | 0x0001 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MinMeasuredValue [int16s]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MaxMeasuredValue [int16s]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Tolerance [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Pressure Measurement",
          "code": "0x0403",
          "define": "PRESSURE_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Pressure Measurement",
          "code": "0x0403",
          "define": "PRESSURE_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => MeasuredValue [int16s]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MinMeasuredValue [int16s]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MaxMeasuredValue [int16s]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Tolerance [int16u]",
            "- | 0x0010 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ScaledValue [int16s]",
            "- | 0x0013 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ScaledTolerance [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Flow Measurement",
          "code": "0x0404",
          "define": "FLOW_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Flow Measurement",
          "code": "0x0404",
          "define": "FLOW_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MeasuredValue [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MinMeasuredValue [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MaxMeasuredValue [int16u]",
            "+ | 0x0003 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => Tolerance [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Relative Humidity Measurement",
          "code": "0x0405",
          "define": "RELATIVE_HUMIDITY_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Relative Humidity Measurement",
          "code": "0x0405",
          "define": "RELATIVE_HUMIDITY_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MeasuredValue [int16u]",
            "+ | 0x0001 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => MinMeasuredValue [int16u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x2710 | 1 | 0 | 65344 | 0 => MaxMeasuredValue [int16u]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Tolerance [int16u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Occupancy [OccupancyBitmap]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => OccupancySensorType [OccupancySensorTypeEnum]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => OccupancySensorTypeBitmap [OccupancySensorTypeBitmap]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Wake on LAN",
          "code": "0x0503",
          "define": "WAKE_ON_LAN_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Wake on LAN",
          "code": "0x0503",
          "define": "WAKE_ON_LAN_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => MACAddress [char_string]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Channel",
          "code": "0x0504",
          "define": "CHANNEL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 0 | 1 => ChangeChannel",
            "0x0002 |        | client | 0 | 1 => ChangeChannelByNumber"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Channel",
          "code": "0x0504",
          "define": "CHANNEL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => ChannelList [array]",
            "- | 0x0001 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => Lineup [LineupInfoStruct]",
            "- | 0x0002 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => CurrentChannel [ChannelInfoStruct]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Target Navigator",
          "code": "0x0505",
          "define": "TARGET_NAVIGATOR_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => NavigateTarget"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Target Navigator",
          "code": "0x0505",
          "define": "TARGET_NAVIGATOR_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0001 |        | server | 0 | 1 => NavigateTargetResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => TargetList [array]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => CurrentTarget [int8u]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Media Playback",
          "code": "0x0506",
          "define": "MEDIA_PLAYBACK_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 0 | 1 => Play",
            "0x0001 |        | client | 0 | 1 => Pause",
            "0x0002 |        | client | 0 | 1 => Stop",
            "0x0003 |        | client | 0 | 1 => StartOver",
            "0x0004 |        | client | 0 | 1 => Previous",
            "0x0005 |        | client | 0 | 1 => Next",
            "0x0006 |        | client | 0 | 1 => Rewind",
            "0x0007 |        | client | 0 | 1 => FastForward",
            "0x0008 |        | client | 0 | 1 => SkipForward",
            "0x0009 |        | client | 0 | 1 => SkipBackward"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Media Playback",
          "code": "0x0506",
          "define": "MEDIA_PLAYBACK_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 1 | 65534 | 0 => CurrentState [PlaybackStateEnum]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0xFF | 1 | 1 | 65534 | 0 => StartTime [epoch_us]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => Duration [int64u]",
            "- | 0x0003 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => SampledPosition [PlaybackPositionStruct]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => PlaybackSpeed [single]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => SeekRangeEnd [int64u]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => SeekRangeStart [int64u]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Media Input",
          "code": "0x0507",
          "define": "MEDIA_INPUT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => SelectInput",
            "0x0001 |        | client | 1 | 1 => ShowInputStatus",
            "0x0002 |        | client | 1 | 1 => HideInputStatus",
            "0x0003 |        | client | 1 | 1 => RenameInput"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Media Input",
          "code": "0x0507",
          "define": "MEDIA_INPUT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => InputList [array]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentInput [int8u]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Low Power",
          "code": "0x0508",
          "define": "LOW_POWER_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Sleep"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Low Power",
          "code": "0x0508",
          "define": "LOW_POWER_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Keypad Input",
          "code": "0x0509",
          "define": "KEYPAD_INPUT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => SendKey"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Keypad Input",
          "code": "0x0509",
          "define": "KEYPAD_INPUT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0001 |        | server | 0 | 1 => SendKeyResponse"
          ],
          "attributes": [
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Content Launcher",
          "code": "0x050a",
          "define": "CONTENT_LAUNCHER_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 0 | 1 => LaunchContent",
            "0x0001 |        | client | 0 | 1 => LaunchURL"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Content Launcher",
          "code": "0x050a",
          "define": "CONTENT_LAUNCHER_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => AcceptHeader [array]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => SupportedStreamingProtocols [bitmap32]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Audio Output",
          "code": "0x050b",
          "define": "AUDIO_OUTPUT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 0 | 1 => SelectOutput",
            "0x0001 |        | client | 0 | 1 => RenameOutput"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Audio Output",
          "code": "0x050b",
          "define": "AUDIO_OUTPUT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => OutputList [array]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentOutput [int8u]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Application Launcher",
          "code": "0x050c",
          "define": "APPLICATION_LAUNCHER_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 0 | 1 => LaunchApp"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Application Launcher",
          "code": "0x050c",
          "define": "APPLICATION_LAUNCHER_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => CatalogList [array]",
            "- | 0x0001 |        | server | Ext |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentApp [ApplicationEPStruct]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Application Basic",
          "code": "0x050d",
          "define": "APPLICATION_BASIC_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Application Basic",
          "code": "0x050d",
          "define": "APPLICATION_BASIC_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => VendorName [char_string]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => VendorID [vendor_id]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ApplicationName [char_string]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ProductID [int16u]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Status [ApplicationStatusEnum]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ApplicationVersion [char_string]",
            "+ | 0x0007 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AllowedVendorList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Account Login",
          "code": "0x050e",
          "define": "ACCOUNT_LOGIN_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 0 | 1 => GetSetupPIN"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Account Login",
          "code": "0x050e",
          "define": "ACCOUNT_LOGIN_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Electrical Measurement",
          "code": "0x0b04",
          "define": "ELECTRICAL_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Electrical Measurement",
          "code": "0x0b04",
          "define": "ELECTRICAL_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |             0x000000 | 1 | 0 | 65344 | 0 => measurement type [bitmap32]",
            "+ | 0x0304 |        | server | RAM |           |       |             0x000000 | 1 | 0 | 65344 | 0 => total active power [int32s]",
            "+ | 0x0505 |        | server | RAM |           |       |               0xffff | 1 | 0 | 65344 | 0 => rms voltage [int16u]",
            "+ | 0x0506 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => rms voltage min [int16u]",
            "+ | 0x0507 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => rms voltage max [int16u]",
            "+ | 0x0508 |        | server | RAM |           |       |               0xffff | 1 | 0 | 65344 | 0 => rms current [int16u]",
            "+ | 0x0509 |        | server | RAM |           |       |               0xffff | 1 | 0 | 65344 | 0 => rms current min [int16u]",
            "+ | 0x050a |        | server | RAM |           |       |               0xffff | 1 | 0 | 65344 | 0 => rms current max [int16u]",
            "+ | 0x050b |        | server | RAM |           |       |               0xffff | 1 | 0 | 65344 | 0 => active power [int16s]",
            "+ | 0x050c |        | server | RAM |           |       |               0xffff | 1 | 0 | 65344 | 0 => active power min [int16s]",
            "+ | 0x050d |        | server | RAM |           |       |               0xffff | 1 | 0 | 65344 | 0 => active power max [int16s]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Unit Testing",
          "code": "0xfff1fc05",
          "define": "UNIT_TESTING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Test",
            "0x0001 |        | client | 1 | 1 => TestNotHandled",
            "0x0002 |        | client | 1 | 0 => TestSpecific",
            "0x0004 |        | client | 1 | 0 => TestAddArguments",
            "0x0007 |        | client | 1 | 0 => TestStructArgumentRequest",
            "0x0008 |        | client | 1 | 0 => TestNestedStructArgumentRequest",
            "0x0009 |        | client | 1 | 0 => TestListStructArgumentRequest",
            "0x000a |        | client | 1 | 0 => TestListInt8UArgumentRequest",
            "0x000b |        | client | 1 | 0 => TestNestedStructListArgumentRequest",
            "0x000c |        | client | 1 | 0 => TestListNestedStructListArgumentRequest",
            "0x000d |        | client | 1 | 0 => TestListInt8UReverseRequest",
            "0x000e |        | client | 1 | 0 => TestEnumsRequest",
            "0x000f |        | client | 1 | 0 => TestNullableOptionalRequest",
            "0x0011 |        | client | 1 | 0 => SimpleStructEchoRequest",
            "0x0012 |        | client | 1 | 0 => TimedInvokeRequest",
            "0x0013 |        | client | 1 | 0 => TestSimpleOptionalArgumentRequest",
            "0x0014 |        | client | 1 | 0 => TestEmitTestEventRequest",
            "0x0015 |        | client | 1 | 0 => TestEmitTestFabricScopedEventRequest"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Unit Testing",
          "code": "0xfff1fc05",
          "define": "UNIT_TESTING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 1 | 1 => TestSpecificResponse",
            "0x0001 |        | server | 0 | 1 => TestAddArgumentsResponse",
            "0x0004 |        | server | 0 | 1 => TestListInt8UReverseResponse",
            "0x0005 |        | server | 0 | 1 => TestEnumsResponse",
            "0x0006 |        | server | 0 | 1 => TestNullableOptionalResponse",
            "0x0009 |        | server | 0 | 1 => SimpleStructResponse",
            "0x000a |        | server | 0 | 1 => TestEmitTestEventResponse",
            "0x000b |        | server | 0 | 1 => TestEmitTestFabricScopedEventResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                false | 1 | 0 | 65344 | 0 => boolean [boolean]",
            "+ | 0x0001 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap8 [Bitmap8MaskMap]",
            "+ | 0x0002 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap16 [Bitmap16MaskMap]",
            "+ | 0x0003 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap32 [Bitmap32MaskMap]",
            "+ | 0x0004 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => bitmap64 [Bitmap64MaskMap]",
            "+ | 0x0005 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int8u [int8u]",
            "+ | 0x0006 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int16u [int16u]",
            "+ | 0x0007 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int24u [int24u]",
            "+ | 0x0008 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int32u [int32u]",
            "+ | 0x0009 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int40u [int40u]",
            "+ | 0x000a |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int48u [int48u]",
            "+ | 0x000b |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int56u [int56u]",
            "+ | 0x000c |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int64u [int64u]",
            "+ | 0x000d |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int8s [int8s]",
            "+ | 0x000e |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int16s [int16s]",
            "+ | 0x000f |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int24s [int24s]",
            "+ | 0x0010 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int32s [int32s]",
            "+ | 0x0011 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int40s [int40s]",
            "+ | 0x0012 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int48s [int48s]",
            "+ | 0x0013 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => int56s [int56s]",
            "+ | 0x0014 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => int64s [int64s]",
            "+ | 0x0015 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => enum8 [enum8]",
            "+ | 0x0016 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => enum16 [enum16]",
            "+ | 0x0017 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => float_single [single]",
            "+ | 0x0018 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => float_double [double]",
            "+ | 0x0019 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => octet_string [octet_string]",
            "+ | 0x001a |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => list_int8u [array]",
            "+ | 0x001b |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => list_octet_string [array]",
            "+ | 0x001c |        | server | Ext |           |       |                      | 1 | 0 | 65344 | 0 => list_struct_octet_string [array]",
            "+ | 0x001d |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => long_octet_string [long_octet_string]",
            "+ | 0x001e |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => char_string [char_string]",
            "+ | 0x001f |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => long_char_string [long_char_string]",
            "+ | 0x0020 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => epoch_us [epoch_us]",
            "+ | 0x0021 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => epoch_s [epoch_s]",
            "+ | 0x0022 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => vendor_id [vendor_id]",
            "+ | 0x0023 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => list_nullables_and_optionals_struct [array]",
            "+ | 0x0024 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => enum_attr [SimpleEnum]",
            "+ | 0x0025 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => struct_attr [SimpleStruct]",
            "+ | 0x0026 |        | server | RAM |           |       |                   70 | 1 | 1 | 65534 | 0 => range_restricted_int8u [int8u]",
            "+ | 0x0027 |        | server | RAM |           |       |                  -20 | 1 | 1 | 65534 | 0 => range_restricted_int8s [int8s]",
            "+ | 0x0028 |        | server | RAM |           |       |                  200 | 1 | 1 | 65534 | 0 => range_restricted_int16u [int16u]",
            "+ | 0x0029 |        | server | RAM |           |       |                 -100 | 1 | 1 | 65534 | 0 => range_restricted_int16s [int16s]",
            "+ | 0x002a |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => list_long_octet_string [array]",
            "+ | 0x002b |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => list_fabric_scoped [array]",
            "+ | 0x0030 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => timed_write_boolean [boolean]",
            "+ | 0x0031 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => general_error_boolean [boolean]",
            "+ | 0x0032 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => cluster_error_boolean [boolean]",
            "- | 0x00ff |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => unsupported [boolean]",
            "+ | 0x4000 |        | server | RAM |           |       |                false | 1 | 1 | 65534 | 0 => nullable_boolean [boolean]",
            "+ | 0x4001 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_bitmap8 [Bitmap8MaskMap]",
            "+ | 0x4002 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_bitmap16 [Bitmap16MaskMap]",
            "+ | 0x4003 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_bitmap32 [Bitmap32MaskMap]",
            "+ | 0x4004 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_bitmap64 [Bitmap64MaskMap]",
            "+ | 0x4005 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int8u [int8u]",
            "+ | 0x4006 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int16u [int16u]",
            "+ | 0x4007 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int24u [int24u]",
            "+ | 0x4008 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int32u [int32u]",
            "+ | 0x4009 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int40u [int40u]",
            "+ | 0x400a |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int48u [int48u]",
            "+ | 0x400b |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int56u [int56u]",
            "+ | 0x400c |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int64u [int64u]",
            "+ | 0x400d |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int8s [int8s]",
            "+ | 0x400e |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int16s [int16s]",
            "+ | 0x400f |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int24s [int24s]",
            "+ | 0x4010 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int32s [int32s]",
            "+ | 0x4011 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int40s [int40s]",
            "+ | 0x4012 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int48s [int48s]",
            "+ | 0x4013 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int56s [int56s]",
            "+ | 0x4014 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_int64s [int64s]",
            "+ | 0x4015 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_enum8 [enum8]",
            "+ | 0x4016 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_enum16 [enum16]",
            "+ | 0x4017 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_float_single [single]",
            "+ | 0x4018 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => nullable_float_double [double]",
            "+ | 0x4019 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => nullable_octet_string [octet_string]",
            "+ | 0x401e |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => nullable_char_string [char_string]",
            "+ | 0x4024 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => nullable_enum_attr [SimpleEnum]",
            "+ | 0x4025 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => nullable_struct [SimpleStruct]",
            "+ | 0x4026 |        | server | RAM |           |       |                   70 | 1 | 1 | 65534 | 0 => nullable_range_restricted_int8u [int8u]",
            "+ | 0x4027 |        | server | RAM |           |       |                  -20 | 1 | 1 | 65534 | 0 => nullable_range_restricted_int8s [int8s]",
            "+ | 0x4028 |        | server | RAM |           |       |                  200 | 1 | 1 | 65534 | 0 => nullable_range_restricted_int16u [int16u]",
            "+ | 0x4029 |        | server | RAM |           |       |                 -100 | 1 | 1 | 65534 | 0 => nullable_range_restricted_int16s [int16s]",
            "+ | 0x402a |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => write_only_int8u [int8u]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ],
          "events": [
            "+ | 0x0001 |        | server => TestEvent",
            "+ | 0x0002 |        | server => TestFabricScopedEvent"
          ]
        }
      ]
    },
    {
      "name": "MA-onofflight",
      "deviceTypeName": "MA-onofflight",
      "deviceTypeCode": 256,
      "deviceTypeProfileId": 259,
      "clusters": [
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Identify"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => IdentifyTime [int16u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => AddGroup",
            "0x0001 |        | client | 1 | 1 => ViewGroup",
            "0x0002 |        | client | 1 | 1 => GetGroupMembership",
            "0x0003 |        | client | 1 | 1 => RemoveGroup",
            "0x0004 |        | client | 1 | 1 => RemoveAllGroups",
            "0x0005 |        | client | 1 | 1 => AddGroupIfIdentifying"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 1 | 1 => AddGroupResponse",
            "0x0001 |        | server | 1 | 1 => ViewGroupResponse",
            "0x0002 |        | server | 1 | 1 => GetGroupMembershipResponse",
            "0x0003 |        | server | 1 | 1 => RemoveGroupResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NameSupport [bitmap8]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => AddScene",
            "0x0001 |        | client | 1 | 1 => ViewScene",
            "0x0002 |        | client | 1 | 1 => RemoveScene",
            "0x0003 |        | client | 1 | 1 => RemoveAllScenes",
            "0x0004 |        | client | 1 | 1 => StoreScene",
            "0x0005 |        | client | 1 | 1 => RecallScene",
            "0x0006 |        | client | 1 | 1 => GetSceneMembership"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "server",
          "enabled": 0,
          "commands": [
            "0x0000 |        | server | 1 | 1 => AddSceneResponse",
            "0x0001 |        | server | 1 | 1 => ViewSceneResponse",
            "0x0002 |        | server | 1 | 1 => RemoveSceneResponse",
            "0x0003 |        | server | 1 | 1 => RemoveAllScenesResponse",
            "0x0004 |        | server | 1 | 1 => StoreSceneResponse",
            "0x0006 |        | server | 1 | 1 => GetSceneMembershipResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SceneCount [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentScene [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => CurrentGroup [group_id]",
            "+ | 0x0003 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SceneValid [boolean]",
            "+ | 0x0004 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NameSupport [bitmap8]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => Off",
            "0x0001 |        | client | 1 | 1 => On",
            "0x0002 |        | client | 1 | 1 => Toggle"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => OnOff [boolean]",
            "+ | 0x4000 |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => GlobalSceneControl [boolean]",
            "+ | 0x4001 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => OnTime [int16u]",
            "+ | 0x4002 |        | server | RAM |           |       |                    0 | 1 | 0 | 65344 | 0 => OffWaitTime [int16u]",
            "+ | 0x4003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => StartUpOnOff [OnOffStartUpOnOff]",
            "+ | 0xfffc |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => MoveToLevel",
            "0x0001 |        | client | 1 | 1 => Move",
            "0x0002 |        | client | 1 | 1 => Step",
            "0x0003 |        | client | 1 | 1 => Stop",
            "0x0004 |        | client | 1 | 1 => MoveToLevelWithOnOff",
            "0x0005 |        | client | 1 | 1 => MoveWithOnOff",
            "0x0006 |        | client | 1 | 1 => StepWithOnOff",
            "0x0007 |        | client | 1 | 1 => StopWithOnOff"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentLevel [int8u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Descriptor",
          "code": "0x001d",
          "define": "DESCRIPTOR_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
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
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | Ext |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Basic Information",
          "code": "0x0028",
          "define": "BASIC_INFORMATION_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Basic Information",
          "code": "0x0028",
          "define": "BASIC_INFORMATION_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | Ext | singleton |       |                   10 | 1 | 0 | 65344 | 0 => DataModelRevision [int16u]",
            "+ | 0x0001 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => VendorName [char_string]",
            "+ | 0x0002 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => VendorID [vendor_id]",
            "+ | 0x0003 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductName [char_string]",
            "+ | 0x0004 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductID [int16u]",
            "+ | 0x0005 |        | server | NVM | singleton |       |                      | 1 | 0 | 65344 | 0 => NodeLabel [char_string]",
            "+ | 0x0006 |        | server | Ext | singleton |       |                   XX | 1 | 0 | 65344 | 0 => Location [char_string]",
            "+ | 0x0007 |        | server | Ext | singleton |       |                    0 | 1 | 0 | 65344 | 0 => HardwareVersion [int16u]",
            "+ | 0x0008 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => HardwareVersionString [char_string]",
            "+ | 0x0009 |        | server | Ext | singleton |       |                    0 | 1 | 0 | 65344 | 0 => SoftwareVersion [int32u]",
            "+ | 0x000a |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => SoftwareVersionString [char_string]",
            "+ | 0x000b |        | server | Ext | singleton |       |     20210614123456ZZ | 1 | 0 | 65344 | 0 => ManufacturingDate [char_string]",
            "+ | 0x000c |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => PartNumber [char_string]",
            "+ | 0x000d |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductURL [long_char_string]",
            "+ | 0x000e |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => ProductLabel [char_string]",
            "+ | 0x000f |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => SerialNumber [char_string]",
            "+ | 0x0010 |        | server | NVM | singleton |       |                    0 | 1 | 0 | 65344 | 0 => LocalConfigDisabled [boolean]",
            "+ | 0x0011 |        | server | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => Reachable [boolean]",
            "+ | 0x0012 |        | server | Ext | singleton |       |                      | 1 | 0 | 65344 | 0 => UniqueID [char_string]",
            "+ | 0x0013 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => CapabilityMinima [CapabilityMinimaStruct]",
            "+ | 0xfffd |        | server | RAM | singleton |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Power Source",
          "code": "0x002f",
          "define": "POWER_SOURCE_CLUSTER",
          "side": "client",
          "enabled": 0
        },
        {
          "name": "Power Source",
          "code": "0x002f",
          "define": "POWER_SOURCE_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => Status [PowerSourceStatusEnum]",
            "+ | 0x0001 |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => Order [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |                   B3 | 1 | 1 | 65534 | 0 => Description [char_string]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedInputVoltage [int32u]",
            "- | 0x0004 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedInputFrequency [int16u]",
            "- | 0x0005 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredCurrentType [WiredCurrentTypeEnum]",
            "- | 0x0006 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredAssessedCurrent [int32u]",
            "- | 0x0007 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredNominalVoltage [int32u]",
            "- | 0x0008 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredMaximumCurrent [int32u]",
            "- | 0x0009 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => WiredPresent [boolean]",
            "- | 0x000a |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveWiredFaults [array]",
            "- | 0x000b |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatVoltage [int32u]",
            "- | 0x000c |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatPercentRemaining [int8u]",
            "- | 0x000d |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatTimeRemaining [int32u]",
            "+ | 0x000e |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => BatChargeLevel [BatChargeLevelEnum]",
            "+ | 0x000f |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplacementNeeded [boolean]",
            "+ | 0x0010 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplaceability [BatReplaceabilityEnum]",
            "- | 0x0011 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatPresent [boolean]",
            "- | 0x0012 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveBatFaults [array]",
            "- | 0x0013 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatReplacementDescription [char_string]",
            "- | 0x0014 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatCommonDesignation [BatCommonDesignationEnum]",
            "- | 0x0015 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatANSIDesignation [char_string]",
            "- | 0x0016 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatIECDesignation [char_string]",
            "- | 0x0017 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatApprovedChemistry [BatApprovedChemistryEnum]",
            "- | 0x0018 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatCapacity [int32u]",
            "- | 0x0019 |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatQuantity [int8u]",
            "- | 0x001a |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatChargeState [BatChargeStateEnum]",
            "- | 0x001b |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatTimeToFullCharge [int32u]",
            "- | 0x001c |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatFunctionalWhileCharging [boolean]",
            "- | 0x001d |        | server | RAM |           |       |                      | 1 | 1 | 65534 | 0 => BatChargingCurrent [int32u]",
            "- | 0x001e |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ActiveBatChargeFaults [array]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | RAM |           |       |                    2 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Door Lock",
          "code": "0x0101",
          "define": "DOOR_LOCK_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => LockDoor",
            "0x0001 |        | client | 1 | 1 => UnlockDoor"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    6 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Door Lock",
          "code": "0x0101",
          "define": "DOOR_LOCK_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => LockState [DlLockState]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => LockType [DlLockType]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ActuatorEnabled [boolean]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => DoorState [DoorStateEnum]",
            "- | 0x0021 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => Language [char_string]",
            "- | 0x0022 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => LEDSettings [int8u]",
            "- | 0x0023 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => AutoRelockTime [int32u]",
            "- | 0x0024 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SoundVolume [int8u]",
            "- | 0x0025 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => OperatingMode [OperatingModeEnum]",
            "- | 0x0027 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => DefaultConfigurationRegister [DlDefaultConfigurationRegister]",
            "- | 0x0028 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => EnableLocalProgramming [boolean]",
            "- | 0x0029 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnableOneTouchLocking [boolean]",
            "- | 0x002a |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnableInsideStatusLED [boolean]",
            "- | 0x002b |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => EnablePrivacyModeButton [boolean]",
            "- | 0x0030 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => WrongCodeEntryLimit [int8u]",
            "- | 0x0031 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => UserCodeTemporaryDisableTime [int8u]",
            "- | 0x0032 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => SendPINOverTheAir [boolean]",
            "- | 0x0033 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => RequirePINforRemoteOperation [boolean]",
            "+ | 0xfffd |        | server | RAM |           |       |                    6 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Barrier Control",
          "code": "0x0103",
          "define": "BARRIER_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => BarrierControlGoToPercent",
            "0x0001 |        | client | 1 | 1 => BarrierControlStop"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Barrier Control",
          "code": "0x0103",
          "define": "BARRIER_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier moving state [enum8]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier safety status [bitmap16]",
            "+ | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier capabilities [bitmap8]",
            "+ | 0x000a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => barrier position [int8u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    1 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Color Control",
          "code": "0x0300",
          "define": "COLOR_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 1 => MoveToHue",
            "0x0001 |        | client | 1 | 1 => MoveHue",
            "0x0002 |        | client | 1 | 1 => StepHue",
            "0x0003 |        | client | 1 | 1 => MoveToSaturation",
            "0x0004 |        | client | 1 | 1 => MoveSaturation",
            "0x0005 |        | client | 1 | 1 => StepSaturation",
            "0x0006 |        | client | 1 | 1 => MoveToHueAndSaturation",
            "0x0007 |        | client | 1 | 1 => MoveToColor",
            "0x0008 |        | client | 1 | 1 => MoveColor",
            "0x0009 |        | client | 1 | 1 => StepColor",
            "0x000a |        | client | 1 | 1 => MoveToColorTemperature",
            "0x0047 |        | client | 1 | 1 => StopMoveStep",
            "0x004b |        | client | 1 | 1 => MoveColorTemperature",
            "0x004c |        | client | 1 | 1 => StepColorTemperature"
          ],
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Color Control",
          "code": "0x0300",
          "define": "COLOR_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentHue [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => CurrentSaturation [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => RemainingTime [int16u]",
            "+ | 0x0003 |        | server | RAM |           |       |               0x616B | 1 | 0 | 65344 | 0 => CurrentX [int16u]",
            "+ | 0x0004 |        | server | RAM |           |       |               0x607D | 1 | 0 | 65344 | 0 => CurrentY [int16u]",
            "+ | 0x0005 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => DriftCompensation [enum8]",
            "+ | 0x0006 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CompensationText [char_string]",
            "+ | 0x0007 |        | server | RAM |           |       |               0x00FA | 1 | 0 | 65344 | 0 => ColorTemperatureMireds [int16u]",
            "+ | 0x0008 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => ColorMode [enum8]",
            "+ | 0x000f |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => Options [bitmap8]",
            "+ | 0x0010 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => NumberOfPrimaries [int8u]",
            "+ | 0x0011 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1X [int16u]",
            "+ | 0x0012 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1Y [int16u]",
            "+ | 0x0013 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary1Intensity [int8u]",
            "+ | 0x0015 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2X [int16u]",
            "+ | 0x0016 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2Y [int16u]",
            "+ | 0x0017 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary2Intensity [int8u]",
            "+ | 0x0019 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3X [int16u]",
            "+ | 0x001a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3Y [int16u]",
            "+ | 0x001b |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary3Intensity [int8u]",
            "+ | 0x0020 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4X [int16u]",
            "+ | 0x0021 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4Y [int16u]",
            "+ | 0x0022 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary4Intensity [int8u]",
            "+ | 0x0024 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5X [int16u]",
            "+ | 0x0025 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5Y [int16u]",
            "+ | 0x0026 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary5Intensity [int8u]",
            "+ | 0x0028 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6X [int16u]",
            "+ | 0x0029 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6Y [int16u]",
            "+ | 0x002a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Primary6Intensity [int8u]",
            "+ | 0x0030 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => WhitePointX [int16u]",
            "+ | 0x0031 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => WhitePointY [int16u]",
            "+ | 0x0032 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRX [int16u]",
            "+ | 0x0033 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRY [int16u]",
            "+ | 0x0034 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointRIntensity [int8u]",
            "+ | 0x0036 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGX [int16u]",
            "+ | 0x0037 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGY [int16u]",
            "+ | 0x0038 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointGIntensity [int8u]",
            "+ | 0x003a |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBX [int16u]",
            "+ | 0x003b |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBY [int16u]",
            "+ | 0x003c |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => ColorPointBIntensity [int8u]",
            "+ | 0x4000 |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => EnhancedCurrentHue [int16u]",
            "+ | 0x4001 |        | server | RAM |           |       |                 0x01 | 1 | 0 | 65344 | 0 => EnhancedColorMode [enum8]",
            "+ | 0x4002 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => ColorLoopActive [int8u]",
            "+ | 0x4003 |        | server | RAM |           |       |                 0x00 | 1 | 0 | 65344 | 0 => ColorLoopDirection [int8u]",
            "+ | 0x4004 |        | server | RAM |           |       |               0x0019 | 1 | 0 | 65344 | 0 => ColorLoopTime [int16u]",
            "+ | 0x400a |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ColorCapabilities [bitmap16]",
            "+ | 0x400b |        | server | RAM |           |       |               0x0000 | 1 | 0 | 65344 | 0 => ColorTempPhysicalMinMireds [int16u]",
            "+ | 0x400c |        | server | RAM |           |       |               0xFEFF | 1 | 0 | 65344 | 0 => ColorTempPhysicalMaxMireds [int16u]",
            "+ | 0x400d |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => CoupleColorTempToLevelMinMireds [int16u]",
            "+ | 0x4010 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => StartUpColorTemperatureMireds [int16u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    5 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Temperature Measurement",
          "code": "0x0402",
          "define": "TEMPERATURE_MEASUREMENT_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Temperature Measurement",
          "code": "0x0402",
          "define": "TEMPERATURE_MEASUREMENT_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MeasuredValue [int16s]",
            "+ | 0x0001 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MinMeasuredValue [int16s]",
            "+ | 0x0002 |        | server | RAM |           |       |               0x8000 | 1 | 0 | 65344 | 0 => MaxMeasuredValue [int16s]",
            "- | 0x0003 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Tolerance [int16u]",
            "+ | 0xfffd |        | server | RAM |           |       |                    4 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "attributes": [
            "+ | 0xfffd |        | client | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => Occupancy [OccupancyBitmap]",
            "+ | 0x0001 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => OccupancySensorType [OccupancySensorTypeEnum]",
            "+ | 0x0002 |        | server | RAM |           |       |                      | 1 | 0 | 65344 | 0 => OccupancySensorTypeBitmap [OccupancySensorTypeBitmap]",
            "+ | 0xfffc |        | server | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | RAM |           |       |                    3 | 1 | 0 | 65344 | 0 => ClusterRevision [int16u]"
          ]
        }
      ]
    },
    {
      "name": "Anonymous Endpoint Type",
      "deviceTypeName": "MA-secondary-network-commissioning",
      "deviceTypeCode": 61442,
      "deviceTypeProfileId": 259,
      "clusters": [
        {
          "name": "Network Commissioning",
          "code": "0x0031",
          "define": "NETWORK_COMMISSIONING_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => ScanNetworks",
            "0x0002 |        | client | 1 | 0 => AddOrUpdateWiFiNetwork",
            "0x0003 |        | client | 1 | 0 => AddOrUpdateThreadNetwork",
            "0x0004 |        | client | 1 | 0 => RemoveNetwork",
            "0x0006 |        | client | 1 | 0 => ConnectNetwork",
            "0x0008 |        | client | 1 | 0 => ReorderNetwork"
          ],
          "attributes": [
            "- | 0xfffc |        | client | RAM |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | client | RAM |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        },
        {
          "name": "Network Commissioning",
          "code": "0x0031",
          "define": "NETWORK_COMMISSIONING_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0001 |        | server | 0 | 1 => ScanNetworksResponse",
            "0x0005 |        | server | 0 | 1 => NetworkConfigResponse",
            "0x0007 |        | server | 0 | 1 => ConnectNetworkResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => MaxNetworks [int8u]",
            "+ | 0x0001 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => Networks [array]",
            "+ | 0x0002 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ScanMaxTimeSeconds [int8u]",
            "+ | 0x0003 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => ConnectMaxTimeSeconds [int8u]",
            "+ | 0x0004 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => InterfaceEnabled [boolean]",
            "+ | 0x0005 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => LastNetworkingStatus [NetworkCommissioningStatus]",
            "+ | 0x0006 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => LastNetworkID [octet_string]",
            "+ | 0x0007 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => LastConnectErrorValue [int32s]",
            "- | 0xfff8 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => GeneratedCommandList [array]",
            "- | 0xfff9 |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AcceptedCommandList [array]",
            "- | 0xfffb |        | server | Ext |           |       |                      | 1 | 1 | 65534 | 0 => AttributeList [array]",
            "+ | 0xfffc |        | server | Ext |           |       |                    0 | 1 | 1 | 65534 | 0 => FeatureMap [bitmap32]",
            "+ | 0xfffd |        | server | Ext |           |       |                    1 | 1 | 1 | 65534 | 0 => ClusterRevision [int16u]"
          ]
        }
      ]
    }
  ],
  "endpoints": [
    {
      "endpointTypeName": "MA-rootdevice",
      "endpointTypeIndex": 0,
      "profileId": 259,
      "endpointId": 0,
      "networkId": 0,
      "endpointVersion": 1,
      "deviceIdentifier": 22
    },
    {
      "endpointTypeName": "MA-onofflight",
      "endpointTypeIndex": 1,
      "profileId": 259,
      "endpointId": 1,
      "networkId": 0,
      "endpointVersion": 1,
      "deviceIdentifier": 256,
      "parentEndpointIdentifier": 0
    },
    {
      "endpointTypeName": "MA-onofflight",
      "endpointTypeIndex": 2,
      "profileId": 259,
      "endpointId": 2,
      "networkId": 0,
      "endpointVersion": 1,
      "deviceIdentifier": 256,
      "parentEndpointIdentifier": 1
    },
    {
      "endpointTypeName": "Anonymous Endpoint Type",
      "endpointTypeIndex": 3,
      "profileId": 259,
      "endpointId": 65534,
      "networkId": 0,
      "endpointVersion": 1,
      "deviceIdentifier": 61442
    }
  ]
}