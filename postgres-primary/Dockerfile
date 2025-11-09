FROM postgres:alpine

VOLUME /db/wal

USER 0

ENV POSTGRES_INITDB_WALDIR=/db/wal

COPY ./primary.conf /etc/postgresql/postgresql.conf 

USER postgres
CMD [ "postgres -c config-file=/etc/postgresql/postgresql.conf" ]