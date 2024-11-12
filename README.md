![ZCL Advanced Platform](src-electron/icons/zap_128x128.png)

# ZCL Advanced Platform

[![Build and release packages](https://github.com/project-chip/zap/actions/workflows/release.yml/badge.svg)](https://github.com/project-chip/zap/actions/workflows/release.yml)
[![Zigbee code regeneration](https://github.com/project-chip/zap/actions/workflows/zigbee.yml/badge.svg)](https://github.com/project-chip/zap/actions/workflows/zigbee.yml)
[![Matter code regeneration](https://github.com/project-chip/zap/actions/workflows/matter.yml/badge.svg)](https://github.com/project-chip/zap/actions/workflows/matter.yml)

## [What is ZAP?](https://docs.silabs.com/zap-tool/1.0.0/zap-start/)

ZAP is a generic generation engine and user interface for applications and libraries based on Zigbee Cluster Library, the specification developed by the [Connectivity Standards Alliance](https://csa-iot.org/).

ZAP allows you to perform the following:

- perform SDK-specific customized generation of all global artifacts (constants, types, IDs, etc) based on the ZCL specification
- provide UI for the end-user to select specific application configuration (clusters, attributes, commands, etc.)
- perform SDK-specific customized generation of all user selected configuration artifacts (application configuration, endpoint configuration, etc) based on ZCL specification and customer-provided application configuration.

ZAP is a generic templating engine. Examples are provided for how to generate artifacts for the C language environment, but one could easily add new templates for other language environments, such as C++, java, node.js, python or any other.

## Quick setup

Refer to [Setup Instructions](https://docs.silabs.com/zap-tool/1.0.0/zap-getting-started/zap-installation)

### Source code

Refer to [development instructions](docs/development-instructions.md) for more details.

## License

This software is licensed under [Apache 2.0 license](LICENSE.txt).

## Usage Documentation

- [ZAP Fundamentals](https://docs.silabs.com/zap-tool/1.0.0/zap-fundamentals/)
- [ZAP User's Guide](https://docs.silabs.com/zap-tool/1.0.0/zap-users-guide/)

## Detailed Developer Documentation

- [ZAP Template Helpers](docs/helpers.md)
- [ZAP External Template Helpers](docs/external-helpers.md)
- [FAQ/Developer dependencies](docs/faq.md)
- [Release instructions](docs/release.md)
- [Development Instructions](docs/development-instructions.md)
- [Design](docs/design.md)
- [Template tutorial](docs/template-tutorial.md)
- [SDK integration guideline](docs/sdk-integration.md)
- [Custom ZCL entities design](docs/custom-zcl.md)
- [API](docs/api.md)
- [Coding standard](docs/coding-standard.md)
