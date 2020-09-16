{
  "writeTime": "Fri Aug 07 2020 11:35:10 GMT-0400 (Eastern Daylight Time)",
  "creator": "zap",
  "keyValuePairs": [
    {
      "key": "filePath",
      "value": "/home/timotej/git/zap/test.json"
    }
  ],
  "package": [
    {
      "path": "/home/timotej/git/zap/test/zcl/zcl-test.properties",
      "version": "ZCL Test Data",
      "type": "zcl-properties"
    },
    {
      "path": "/home/timotej/git/zap/test/gen-template/zigbee/gen-templates.json",
      "version": "test-v1",
      "type": "gen-templates-json"
    }
  ],
  "endpoints": [],
  "endpointTypes": [
    {
      "name": "default",
      "deviceTypeName": "SE1.2-ESP",
      "deviceTypeCode": "0x0500",
      "clusters": [
        {
          "name": "Basic",
          "code": 0,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Basic",
          "code": 0,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
              "code": "0x0000",
              "mfgCode": null,
              "included": 1,
              "external": 1,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x03",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "application version",
              "code": "0x0001",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 1,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "stack version",
              "code": "0x0002",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 1,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "hardware version",
              "code": "0x0003",
              "mfgCode": null,
              "included": 1,
              "external": 1,
              "flash": 1,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "manufacturer name",
              "code": "0x0004",
              "mfgCode": null,
              "included": 1,
              "external": 1,
              "flash": 0,
              "singleton": 1,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "model identifier",
              "code": "0x0005",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 1,
              "singleton": 1,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "date code",
              "code": "0x0006",
              "mfgCode": null,
              "included": 1,
              "external": 1,
              "flash": 1,
              "singleton": 1,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "power source",
              "code": "0x0007",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Power Configuration",
          "code": 1,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [],
          "attributes": []
        },
        {
          "name": "Power Configuration",
          "code": 1,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": []
        },
        {
          "name": "Price",
          "code": 1792,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [
            {
              "name": "GetCurrentPrice",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "PriceAcknowledgement",
              "code": 2,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Price",
          "code": 1792,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "PublishPrice",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "side": "client",
          "enabled": 1,
          "commands": [],
          "attributes": []
        },
        {
          "name": "Device Temperature Configuration",
          "code": 2,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": []
        },
        {
          "name": "Demand Response and Load Control",
          "code": 1793,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [
            {
              "name": "ReportEventStatus",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "GetScheduledEvents",
              "code": 1,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "utility enrollment group",
              "code": "0x0000",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "start randomization minutes",
              "code": "0x0001",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x1E",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "duration randomization minutes",
              "code": "0x0002",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x00",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "device class value",
              "code": "0x0003",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Demand Response and Load Control",
          "code": 1793,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "LoadControlEvent",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "CancelLoadControlEvent",
              "code": 1,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "CancelAllLoadControlEvents",
              "code": 2,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "Identify",
              "code": 0,
              "mfgCode": null,
              "incoming": 1,
              "outgoing": 1
            },
            {
              "name": "IdentifyQuery",
              "code": 1,
              "mfgCode": null,
              "incoming": 1,
              "outgoing": 1
            },
            {
              "name": "EZModeInvoke",
              "code": 2,
              "mfgCode": null,
              "incoming": 1,
              "outgoing": 1
            },
            {
              "name": "UpdateCommissionState",
              "code": 3,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": []
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
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": []
        },
        {
          "name": "Messaging",
          "code": 1795,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [
            {
              "name": "GetLastMessage",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "MessageConfirmation",
              "code": 1,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Messaging",
          "code": 1795,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "DisplayMessage",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "CancelMessage",
              "code": 1,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Time",
          "code": 10,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Time",
          "code": 10,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "time",
              "code": "0x0000",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "time status",
              "code": "0x0001",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Key Establishment",
          "code": 2048,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [
            {
              "name": "InitiateKeyEstablishmentRequest",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "EphemeralDataRequest",
              "code": 1,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "ConfirmKeyDataRequest",
              "code": 2,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "key establishment suite (client)",
              "code": "0x0000",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
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
          "name": "Key Establishment",
          "code": 2048,
          "mfgCode": null,
          "side": "either",
          "enabled": 0,
          "commands": [
            {
              "name": "TerminateKeyEstablishment",
              "code": 3,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": []
        },
        {
          "name": "Key Establishment",
          "code": 2048,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "InitiateKeyEstablishmentResponse",
              "code": 0,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "EphemeralDataResponse",
              "code": 1,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "ConfirmKeyDataResponse",
              "code": 2,
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0001",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "key establishment suite (server)",
              "code": "0x0000",
              "mfgCode": null,
              "included": 1,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ]
        }
      ]
    }
  ]
}
