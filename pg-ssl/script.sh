#!/bin/sh

if [ "$CERTBOT_ENV" == "staging" ]; then

certbot \
    certonly \
    --staging \
    --cert-name \
    $HOST_NAME \
    -d \
    $HOST_NAME \
    --dns-route53 \
    --non-interactive \
    --agree-tos \

else

certbot \
    certonly \
    --cert-name \
    $HOST_NAME \
    -d \
    $HOST_NAME \
    --dns-route53 \
    --non-interactive \
    --agree-tos \


fi