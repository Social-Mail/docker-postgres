#!/bin/sh

if [ "$CERTBOT_ENV" == "staging" ]; then

    echo "Trying staging server"

    if [ "$CERTBOT_CHALLENGE" == "dns-01" ]; then

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
            --staging \
            --standalone \
            --cert-name \
            $HOST_NAME \
            -d \
            $HOST_NAME \
            --dns-route53 \
            --non-interactive \
            --agree-tos \

    fi

else

    if [ "$CERTBOT_CHALLENGE" == "dns-01" ]; then

        certbot \
            certonly \
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
            --standalone \
            --cert-name \
            $HOST_NAME \
            -d \
            $HOST_NAME \
            --dns-route53 \
            --non-interactive \
            --agree-tos \

    fi 


fi