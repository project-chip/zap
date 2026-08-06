# `zap-cli edit` — QA Quick Start

A step-by-step guide to testing the `zap edit` command line from a built binary.
No ZAP knowledge needed. Follow the steps in order.

---

## 1. Get set up

Download and unzip the release package for your machine, for example
`zap-linux-x64.zip` or `zap-mac-arm64.zip`. Inside you will find two programs:

| Program   | What it is                                              |
| --------- | ------------------------------------------------------- |
| `zap`     | The window-based app (not what we are testing)          |
| `zap-cli` | The command line tool (**this is what we are testing**) |

Open a terminal in the unzipped folder.

**Check it runs:**

```bash
./zap-cli --version
```

On Windows use `zap-cli.exe` instead of `./zap-cli` in every command below.

You should see a version, a feature level, a date, and `Mode: binary`.

> If you see `Mode: source`, you are running from a source folder, not the
> release package. Note that in your bug report.

**One-time tip — use a scratch folder for settings.** Add this to every command
so your test runs never interfere with each other:

```bash
--stateDirectory ./qa-state
```

---

## 2. Your first command

Make a new Matter configuration file:

```bash
./zap-cli edit new mytest.zap --force --zcl matter --stateDirectory ./qa-state
```

**Expected:** it says it created an empty configuration and added endpoint 0
with the device type `MA-rootdevice`, then `Saved mytest.zap`.

`--zcl matter` means "use the Matter data model that came with this binary."
You can also use `--zcl zigbee`.

You do **not** need to pass `--gen`. When it is left out, the tool picks the
matching test templates automatically (`matter` → Matter test templates,
`zigbee` → Zigbee test templates). You can also write `--gen matter` or
`--gen zigbee` yourself if you want to be explicit.

**Check:** the file `mytest.zap` now exists in your folder.

---

## 3. Add a light

```bash
./zap-cli edit endpoint create mytest.zap --endpoint 1 --device-type MA-dimmablelight --zcl matter --stateDirectory ./qa-state
```

**Expected:** `Created endpoint 1 with device type(s) MA-dimmablelight (0x0101)`
and a line saying how many clusters the device type turned on.

See what you have:

```bash
./zap-cli edit endpoint list mytest.zap --zcl matter --stateDirectory ./qa-state
```

**Expected:** a table with endpoint `0` (MA-rootdevice) and endpoint `1`
(MA-dimmablelight).

---

## 4. Change a setting on the light

Set the light's brightness default to 42:

```bash
./zap-cli edit attribute set mytest.zap --endpoint 1 --cluster "Level Control" --attribute CurrentLevel --enabled --default 42 --zcl matter --stateDirectory ./qa-state
```

**Expected:** a line ending in `enabled, default=42`.

Confirm it stuck:

```bash
./zap-cli edit attribute list mytest.zap --endpoint 1 --cluster "Level Control" --enabled-only --zcl matter --stateDirectory ./qa-state
```

**Expected:** a table where `CurrentLevel` shows `42` in the DEFAULT column.

---

## 5. Turn on an event

Add a door lock, then turn on one of its events:

```bash
./zap-cli edit endpoint create mytest.zap --endpoint 2 --device-type MA-doorlock --zcl matter --stateDirectory ./qa-state

./zap-cli edit event enable mytest.zap --endpoint 2 --cluster "Door Lock" --event DoorLockAlarm --zcl matter --stateDirectory ./qa-state
```

**Expected:** `Enabled event DoorLockAlarm (0x00) on Door Lock of endpoint 2`.

Confirm:

```bash
./zap-cli edit event list mytest.zap --endpoint 2 --cluster "Door Lock" --enabled-only --zcl matter --stateDirectory ./qa-state
```

**Expected:** `DoorLockAlarm` listed with ENABLED `yes`.

---

## 6. Look at features

Features are optional chunks of behavior in a cluster.

```bash
./zap-cli edit feature list mytest.zap --endpoint 1 --cluster On/Off --zcl matter --stateDirectory ./qa-state
```

**Expected:** a table of features. `Lighting` (code `LT`) should show
ENABLED `yes` because a dimmable light requires it. The line above the table
shows a `featureMap` value.

---

## 7. Check the whole file

