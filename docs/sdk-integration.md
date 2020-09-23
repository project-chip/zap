# SDK integration with zap tool

The purpose of this document is to provide SDK developers with the instructions how to integrate their and their customers' workflow with the zap tool.

SDK provides the embedded code and the implementation of the actual ZCL embedded layer. It may be written in C++, C or any other language. For the purpose of this document SDK is essentialy a body of code that implements the ZCL concepts, such as clusters, attributes, commands, etc.

This body of code can then use zap tool to gain:

- generation of static content, such as constant ID values, enums, etc.
- ability for the end-users to use UI to configure their application, and then generate application-specific content for their application itself.
- ability to feed extensions into the zap tool, to gain additional UI elements and other options that tailor zap tool for the specific SDK.

To gain these abilities, SDK should provide data to zap. Data required is:

- **ZCL metafiles**: these are the metafiles that provide information about ZCL specification to zap tool. Examples of this (and currently supported) are Silicon Labs XML ZCL metadata or the Zigbee own XML format of the ZCL metafiles. There is a [repo](https://github.com/project-chip/zcl-xml) where examples of these files are available.
  Zap project itself provides examples as well, see the `zcl-builtin/` directory. These are used internally for unit testing, but they are also packaged with the application as examples. They can be a good starting point for SDK developers, but ultimately it's the responsibility of SDK developers to provide the accurate XML packages for their SDK, and let zap know where they can be loaded from on the local hard drive.

- **generation templates**: these are actual zap templates (`*.zapt` files), which correspond to the files that need to be generated. The entry point is a JSON formatted file, usually named `gen-templates.json` which lists all the individual template files and additional options. This document will deal with the `gen-templates.json` file itself, however for development of each individual template, you can follow [template tutorial](template-tutorial.md)
