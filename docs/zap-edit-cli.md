# The `zap edit` CLI: reference

This is the reference for the `zap edit` command-line tool. If you are starting
out, or want a worked example that ends in generated code, read [the
guide](zap-edit-guide.md) first. For how the CLI is built and why, read [the
architecture](zap-edit-architecture.md).

`zap edit` performs the same edits on a configuration that the ZAP user
interface performs on a session: creating endpoints, managing their device
types, enabling clusters, and configuring attributes, commands and events. It
is built on the same database queries the REST layer uses, so a change made
here is indistinguishable from the same change made in the GUI.

```
zap edit <what> <operation> <file.zap> [options]
```

## Finding your way around

`zap edit help` prints every operation and what it takes, in one page. It reads
nothing from disk, so it answers instantly:

```bash
zap edit help                  # every operation, one line each
zap edit help attribute        # options of every attribute operation
zap edit help attribute set    # options of one operation
```

`zap edit --help` and `zap edit <what> <operation> --help` also work, in the
usual yargs way.

Every command also ends by suggesting what usually comes next, built from the
configuration in front of it so the suggestion can be run exactly as printed:

```
$ zap edit endpoint create light.zap --endpoint 1 --device-type MA-dimmablelight
Created endpoint 1 with device type(s) MA-dimmablelight (0x0101)
The device type(s) enabled 6 cluster(s) on it
Next:
  zap edit cluster list light.zap --endpoint 1 --enabled-only
  zap edit cluster enable light.zap --endpoint 1 --cluster "<name>" --side server
```

Listings suggest acting on something they actually found, choosing an entry
where the command would do something rather than one that is already switched
on, and never proposing to turn off a feature the device type requires. A filter
that matched nothing offers to widen the search instead. `--no-suggest` turns
the suggestions off, and `--format json` carries them as `nextSteps` either way.

For anything driving the tool programmatically, `--format json` turns the same
information into a schema:

```bash
zap edit help --format json
```

That schema lists every operation, every option with its type, whether it is
required, its allowed values, and the camelCase name to use in a batch script.
It also carries the behaviours that are easy to get wrong, and the commands to
run to discover which cluster and device type names a given configuration
accepts. It is generated from the same description the argument parser is built
from, so it cannot fall out of step with what the tool actually accepts.

## Selecting things by name

Every selector accepts a name, a define, or a numeric code in decimal or hex,
and names are matched ignoring case and punctuation. These all mean the same
cluster:

```bash
--cluster "On/Off"
--cluster onoff
--cluster ON_OFF
--cluster 0x0006
```

`--endpoint` is always the endpoint identifier you see in the GUI and in
generated code, never a database row id. When a name matches nothing, the error
lists the closest candidates; when it matches more than one, the error lists
what it matched and you can narrow it down with `--category` or a code.

Every `list` command takes `--filter <text>` to narrow a long catalog down to
the entries that mention something:

```bash
zap edit cluster list light.zap --all --filter level
zap edit attribute list light.zap --endpoint 1 --cluster On/Off --filter time
```

## Loading the right ZCL metadata

Like every other ZAP command, `zap edit` needs to be told which ZCL metadata to
load. It defaults to the built-in Zigbee metafile, so for Matter configurations
pass `--zcl`:

```bash
zap edit endpoint list light.zap --zcl ./zcl-builtin/matter/zcl.json
```

## Multiprotocol configurations

A multiprotocol configuration holds two data models at once, and each numbers
its endpoints from scratch, so the same identifier legitimately appears twice.
`endpoint list` shows which protocol each belongs to:

```
ENDPOINT  CATEGORY  PROFILE  NETWORK  PARENT  DEVICETYPES
--------  --------  -------  -------  ------  --------------------------
0         matter    0x0103   0                MA-rootdevice (0x0016) v1
1         zigbee    0x0104   0                LO-dimmablelight (0x0101) v1
1         matter    0x0103   0                MA-dimmablelight (0x0101) v1
```

`--category zigbee` or `--category matter` then says which one you mean, and
also narrows name lookups to that half:

```bash
zap edit cluster list mp.zap --endpoint 1 --category zigbee --enabled-only
```

Without it, an operation on an endpoint that exists twice is refused rather than
guessed at, because editing the wrong protocol's endpoint is worse than being
asked to be specific.

