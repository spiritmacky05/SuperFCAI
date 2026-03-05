# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend application
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build --verbose

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
