#!/bin/sh

set -e

cp -f "/etc/letsencrypt/live/$HOST_NAME/fullchain.pem" /var/lib/postgresql/server.crt
cp -f "/etc/letsencrypt/live/$HOST_NAME/privkey.pem" /var/lib/postgresql/server.key

chmod 600 /var/lib/postgresql/server.*
chown postgres:postgres /var/lib/postgresql/server.*

mkdir -p /db/wal/
mkdir -p /db/wal/archives/
chown -R postgres:postgres /db/wal
chown -R postgres:postgres /etc/postgresql/postgresql.conf
chown -R postgres:postgres /etc/postgresql/pg_hba.conf

if [ -d "$PG_RESTORE" ]; then

    env PGDATA=$PGDATA exec "$PG_RESTORE/extract.sh"

fi

docker-entrypoint.sh "$@"