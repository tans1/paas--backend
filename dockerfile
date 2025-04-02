FROM node:23-alpine3.20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

COPY .env .env.development .env.production ./

RUN npm run build

EXPOSE 3001

# Start the server using the production build
CMD ["npm", "run", "start:prod"]