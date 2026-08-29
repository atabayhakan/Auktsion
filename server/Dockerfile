# Auktsion v2.0 — Production Dockerfile for Node/Express Backend
# Multi-stage build: deps → build → runtime

# =============================================================================
# STAGE 1: Dependencies (cached layer)
# =============================================================================
FROM node:20-alpine AS deps

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

# Copy package files first for better cache
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --ignore-scripts

# =============================================================================
# STAGE 2: Build (TypeScript compilation)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install dev dependencies for build
RUN npm ci --include=dev

# Build TypeScript
RUN npm run build

# =============================================================================
# STAGE 3: Runtime (minimal, non-root)
# =============================================================================
FROM node:20-alpine AS runtime

# Install runtime dependencies: sqlite3, tini (init system), dumb-init alternative
RUN apk add --no-cache sqlite-libs tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs auktsion

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=auktsion:nodejs /app/dist ./dist
COPY --from=builder --chown=auktsion:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=auktsion:nodejs /app/package.json ./

# Create directories for data, uploads, logs with correct ownership
RUN mkdir -p /app/data /app/uploads/auctions /app/logs && \
    chown -R auktsion:nodejs /app/data /app/uploads /app/logs

# Switch to non-root user
USER auktsion

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:5000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Use tini as init (proper signal handling, zombie reaping)
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/index.js"]