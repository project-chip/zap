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

Entry point to zap reading the generation templates from the SDK is a file typically called `gen-templates.json`. This file provides ability of the SDK to configure zap to do the generation work it requires.

The file is a JSON-formatted JS object, with the following structure:
|Key|Value type|Value meaning|
|---|----------|-----------|------|
|name|String|Name of the template, will be shown in UI for selection|
|version|String|Version of the template, will be shown in the UI for selection|
|options|JS object, containing keys that can map to further key/value maps|This is a mechanism how to add additional category/key/value triplets to the package options. If the SDK wants to provide an additional generic categorized key/value properties, then you can provide an object here. Top-level keys map to either an Object itself, or a String, which will be interpreted as a path to a JSON serialized object. Objects should contain Strings as values of the elements. This data is loaded into the OPTIONS table. Toplevel key is used as OPTION*CATEGORY column, intermediate key is used as OPTION_CODE column, and the final String value of the sub-key is used as OPTION_LABEL column. These can be accessed from templates via `template_options` iterator, so you can iterate over a given category. They can also be access by the UI in certain cases.
|zcl|Object, keyed by ZCL entitites, containing arrays of ZCL modifications.|This is a mechanism how SDK can attach custom configurable data points to the ZCL entities. This could be used, for example, to configure special SDK-specific per-cluster properties, how to associate cluster with SDK directories for generation of build files, or any similar SDK customization that is based on ZCL entities.
|templates|Array of JS objects containing keys: \_path*, _name_, _output_|Lists the individual files. Path should be relative against the location of the `gen-template.json` itself, output is the name of the generated file, and name is a human readable name that might show in the UI.|
|helpers|Array of strings, representing relative paths.|This mechanism is how the SDK can create their own helpers in JavaScript, should that be needed. It is vastly prefered to stick to provided helpers. If you need additional helper it is also prefered to reach to ZAP developers to have your required feature added. This will ensure backwards compatibility and proper future-proofing and so on. However, as a last resort, you can add your own helpers using this mechanism. The files listed will be treated as node.js modules, and any exported symbol will be registered as a helper.|

Following sections describe to the details specific use for certain more complex areas of the `gen-template.json`.

## Templates key: options

Options are loaded into the database, keyed to the given generation package. While you can always used them in templates via the `template_options` key, certain keys have special meanings.
Following is the list of special meanings:

| Category          | Meaning                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| manufacturerCodes | This category backs a code/label map of valid manufacturer codes. They can be used in UI when selecting manufacturers. |

## Template key: zcl

ZCL customization are provided in a form of entity-based customization records. Let's learn by example:

```
{
  "zcl": {
    "cluster": {
      "toggleLedOnAttributeChange": {
        "type": "boolean",
        "configurability": "editable",
        "label": "Cluster will toggle LED when one of its attributes is changed.",
        "globalDefault": "false"
      },
      "sdkPath": {
        "type": "path",
        "configurability": "hidden",
        "defaults": "clusterPaths.json"
      }
    },
    "command": {
      "lcdMessage": {
        "type": "text",
        "configurability": "editable",
        "label": "LCD message to display when command received.",
        "defaults": [
          {
            "clusterCode": 0x0003,
            "commandCode": 0x00,
            "source": "client",
            "value": "Identifying!"
          }
        ]
      }
    }
  }
}
```

This example shows two configuration, provided by the SDK. It adds the following functionality:

- it adds to each cluster a new of property, called `toggleLedOnAttributeChange`. That property is of a type boolean and can be editable by end user. It is set to `false` by default. When ZAP UI will show the configuration of a cluster, it will show additional checkbox, labeled "Cluster will toggle LED when one of its attributes is changed." End user will have ability to turn that on or off, and that value will be recorded in the `*.zap` file. The recorded value will also be available in generation templates, so that the SDK developer can inject proper generation of the code for the handling of this custom property.
- it adds a new property of type `path` to each cluster, called "sdkPath". It's configurability is `hidden` which means that UI will not show this property. However, generation templates will have access to it. Default values are not stored directly here, but in an external file called `clusterPaths.json`, as specified by the key `"defaults": "clusterPaths.json"`. This can, for example, be used when you are using templates to generate a build file or some other compile-time artifact that needs to know directories or filenames of the cluster implementation code.
- it adds a property `lcdMessage` to each ZCL command. The SDK implementation could (as an example), show the given messages on the LCD that the device has built-in. Configurability is `editable`, which means that UI will show a text field for end-users to configure this value. Global defaults is missing, so it is `null`, but there is a provided default value for the ZCL `Identify` command, and it is configured so that it shows a text `Identifying!` on the LCD screen.

Obviously, all of the custom properties need to have an actual implementation on the SDK backing them up, zap is just a mechanism for configuring them, and passing them through to the generation templates, and neither knows, nor assumes what a real meaning of these properties may be.

Following are descriptions of some keys that you can configure:

| Key                                       | Possible Values                                       | Description                                                                                                                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| top-level key under `zcl`                 | `cluster`<br>`command`<br>`attribute`<br>`deviceType` | Specifies what kind of ZCL entity this customization applies to.                                                                                                                                                                                    |
| `type` key under individual customization | `boolean`<br>`integer`<br>`text`<br>`path`            | Specifies what type this particular customization option is. This mostly affects UI.                                                                                                                                                                |
| `globalDefault`                           | anything                                              | Specifies the default value for all entities, except the ones defined in the `defaults` array.                                                                                                                                                      |
| `configurability`                         | `hidden`<br>`visible`<br>`editable`                   | Specifies how zap UI will treat this value. If it's `hidden` it will not show it at all, if it's `visible` it will be shown, but users won't be able to change it, and if it's `editable`, then users can provide their own values for each entity. |
