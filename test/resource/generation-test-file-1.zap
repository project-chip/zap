{
  "writeTime": "Thu Sep 24 2020 12:27:31 GMT-0400 (Eastern Daylight Time)",
  "featureLevel": 1,
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
      "key": "filePath",
      "value": "/Users/brdandu/Downloads/generation-test-file-1.zap"
    },
    {
      "key": "manufacturerCodes",
      "value": "0x1002"
    }
  ],
  "package": [
    {
      "path": "/Users/brdandu/git/zap/zap_latest/zap/zcl-builtin/silabs/zcl.json",
      "version": "ZCL Test Data",
      "type": "zcl-properties"
    },
    {
      "path": "/Users/brdandu/git/zap/zap_latest/zap/test/gen-template/zigbee/gen-templates.json",
      "version": "test-v1",
      "type": "gen-templates-json"
    }
  ],
  "endpointTypes": [
    {
      "name": "Anonymous Endpoint Type",
      "deviceTypeName": "HA-onofflightswitch",
      "deviceTypeCode": "0x0103",
      "clusters": [
        {
          "name": "Basic",
          "code": 0,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ],
          "commands": []
        },
        {
          "name": "Basic",
          "code": 0,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "ZCL version",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x03",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "power source",
              "code": 7,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ],
          "commands": []
        },
        {
          "name": "Identify",
          "code": 3,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "Identify",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 1
            },
            {
              "name": "IdentifyQuery",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Identify",
          "code": 3,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "identify time",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ],
          "commands": [
            {
              "name": "IdentifyQueryResponse",
              "code": 0,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 1
            }
          ]
        },
        {
          "name": "On/off",
          "code": 6,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "Off",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "On",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "Toggle",
              "code": 2,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "On/off",
          "code": 6,
          "mfgCode": null,
          "side": "server",
          "enabled": 0,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "on/off",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 1,
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
      "deviceTypeName": "CBA-onofflightswitch",
      "deviceTypeCode": "0x0103",
      "clusters": [
        {
          "name": "Basic",
          "code": 0,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ],
          "commands": []
        },
        {
          "name": "Basic",
          "code": 0,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "ZCL version",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x03",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "power source",
              "code": 7,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ],
          "commands": []
        },
        {
          "name": "Power Configuration",
          "code": 1,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Power Configuration",
          "code": 1,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "battery percentage remaining",
              "code": 33,
              "mfgCode": null,
              "included": 0,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 1,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Device Temperature Configuration",
          "code": 2,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Device Temperature Configuration",
          "code": 2,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "current temperature",
              "code": 0,
              "mfgCode": null,
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
        },
        {
          "name": "Identify",
          "code": 3,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "Identify",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 1
            },
            {
              "name": "IdentifyQuery",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Identify",
          "code": 3,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "IdentifyQueryResponse",
              "code": 0,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "identify time",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Groups",
          "code": 4,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "AddGroup",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "ViewGroup",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "GetGroupMembership",
              "code": 2,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "RemoveGroup",
              "code": 3,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "RemoveAllGroups",
              "code": 4,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "AddGroupIfIdentifying",
              "code": 5,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Groups",
          "code": 4,
          "mfgCode": null,
          "side": "server",
          "enabled": 0,
          "commands": [
            {
              "name": "AddGroupResponse",
              "code": 0,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "ViewGroupResponse",
              "code": 1,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "GetGroupMembershipResponse",
              "code": 2,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "RemoveGroupResponse",
              "code": 3,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "name support",
              "code": 0,
              "mfgCode": null,
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
        },
        {
          "name": "Scenes",
          "code": 5,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "AddScene",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "ViewScene",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "RemoveScene",
              "code": 2,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "RemoveAllScenes",
              "code": 3,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "StoreScene",
              "code": 4,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "RecallScene",
              "code": 5,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "GetSceneMembership",
              "code": 6,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Scenes",
          "code": 5,
          "mfgCode": null,
          "side": "server",
          "enabled": 0,
          "commands": [
            {
              "name": "AddSceneResponse",
              "code": 0,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "ViewSceneResponse",
              "code": 1,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "RemoveSceneResponse",
              "code": 2,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "RemoveAllScenesResponse",
              "code": 3,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "StoreSceneResponse",
              "code": 4,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "GetSceneMembershipResponse",
              "code": 6,
              "mfgCode": null,
              "source": "server",
              "incoming": 1,
              "outgoing": 0
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "scene count",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "current scene",
              "code": 1,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "current group",
              "code": 2,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "scene valid",
              "code": 3,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "name support",
              "code": 4,
              "mfgCode": null,
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
        },
        {
          "name": "On/off",
          "code": 6,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "Off",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "On",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "Toggle",
              "code": 2,
              "mfgCode": null,
              "source": "client",
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "On/off",
          "code": 6,
          "mfgCode": null,
          "side": "server",
          "enabled": 0,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "on/off",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 1,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "On/off Switch Configuration",
          "code": 7,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "On/off Switch Configuration",
          "code": 7,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "switch type",
              "code": 0,
              "mfgCode": null,
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
              "name": "switch actions",
              "code": 16,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Alarms",
          "code": 9,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [
            {
              "name": "ResetAlarm",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "ResetAllAlarms",
              "code": 1,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 0
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Alarms",
          "code": 9,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "Alarm",
              "code": 0,
              "mfgCode": null,
              "source": "server",
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Commissioning",
          "code": 21,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [
            {
              "name": "RestartDevice",
              "code": 0,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 0
            },
            {
              "name": "ResetStartupParameters",
              "code": 3,
              "mfgCode": null,
              "source": "client",
              "incoming": 1,
              "outgoing": 0
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        },
        {
          "name": "Commissioning",
          "code": 21,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "RestartDeviceResponse",
              "code": 0,
              "mfgCode": null,
              "source": "server",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "SaveStartupParametersResponse",
              "code": 1,
              "mfgCode": null,
              "source": "server",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "RestoreStartupParametersResponse",
              "code": 2,
              "mfgCode": null,
              "source": "server",
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "ResetStartupParametersResponse",
              "code": 3,
              "mfgCode": null,
              "source": "server",
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": 65533,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "short address",
              "code": 0,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0xFFFF",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "extended pan id",
              "code": 1,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0xFFFFFFFFFFFFFFFF",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "pan id",
              "code": 2,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0xFFFF",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "channel mask",
              "code": 3,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x07FFF800",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "protocol version",
              "code": 4,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x02",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "stack profile",
              "code": 5,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x02",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "startup control",
              "code": 6,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x03",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "trust center address",
              "code": 16,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0000000000000000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "network key",
              "code": 18,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00000000000000000000000000000000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "use insecure join",
              "code": 19,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x01",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "preconfigured link key",
              "code": 20,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00000000000000000000000000000000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "network key sequence number",
              "code": 21,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "network key type",
              "code": 22,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x05",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "network manager address",
              "code": 23,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "scan attempts",
              "code": 32,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x05",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "time between scans",
              "code": 33,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0064",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "rejoin interval",
              "code": 34,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x003C",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "max rejoin interval",
              "code": 35,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0E10",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "indirect poll rate",
              "code": 48,
              "mfgCode": null,
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
              "name": "parent retry threshold",
              "code": 49,
              "mfgCode": null,
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
              "name": "concentrator flag",
              "code": 64,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "concentrator radius",
              "code": 65,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0F",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "concentrator discovery time",
              "code": 66,
              "mfgCode": null,
              "included": 1,
              "storageOption": "RAM",
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
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
      "profileId": "0x0104",
      "endpointId": 1,
      "networkId": "Primary"
    },
    {
      "endpointTypeName": "Anonymous Endpoint Type",
      "endpointTypeIndex": 1,
      "profileId": "0x105",
      "endpointId": 2,
      "networkId": "Primary"
    }
  ]
}