#!/bin/sh

if [ "$CERTBOT_ENV" == "staging" ]; then

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

else

certbot \
    certonly \
    --cert-name \
    $CERT_NAME \
    -d \
    $DOMAIN_NAME \
    --dns-route53 \
    --non-interactive \
    --agree-tos \


fi