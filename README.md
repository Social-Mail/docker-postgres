# docker-postgres
Docker image with postgres installation with Certbot and WAL configuration. This docker image extends default postgres alpine image and 2 other images are part of this repository to setup backup/restore and ssl certificate installations.

## Features of this postgres image
1. Replication and SSL both are enabled with certbot integration to install SSL certificates
2. WAL archiving using s3 storage
3. Daily incremental backups using s3 storage

## Requirements
1. AWS Route 53 and S3
2. Ubuntu 24+
3. Docker
4. A domain name must be hosted in Route 53.

## Topology

Simple Primary with multiple Read Replica

# Installation of Primary Server
1. Create a folder structure as shown below
```
   pg
    +--pgdata (empty folder)
    +--certs (empty folder)
    +--pg-compose
        +-- docker-compose.yml
    +--var.env (environment variables)
```
2. pgdata folder is where all postgres data file will be stored. We recommend using host folder instead of docker volume to prevent accidental deletion or volume corruption.
3. Copy sample given in `deploy/primary/docker-compose.yml` file from this repository.
4. Copy sample `deploy/var.env` and replace corresponding values. Except `HOST_NAME` and AWS credentials, you can leave everything as it is. `HOST_NAME` must point to ip address or cname of machine you are setting it up.
5. AWS Credentials must have S3 object read/write/list permissions and DNS permissions as mentioned in https://certbot-dns-route53.readthedocs.io/en/stable/
6. Run `cd ./pg/pg-compose`
7. Run `sudo docker compose run -d`.

# Installation of Replica Server

Except for step 3 and 4, all steps are identical. Backup service is commented on replica, please make sure if you uncomment it
you must give different names to backup folders in `var.env`.

1. Create a folder structure as shown below
```
   pg
    +--pgdata (empty folder)
    +--certs (empty folder)
    +--pg-compose
        +-- docker-compose.yml
    +--var.env (environment variables)
```
2. pgdata folder is where all postgres data file will be stored. We recommend using host folder instead of docker volume to prevent accidental deletion or volume corruption.
3. Copy sample given in `deploy/replica/docker-compose.yml` file from this repository.
4. Copy sample `deploy/var.env` and replace corresponding values. Except `HOST_NAME` and AWS credentials, you can leave everything as it is. `HOST_NAME` must point to ip address or cname of machine you are setting it up.
5. AWS Credentials must have S3 object read/write/list permissions and DNS permissions as mentioned in https://certbot-dns-route53.readthedocs.io/en/stable/
6. Run `cd ./pg/pg-compose`
7. Run `sudo docker compose run -d`.

# Restore
Restore from backup requires 2 steps. `var.env` remains same as primary.

1. Create a folder structure as shown below
```
   pg
    +--pgdata (empty folder)
    +--certs (empty folder)
    +--restore-step-1
        +-- docker-compose.yml
    +--pg-compose
        +-- docker-compose.yml
    +--var.env (environment variables)
```
2. pgdata folder is where all postgres data file will be stored. We recommend using host folder instead of docker volume to prevent accidental deletion or volume corruption.
3. Copy samples `deploy/restore-step-1/docker-compose.yml` and `deploy/restore-step-2/docker-compose.yml` to `pg/pg-compose/docker-compose.yml`.
4. Make sure all values in `var.env` are correct.
5. Run `cd ./pg/restore-step-1`
6. Run `sudo docker compose run -d`.
   If for any reason restore fails, delete everything and retry again. Run step 8 only if step 6 succeeds.
7. Run `cd ./pg/pg-compose`
8. Run `sudo docker compose run -d`.
