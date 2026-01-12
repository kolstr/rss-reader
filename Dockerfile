# Use Node.js 22 slim image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy application files
COPY . .

# Build Tailwind CSS
RUN npm run build:css

# Remove devDependencies to reduce image size
RUN npm prune --production

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 6789

# Set environment variable
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/server.js"]
