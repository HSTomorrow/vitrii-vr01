# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Generate Prisma Client, build server and frontend
RUN DATABASE_URL="postgresql://user:password@localhost:5432/dummy" npx prisma generate && npm run build:server && npm run build:client

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy entire node_modules from builder (includes .prisma and @prisma)
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema
COPY prisma ./prisma

# Copy builds from builder (frontend and compiled server)
COPY --from=builder /app/dist ./dist

# Copy server code and entry point
COPY server ./server
COPY server.js .
COPY .env* ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]
