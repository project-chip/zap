# Upgrading ZAP Files with SDK upgrades

## Overview

Upgrading ZAP files is a critical step when transitioning to newer versions of the SDK. This process ensures compatibility with the latest features, bug fixes, and improvements provided by the SDK. By following the upgrade guidelines, you can maintain the integrity of your ZAP configuration files and avoid potential issues during development or deployment. This document outlines the steps and best practices for performing ZAP file upgrades effectively.

## How to upgrade the ZAP File?

Run the following command to update your .zap file

```bash
"${Path to ZAP executable} upgrade  --results ${path to .yaml file to see results of upgrade} -d ${directory containing ZAP files} --zcl ${path to zcl json file} --generationTemplate ${path to templates json file} --noLoadingFailure"
```

## How to add upgrade rules for .zap files through your SDK

### - Create an `upgrade-rules.json` file with the following information if one already does not exist

```json
{
  "version": 1,
  "description": "Upgrade Rules for Zigbee .zap files",
  "category": "matter",
  "upgradeRuleScripts": [
    {
      "path": "../../test/resource/test-matter-attribute-default-value-update.js",
      "priority": 101
    },
    {
      "path": "../../test/resource/test-attribute-default-value-update.js",
      "priority": 100
    }
  ]
}
```

**category**: Determines that these upgrade rules need to run for matter.

**upgradeRuleScripts**: List of upgrade rules to run on .zap files. Includes the relative path from upgrade-rules.json to the upgrade scripts written in Javascript. Priority determines the order of execution for the upgrade rules. The scripts are run in order of priority with lower number signifying higher priority.

### - Add relative path to the upgrade-rules.json from your zcl.json file

```json
"upgradeRules": "./upgrade-rules-matter.json"
```

### - Creating your own javascript upgrade rule

Add a postLoad function as below with api and context as parameters. Api argument gives access to all APIs that can be used within the `postLoad` function. [Refer to the post-import API documentation](../src-electron/util/post-import-api.js) . Context gives the state of the Data-Model/ZCL with respect to the .zap file that will be passied along to the API calls.

```javascript
// Example upgrade rule to update default value of Level Control cluster attribute in Matter.
async function postLoad(api, context) {
  let resMsg = ''
  let epts = await api.endpoints(context)
  for (let i = 0; i < epts.length; i++) {
    let clusters = await api.clusters(context, epts[i])
    for (let j = 0; j < clusters.length; j++) {
      if (clusters[j].code == '0x0008') {
        let attributes = await api.attributes(context, epts[i], clusters[j])
        for (let k = 0; k < attributes.length; k++) {
          let attributeCode = parseInt(attributes[k].code)
          let attributeValue = parseInt(attributes[k].defaultValue)
          if (
            attributeCode == 0 &&
            (attributeValue == 0 || !attributeValue || attributeValue == 'null')
          ) {
            let params = [
              {
                key: context.updateKey.attributeDefault,
                value: 10
              }
            ]
            await api.updateAttribute(
              context,
              epts[i],
              clusters[j],
              attributes[k],
              params
            )
            resMsg += `Current Value attribute's default value updated to 10 for Level Control cluster on endpoint ${epts[i].endpointIdentifier} ${epts[i].category}\n`
          }
        }
      }
    }
  }
  return { message: resMsg, status: 'automatic' } // Status can be 'nothing', 'automatic', 'user_verification', 'impossible'.
}

exports.postLoad = postLoad
```
