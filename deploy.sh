#!/bin/bash

# Deployment Script for Super FC AI on Hostinger VPS

echo "Starting deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker could not be found. Please install Docker first."
    echo "Visit https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

# Check if Docker Compose is installed
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "Docker Compose could not be found. Please install Docker Compose first."
    echo "Visit https://docs.docker.com/compose/install/"
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo ".env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please edit the .env file with your actual API keys and database password."
    echo "Run: nano .env"
    exit 1
fi

# Pull latest changes (optional, if using git)
# git pull origin main

# Build and start containers
echo "Building and starting containers..."
$DOCKER_COMPOSE up -d --build

# Check if containers are running
if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    echo "App is running on port 3000."
    echo "You can access it at http://<YOUR_VPS_IP>:3000"
else
    echo "Deployment failed."
    exit 1
fi
