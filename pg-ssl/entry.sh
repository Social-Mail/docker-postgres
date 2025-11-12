#!/bin/sh

echo "Starting up"

./script.sh

crond -l 0 -f -c /etc/crontabs
