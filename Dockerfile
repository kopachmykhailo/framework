# Stage 1: Builder - Install dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for this stage)
RUN npm ci

# Copy source code
COPY src ./src

# Stage 2: Production image - Runtime only
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy source code from builder
COPY src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "src/server.js"]
