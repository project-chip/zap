---
name: zap-zcl-configurator
description: >-
  Configures Zigbee/Matter ZCL by running zap-cli on .zap files (endpoints,
  device types, clusters, attributes, commands, events, features). For any ZAP-,
  .zap-, endpoint-, cluster-, or zcl_config-related task, agents must read this
  skill and execute zap-cli — never hand-edit .zap JSON or use Write/StrReplace
  on a .zap path. Triggers include ZAP, zap-cli, .zap, zcl_config, Matter device
  types, Zigbee profiles, and UC/ZCL configuration changes.
---

# ZAP — ZCL Advanced Platform

A `.zap` file holds an application's endpoints, device types, clusters,
attributes, commands, events and features. Generated source is produced from it,
so it is the source of truth for what the application supports. The release
ships `zap` (graphical editor) and `zap-cli` (same engine, headless).

## Agent rules (read first)

1. **Load this skill** for every question or change involving a `.zap` file or
   ZCL/Matter/Zigbee endpoint configuration.
2. **Run `zap-cli`** via `silabs-tool-exec` (`tool_id: zap`, `tool_name:
zap-cli`, `context_folder` = project root). Use `resolvedExecutable` from the
   MCP result; do not search the filesystem for the binary.
3. **Never hand-edit a `.zap` file** — not with the editor, not with
   Write/StrReplace, not by patching JSON. Reads use list/check commands; writes
   use `zap-cli` edit operations.
4. **Read before write** — `endpoint list`, `cluster list`, `attribute list`
   (add `--format json` when parsing).
5. **Batch multiple edits in one CLI run** — loading ZCL metadata dominates
   every invocation. For **two or more writes**, use **`apply`** with a YAML or
   JSON script (`--script <file>`), not a chain of separate `zap-cli` commands.
   A single `apply` can mix any operations (endpoints, clusters, attributes,
   features, …) in one pass.
6. **One metadata load per task** — one `apply` (or one single-op command when
   there is only one change).

## Locating `zap-cli`

Usually **not** on `PATH`. Resolve and run with **one** `silabs-tool-exec` call
from the `silabs-tool-locator` MCP server (`tool_id: zap`, `tool_name: zap-cli`).
See `slab-tool-find`. Typical install (versioned, may move):

```text
$HOME/.silabs/slt/installs/archive/zap/zap-cli
```

When `silabs-tool-exec` succeeds, use `resolvedExecutable` — do not re-locate,
shell-probe, or search the install tree.

## Locating the `.zap` file

- Zigbee: `config/zcl/zcl_config.zap`
- Matter: `config/common/<app>.zap`

When the project came from `slc example list` (`slab-example-find`), derive the
`.zap` from the `Installed at:` `.slcp` path: parent directory + the paths
above. **Do not** Glob or Grep under `~/.silabs` or SDK install trees to find
`.zap` files — use the derived path or report it missing.

Many DMP examples have **no** `.zap` (BLE-only side). Only Zigbee/Matter
endpoints use ZAP; skip non-ZAP examples instead of searching for one.

## Command surface and token use

**Default:** use the operation index below to pick the right command. That keeps
help output out of the chat context (~1.5k tokens for full text help, ~12k for
`help --format json` on current builds).

**When flags are unclear**, ask the installed CLI for one operation only:

```bash
zap-cli help attribute set          # new CLI: config commands at top level
zap-cli edit help attribute set     # older packages: same under `edit`
```

**When the index is not enough** (new CLI version, custom wrapper), run full
help once — not `--format json` unless you are generating tooling:

```bash
zap-cli help                        # or: zap-cli edit help
```

**Discovery of legal values** belongs on the `.zap` file, not in help:

```bash
zap-cli endpoint list app.zap --format json
zap-cli cluster list app.zap --endpoint 1 --enabled-only --format json
```

Most commands print a `Next:` section (or JSON `nextSteps`) with follow-ups.

### Operation index (same as `zap-cli help`)

| Group      | Operations                              |
| ---------- | --------------------------------------- |
| endpoint   | list, create, update, delete, duplicate |
| devicetype | list, add, remove, set                  |
| cluster    | list, enable, disable                   |
| attribute  | list, set, enable, disable              |
| command    | list, enable, disable                   |
| event      | list, enable, disable                   |
| feature    | list, enable, disable                   |
| package    | list, add, remove                       |
| (top)      | info, check, new, **apply**, help       |

Syntax: `zap-cli <group> <operation> <file.zap> [options]` (prepend `edit` on
older builds: `zap-cli edit cluster enable …`).

**Multiple writes:** use top-level **`apply`** with `--script` — not repeated
`<group> <operation>` calls. Each list entry uses `op: group.operation` and
camelCase parameters (same as subcommand flags).

## Packages: prefer `slc_args.json`, else pass `--zcl` and `--gen`

