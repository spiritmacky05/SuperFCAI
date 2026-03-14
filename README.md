# Super FC AI

AI-powered Fire Code reference and inspection assistant for the Bureau of Fire Protection (BFP).

## Monorepo Structure

This project is now split into separate apps for clarity:

- `apps/frontend` → React + Vite client app
- `apps/backend` → Express + SQLite API server

## Prerequisites

- Node.js 18+
- npm 10+

## Setup

1. Install dependencies for all workspaces:

```bash
npm install
```

2. Create root environment file:

```bash
cp .env.example .env
```

3. Fill in required keys in `.env` (`GEMINI_API_KEY`, `PAYMONGO_*`, etc.).

## Run in Development

Run frontend + backend together:

```bash
npm run dev
```

Default ports:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

The frontend proxies `/api` calls to the backend.

## Production Commands

Build all apps:

```bash
npm run build
```

Start backend:

```bash
npm start
```

## Docker Deployment (Hostinger VPS via SSH)

This repo is now dockerized for VPS hosting.

Files:

- `Dockerfile`
- `docker-compose.yml`

### 1) SSH into VPS and install Docker

```bash
ssh root@YOUR_VPS_IP
```

Install Docker + Compose plugin (Ubuntu/Debian):

```bash
apt update && apt install -y docker.io docker-compose-plugin
systemctl enable --now docker
```

### 2) Upload/clone project and set env

```bash
git clone <YOUR_REPO_URL> superfcai
cd superfcai
cp .env.example .env
nano .env
```

Fill required keys (`GEMINI_API_KEY`, `PAYMONGO_*`, etc.).

Also set HTTPS values:

```env
DOMAIN=your-domain.com
TLS_EMAIL=you@your-domain.com
```

Make sure your domain A record points to the VPS public IP.

### 3) Build and run containers (App + HTTPS)

```bash
docker compose up -d --build
```

App will run on:

- `https://your-domain.com`

### 4) Operations

```bash
docker compose ps
docker compose logs -f
docker compose restart
docker compose pull && docker compose up -d --build
```

### Notes

- SQLite is persisted in a Docker volume (`superfcai_data`).
- DB file path inside container is `/app/data/database.sqlite`.

## Verify Database Persistence (Docker)

Run these checks after deployment:

1. Create a test user via API.
2. Restart containers.
3. Confirm user still exists.

Example:

```bash
curl -X POST https://your-domain.com/api/users \
	-H 'Content-Type: application/json' \
	-d '{"email":"db-check@example.com","name":"DB Check","role":"free","password":"test123"}'

docker compose restart

curl https://your-domain.com/api/users | grep db-check@example.com
```

If found after restart, persistence is working.

## Useful Workspace Commands

- Frontend only: `npm run dev:frontend`
- Backend only: `npm run dev:backend`
- Frontend build: `npm run build:frontend`
- Backend build check: `npm run build:backend`

## Deployment Guide

See `README-IONOS-DEPLOYMENT.md` for VPS deployment details.
