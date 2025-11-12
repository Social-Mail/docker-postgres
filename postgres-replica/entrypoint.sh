#!/bin/bash

set -e

# Ensure proper ownership
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

# Wait until master is ready
echo "Waiting for master to be ready..."
until pg_isready -h $PG_MASTER -p 5432 -U $PG_REPLICATOR_USER; do
    echo "Still waiting for master..."
    sleep 2
done

# Initialize replica if needed
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Running base backup..."
    export PGPASSWORD="$PG_REPLICATOR_PASSWORD"
    gosu postgres pg_basebackup -h $PG_MASTER -U $PG_REPLICATOR_USER -D "$PGDATA" -Fp -Xs -P -R
    chmod 700 "$PGDATA"
fi

docker-entrypoint.sh "$@"