One thing you cannot do is _create_ an endpoint whose identifier is already used
by the other protocol. ZAP counts endpoint identifiers across the whole
configuration and reports any repeat as `Duplicate EndpointIds Exist`, so the
files that already do this are ones its own validation objects to. Rather than
produce more of them, `endpoint create` refuses and says why. Editing either of
the existing endpoints works normally.

## Endpoints

```bash
# What is in this file?
zap edit endpoint list light.zap

# Add an endpoint. The profile defaults to the device type's own profile.
zap edit endpoint create light.zap --endpoint 1 --device-type "ZLL-onofflight"

# A Matter endpoint with two device types, the first one being primary.
zap edit endpoint create light.zap --endpoint 2 \
  --device-type MA-onofflight --device-type MA-dimmablelight \
  --device-version 1 --parent 0

# Change identity.
zap edit endpoint update light.zap --endpoint 1 --new-endpoint 5 --network 0

# Copy an endpoint with every cluster and element selection on it. Without
# --new-endpoint the lowest free identifier is used.
zap edit endpoint duplicate light.zap --endpoint 1

zap edit endpoint delete light.zap --endpoint 5
```

## Device types

```bash
zap edit devicetype list light.zap --endpoint 1
zap edit devicetype list light.zap --all          # everything available

zap edit devicetype add light.zap --endpoint 1 --device-type MA-dimmablelight
zap edit devicetype remove light.zap --endpoint 1 --device-type MA-dimmablelight

# Replace the whole list. The first entry becomes the primary device type.
zap edit devicetype set light.zap --endpoint 1 \
  --device-type MA-dimmablelight --device-version 2
```

Adding a device type applies its defaults on top of the existing configuration.
Removing one leaves the clusters it brought in enabled, which is what the GUI
does too.

## Clusters

```bash
zap edit cluster list light.zap --endpoint 1 --enabled-only
zap edit cluster list light.zap --all

zap edit cluster enable light.zap --endpoint 1 --cluster "Level Control" --side server
zap edit cluster disable light.zap --endpoint 1 --cluster Scenes --side client
```

`--side` is required and takes `client`, `server` or `both`. There is no
sensible default, and guessing wrong is not something you would notice until
generation.

Enabling a cluster for the first time also brings in its mandatory attributes
and commands, exactly as ticking the checkbox in the GUI does.

Any cluster the loaded data model defines can be enabled on any endpoint. The
GUI's Legal Clusters filter additionally refuses to let go of a cluster a device
type on the endpoint requires, but that is a property of the view you have
chosen rather than of the configuration, so it is not reproduced here. What a
device type requires is reported as a validation finding instead, which says the
same thing without depending on how you are looking at the file.

## Attributes

```bash
zap edit attribute list light.zap --endpoint 1 --cluster On/Off

zap edit attribute enable  light.zap --endpoint 1 --cluster On/Off --attribute OnOff
zap edit attribute disable light.zap --endpoint 1 --cluster On/Off --attribute OnOff

# Anything the attribute table in the GUI can change, in one call.
zap edit attribute set light.zap --endpoint 1 --cluster "Level Control" \
  --attribute CurrentLevel \
  --enabled --default 10 --storage RAM --singleton \
  --reporting --min-interval 5 --max-interval 300 --reportable-change 1

# Nullable attributes take the literal word null.
zap edit attribute set light.zap --endpoint 1 --cluster "Level Control" \
  --attribute CurrentLevel --default null
```

`--side` is optional. Most attributes exist on one side only, and when one
exists on both, the side the endpoint has enabled is used. Pass `--side` when
neither rule settles it.

Boolean options are negatable in the usual way: `--no-singleton`,
`--no-reporting`, and so on.

Whatever you set is validated the same way the GUI validates it, and an
out-of-range default is reported as an error.

### What is not yours to set

Parts of an attribute are decided by the data model rather than by you, and the
GUI shows this by greying a control out. The command line says no instead:

- The storage of an attribute reached through the **Attribute Access Interface**
  is fixed at External. The data model marks these either on the attribute
  itself, as it does for `AttributeList`, or as a cluster and attribute pair, so
  `ClusterRevision` is ordinary on most clusters and fixed on Access Control.
  Their value lives in application code, so they have no default value either.
- **External** storage of any kind leaves nowhere to keep a default. Pass
  `--storage RAM` or `--storage NVM` in the same call if you want to set one.
- **Reporting** can be mandatory or forbidden. Most Matter attributes make it
  mandatory, so `--no-reporting` on them is refused.
- Storage, default value, singleton and bounded all describe how an attribute is
  kept, and an attribute that is not included is not kept at all. Add `--enabled`
  to the same call.

