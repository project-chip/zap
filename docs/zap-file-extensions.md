# ZAP File Extensions

## Overview

ZAP file extensions allow users to extend the functionality of existing ZAP configuration files(.zap) by merging additional data from extension files(.zapExtension). This feature is particularly useful for adding new clusters, attributes, or other configuration elements to an existing endpoint identifier without modifying the base ZAP file. Note that if the extension element is already present in the base configuration then it will not be modified. Also note that if you open a .zap baseline file along with a .zapExtension extension file and then save the configuration then this will always produce a single .zap file which includes the extension configuration.

## How It Works

1. **Base ZAP File(.zap)**: The primary configuration file containing the initial setup. eg [zapFile](../test/resource/lighting-matter.zap)
2. **Extension ZAP File(.zapExtension)**: A supplementary file that adds to elements in the base file. eg [zapFileExtension](../test/resource/zapExtension1.zapExtension). This file shows how everything is wrapped within endpoints object and linked to the endpoint identifier.
3. **Merging Process**: During the import process, the extension file's content is merged into the base file content. However, if you save this imported file along with its extension then this saves the content in one explicit file.

## Usage

### Generation

[ZAP executable] generate --noUi --noServer -o [output directory path] --packageMatch fuzzy --zcl [path to zcl.json in SDK] --generationTemplate [path to generation templates.json in SDK] --in [path to input zap file] --inE [path to zap extension file] --noLoadingFailure --appendGenerationSubdirectory

### Launching UI

[ZAP executable] --packageMatch fuzzy --zcl [path to zcl.json in SDK] --generationTemplate [path to generation templates.json in SDK] --in [path to input zap file] --inE [path to zap extension file] --noLoadingFailure --appendGenerationSubdirectory

### References

- ZAP executable -> [ZAP binary](https://github.com/project-chip/zap/releases) or `node src-script/zap-start.js`
