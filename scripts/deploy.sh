#!/bin/bash
# SuperFCAI Zero-Downtime Deployment Script
# This script updates the code and restarts the container with minimal disruption.

echo "🚀 Starting Deployment..."

# 1. Pull latest code from the refactor branch
echo "📥 Pulling latest changes from git (refactor branch)..."
CURRENT_BRANCH="refactor"
git checkout "$CURRENT_BRANCH" || { echo "❌ Failed to switch to branch $CURRENT_BRANCH"; exit 1; }
git pull origin "$CURRENT_BRANCH" --ff-only || {
    echo "⚠️ Git pull failed. This usually happens if the server history diverged."
    echo "💡 Try running: git reset --hard origin/$CURRENT_BRANCH"
    exit 1
}

# 2. Build the new image
echo "🏗️ Building new Docker images for $CURRENT_BRANCH..."
docker compose build superfcai

# 3. Recreate the container in place (Detached)
echo "🔄 Swapping containers..."
docker compose up -d --no-deps superfcai

# 4. Cleanup old images to save disk space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ App updated! Streaming logs now (Press Ctrl+C to stop viewing logs, the app will stay running)..."
docker compose logs -f superfcai --tail 50
