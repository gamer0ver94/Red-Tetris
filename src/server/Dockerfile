FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/ssl && \
    openssl req -x509 -newkey rsa:4096 -nodes -sha256 \
      -keyout /app/ssl/key.pem \
      -out /app/ssl/cert.pem \
      -days 365 \
      -subj "/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

COPY . .

ENV TLS_KEY_PATH=/app/ssl/key.pem
ENV TLS_CERT_PATH=/app/ssl/cert.pem

EXPOSE 1800

CMD ["npm", "run", "dev"]
