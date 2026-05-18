FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile