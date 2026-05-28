#!/usr/bin/env bash
# Импорт backups/fluff_backup.dump в Railway PostgreSQL (Linux / macOS / Git Bash)
#
# export RAILWAY_DB_HOST=zephyr.proxy.rlwy.net
# export RAILWAY_DB_PORT=16150
# export RAILWAY_DB_USER=postgres
# export RAILWAY_DB_PASSWORD=<из Railway>
# export RAILWAY_DB_NAME=railway
#
# ./scripts/railway-db-import.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${RAILWAY_DB_HOST:-zephyr.proxy.rlwy.net}"
PORT="${RAILWAY_DB_PORT:-16150}"
USER="${RAILWAY_DB_USER:-postgres}"
DB="${RAILWAY_DB_NAME:-railway}"
BACKUP="$ROOT/backups/fluff_backup.dump"

if [[ -z "${RAILWAY_DB_PASSWORD:-}" ]]; then
  echo "ERROR: set RAILWAY_DB_PASSWORD" >&2
  exit 1
fi

if [[ ! -f "$BACKUP" ]]; then
  echo "ERROR: $BACKUP not found. Run ./scripts/railway-db-export.ps1 or pg_dump first." >&2
  exit 1
fi

export PGPASSWORD="$RAILWAY_DB_PASSWORD"
export PGSSLMODE=require

echo "==> Test connection..."
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -c "SELECT version();"

echo "==> Reset public schema..."
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -v ON_ERROR_STOP=1 <<SQL
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO $USER;
GRANT ALL ON SCHEMA public TO public;
SQL

echo "==> pg_restore..."
pg_restore -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" --no-owner --no-acl --verbose "$BACKUP"

echo "==> Tables:"
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -c "\dt"

echo "OK"
