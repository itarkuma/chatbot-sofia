# Etapa 1: builder
FROM node:21-alpine3.18 AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpm run build

# Etapa 2: deploy
FROM node:21-alpine3.18 AS deploy
WORKDIR /app

# Activar PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar dependencias de producción
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# Copiar build y assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets

# Crear tmp y sessions
RUN mkdir /app/tmp /app/sessions

# Exponer puerto
ARG PORT=3008
ENV PORT $PORT
EXPOSE $PORT

# Sesión de WhatsApp
ENV SESSION_PATH=/app/sessions/session.json

# Ejecutar app
CMD ["node", "dist/app.js"]
