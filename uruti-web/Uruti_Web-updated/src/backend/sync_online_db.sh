#!/usr/bin/env bash
set -euo pipefail

# Full data sync helper: copies all tables (accounts, ventures, tracks, messages, etc.)
# from local Postgres to the online backend Postgres.
#
# Required env vars:
#   LOCAL_DATABASE_URL=postgresql://user:pass@host:5432/local_db
#   REMOTE_DATABASE_URL=postgresql://user:pass@host:5432/remote_db
#
# Optional:
#   DUMP_PATH=/tmp/uruti_full_dump.sql

: "${LOCAL_DATABASE_URL:?LOCAL_DATABASE_URL is required}"
: "${REMOTE_DATABASE_URL:?REMOTE_DATABASE_URL is required}"

DUMP_PATH="${DUMP_PATH:-/tmp/uruti_full_dump.sql}"

echo "[1/3] Dumping local database to ${DUMP_PATH} ..."
pg_dump \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --format=plain \
  --dbname="${LOCAL_DATABASE_URL}" \
  > "${DUMP_PATH}"

echo "[2/3] Restoring dump into remote database ..."
psql "${REMOTE_DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${DUMP_PATH}"

echo "[3/3] Sync complete."
