param(
    [int] $Port = 8000
)

$ErrorActionPreference = "Stop"

function New-BackendVenv {
    $launchers = @(
        @{ Command = "py"; Args = @("-3.12") },
        @{ Command = "py"; Args = @("-3.11") },
        @{ Command = "py"; Args = @("-3.10") },
        @{ Command = "python"; Args = @() }
    )

    foreach ($launcher in $launchers) {
        if (-not (Get-Command $launcher.Command -ErrorAction SilentlyContinue)) {
            continue
        }

        $version = & $launcher.Command @($launcher.Args + @("-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")) 2>$null
        if ($LASTEXITCODE -ne 0) {
            continue
        }

        if ([version] $version -lt [version] "3.10") {
            continue
        }

        & $launcher.Command @($launcher.Args + @("-m", "venv", ".venv"))
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create backend virtual environment."
        }
        return
    }

    throw "Python 3.10 or newer is required. Install Python 3.12 or run 'py -3.12 -m venv backend\.venv'."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$venvPath = Join-Path $backendPath ".venv"
$pythonPath = Join-Path $venvPath "Scripts\python.exe"

Push-Location $backendPath
try {
    if (-not (Test-Path $pythonPath)) {
        New-BackendVenv
    }

    & $pythonPath -m pip install --upgrade pip
    & $pythonPath -m pip install -r requirements.txt
    & $pythonPath -m uvicorn app.main:app --reload --host 127.0.0.1 --port $Port
} finally {
    Pop-Location
}
