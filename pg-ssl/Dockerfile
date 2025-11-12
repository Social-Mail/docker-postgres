FROM alpine:latest
RUN apk add --no-cache certbot certbot-dns-route53
COPY ./crontab.txt /etc/crontabs/root
WORKDIR /app
COPY ./entry.sh ./
COPY ./script.sh ./
RUN chmod 0644 /etc/crontabs/root
ENTRYPOINT [ "/app/entry.sh"]
