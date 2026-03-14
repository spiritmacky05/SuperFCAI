# Deployment Guide for IONOS VPS (Ubuntu)

This guide provides step-by-step instructions to deploy the Super FC AI system on an IONOS Virtual Private Server (VPS) running Ubuntu.

## Prerequisites
- An IONOS VPS running Ubuntu (20.04 LTS or newer recommended).
- SSH access to your VPS.
- A registered domain name (optional but recommended for HTTPS).

## Step 1: Connect to your VPS
Open your terminal and connect to your IONOS VPS via SSH:
```bash
ssh root@<YOUR_VPS_IP_ADDRESS>
```

## Step 2: Transfer Files to VPS
You can clone your repository directly onto the VPS, or use `scp` / `rsync` to transfer the files from your local machine.

Example using git:
```bash
git clone <YOUR_REPOSITORY_URL> super-fc-ai
cd super-fc-ai
```

## Step 3: Run the Deployment Script
We have provided a deployment script (`deploy-ionos.sh`) that automates the installation of Node.js, PM2, and Nginx, as well as building the application.

Make the script executable and run it:
```bash
chmod +x deploy-ionos.sh
./deploy-ionos.sh
```

## Step 4: Configure Environment Variables
The deployment script will create a `.env` file if it doesn't exist. You need to edit it to add your API keys (e.g., OpenAI, PayMongo).

```bash
nano .env
```
Add your keys, save the file (`Ctrl+O`, `Enter`), and exit (`Ctrl+X`).

## Step 5: Start the Application with PM2
PM2 is a production process manager for Node.js. It will keep your app alive forever and reload it without downtime.

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
*Note: Run the command that `pm2 startup` outputs to ensure PM2 starts on boot.*

## Step 6: Configure Nginx Reverse Proxy (Optional but Recommended)
To serve your application on port 80 (HTTP) or 443 (HTTPS) instead of port 3000, configure Nginx as a reverse proxy.

1. Create a new Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/super-fc-ai
```

2. Add the following configuration (replace `your_domain.com` with your actual domain or VPS IP):
```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/super-fc-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Secure with SSL (Let's Encrypt)
If you have a domain name configured, you can easily secure your site with HTTPS using Certbot.

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```

## Maintenance
- **To view logs:** `pm2 logs super-fc-ai`
- **To restart the app:** `pm2 restart super-fc-ai`
- **To stop the app:** `pm2 stop super-fc-ai`
