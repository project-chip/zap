# ZCL Demo Metafiles

This directory is the Silicon Labs Zigbee ZCL snapshot used when opening ZAP
standalone (`npm run zap` or the packaged executable) without an explicit
`--zcl` path.

It is intended to load without package errors or warnings. Unit tests that
need known-invalid metadata continue to use `zcl-builtin/silabs`.
