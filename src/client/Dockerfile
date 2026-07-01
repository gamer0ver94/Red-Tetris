FROM node:24-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "1700"]

FROM dev AS build
RUN npm run build

