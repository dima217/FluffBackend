# Import backups/fluff_backup.dump to Railway PostgreSQL (UTF-8 safe)
# Run: .\scripts\railway-db-import.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

# Railway Postgres (edit password if changed)
$Host_ = "zephyr.proxy.rlwy.net"
$Port = "16150"
$User = "postgres"
$Db = "app_auth"
$Password = "postgres"

if (-not $Password) { Write-Error "Set `$Password at the top of this script (Railway PGPASSWORD)" }

$BackupFile = Join-Path $Root "backups\fluff_backup.dump"
if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup not found: $BackupFile. Run .\scripts\railway-db-export.ps1 first."
}

$PgEnv = @{
    PGPASSWORD       = $Password
    PGSSLMODE        = "disable"
    PGCLIENTENCODING = "UTF8"
    LANG             = "C.UTF-8"
}

function Invoke-DockerPg {
    param([string[]]$PgArgs)
    docker run --rm `
        -e PGPASSWORD=$($PgEnv.PGPASSWORD) `
        -e PGSSLMODE=$($PgEnv.PGSSLMODE) `
        -e PGCLIENTENCODING=$($PgEnv.PGCLIENTENCODING) `
        -e LANG=$($PgEnv.LANG) `
        postgres:16-alpine `
        @PgArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: psql/pg_restore (exit $LASTEXITCODE)"
    }
}

Write-Host "==> Target: $Host_`:$Port / $Db (UTF-8)"

Write-Host "==> Test connection..."
Invoke-DockerPg @("psql", "-h", $Host_, "-p", $Port, "-U", $User, "-d", $Db, "-c", "SHOW server_encoding;")

Write-Host "==> Reset public schema..."
Invoke-DockerPg @(
    "psql", "-h", $Host_, "-p", $Port, "-U", $User, "-d", $Db, "-v", "ON_ERROR_STOP=1",
    "-c", "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $User; GRANT ALL ON SCHEMA public TO public;"
)

Write-Host "==> pg_restore..."
docker run --rm `
    -v "${Root}/backups:/backups:ro" `
    -e PGPASSWORD=$($PgEnv.PGPASSWORD) `
    -e PGSSLMODE=$($PgEnv.PGSSLMODE) `
    -e PGCLIENTENCODING=$($PgEnv.PGCLIENTENCODING) `
    -e LANG=$($PgEnv.LANG) `
    postgres:16-alpine `
    pg_restore -h $Host_ -p $Port -U $User -d $Db --no-owner --no-acl --verbose /backups/fluff_backup.dump
if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed (exit $LASTEXITCODE)"
}

Write-Host "==> Verify Cyrillic sample..."
Invoke-DockerPg @("psql", "-h", $Host_, "-p", $Port, "-U", $User, "-d", $Db, "-c", "SELECT name FROM product LIMIT 3;")

Write-Host "OK: import finished."
