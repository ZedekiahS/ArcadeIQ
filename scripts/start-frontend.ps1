param(
    [int] $Port = 5173
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $repoRoot "frontend"

if (-not (Test-Path $frontendPath)) {
    throw "Frontend directory not found: $frontendPath"
}

Push-Location $frontendPath
try {
    if (-not (Test-Path "node_modules")) {
        npm install
    }

    npm run dev -- --host=127.0.0.1 --port=$Port
} finally {
    Pop-Location
}
