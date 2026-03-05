# Super FC AI - Deployment Guide

This guide explains how to deploy the Super FC AI application to your Hostinger VPS using Docker.

## Prerequisites

-   **VPS Access:** You have root access to your VPS.
    -   **IP:** `187.77.136.225`
    -   **User:** `root`
    -   **Password:** `bfpACS@12345` (Please change this immediately for security!)
-   **Docker & Docker Compose:** Installed on your VPS.

## Step 1: Connect to your VPS

Open your terminal (or PowerShell/Command Prompt) and run:

```bash
ssh root@187.77.136.225
```

Enter the password when prompted.

## Step 2: Install Docker (If not already installed)

If Docker is not installed, run the following commands:

```bash
# Update package index
apt-get update

# Install prerequisites
apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -

# Add Docker repository
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Install Docker CE
apt-get update
apt-get install -y docker-ce

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## Step 3: Upload Project Files

You can upload the project files using `scp` (Secure Copy) from your local machine to the VPS.

Run this command **from your local machine** (where the project files are located):

```bash
# Replace /path/to/project with the actual path to your project folder
scp -r /path/to/project root@187.77.136.225:/root/super-fc-ai
```

Alternatively, if you are using Git, you can clone the repository directly on the VPS:

```bash
git clone <your-repo-url> /root/super-fc-ai
```

## Step 4: Configure Environment Variables

1.  Navigate to the project directory on your VPS:
    ```bash
    cd /root/super-fc-ai
    ```

2.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```

3.  Edit the `.env` file:
    ```bash
    nano .env
    ```

4.  **Important:** Update the following variables:
    -   `POSTGRES_PASSWORD`: Set a strong password.
    -   `OPENAI_API_KEY`: Add your OpenAI API key.
    -   `PAYMONGO_SECRET_KEY`: Add your PayMongo Secret Key.
    -   `PAYMONGO_WEBHOOK_SECRET`: Add your PayMongo Webhook Secret.

    Press `Ctrl+X`, then `Y`, then `Enter` to save and exit.

## Step 5: Deploy with Docker

Run the deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually run:

```bash
docker-compose up -d --build
```

## Step 6: Verify Deployment

Check if the containers are running:

```bash
docker ps
```

You should see two containers: `super-fc-ai-app` and `super-fc-ai-db`.

Access your application at: `http://187.77.136.225:3000`

## Troubleshooting

-   **Logs:** To see application logs, run:
    ```bash
    docker-compose logs -f app
    ```
-   **Database Connection:** Ensure the `POSTGRES_PASSWORD` in `.env` matches what you set.
-   **Rebuild:** If you make changes to the code, rebuild the containers:
    ```bash
    docker-compose up -d --build
    ```
