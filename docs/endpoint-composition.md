# Endpoint Composition

## Overview

Endpoint composition is a feature in ZAP that allows device types to specify required device types that must be present on separate endpoints. This is particularly important for Matter device types, where certain device types must be composed together to form a complete device.

For example, an Oven device type requires at least one Temperature Controlled Cabinet device type on a separate endpoint. This relationship is defined in the device type metadata and can be queried through the ZAP database and exposed in code generation templates.

## How It Works

### Database Structure

Endpoint composition information is stored in the following database tables:

- **`ENDPOINT_COMPOSITION`**: Stores the composition definition for a device type
  - `ENDPOINT_COMPOSITION_ID`: Unique identifier
  - `DEVICE_TYPE_REF`: Reference to the device type that has this composition
  - `CODE`: Device type code (used as fallback when DEVICE_TYPE_REF is NULL)
  - `TYPE`: Composition type (e.g., "tree")

- **`DEVICE_COMPOSITION`**: Stores the required device types for a composition
  - `DEVICE_COMPOSITION_ID`: Unique identifier
  - `ENDPOINT_COMPOSITION_REF`: Reference to the parent composition
  - `DEVICE_TYPE_REF`: Reference to the required device type
  - `CODE`: Device type code of the required device
  - `CONFORMANCE`: Conformance level (e.g., "M" for mandatory, "O" for optional)
  - `DEVICE_CONSTRAINT`: Constraint on the number of required devices (e.g., "min 1", "1")

### Querying Composition Requirements

This backend functionality provides queries and template helpers to access composition relationships. The primary query is `selectEndpointCompositionRequirementsByDeviceTypeRef`, which retrieves all required device types for a given parent device type.

**What you can do with this:**

- Query which device types are required by a parent device type
- Access conformance levels (mandatory/optional)
- Retrieve device constraints (minimum counts)
- Generate code that reflects composition relationships

## Template Usage

### Querying Composition Requirements

To query endpoint composition requirements in your templates, use the `user_endpoint_composition_requirements` helper. This helper must be called within a `user_device_types` context.

#### Basic Usage

```handlebars
{{#user_endpoints}}
  {{#user_device_types}}
    Endpoint {{../endpointId}}, DeviceId: {{deviceIdentifier}}

    {{#user_endpoint_composition_requirements}}
      Required Device: {{requiredDeviceName}} (Code: {{requiredDeviceCode}})
      Conformance: {{conformance}}
      Constraint: {{deviceConstraint}}
    {{/user_endpoint_composition_requirements}}
  {{/user_device_types}}
{{/user_endpoints}}
```

#### Available Fields

Within the `user_endpoint_composition_requirements` block, you have access to:

- **`requiredDeviceCode`**: The device type code of the required device (e.g., `113` for 0x0071)
- **`requiredDeviceName`**: The name of the required device type (e.g., "Temperature Controlled Cabinet")
- **`requiredDeviceTypeRef`**: The database ID of the required device type
- **`conformance`**: The conformance level ("M" for mandatory, "O" for optional)
- **`deviceConstraint`**: The constraint on the number of required devices (e.g., `1`, `"min 1"`)
- **`compositionType`**: The type of composition (e.g., "tree")
- **`endpointCompositionId`**: The ID of the endpoint composition

#### Example: Generating Endpoint Configuration

```handlebars
{{#user_endpoints}}
  {{#user_device_types}}
    // Endpoint {{../endpointId}} configuration
    #define ENDPOINT_{{../endpointId}}_DEVICE_TYPE {{deviceIdentifier}}
    #define ENDPOINT_{{../endpointId}}_DEVICE_VERSION {{deviceVersion}}

    {{#user_endpoint_composition_requirements}}
      // Required endpoint for {{requiredDeviceName}}
      #define REQUIRED_ENDPOINT_{{requiredDeviceCode}}_DEVICE_TYPE {{requiredDeviceCode}}
      #define REQUIRED_ENDPOINT_{{requiredDeviceCode}}_CONFORMANCE "{{conformance}}"
      {{#if deviceConstraint}}
      #define REQUIRED_ENDPOINT_{{requiredDeviceCode}}_CONSTRAINT {{deviceConstraint}}
      {{/if}}
    {{/user_endpoint_composition_requirements}}
  {{/user_device_types}}
{{/user_endpoints}}
```

#### Example: Conditional Logic Based on Composition

```handlebars
{{#user_endpoints}}
  {{#user_device_types}}
    {{#user_endpoint_composition_requirements}}
      {{#if (eq conformance 'M')}}
        // Mandatory requirement:
        {{requiredDeviceName}}
        // This endpoint MUST be present
      {{else}}
        // Optional requirement:
        {{requiredDeviceName}}
        // This endpoint MAY be present
      {{/if}}

      {{#if deviceConstraint}}
        // Minimum
        {{deviceConstraint}}
        instance(s) required
      {{/if}}
    {{/user_endpoint_composition_requirements}}
  {{/user_device_types}}
{{/user_endpoints}}
```

### Querying Clusters

When iterating over clusters in templates, you'll get the base clusters for the device type.

