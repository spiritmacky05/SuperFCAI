FROM node:20-alpine

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/package.json ./apps/backend/package.json

# Install all workspace dependencies
RUN npm ci

# Copy project files and build frontend assets
COPY . .
RUN npm run build -w @superfcai/frontend

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Backend serves API + built frontend static files in production mode
CMD ["npm", "run", "start", "-w", "@superfcai/backend"]
