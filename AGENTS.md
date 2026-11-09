# Notes for agents working on ZAP

Short orientation for the configuration commands (`zap endpoint list`, `zap new`), which are the part of this
repository most likely to be handed to an agent. Everything here is the sort of
thing that costs an hour to rediscover.

## What the configuration commands are

Everything the ZAP user interface can do to a `.zap` file, from a terminal.
The configuration engine in `src-electron/configuration/` is shared by the
CLI, the REST handlers behind the user interface, and post-load scripts; each
is a thin adapter over `configuration/index.js`. A test fails on a require
cycle, on an engine module reaching an interface, on SQL outside `query-*`,
and on the engine building a `zap` command line.

```
src-electron/configuration/
├── index.js               the boundary: createContext, execute, executeOperation, reads
├── runner.js              one operation plus shared-state reconciliation (the CLI's sequence)
├── operations/            one module per subject, each with its own `operations` table
│   ├── index.js           the registry; dotted name -> operation
│   ├── endpoint.js  device-type.js  cluster.js  attribute.js  command.js
│   ├── event.js  feature.js  package.js  config.js
│   ├── studio-components.js   UC components a cluster needs, when Studio is attached
│   └── listing.js             filters and follow-up steps for listings
├── session-edit.js        the write sequence shared with the user interface, and its rules
├── resolver.js            "On/Off", ON_OFF, 0x0006 and a database id all mean the same cluster
├── policy.js              what the data model fixes, and how to say so
├── shared-cluster-state.js
├── reads.js               plain reads for scripts
├── outcome.js             result(changed, messages, table, next, warnings); step(op, params)
└── errors.js              OperationError(message, hints, remedies)

src-electron/cli/          the command line adapter
├── cli-commands           entry point, yargs tree, the run loop
├── cli-spec               the entire command surface, as data
├── cli-help               renders that surface as a page or a schema
├── cli-session            load / mutate / save lifecycle
├── cli-script             the batch format
└── cli-output             tables, JSON, validation diffs, and steps as `zap ...` commands
```

Read [`docs/zap-cli.md`](docs/zap-cli.md) before changing any of it. It
summarizes the architecture, CLI workflow, operation model, and extension
points.

## Rules that hold the design together

- **Never write your own SQL, and never reimplement a REST handler.** Every
  operation goes through the same `query-*` modules `src-electron/rest/` uses.
  That is what makes a CLI edit indistinguishable from a click, and it is how
  the CLI gets the database triggers, the storage policy and the notifications
  for free.
- **Never branch on the name of a protocol.** Nothing tests for the string
  `matter` or `zigbee`. Whether cluster state is shared across endpoints comes
  from the `shareClusterStatesAcrossEndpoints` generator option; whether an
  attribute's storage is fixed comes from the attribute and from the pairs a
  `zcl.json` names. A multiprotocol file gets both behaviours, each on its own
  endpoints.
- **Refuse rather than pretend.** If an edit would not survive the next read,
  say so and name the command that would make it possible. ZAP re-applies the
  Matter storage and reporting policy on import, so writing against it looks
  like it worked and is gone by the next load.
- **Add an operation in `cli-spec.js` too.** The yargs tree and the machine
  readable schema are both generated from it; a test asserts the described
  operations are exactly the implemented ones.

## Compliance: two accounts, neither cached

Validation recomputes the specification requirements from the current state.
Notifications record what was observed: a provisional cluster in use, a command
whose response is missing, a device type that is no longer known.

Notifications are **never written into the `.zap` file**. They are raised by SQL
triggers in `zap-schema.sql` as states are written, and recomputed by the
importer and by `validate-all` as a file is read. So a CLI edit and a click
produce the same toolbar count when the file is next opened, and there is no
stored state to keep in step. Do not add a cached copy.

An edit reports only what it introduced; `zap check` reports everything.

## Traps

- **`node src-electron/main-process/main.js` does not run.** `util/args.js` uses
  `export function`, so Node loads it as ESM and the `require` calls throw. Use
  `npm run zap-cli -- endpoint list <file.zap>` (it builds the backend first), or drive
  `startup.startCli(argv, { printer, errorPrinter, logger })` from a jest test,
  which is how `test/cli.test.js` does it.
- **`checkElementConformance` composes a warning it does not always mean to
  show.** `displayWarning` is a separate field on the result. Print the message
  without consulting it and every successful enable claims to have failed.
- **Conformance can be absent, not just complex.** Much of the newer Matter data
  model declares a feature or element with no conformance at all. Treat that as
  `optional`; do not evaluate it as an expression.
- **`getAllParamValuePairArrayClauses` interpolates values into SQL.** A pair
  needs `type: 'text'` to be quoted, or any default that is not a bare number
  ends the statement early.
- **Device type conformance overrides cluster conformance for features.**
  Lighting is conditional on On/Off in general and mandatory on a Dimmable
  Light.

## Running things

```bash
npx jest test/cli.test.js --collectCoverage=false   # ~5 min, 65 tests
npx jest --collectCoverage=false                         # full suite, ~15 min
npm run lint
```

The pre-commit hook runs prettier, regenerates the API docs and runs eslint, so
commits take a few seconds. Test files matching `test/*.test.js` are picked up
automatically — remove any scratch driver before committing.
