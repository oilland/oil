# ─────────────────────────────────────────────────────────────
#  Oil Shop — production/demo image
#  Works for BOTH PostgreSQL (docker-compose.yml) and SQLite
#  (docker-compose.demo.yml) — the entrypoint migrates + seeds.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:/tmp/prisma-build.db"
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Full node_modules so the entrypoint can run prisma CLI + tsx for seeding.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["/entrypoint.sh"]
