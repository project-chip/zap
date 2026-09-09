---
name: zap-zcl-configurator
description: Use ZAP (zap-cli) to read or change .zap files — the Zigbee/Matter endpoint, cluster, attribute, command, event and feature configuration for an application. Use whenever a task involves a .zap file or adding/changing endpoints, device types or clusters.
---

# ZAP — ZCL Advanced Platform

A `.zap` file holds an application's endpoints, device types, clusters,
attributes, commands, events and features. Generated source is produced from it,
so it is the source of truth for what the application supports. The release
ships `zap` (graphical editor) and `zap-cli` (same engine, headless).

## Locating `zap-cli`

Usually **not** on `PATH`. Resolve it with `silabs-tool-exec` (`tool_id: zap`,
`tool_name: zap-cli`) or `slt-find` (`tool_id: zap`) from the
`silabs-tool-locator` MCP server. Typical install (versioned, may move):

```text
$HOME/.silabs/slt/installs/archive/zap/zap-cli
```

## Locating the `.zap` file

- Zigbee: `config/zcl/zcl_config.zap`
- Matter: `config/common/<app>.zap`

## Discovering the commands

Self-describing — start here rather than guessing:

```bash
zap-cli edit help                  # every operation, one line each
zap-cli edit help attribute set    # options for one operation
zap-cli edit help --format json    # whole surface as a machine readable schema
```

Most commands print a `Next:` section with ready-to-run follow-ups.

## Packages: prefer `slc_args.json`, else pass `--zcl` and `--gen`

Studio and `slc generate` inject the project's SDK data model and templates by
expanding the `zcl.*` properties declared in ZAP's `apack.json`. SLC also
writes those resolved paths next to the `.zap` as `slc_args.json`.

**Current `zap-cli`** (this tree): if you omit `--zcl` / `--gen` and
`slc_args.json` sits beside the `.zap`, edit fills them in from that file —
same answer Studio gets. It picks the protocol(s) from the file's
`zcl-properties` package categories (Matter vs Zigbee), not from a corrupt
template entry. Explicit `--zcl` / `--gen` still win.

**Older installed `zap-cli`** (archive packages that predate that behaviour):
omitting the flags falls back to bundled Zigbee ZCL and **test** templates.
`--packageMatch fuzzy` can then remap a Matter `app-templates.json` onto
Zigbee test `gen-templates.json` and **save that into the `.zap`**. Later
`slc generate` still exits 0 but Matter `autogen/zap-generated/` stays empty.

Always pass **`--packageMatch strict`**. Never "fix" a strict failure by
dropping back to `fuzzy`.

When you must name paths yourself (no `slc_args.json`, or an old `zap-cli`),
read them from that file if present, else from SDK properties
(`zcl.matterZclJsonFile`, `zcl.zigbeeZclJsonFile`, and matching
`*TemplateJsonFile`). Prefer those over guessed `${sdkRoot}/…` layouts.
Fallbacks:

|        | ZCL                                                                        | Templates (`--gen`)                                                              |
| ------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Zigbee | `${sdkRoot}/app/zcl/zcl-zap.json`                                          | `${sdkRoot}/protocol/zigbee/app/framework/gen-template/gen-templates.json`       |
| Matter | `${sdkRoot}/extension/matter_extension/src/app/zap-templates/zcl/zcl.json` | `${sdkRoot}/extension/matter_extension/src/app/zap-templates/app-templates.json` |

Never substitute ZAP builtins (`--zcl matter` / `--zcl zigbee`, or bundled
`--gen`) when an SDK project exists.

Canonical invocation (works on old and new `zap-cli`):

```bash
zap-cli edit <op> app.zap … \
  --zcl "$ZCL" --gen "$GEN" --packageMatch strict \
  --stateDirectory /tmp/zap-state-$$
```

With a current build and `slc_args.json` present, `--zcl` / `--gen` may be
omitted; keep `--packageMatch strict` and `--stateDirectory`.

### Sanity checks after every write

1. `endpoint list` — endpoints and device types still look right.
2. `package list` (or `info`) — `gen-templates-json` **category must match the
   protocol** (`matter` → `app-templates.json`, `zigbee` → SDK
   `gen-templates.json`). If category flipped or the path points at
   `snapshot/zap/test/…`, stop and fix packages before regenerate/build.

A current `zap-cli` that loaded SDK packages from `slc_args.json` (or explicit
`--gen`) rewrites the template package on save to the SDK path, which heals a
previously corrupted file. On an older `zap-cli`, or if the bad zigbee test
path still resolves inside the snapshot, recover with convert:

