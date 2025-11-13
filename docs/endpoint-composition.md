# Endpoint Composition

## Overview

Endpoint composition is a feature in ZAP that allows device types to specify required device types that must be present on separate endpoints. This is particularly important for Matter device types, where certain device types must be composed together to form a complete device.

For example, an Oven device type may require at least one Temperature Controlled Cabinet device type on a separate endpoint. When you add an Oven endpoint, ZAP will automatically create the required Temperature Controlled Cabinet endpoint.

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

- **`DEVICE_COMPOSITION_CLUSTER`**: Stores composition-specific cluster overrides/additions
  - `DEVICE_COMPOSITION_CLUSTER_ID`: Unique identifier
  - `DEVICE_COMPOSITION_REF`: Reference to the device composition
  - `CLUSTER_NAME`: Name of the cluster
  - `INCLUDE_CLIENT`: Whether to include client side
  - `INCLUDE_SERVER`: Whether to include server side
  - `LOCK_CLIENT`: Whether client side is locked
  - `LOCK_SERVER`: Whether server side is locked

### Composition-Specific Clusters

Device types can have composition-specific clusters defined in the XML that apply when the device type is used in a specific composition context. These clusters are stored in the `DEVICE_COMPOSITION_CLUSTER` table and can be queried separately from base device type clusters.

**Note**: Cluster merging functionality (where composition-specific clusters override base clusters) is planned for future implementation. Currently, composition-specific clusters are stored but not automatically merged during cluster loading.

### Automatic Endpoint Creation

When you add an endpoint with a device type that has composition requirements, ZAP will:

1. Create the primary endpoint with the requested device type
2. Query the composition requirements for that device type
3. Automatically create the required endpoints based on the constraints
4. Recursively process any nested composition requirements

For example, if you add an Oven endpoint (which requires Temperature Controlled Cabinet), ZAP will automatically create:

- The Oven endpoint (endpoint 1)
- The Temperature Controlled Cabinet endpoint (endpoint 2)

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

When iterating over clusters in templates, you'll get the base clusters for the device type. Composition-specific clusters are stored separately and can be queried using the database query functions (see Database Queries section below).

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
      // This iterates over base clusters for the device type
    {{/user_clusters}}
  {{/user_device_types}}
{{/user_endpoints}}
```

**Note**: Automatic cluster merging (where composition-specific clusters override base clusters) is planned for future implementation.

## REST API

### Get Endpoint Composition Requirements

**Endpoint**: `GET /zcl/endpointCompositionRequirements?deviceTypeRef={deviceTypeRef}`

**Parameters**:

- `deviceTypeRef` (required): The device type reference ID (DEVICE_TYPE_ID)

**Response**: Array of composition requirement objects

**Example**:

```javascript
GET /zcl/endpointCompositionRequirements?deviceTypeRef=123

Response:
[
  {
    "requiredDeviceCode": 113,
    "requiredDeviceName": "Temperature Controlled Cabinet",
    "requiredDeviceTypeRef": 456,
    "conformance": "M",
    "deviceConstraint": 1,
    "compositionType": "tree",
    "endpointCompositionId": 789
  }
]
```

### Get Device Types by Endpoint Type

**Endpoint**: `GET /zcl/deviceTypesByEndpointTypeId?endpointTypeId={endpointTypeId}`

**Parameters**:

- `endpointTypeId` (required): The endpoint type ID

**Response**: Array of device type objects

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

### Query Composition-Specific Clusters

To get clusters that are specific to a device type when used in a composition context:

```javascript
// Get all composition-specific clusters for a device type
const compositionClusters =
  await queryDeviceType.selectCompositionClustersByDeviceTypeRef(
    db,
    deviceTypeRef,
    endpointCompositionId // optional: filter by specific composition
  )

