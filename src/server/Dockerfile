FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 1800

CMD ["npm", "run", "dev"]
