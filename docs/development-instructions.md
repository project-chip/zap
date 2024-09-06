# Instructions

This section lists instructions for various things you might need to do in this repo.

This is a node.js application, so you need node environment installed. The best way is to simply download latest install of [node](https://nodejs.org/en/download/) and you will get node and npm. If you have an older version of node installed on your workstation, it may give you trouble, particularly if it's very old. So make sure you have latest node v16.x, v18.x or v20.x version, with the npm that comes with it available. Run `node --version` to check what version is picked up. v20.x is recommended.

Once you have a desired version of node, you can run:

**Install the dependencies:**

```bash
npm install
```

It is not uncommon to run into native library compilation problems at this point.
There are various `src-script/install-*` scripts for different platforms. Please refer to [FAQ](faq.md) for additional details of which script to run on different platforms and then rerun `npm install`.

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

**Build & Release for Windows / Mac universal binary on macOS:**

```npm run pack:win
   npm run pkg:win
   ls ./dist/
   npm run pack:cli:win

   npm run pack:mac
   npm run pkg:mac
   ls ./dist/
   npm run pack:cli:mac
```

**Build & Release for Linux:**

```npm run pack:linux
   npm run pkg:linux
   ls ./dist/
   npm run pack:cli:linux

   mv dist/zap-linux-amd64.deb dist/zap-linux-x64.deb
   mv dist/zap-linux-x86_64.rpm dist/zap-linux-x64.rpm
```
