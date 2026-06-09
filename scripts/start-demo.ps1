param(
    [int] $Port = 4173
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$demoPath = Join-Path $repoRoot "demo"

if (-not (Test-Path $demoPath)) {
    throw "Demo directory not found: $demoPath"
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $python) {
    throw "Python was not found on PATH. Install Python or run a static file server against the demo directory."
}

Write-Host "Starting ArcadeIQ demo at http://localhost:$Port"
Write-Host "Press Ctrl+C to stop."

if ($python.Name -eq "py.exe" -or $python.Name -eq "py") {
    & $python.Source -m http.server $Port --directory $demoPath
} else {
    & $python.Source -m http.server $Port --directory $demoPath
}
