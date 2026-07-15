# Package update script

Run this script from PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\update-packages.ps1
```

It will install the versions declared in package.json without reinstalling packages that are already present in node_modules.
