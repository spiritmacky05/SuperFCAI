# Super FC AI

This is an AI-powered Fire Code reference and inspection assistant for the Bureau of Fire Protection (BFP).

## Deployment Guide for IONOS VPS (Ubuntu)

Please refer to `README-IONOS-DEPLOYMENT.md` for complete step-by-step instructions on how to deploy this application to an IONOS VPS running Ubuntu.

### Quick Start (Local Development)

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your API keys (OpenAI, PayMongo, etc.).

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```
