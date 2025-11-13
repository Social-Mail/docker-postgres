#!/bin/bash

set -e

# Ensure proper ownership
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

export PGPASSWORD="$PG_REPLICATOR_PASSWORD"

# Wait until master is ready
echo "Waiting for master to be ready..."
until pg_isready -h $PG_MASTER -p 5432 -U $PG_REPLICATOR_USER; do
    echo "Still waiting for master..."
    sleep 2
done

# Initialize replica if needed
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Running base backup..."
    gosu postgres pg_basebackup -h $PG_MASTER -U $PG_REPLICATOR_USER -D "$PGDATA" -Fp -Xs -P -R
    chmod 700 "$PGDATA"
fi

cp -f "/etc/letsencrypt/live/$HOST_NAME/fullchain.pem" /var/lib/postgresql/server.crt
cp -f "/etc/letsencrypt/live/$HOST_NAME/privkey.pem" /var/lib/postgresql/server.key

chmod 600 /var/lib/postgresql/server.*
chown postgres:postgres /var/lib/postgresql/server.*


mkdir -p /db/wal/
mkdir -p /db/wal/archives/
chown -R postgres:postgres /db/wal
chown -R postgres:postgres /etc/postgresql/postgresql.conf
chown -R postgres:postgres /etc/postgresql/pg_hba.conf


docker-entrypoint.sh "$@"