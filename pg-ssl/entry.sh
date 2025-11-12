#!/bin/sh

certbot \
    certonly \
    --staging \
    --cert-name \
    $CERT_NAME \
    -d \
    $DOMAIN_NAME \
    --dns-route53 \
    --non-interactive \
    --agree-tos \

crond -l 0 -f -c /etc/crontabs