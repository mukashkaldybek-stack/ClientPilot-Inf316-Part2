# ===================================================
# Stage 1: Build Next.js Static Export
# ===================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy sources and configurations
COPY frontend/ ./frontend/
COPY tsconfig.json ./
COPY tailwind.config.cjs ./
COPY postcss.config.cjs ./
COPY next.config.mjs ./

# Build Next.js static export into /app/out
RUN npm run build:frontend

# ===================================================
# Stage 2: Build Hono Backend & Prisma Client
# ===================================================
FROM node:20-alpine AS server-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY server/ ./server/
COPY prisma/ ./prisma/
COPY .env.example ./.env

# Generate Prisma Client & compile Hono backend
RUN npx prisma generate
RUN npm run build:server

# ===================================================
# Stage 3: Production Runtime
# ===================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy static frontend export from Stage 1
COPY --from=frontend-builder /app/out ./out

# Copy compiled server & prisma artifacts from Stage 2
COPY --from=server-builder /app/dist ./dist
COPY --from=server-builder /app/prisma ./prisma
COPY --from=server-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose unified port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start unified server serving static export at / and API at /api/*
CMD ["node", "dist/server/index.js"]
