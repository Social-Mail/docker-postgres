#!/bin/sh
certbot \
    certonly \
    --cert-name \
    $CERT_NAME \
    -d \
    $DOMAIN_NAME \
    --dns-route53 \
    --non-interactive \
    --agree-tos \    