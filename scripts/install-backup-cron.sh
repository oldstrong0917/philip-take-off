#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 3 * * *}"
LOG_FILE="${LOG_FILE:-$PROJECT_DIR/backups/backup.log}"

mkdir -p "$PROJECT_DIR/backups"

cron_cmd="cd $PROJECT_DIR && /usr/bin/env bash $PROJECT_DIR/scripts/backup-db.sh >> $LOG_FILE 2>&1"

echo "[cron] installing schedule: $CRON_SCHEDULE"
(crontab -l 2>/dev/null | grep -v "scripts/backup-db.sh"; echo "$CRON_SCHEDULE $cron_cmd") | crontab -

echo "[cron] installed"
crontab -l
