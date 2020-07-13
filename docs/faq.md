# Frequently Asked Questions

---

**Q: I get an error "sqlite3_node" not found or something like that.**

**A:** You need to rebuild your native sqlite3 bindings.

To fix this in most cases, run:

- `npm install`
- `./node_modules/.bin/electron-rebuild -w sqlite3 -p`

If it still doesn't get fixed, do:

- `rm -rf node_modules`
  and then try again the above commands.

Occasionally upgrading your `npm` also makes a difference:

- `npm install -g npm`

---

**Q: I get an error during `node install`, something related to `node-gyp` and missing local libraries, like `pixman`, etc.**

**A:** There are some native dependencies that you have to satisfy to compile non-prebuilt node binaries for some combination of platforms and versions. Npm on the cloud is constantly updating the list of provided binaries, so it's possible that you will pick them up just fine, but if you don't, this is the list, for example, of things that have to be installed on Fedora Linux to rebuild everything correctly during `npm install` phase:

```
sudo dnf install pixman-devel
sudo dnf install cairo-devel
sudo dnf install pango-devel
sudo dnf install libjpeg-devel
sudo dnf install giflib-devel
```

---

**Q: My development PC doesn't work with zap for whatever reason. Can I use a docker container?**

**A:** Yes you can. TBD.

---
