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
# This ensures Prisma reads binaryTargets from schema.prisma
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" \
    npx prisma generate --schema ./prisma/schema.prisma

# Copy remaining source files
COPY . .

# Build server and frontend
RUN npm run build:server && npm run build:client

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install OpenSSL for Prisma runtime compatibility
RUN apk add --no-cache openssl libstdc++

# Copy node_modules with all Prisma binaries
COPY --from=builder /app/node_modules ./node_modules

# Copy package files (needed for Prisma runtime)
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema (needed for Prisma runtime)
COPY prisma ./prisma

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY server.js ./
COPY .env* ./

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start server
CMD ["npx", "tsx", "server.js"]
