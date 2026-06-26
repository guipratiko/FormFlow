FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/
RUN npm run build && npx prisma generate

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY prisma ./prisma/
COPY scripts ./scripts/
RUN npx prisma generate
COPY --from=build /app/dist ./dist
COPY public-web ./public-web
EXPOSE 4341
CMD ["sh", "-c", "node scripts/prisma-migrate.mjs && node dist/main.js"]
