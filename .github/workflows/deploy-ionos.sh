#!/bin/bash

# Deployment Script for Super FC AI on IONOS VPS (Ubuntu)

echo "Starting deployment preparation for IONOS VPS..."

# 1. Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v18 or higher) and npm
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed."
fi

# 3. Install PM2 globally for process management
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 is already installed."
fi

# 4. Install Nginx (optional, for reverse proxy)
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install -y nginx
else
    echo "Nginx is already installed."
fi

# 5. Install project dependencies
echo "Installing project dependencies..."
npm install

# 6. Build the project
echo "Building the project..."
npm run build

# 7. Setup .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ".env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please edit the .env file with your actual API keys."
    echo "Run: nano .env"
fi

echo ""
echo "========================================================"
echo "Deployment preparation complete!"
echo "To start the application with PM2, run:"
echo "pm2 start ecosystem.config.js"
echo "pm2 save"
echo "pm2 startup"
echo "========================================================"
