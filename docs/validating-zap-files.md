# Validating `.zap` files

You can validate ZCL and data-model configuration in one or more `.zap` files without opening the UI. The same checks are available from the ZAP UI toolbar (**Validate**), which opens results in the side panel.

## CLI

### Synopsis

```bash
zap validate -i path/to/config.zap [-z zcl.json] [-g gen-templates.json] [-o report.json]
```

You can pass **more than one** `.zap` file in three ways:

- **Space-separated** after `validate` (no `-i` per file): `validate first.zap second.zap`
- **Comma-separated** in one argument: `validate -i first.zap,second.zap` (also works for a single `-i` value)
- **Repeat** `-i` / `--in` / `--zap` for each file: `validate -i first.zap -i second.zap`

One merged JSON (or YAML) report is written; it has a `zapFiles` array and one `results[]` entry per file.

```bash
node src-script/zap-start.js validate first.zap second.zap -o report.json
# or
node src-script/zap-start.js validate -i first.zap,second.zap -o report.json
# or
node src-script/zap-start.js validate -i first.zap -i second.zap -o report.json
```

### Options

| Flag                                  | Meaning                                                                                                                                                                                                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-i`, `--in`, `--zap`                 | Input `.zap` file. For `validate`, you may pass several paths: space-separated after the command, comma-separated in one `-i` value (e.g. `-i a.zap,b.zap`), or repeat this flag.                                                                                                  |
| `-z`, `--zcl`, `--zclProperties`      | ZCL metafile(s), for example `./zcl-builtin/matter/zcl.json` or `./zcl-builtin/silabs/zcl.json`. Use these to validate against a specific ZCL definition instead of only the built-in default or whatever `zcl.properties` paths are embedded in the `.zap` file. May be repeated. |
| `-g`, `--gen`, `--generationTemplate` | Generation template metafile(s), for example `./test/gen-template/matter/gen-test.json`. Overrides the built-in default and template references inside the `.zap` file for validation context. May be repeated.                                                                    |
| `-o`, `--output`, `--validateOutput`  | Write the structured validation report to a file. Use a `.yaml` or `.yml` extension for YAML output. For the `validate` command, `-o` / `--output` is treated as the report path (not the generation output directory).                                                            |

When **no** output path is given, the JSON report is printed to **stdout**. Progress and status messages go to **stderr** so you can redirect stdout to a file safely:

```bash
node src-script/zap-start.js validate -i path/to/config.zap > report.json
```

Exit code is **non-zero** when the report contains validation errors.

### Running from this repository

Use the start script so flags are passed straight through (avoiding `npm run` swallowing leading `-` flags):

```bash
node src-script/zap-start.js validate \
  -i path/to/config.zap \
  -z ./zcl-builtin/matter/zcl.json \
  -g ./test/gen-template/matter/gen-test.json \
  -o report.json
```

If you use `npm run zap-validate`, put **`--`** before script arguments so npm forwards `-i`, `-z`, `-g`, and `-o`:

```bash
npm run zap-validate -- -i path/to/config.zap -z path/to/zcl.json -g path/to/templates.json -o ./report.json
```

### Example: Matter / connectedhomeip

When validating an app from [connectedhomeip](https://github.com/project-chip/connectedhomeip), point `-z` and `-g` at that tree’s ZCL and template metafiles so validation matches the SDK your app targets:

```bash
node src-script/zap-start.js validate \
  -i examples/your-app/your-app.zap \
  -z src/app/zap-templates/zcl/zcl.json \
  -g src/app/zap-templates/app-templates.json \
  -o ./report.json
```

Paths above are relative to the connectedhomeip repository root; adjust for your checkout.

## Report format

The report is JSON (or YAML if the output path ends in `.yaml` / `.yml`). It aggregates per-file results, summaries (error counts, endpoint/cluster/attribute counts), and detailed findings for endpoints, attributes, and conformance.
