# Instructions

This section lists instructions for various things you might need to do in this repo.

**Install the dependencies:**

```bash
npm install
```

**Start the application:**

```bash
npm run zap
```

**Start the front-end in development mode:**

(Supports hot-code reloading, error reporting, etc.)

```bash
quasar dev -m electron
```

or

```
npm run electron-dev
```

**Environment variables:**

Following is the list of environment variables that zap tool honors:

- `ZAP_LOGLEVEL`: pino log level to start with. Default is 'warn'. You can use 'debug' or 'info', for example.
- `ZAP_TEMPSTATE`: If set to 1, then instead of .zap, a unique temporary state directory will be created.
- `ZAP_DIR`: Sets a state directory. Can be overriden by --stateDirectory option. If unset, default is: ~/.zap
- `ZAP_SKIP_POST_GENERATION`: If there is a defined post-generation action for zap, you can set this to variable to 1 to skip it.
- `ZAP_REUSE_INSTANCE`: If set to 1, default behavior of zap will be to reuse existing instance.
- `ZAP_CLEANUP_DELAY`: Amount of millisecons zap will wait for cleanups to perform. This is workaround for some SQLite bug. If unset, default is: 1500
- `JENKINS_HOME`: When this env variable is present, zap will assume Jenkins environment. That will assume ZAP_TEMPSTATE and ZAP_SKIP_POST_GENERATION to be 1 by default.

**Husky Git hooks:**

Zap repo is configured with husky git hooks, that perform some
pre-commit actions, formatting code, checking the obvious problems and similar. If you properly ran `npm install`, all these hooks should
be installed. You can make sure they are installed by running `npx husky install`. See `.husky/pre-commit` script to review the actions executed as a pre-commit hook.

**Format the files:**

Format staged files in Git to follow [prettier.io](https://prettier.io/) code format.

[For development, IDE integration can be found here.](https://prettier.io/docs/en/editors.html)

This command is called via pre-commit Git hook as well.

```bash
npm run format-code
```

**Lint the files:**

```bash
npm run lint
```

**Build the app for production:**

```bash
quasar build -m electron
```

or

```
npm run electron-build
```

**Run the unit tests:**

```bash
npm run test
```

**Regenerate the API documentation:**

```bash
npm run apidoc
```

**Customize the configuration:**

See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).