// Each cluster object contains:
// - clusterName: Name of the cluster (e.g., "Groups")
// - includeClient: Whether client side is included
// - includeServer: Whether server side is included
// - lockClient: Whether client side is locked
// - lockServer: Whether server side is locked
// - deviceCompositionRef: Reference to the device composition
// - endpointCompositionId: ID of the composition
```

**Example Usage**:

```javascript
// Get composition-specific clusters for On/Off Light when used in Floodlight Camera composition
const floodlightCamera = await queryDeviceType.selectDeviceTypeByCode(
  db,
  0x0144
)
const onOffLight = await queryDeviceType.selectDeviceTypeByCode(db, 0x0100)

// First, get the composition ID
const compositionId =
  await queryDeviceType.getEndpointCompositionIdForRequiredDeviceType(
    db,
    onOffLight.id, // required device type
    floodlightCamera.id // parent device type
  )

if (compositionId) {
  // Get composition-specific clusters
  const compClusters =
    await queryDeviceType.selectCompositionClustersByDeviceTypeRef(
      db,
      onOffLight.id,
      compositionId
    )

  console.log(`Found ${compClusters.length} composition-specific clusters:`)
  compClusters.forEach((cluster) => {
    console.log(
      `  - ${cluster.clusterName} (server: ${cluster.includeServer}, client: ${cluster.includeClient})`
    )
  })
}
```

### Query Base Clusters

To get the base clusters for a device type:

```javascript
// Get base clusters for a device type
const baseClusters =
  await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
    db,
    deviceTypeRef
  )

// Returns all base clusters defined for the device type
```

**Example Usage**:

```javascript
// Get base clusters for a device type
const deviceType = await queryDeviceType.selectDeviceTypeByCode(db, 0x0100)
const baseClusters =
  await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
    db,
    deviceType.id
  )

console.log(`Base clusters: ${baseClusters.length}`)
baseClusters.forEach((cluster) => {
  console.log(
    `  - ${cluster.clusterName} (server: ${cluster.includeServer}, client: ${cluster.includeClient})`
  )
})
```

**Note**: The `selectDeviceTypeClustersByDeviceTypeRefWithComposition` function exists but cluster merging is not yet implemented. It currently returns base clusters only.

### Get Composition ID for Required Device Type

To find which composition a required device type belongs to:

```javascript
// Get the composition ID for a required device type in a parent's composition
const compositionId =
  await queryDeviceType.getEndpointCompositionIdForRequiredDeviceType(
    db,
    requiredDeviceTypeRef, // The required device type (e.g., On/Off Light)
    parentDeviceTypeRef // The parent device type (e.g., Floodlight Camera)
  )

// Returns the ENDPOINT_COMPOSITION_ID if found, null otherwise
```

**Example Usage**:

```javascript
// Check if On/Off Light has composition-specific clusters when used with Floodlight Camera
const floodlightCamera = await queryDeviceType.selectDeviceTypeByCode(
  db,
  0x0144
)
const onOffLight = await queryDeviceType.selectDeviceTypeByCode(db, 0x0100)

const compositionId =
  await queryDeviceType.getEndpointCompositionIdForRequiredDeviceType(
    db,
    onOffLight.id,
    floodlightCamera.id
  )

if (compositionId) {
  // This device type has composition-specific clusters in this context
  const compClusters =
    await queryDeviceType.selectCompositionClustersByDeviceTypeRef(
      db,
      onOffLight.id,
      compositionId
    )
  // Use composition-specific clusters
} else {
  // Use base clusters only
  const baseClusters =
    await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
      db,
      onOffLight.id
    )
}
```

### When to Use Each Query

1. **`selectEndpointCompositionRequirementsByDeviceTypeRef`**: Use when you need to know what device types are required for a given device type. This is useful for:
   - Validating endpoint configurations
   - Generating endpoint initialization code
   - Creating required endpoints automatically

2. **`selectCompositionClustersByDeviceTypeRef`**: Use when you need to know what clusters are composition-specific (not base clusters). This is useful for:
   - Debugging cluster configurations
   - Understanding what clusters are overridden
   - Generating documentation

3. **`selectDeviceTypeClustersByDeviceTypeRef`**: Use when you need the base clusters for a device type. This is useful for:
   - Template generation
   - Cluster iteration in templates
   - Getting the standard clusters for a device type

**Note**: `selectDeviceTypeClustersByDeviceTypeRefWithComposition` exists but cluster merging is not yet implemented.

4. **`getEndpointCompositionIdForRequiredDeviceType`**: Use when you need to determine if a device type is being used in a composition context. This is useful for:
   - Conditional logic based on composition context
   - Determining which composition-specific clusters to apply
   - Validating composition relationships

### Complete Example: Querying All Composition Data

```javascript
const queryDeviceType = require('./db/query-device-type.js')

