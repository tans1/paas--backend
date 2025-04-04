FROM node:23-alpine3.20

WORKDIR /usr/src/app

RUN apk update && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    docker-cli \
    bash

RUN mkdir -p /usr/lib/docker/cli-plugins && \
    wget https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-linux-x86_64 -O \
    /usr/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/lib/docker/cli-plugins/docker-compose

COPY package*.json ./

RUN npm install --build-from-source

COPY . .

COPY .env .env.development .env.production ./

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "npx prisma migrate deploy && npm run start"]