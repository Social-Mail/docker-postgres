FROM postgres:alpine

RUN apk add --no-cache gosu

VOLUME [ "/db/wal" ]

COPY ./postgresql.conf /etc/postgresql/postgresql.conf
COPY ./pg_hba.conf /etc/postgresql/pg_hba.conf

COPY ./create-user.sh /docker-entrypoint-initdb.d/

WORKDIR /app
COPY ./entrypoint.sh ./

RUN chmod +x ./entrypoint.sh
RUN chmod +x /docker-entrypoint-initdb.d/create-user.sh

ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD [ "postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]