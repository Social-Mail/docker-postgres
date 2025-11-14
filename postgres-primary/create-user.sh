#!/bin/sh

set -e

if [ ! "$PG_MODE" == "replica" ]; then

    psql -v ON_ERROR_STOP=1 -c "CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '$PG_REPLICATOR_PASSWORD';"

fi
