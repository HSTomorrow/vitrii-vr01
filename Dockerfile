# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy prisma schema early
COPY prisma ./prisma

# Generate Prisma Client with explicit schema location
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" \
    npx prisma generate --schema ./prisma/schema.prisma

# Copy remaining source files
COPY . .

# Build server and frontend
RUN npm run build:server && npm run build:client

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install OpenSSL for Prisma runtime compatibility and pnpm
RUN apk add --no-cache openssl libstdc++ && npm install -g pnpm

# Copy node_modules with all dependencies (includes Prisma binaries)
COPY --from=builder /app/node_modules ./node_modules

# Copy package files (needed for runtime)
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema (required for runtime)
COPY prisma ./prisma

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Environment setup for Fly.io
# Note: .env is in .gitignore - environment variables set via Fly.io secrets
ENV NODE_ENV=production

EXPOSE 3000

# Health check for Fly.io
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server using the built Node.js application
CMD ["node", "dist/server/production.mjs"]
