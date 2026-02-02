# Simple Node.js Dockerfile for Railway
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .env.production .env

# Install ALL dependencies (including devDependencies for tsx)
RUN npm install

# Copy all necessary directories
COPY src ./src
COPY config ./config
COPY database ./database
COPY scripts ./scripts
COPY public ./public
COPY data ./data

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 12345

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:12345/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start server with tsx
CMD ["npx", "tsx", "src/api/server.ts"]
