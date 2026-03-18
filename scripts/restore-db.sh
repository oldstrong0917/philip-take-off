#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql|backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
COMPOSE_BIN="${COMPOSE_BIN:-docker compose}"
SERVICE_NAME="${SERVICE_NAME:-postgres}"
DB_NAME="${DB_NAME:-memorial_db}"
DB_USER="${DB_USER:-postgres}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "[restore] file not found: $BACKUP_FILE"
  exit 1
fi

echo "[restore] target database: $DB_NAME"
echo "[restore] source file: $BACKUP_FILE"
read -r -p "This will overwrite existing data. Continue? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
  echo "[restore] cancelled"
  exit 1
fi

echo "[restore] recreating database schema"
$COMPOSE_BIN exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | $COMPOSE_BIN exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME"
else
  $COMPOSE_BIN exec -T "$SERVICE_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

echo "[restore] done"
