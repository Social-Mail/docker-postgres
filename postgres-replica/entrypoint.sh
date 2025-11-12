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

cp -f $SSL_CERT_FILE /var/lib/postgresql/server.crt
cp -f $SSL_KEY_FILE /var/lib/postgresql/server.key

chmod 600 /var/lib/postgresql/server.*
chown postgres:postgres /var/lib/postgresql/server.*

docker-entrypoint.sh "$@"