Studio and `slc generate` inject the project's SDK data model and templates by
expanding the `zcl.*` properties declared in ZAP's `apack.json`. SLC also
writes those resolved paths next to the `.zap` as `slc_args.json`.

**Current `zap-cli`** (this tree): if you omit `--zcl` / `--gen` and
`slc_args.json` sits beside the `.zap`, zap-cli fills them in from that file —
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
zap-cli <op> app.zap … \
  --zcl "$ZCL" --gen "$GEN" --packageMatch strict \
  --tempState
```

With a current build and `slc_args.json` present, `--zcl` / `--gen` may be
omitted; keep `--packageMatch strict` and `--tempState` (or a unique
`--stateDirectory` per job).

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

## Always isolate CLI state

Default state is shared (`~/.zap`), so concurrent `zap-cli` edits **or**
concurrent `slc generate` / `slc example create` (which also run ZAP) fail with
`SQLITE_BUSY: database is locked`. Pass **`--tempState`** on every invocation
(unique directory under the OS temp dir), or `--stateDirectory /tmp/zap-state-$$`.

## Do not hand-edit the `.zap` file

It is JSON, but ZAP re-applies storage, reporting and conformance rules on load,
so hand-written changes are commonly dropped and row relationships are easy to
break. A `zap-cli` change is identical to the same change in the GUI. **Using
editor tools on a `.zap` path is always wrong** — use this skill and `zap-cli`.

## Read before you write

`endpoint list`, `cluster list`, `attribute list`, `feature list` give exact
names and current state cheaply. Add `--format json` when parsing.

## Device type and features must stay coherent

Device type is the contract; features are its implementation. They are edited
independently, so they drift. Check `CONFORMANCE` / `REQUIREDBY` from
`feature list` first — `M` plus a device type name means mandatory for it.

```bash
# CT-only light: change the contract too, not just the feature
ZAP_PKG=(--zcl "$ZCL" --gen "$GEN" --packageMatch strict --tempState)
zap-cli devicetype set app.zap --endpoint 1 \
  --device-type MA-colortemperaturelight "${ZAP_PKG[@]}"
zap-cli feature disable app.zap --endpoint 1 --cluster "Color Control" \
  --feature XY "${ZAP_PKG[@]}"
```

Treat new `Feature Compliance` / `Device Type Compliance` warnings from **your**
edit as a failed customization unless a non-conformant config is wanted.

## Validation and exit codes

- Edit commands save and exit 0 even when they introduce **warnings**.
- Malformed endpoints and out-of-range defaults are **errors**; conformance
  findings are **warnings** (a spec-incomplete config is a valid intermediate).
- `--strict` on an edit refuses to save when _that edit_ introduced errors;
  `check --strict` exits 1 when errors exist. `--no-validate` skips it.
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
zap-cli cluster enable app.zap --endpoint 1 --cluster "Barrier Control" --side server \
  --packageMatch strict --tempState \
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
2. **`.zap` still sane** — `zap-cli check app.zap --packageMatch strict
--tempState` (plus `package list`, as above), and read
   the validation lines the edit printed. New device-type clusters commonly
   land with mandatory attributes out of range; fix those before building.
3. **It compiles** — `slc generate -p app.slcp -d .` then build. This is the
   only check that proves the cluster has an implementation: a missing UC
   component typically surfaces as an undefined-symbol link failure for that
   cluster's callbacks.

## Batch commands with `apply` (default for agents)

This is the **normal way to make several configuration changes**: one `zap-cli`
invocation, one ZCL load, many operations. `apply` runs a YAML or JSON list in
a single pass. Each entry names an operation (`op: cluster.enable`, …) and uses
**camelCase** parameter names (`deviceType`, `side`, `default`, …) matching
`zap-cli help <group> <operation>`.

Use **`apply` whenever you would otherwise run two or more edit subcommands** in
a row. Use a lone subcommand only for a single read (`list`, `check`) or a
single write.

`--new` starts from an empty configuration instead of reading the file.
**`silabs-tool-exec` cannot feed stdin** — always `--script <file>`, never
`--script -`.

### Where to put the script (and cleanup)

Prefer the **OS temp directory** so user projects do not accumulate agent files:

```bash
SCRIPT=$(mktemp /tmp/zap-apply.XXXXXX.yaml)
trap 'rm -f "$SCRIPT"' EXIT
# write YAML to "$SCRIPT", run apply, trap deletes the script on exit
```

If the script must live under the project (e.g. tooling restrictions), use
`tmp/zap-apply-<reason>.yaml` under the project root, **`rm -f` that file after
a successful `apply`**, and remove `tmp/` when empty. Do not commit these files;
add `tmp/zap-*.yaml` to `.gitignore` if the project keeps a `tmp/` directory.

Example batch:

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
zap-cli apply app.zap --script "$SCRIPT" \
  --zcl "$ZCL" --gen "$GEN" --packageMatch strict \
  --tempState
rm -f "$SCRIPT"   # when not using mktemp+trap
```

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
