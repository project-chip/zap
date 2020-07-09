# How to make ZAP work on Windows 10

Make sure its always up to date and there are no changes that haven't been committed. Tip: git pull, git status & git stash are your friends

You must use Chocolately to make Zap work on Windows. Make sure to download the pkgconfiglite package

- choco install pkgconfiglite

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

---

References:

- https://github.com/fabricjs/fabric.js/issues/3611
- https://github.com/benjamind/delarre.docpad/blob/master/src/documents/posts/installing-node-canvas-for-windows.html.md
- https://chocolatey.org/packages/libjpeg-turbo#dependencies
