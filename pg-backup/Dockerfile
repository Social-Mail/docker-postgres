FROM node:lts-alpine AS builder

WORKDIR /app

COPY . .
RUN npm i
RUN npm install typescript -g
RUN tsc

FROM node:lts-alpine

RUN echo "@edge http://nl.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
    echo "@testing http://nl.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk update

RUN apk add --no-cache tini
RUN apk add --no-cache postgresql18-client@edge

WORKDIR /app
VOLUME [ "/cache" ]

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.js ./

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--", "npm", "run", "start"]