```handlebars
{{#user_endpoints}}
  {{#user_device_types}}
    {{#user_clusters}}
      Cluster:
      {{name}}
      Client:
      {{client}}
      Server:
      {{server}}
    {{/user_clusters}}
  {{/user_device_types}}
{{/user_endpoints}}
```

## Database Queries

This section explains how to programmatically query endpoint composition data from the database.

### Query Composition Requirements

To get all required device types for a given device type:

```javascript
const queryDeviceType = require('./db/query-device-type.js')

// Get composition requirements for a device type
const requirements =
  await queryDeviceType.selectEndpointCompositionRequirementsByDeviceTypeRef(
    db,
    deviceTypeRef // The DEVICE_TYPE_ID of the device type
  )

// Each requirement object contains:
// - requiredDeviceCode: Device type code (e.g., 113 for 0x0071)
// - requiredDeviceName: Device type name (e.g., "Temperature Controlled Cabinet")
// - requiredDeviceTypeRef: Database ID of the required device type
// - conformance: "M" (mandatory) or "O" (optional)
// - deviceConstraint: Number or string like "min 1"
// - compositionType: Type of composition (e.g., "tree")
// - endpointCompositionId: ID of the composition definition
```

**Example Usage**:

```javascript
// Get requirements for Oven device type
const ovenDeviceType = await queryDeviceType.selectDeviceTypeByCode(db, 0x007b)
const requirements =
  await queryDeviceType.selectEndpointCompositionRequirementsByDeviceTypeRef(
    db,
    ovenDeviceType.id
  )

if (requirements.length > 0) {
  console.log(`Oven requires ${requirements.length} device type(s):`)
  requirements.forEach((req) => {
    console.log(`  - ${req.requiredDeviceName} (${req.conformance})`)
  })
}
```

**Example Query: Refrigerator Composition Requirements**

```javascript
// Query for Refrigerator device type (0x0070)
const refrigerator = await queryDeviceType.selectDeviceTypeByCode(db, 0x0070)
const requirements =
  await queryDeviceType.selectEndpointCompositionRequirementsByDeviceTypeRef(
    db,
    refrigerator.id
  )

// Output:
// requirements = [
//   {
//     requiredDeviceCode: 113,  // 0x0071
//     requiredDeviceName: "Temperature Controlled Cabinet",
//     requiredDeviceTypeRef: 456,
//     conformance: "M",
//     deviceConstraint: "min 1",
//     compositionType: "tree",
//     endpointCompositionId: 789
//   }
// ]
```

## XML Definition

Endpoint compositions are defined in the Matter device XML files. Here's an example:

```xml
<deviceType>
  <name>MA-oven</name>
  <deviceId>0x007B</deviceId>
  <endpointComposition>
    <compositionType>tree</compositionType>
    <endpoint conformance="M" constraint="min 1">
      <deviceType>0x0071</deviceType>
    </endpoint>
  </endpointComposition>
</deviceType>
```

## Querying in Templates vs. Backend Code

### In Templates (Handlebars)

When writing templates, use the `user_endpoint_composition_requirements` helper. This automatically queries the database and provides the composition requirements in the template context:

```handlebars
{{#user_endpoints}}
  {{#user_device_types}}
    {{#user_endpoint_composition_requirements}}
      // Composition requirement data is automatically available here
      {{requiredDeviceName}}
      {{requiredDeviceCode}}
      {{conformance}}
    {{/user_endpoint_composition_requirements}}
  {{/user_device_types}}
{{/user_endpoints}}
```

### In Backend Code (JavaScript)

When writing backend code (e.g., validation logic), use the query functions directly:

```javascript
const queryDeviceType = require('./db/query-device-type.js')

// Example: Validate that all required endpoints exist
async function validateComposition(db, endpointTypeId) {
  const deviceTypes = await queryDeviceType.selectDeviceTypesByEndpointTypeId(
    db,
    endpointTypeId
  )

  for (const deviceType of deviceTypes) {
    const requirements =
      await queryDeviceType.selectEndpointCompositionRequirementsByDeviceTypeRef(
        db,
        deviceType.deviceTypeRef
      )

    for (const req of requirements) {
      if (req.conformance === 'M') {
        // Check if required endpoint exists
        // ... validation logic
      }
    }
  }
}
```

## Best Practices

1. **Always check for composition requirements**: When working with Matter device types, always check if they have composition requirements and handle them appropriately in your templates.

2. **Use conditional logic**: Use the `conformance` field to determine if a requirement is mandatory or optional, and generate appropriate code or warnings.

3. **Handle constraints**: Check the `deviceConstraint` field to determine how many instances of a required device type are needed.

4. **Error handling**: If `requiredDeviceTypeRef` is null, it means the required device type doesn't exist in the database yet. Handle this gracefully in your templates.

5. **Query performance**: When querying composition data, consider caching results if you need to query the same data multiple times.

## See Also

- [Template Tutorial](./template-tutorial.md) - General template writing guide
- [Helpers Documentation](./helpers.md) - Complete list of available template helpers
- [API Documentation](./api.md) - Complete API reference
