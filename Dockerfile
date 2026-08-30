# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instala servidor estático simples
RUN npm install -g serve

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.mjs /usr/local/bin/docker-entrypoint.mjs

EXPOSE 3000

# Usa healthcheck para garantir que a aplicação está respondendo
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["node", "/usr/local/bin/docker-entrypoint.mjs"]
