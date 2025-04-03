FROM node:23-alpine3.20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN apk update && apk add bash
COPY . .

COPY .env .env.development .env.production ./

COPY wait-for-it.sh /usr/wait-for-it.sh
RUN chmod +x /usr/wait-for-it.sh

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "/usr/wait-for-it.sh postgres:5432 -- npx prisma migrate deploy && npm run start"]




