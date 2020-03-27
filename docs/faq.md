# Frequently Asked Questions

**Q: I get an error "sqlite3_node" not found or something like that.**

**A:** The root reason for this is a missmatch of some of these things:
  * your local global electron install
  * your project-wide electron install
  * your sqlite3 precompiled binding file
  * some of the other node modules versions

To fix this, run some combination of following commands (assuming electron version 8.0.1):
  * `npm install`
  * `npm install electron@8.0.1`
  * `npm install electron@8.0.1 -g`
  * `npm install node-abi@latest`
  * `./node_modules/.bin/electron-rebuild -w sqlite3 -p`

##

