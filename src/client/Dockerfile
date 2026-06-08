FROM node:24-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 1700
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "1700"]

FROM dev AS build
RUN npm run build

FROM nginx:stable-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
