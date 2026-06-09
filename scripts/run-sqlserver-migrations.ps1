param(
    [string] $Server = "localhost,1433",
    [string] $Database = "ArcadeIQ",
    [string] $User = "sa",
    [Parameter(Mandatory = $true)]
    [string] $Password,
    [string] $MigrationsPath = "migrations",
    [bool] $TrustServerCertificate = $true
)

$ErrorActionPreference = "Stop"

function Get-MigrationVersionParts {
    param([string] $FileName)

    if ($FileName -notmatch '^V([0-9.]+)__') {
        return @(999999)
    }

    return $Matches[1].Split('.') | ForEach-Object { [int] $_ }
}

function Get-MigrationSortKey {
    param($File)

    $parts = Get-MigrationVersionParts $File.Name
    $paddedParts = $parts | ForEach-Object { $_.ToString("D6") }
    return ($paddedParts -join ".") + "__" + $File.Name
}

$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    throw "sqlcmd was not found. Install the SQL Server command-line tools or run this script from an environment that has sqlcmd on PATH."
}

$resolvedMigrationsPath = Resolve-Path $MigrationsPath
$migrationFiles = Get-ChildItem -LiteralPath $resolvedMigrationsPath -Filter "V*.sql" |
    Sort-Object -Property @{ Expression = { Get-MigrationSortKey $_ }; Ascending = $true }

Write-Host "Running $($migrationFiles.Count) migrations against $Server / $Database"

foreach ($file in $migrationFiles) {
    Write-Host "Applying $($file.Name)"

    $args = @(
        "-S", $Server,
        "-d", $Database,
        "-U", $User,
        "-P", $Password,
        "-b",
        "-i", $file.FullName
    )

    if ($TrustServerCertificate) {
        $args += "-C"
    }

    & sqlcmd @args
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed: $($file.FullName)"
    }
}

Write-Host "Finished applying legacy SQL Server migrations."
