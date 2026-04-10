FROM node:24

WORKDIR /app/src/server

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . .

RUN npm run docs:asyncapi:build

EXPOSE 1800
