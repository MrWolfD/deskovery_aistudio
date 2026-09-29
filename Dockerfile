# Multi-stage Dockerfile for lightweight production deployment

# Stage 1: Build Frontend and Server
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* bun.lock* ./

# Install all dependencies for build
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build Vite client and esbuild server
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package info and install only production dependencies
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled frontend and compiled server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Expose app port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
