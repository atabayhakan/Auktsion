# Auktsion v2.0 — Frontend Production Dockerfile
# Multi-stage: builder → nginx static serve

# =============================================================================
# STAGE 1: Builder (Vite build)
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files first (cache)
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment-specific config
ARG VITE_API_URL=https://auktsion.kg/api
ARG VITE_WS_URL=wss://auktsion.kg/ws
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Build production bundle
RUN npm run build

# =============================================================================
# STAGE 2: Nginx Static Serve (Production)
# =============================================================================
FROM nginx:alpine AS runtime

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]