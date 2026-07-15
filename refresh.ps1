#Requires -Version 5.1
<#
.SYNOPSIS
  ينضّف مشروع الـ Frontend ويعيد تثبيته من الصفر.

.USAGE
  .\refresh.ps1
  .\refresh.ps1 -SkipPull
#>
param(
  [switch]$SkipPull
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Remove-PathSafe([string]$Path) {
  if (Test-Path -LiteralPath $Path) {
    Write-Host "  remove: $Path"
    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ""
Write-Host "odoo-Gen-Front — Clean & Refresh" -ForegroundColor Green
Write-Host "Folder: $PSScriptRoot"

if (-not $SkipPull) {
  Write-Step "Updating from git (git pull)"
  if (Test-Path .git) {
    git pull --ff-only
    if ($LASTEXITCODE -ne 0) {
      Write-Host "WARNING: git pull failed. Continue with local clean/install..." -ForegroundColor Yellow
    }
  } else {
    Write-Host "Not a git repo — skip pull"
  }
}

Write-Step "Cleaning node_modules / build / caches"
Remove-PathSafe "node_modules"
Remove-PathSafe "dist"
Remove-PathSafe "dist-ssr"
Remove-PathSafe ".vite"
Remove-PathSafe "odoo-Gen-Front-master"

if (Test-Path "package-lock.json") {
  # keep lockfile — guarantees same versions for the whole team
  Write-Host "  keep: package-lock.json (shared versions)"
}

Write-Step "Checking npm"
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Host "ERROR: npm not found. Install Node.js LTS then retry." -ForegroundColor Red
  exit 1
}

$nodeVer = node -v
$npmVer = npm -v
Write-Host "  Node: $nodeVer | npm: $npmVer"

Write-Step "Installing dependencies (npm ci if lockfile exists)"
if (Test-Path "package-lock.json") {
  npm ci
  if ($LASTEXITCODE -ne 0) {
    Write-Host "npm ci failed — falling back to npm install" -ForegroundColor Yellow
    npm install
  }
} else {
  npm install
}

if ($LASTEXITCODE -ne 0) {
  throw "npm install failed"
}

Write-Host ""
Write-Host "DONE. Frontend is fresh." -ForegroundColor Green
Write-Host "Start with:"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "IMPORTANT for the fitzone diagram bug:" -ForegroundColor Yellow
Write-Host "  In the browser (F12 → Console) run once:"
Write-Host "  localStorage.removeItem('odoo_erd_schema'); location.reload();"
Write-Host ""
