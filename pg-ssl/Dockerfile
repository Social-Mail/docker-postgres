FROM alpine:latest

RUN apk add --no-cache certbot certbot-dns-route53

COPY ./crontab.txt /etc/crontabs/root

RUN chmod 0644 /etc/crontabs/root

WORKDIR /app
COPY ./entry.sh ./
COPY ./script.sh ./

RUN chmod +x ./entry.sh
RUN chmod +x ./script.sh

EXPOSE 80

ENTRYPOINT ["/app/entry.sh"]