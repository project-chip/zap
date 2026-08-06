# The `zap edit` CLI: a guide

This is a walkthrough of the `zap edit` command-line tool. If you already know
what you want and just need the flag, [the reference](zap-edit-cli.md) is
shorter, and `zap edit help` is shorter still.

`zap edit` does to a `.zap` file what the ZAP user interface does to a session.
It runs the same code underneath, so a configuration you build here is the same
configuration you would have built by clicking, and it generates the same code.
Reach for it when there is no display, when the change belongs in a script or a
review, or when you would rather type than click.

## Contents

- [Before you start](#before-you-start)
- [Part 1: build a configuration from nothing](#part-1-build-a-configuration-from-nothing)
- [Part 2: work on a file somebody else made](#part-2-work-on-a-file-somebody-else-made)
- [Part 3: finding things by name](#part-3-finding-things-by-name)
- [Part 4: many changes at once](#part-4-many-changes-at-once)
- [Part 5: Matter features](#part-5-matter-features)
- [Part 6: composed devices and parents](#part-6-composed-devices-and-parents)
- [Part 7: multiprotocol configurations](#part-7-multiprotocol-configurations)
- [Part 8: scripts and agents](#part-8-scripts-and-agents)
- [Part 9: when it says no](#part-9-when-it-says-no)
- [Part 10: not breaking things](#part-10-not-breaking-things)
- [Cheat sheet](#cheat-sheet)

## Before you start

### How to run it

If you have ZAP installed, the command is `zap edit`. From a source checkout,
use the start script so your flags are passed straight through:

```bash
node src-script/zap-start.js edit endpoint list light.zap
```

There is also an npm script, which needs `--` before the arguments so that npm
forwards them rather than eating them:

```bash
npm run zap-edit -- endpoint list light.zap
```

Every example below is written as `zap edit ...`. Substitute whichever form you
are using.

### The one thing everyone gets wrong

`zap edit` has to be told which ZCL data model to load, and **it defaults to
Zigbee**. For a Matter configuration, pass `--zcl`:

```bash
zap edit endpoint list light.zap --zcl ./zcl-builtin/matter/zcl.json
```

Forget it on a Matter file and device type and cluster names will not be found,
because you are searching the Zigbee catalog. If a name you are certain about
comes back as unknown, this is almost always why.

Add `--gen` pointing at your generation templates if you intend to generate code
from the file afterwards. To save repeating both on every command, put them in a
shell variable:

```bash
MATTER="--zcl ./zcl-builtin/matter/zcl.json --gen ./test/gen-template/matter/gen-test.json"
zap edit endpoint list light.zap $MATTER
```

### Ask the tool, not the internet

Two commands answer almost every question about the tool itself, and neither
reads your files, so both are instant:

```bash
zap edit help                    # every operation, one line each
zap edit help attribute set      # the options of one operation
```

## Part 1: build a configuration from nothing

We will build a Matter dimmable light and generate code from it. Every line of
output below is real.

### Step 1: an empty configuration

```bash
zap edit new light.zap $MATTER
```

```
Created an empty configuration
Next:
  zap edit devicetype list light.zap --all
  zap edit endpoint create light.zap --endpoint 1 --device-type <name>
Created endpoint 0 with the Root Node device type MA-rootdevice (0x0016)
Saved light.zap
```

Two things happened. The file was created, and **endpoint 0 was filled in with
the Root Node device type**, because a Matter application is not valid without
one. The user interface does this too when you start a new configuration. Pass
`--no-root-node` if you want it genuinely empty, and note that Zigbee has no
Root Node so nothing appears there.

Notice the `Next:` block. Every command ends by suggesting what usually follows,
built from the file in front of it so you can paste it as printed. Turn it off
with `--no-suggest`.

### Step 2: find a device type

Names come from the data model, not from your imagination, so look:

```bash
zap edit devicetype list light.zap --all --filter dimmablelight $MATTER
```

```
5 device type(s) available
CODE    NAME                   DOMAIN  PROFILE
------  ---------------------  ------  -------
0x0102  HA-colordimmablelight  HA      0x0104
0x0102  LO-colordimmablelight  LO      0x0104
0x0101  LO-dimmablelight       LO      0x0104
0x0101  MA-dimmablelight       CHIP    0x0103
0x0100  ZLL-dimmablelight      ZLL     0x0104
```

`--filter` narrows any listing. Without it you get all several hundred.

### Step 3: add the endpoint

```bash
zap edit endpoint create light.zap --endpoint 1 \
  --device-type MA-dimmablelight $MATTER
```

```
Created endpoint 1 with device type(s) MA-dimmablelight (0x0101)
The device type(s) enabled 6 cluster(s) on it
```

The device type brought its own clusters, attributes and commands with it,
exactly as picking it in the dialog would. You do not have to enable Identify,
Groups, On/Off and Level Control by hand.

The profile came from the device type, and the network defaulted to 0. Override
either with `--profile` and `--network` if you need to.

### Step 4: change an attribute

Look before you leap:

```bash
zap edit attribute list light.zap --endpoint 1 --cluster "Level Control" $MATTER
```

That prints every attribute with its current state. Then set one:

```bash
zap edit attribute set light.zap --endpoint 1 --cluster "Level Control" \
  --attribute CurrentLevel --enabled --default 25 $MATTER
```

```
Attribute CurrentLevel (0x0000) on Level Control/server of endpoint 1: enabled, default=25
```

One `attribute set` can change everything the attribute table in the UI can:

```bash
zap edit attribute set light.zap --endpoint 1 --cluster "Level Control" \
  --attribute CurrentLevel \
  --enabled --default 25 --storage NVM --singleton \
  --reporting --min-interval 5 --max-interval 300 --reportable-change 1 $MATTER
```

Boolean options negate in the usual way: `--no-singleton`, `--no-reporting`.

Some of it will not be yours to set, and the listing says which. The `fixed`
column names the fields the data model decides for you, exactly the controls the
UI shows greyed out:

```
CODE    NAME       SIDE    ENABLED  STORAGE   FIXED              DEFAULT
0x0000  ACL        server  yes      External  storage+reporting
0x0005  NodeLabel  server  yes      RAM       reporting
```

`ACL` is reached through the Attribute Access Interface, so its storage is fixed
at External and its value comes from application code rather than from a default
here. Ask for something else and you are told why:

```bash
zap edit attribute set light.zap --endpoint 1 --cluster "Access Control" \
  --attribute ACL --storage RAM $MATTER
```

```
⛔ ERROR: Attribute ACL on Access Control/server of endpoint 1 is served through the Attribute Access Interface
   Its storage is fixed at External, which is why the user interface
   greys the choice out: the value lives in application code rather than in
   an attribute store. Drop --storage, or pass --storage External.
```

This is a refusal rather than a warning because ZAP re-applies these rules every
time a file is read: the write would have looked like it worked and then vanished.

### Step 5: enable a command

```bash
zap edit command enable light.zap --endpoint 1 --cluster "Level Control" \
  --command MoveToLevel --direction in $MATTER
```

`--direction in` is a command the device **receives**; `out` is one it
**sends**. `both` does whichever of the two the endpoint can hold.

### Step 6: prove it works

The point of a `.zap` file is the code that comes out of it:

```bash
zap generate light.zap -o ./gen $MATTER
```

```
🤖 ZAP generation started:
🕐 Generation time: 961ms
```

96 files. And the value we set is in the generated C:

```c
/* Endpoint: 1, Cluster: Level Control (server) */
{ 0x00000000, ZAP_TYPE(INT8U), 1, ZAP_ATTRIBUTE_MASK(NULLABLE), ZAP_SIMPLE_DEFAULT(25) }, /* CurrentLevel */
...
{ 0x0000FFFC, ZAP_TYPE(BITMAP32), 4, 0, ZAP_SIMPLE_DEFAULT(3) },  /* FeatureMap */
```

`CurrentLevel` has our default of 25, and the `FeatureMap` is 3 because the
Dimmable Light device type requires the OnOff and Lighting features of Level
Control, which the device type switched on for us.

## Part 2: work on a file somebody else made

Read first. All five of these commands are read-only and never write:

```bash
zap edit info light.zap $MATTER                      # packages and endpoint count
zap edit check light.zap $MATTER                     # what is already wrong with it
zap edit endpoint list light.zap $MATTER             # endpoints and their device types
zap edit cluster list light.zap --endpoint 1 --enabled-only $MATTER
zap edit attribute list light.zap --endpoint 1 --cluster On/Off $MATTER
```

`zap edit info` is the first thing to run on an unfamiliar file, because it tells
you which data model it expects:

```
light.zap
2 endpoint(s), 1 package(s)
TYPE            CATEGORY  VERSION  PATH
--------------  --------  -------  --------------------------------------
zcl-properties  matter    1        .../zcl-builtin/matter/zcl.json
```

If the category says `matter`, that is your `--zcl`.

### Changing an endpoint

```bash
zap edit endpoint update light.zap --endpoint 1 --new-endpoint 5 $MATTER
zap edit endpoint duplicate light.zap --endpoint 1 --new-endpoint 2 $MATTER
zap edit endpoint delete light.zap --endpoint 2 $MATTER
```

Duplicating copies every cluster, attribute, command and event selection.
Deleting removes the endpoint type behind it too, unless another endpoint is
still using it.

## Part 3: finding things by name

Names are matched ignoring case and punctuation, so all of these select the same
cluster:

```bash
--cluster "On/Off"
--cluster onoff
--cluster ON_OFF
--cluster 0x0006
```

The same applies to device types, attributes, commands and events. Attributes
and clusters also match on their `define` name.

Get it wrong and you are told what was close:

```
⛔ Unknown cluster: 'levl controll'
Did you mean one of:
  Level Control (0x0008)
  Poll Control (0x0020)
  ...
```

`--endpoint` is different: it is always the endpoint identifier you see in the
UI and in generated code, never an internal row number.

## Part 4: many changes at once

Loading the ZCL data model takes a second or two and happens once per command,
so twenty commands means twenty loads. Put the operations in a file instead:

```yaml
# light.yaml
- op: endpoint.create
  endpoint: 1
  deviceType: MA-dimmablelight
- op: cluster.enable
  endpoint: 1
  cluster: Level Control
  side: server
- op: attribute.set
  endpoint: 1
  cluster: Level Control
  attribute: CurrentLevel
  enabled: true
  default: '25'
  reporting: true
  minInterval: 5
  maxInterval: 300
- op: command.enable
  endpoint: 1
  cluster: Level Control
  command: MoveToLevel
  direction: in
```

```bash
zap edit apply light.zap --script light.yaml $MATTER
```

The `op` names are the ones `zap edit help` lists, with a dot instead of the
space. Parameters are the command line flags in camelCase, so `--device-type`
becomes `deviceType` and `--min-interval` becomes `minInterval`. JSON works as
well as YAML.

To build a file from nothing in a single pass, add `--new`:

```bash
zap edit apply light.zap --new --script light.yaml $MATTER
```

And you can pipe the script in, which is handy when generating it:

```bash
./make-changes.sh | zap edit apply light.zap --script - $MATTER
```

**If any step fails, nothing is written.** The file is left exactly as it was, so
a batch either applies completely or not at all.

## Part 5: Matter features

A Matter feature is a bit of its cluster's `FeatureMap` attribute, and its
conformance decides which attributes and commands have to come with it.

```bash
zap edit feature list light.zap --endpoint 1 --cluster On/Off $MATTER
```

```
endpoint 1, cluster On/Off: featureMap 0x00000001
BIT  CODE     NAME               ENABLED  CONFORMANCE   REQUIREDBY
---  -------  -----------------  -------  ------------  ---------------------
0    LT       Lighting           yes      M             Matter Dimmable Light
1    DF       DeadFrontBehavior  no       [!OFFONLY]
2    OFFONLY  OffOnly            no       [!(LT | DF)]
```

Read that `CONFORMANCE` column carefully. Lighting shows `M` for **mandatory**
even though the On/Off cluster itself only makes it conditional, because this
endpoint is a Dimmable Light and the device type has the final say. The
`REQUIREDBY` column names the device type responsible.

Toggling runs the same conformance check the UI runs before it shows you a
confirmation dialog, and then does what the check says:

```bash
zap edit feature enable light.zap --endpoint 1 --cluster On/Off \
  --feature OffOnly $MATTER
```

```
Enabled feature OffOnly (OFFONLY, bit 2) on On/Off of endpoint 1, featureMap 0x00000000 -> 0x00000004
  disabled command On
  disabled command Toggle
```

Enabling `OffOnly` means the cluster stops accepting `On` and `Toggle`, so those
commands were turned off for you. Where conformance forbids a change outright,
for instance two features that exclude each other, the command refuses and says
why rather than leaving something the specification does not allow.

`--feature` takes the name, the letter code (`LT`), or the bit number.

## Part 6: composed devices and parents

Matter composed devices are expressed with `--parent`:

```bash
zap edit endpoint create fridge.zap --endpoint 1 \
  --device-type MA-refrigerator $MATTER
zap edit endpoint create fridge.zap --endpoint 2 \
  --device-type MA-temperature-controlled-cabinet --parent 1 $MATTER
```

`endpoint list` shows the relationship, and `endpoint update --parent ''`
detaches one. An endpoint cannot be its own parent, and it cannot be placed
under one of its own children, because composition is a tree.

Two limits are worth knowing, and both are shared with the user interface rather
than specific to this tool. Nothing checks that a device type which requires
child endpoints actually has them. And duplicating an endpoint does not carry
over its parent, so a copy of a child comes out detached and needs re-parenting.

## Part 7: multiprotocol configurations

A multiprotocol file holds two data models, and each numbers its endpoints from
scratch, so the same identifier legitimately appears twice. Load both models and
the listing tells you which is which:

```bash
MP="--zcl ./zcl-builtin/silabs/zcl.json --zcl ./zcl-builtin/matter/zcl.json"
zap edit endpoint list mp.zap $MP
```

```
ENDPOINT  CATEGORY  PROFILE  NETWORK  PARENT  DEVICETYPES
--------  --------  -------  -------  ------  ----------------------------
0         matter    0x0103   0                MA-rootdevice (0x0016) v1
1         zigbee    0x0104   0                LO-dimmablelight (0x0101) v1
1         matter    0x0103   0                MA-dimmablelight (0x0101) v1
```

`--category` then says which endpoint 1 you mean, and also narrows name lookups
to that half of the configuration:

```bash
zap edit cluster list mp.zap --endpoint 1 --category zigbee --enabled-only $MP
```

Leave it out and the command refuses rather than guessing, because editing the
wrong protocol's endpoint is worse than being asked to be specific.

The two halves also follow different rules about sharing, and both are honoured
in the same file. Zigbee treats a cluster's configuration as one global thing, so
a change to a cluster that several Zigbee endpoints enable applies to all of them.
Matter treats an attribute as belonging to its endpoint, so a change to a Matter
endpoint stays there. You do not have to ask for either; editing an endpoint gets
the behaviour its own protocol has.

```bash
# Both zigbee endpoints that enable On/off end up with this storage.
zap edit attribute set mp.zap --endpoint 1 --category zigbee \
  --cluster On/off --attribute on/off --enabled --storage NVM $MP

# The matter endpoint 1 beside it is untouched.
zap edit attribute list mp.zap --endpoint 1 --category matter --cluster On/Off $MP
```

## Part 8: scripts and agents

### Machine readable output

`--format json` replaces the tables with structured output:

```bash
zap edit attribute list light.zap --endpoint 1 --cluster On/Off \
  --format json $MATTER |
  jq -r '.operations[0].rows[] | select(.enabled == "yes") | .name'
```

In that mode **stdout carries the payload and nothing else** — progress notes
and warnings go to stderr — so piping into `jq` is safe. `--quiet` silences the
progress notes entirely. Exit status is 0 for success and 1 for failure, with the
reason on stderr.

### Discovering the tool programmatically

`zap edit help --format json` describes the entire command surface: every
operation, every option with its type, whether it is required, its permitted
values, and the camelCase name to use in a batch script. It also carries the
behaviours that are otherwise learned by trial and error, and the commands to run
to find out which names a particular configuration accepts.

It is generated from the same description the argument parser is built from, so
it cannot drift out of step with what the tool actually accepts, and it reads
nothing from disk.

A reasonable loop for something driving this without prior knowledge:

1. `zap edit help --format json` — learn the operations and their parameters.
2. `zap edit info <file> --format json` — learn which data model the file wants.
3. `zap edit cluster list <file> --all --format json` — learn the legal names.
4. `zap edit apply <file> --script -` — make the changes in one pass.

Each result also carries a `nextSteps` array, the structured form of the `Next:`
suggestions.

## Part 9: when it says no

The command refuses in a handful of situations, always deliberately. Each one
means something specific.

| What you see                                                | What it means                                                                             | What to do                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `Unknown cluster: 'x'` with candidates                      | The name is not in the loaded data model                                                  | Check `--zcl` first, then pick from the candidates        |
| `Cluster X is not enabled on the server side of endpoint N` | The saved format only keeps elements of enabled clusters, so this edit would be discarded | Run the `cluster enable` command it prints, then retry    |
| `The FeatureMap attribute of X is not enabled`              | Features live in that attribute's value, so there is nowhere to record the change         | Enable the `FeatureMap` attribute, as it prints           |
| `Endpoint N is defined 2 times`                             | Multiprotocol file, the identifier exists in both halves                                  | Add `--category zigbee` or `--category matter`            |
| `Endpoint N already exists`                                 | The identifier is taken                                                                   | Use `endpoint update`, or a free identifier               |
| `... already holds a configuration`                         | `new` would replace a real file                                                           | Use `-o` to write elsewhere, or `--force` if you meant it |
| `would form a loop`                                         | The parent chain would cycle                                                              | Detach the intermediate endpoint with `--parent ''`       |
| `An empty --default is not a value`                         | An empty string would be stored as 0, not as empty                                        | Give a value, or `null` for a nullable attribute          |
| `is served through the Attribute Access Interface`          | The data model fixes this attribute's storage at External                                 | Drop `--storage`, or pass `--storage External`            |
| `is stored externally` / `has no default value to set`      | An external attribute is read and written by application code                             | Add `--storage RAM` alongside `--default`                 |
| `has mandatory reporting`                                   | The specification requires reporting for this attribute                                   | Drop `--reporting`                                        |
| `Attribute X is not enabled on ...`                         | Storage, default, singleton and bounded only mean something once it is included           | Add `--enabled` to the same call                          |
| `source 'either'`                                           | The command has no side for the outgoing direction                                        | Use `--direction in`                                      |
| `could not be read as a configuration`                      | Not a `.zap` or `.isc` file                                                               | Check the path                                            |

## Part 10: not breaking things

**Look before you write.** `--dry-run` applies everything and reports what would
happen without touching any file:

```bash
zap edit cluster enable light.zap --endpoint 1 --cluster Scenes --side server \
  --dry-run $MATTER
```

**Write somewhere else.** `-o other.zap` leaves the input untouched.

**There is always a backup.** Saving keeps the previous content next to the file
with a `~` suffix.

**Validation tells you what you changed.** After every edit, the configuration is
validated and only the findings your edit introduced are listed. Findings that
were already there are reduced to a count, so the one line that matters is not
buried:

```
Enabled cluster Color Control (0x0300) server on endpoint 2
Validation: 2 new error(s), 0 new warning(s) (3 pre-existing error(s), 16 pre-existing warning(s))
  error: endpoint 2 Color Control/couple color temp to level min-mireds: Out of range
Saved light.zap
```

Out-of-range defaults and malformed endpoints count as errors. Conformance
findings count as warnings, because a spec-incomplete configuration is a
perfectly normal intermediate state while you are still building.

**And so do the notifications.** Some things are noticed as the file is read and
edited and recomputed nowhere: a provisional cluster in use, a command whose
response command is missing, a duplicate. These are what the UI counts in its
toolbar, and your edit reports the ones it caused:

```
Enabled command EnhancedAddScene (0x40) in on Scenes of endpoint 3
Notifications: 1 new (10 pre-existing)
  warning: On endpoint 3, cluster: Scenes server, outgoing command: EnhancedAddSceneResponse should be enabled as it is the response to the enabled incoming command: EnhancedAddScene.
```

Enabling that response command afterwards reports `1 resolved`.

**Ask at any time.** `zap edit check` reports both accounts for a file as it
stands, and changes nothing:

```bash
zap edit check light.zap $MATTER
zap edit check light.zap --strict $MATTER   # exits 1 if there are errors
```

**Fail the build on regressions.** `--strict` refuses to save when your edit
introduced errors, and ignores pre-existing ones, so an unrelated change to an
imperfect file still goes through:

```bash
zap edit attribute set light.zap --endpoint 1 --cluster On/Off \
  --attribute OnOff --default 0xFFFFFFFF --strict $MATTER   # exits 1, saves nothing
```

## Cheat sheet

```bash
# orientation
zap edit help                                   # every operation
zap edit help attribute set                     # one operation's options
zap edit info f.zap                             # what data model does this file want
zap edit check f.zap                            # what is wrong with this file

# looking
zap edit endpoint list f.zap
zap edit cluster   list f.zap --endpoint 1 --enabled-only
zap edit attribute list f.zap --endpoint 1 --cluster On/Off
zap edit command   list f.zap --endpoint 1 --cluster On/Off
zap edit event     list f.zap --endpoint 1 --cluster Switch
zap edit feature   list f.zap --endpoint 1 --cluster On/Off
zap edit devicetype list f.zap --all --filter light      # the catalog
zap edit cluster    list f.zap --all --filter level      # the catalog

# building
zap edit new f.zap
zap edit endpoint create f.zap --endpoint 1 --device-type MA-onofflight
zap edit cluster  enable f.zap --endpoint 1 --cluster "Level Control" --side server
zap edit attribute set   f.zap --endpoint 1 --cluster On/Off --attribute OnOff --enabled --default 1
zap edit command  enable f.zap --endpoint 1 --cluster On/Off --command Toggle --direction in
zap edit event    enable f.zap --endpoint 1 --cluster Switch --event InitialPress
zap edit feature  enable f.zap --endpoint 1 --cluster On/Off --feature Lighting

# changing endpoints
zap edit endpoint update    f.zap --endpoint 1 --new-endpoint 5
zap edit endpoint duplicate f.zap --endpoint 1
zap edit endpoint delete    f.zap --endpoint 5
zap edit devicetype add     f.zap --endpoint 1 --device-type MA-dimmablelight

# doing a lot at once
zap edit apply f.zap --script changes.yaml
zap edit apply f.zap --new --script changes.yaml
generate-changes | zap edit apply f.zap --script -

# staying safe
--dry-run          apply and report, write nothing
-o other.zap       write elsewhere
--strict           refuse to save if this edit introduced errors
--format json      machine readable, stdout is only the payload
--category matter  which half of a multiprotocol configuration
--filter text      narrow a listing
--no-suggest       stop printing follow-up commands
```

## Where to go next

- [The `zap edit` CLI reference](zap-edit-cli.md), for every option in detail.
- `zap edit help --format json`, if you are writing something that drives this.
- [The `zap edit` CLI architecture](zap-edit-architecture.md), for how it is built and why.
- [Validating `.zap` files](validating-zap-files.md), for checking without editing.
