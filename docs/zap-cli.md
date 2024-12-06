# ZAP CLI

The`zap-cli`is a command-line interface for key ZAP functionalities, enabling users to generate and manage ZCL artifacts, launch server instances, and more. `zap-cli`
is ideal for those who prefer the command line, need a lightweight alternative to the full UI or need to automate certain ZAP-related tasks.

Below is the detailed help output for the CLI:

---

```
    Usage: main.js <command> [options] ... [file.zap] ...

Commands:
  main.js generate       Generate ZCL artifacts.
  main.js selfCheck      Perform the self-check of the application.
  main.js analyze        Analyze the zap file without doing anything.
  main.js convert        Convert a zap or ISC file to latest zap file.
  main.js status         Query the status of a zap server.
  main.js server         Run zap in a server mode.
  main.js stop           Stop zap server if one is running.
  main.js new            If in client mode, start a new window on a main instance.
  main.js regenerateSdk  Perform full SDK regeneration.

Options:
  -p, --httpPort                      Port used for the HTTP server  [number] [default: 9070]
      --studioHttpPort                Port used for integration with Silicon Labs Simplicity Studio's internal HTTP server  [number] [default: -1]
  -i, --zapFile, --zap, --in          input .zap file to read in. You can also specify them without an option, directly.  [string] [default: null]
  -z, --zclProperties, --zcl          zcl.properties file to read in.  [array] [default: "/path/to/zap/zcl-builtin/silabs/zcl.json"]
      --sdk                           sdk.json file to read, for operations that act on whole SDK  [string] [default: null]
  -g, --generationTemplate, --gen     generation template metafile (gen-template.json) to read in.  [array] [default: null]
      --uiMode, --ui                  Mode of the UI to begin in. Options are: ZIGBEE  [string] [default: "zigbee"]
      --debugNavBar, --embed          Boolean for when you want to embed purely the ZCL parts of the ZAP tool  [boolean]
      --noUi                          Don't show the main window when starting.
      --noServer                      Don't run the http or IPC server. You should probably also specify -noUi with this.  [boolean] [default: false]
      --genResultFile                 If this option is present, then generate the result file.  [boolean] [default: false]
      --showUrl                       Print out the URL that an external browser should use.
  -o, --output, --out                 Specifying the output directory for generation or output file for conversion.  [string]
      --clearDb                       Clear out the database and start with a new file.  [string]
      --stateDirectory                Sets the state directory.  [default: "~/.zap"]
      --jenkins                       Assume jenkins environment, enables tempState and skipPostGeneration.  [boolean] [default: false]
      --tempState                     Use a unique temporary directory for state  [boolean] [default: false]
      --skipPostGeneration            If there is a defined post-generation action for zap, you can set this to variable to 1 to skip it.  [boolean] [default: false]
      --noZapFileLog                  When writing out the .zap files, don't include the log. Useful in unit testing, where timestamps otherwise cause diffs.  [boolean] [default: false]
      --cleanupDelay                  When shutting down zap, this provides a number of millisecons to wait for SQLite to perform cleanup. Default is: 1500  [number] [default: "1500"]
      --reuseZapInstance              When starting zap, should zap attempt to reuse an instance of previous zap already running.  [boolean] [default: false]
      --generationLog                 Whenever generation is performed, a record of it will be put into this file.  [string] [default: null]
      --saveFileFormat                Specify default save file format.  [number] [default: 2]
      --watchdogTimer                 In a server mode, how long of no-activity (in ms) shuts down the server.  [number] [default: 300000]
      --allowCors                     Sets the CORS policy to be enabled or disabled.  [boolean] [default: false]
      --postImportScript              Script to execute after data is loaded.  [string] [default: null]
      --noLoadingFailure              If you specify an invalid file for templates or zcl metafiles, zap will not fail, but will ignore it.  [boolean] [default: false]
      --appendGenerationSubdirectory  If you specify package option generator/appendDirectory it will be used as a appended directory to specified generation directory.  [boolean] [default: false]
      --packageMatch                  Determines how to associate with packages in zap file. 'strict' will cause loading to fail if specified package files are not found, 'fuzzy' will associate with similar packages, 'ignore' will ignore the packages in zap file.  [choices: "fuzzy", "strict", "ignore"] [default: "ignore"]
      --results                       Specifying the output YAML file to capture convert results.  [string]
      --disableDbCaching              Disable query caching when accessing database  [boolean]
      --noop                          If this flag is present, then conversion will not do anything, while reporting success.  [boolean]
      --version                       Show version number  [boolean]
  -h, -?, --help                      Show help  [boolean]

Environment variables:
  ZAP_LOGLEVEL: Sets the log level. If unset, then default is: warn.
  ZAP_TEMPSTATE: If set to 1, then instead of .zap, a unique temporary state directory will be created.
  ZAP_DIR: Sets a state directory. Can be overriden by --stateDirectory option. If unset, default is: ~/.zap
  ZAP_SKIP_POST_GENERATION: If there is a defined post-generation action for zap, you can set this to variable to 1 to skip it.
  ZAP_REUSE_INSTANCE: If set to 1, default behavior of zap will be to reuse existing instance.
  ZAP_CLEANUP_DELAY: Amount of millisecons zap will wait for cleanups to perform. This is workaround for some SQLite bug. If unset, default is: 1500
  ZAP_GENERATION_LOG: Points to a JSON file, which will be used to log every generation performed.
  JENKINS_HOME: When this env variable is present, zap will assume Jenkins environment. That will assume ZAP_TEMPSTATE and ZAP_SKIP_POST_GENERATION to be 1 by default.
  ZAP_SAVE_FILE_FORMAT: Overrides a default saved zap file format, 2. It should be an integer number 0 or greater. This only affects file saving.

For more information, see https://github.com/project-chip/zap/

```