`attribute list` names these in its `fixed` column, so you can tell a value you
may change from one you may not:

```
CODE    NAME              SIDE    ENABLED  STORAGE   FIXED              DEFAULT
0x0000  ACL               server  yes      External  storage+reporting
0x0005  NodeLabel         server  yes      RAM       reporting
```

These are refusals rather than warnings for a reason: ZAP re-applies these
policies every time a configuration is read, so an edit that disagreed with them
would be reported as done and then quietly undone by the next read. Asking for
the value that is already fixed is not refused, so a script may restate what it
finds.

One case is stricter here than in the GUI. A global attribute such as
`AttributeList` carries the policy on itself and belongs to no cluster, so the
pair matching the GUI uses to grey the control never matches it and the choice
looks open. The write does not survive a read either way, so this tool refuses
it rather than accept something it cannot keep.

## Commands

```bash
zap edit command list light.zap --endpoint 1 --cluster On/Off

zap edit command enable light.zap --endpoint 1 --cluster On/Off \
  --command Toggle --direction in
```

`--direction` is required. `in` is a command the device receives, `out` is one
it sends. `both` applies to whichever directions the endpoint can hold, so it
does the useful half on a cluster that is only enabled on one side.

## Events

```bash
zap edit event list light.zap --endpoint 1 --cluster Switch
zap edit event enable light.zap --endpoint 1 --cluster Switch --event InitialPress
```

## Features (Matter)

A Matter cluster feature is a bit of the cluster's FeatureMap attribute, and
its conformance decides which attributes, commands and events have to come with
it.

```bash
zap edit feature list light.zap --endpoint 1 --cluster On/Off
zap edit feature enable light.zap --endpoint 1 --cluster On/Off --feature Lighting
```

`--feature` takes the feature name, its letter code (`LT`), or its bit number.

A feature carries two conformances: the one the cluster specification gives it,
and the one the endpoint's device type gives it. Lighting on the On/Off cluster
is conditional in general but mandatory on a Dimmable Light. The device type has
the final say, so that is the conformance reported and the one the checks use.
`feature list` names the device type in a `requiredBy` column:

```
BIT  CODE     NAME               ENABLED  CONFORMANCE   REQUIREDBY
---  -------  -----------------  -------  ------------  --------------------
0    LT       Lighting           yes      M             Matter Dimmable Light
1    DF       DeadFrontBehavior  no       [!OFFONLY]
2    OFFONLY  OffOnly            no       [!(LT | DF)]
```

Toggling a feature runs the same conformance check the GUI runs before it opens
its confirmation dialog, then applies what the check says, which is what
pressing Confirm does. The elements that changed as a consequence are counted
and then listed:

```
Enabled feature OffOnly (OFFONLY, bit 2) on On/Off of endpoint 1, featureMap 0x00000000 -> 0x00000004
Its conformance 2 commands disabled:
  disabled command On
  disabled command Toggle
```

```
Disabled feature Lighting (LT, bit 0) on On/Off of endpoint 1, featureMap 0x00000001 -> 0x00000000
Its conformance 4 attributes and 3 commands disabled:
  disabled attribute GlobalSceneControl
  disabled attribute OnTime
  disabled attribute OffWaitTime
  disabled attribute StartUpOnOff
  disabled command OffWithEffect
  disabled command OnWithRecallGlobalScene
  disabled command OnWithTimedOff
warning: Check Feature Compliance on endpoint: 1, cluster: On/Off, feature: Lighting (LT) (bit 0 in featureMap attribute) should be enabled, as it is mandatory for device type: Matter On/Off Light.
```

The count is the same information the confirmation dialog conveys by listing
the elements, said in the one line a caller reads first.

A warning appears under the same condition the GUI pops one up, which is not
the same as "whenever the specification has an opinion". Switching off a
feature a device type requires is worth saying; switching it back on is not,
even though the sentence describing the rule can still be composed. Enabling a
provisional feature warns, leaving it off does not.

When conformance forbids the change outright, for example because two features
exclude each other, the command refuses it and prints the reason instead of
leaving the configuration in a state the specification does not allow. A feature
whose conformance is `X` or `D` cannot be selected at all, which is the case the
GUI shows as a greyed-out switch.

A feature declared without any conformance at all, as much of the newer Matter
data model is, requires nothing and forbids nothing, so it toggles freely.

## Elements of disabled clusters

