---
name: zap-zcl-configurator
description: Use ZAP (zap-cli) to read or change .zap files — the Zigbee/Matter endpoint, cluster, attribute, command, event and feature configuration for an application. Use whenever a task involves a .zap file or adding/changing endpoints, device types or clusters.
---

# ZAP — ZCL Advanced Platform

ZAP is the configuration tool for Zigbee and Matter applications. A `.zap` file
holds an application's endpoints, device types, clusters, attributes, commands,
events and features. Generated source code is produced from that file, so the
`.zap` file is the source of truth for what the application supports.

The release ships two programs:

- `zap` — the graphical editor
- `zap-cli` — the same engine on the command line, for headless and agent use

## When to use this

Use `zap-cli` whenever a task involves a `.zap` file, for example:

- adding an endpoint or a device type
- enabling a cluster, attribute, command or event
- turning a cluster feature on or off
- changing an attribute default
- checking whether a configuration is valid

## Do not hand-edit the `.zap` file

A `.zap` file is JSON, but editing it directly is unreliable. ZAP re-applies
storage, reporting and conformance rules when the file is read, so hand-written
changes are commonly dropped on the next load, and cluster/attribute rows have
internal relationships that are easy to break.

Always go through `zap-cli`. A change made by `zap-cli` is identical to the same
change made in the GUI.

## Discovering the commands

The command surface is self-describing. Start here rather than guessing:

```bash
zap-cli edit help                  # every operation, one line each
zap-cli edit help attribute set    # options for one operation
zap-cli edit help --format json    # the whole surface as a machine readable schema
```

Most commands also print a `Next:` section with ready-to-run follow-up commands.

## Always pass `--zcl`, and take it from the SDK

`--zcl` defaults to the Zigbee data model no matter what the file contains. It
does **not** fall back to the data model the `.zap` file was built against, so
omitting it on a Matter file loads the wrong one. Nothing errors: endpoints go
missing from listings and device types come back blank.

**The value comes from the SDK, not from you.** ZAP declares these in
`apack.json` as `uc.sdkProvidedProperties`, and the SDK populates them:

```
zcl.matterZclJsonFile       zcl.matterTemplateJsonFile
zcl.zigbeeZclJsonFile       zcl.zigbeeTemplateJsonFile
```

Read those properties from the SDK and pass the one matching the protocol as
`--zcl`. Do not substitute ZAP's own bundled copies: they are a different
version of the data model than the SDK generates against, and the two can
disagree.

When the properties are not set, the SDK falls back to these paths:

|        | ZCL                                                                        | Templates                                                                        |
| ------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Zigbee | `${sdkRoot}/app/zcl/zcl-zap.json`                                          | `${sdkRoot}/protocol/zigbee/app/framework/gen-template/gen-templates.json`       |
| Matter | `${sdkRoot}/extension/matter_extension/src/app/zap-templates/zcl/zcl.json` | `${sdkRoot}/extension/matter_extension/src/app/zap-templates/app-templates.json` |

Only when there is no SDK at all — a standalone experiment — `--zcl matter` and
`--zcl zigbee` select the copies bundled inside ZAP.

## Typical use

`$ZCL` below is the SDK-provided path, for example the value of
`zcl.matterZclJsonFile`:

```bash
ZCL="<value of zcl.matterZclJsonFile>"

# What is in this file?
zap-cli edit endpoint list app.zap --zcl "$ZCL"

# Add an endpoint with a device type
zap-cli edit endpoint create app.zap --endpoint 1 \
  --device-type MA-dimmablelight --zcl "$ZCL"

# Change an attribute default
zap-cli edit attribute set app.zap --endpoint 1 --cluster "Level Control" \
  --attribute CurrentLevel --enabled --default 42 --zcl "$ZCL"

# Validate
zap-cli edit check app.zap --zcl "$ZCL"
```

Sanity check after any edit: run `endpoint list` and confirm the endpoints and
device types you expect are actually shown. Blank device types or a missing
endpoint means the wrong `--zcl` was loaded.

Other useful options:

- `--gen` is optional. It is only needed to generate code; pass the SDK's
  `zcl.matterTemplateJsonFile` / `zcl.zigbeeTemplateJsonFile` when you do.
- `--stateDirectory <dir>` keeps working state out of the shared default, which
  matters when several tasks run at once.
- `--format json` for machine readable output, `--dry-run` to preview.

## More

Project and full documentation: https://github.com/project-chip/zap/
