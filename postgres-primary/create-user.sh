#!/bin/sh

set -e

psql -v ON_ERROR_STOP=1 <<-EOSQL
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '$PG_REPLICATOR_PASSWORD';
EOSQL

echo "host all replicator 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
