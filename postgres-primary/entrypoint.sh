#!/bin/sh

set -e

cp -f $SSL_CERT_FILE /var/lib/postgresql/server.crt
cp -f $SSL_KEY_FILE /var/lib/postgresql/server.key

chmod 600 /var/lib/postgresql/server.*
chown postgres:postgres /var/lib/postgresql/server.*

docker-entrypoint.sh "$@"