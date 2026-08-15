FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Keep the browser on the same origin. Caddy proxies /api/* to Fastify so
# cookies and streaming responses keep the same production hostname.
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build:web

FROM caddy:2.10-alpine

COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/out /usr/share/caddy

EXPOSE 80 443
