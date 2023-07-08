![ZCL Advanced Platform](src-electron/icons/zap_128x128.png)

# ZCL Advanced Platform

[![Build and release packages](https://github.com/project-chip/zap/actions/workflows/release.yml/badge.svg)](https://github.com/project-chip/zap/actions/workflows/release.yml)
[![Zigbee code regeneration](https://github.com/project-chip/zap/actions/workflows/zigbee.yml/badge.svg)](https://github.com/project-chip/zap/actions/workflows/zigbee.yml)
[![Matter code regeneration](https://github.com/project-chip/zap/actions/workflows/matter.yml/badge.svg)](https://github.com/project-chip/zap/actions/workflows/matter.yml)

## What is ZAP?

ZAP is a generic generation engine and user interface for applications and libraries based on Zigbee Cluster Library, the specification developed by the [Connectivity Standards Alliance](https://csa-iot.org/).

ZAP allows you to perform the following:

- perform SDK-specific customized generation of all global artifacts (constants, types, IDs, etc) based on the ZCL specification
- provide UI for the end-user to select specific application configuration (clusters, attributes, commands, etc.)
- perform SDK-specific customized generation of all user selected configuration artifacts (application configuration, endpoint configuration, etc) based on ZCL specification and customer-provided application configuration.

ZAP is a generic templating engine. Examples are provided for how to generate artifacts for the C language environment, but one could easily add new templates for other language environments, such as C++, java, node.js, python or any other.

## Quick setup

### Node Version

- Node LTS: 18.16.0

### Prebuilt binaries

On the [release page](https://github.com/project-chip/zap/releases), there are two flavors of prebuilt binaries.

- Official release:
  Verified builds with dedicated Zigbee test suites.
  The release name format is `vYYYY.DD.MM`
- Pre-release:
  Builds with the latest features and are NOT verified with dedicated Zigbee test suites.
  The release name format is `vYYYY.DD.MM-nightly`

### Source code

Refer to [development instructions](docs/development-instructions.md) for more details.

## License

This software is licensed under [Apache 2.0 license](LICENSE.txt).

## Detailed Documentation

- [FAQ](docs/faq.md)
- [Release instructions](docs/release.md)
- [Development Instructions](docs/development-instructions.md)
- [Design](docs/design.md)
- [Template tutorial](docs/template-tutorial.md)
- [SDK integration guideline](docs/sdk-integration.md)
- [Access control features](docs/access.md)
- [Custom ZCL entities design](docs/custom-zcl.md)
- [API](docs/api.md)
- [Coding standard](docs/coding-standard.md)
- [Notifications](docs/notifications.md)
- [Install ZAP from source on Windows](docs/ZAP-on-Windows.md)
