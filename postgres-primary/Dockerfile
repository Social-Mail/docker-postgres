FROM postgres:alpine
VOLUME [ "/db/wal" ]
COPY ./primary.conf /etc/postgresql/postgresql.conf
RUN mkdir -p /db/wal/
RUN mkdir -p /db/wal/archives/
RUN chown -R postgres:postgres /db/wal
RUN chown -R postgres:postgres /etc/postgresql/postgresql.conf
CMD [ "postgres", "-c", "config_file=/etc/postgresql/postgresql.conf" ] 