# SuperFCAI DevOps & Maintenance Guide

This guide provides the "ins and outs" of the SuperFCAI infrastructure. It covers how to maintain, monitor, and update the application in a production environment.

## 🏗️ Architecture Overview

- **Frontend & Backend:** Bundled into a single Docker image (Node.js 20).
- **Reverse Proxy:** **Caddy** handles HTTPS, SSL certificates, and security headers.
- **Database:** **SQLite** (Single-file database) stored in a named Docker volume.
- **Persistence:** All uploads and data are stored in **Named Volumes** (`superfcai_data`, `superfcai_uploads`).

---

## 🚀 Deployment & Updates

### Standard Update

To pull latest code and rebuild the image:

```bash
npm run deploy
```

- **What it does:** Runs `git pull` followed by `docker compose up -d --build`. This is the most reliable way to update your code.

### Manual Rebuild (No Git Pull)

If you already pulled the code and just want to rebuild:

```bash
docker compose up -d --build
```

---

## 💾 Database & Backups

### Create a Manual Backup

Run this from the project root. It creates a timestamped `.bak` file in the `./backups` folder.

```bash
npm run backup
```

### Automatic Backups (Cron)

To run a backup every night at 2:00 AM, add this to your server's crontab:

```bash
0 2 * * * cd /path/to/SuperFCAI && npm run backup >> ./backups/backup.log 2>&1
```

### Accessing the Database Directly

If you need to run SQL queries inside the container:

```bash
docker exec -it superfcai sqlite3 /app/data/database.sqlite
```

---

## 🕵️ Monitoring & Logs

### View Application Logs

Check the last 100 lines and follow live updates:

```bash
docker compose logs -f superfcai --tail 100
```

### Check Service Status

See if the containers are "Up" and healthy:

```bash
docker compose ps
```

### Check Health Logs

```bash
docker inspect --format='{{json .State.Health}}' superfcai | jq
```

---

## 🛡️ Security & Environment

### Environment Variables

Environment variables are managed via the `.env` file in the root.

- **NEVER** commit `.env` to GitHub.
- If you change a variable in `.env`, you **must** restart the app for it to take effect:

```bash
npm run deploy
```

### SSL Certificates

Caddy manages these automatically. If you change your `DOMAIN` in `.env`, Caddy will automatically request a new SSL certificate from Let's Encrypt on the next launch.

---

## 🧹 Maintenance & Cleanup

### Clean Up Disk Space

Docker can accumulate old images over time. To clean up unused images and data:

```bash
docker system prune -f
```

### Resetting the App (WARNING: DATA LOSS)

To completely wipe all data and start over:

```bash
docker compose down -v
```

---

## 🧪 Testing & CI

Every push to **`production`** or **`test`** branches triggers a **GitHub Action**.

- Check the **Actions** tab on your GitHub repo to see if the build passed or failed.
- This ensures that code changes don't break the build before you deploy.

---

**Maintained by:** SuperFCAI DevOps Team
**Branch Strategy:** `production` (Live), `test` (Staging)
