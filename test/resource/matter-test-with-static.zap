{
  "fileFormat": 1,
  "featureLevel": 95,
  "creator": "zap",
  "keyValuePairs": [
    "commandDiscovery = 1",
    "defaultResponsePolicy = always",
    "manufacturerCodes = 0x1002",
    "generateStaticTemplates = true"
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
      "path": "../gen-template/matter/gen-test-no-static.json",
      "type": "gen-templates-json",
      "category": "matter",
      "version": "test-matter"
    }
  ],
  "endpointTypes": [
    {
      "name": "Anonymous Endpoint Type",
      "deviceTypeName": "ZLL-dimmablelight",
      "deviceTypeCode": 256,
      "deviceTypeProfileId": 260,
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
          ]
        },
        {
          "name": "Identify",
          "code": "0x0003",
          "define": "IDENTIFY_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |          0x0000 | 1 | 0 | 65534 | 0 => IdentifyTime [int16u]"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => AddGroup",
            "0x0001 |        | client | 1 | 0 => ViewGroup",
            "0x0002 |        | client | 1 | 0 => GetGroupMembership",
            "0x0003 |        | client | 1 | 0 => RemoveGroup",
            "0x0004 |        | client | 1 | 0 => RemoveAllGroups",
            "0x0005 |        | client | 1 | 0 => AddGroupIfIdentifying"
          ]
        },
        {
          "name": "Groups",
          "code": "0x0004",
          "define": "GROUPS_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 0 | 1 => AddGroupResponse",
            "0x0001 |        | server | 0 | 1 => ViewGroupResponse",
            "0x0002 |        | server | 0 | 1 => GetGroupMembershipResponse",
            "0x0003 |        | server | 0 | 1 => RemoveGroupResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 | 1 | 0 | 65534 | 0 => NameSupport [bitmap8]"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => AddScene",
            "0x0001 |        | client | 1 | 0 => ViewScene",
            "0x0002 |        | client | 1 | 0 => RemoveScene",
            "0x0003 |        | client | 1 | 0 => RemoveAllScenes",
            "0x0004 |        | client | 1 | 0 => StoreScene",
            "0x0005 |        | client | 1 | 0 => RecallScene",
            "0x0006 |        | client | 1 | 0 => GetSceneMembership",
            "0x0040 |        | client | 1 | 0 => EnhancedAddScene",
            "0x0041 |        | client | 1 | 0 => EnhancedViewScene",
            "0x0042 |        | client | 1 | 0 => CopyScene"
          ]
        },
        {
          "name": "Scenes",
          "code": "0x0005",
          "define": "SCENES_CLUSTER",
          "side": "server",
          "enabled": 1,
          "commands": [
            "0x0000 |        | server | 0 | 1 => AddSceneResponse",
            "0x0001 |        | server | 0 | 1 => ViewSceneResponse",
            "0x0002 |        | server | 0 | 1 => RemoveSceneResponse",
            "0x0003 |        | server | 0 | 1 => RemoveAllScenesResponse",
            "0x0004 |        | server | 0 | 1 => StoreSceneResponse",
            "0x0006 |        | server | 0 | 1 => GetSceneMembershipResponse"
          ],
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |            0x00 | 1 | 0 | 65534 | 0 => SceneCount [int8u]",
            "+ | 0x0001 |        | server | RAM |           |       |            0x00 | 1 | 0 | 65534 | 0 => CurrentScene [int8u]",
            "+ | 0x0002 |        | server | RAM |           |       |          0x0000 | 1 | 0 | 65534 | 0 => CurrentGroup [group_id]",
            "+ | 0x0003 |        | server | RAM |           |       |            0x00 | 1 | 0 | 65534 | 0 => SceneValid [boolean]",
            "+ | 0x0004 |        | server | RAM |           |       |                 | 1 | 0 | 65534 | 0 => NameSupport [bitmap8]"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => Off",
            "0x0001 |        | client | 1 | 0 => On",
            "0x0002 |        | client | 1 | 0 => Toggle",
            "0x0040 |        | client | 1 | 0 => OffWithEffect",
            "0x0041 |        | client | 1 | 0 => OnWithRecallGlobalScene",
            "0x0042 |        | client | 1 | 0 => OnWithTimedOff"
          ]
        },
        {
          "name": "On/Off",
          "code": "0x0006",
          "define": "ON_OFF_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |            0x00 | 1 | 0 | 65534 | 0 => OnOff [boolean]",
            "+ | 0x4000 |        | server | RAM |           |       |            0x01 | 1 | 0 | 65534 | 0 => GlobalSceneControl [boolean]",
            "+ | 0x4001 |        | server | RAM |           |       |          0x0000 | 1 | 0 | 65534 | 0 => OnTime [int16u]",
            "+ | 0x4002 |        | server | RAM |           |       |          0x0000 | 1 | 0 | 65534 | 0 => OffWaitTime [int16u]",
            "+ | 0x4003 |        | server | RAM |           |       |                 | 1 | 0 | 65534 | 0 => StartUpOnOff [OnOffStartUpOnOff]"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "client",
          "enabled": 0,
          "commands": [
            "0x0000 |        | client | 1 | 0 => MoveToLevel",
            "0x0001 |        | client | 1 | 0 => Move",
            "0x0002 |        | client | 1 | 0 => Step",
            "0x0003 |        | client | 1 | 0 => Stop",
            "0x0004 |        | client | 1 | 0 => MoveToLevelWithOnOff",
            "0x0005 |        | client | 1 | 0 => MoveWithOnOff",
            "0x0006 |        | client | 1 | 0 => StepWithOnOff",
            "0x0007 |        | client | 1 | 0 => StopWithOnOff"
          ]
        },
        {
          "name": "Level Control",
          "code": "0x0008",
          "define": "LEVEL_CONTROL_CLUSTER",
          "side": "server",
          "enabled": 1,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |            0x00 | 1 | 0 | 65534 | 0 => CurrentLevel [int8u]"
          ]
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "client",
          "enabled": 1
        },
        {
          "name": "Occupancy Sensing",
          "code": "0x0406",
          "define": "OCCUPANCY_SENSING_CLUSTER",
          "side": "server",
          "enabled": 0,
          "attributes": [
            "+ | 0x0000 |        | server | RAM |           |       |                 | 1 | 0 | 65534 | 0 => Occupancy [OccupancyBitmap]",
            "+ | 0x0001 |        | server | RAM |           |       |                 | 1 | 0 | 65534 | 0 => OccupancySensorType [OccupancySensorTypeEnum]",
            "+ | 0x0002 |        | server | RAM |           |       |                 | 1 | 0 | 65534 | 0 => OccupancySensorTypeBitmap [OccupancySensorTypeBitmap]"
          ]
        }
      ]
    }
  ],
  "endpoints": [
    {
      "endpointTypeName": "Anonymous Endpoint Type",
      "endpointTypeIndex": 0,
      "profileId": "0x0104",
      "endpointId": 1,
      "networkId": "Primary",
      "endpointVersion": null,
      "deviceIdentifier": null
    }
  ]
}