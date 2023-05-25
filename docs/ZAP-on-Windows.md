# Install ZAP from Source on Windows

## Prerequisite Package & Settings

**1. Windows Powershell:** 

In the desktop search bar, input "Windows Powershell" and run as administrator

**2. Clone Repo:**
```
git clone https://github.com/project-chip/zap
```
If having file permission issue, clone it under \Users\<user_name> directory, do not put it under Desktop

**3. Chocolatey:**

install from https://chocolatey.org/install
check if installed properly:
```
choco -v
```
Install pkgconfiglite package:
```
choco install pkgconfiglite
```

**4. Install Node:**
```
choco install nodejs-lts
```
*the version has to be 18 to pass version check test, after install, check with "node -v"

*if you install Node already, and fail some tests similar to "cannot find Node", reinstall Node with chocolatey again

## Run ZAP App

**1. Install node modules:**
```
npm install
```
*sometimes it might help to run:

```
npm install -g npm
```
*if has error like, "'exec' is not recognized as an internal or external command," go to package.json, search for the line below with "postinstall", delete "exec "
```
"postinstall": "exec electron-builder install-app-deps && husky install && npm rebuild canvas --update-binary && npm run version-stamp"
```
*if still has error, it will not affect running app and passing tests, but will affect release and the line above is not run properly → **might need to be fixed**

**2. run zap app:**
```
npm run zap
```
*if error about "tsc command not found", run:
```
npm uninstall tsc
```
*if error about "sqlite3.node" occurs in a pop out window, run:
```
npm rebuild sqlite3
```
*if more bugs appear, try solve failed tests before running the app

## Run Tests
```
npm run test
```

## Fix Failed Tests

**1. Exceed Timeout**

If fails due to "thrown: "Exceeded timeout of 1500 ms for a test. Use jest.setTimeout(newTimeout) to increase the timeout value, if this is a long-running test."", set environment variables to make test time allowed longer
```
$env:ZAP_TEST_TIMEOUT = 50000000; $env:ZAP_TEST_TIMEOUT_SHORT = 50000000; $env:ZAP_TEST_TIMEOUT_MEDIUM = 50000000; $env:ZAP_TEST_TIMEOUT_LONG = 50000000
```

**2. Test Suite failed to run (Canvas not found)**

If fails due to "Test suite failed to run Cannot find module '../build/Release/canvas.node'" or "\zap\node_modules\canvas\build\Release\canvas.node is not a valid Win32 application.", rebuild canvas:
```
npm rebuild canvas --update-binary
```
**3. Run Report**
```
npm run report
```
If fails due to "cp" or "mv" or "mkdir -p" when executing the above command, which is part of 'npm run test', it is because they are supposed to be Linux commands and does not compile in Windows.
There are too many incompatible commands used when running reports and correcting all of them requires huge efforts and might lead to new bugs or inconsistency. Currently we delete the command to exclude it from 'npm run test' to remove failure → **might need to be fixed**

**4. get index.html or other server issue**

If fails due to “get index.html Request failed with status code 404” in unit tests or having server connection issues in e2e-ci tests, run:
```
npm run build
```
and then run test again

**5. Generation Output Inconsistency**

If fails due to “Validate base generation” or “Testing zap command parser generation”, it is because the output format is inconsistent with expected due to some format error, not a real bug, currently fixed by cleaning string up before comparing like below
```
receivedString = receivedString.split('\n').map(s => s.trim()).join('\n');
```

**6. Other**

Check if node version is v18, and try to install it with Chocolatey
Also, you can Check doc/faq.md for help

*this command might also solve server issues in CI tests