#!/bin/sh

set -e

if [ "$PG_MODE" == "replica" ]; then
    pg_archivecleanup /var/pgdata/pg_wal $1
fi