```bash
./zap-cli edit check mytest.zap --zcl matter --stateDirectory ./qa-state
```

**Expected:** a summary of errors and warnings. Some warnings are normal.
It should **not** crash or say the file cannot be read.

---

## 8. Make sure errors behave

Type a cluster name that does not exist:

```bash
./zap-cli edit cluster enable mytest.zap --endpoint 1 --cluster "Not A Real Cluster" --side server --zcl matter --stateDirectory ./qa-state
```

**Expected:** a clear `Unknown cluster` message, ideally suggesting close
matches. It should **not** crash with a stack trace, and it should **not**
silently succeed.

---

## Helpful tips

### Getting help without reading docs

`zap-cli edit help` is the fastest way to see everything available. It reads
nothing from disk, so it answers instantly.

```bash
./zap-cli edit help                     # every operation, one line each
./zap-cli edit help attribute           # all attribute operations
./zap-cli edit help attribute set       # options for just this one
```

Standard `--help` works too:

```bash
./zap-cli edit --help
./zap-cli edit endpoint create --help
```

### Every command tells you what to do next

Most commands end with a `Next:` section containing commands you can copy and
paste directly. Use those when you are not sure what to try.

Turn them off with `--no-suggest` if they get noisy.

### Names are forgiving

These all mean the same cluster, so don't worry about exact punctuation:

```bash
--cluster "On/Off"
--cluster onoff
--cluster ON_OFF
--cluster 0x0006
```

### Useful flags to know

| Flag                            | What it does                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `--zcl matter` / `--zcl zigbee` | Pick the bundled data model (or pass a file path)                               |
| `--gen matter` / `--gen zigbee` | Pick the bundled test templates (optional; auto-picked from `--zcl` if omitted) |
| `--stateDirectory ./qa-state`   | Keeps settings in a scratch folder (recommended)                                |
| `--tempState`                   | Fresh throwaway settings for one command                                        |
| `--dry-run`                     | Show what would happen, change nothing                                          |
| `--quiet`                       | Less chatter                                                                    |
| `--format json`                 | Machine readable output                                                         |
| `--enabled-only`                | Only show things that are switched on                                           |
| `--no-suggest`                  | Hide the `Next:` suggestions                                                    |

### If a command feels slow

Each command loads the data model, so a few seconds each is normal. Reusing the
same `--stateDirectory` across commands is faster than `--tempState` every time.

### Where things get saved

- Your `.zap` file is saved where you told it to be.
- A `.zap~` backup of the previous contents sits next to it.
- Settings and the internal database live in your `--stateDirectory`.

---

## Suggested test ideas

Once the steps above pass, try breaking it. These are the areas most worth
poking at:

**Bad input**

- Misspell a device type (`MA-dimmablelite`) — is the error clear?
- Use an endpoint number that does not exist
- Point at a file that is not a `.zap` at all
- Use a `.zap` file from a different tool or an older version

**Numbers and edges**

- Set `CurrentLevel` to `0`, to `254`, to `999`, to `-1`, to `abc`
- Use a very large endpoint number
- Create two endpoints with the same number — is it refused?

**Composition (parent/child)**

- Create an endpoint with `--parent 1`, confirm it shows a parent
- Try deleting a parent that still has children — is it refused without `--force`?

**Repeat and undo**

- Run the exact same command twice — is the second run harmless?
- Enable a cluster, disable it, enable it again
- Set an attribute default, then set it to something else

**Both data models**

- Do the same flow with `--zcl zigbee` instead of `--zcl matter`
- Confirm Zigbee device type names (`HA-...`) work there

**File handling**

- Run against a read-only file or folder
- Use a path with spaces in it
- Use a relative path and an absolute path

**Output modes**

- Add `--format json` to a few commands; is the JSON valid?
- Add `--dry-run`; confirm the file is genuinely unchanged

---

## Reporting a problem

Include:

1. The **full command** you ran (copy and paste it)
2. What you **expected**
3. What you **saw** (copy and paste the whole output)
4. Output of `./zap-cli --version`
5. Your operating system
6. The `.zap` file if you can attach it

Two things are always worth flagging, even if the command "worked":

- A **stack trace** or raw error dump instead of a readable message
- A command that reports success but did **not** change the file
