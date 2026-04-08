FROM node:22-alpine AS builder

WORKDIR /app
COPY . .

RUN npm install -g typescript@5 \
  && tsc -p tsconfig.json \
  && cp index.html dist/index.html

FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
