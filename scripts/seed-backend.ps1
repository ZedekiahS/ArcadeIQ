$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$pythonPath = Join-Path $backendPath ".venv\Scripts\python.exe"

if (-not (Test-Path $pythonPath)) {
    throw "Backend virtual environment not found. Run scripts/start-backend.ps1 once to create it."
}

Push-Location $backendPath
try {
    & $pythonPath -m alembic upgrade head
    & $pythonPath -m app.scripts.seed
} finally {
    Pop-Location
}
