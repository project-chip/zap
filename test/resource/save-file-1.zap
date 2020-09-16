{
  "writeTime": "Mon Jul 06 2020 12:58:26 GMT-0400 (Eastern Daylight Time)",
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
    }
  ],
  "endpointTypes": [
    {
      "name": "Saved endpoint type",
      "deviceTypeName": "TA-billingunit",
      "deviceTypeCode": "0x0203",
      "clusters": [
        {
          "name": "Basic",
          "code": 0,
          "mfgCode": null,
          "side": "client",
          "enabled": 0,
          "commands": [
            {
              "name": "ResetToFactoryDefaults",
              "code": "0x00",
              "mfgCode": null,
              "incoming": 1,
              "outgoing": 1
            }
          ],
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
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
              "external": 0,
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
              "name": "power source",
              "code": "0x0007",
              "mfgCode": null,
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
          "attributes": [],
          "commands": []
        },
        {
          "name": "Power Configuration",
          "code": 1,
          "mfgCode": null,
          "side": "server",
          "enabled": 0,
          "attributes": [
            {
              "name": "mains voltage",
              "code": "0x0000",
              "mfgCode": null,
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
              "name": "mains frequency",
              "code": "0x0001",
              "mfgCode": null,
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
              "name": "mains alarm mask",
              "code": "0x0010",
              "mfgCode": null,
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
              "name": "mains voltage min threshold",
              "code": "0x0011",
              "mfgCode": null,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0x0000",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            },
            {
              "name": "mains voltage max threshold",
              "code": "0x0012",
              "mfgCode": null,
              "external": 0,
              "flash": 0,
              "singleton": 0,
              "bounded": 0,
              "defaultValue": "0xFFFF",
              "reportable": 0,
              "minInterval": 0,
              "maxInterval": 65344,
              "reportableChange": 0
            }
          ],
          "commands": []
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
          "name": "Information",
          "code": 2304,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
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
          ],
          "commands": [
            {
              "name": "RequestInformation",
              "code": "0x00",
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "PushInformationResponse",
              "code": "0x01",
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            }
          ]
        },
        {
          "name": "Information",
          "code": 2304,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "RequestInformationResponse",
              "code": "0x00",
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "PushInformation",
              "code": "0x01",
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
              "name": "node description",
              "code": "0x0000",
              "mfgCode": null,
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
              "name": "delivery enable",
              "code": "0x0001",
              "mfgCode": null,
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
              "name": "enable secure configuration",
              "code": "0x0003",
              "mfgCode": null,
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
          "name": "Identify",
          "code": 3,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "commands": [],
          "attributes": []
        },
        {
          "name": "Groups",
          "code": 4,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [],
          "attributes": []
        },
        {
          "name": "Billing",
          "code": 2562,
          "mfgCode": null,
          "side": "client",
          "enabled": 1,
          "attributes": [
            {
              "name": "cluster revision",
              "code": "0xFFFD",
              "mfgCode": null,
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
          ],
          "commands": []
        },
        {
          "name": "Billing",
          "code": 2562,
          "mfgCode": null,
          "side": "server",
          "enabled": 1,
          "commands": [
            {
              "name": "CheckBillStatus",
              "code": "0x00",
              "mfgCode": null,
              "incoming": 0,
              "outgoing": 1
            },
            {
              "name": "SendBillRecord",
              "code": "0x01",
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
              "name": "user id",
              "code": "0x0000",
              "mfgCode": null,
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
              "name": "service id",
              "code": "0x0010",
              "mfgCode": null,
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
              "name": "service provider id",
              "code": "0x0011",
              "mfgCode": null,
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
              "name": "session interval",
              "code": "0x0012",
              "mfgCode": null,
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
              "name": "timestamp",
              "code": "0x0020",
              "mfgCode": null,
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
        }
      ]
    }
  ]
}