The saved file format only keeps the attributes, commands and events of enabled
clusters. Configuring an element of a cluster side you have not enabled would
therefore be discarded on save, so `zap edit` refuses it and tells you which
cluster to enable first. The GUI avoids the same problem by only showing the
element checkboxes of clusters that are switched on.

## Doing several things at once

Loading the ZCL metadata is by far the slowest part of an invocation, so
chaining separate commands pays that cost every time. `zap edit apply` runs a
whole list of operations in a single pass:

```yaml
# changes.yaml
- op: endpoint.create
  endpoint: 1
  deviceType: ZLL-onofflight
- op: cluster.enable
  endpoint: 1
  cluster: Level Control
  side: server
- op: attribute.set
  endpoint: 1
  cluster: Level Control
  attribute: CurrentLevel
  enabled: true
  default: '10'
  reporting: true
  minInterval: 5
  maxInterval: 300
- op: command.enable
  endpoint: 1
  cluster: Level Control
  command: Move
  direction: in
```

```bash
zap edit apply light.zap --script changes.yaml
```

Each entry names an operation and carries the same parameters as the matching
subcommand, with the flag names written in camelCase (`--device-type` becomes
`deviceType`, `--min-interval` becomes `minInterval`). JSON works as well as
YAML, a top level `operations:` key wrapping the list is accepted, and
`--script -` reads the list from standard input.

To build a configuration from nothing in a single pass, add `--new`, which
starts from an empty configuration instead of reading the file:

```bash
zap edit apply light.zap --new --script changes.yaml
```

`zap edit new light.zap` on its own creates an empty configuration file.

## Endpoint composition

`--parent` puts an endpoint under another one, which is how Matter expresses a
composed device:

```bash
zap edit endpoint create fridge.zap --endpoint 1 --device-type MA-refrigerator
zap edit endpoint create fridge.zap --endpoint 2 \
  --device-type MA-temperature-controlled-cabinet --parent 1
```

A new configuration whose data model declares a Root Node device type gets it on
endpoint 0 automatically, because a Matter application is not valid without one.
This mirrors what the user interface does when you start a new configuration.
`--no-root-node` skips it, and data models that declare no Root Node, Zigbee
among them, are unaffected.

Two limits are worth knowing, and both are shared with the user interface rather
than specific to this tool. Nothing checks that a device type which requires
child endpoints actually has them: the requirement is recorded in the data model
and reaches code generation, but neither tool enforces it. And duplicating an
endpoint does not carry over its parent, so a copy of a child endpoint comes out
detached and has to be re-parented with `zap edit endpoint update --parent`.

## Clusters shared between endpoints (Zigbee)

In Zigbee the configuration of a cluster is a single global thing. If the same
cluster is enabled on more than one endpoint, the attributes and commands it
includes, their storage, defaults and reporting are the same on each, because the
framework keeps one copy. The user interface re-aligns the endpoints after every
change, and so does this: a change to one endpoint's copy of a shared cluster
applies to the others before the file is written.

```
Attribute identify time (0x0000) on Identify/server of endpoint 42: enabled, default=7, storage=NVM
```

With `Identify` also on endpoint 43, that endpoint now reads `default=7` and
`storage=NVM` too.

Whether this applies is a property of the data model rather than of the tool: it
happens where the loaded templates ask for it, which the Zigbee ones do. Matter
does not, because a Matter attribute genuinely is per endpoint, so Matter
endpoints are configured one at a time. In a multiprotocol configuration both
hold at once: the Zigbee endpoints share, and the Matter endpoints beside them are
left exactly as they were.

## Where the result goes

`zap edit new` and `--new` refuse to start from an empty configuration on top of
a file that already holds one, since that would replace it. Write elsewhere with
`-o`, or pass `--force` if replacing it is what you meant.

By default the file you named is rewritten in place, and whatever it held
before is kept alongside it with a `~` suffix. `-o <file>` writes somewhere else
and leaves the input alone, and `--dry-run` applies everything and reports what
would happen without writing anything. Operations that only read, such as the
`list` commands and `zap edit info`, never write.

## Validation

After an edit, the configuration is validated and the findings the edit
introduced are reported. Findings that were already in the file are reduced to
a count, because listing all of them after every small change buries the one
line that matters:

```
Enabled cluster Color Control (0x0300) server on endpoint 2
Validation: 2 new error(s), 0 new warning(s) (3 pre-existing error(s), 16 pre-existing warning(s))
  error: endpoint 2 Color Control/couple color temp to level min-mireds: Out of range
  error: endpoint 2 Color Control/start up color temperature mireds: Out of range
Saved light.zap
```

