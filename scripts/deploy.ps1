<#
.SYNOPSIS
  PowerShell wrapper for building and deploying @atp/geometry and @atp/poser.

.DESCRIPTION
  Builds, tests, packs, links, or deploys the packages.

.EXAMPLE
  .\scripts\deploy.ps1 -Test -Pack
  .\scripts\deploy.ps1 -Link
  .\scripts\deploy.ps1 -CopyTo "P:\Utilities\poser-hair-maker"
#>

param(
    [switch]$Clean,
    [switch]$Test,
    [switch]$Pack,
    [switch]$Publish,
    [switch]$DryRun,
    [switch]$Link,
    [string]$CopyTo,
    [string]$Tag = "latest"
)

$scriptPath = Join-Path $PSScriptRoot "build-and-deploy.mjs"
$nodeArgs = @($scriptPath)

if ($Clean) { $nodeArgs += "--clean" }
if ($Test) { $nodeArgs += "--test" }
if ($Pack) { $nodeArgs += "--pack" }
if ($Publish) { $nodeArgs += "--publish" }
if ($DryRun) { $nodeArgs += "--dry-run" }
if ($Link) { $nodeArgs += "--link" }
if ($CopyTo) { $nodeArgs += "--copy-to"; $nodeArgs += $CopyTo }
if ($Tag) { $nodeArgs += "--tag"; $nodeArgs += $Tag }

node @nodeArgs
