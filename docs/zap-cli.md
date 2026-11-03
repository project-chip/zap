# ZAP configuration commands

ZAP's configuration CLI edits `.zap` files from a terminal. It uses the same
configuration operations as the user interface, so endpoint, cluster, element,
and Matter feature changes follow the same validation and data model rules.
This page summarizes how to use the CLI and how it is implemented.

## Start here

From an installed ZAP package, run `zap <command>`. From a source checkout:

```bash
npm run zap-cli -- help
npm run zap-cli -- endpoint list light.zap
```

Use `zap help` to list all operations, `zap help attribute` to see a command
group, and `zap help attribute set` for one operation's options. For Matter
configurations, specify the Matter metadata; the default is Zigbee:

```bash
zap endpoint list light.zap --zcl ./zcl-builtin/matter/zcl.json
```

Add `--gen <template.json>` when generation templates are needed. A command
accepts the `.zap` file as a positional argument and uses GUI endpoint IDs, not
database row IDs.

## Typical workflow

1. Inspect an unfamiliar file with `zap info`, `zap check`, and the `list`
   operations. Listings can use `--filter`, `--enabled-only`, and `--all`.
2. Resolve names from the loaded data model. Selectors accept names, define
   names, or numeric codes, ignoring case and punctuation. Ambiguous names are
   reported; unknown names include close matches.
3. Apply edits with operations such as `endpoint create`, `cluster enable`,
   `attribute set`, `command enable`, `event enable`, and `feature enable`.
4. Run `zap check` to inspect validation findings and notifications, then run
   `zap generate` if code generation is needed.

For example, create a Matter dimmable light and set its current level:

```bash
MATTER="--zcl ./zcl-builtin/matter/zcl.json --gen ./test/gen-template/matter/gen-test.json"
zap new light.zap $MATTER
zap endpoint create light.zap --endpoint 1 --device-type MA-dimmablelight $MATTER
zap attribute set light.zap --endpoint 1 --cluster "Level Control" \
  --attribute CurrentLevel --enabled --default 25 $MATTER
zap check light.zap $MATTER
```

Run multiple edits from one YAML or JSON script with `zap apply`. Script
operation names use dots (`attribute.set`); option names use camelCase:

```yaml
- op: endpoint.create
  endpoint: 1
  deviceType: MA-dimmablelight
- op: attribute.set
  endpoint: 1
  cluster: Level Control
  attribute: CurrentLevel
  enabled: true
  default: '25'
```

```bash
zap apply light.zap --script changes.yaml $MATTER
```

`zap apply` uses one session and writes only after all operations succeed; a
failed batch leaves the file unchanged. `--dry-run` previews an edit without
writing. Use `--format json` for machine-readable output, and `--strict` to
refuse saving when an edit introduces validation errors.

## Configuration behavior

- **Endpoints:** create, update, duplicate, and delete endpoints; assign device
  types and parent relationships. Device types can enable their required
  clusters and elements.
- **Clusters and elements:** enable or disable clusters, attributes, commands,
  and events. Attribute options include default, storage, singleton, and
  reporting fields where the data model permits them.
- **Matter features:** `feature list` and `feature requirements` inspect current
  state. `feature preview` shows conformance-driven consequences;
  `feature enable` or `feature disable` applies the change. The same shared
  operation produces the preview and applies the confirmed plan.
- **Multiprotocol files:** pass each relevant `--zcl` metadata file. Endpoint
  numbers can overlap across categories, so specify `--category` to disambiguate.
  Shared cluster behavior follows the loaded generator metadata rather than a
  protocol-name check.
- **Policy:** fields fixed by the data model are refused with an explanation.
  ZAP reapplies some policy on import, so a change that would disappear on the
  next read is not reported as successful.
- **Results:** mutations report newly introduced validation findings and
  notifications. `zap check` reports the full current state. Notifications are
  recomputed on import and by validation; they are not cached in `.zap` files.

## How it is built

```mermaid
flowchart LR
  gui[Vue UI] --> rest[REST handlers]
  cli[CLI] --> runner[Operation runner]
  rest --> adapter[REST operation adapter]
  adapter --> runner
  post[Post-import scripts] --> runner
  runner --> ops[operations.js]
  ops --> shared[resolver, session-edit, policy]
  shared --> queries[query-* database modules]
  queries --> db[(SQLite session)]
  file[.zap file] -->|import| db
  db -->|export| file
```

The CLI and post-import scripts call the operation runner directly. REST
handlers translate browser requests into the same operations and retain the
GUI's HTTP interface. Vue presents results, confirmations, and refreshed state;
it does not implement a second configuration write path. Reads continue
through REST and the shared `query-*` modules.

The CLI's command surface lives in `src-electron/cli/cli-spec.js`. The parser
and human or JSON help are generated from that declaration. Implement each
operation in `src-electron/operations.js` and register it in the spec. Database
access must go through the existing `query-*` modules; do not add SQL or
reimplement REST behavior in a command handler.

Validation recomputes requirements from current configuration. Notifications
record conditions observed during import or edits, including trigger-generated
states. The UI and CLI therefore see the same underlying configuration and
policy results.

## Tests and extension points

The CLI tests cover the command surface, operation behavior, machine-readable
output, batch atomicity, and policy refusals. Feature integration tests exercise
preview and apply through REST and the shared operations. To add an operation:

1. Implement it in `src-electron/operations.js` using existing query modules.
2. Describe it in `src-electron/cli/cli-spec.js` if it is part of the CLI.
3. Route UI edits through the REST operation adapter and refresh the UI state
   from the resulting database state.
4. Add tests for the operation and its callers.

For details on all accepted flags and operations, run `zap help` or
`zap help <group> <operation>`; the command output is generated from the live
CLI specification.
