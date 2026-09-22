# ZCL Test Meta Repository

This directory contains **test** ZCL meta-files. Some files (for example
`demo.xml`) intentionally include invalid metadata so unit tests can assert
package errors and warnings.

Standalone ZAP (`npm run zap` and the packaged executable) does **not** use
this directory by default. Demo data lives in `zcl-builtin/silabs-demo`.

**IMPORTANT**: these files are NOT the root repository of the ZCL XML files. It is ONLY a test snapshot.

## License

The contents of this repository are licensed using the [Apache 2.0 license](LICENSE.txt)
