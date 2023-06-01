# Packages you have to install on Windows to get source build to compile via npm install
# To run this PowerShell script, navigate to the root directory of ZAP repo in PowerShell and execute the following command:
# ./src-script/install-packages-windows

# install Chocolatey and related packages
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

choco install pkgconfiglite