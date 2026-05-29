param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,

  [Parameter(Mandatory = $true)]
  [string]$RemoteUrl
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
  throw "Backup file not found: $BackupFile"
}

$BackupFile = (Resolve-Path $BackupFile).Path
$BackupDir = Split-Path -Parent $BackupFile
$BackupName = Split-Path -Leaf $BackupFile
$Extension = [System.IO.Path]::GetExtension($BackupFile).ToLowerInvariant()

Write-Host "Restoring $BackupFile to remote Postgres (UTF-8)..."

# Never pipe SQL via Get-Content on Windows — it corrupts Cyrillic.
# Always run pg_restore/psql -f inside Linux container.

$dockerEnv = @(
  "-e", "PGCLIENTENCODING=UTF8",
  "-e", "LANG=C.UTF-8",
  "-e", "PGSSLMODE=disable"
)

if ($Extension -eq ".dump") {
  docker run --rm @dockerEnv `
    -v "${BackupDir}:/backups:ro" `
    postgres:16-alpine `
    pg_restore -d $RemoteUrl --no-owner --no-acl --verbose "/backups/$BackupName"
} elseif ($Extension -eq ".sql") {
  docker run --rm @dockerEnv `
    -v "${BackupDir}:/backups:ro" `
    postgres:16-alpine `
    psql $RemoteUrl -v ON_ERROR_STOP=1 -f "/backups/$BackupName"
} else {
  throw "Unsupported backup format: $Extension. Use .dump (recommended) or .sql"
}

if ($LASTEXITCODE -ne 0) {
  throw "Restore failed (exit $LASTEXITCODE)"
}

Write-Host "Restore finished."
