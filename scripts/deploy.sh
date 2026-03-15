#!/bin/bash
# SuperFCAI Zero-Downtime Deployment Script
# This script updates the code and restarts the container with minimal disruption.

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest changes from git..."
git pull origin refactored

# 2. Build the new image (does not stop existing containers)
echo "🏗️ Building new Docker images..."
docker compose build superfcai

# 3. Recreate the container in place
# --no-deps: only affects the specified service
# -d: run in background
echo "🔄 Swapping containers..."
docker compose up -d --no-deps superfcai

# 4. Cleanup old images to save disk space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete! The app was updated with minimal downtime."
