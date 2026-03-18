#!/usr/bin/env bash
set -euo pipefail

COMPOSE_BIN="${COMPOSE_BIN:-docker compose}"
SERVICE_NAME="${SERVICE_NAME:-postgres}"
DB_NAME="${DB_NAME:-memorial_db}"
DB_USER="${DB_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

timestamp="$(date +%F_%H%M%S)"
mkdir -p "$BACKUP_DIR"

dump_file="$BACKUP_DIR/memorial_db_${timestamp}.sql"
archive_file="${dump_file}.gz"

echo "[backup] creating dump: $dump_file"
$COMPOSE_BIN exec -T "$SERVICE_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$dump_file"

if [[ ! -s "$dump_file" ]]; then
  echo "[backup] dump is empty, aborting"
  rm -f "$dump_file"
  exit 1
fi

gzip -f "$dump_file"
echo "[backup] compressed: $archive_file"

echo "[backup] pruning files older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -type f -name 'memorial_db_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "[backup] done"
