FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN test -f .env || cp .env.example .env

EXPOSE 5001

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node server.js"]
