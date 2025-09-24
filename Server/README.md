# MarketDirect Server

Minimal TypeScript Express REST API for MarketDirect. Purpose: a place to add backend endpoints that the Next.js frontend can call.

Quick start (from repo root):

```powershell
cd server; npm install; npm run dev
```

Environment variables

1. Copy `.env.example` to `.env` and edit if you need custom values:

```powershell
cp .env.example .env
# then edit .env with your editor
```

2. You can also set env vars directly when starting (PowerShell example):

```powershell
#$env:PORT=5000; $env:API_BASE=/v1; npm run dev
```

Build and run:

```powershell
cd server; npm install; npm run build; npm run start
```

Endpoints:
- GET /health — basic health check
- GET /api/echo?q=... — returns { echo: '...' }

Example API endpoints (default API base is `/api`):
- GET /api/futures/
- GET /api/futures/:symbol
- GET /api/stock/
- GET /api/stock/:symbol
