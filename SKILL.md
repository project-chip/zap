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

## Always pass `--zcl`, from the SDK

`--zcl` defaults to Zigbee regardless of file contents, and does **not** fall
back to what the file was built against. Omit it on a Matter file and nothing
errors: endpoints vanish from listings and device types come back blank.

The value comes from the SDK, which populates `uc.sdkProvidedProperties`
(`zcl.matterZclJsonFile`, `zcl.zigbeeZclJsonFile`, and the matching
`*TemplateJsonFile`). Prefer those properties; SLT/Conan layouts differ from
plain SDK installs. Fallbacks:

|        | ZCL                                                                        | Templates                                                                        |
| ------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Zigbee | `${sdkRoot}/app/zcl/zcl-zap.json`                                          | `${sdkRoot}/protocol/zigbee/app/framework/gen-template/gen-templates.json`       |
| Matter | `${sdkRoot}/extension/matter_extension/src/app/zap-templates/zcl/zcl.json` | `${sdkRoot}/extension/matter_extension/src/app/zap-templates/app-templates.json` |

Never substitute ZAP's bundled copies (`--zcl matter` / `--zcl zigbee`) when an
SDK exists — they are a different version of the data model than the SDK
generates against. Sanity check after any edit: `endpoint list` must show the
endpoints and device types you expect.

## Always isolate `--stateDirectory`

Default state is shared (`~/.zap`), so concurrent `zap-cli` edits **or**
concurrent `slc generate` / `slc example create` (which also run ZAP) fail with
`SQLITE_BUSY: database is locked`. Pass a unique directory per job:

```bash
zap-cli edit ... --stateDirectory /tmp/zap-state-$$ --zcl "$ZCL"
```

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
zap-cli edit devicetype set app.zap --endpoint 1 \
  --device-type MA-colortemperaturelight --zcl "$ZCL"
zap-cli edit feature disable app.zap --endpoint 1 --cluster "Color Control" \
  --feature XY --zcl "$ZCL"
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
   nothing implementing it does nothing. `zap-cli` does this exactly as the GUI
   does — by asking a running Simplicity Studio — so it needs
   `--studioHttpPort` **and** `--ideProjectPath` **and** `--gen` (the mapping
   lives in the gen-templates package). Without all three it stays silent, and
   the components must be added with `slc` instead.
2. **Regenerate and rebuild.** `slc generate`, then build, so
   `autogen/zap-generated` matches the `.zap`.

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
zap-cli edit apply app.zap --script changes.yaml --zcl "$ZCL" \
  --stateDirectory /tmp/zap-state-$$
```

## Other flags worth knowing

- `--category zigbee|matter` — required on multiprotocol files, where endpoint
  numbering is per protocol.
- `-o` / `--output` writes elsewhere; `--dry-run` previews; `--force` allows
  replacing an existing file with `new` / `--new`.
- `--gen` takes the SDK's `*TemplateJsonFile`. Needed to generate code, and for
  UC component integration.
- Matter configs get the Root Node on endpoint 0; `--parent` composes endpoints.

## More

Project and full documentation: https://github.com/project-chip/zap/
