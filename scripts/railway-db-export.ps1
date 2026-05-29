# Export local Docker Postgres to backups/fluff_backup.dump (UTF-8 safe, custom format)
# Run from FluffBackend root:
#   .\scripts\railway-db-export.ps1
#
# Do NOT use: pg_dump ... > backup.sql in PowerShell — it breaks Cyrillic on Windows.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Container = "app_auth_db"
$BackupDir = Join-Path $Root "backups"
$BackupFile = Join-Path $BackupDir "fluff_backup.dump"

Write-Host "==> Checking container $Container..."
$running = docker ps --filter "name=$Container" --format "{{.Names}}"
if (-not ($running -match $Container)) {
    Write-Host "Container not running. Starting postgres..."
    docker compose up -d postgres
    Start-Sleep -Seconds 5
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

Write-Host "==> pg_dump from local database app_auth (UTF-8)..."
docker exec -e PGCLIENTENCODING=UTF8 $Container `
    pg_dump -U postgres -d app_auth --encoding=UTF8 -F c -f /tmp/fluff_backup.dump
docker cp "${Container}:/tmp/fluff_backup.dump" $BackupFile
docker exec $Container rm -f /tmp/fluff_backup.dump

$Size = (Get-Item $BackupFile).Length
Write-Host "OK: $BackupFile"
Write-Host "Size: $Size bytes"
