# Packages you have to install on Windows to get source build to compile via npm install.
# Under the zap repo directory, to run the script: ./src-script/install-packages-windows

Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

choco install pkgconfiglite