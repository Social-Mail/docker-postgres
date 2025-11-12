#!/bin/sh

echo "Starting up"

exec ./script.sh

crond -l 0 -f -c /etc/crontabs
