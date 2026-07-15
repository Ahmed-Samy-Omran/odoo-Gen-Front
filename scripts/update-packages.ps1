$ErrorActionPreference = 'Stop'

$packageJsonPath = Join-Path $PSScriptRoot '..\package.json'
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

$dependencies = @{}
if ($packageJson.dependencies) { $dependencies += $packageJson.dependencies }
if ($packageJson.devDependencies) { $dependencies += $packageJson.devDependencies }

$toInstall = @()
foreach ($entry in $dependencies.GetEnumerator()) {
    $name = $entry.Key
    $version = [string]$entry.Value
    if ([string]::IsNullOrWhiteSpace($version)) { continue }

    if ($version.StartsWith('^') -or $version.StartsWith('~') -or $version.StartsWith('>') -or $version.StartsWith('<')) {
        $toInstall += "$name@$version"
    } else {
        $toInstall += "$name@$version"
    }
}

if ($toInstall.Count -eq 0) {
    Write-Host 'No packages to install.'
    exit 0
}

Write-Host 'Installing packages with npm install --save-exact ...'

$packagesArg = $toInstall -join ' '
npm install --save-exact $packagesArg
