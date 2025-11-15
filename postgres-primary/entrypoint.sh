#!/bin/sh

set -e

cp -f "/etc/letsencrypt/live/$HOST_NAME/fullchain.pem" /var/lib/postgresql/server.crt
cp -f "/etc/letsencrypt/live/$HOST_NAME/privkey.pem" /var/lib/postgresql/server.key

chmod 600 /var/lib/postgresql/server.*
chown postgres:postgres /var/lib/postgresql/server.*

# Ensure proper ownership
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

mkdir -p /db/wal/
mkdir -p /db/wal/archives/
chown -R postgres:postgres /db/wal
chown -R postgres:postgres /etc/postgresql/postgresql.conf
chown -R postgres:postgres /etc/postgresql/pg_hba.conf

echo "$PG_BACKUP_STORAGE_S3_ENC_PASSWORD" > /app/.pwd
sha256sum /app/.pwd > /app/.pwd-hash
base64 /app/.pwd-hash > /app/.pwd-base64

if [ "$PG_MODE" == "replica" ]; then

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

else 

    if [ -f "$PG_RESTORE/restored.done" ]; then

        # mv $PG_RESTORE "$PG_RESTORE.done"
        echo "DB Restored"

    else

        if [ -d "$PG_RESTORE" ]; then

            "$PG_RESTORE/restore.sh"
            touch "$PGDATA/recovery.signal"
            touch "$PG_RESTORE/restored.done"

        fi
    fi
fi

docker-entrypoint.sh "$@"