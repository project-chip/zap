# Adding Externalized Helpers to the SDK

## Example

https://github.com/project-chip/zap/blob/master/test/gen-template/matter/external-addon-helper.js

## Introduction

This guide explains how to add and manage externalized helper functions in the SDK, which interacts with ZAP (ZCL Advanced Platform).

This design enables SDK developers to specify helper functions via the `gen-template.json` configuration file, which ZAP consumes during binary creation. The SDK can then call these helpers, passing in the necessary data, making them more flexible and reducing dependency on the internal ZAP codebase.

### How External Helpers Work

With external helpers, the SDK can call functions that are defined outside of the ZAP repository. Here's how it works:

1. **Externalized Helpers**: SDK developers create their own helper functions and specify the relative path to these functions in the gen-template.json configuration file.
2. **Data Flow**: ZAP will pass the required API object to these helpers at runtime, allowing them to interact with the ZAP data without needing direct access to the ZAP source code.
3. **API Abstraction**: The API object passed to the helper functions abstracts ZAP method definitions. SDK developers don’t need to worry about changes to method names or queries within ZAP, as any such changes will be handled by ZAP itself, without affecting the SDK code.

## How to Add Externalized Helpers

Here’s the step-by-step process to add your own external helper file to the SDK:

### Step 1: Define Helper Functions

External helper functions should be asynchronous and accept the necessary data passed from ZAP, typically via the api object. These helpers can perform any logic, such as querying ZAP's data or processing it.

Here’s an example of a helper that retrieves and counts available clusters:

```javascript
/**
 * Helper function to get the total number of available events.
 * @param {object} api - The API object.
 * @returns {number} - The total number of events.
 */
async function get_total_events_helper(api) {
  let events = await api.availableEvents(this)
  let totalEvents = events.length
  return totalEvents
}
```

### In this example:

- The helper accepts the `api` object.
- It calls `api.availableClusters(this)` to fetch the list of available clusters.
- It then returns the total number of clusters by calculating the length of the returned array.

Each helper can interact with the ZAP API to fetch data and process it as needed, based on the context passed in.

### Step 2: Specify Helpers in gen-template.json

The next step is to tell ZAP where to find your external helper functions. This is done by specifying the relative path to each helper file in the gen-template.json configuration file.

For example, your gen-template.json might look like this:

```javascript
{
  "helpers": [
    "path/to/external_helpers/get_total_events_helper.js",
    "path/to/external_helpers/get_total_attributes_helper.js"
  ]
}
```

The paths should be relative to the location of the gen-template.json file itself. This tells ZAP where to find your helper files when generating the binary.

### Step 3: Register Helpers with ZAP

After defining and specifying your helper files, the next step is to register them with ZAP so that they can be used during binary creation. You’ll need to call helperRegister.registerHelpers() for each helper function.

Here’s an example of how to register your helpers:

```javascript
function initialize_helpers(helperRegister, context) {
  // Register the 'get_total_events_helper' function
  helperRegister.registerHelpers(
    'get_total_events_helper',
    get_total_events_helper,
    context
  )

  // Register other helpers similarly
  helperRegister.registerHelpers(
    'get_total_attributes_helper',
    get_total_attributes_helper,
    context
  )
}
```

- The `helperRegister.registerHelpers()` function registers each helper.
- The first argument is the **name** of the helper.
- The second argument is the **helper function** you defined.
- The third argument is the **context object**, which contains the necessary environment or data (such as a database connection) that may be passed to the helper.

### Step 4: Use the Helpers in Your SDK Code

Once your helpers are registered, they can be used in templates or other components of the SDK as needed.

For example, in your SDK code, you can call the helpers like this:

<p>Events Count: {{ get_total_events_helper }}</p>
<p>Attributes Count: {{ get_total_attributes_helper }}</p>
The api object, provided by ZAP, contains the data and methods required for these helpers to work.

## Conclusion

This design pattern allows SDK developers to create externalized helpers. By leveraging the gen-template.json configuration file and the API object, SDK developers can interact with ZAP without needing direct access to ZAP’s internal source code. The approach abstracts method and query name changes in ZAP, ensuring that SDK code remains resilient to changes in the ZAP API.
