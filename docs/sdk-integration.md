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

- **generation templates and extensions**: these are actual zap templates (`*.zapt` files), which correspond to the files that need to be generated. The entry point is a JSON formatted file, usually named `gen-templates.json` which lists all the individual template files and additional extension options. This document will deal with the `gen-templates.json` file itself, however for development of each individual template, you can follow [template tutorial](template-tutorial.md)

These two categories are decoupled and loaded separately, mostly because their maintenace processes are different. The ZCL metafiles itself follow ZCL specs. If ZCL spec does not change, then there is no need to change ZCL metafiles.

The second category, however, follows the SDK itself. The generation templates will change, if the embedded code that they are targetting changes. Hence the breakup into these two categories.

## ZCL metafiles

Zap tool loads the ZCL metadata starting from the top-level ZCL metafile.
This file does not yet contain ZCL cluster/attributes itself, but mostly provides a top-level linking, pointing to individual XML files that contain individual clusters and such.

Currently supported formats for this file are:
|Type|Example|Description|
|----|-------|-----------|
|zcl.json|zcl-builtin/silabs/zcl.json|Native zap file, JSON format.|
|library.xml|zcl-builtin/dotdot/library.xml|Format of the aggregation file as currently planned for Zigbee official ZCL metadata. XML format.|
|zcl.properties|zcl-builtin/silabs/zcl-test.properties|Legacy file format, used by Silicon Labs in older ZCL products, such as appbuilder and Simplicity Studio. Should not be used for new work, as this format has some deficiencies that are not going to be fixed, and in there is no plan to keep adding future-proofing features to this file format. File format is a format of the java properties file.|

All these aggregation files, are refering to the XML files that contain your metadata. The format of these xml files are of 2 different types:
|Type|Example|Description|
|----|-------|-----------|
|Silicon Labs XML|zcl-builtin/silabs/general.xml|Silicon Labs format for the ZCL metadata, in existence since about 2016. Well tested format, however it does contain an occasional reference and data point that is not ZCL specific, but Silicon Labs implementation specific.|
|Zigbee XML|zcl-builtin/dotdot/Basic.xml|Zigbee supported format. At the time of writing this format is still work in progress, but one day it might become an official format of the ZCL metadata.|

If the aggregation metafile is of a type `zcl.json` or `zcl.properties`, then the XML files it refers to, are assumed to be of the Silicon Labs XML format.
If the aggregation metafile is using `library.xml` type, then the XML files provided by it are assumed to be of the Zigbee XML format.

## Generation templates and extensions

Generation templates and extensions are provided by the SDK. They are the input to the zap tool, that controls generation and tailors zap tool specifically to a given SDK, by providing the correct details of implementation that zap cares about.

Neither templates and extensions are mandatory. Zap tool can operate without them, simply as an editor of zap files, however there will be little use of the tool, if you can't generate useful output.
