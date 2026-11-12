# Cluster integration guidance

Some clusters need application work beyond enabling them in ZAP. Cluster XML
may include an optional `integrationGuidance` element alongside `description`:

```xml
<cluster>
  <name>Example</name>
  <description>Cluster purpose.</description>
  <integrationGuidance>Register the server delegate and create its instance.</integrationGuidance>
  <!-- remaining cluster metadata -->
</cluster>
```

ZAP displays this text on the selected cluster page. Keep it short and
actionable; use it for implementation steps such as registering a delegate or
creating a code-driven server instance. Existing cluster descriptions and
metadata without this element remain valid. This field is plain text and is not
copied into the generated `.zap` file.