```bash
zap-cli convert broken.zap -o fixed.zap --zcl "$ZCL" --gen "$GEN"
# verify: package list on fixed.zap shows matter app-templates.json
```

## Always isolate `--stateDirectory`

Default state is shared (`~/.zap`), so concurrent `zap-cli` edits **or**
concurrent `slc generate` / `slc example create` (which also run ZAP) fail with
`SQLITE_BUSY: database is locked`. Pass a unique directory per job (see
invocation above).

## Do not hand-edit the `.zap` file

It is JSON, but ZAP re-applies storage, reporting and conformance rules on load,
so hand-written changes are commonly dropped and row relationships are easy to
break. A `zap-cli` change is identical to the same change in the GUI.

## Read before you write

`endpoint list`, `cluster list`, `attribute list`, `feature list` give exact
names and current state cheaply. Add `--format json` when parsing.

## Device type and features must stay coherent

Device type is the contract; features are its implementation. They are edited
independently, so they drift. Check `CONFORMANCE` / `REQUIREDBY` from
`feature list` first — `M` plus a device type name means mandatory for it.

```bash
# CT-only light: change the contract too, not just the feature
ZAP_PKG=(--zcl "$ZCL" --gen "$GEN" --packageMatch strict --stateDirectory /tmp/zap-state-$$)
zap-cli edit devicetype set app.zap --endpoint 1 \
  --device-type MA-colortemperaturelight "${ZAP_PKG[@]}"
zap-cli edit feature disable app.zap --endpoint 1 --cluster "Color Control" \
  --feature XY "${ZAP_PKG[@]}"
```

Treat new `Feature Compliance` / `Device Type Compliance` warnings from **your**
edit as a failed customization unless a non-conformant config is wanted.

## Validation and exit codes

- Edit commands save and exit 0 even when they introduce **warnings**.
- Malformed endpoints and out-of-range defaults are **errors**; conformance
  findings are **warnings** (a spec-incomplete config is a valid intermediate).
- `--strict` on an edit refuses to save when _that edit_ introduced errors;
  `edit check --strict` exits 1 when errors exist. `--no-validate` skips it.
- Output separates **new** from **pre-existing**. Stock Matter examples already
  carry out-of-range and provisional-cluster findings — do not confuse that debt
  with your regression.

New device-type endpoints often land with mandatory attributes empty or out of
range, so run `check` right after `endpoint create` and fix them.

## External attributes

**External** storage means the value is served through the Attribute Access
Interface from application code, so the `.zap` correctly holds no default and
`attribute set --default` fails (exit 1). That is expected, not a workaround
case — check the `STORAGE` column first. The exception is attributes the SDK
marks `keepDefault` (for example `FeatureMap`), which stay External but keep an
editable, generated default.

For Matter naming (`ProductName`, `NodeLabel`) use `CHIPProjectConfig.h`, not
ZAP defaults; keep demo `..._PRODUCT_ID` inside ExampleDAC ranges
(`0x8000`–`0x801F` for vendor `0xFFF1`) or linking fails on missing DAC symbols.

## A `.zap` edit is not the whole job

1. **The paired UC component has to be installed.** A configured cluster with
   nothing implementing it does nothing: the `.zap` says the cluster is there,
   the firmware has no code for it. Two ways to get the component in, below.
   Never leave an enable unfinished — always end with the validation step.
2. **Regenerate and rebuild.** `slc generate`, then build, so
   `autogen/zap-generated` matches the `.zap`.

### Which components does the cluster need?

Easiest: let the edit tell you. Run `cluster enable` **without** the Studio
options and it names what it did not install:

```text
UC component(s) not installed: zigbee_barrier_control_server
```

The mapping itself is a package extension carried by the generation templates,
so it is only known when `--gen` (or `slc_args.json`) loaded them. On disk it is
`cluster-to-component-dependencies.json`, **beside the templates json**:

| Protocol | File                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| Zigbee   | `${sdkRoot}/protocol/zigbee/app/framework/gen-template/cluster-to-component-dependencies.json` |
| Matter   | `<matter_extension>/src/app/zap-templates/cluster-to-component-dependencies.json`              |

The templates json points at it as the `cluster` extension named `component`
(`"defaults": "cluster-to-component-dependencies.json"`,
`"autoEnableComponents": true`). Entries are keyed
`"<cluster label lowercased>-<server|client>"`:

