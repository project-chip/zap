# Adding Externalized Helpers to the SDK

## Introduction

This guide explains how to add and manage externalized helper functions in the SDK, which interacts with ZAP (ZCL Advanced Platform). Initially, the SDK helpers were external to the ZAP repository, but due to maintenance and design concerns, they were moved into the ZAP repository. With the introduction of a new design pattern, SDK developers now have the flexibility to create their own externalized helpers and integrate them without requiring access to ZAP's source code.

This design enables SDK developers to specify helper functions via the `gen-template.json` configuration file, which ZAP consumes during binary creation. The SDK can then call these helpers, passing in the necessary data, making them more flexible and reducing dependency on the internal ZAP codebase.

## Background

### Previous Approach

In the earlier design, SDK helpers were external to ZAP. However, to function correctly, these helpers required access to ZAP’s source code, especially certain files within the ZAP repository. This created challenges:

- When ZAP function names changed, corresponding updates had to be made across the SDK.
- SDK developers were constrained by these internal dependencies, requiring explicit imports or "requires" of ZAP files.

### New Design Pattern

The new design pattern aims to free SDK developers from being tied to the internal structure of the ZAP repository, while still allowing the SDK to interact with ZAP's API. The new design works as follows:

1. **Externalized Helpers**: SDK developers can create their own helper functions and specify the relative path to these helpers in the `gen-template.json` configuration file.
2. **Data Flow**: ZAP will transmit the necessary API object to these helpers at runtime during binary creation, allowing them to work with ZAP data without needing to directly interact with ZAP’s source code.
3. **API Abstraction**: The API object passed to the helpers contains abstracted ZAP method definitions, meaning SDK developers do not need to worry about changes in query or method names within ZAP. If a query or method name changes, only the ZAP team needs to make updates to the API; the SDK code remains unaffected.

### Example

In the provided code snippet, the SDK receives an API object containing "attributes" which invokes a query. In the event of a query name change, the ZAP developer updates the API, relieving the SDK developer from making any adjustments:

```javascript
/**
 * Returns an array of attributes for a given cluster.
 * The cluster input is required to come from a script-api in this module.
 *
 * @param {*} context
 * @param {*} endpoint
 * @param {*} cluster
 */
function attributes(context, endpoint, cluster) {
  return queryEndpoint.selectEndpointClusterAttributes(
    context.db,
    cluster.clusterId,
    cluster.side,
    endpoint.endpointTypeRef
  )
}
```

In this example, the attributes function makes use of the queryEndpoint.selectEndpointClusterAttributes method. If ZAP changes the method or its name, the SDK developers are not required to update their code. ZAP abstracts these changes through the API object passed to the helper, which remains stable.

## How to Add Externalized Helpers

The process for adding externalized helpers follows a new design pattern that enables SDK developers to extend functionality without modifying the ZAP repository.

### Step 1: Define Helper Functions

Your externalized helper functions should be asynchronous and accept the necessary data passed from ZAP, typically in the form of an api object. Here's an example of a helper that retrieves and counts available events:

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

Each helper function can interact with the API object provided by ZAP to fetch and process data as needed.

### Step 2: Specify Helpers in gen-template.json

The gen-template.json file allows SDK developers to specify the path to the externalized helpers they wish to use. The file should include the helper file's relative path within your project structure.

For example, your gen-template.json might include:

```javascript
{
  "helpers": [
    "path/to/external_helpers/get_total_events_helper.js",
    "path/to/external_helpers/get_total_attributes_helper.js"
  ]
}
```

This tells ZAP where to find your helper files during runtime.

### Step 3: Register Helpers with ZAP

In the SDK, you need to create a function to register the helpers with ZAP. ZAP will use this function to register each helper specified in gen-template.json and make them available during binary creation.

Here’s an example of how to register the helpers:

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

The helperRegister.registerHelpers function is called for each helper function you’ve defined. The context object is passed along to each helper function when invoked.

### Step 4: Use the Helpers in Your SDK Code

Once your helpers are registered, they can be called in your SDK code as needed. Here’s how the helpers can be used in templates or other components:

<p>Events Count: {{ get_total_events_helper(api) }}</p>
<p>Attributes Count: {{ get_total_attributes_helper(api) }}</p>
The api object, provided by ZAP, contains the data and methods required for these helpers to work.

### Step 5: Handling Changes in ZAP

With this new design, you no longer need to worry about changes in the ZAP codebase affecting your SDK helpers. If a method or query name changes in ZAP, the ZAP team will update the API object, and the changes will be abstracted to the SDK. Your helpers remain unaffected and continue to operate as expected without requiring code changes on your part.

## Conclusion

This new design pattern allows SDK developers to create externalized helpers. By leveraging the gen-template.json configuration file and the API object, SDK developers can interact with ZAP without needing direct access to ZAP’s internal source code. The approach abstracts method and query name changes in ZAP, ensuring that SDK code remains resilient to changes in the ZAP API.