Malformed endpoints and out-of-range attribute defaults count as errors.
Conformance findings count as warnings, because a spec-incomplete configuration
is a legitimate intermediate state while you are building one up.

Switching off an attribute, command or event that something still requires is
reported by whichever rule wants it, and often by both. The device type is one
of them; the cluster's current feature selection is the other, and that one
names the feature so you can see what to change:

```
Attribute OnTime (0x4001) on On/Off/server of endpoint 1: disabled
Validation: 0 new error(s), 2 new warning(s)
  warning: endpoint 1 On/Off: Check Feature Compliance on endpoint: 1, cluster: On/Off, attribute: OnTime has mandatory conformance to LT and should be enabled, when feature: LT is enabled.
  warning: endpoint 1 On/Off: Check Device Type Compliance on endpoint: 1, device type: MA-onofflight, cluster: On/Off, attribute: OnTime needs to be enabled
```

`--strict` refuses to save when the edit introduced errors. It ignores
pre-existing ones, so an unrelated edit to an already-imperfect file still goes
through. `--no-validate` skips the check.

## Notifications

Validation is not the whole story. Some things are observed as a configuration
is read and edited and are recorded nowhere else: a cluster the specification
still calls provisional, a command whose response command is not enabled, a
duplicate, a device type the loaded metadata no longer knows. These are the
notifications the GUI counts in its toolbar and lists in its notification panel,
and an edit reports the ones it brought about, alongside the validation findings:

```
Enabled command EnhancedAddScene (0x40) in on Scenes of endpoint 3
Validation: no new issues (2 pre-existing warning(s))
Notifications: 1 new (10 pre-existing)
  warning: On endpoint 3, cluster: Scenes server, outgoing command: EnhancedAddSceneResponse should be enabled as it is the response to the enabled incoming command: EnhancedAddScene.
Saved light.zap
```

Doing as it says takes the notification away again, which is reported as
`1 resolved`. Where a notification says the same thing as a validation finding,
it is only reported once.

### Why the GUI agrees about them

None of this is stored in the `.zap` file. Notifications are held against the
session, and they get there in three ways: database triggers raise them as
cluster, attribute and command states are written; the importer recomputes the
conformance ones as a file is read; and validation recomputes them again on
demand. All three are below the REST layer, so the command line gets them for
nothing rather than reimplementing them.

The practical consequence is the one that matters. Break the specification from
the command line, open the file in the GUI, and the toolbar count and the
notification panel say exactly what they would have said if you had made the
same change by clicking, because they are computed from the file either way.
There is no state to keep in step and nothing to lose by editing headlessly.

The reverse is also true: undo the change and the notifications go, since
nothing is remembered from before.

## Checking a configuration

`zap edit check` reports both accounts for a configuration as it stands, without
changing anything:

```bash
zap edit check light.zap
zap edit check light.zap --format json
zap edit check light.zap --strict   # exit 1 when there are errors
```

```
light.zap: 1 error(s), 4 warning(s)
KIND     SOURCE         MESSAGE
-------  -------------  -------------------------------------------------------------
error    validation     endpoint 1 On/Off/StartUpOnOff: Out of range
warning  validation     endpoint 1 Identify: Check Cluster Compliance on endpoint: 1, cluster: Identify, mandatory attribute: IdentifyType needs to be enabled
warning  configuration  On endpoint 1, support for cluster: Scenes server is provisional.
```

The `source` column says where a finding came from: `validation` for what is
recomputed from the current state, `configuration` for a notification about this
file. `--packages` adds what ZAP has to say about the data model itself, such as
a cluster definition whose XML contradicts itself, which is kept out of the way
by default because it is not something a configuration can fix.

## Scripting

`--format json` prints a machine readable result instead of tables, with one
entry per operation and the rows of any listing:

```bash
zap edit attribute list light.zap --endpoint 1 --cluster On/Off --format json |
  jq -r '.operations[0].rows[] | select(.enabled == "yes") | .name'
```

In that mode standard output carries the payload and nothing else; progress
messages and warnings go to standard error. `--quiet` suppresses them entirely.
The exit code is 0 on success and 1 on failure.

A caller that has never seen this tool before can work out everything it needs
from three calls: `zap edit help --format json` for the operations and their
parameters, then the discovery commands that schema recommends for the values a
particular configuration accepts, then `zap edit apply` to make the changes.

