FROM node:lts-alpine AS builder

WORKDIR /app

COPY . .
RUN npm i
RUN npm install typescript -g
RUN tsc

FROM node:lts-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.js ./

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--", "npm", "run", "start"]