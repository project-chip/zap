# Frequently Asked Questions

---

**Q: I get an error "sqlite3_node" not found or something like that.**

**A:** You need to rebuild your native sqlite3 bindings.

To fix this, run:

- `npm install`
- `./node_modules/.bin/electron-rebuild -w sqlite3 -p`
