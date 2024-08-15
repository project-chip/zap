# Install ZAP from Source on Windows

## Windows-specific Prerequisite Settings

### 1. Windows Powershell:

In desktop search bar, input `Windows Powershell` and run as administrator. Run all the following commands inside Powershell.

### 2. Chocolatey:

Install from https://chocolatey.org/install

Check if installed properly:

```
choco -v
```

Install pkgconfiglite package:

```
choco install pkgconfiglite
```

### 3. Install Node if you have not:

```
choco install nodejs-lts
```

\*the version has to be 18 to pass version check test, after install, check with `node -v`

\*if you install Node already, and fail some tests similar to `cannot find Node`, reinstall Node with chocolatey again

### 4. Follow the instruction page for other installation details

https://github.com/project-chip/zap/blob/master/docs/development-instructions.md

## Fix Possible Error

### 1. sqlite3

When running ZAP (eg. `npm run zap`), if you see an error about `sqlite3.node` in a pop up window, run:

```
npm rebuild sqlite3
```

### 2. electron-builder:

When doing npm install, in post-install, if there is an error on the following command, related to `electron-builder install-app-deps`, `npx electron-rebuild canvas failed` or `node-pre-gyp`, it is because the current `canvas` version is not compatible with Windows, and the installation error will not cause a failure in running ZAP. node-canvas is working on the solution now and the issue will be solved in near future.

```
"postinstall": "electron-builder install-app-deps && husky install && npm rebuild canvas --update-binary && npm run version-stamp"
```

## Fix Failed Tests

### 1. Exceed Timeout

If 'npm run test' fails due to `Exceeded timeout of 1500 ms for a test. Use jest.setTimeout(newTimeout) to increase the timeout value, if this is a long-running test.`, set the following environment variables to increase timeouts for all tests.

```
$env:ZAP_TEST_TIMEOUT = 50000000; $env:ZAP_TEST_TIMEOUT_SHORT = 50000000; $env:ZAP_TEST_TIMEOUT_MEDIUM = 50000000; $env:ZAP_TEST_TIMEOUT_LONG = 50000000
```

### 2. Test Suite failed to run (Canvas not found)

If 'npm run test' fails due to `Test suite failed to run. Cannot find module '../build/Release/canvas.node'` or `\zap\node_modules\canvas\build\Release\canvas.node is not a valid Win32 application.`, rebuild canvas:

```
npm rebuild canvas --update-binary
```

### 3. get index.html or other server issue

If `npm run test` fails due to `get index.html request failed with status code 404` in unit tests or having server connection issues in e2e-ci tests, run:

```
npm run build
```

### 4. Other

Check if node version is v18, and try to install it with Chocolatey

Also, you can check the faq doc for other known issues: https://github.com/project-chip/zap/blob/master/docs/faq.md
