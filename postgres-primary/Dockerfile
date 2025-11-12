FROM postgres:alpine
VOLUME [ "/db/wal" ]

COPY ./primary.conf /etc/postgresql/postgresql.conf
COPY ./pg_hba.conf /etc/postgresql/pg_hba.conf
COPY ./create-user.sh /docker-entrypoint-initdb.d/

RUN mkdir -p /db/wal/
RUN mkdir -p /db/wal/archives/
RUN chown -R postgres:postgres /db/wal
RUN chown -R postgres:postgres /etc/postgresql/postgresql.conf
RUN chown -R postgres:postgres /etc/postgresql/pg_hba.conf

WORKDIR /app
COPY ./entrypoint.sh ./
COPY ./pg_hba.conf ./
ENTRYPOINT [ "/app/entrypoint.sh" ]
CMD [ "postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]