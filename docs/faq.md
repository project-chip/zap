# Frequently Asked Questions

**Q: How to make this work on Mac/Linux?**

**A:**

`npm install` is used to download all required dependency packages.

If you see errors related to `node-gyp` and missing local libraries, like `pixman`, etc, it means there are missing native dependencies to satisfy to compile non-prebuilt node binaries for some combination of platforms and versions. Npm on the cloud is constantly updating the list of provided binaries, so it's possible that you will pick them up just fine, but if you don't, these are instructions for different platforms:

**Fedora Core** with `dnf`:

```
dnf install pixman-devel cairo-devel pango-devel libjpeg-devel giflib-devel
```

or run script:

```
src-script/install-packages-fedora
```

**Ubuntu** with `apt-get`:

```
apt-get update
apt-get install --fix-missing libpixman-1-dev libcairo-dev libsdl-pango-dev libjpeg-dev libgif-dev
```

or run script:

```
src-script/install-packages-ubuntu
```

**OSX on a Mac** with Homebrew `brew`:

```
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

or run script:

```
src-script/install-packages-osx
```

---

**Q: How to make this work on Windows?**

**A:**

Make sure its always up to date and there are no changes that haven't been committed. Tip: git pull, git status & git stash are your friends

You must use Chocolately to make Zap work on Windows. Make sure to download the pkgconfiglite package

```
choco install pkgconfiglite
```

If you have issues with cairo, for exaple if you get an error about cairo.h': No such file or directory

1. Check if your computer is 32 or 64 bit
2. Depending on that, download the one that works for you from this site https://github.com/benjamind/delarre.docpad/blob/master/src/documents/posts/installing-node-canvas-for-windows.html.md
3. Create a folder on C called GTK if it doesn't already exist
4. Unzip the downloaded content into C:/GTK
5. Copy all the dll files from C:/GTK/bin to your node_modules/canvas/build/Release folder in your zap folder
6. Add C:/GTK to the path Environment Variable
   to do this go to System in Control Panel,

- Click on Advanced System Settings
- In the advanced tab click on Environment Variables
- In the section System Variables, find the PATH environment variable and select it.
- Click Edit and add C:/GTK to it
- If the PATH environment variable does not exist, click New

If jpeglib.h not found try:

1. On terminal run
   choco install libjpeg-turbo
2. Make sure its clean by using
   git clean -dxff and run npm install again
3. if no errors, just warning appear, try to use
   npm audit fix
4. if you can't run zap, go to file src-script/zap-start.js
5. Change
   const { spawn } = require('child_process')
   for
   const { spawn } = require('cross-spawn')
6. Run npm run zap

References:

- https://github.com/fabricjs/fabric.js/issues/3611
- https://github.com/benjamind/delarre.docpad/blob/master/src/documents/posts/installing-node-canvas-for-windows.html.md
- https://chocolatey.org/packages/libjpeg-turbo#dependencies

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

**Q: My development PC doesn't work with zap for whatever reason. Can I use a docker container?**

**A:** Yes you can. TBD.

---

**Q: How do I run ZAP inside VSCode?**

**A:** If you VSCode in your path enter the `zap` repo and type `code .`, this will open ZAP in VSCode. To run ZAP in debug mode simply select the ZAP workspace and click on the `Run` icon on the left hand toolbar. You will have a couple of options to choose from in order to run ZAP, choose `Node.js Debug Terminal`. This will open a terminal window from which you can enter `npm run zap`, this will attach the debugger and run ZAP as you would normally from the command line. Congratulations, you should now see ZAP running in the debugger, you can set breakpoints in VSCode as you would in any other IDE.

---

**Q: UI unit test fails with some errors around canvas not build for the right version of node. What do I do?**

**A:** Run: `npm rebuild canvas --update-binary`
