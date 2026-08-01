FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.server.json ./
COPY server ./server
RUN npm run build:api && cp -R server/database/migrations dist/server/database/migrations

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

USER node
EXPOSE 8787
CMD ["sh", "-c", "node dist/server/database/migrate.js && node dist/server/index.js"]