async function queryCompositionData(db, deviceTypeCode) {
  // 1. Get the device type
  const deviceType = await queryDeviceType.selectDeviceTypeByCode(
    db,
    deviceTypeCode
  )
  if (!deviceType) {
    console.log(`Device type ${deviceTypeCode} not found`)
    return
  }

  // 2. Get composition requirements
  const requirements =
    await queryDeviceType.selectEndpointCompositionRequirementsByDeviceTypeRef(
      db,
      deviceType.id
    )

  console.log(`Device type: ${deviceType.name}`)
  console.log(`Composition requirements: ${requirements.length}`)

  // 3. For each required device type, check for composition-specific clusters
  for (const req of requirements) {
    console.log(`\nRequired device: ${req.requiredDeviceName}`)
    console.log(`  Conformance: ${req.conformance}`)
    console.log(`  Constraint: ${req.deviceConstraint}`)

    if (req.requiredDeviceTypeRef && req.endpointCompositionId) {
      // 4. Get composition-specific clusters for this required device
      const compClusters =
        await queryDeviceType.selectCompositionClustersByDeviceTypeRef(
          db,
          req.requiredDeviceTypeRef,
          req.endpointCompositionId
        )

      if (compClusters.length > 0) {
        console.log(`  Composition-specific clusters: ${compClusters.length}`)
        compClusters.forEach((cluster) => {
          console.log(`    - ${cluster.clusterName}`)
        })
      }

      // 5. Get base clusters for comparison
      const baseClusters =
        await queryDeviceType.selectDeviceTypeClustersByDeviceTypeRef(
          db,
          req.requiredDeviceTypeRef
        )

      console.log(`  Base clusters: ${baseClusters.length}`)
      console.log(`  Composition-specific clusters: ${compClusters.length}`)
    }
  }
}

// Usage
await queryCompositionData(db, 0x0144) // Floodlight Camera
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

For device types with composition-specific clusters:

```xml
<deviceType>
  <name>MA-floodlight-camera</name>
  <deviceId>0x0144</deviceId>
  <endpointComposition>
    <compositionType>tree</compositionType>
    <endpoint conformance="M" constraint="min 1">
      <deviceType id="0x0100" name="On/Off Light">
        <clusters>
          <include cluster="Groups" client="false" server="true"
                   clientLocked="true" serverLocked="true"></include>
          <include cluster="Identify" client="false" server="true"
                   clientLocked="true" serverLocked="true">
            <requireCommand>TriggerEffect</requireCommand>
          </include>
        </clusters>
      </deviceType>
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

**Note**: When using `user_clusters` in templates, you'll get the base clusters for the device type. Composition-specific clusters are stored separately and can be queried using the database query functions if needed.

### In Backend Code (JavaScript)

When writing backend code (e.g., REST endpoints, validation logic), use the query functions directly:

```javascript
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

4. **Cluster iteration**: When iterating over clusters in templates, you'll get base clusters. Composition-specific clusters are stored separately and can be queried if needed.

5. **Error handling**: If `requiredDeviceTypeRef` is null, it means the required device type doesn't exist in the database yet. Handle this gracefully in your templates.

6. **Query performance**: When querying composition data, consider caching results if you need to query the same data multiple times.

7. **Composition-specific clusters**: Composition-specific clusters are stored in the database but are not automatically merged with base clusters yet. This functionality is planned for future implementation.

## See Also

- [Template Tutorial](./template-tutorial.md) - General template writing guide
- [Helpers Documentation](./helpers.md) - Complete list of available template helpers
- [API Documentation](./api.md) - Complete API reference
