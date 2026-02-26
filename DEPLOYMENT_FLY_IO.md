# Fly.io Deployment Guide

## Overview
This project is configured for production deployment on **Fly.io** with 100% containerized infrastructure.

## Architecture

### Server
- **Runtime**: Node.js 22 (Alpine Linux)
- **Framework**: Express.js
- **Database**: PostgreSQL (managed by Fly.io Postgres)
- **Build System**: Vite (for both frontend and server)

### Key Endpoints
- `http://localhost:3000/` - Frontend (React)
- `http://localhost:3000/api/*` - Backend API
- `http://localhost:3000/health` - Health check endpoint (Fly.io monitoring)
- `http://localhost:3000/api/health` - Detailed health check

## Removed Dependencies
The following **Netlify-specific** dependencies and files have been removed:

- ✅ Removed `serverless-http` package (Netlify-specific)
- ✅ Removed `netlify.toml` configuration
- ✅ Removed `netlify/functions/` directory

## Updated Files for Fly.io

### 1. **Dockerfile**
- Multi-stage build (builder → production)
- Uses Node.js 22 Alpine for minimal image size
- Includes Prisma Client generation
- Proper health check configuration
- Command: `node dist/server/production.mjs`

### 2. **fly.toml**
- Configured for Fly.io deployment
- HTTP health checks every 10 seconds
- HTTPS with automatic redirect
- Connection concurrency limits (soft: 100, hard: 1000)
- Graceful shutdown handling

### 3. **server/node-build.ts**
- Optimized production entry point
- Listens on `0.0.0.0:3000` (required for Fly.io)
- Graceful shutdown handlers for SIGTERM/SIGINT
- Error handling for uncaught exceptions
- Improved logging for debugging

### 4. **server/index.ts**
- Added lightweight `/health` endpoint
- Detailed `/api/health` endpoint
- CORS enabled for cross-origin requests
- Proper cache headers for static assets
- 10MB file upload limit

### 5. **vite.config.server.ts**
- Optimized for Node.js 22
- ES modules output format
- Proper external dependency configuration
- Source maps enabled for debugging

## Environment Variables

All sensitive configuration is handled via **Fly.io Secrets**:

```bash
# Required
DATABASE_URL=postgresql://user:password@hostname/database

# Optional
NODE_ENV=production
PORT=3000
PING_MESSAGE=pong
```

Set secrets using:
```bash
flyctl secrets set DATABASE_URL=postgresql://...
```

## Building & Deploying

### Local Development
```bash
npm install
npm run dev
```

### Production Build (Local)
```bash
npm run build       # Builds both client and server
npm run build:client # Client only
npm run build:server # Server only (outputs to dist/server/)
```

### Deploy to Fly.io
```bash
# First time setup
flyctl launch

# Deploy changes
flyctl deploy

# View logs
flyctl logs

# Monitor app
flyctl status
```

## Health Checks

Fly.io monitors application health via:

1. **HTTP Health Check** (`/health`)
   - Endpoint: `GET /health`
   - Response: JSON with status and timestamp
   - Interval: 10 seconds
   - Timeout: 5 seconds
   - Grace Period: 5 seconds

2. **Docker Health Check**
   - Configured in Dockerfile using `wget`
   - Verifies `http://localhost:3000/health`

## Performance Optimizations

1. **Static File Caching**
   - Assets (JS, CSS, images): Cache-Control: max-age=31536000 (1 year)
   - HTML/JSON: no-cache (always fresh)

2. **Prisma Configuration**
   - Generated during Docker build
   - Proper binary target for Alpine Linux

3. **Memory & CPU**
   - VM Size: `shared-cpu-1x`
   - Memory: 1024 MB
   - Auto-scaling enabled

## Troubleshooting

### Build Fails
```bash
# Check build logs
flyctl logs --vm-id=<id>

# Rebuild from scratch
flyctl deploy --build-only
```

### Database Connection Issues
```bash
# Verify DATABASE_URL secret
flyctl secrets list

# Check Fly Postgres status
flyctl postgres status
```

### App Not Starting
```bash
# Check health status
flyctl status

# View detailed logs
flyctl logs -a vitrii
```

## Database Migrations

```bash
# Run migrations locally before deployment
npx prisma migrate deploy

# After deployment, SSH into machine
flyctl ssh console

# Inside the machine, run migrations if needed
DATABASE_URL="..." npx prisma migrate deploy
```

## References

- [Fly.io Documentation](https://fly.io/docs/)
- [Node.js on Fly.io](https://fly.io/docs/reference/languages-and-frameworks/nodejs/)
- [Fly.io Postgres](https://fly.io/docs/postgres/)
