param(
    [int] $Port = 8000
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$venvPath = Join-Path $backendPath ".venv"
$pythonPath = Join-Path $venvPath "Scripts\python.exe"

Push-Location $backendPath
try {
    if (-not (Test-Path $pythonPath)) {
        python -m venv .venv
    }

    & $pythonPath -m pip install --upgrade pip
    & $pythonPath -m pip install -r requirements.txt
    & $pythonPath -m uvicorn app.main:app --reload --host 127.0.0.1 --port $Port
} finally {
    Pop-Location
}
