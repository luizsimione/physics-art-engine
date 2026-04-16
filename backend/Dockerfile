FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy C++ simulation binary from simulation-engine
COPY --from=builder /app/../simulation-engine/sim ./simulation-engine/sim

# Create output directory
RUN mkdir -p ./output

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/main"]