```bash
GENDIR=$(dirname "$GEN")   # $GEN is the gen-templates.json / app-templates.json
grep -i -A3 '"barrier control-server"' "$GENDIR/cluster-to-component-dependencies.json"
```

Matter ids are extension-qualified (`%extension-matter%matter_fixed_label`).
**Many clusters have no entry** (Zigbee `occupancy sensing-server`, for one) —
then there is nothing to install and no missing-component message.

Whether a component is already in the project is just the `.slcp` component
list:

```bash
grep -n "id: zigbee_barrier_control_server" app.slcp
```

### If Studio is running: Jetty installs it for you

With Simplicity Studio open **on that project**, `zap-cli` does exactly what
ticking the cluster in the GUI does — it asks Studio's Jetty server to install
the component, so the `.slcp` is updated for you:

```bash
PORT=$(lsof -nP -iTCP -sTCP:LISTEN | awk '/sts_back/ {sub(/.*:/,"",$9); print $9; exit}')
zap-cli edit cluster enable app.zap --endpoint 1 --cluster "Barrier Control" --side server \
  --packageMatch strict --stateDirectory /tmp/zap-state-$$ \
  --studioHttpPort "$PORT" --ideProjectPath /abs/path/app.slcp
```

- Use the **`sts_back_end`** listener, not the UI process ports.
- `--ideProjectPath` is the absolute `.slcp`.
- Success prints `Studio component <id>: installed`. Removal is symmetric on
  `cluster disable`, when the data model asks for it and no endpoint still uses
  the cluster.
- Studio 6 runs Jetty 12 with `UriCompliance.RFC3986`, which rejects `%2F` in a
  path. Studio therefore percent-encodes the project path and then replaces `%`
  with `_`; current `zap-cli` does the same (`encodeStudioProjectPath`). An
  older `zap-cli` that only calls `encodeURIComponent` reports
  `Studio component …: failed (404)` — use the slc route instead.

If the request fails or nothing answers, treat Studio as unavailable and fall
back to slc. **Do not start Studio** to get this path, and do not try to run its
Jetty server standalone: the UC endpoints live inside Studio's `sts_back_end`
and only serve a project the IDE has actually loaded, so a bare backend answers
404 for every `clic` route.

### If Studio is not running: add it with slc yourself

Run from the project directory; ids comma separated, instance components use
`:`:

```bash
slc modify project --project-file app.slcp --with zigbee_barrier_control_server
```

Note it prints `You MUST regenerate the project` — that is the rebuild step
below, not an error.

### Validate, either way

Both routes get the same three checks:

1. **Component recorded** — `grep -n "id: <component>" app.slcp`.
2. **`.zap` still sane** — `zap-cli edit check app.zap --packageMatch strict
--stateDirectory /tmp/zap-state-$$` (plus `package list`, as above), and read
   the validation lines the edit printed. New device-type clusters commonly
   land with mandatory attributes out of range; fix those before building.
3. **It compiles** — `slc generate -p app.slcp -d .` then build. This is the
   only check that proves the cluster has an implementation: a missing UC
   component typically surfaces as an undefined-symbol link failure for that
   cluster's callbacks.

## Batch edits with `apply`

Loading the ZCL metadata dominates every invocation, so chained commands pay it
repeatedly. `apply` runs a list in one pass (YAML or JSON, flags in camelCase,
`--script -` for stdin, `--new` to build from empty):

```yaml
- op: endpoint.create
  endpoint: 1
  deviceType: MA-dimmablelight
- op: attribute.set
  endpoint: 1
  cluster: Level Control
  attribute: CurrentLevel
  enabled: true
  default: '42'
```

```bash
zap-cli edit apply app.zap --script changes.yaml \
  --zcl "$ZCL" --gen "$GEN" --packageMatch strict \
  --stateDirectory /tmp/zap-state-$$
```

`silabs-tool-exec` cannot feed stdin, so prefer `--script <file>` over
`--script -`.

## Other flags worth knowing

- `--category zigbee|matter` — required on multiprotocol files, where endpoint
  numbering is per protocol.
- `-o` / `--output` writes elsewhere; `--dry-run` previews; `--force` allows
  replacing an existing file with `new` / `--new`.
- `cluster enable|disable` needs `--side`; `command enable|disable` needs
  `--direction in|out` (not `--incoming`).
- Matter configs get the Root Node on endpoint 0; `--parent` composes endpoints.
- Feature cascades: disable dependents before the parent feature.

## More

Project and full documentation: https://github.com/project-chip/zap/
