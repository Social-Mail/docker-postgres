FROM postgres:alpine

RUN apk add --no-cache gosu

VOLUME [ "/db/wal" ]

COPY ./primary.conf /etc/postgresql/postgresql.conf
COPY ./create-user.sql /docker-entrypoint-initdb.d

RUN mkdir -p /db/wal/
RUN mkdir -p /db/wal/archives/
RUN chown -R postgres:postgres /db/wal
RUN chown -R postgres:postgres /etc/postgresql/postgresql.conf

WORKDIR /app
COPY ./entrypoint.sh ./
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD [ "postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]