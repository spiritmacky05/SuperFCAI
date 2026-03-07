# Use Node.js 18 Slim as base image (Debian-based, better compatibility with native modules)
FROM node:18-slim

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Force development environment to ensure devDependencies are installed
ENV NODE_ENV=development

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend application
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV VITE_CJS_IGNORE_WARNING=true
RUN npm run build > build.log 2>&1 || (cat build.log && exit 1)

# Expose the port the app runs on
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