## Packages

Editing preserves the ZCL and generation template packages a configuration
names, which is why `--packageMatch` defaults to `fuzzy` here rather than to
the `ignore` that `zap convert` uses. Use `--packageMatch strict` to fail when
a package named in the file cannot be found, instead of falling back to a
loaded one.

Note that saving normalizes a configuration the same way `zap convert` does:
elements that are not selected are not written out, and mandatory elements the
loaded ZCL metadata requires are added. This is existing ZAP behaviour and
applies to any tool that loads and saves a `.zap` file.

## UC components

Configuring a cluster is half of what ticking its checkbox in the GUI does. The
other half is installing the Simplicity Studio component that implements it,
without which the configuration describes something the project has no code
for. The mapping from cluster to component is a package extension the
generation templates carry, so `--gen` is what makes it known.

Only Studio writes the project file, and the GUI asks it to over HTTP rather
than doing it itself. Given the port of that server and the project the
configuration belongs to, an edit here asks the same way:

```bash
zap edit cluster enable light.zap --endpoint 1 --cluster "Color Control" \
  --gen gen-templates.json --studioHttpPort 8080 --ideProjectPath light.slcp
```

```
Enabled cluster Color Control (0x0300) server on endpoint 1
Studio component zigbee_color_control_server: installed
```

Creating an endpoint installs the components of every cluster its device types
switched on, since hooking cluster enable alone would miss most of what a
device type brings. Removal is more cautious than installation, and follows the
GUI: only when the data model asked for it, and only once no endpoint is left
using the cluster.

Asking for this and not getting it is refused rather than reported afterwards,
because the edit would otherwise save, install nothing, and look like it
worked:

```
⛔ Studio integration was requested, but nothing is answering on port 8080 (ECONNREFUSED)
Studio must be running with this project for --studioHttpPort to work.
Drop both options to edit the file without installing UC components.
```

Without those options there is nothing to install through, so an edit names
what it would have installed and leaves it at that:

```
Enabled cluster Color Control (0x0300) server on endpoint 1
UC component(s) not installed: zigbee_color_control_server
Add them with slc, or pass --studioHttpPort with --ideProjectPath to have Studio install them.
```

## Custom XML

A configuration can define clusters of its own in a ZCL XML file. In the GUI
that file is chosen on the Extensions page; here it is a package operation:

```bash
zap edit package add light.zap --xml my-clusters.xml
```

Loading it says what came in, because a file that defines nothing usable
otherwise looks exactly like one that worked:

```
Loaded custom XML my-clusters.xml: 1 cluster(s), 0 device type(s)
  cluster Sample Custom Cluster (0xFFF1FC20)
```

From then on its clusters behave like any other: they can be enabled on an
endpoint and their attributes, commands and events configured by name. The
package is written into the `.zap` file when the session is saved, so the next
run and the GUI both find it.

`zap edit package list` shows every package the configuration carries, and
`zap edit package remove --xml <file>` takes one back out. Removing is the one
that needs care: as in the GUI, the endpoint configuration that came from those
clusters goes with it, so the CLI counts what would be lost and refuses until
`--force` is passed.

```
⛔ my-clusters.xml defines 1 cluster(s) that this configuration uses
Removing it deletes their endpoint configuration, as it does in the GUI:
  endpoint 1: Sample Custom Cluster (0xFFF1FC20) server
  zap edit package remove light.zap --xml my-clusters.xml --force
```

### When the XML is not there

A `.zap` file records where its custom XML was, so a file that travels without
it — a fresh clone, a build agent, a moved directory — names an XML that cannot
be read. ZAP answers that by moving on: the package is dropped, or, when the
database happens to hold another custom XML, that one is used in its place. The
configuration is then built on a data model the file does not describe, and
saving writes the difference back.

So editing such a configuration is refused, and reading it is not:

```
⛔ light.zap names 1 custom XML package(s) this session does not have
  my-clusters.xml (no such file)
  /elsewhere/other.xml was loaded instead, though the file never names it
Saving would write that difference back into the file. Point it at the file:
  zap edit package add light.zap --xml <file.xml>
or drop the reference:
  zap edit package remove light.zap --xml my-clusters.xml
or pass --force to edit it as it loaded.
```

`zap edit info` and `zap edit package list` still work and say the same thing,
the listing marking each package `loaded`, `missing`, or `loaded, not named by
the file`.
